from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from services.supabase_client import get_supabase_client
from services.impressum_scraper import get_impressum_scraper

router = APIRouter(prefix="/api/impressum", tags=["Impressum"])

# Pydantic Models
class CrawlRequest(BaseModel):
    website: str
    lead_id: Optional[str] = None

class BatchCrawlRequest(BaseModel):
    websites: List[str]
    campaign_id: Optional[str] = None


@router.post("/crawl")
async def crawl_single(request: CrawlRequest):
    """
    Crawl a single website for email addresses
    Synchronous endpoint for testing
    """
    supabase = get_supabase_client()
    scraper = get_impressum_scraper()
    
    try:
        # Extract domain
        domain = scraper.extract_domain(request.website)
        
        # Check cache first
        cache_res = supabase.table('impressum_cache').select('*').eq('domain', domain).execute()
        
        if cache_res.data:
            cached = cache_res.data[0]
            # Check if cache is still valid (90 days)
            crawled_at = datetime.fromisoformat(cached['crawled_at'].replace('Z', '+00:00'))
            if datetime.now(crawled_at.tzinfo) - crawled_at < timedelta(days=90):
                print(f"✅ Using cached result for {domain}")
                return {
                    "success": True,
                    "email": cached.get('email'),
                    "verified": cached.get('email_verified', False),
                    "cached": True,
                    "crawled_at": cached['crawled_at']
                }
        
        # Scrape website
        result = scraper.scrape_website(request.website)
        
        # Save to cache
        cache_data = {
            "domain": domain,
            "website": request.website,
            "email": result.get('email'),
            "email_verified": result.get('verified', False),
            "is_personal": result.get('is_personal', False),
            "all_emails": result.get('all_emails', []),
            "scraped_from": result.get('scraped_from'),
            "success": result['success'],
            "error_message": result.get('error')
        }
        
        # Upsert to cache
        supabase.table('impressum_cache').upsert(cache_data, on_conflict='domain').execute()
        
        # Update lead if lead_id provided
        if request.lead_id and result.get('email'):
            supabase.table('leads').update({
                'email': result['email'],
                'email_source': 'impressum_crawler',
                'email_verified': result.get('verified', False)
            }).eq('id', request.lead_id).execute()
        
        return {
            "success": result['success'],
            "email": result.get('email'),
            "verified": result.get('verified', False),
            "is_personal": result.get('is_personal', False),
            "cached": False,
            "error": result.get('error')
        }
        
    except Exception as e:
        print(f"💥 Error in crawl_single: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def crawl_batch_background(websites: List[str], campaign_id: Optional[str] = None):
    """Background task for batch crawling"""
    supabase = get_supabase_client()
    scraper = get_impressum_scraper()
    
    print(f"🔍 Starting batch crawl for {len(websites)} websites")
    
    results = scraper.scrape_batch(websites, delay=0.5)
    
    # Save results to cache and update leads
    for result in results:
        if not result['success']:
            continue
        
        domain = result['domain']
        
        # Save to cache
        cache_data = {
            "domain": domain,
            "website": result['url'],
            "email": result.get('email'),
            "email_verified": result.get('verified', False),
            "is_personal": result.get('is_personal', False),
            "all_emails": result.get('all_emails', []),
            "scraped_from": result.get('scraped_from'),
            "success": True
        }
        
        supabase.table('impressum_cache').upsert(cache_data, on_conflict='domain').execute()
        
        # Update leads with this website
        if result.get('email'):
            # Find leads with this website
            leads_res = supabase.table('leads').select('id').eq('website', result['url']).execute()
            
            if campaign_id:
                leads_res = supabase.table('leads').select('id').eq('website', result['url']).eq('campaign_id', campaign_id).execute()
            
            if leads_res.data:
                for lead in leads_res.data:
                    supabase.table('leads').update({
                        'email': result['email'],
                        'email_source': 'impressum_crawler',
                        'email_verified': result.get('verified', False)
                    }).eq('id', lead['id']).execute()
    
    print(f"✅ Batch crawl completed! Processed {len(results)} websites")


@router.post("/batch")
async def crawl_batch(request: BatchCrawlRequest, background_tasks: BackgroundTasks):
    """
    Crawl multiple websites in background
    Asynchronous endpoint for production
    """
    if not request.websites:
        raise HTTPException(status_code=400, detail="No websites provided")
    
    if len(request.websites) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 websites per batch")
    
    # Start background task
    background_tasks.add_task(crawl_batch_background, request.websites, request.campaign_id)
    
    return {
        "success": True,
        "message": f"Batch crawl started for {len(request.websites)} websites",
        "count": len(request.websites)
    }


@router.get("/cache/{domain}")
async def get_cache(domain: str):
    """Get cached result for a domain"""
    supabase = get_supabase_client()
    
    try:
        cache_res = supabase.table('impressum_cache').select('*').eq('domain', domain).execute()
        
        if not cache_res.data:
            raise HTTPException(status_code=404, detail="Domain not found in cache")
        
        cached = cache_res.data[0]
        
        # Check if cache is still valid (90 days)
        crawled_at = datetime.fromisoformat(cached['crawled_at'].replace('Z', '+00:00'))
        is_valid = datetime.now(crawled_at.tzinfo) - crawled_at < timedelta(days=90)
        
        return {
            "domain": cached['domain'],
            "email": cached.get('email'),
            "verified": cached.get('email_verified', False),
            "crawled_at": cached['crawled_at'],
            "is_valid": is_valid,
            "success": cached.get('success', False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Error in get_cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
