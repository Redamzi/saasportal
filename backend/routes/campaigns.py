from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.supabase_client import get_supabase_client
from services.google_maps_service import GoogleMapsService
import os

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

class CreateCampaignRequest(BaseModel):
    user_id: str
    name: str
    description: Optional[str] = ""
    type: str  # "lead_generation", "email_outreach", "cold_calling"

class CrawlRequest(BaseModel):
    campaign_id: str
    location: str
    radius: int = 5000
    keywords: str
    target_lead_count: int = 100
    min_rating: float = 0
    min_reviews: int = 0

@router.post("/create")
async def create_campaign(req: CreateCampaignRequest):
    try:
        supabase = get_supabase_client()

        result = supabase.table('campaigns').insert({
            'user_id': req.user_id,
            'name': req.name,
            'description': req.description,
            'type': req.type,
            'status': 'draft'
        }).execute()

        return {
            "success": True,
            "campaign": result.data[0]
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/list/{user_id}")
async def list_campaigns(user_id: str):
    try:
        supabase = get_supabase_client()

        result = supabase.table('campaigns')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .execute()

        return {"campaigns": result.data}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details with leads"""
    try:
        supabase = get_supabase_client()

        # Get campaign
        campaign_result = supabase.table('campaigns')\
            .select('*')\
            .eq('id', campaign_id)\
            .single()\
            .execute()

        if not campaign_result.data:
            raise HTTPException(404, "Campaign not found")

        campaign = campaign_result.data

        # Get leads for this campaign
        leads_result = supabase.table('leads')\
            .select('*')\
            .eq('campaign_id', campaign_id)\
            .order('created_at', desc=True)\
            .execute()

        return {
            "campaign": campaign,
            "leads": leads_result.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/crawl/start")
async def start_crawl(req: CrawlRequest):
    """Start lead crawling for a campaign"""
    try:
        supabase = get_supabase_client()
        google_maps = GoogleMapsService()

        # Get campaign to verify it exists
        campaign_result = supabase.table('campaigns')\
            .select('*')\
            .eq('id', req.campaign_id)\
            .single()\
            .execute()

        if not campaign_result.data:
            raise HTTPException(404, "Campaign not found")

        # Update campaign status to crawling
        supabase.table('campaigns')\
            .update({'status': 'crawling'})\
            .eq('id', req.campaign_id)\
            .execute()

        # Parse location (for now, use as-is, later we can geocode)
        # You should implement geocoding to get lat/lng from city name
        # For demo, using Munich coordinates
        latitude = 48.1351
        longitude = 11.5820

        # Search for places
        places = await google_maps.search_places(
            query=req.keywords,
            latitude=latitude,
            longitude=longitude,
            radius=req.radius
        )

        # Filter by rating and reviews
        filtered_places = [
            place for place in places
            if place.get('rating', 0) >= req.min_rating
            and place.get('user_ratings_total', 0) >= req.min_reviews
        ]

        # Limit to target count
        filtered_places = filtered_places[:req.target_lead_count]

        # Save leads to database
        leads_to_insert = []
        for place in filtered_places:
            leads_to_insert.append({
                'campaign_id': req.campaign_id,
                'name': place.get('name'),
                'address': place.get('vicinity'),
                'phone': place.get('formatted_phone_number'),
                'website': place.get('website'),
                'rating': place.get('rating'),
                'reviews_count': place.get('user_ratings_total'),
                'place_id': place.get('place_id'),
                'latitude': place.get('geometry', {}).get('location', {}).get('lat'),
                'longitude': place.get('geometry', {}).get('location', {}).get('lng'),
                'status': 'new'
            })

        if leads_to_insert:
            supabase.table('leads').insert(leads_to_insert).execute()

        # Update campaign with lead count and status to ready
        supabase.table('campaigns')\
            .update({
                'leads_count': len(leads_to_insert),
                'status': 'ready'
            })\
            .eq('id', req.campaign_id)\
            .execute()

        return {
            "success": True,
            "leads_found": len(leads_to_insert),
            "message": f"Found {len(leads_to_insert)} leads matching your criteria"
        }

    except HTTPException:
        raise
    except Exception as e:
        # Update campaign status to failed if crawl fails
        try:
            supabase = get_supabase_client()
            supabase.table('campaigns')\
                .update({'status': 'failed'})\
                .eq('id', req.campaign_id)\
                .execute()
        except:
            pass
        raise HTTPException(500, f"Crawl failed: {str(e)}")
