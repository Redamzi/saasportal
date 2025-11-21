"""
Places API Routes
Handles endpoints for searching places using Google Maps
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from services import GoogleMapsService, get_google_maps_service


router = APIRouter(prefix="/places", tags=["places"])


class PlaceSearchRequest(BaseModel):
    """Request model for place search"""
    query: str = Field(..., description="Search keyword", min_length=1)
    latitude: float = Field(..., description="Latitude of search center", ge=-90, le=90)
    longitude: float = Field(..., description="Longitude of search center", ge=-180, le=180)
    radius: int = Field(5000, description="Search radius in meters", ge=1, le=50000)
    language: str = Field("de", description="Language code for results")


class PlaceSearchResponse(BaseModel):
    """Response model for place search"""
    status: str
    results: List[Dict[str, Any]]
    count: int


class PlaceDetailsResponse(BaseModel):
    """Response model for place details"""
    status: str
    result: Dict[str, Any]


@router.post("/search", response_model=PlaceSearchResponse)
async def search_places(
    request: PlaceSearchRequest,
    maps_service: GoogleMapsService = Depends(get_google_maps_service)
):
    """
    Search for places near a location

    This endpoint uses the Google Maps Places API (old version) to search for places
    based on a keyword near a specific location.

    Args:
        request: Search parameters including query, location, and radius
        maps_service: Google Maps service instance

    Returns:
        List of places matching the search criteria
    """
    try:
        results = await maps_service.search_places(
            query=request.query,
            latitude=request.latitude,
            longitude=request.longitude,
            radius=request.radius,
            language=request.language
        )

        return PlaceSearchResponse(
            status="success",
            results=results,
            count=len(results)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching places: {str(e)}"
        )


@router.get("/details/{place_id}", response_model=PlaceDetailsResponse)
async def get_place_details(
    place_id: str,
    language: str = Query("de", description="Language code for results"),
    maps_service: GoogleMapsService = Depends(get_google_maps_service)
):
    """
    Get detailed information about a specific place

    Args:
        place_id: Google Place ID
        language: Language code for results (default: 'de')
        maps_service: Google Maps service instance

    Returns:
        Detailed information about the place
    """
    try:
        result = await maps_service.get_place_details(
            place_id=place_id,
            language=language
        )

        return PlaceDetailsResponse(
            status="success",
            result=result
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting place details: {str(e)}"
        )


@router.get("/health")
async def places_health_check():
    """Health check for places API"""
    return {
        "status": "healthy",
        "service": "places-api",
        "api_version": "old"
    }
