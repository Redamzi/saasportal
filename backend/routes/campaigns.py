from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime

from services.supabase_client import get_supabase_client
from services.outscraper_service import get_outscraper_service
from services.impressum_scraper import get_impressum_scraper

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

# Pydantic Models
class CampaignCreate(BaseModel):
    user_id: str
    name: str
    description: Optional[str] = None
    type: str

class CrawlRequest(BaseModel):
    campaign_id: str
    user_id: str
    location: str
    radius: int  # Not used by Outscraper, kept for compatibility
    keywords: str
    target_lead_count: int = 10
    min_rating: Optional[float] = 0
    min_reviews: Optional[int] = 0

# Background Task for Crawling with Outscraper
async def crawl_with_outscraper(campaign_id: str, user_id: str, request: CrawlRequest):
    supabase = get_supabase_client()
    
    # Update status to crawling
    supabase.table('campaigns').update({'status': 'crawling'}).eq('id', campaign_id).execute()
    
    try:
        print(f"🔍 Starting Outscraper crawl for campaign {campaign_id}")
        print(f"📍 Location: {request.location}, Keywords: {request.keywords}")
        print(f"🎯 Target: {request.target_lead_count} leads")

        # Get Outscraper service
        outscraper = get_outscraper_service()
        
        # Build search query
        query = f"{request.keywords} in {request.location}"
        
        # Search places with Outscraper
        places = outscraper.search_places(
            query=query,
            limit=request.target_lead_count
        )
        
        print(f"✅ Outscraper returned {len(places)} places")
        
        leads_added = 0
        
        # Process results
        for place in places:
            if leads_added >= request.target_lead_count:
                print(f"🎯 Reached target lead count: {request.target_lead_count}")
                break
            
            # Normalize place data
            normalized = outscraper.normalize_place_data(place)
            
            # Quality filter: Skip leads without essential data
            if not normalized.get('name'):
                print(f"⏭️  Skipping - no name")
                continue
            
            if not normalized.get('address') and not normalized.get('city'):
                print(f"⏭️  Skipping {normalized.get('name')} - no address")
                continue
            
            # Must have at least phone OR website OR email
            if not normalized.get('phone') and not normalized.get('website') and not normalized.get('email'):
                print(f"⏭️  Skipping {normalized.get('name')} - no contact info")
                continue
            
            # Filter by rating/reviews
            rating = normalized.get('rating') or 0
            reviews = normalized.get('reviews_count') or 0
            
            if rating < (request.min_rating or 0):
                print(f"⏭️  Skipping {normalized.get('name')} - rating too low ({rating})")
                continue
            
            if reviews < (request.min_reviews or 0):
                print(f"⏭️  Skipping {normalized.get('name')} - not enough reviews ({reviews})")
                continue
            
            # Check for duplicate place_id
            place_id = normalized.get('place_id')
            
            # Extract domain for deduplication
            website = normalized.get('website')
            domain = None
            if website:
                from urllib.parse import urlparse
                try:
                    domain = urlparse(website).netloc.replace('www.', '')
                except:
                    domain = None

            # 3-Tier Deduplication Check
            # Check if lead already exists for this user (Place ID, Domain, or Email)
            try:
                dup_check = supabase.rpc('check_duplicate_lead', {
                    'p_user_id': user_id,
                    'p_place_id': place_id,
                    'p_domain': domain,
                    'p_email': normalized.get('email')
                }).execute()
                
                if dup_check.data and dup_check.data[0]['is_duplicate']:
                    reason = dup_check.data[0]['duplicate_reason']
                    print(f"♻️  Skipping {normalized.get('name')} - Duplicate found by {reason}")
                    continue
            except Exception as e:
                print(f"⚠️  Deduplication check failed: {str(e)}")
                # Continue cautiously or skip? Let's skip to be safe
                continue
            
            # Insert Lead
            lead_data = {
                "user_id": user_id,
                "campaign_id": campaign_id,
                "company_name": normalized.get('name'),
                "city": normalized.get('city'),
                "phone": normalized.get('phone'),
                "website": normalized.get('website'),
                "email": normalized.get('email'),  # Email from Outscraper!
                "email_source": "outscraper" if normalized.get('email') else None,
                "email_verified": False,
                "lead_score": int((rating or 0) * 20),  # 5 stars = 100 score
                "status": "new",
                "metadata": {
                    "place_id": place_id,
                    "rating": rating,
                    "reviews": reviews,
                    "address": normalized.get('address'),
                    "latitude": normalized.get('latitude'),
                    "longitude": normalized.get('longitude'),
                    "category": normalized.get('category'),
                    "verified": normalized.get('verified'),
                    "source": "outscraper"
                }
            }
            
            email_info = f"(Email: {normalized.get('email')})" if normalized.get('email') else "(No email)"
            print(f"💾 Inserting lead: {normalized.get('name')} {email_info}")
            
            try:
                supabase.table('leads').insert(lead_data).execute()
                leads_added += 1
            except Exception as e:
                print(f"⚠️  Failed to insert lead {normalized.get('name')}: {str(e)}")
                continue
            
        print(f"✅ Crawling completed! Added {leads_added} leads")
        
        # ---------------------------------------------------------
        # DEEP SCRAPER INTEGRATION
        # ---------------------------------------------------------
        # Find leads from this campaign that have website but NO email
        # This includes leads we just added + potentially others in this campaign
        
        print("🔍 Checking for leads that need Deep Scraping...")
        
        leads_to_scrape_res = supabase.table('leads') \
            .select('id, website') \
            .eq('campaign_id', campaign_id) \
            .neq('website', None) \
            .is_('email', 'null') \
            .execute()
            
        leads_to_scrape = leads_to_scrape_res.data or []
        
        if leads_to_scrape:
            print(f"⚡ Found {len(leads_to_scrape)} leads with website but no email. Starting Deep Scraper...")
            
            # Extract URLs
            urls = [lead['website'] for lead in leads_to_scrape]
            
            # Get Scraper
            scraper = get_impressum_scraper()
            
            # Run batch scrape
            scrape_results = scraper.scrape_batch(urls, max_workers=5)
            
            found_count = 0
            
            # Update leads with results
            for result in scrape_results:
                if result['success'] and result.get('email'):
                    # Find which lead this belongs to (by website)
                    # Note: scraping might normalize URL, so we match loosely or by index if we kept order
                    # But scrape_batch returns list in same order? No, it uses futures.
                    # So we match by URL.
                    
                    # Update all leads with this website in this campaign
                    supabase.table('leads').update({
                        'email': result['email'],
                        'email_source': 'impressum_crawler',
                        'email_verified': result.get('verified', False),
                        'is_personal': result.get('is_personal', False)
                    }).eq('campaign_id', campaign_id).eq('website', result['url']).execute()
                    
                    # Also try matching by original URL if scraper modified it? 
                    # The scraper returns 'url' as the input URL usually.
                    
                    found_count += 1
                    print(f"📧 Deep Scraper found email for {result['url']}: {result['email']}")
            
            print(f"✅ Deep Scraper finished. Found {found_count} additional emails.")
        else:
            print("✨ All leads already have emails (or no websites). Skipping Deep Scraper.")
            
        # ---------------------------------------------------------
            
        # Update Campaign Status
        supabase.table('campaigns').update({
            'status': 'completed',
            'metadata': {
                'last_crawl_count': leads_added,
                'source': 'outscraper'
            }
        }).eq('id', campaign_id).execute()
        
        # Deduct credits for found leads
        if leads_added > 0:
            print(f"💳 Deducting {leads_added} credits")
            supabase.rpc('deduct_credits', {
                'p_user_id': user_id,
                'p_amount': leads_added,
                'p_description': f'Lead crawl for campaign {campaign_id}',
                'p_metadata': {'campaign_id': campaign_id, 'leads_count': leads_added, 'source': 'outscraper'}
            }).execute()

    except Exception as e:
        print(f"💥 Crawling failed: {str(e)}")
        import traceback
        traceback.print_exc()
        supabase.table('campaigns').update({
            'status': 'failed',
            'metadata': {'error': str(e)}
        }).eq('id', campaign_id).execute()



