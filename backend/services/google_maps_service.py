"""
Google Maps Service
Handles interactions with Google Maps Places API
"""

import os
import httpx
from typing import Dict, List, Optional, Any
from fastapi import HTTPException


class GoogleMapsService:
    """Service for interacting with Google Maps Places API"""

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY environment variable is not set")

        # Use the OLD Places API endpoint that works reliably
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    async def search_places(
        self,
        query: str,
        latitude: float,
        longitude: float,
        radius: int = 5000,
        language: str = "de"
    ) -> List[Dict[str, Any]]:
        """
        Search for places using the Google Maps Places API (old version)

        Args:
            query: Search keyword
            latitude: Latitude of the search center
            longitude: Longitude of the search center
            radius: Search radius in meters (default: 5000)
            language: Language for results (default: 'de' for German)

        Returns:
            List of places with details
        """
        url = f"{self.base_url}/nearbysearch/json"

        params = {
            'location': f'{latitude},{longitude}',
            'radius': radius,
            'keyword': query,
            'key': self.api_key,
            'language': language
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()

                data = response.json()

                # Check for API errors
                if data.get('status') not in ['OK', 'ZERO_RESULTS']:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Google Places API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}"
                    )

                # Return the results
                return data.get('results', [])

        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error calling Google Places API: {str(e)}"
            )

    async def get_place_details(
        self,
        place_id: str,
        language: str = "de"
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific place

        Args:
            place_id: Google Place ID
            language: Language for results (default: 'de' for German)

        Returns:
            Place details
        """
        url = f"{self.base_url}/details/json"

        params = {
            'place_id': place_id,
            'key': self.api_key,
            'language': language
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()

                data = response.json()

                # Check for API errors
                if data.get('status') != 'OK':
                    raise HTTPException(
                        status_code=500,
                        detail=f"Google Places API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}"
                    )

                return data.get('result', {})

        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error calling Google Places API: {str(e)}"
            )


# Dependency injection
_google_maps_service: Optional[GoogleMapsService] = None


def get_google_maps_service() -> GoogleMapsService:
    """Get or create GoogleMapsService instance"""
    global _google_maps_service

    if _google_maps_service is None:
        _google_maps_service = GoogleMapsService()

    return _google_maps_service
