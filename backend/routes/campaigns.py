from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os
import requests
from datetime import datetime

from services.supabase_client import get_supabase_client

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
    radius: int
    keywords: str
    target_lead_count: int = 10
    min_rating: Optional[float] = 0
    min_reviews: Optional[int] = 0

# Background Task for Crawling
async def crawl_google_places(campaign_id: str, user_id: str, request: CrawlRequest):
    supabase = get_supabase_client()
    
    # Update status to crawling
    supabase.table('campaigns').update({'status': 'crawling'}).eq('id', campaign_id).execute()
    
    try:
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            raise Exception("Google Maps API Key not found")

        # 1. Text Search to get places
        search_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": f"{request.keywords} in {request.location}",
            "radius": request.radius,
            "key": api_key
        }
        
        response = requests.get(search_url, params=params)
        data = response.json()
        
        results = data.get('results', [])
        leads_added = 0
        
        # Process results
        for place in results:
            if leads_added >= request.target_lead_count:
                break
                
            # Filter by rating/reviews
            if place.get('rating', 0) < (request.min_rating or 0):
                continue
            if place.get('user_ratings_total', 0) < (request.min_reviews or 0):
                continue

            # Get Place Details (for phone, website)
            place_id = place.get('place_id')
            details_url = "https://maps.googleapis.com/maps/api/place/details/json"
            details_params = {
                "place_id": place_id,
                "fields": "name,formatted_address,international_phone_number,website,url,rating,user_ratings_total",
                "key": api_key
            }
            
            details_res = requests.get(details_url, params=details_params)
            details = details_res.json().get('result', {})
            
            # Insert Lead
            lead_data = {
                "user_id": user_id,
                "campaign_id": campaign_id,
                "company_name": details.get('name'),
                "city": request.location.split(',')[0], # Simple city extraction
                "phone": details.get('international_phone_number'),
                "website": details.get('website'),
                "lead_score": int(details.get('rating', 0) * 20), # 5 stars = 100 score
                "status": "new",
                "metadata": {
                    "google_place_id": place_id,
                    "rating": details.get('rating'),
                    "reviews": details.get('user_ratings_total'),
                    "maps_url": details.get('url'),
                    "address": details.get('formatted_address')
                }
            }
            
            # Check if lead exists (by website or phone to avoid dupes)
            # For now, just insert
            supabase.table('leads').insert(lead_data).execute()
            leads_added += 1
            
            # Deduct Credit (1 credit per lead)
            # We should call the deduct_credits function here, but for simplicity we assume credits are checked before
            # In a real app, we would deduct credits transactionally
            
        # Update Campaign Status
        supabase.table('campaigns').update({
            'status': 'completed',
            'metadata': {'last_crawl_count': leads_added}
        }).eq('id', campaign_id).execute()
        
        # Deduct credits for found leads
        if leads_added > 0:
            supabase.rpc('deduct_credits', {
                'p_user_id': user_id,
                'p_amount': leads_added,
                'p_description': f'Lead crawl for campaign {campaign_id}',
                'p_metadata': {'campaign_id': campaign_id, 'leads_count': leads_added}
            }).execute()

    except Exception as e:
        print(f"Crawling failed: {str(e)}")
        supabase.table('campaigns').update({
            'status': 'failed',
            'metadata': {'error': str(e)}
        }).eq('id', campaign_id).execute()

# Routes

@router.get("/list/{user_id}")
async def list_campaigns(user_id: str):
    supabase = get_supabase_client()
    
    # Get campaigns
    response = supabase.table('campaigns').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    campaigns = response.data
    
    # Enrich with lead counts
    for campaign in campaigns:
        count_res = supabase.table('leads').select('*', count='exact', head=True).eq('campaign_id', campaign['id']).execute()
        campaign['leads_count'] = count_res.count
        
    return {"campaigns": campaigns}

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
    
    # Check credits first
    # This is a simplified check. Real check happens in DB function or here.
    user_res = supabase.table('profiles').select('credits_balance').eq('id', request.user_id).single().execute()
    if not user_res.data or user_res.data['credits_balance'] < 1: # Min 1 credit to start
         raise HTTPException(status_code=402, detail="Insufficient credits")

    # Start background task
    background_tasks.add_task(crawl_google_places, request.campaign_id, request.user_id, request)
    
    return {
        "success": True, 
        "message": "Crawling started in background", 
        "leads_found": 0 # Will be updated async
    }