# Routes

@router.get("/list/{user_id}")
async def list_campaigns(user_id: str):
    try:
        supabase = get_supabase_client()
        
        # Get campaigns
        response = supabase.table('campaigns').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        campaigns = response.data or []
        
        # Enrich with lead counts
        for campaign in campaigns:
            try:
                count_res = supabase.table('leads').select('id', count='exact').eq('campaign_id', campaign['id']).execute()
                campaign['leads_count'] = count_res.count if count_res.count is not None else 0
            except Exception as e:
                print(f"Error counting leads for campaign {campaign.get('id')}: {str(e)}")
                campaign['leads_count'] = 0
            
        return {"campaigns": campaigns}
    except Exception as e:
        print(f"Error in list_campaigns: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaigns: {str(e)}")

@router.get("/{campaign_id}")
async def get_campaign_detail(campaign_id: str):
    try:
        supabase = get_supabase_client()
        
        # Get campaign
        campaign_res = supabase.table('campaigns').select('*').eq('id', campaign_id).single().execute()
        
        if not campaign_res.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        campaign = campaign_res.data
        
        # Get leads for this campaign
        leads_res = supabase.table('leads').select('*').eq('campaign_id', campaign_id).execute()
        leads = leads_res.data or []
        
        return {
            "campaign": campaign,
            "leads": leads
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_campaign_detail: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaign details: {str(e)}")

@router.post("/create")
async def create_campaign(campaign: CampaignCreate):
    supabase = get_supabase_client()
    
    data = {
        "user_id": campaign.user_id,
        "name": campaign.name,
        "description": campaign.description,
        "type": campaign.type,
        "status": "draft"
    }
    
    response = supabase.table('campaigns').insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create campaign")
        
    return {"success": True, "campaign": response.data[0]}

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    supabase = get_supabase_client()
    
    # RLS will handle permission check if we use auth headers, 
    # but here we rely on the service role client so we should be careful.
    # Ideally we pass the user_id to verify ownership or use the auth token.
    
    response = supabase.table('campaigns').delete().eq('id', campaign_id).execute()
    
    return {"success": True}

@router.post("/crawl/start")
async def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks):
    supabase = get_supabase_client()
    
    # Validate target lead count
    if request.target_lead_count < 10:
        raise HTTPException(status_code=400, detail="Minimum 10 leads required")
    
    if request.target_lead_count > 5000:
        raise HTTPException(status_code=400, detail="Maximum 5000 leads allowed")
    
    # Check credits balance
    try:
        user_res = supabase.table('profiles').select('credits_balance').eq('id', request.user_id).single().execute()
        
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_credits = user_res.data.get('credits_balance', 0)
        
        # Check if user has enough credits (1 credit per lead)
        if current_credits < request.target_lead_count:
            raise HTTPException(
                status_code=402, 
                detail=f"Insufficient credits. You have {current_credits} credits but need {request.target_lead_count} credits. Please purchase more credits."
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking credits: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check credit balance")

    # Start background task with Outscraper
    background_tasks.add_task(crawl_with_outscraper, request.campaign_id, request.user_id, request)
    
    return {
        "success": True, 
        "message": "Crawling started in background", 
        "leads_found": 0 # Will be updated async
    }
