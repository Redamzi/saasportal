"""
Google Maps Service
Handles interactions with Google Maps Places API (NEW v1) + Geocoding
"""

import os
import httpx
from typing import Dict, List, Optional, Any, Tuple
from fastapi import HTTPException


class GoogleMapsService:
    """Service for interacting with Google Maps Places API (NEW v1)"""

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY environment variable is not set")

        # Use the NEW Places API (v1)
        self.base_url = "https://places.googleapis.com/v1/places"
        self.geocoding_url = "https://maps.googleapis.com/maps/api/geocode/json"

    async def geocode_location(self, location: str) -> Tuple[float, float]:
        """
        Convert location string to lat/lng coordinates using Geocoding API

        Args:
            location: City name or address (e.g., "Munich", "Berlin, Germany")

        Returns:
            Tuple of (latitude, longitude)
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.geocoding_url,
                    params={'address': location, 'key': self.api_key},
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()

                if data.get('status') != 'OK':
                    raise HTTPException(
                        status_code=400,
                        detail=f"Geocoding failed: {data.get('status')} - Could not find location '{location}'"
                    )

                location_data = data['results'][0]['geometry']['location']
                return location_data['lat'], location_data['lng']

        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Geocoding API error: {str(e)}"
            )

    def map_keywords_to_types(self, keywords: str) -> List[str]:
        """
        Map German/English keywords to Google Place Types
        https://developers.google.com/maps/documentation/places/web-service/place-types
        """
        keyword_mapping = {
            'restaurant': ['restaurant'],
            'cafe': ['cafe'],
            'bar': ['bar', 'night_club'],
            'hotel': ['lodging'],
            'zahnarzt': ['dentist'],
            'arzt': ['doctor', 'hospital'],
            'apotheke': ['pharmacy'],
            'friseur': ['hair_care', 'beauty_salon'],
            'fitnessstudio': ['gym'],
            'supermarkt': ['supermarket'],
            'bäckerei': ['bakery'],
            'bank': ['bank'],
            'tankstelle': ['gas_station'],
            'autowerkstatt': ['car_repair'],
            'reinigung': ['laundry'],
            'anwalt': ['lawyer'],
            'steuerberater': ['accounting'],
            'immobilien': ['real_estate_agency'],
            'versicherung': ['insurance_agency'],
            'spa': ['spa', 'beauty_salon'],
            'kino': ['movie_theater'],
            'museum': ['museum'],
            'schule': ['school'],
        }

        types = []
        keywords_lower = keywords.lower()

        for keyword, place_types in keyword_mapping.items():
            if keyword in keywords_lower:
                types.extend(place_types)

        # Remove duplicates
        return list(set(types))

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
            query: Search keyword (will be mapped to place types)
            latitude: Latitude of the search center
            longitude: Longitude of the search center
            radius: Search radius in meters (default: 5000)
            language: Language for results (default: 'de' for German)

        Returns:
            List of places with details
        """
        # Map keywords to place types
        included_types = self.map_keywords_to_types(query)

        # If no specific types found, use general business types
        if not included_types:
            included_types = ["establishment", "point_of_interest"]

        url = f"{self.base_url}:searchNearby"

        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.api_key,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.location'
        }

        body = {
            "includedTypes": included_types,
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
                        'formatted_phone_number': place.get('nationalPhoneNumber') or place.get('internationalPhoneNumber'),
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

    async def search_places_text(
        self,
        query: str,
        latitude: float,
        longitude: float,
        radius: int = 5000,
        language: str = "de"
    ) -> List[Dict[str, Any]]:
        """
        Search for places using text query (fallback method)
        Uses searchText endpoint for free-form keyword search

        Args:
            query: Free-form text query
            latitude: Latitude for location bias
            longitude: Longitude for location bias
            radius: Bias radius in meters
            language: Language code

        Returns:
            List of places with details
        """
        url = f"{self.base_url}:searchText"

        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.api_key,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.location'
        }

        body = {
            "textQuery": query,
            "locationBias": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": radius
                }
            },
            "languageCode": language,
            "maxResultCount": 20
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=body, headers=headers, timeout=30.0)
                response.raise_for_status()

                data = response.json()

                # Convert to standard format
                places = []
                for place in data.get('places', []):
                    places.append({
                        'place_id': place.get('id'),
                        'name': place.get('displayName', {}).get('text'),
                        'vicinity': place.get('formattedAddress'),
                        'formatted_phone_number': place.get('nationalPhoneNumber') or place.get('internationalPhoneNumber'),
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
            try:
                error_data = e.response.json()
                detail = error_data.get('error', {}).get('message', str(e))
            except:
                detail = str(e)

            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Google Places Text Search error: {detail}"
            )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error calling Google Places Text Search: {str(e)}"
            )

    def calculate_lead_score(self, place: Dict[str, Any]) -> int:
        """
        Calculate lead score 0-100 based on rating and reviews

        Args:
            place: Place data dict

        Returns:
            Score from 0-100
        """
        rating = place.get('rating', 0)
        reviews = place.get('user_ratings_total', 0)

        score = 0
        # Rating contributes max 50 points (5 stars * 10)
        score += min(rating * 10, 50)
        # Reviews contribute max 50 points (500+ reviews = 50 points)
        score += min(reviews / 10, 50)

        return int(score)

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
