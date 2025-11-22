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
    """Start lead crawling for a campaign using Places API v1 + Geocoding"""
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

        # STEP 1: Geocode location to get coordinates
        try:
            latitude, longitude = await google_maps.geocode_location(req.location)
        except HTTPException as e:
            # Geocoding failed
            supabase.table('campaigns')\
                .update({'status': 'failed'})\
                .eq('id', req.campaign_id)\
                .execute()
            raise HTTPException(400, f"Could not find location '{req.location}'. Please check the city name.")

        # STEP 2: Search for places (try searchNearby first)
        places = []
        try:
            places = await google_maps.search_places(
                query=req.keywords,
                latitude=latitude,
                longitude=longitude,
                radius=req.radius
            )
        except Exception as e:
            print(f"searchNearby failed, trying text search: {e}")

        # STEP 3: Fallback to text search if no results
        if len(places) < 5:
            try:
                text_query = f"{req.keywords} in {req.location}"
                places = await google_maps.search_places_text(
                    query=text_query,
                    latitude=latitude,
                    longitude=longitude,
                    radius=req.radius
                )
            except Exception as e:
                print(f"Text search also failed: {e}")

        # STEP 4: Filter by rating and reviews
        filtered_places = [
            place for place in places
            if place.get('rating', 0) >= req.min_rating
            and place.get('user_ratings_total', 0) >= req.min_reviews
        ]

        # STEP 5: Calculate lead scores and sort
        for place in filtered_places:
            place['lead_score'] = google_maps.calculate_lead_score(place)

        # Sort by lead score (highest first)
        filtered_places.sort(key=lambda x: x.get('lead_score', 0), reverse=True)

        # Limit to target count
        filtered_places = filtered_places[:req.target_lead_count]

        # STEP 6: Save leads to database
        leads_to_insert = []
        for place in filtered_places:
            lead_data = {
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
                'lead_score': place.get('lead_score', 0),
                'status': 'new'
            }
            leads_to_insert.append(lead_data)

        saved_count = 0
        if leads_to_insert:
            try:
                result = supabase.table('leads').insert(leads_to_insert).execute()
                saved_count = len(result.data) if result.data else len(leads_to_insert)
            except Exception as e:
                # Handle duplicate entries
                print(f"Error inserting leads (may be duplicates): {e}")
                # Try inserting one by one to skip duplicates
                for lead in leads_to_insert:
                    try:
                        supabase.table('leads').insert(lead).execute()
                        saved_count += 1
                    except:
                        pass  # Skip duplicates

        # STEP 7: Update campaign with lead count and status to ready
        supabase.table('campaigns')\
            .update({
                'leads_count': saved_count,
                'status': 'ready'
            })\
            .eq('id', req.campaign_id)\
            .execute()

        return {
            "success": True,
            "leads_found": len(filtered_places),
            "leads_saved": saved_count,
            "message": f"Found {saved_count} leads for '{req.keywords}' in {req.location}"
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
