"""
Google Maps Service
Handles interactions with Google Maps Places API (NEW v1)
"""

import os
import httpx
from typing import Dict, List, Optional, Any
from fastapi import HTTPException


class GoogleMapsService:
    """Service for interacting with Google Maps Places API (NEW v1)"""

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY environment variable is not set")

        # Use the NEW Places API (v1)
        self.base_url = "https://places.googleapis.com/v1/places"

    async def search_places(
        self,
        query: str,
        latitude: float,
        longitude: float,
        radius: int = 5000,
        language: str = "de"
    ) -> List[Dict[str, Any]]:
        """
        Search for places using the NEW Google Maps Places API (v1)

        Args:
            query: Search keyword
            latitude: Latitude of the search center
            longitude: Longitude of the search center
            radius: Search radius in meters (default: 5000)
            language: Language for results (default: 'de' for German)

        Returns:
            List of places with details
        """
        url = f"{self.base_url}:searchNearby"

        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.api_key,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.location'
        }

        body = {
            "includedTypes": ["restaurant", "cafe", "bar", "bakery", "store", "shopping_mall", "hotel"],
            "maxResultCount": 20,
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": radius
                }
            },
            "languageCode": language
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=body, headers=headers, timeout=30.0)
                response.raise_for_status()

                data = response.json()

                # Convert new API format to old format for compatibility
                places = []
                for place in data.get('places', []):
                    places.append({
                        'place_id': place.get('id'),
                        'name': place.get('displayName', {}).get('text'),
                        'vicinity': place.get('formattedAddress'),
                        'formatted_phone_number': place.get('nationalPhoneNumber'),
                        'website': place.get('websiteUri'),
                        'rating': place.get('rating'),
                        'user_ratings_total': place.get('userRatingCount'),
                        'geometry': {
                            'location': {
                                'lat': place.get('location', {}).get('latitude'),
                                'lng': place.get('location', {}).get('longitude')
                            }
                        }
                    })

                return places

        except httpx.HTTPStatusError as e:
            # Try to get error details from response
            try:
                error_data = e.response.json()
                detail = error_data.get('error', {}).get('message', str(e))
            except:
                detail = str(e)

            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Google Places API error: {detail}"
            )
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
        Get detailed information about a specific place (NEW API v1)

        Args:
            place_id: Google Place ID
            language: Language for results (default: 'de' for German)

        Returns:
            Place details
        """
        url = f"{self.base_url}/{place_id}"

        headers = {
            'X-Goog-Api-Key': self.api_key,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,location,types,businessStatus'
        }

        params = {
            'languageCode': language
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params, timeout=30.0)
                response.raise_for_status()

                data = response.json()

                # Convert to old format for compatibility
                return {
                    'place_id': data.get('id'),
                    'name': data.get('displayName', {}).get('text'),
                    'formatted_address': data.get('formattedAddress'),
                    'formatted_phone_number': data.get('nationalPhoneNumber'),
                    'website': data.get('websiteUri'),
                    'rating': data.get('rating'),
                    'user_ratings_total': data.get('userRatingCount'),
                    'geometry': {
                        'location': {
                            'lat': data.get('location', {}).get('latitude'),
                            'lng': data.get('location', {}).get('longitude')
                        }
                    },
                    'types': data.get('types', []),
                    'business_status': data.get('businessStatus')
                }

        except httpx.HTTPStatusError as e:
            try:
                error_data = e.response.json()
                detail = error_data.get('error', {}).get('message', str(e))
            except:
                detail = str(e)

            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Google Places API error: {detail}"
            )
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
