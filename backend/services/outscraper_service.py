"""
Outscraper Service for Google Maps Scraping
Replaces Google Places API with Outscraper for better scalability
"""

from outscraper import ApiClient
import os
from typing import List, Dict, Optional

class OutscraperService:
    def __init__(self):
        self.api_key = os.getenv("OUTSCRAPER_API_KEY")
        if not self.api_key:
            raise ValueError("OUTSCRAPER_API_KEY not found in environment variables")
        
        self.client = ApiClient(api_key=self.api_key)
    
    def search_places(
        self,
        query: str,
        limit: int = 100,
        language: str = "de",
        region: str = "DE"
    ) -> List[Dict]:
        """
        Search for places using Outscraper Google Maps Scraper
        
        Args:
            query: Search query (e.g., "Restaurant in München")
            limit: Maximum number of results (10-5000)
            language: Language code (default: de)
            region: Region code (default: DE)
        
        Returns:
            List of place dictionaries with business information
        """
        try:
            print(f"🔍 Outscraper: Searching for '{query}' (limit: {limit})")
            
            # Call Outscraper API
            results = self.client.google_maps_search(
                query=[query],
                limit=limit,
                language=language,
                region=region,
                fields=[
                    'name',
                    'full_address', 
                    'borough',
                    'street',
                    'city',
                    'postal_code',
                    'country_code',
                    'country',
                    'us_state',
                    'state',
                    'plus_code',
                    'latitude',
                    'longitude',
                    'time_zone',
                    'popular_times',
                    'site',
                    'phone',
                    'type',
                    'subtypes',
                    'category',
                    'rating',
                    'reviews',
                    'reviews_data',
                    'photos_count',
                    'google_id',
                    'place_id',
                    'reviews_link',
                    'reviews_id',
                    'photo',
                    'street_view',
                    'working_hours',
                    'other_hours',
                    'business_status',
                    'about',
                    'range',
                    'posts',
                    'logo',
                    'description',
                    'verified',
                    'owner_id',
                    'owner_title',
                    'owner_link',
                    'reservation_links',
                    'booking_appointment_link',
                    'menu_link',
                    'order_links',
                    'location_link',
                    'emails'  # IMPORTANT: Email field
                ]
            )
            
            # Flatten results (Outscraper returns list of lists)
            places = []
            for result_set in results:
                if isinstance(result_set, list):
                    places.extend(result_set)
                else:
                    places.append(result_set)
            
            print(f"✅ Outscraper: Found {len(places)} places")
            return places
            
        except Exception as e:
            print(f"❌ Outscraper Error: {str(e)}")
            raise
    
    def extract_email(self, place: Dict) -> Optional[str]:
        """
        Extract email from Outscraper place data
        
        Args:
            place: Place dictionary from Outscraper
        
        Returns:
            Email address or None
        """
        # Outscraper can return emails as string or list
        emails = place.get('emails')
        
        if not emails:
            return None
        
        # If it's a list, take the first email
        if isinstance(emails, list):
            return emails[0] if emails else None
        
        # If it's a string, return it
        return emails if isinstance(emails, str) else None
    
    def normalize_place_data(self, place: Dict) -> Dict:
        """
        Normalize Outscraper place data to our internal format
        
        Args:
            place: Raw place data from Outscraper
        
        Returns:
            Normalized place dictionary
        """
        return {
            'place_id': place.get('place_id') or place.get('google_id'),
            'name': place.get('name'),
            'address': place.get('full_address'),
            'city': place.get('city') or place.get('borough'),
            'postal_code': place.get('postal_code'),
            'country': place.get('country'),
            'latitude': place.get('latitude'),
            'longitude': place.get('longitude'),
            'phone': place.get('phone'),
            'website': place.get('site'),
            'email': self.extract_email(place),
            'rating': place.get('rating'),
            'reviews_count': place.get('reviews'),
            'category': place.get('category'),
            'type': place.get('type'),
            'verified': place.get('verified', False),
            'business_status': place.get('business_status'),
            'working_hours': place.get('working_hours'),
            'raw_data': place  # Keep original data for reference
        }


# Singleton instance
_outscraper_service = None

def get_outscraper_service() -> OutscraperService:
    """Get or create Outscraper service instance"""
    global _outscraper_service
    if _outscraper_service is None:
        _outscraper_service = OutscraperService()
    return _outscraper_service
