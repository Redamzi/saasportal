"""
Supabase Client Configuration for Voyanero Backend
Provides a singleton Supabase client with service role access
"""

from typing import Optional
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class SupabaseClient:
    """Singleton Supabase client with service role access"""

    _instance: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        """
        Get or create Supabase client instance

        Returns:
            Supabase Client instance with service role access

        Raises:
            ValueError: If SUPABASE_URL or SUPABASE_SERVICE_KEY is not set
        """
        if cls._instance is None:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

            if not supabase_url:
                raise ValueError(
                    "SUPABASE_URL environment variable is not set. "
                    "Please set it in your .env file."
                )

            if not supabase_key:
                raise ValueError(
                    "SUPABASE_SERVICE_KEY environment variable is not set. "
                    "Please set it in your .env file."
                )

            # Create client with service role key for backend operations
            cls._instance = create_client(supabase_url, supabase_key)

        return cls._instance

    @classmethod
    def reset_client(cls) -> None:
        """Reset the client instance (useful for testing)"""
        cls._instance = None


def get_supabase_client() -> Client:
    """
    Dependency function to get Supabase client

    Returns:
        Configured Supabase client instance
    """
    return SupabaseClient.get_client()


async def test_connection() -> dict:
    """
    Test the Supabase connection

    Returns:
        dict with connection status and details

    Example:
        >>> result = await test_connection()
        >>> print(result)
        {'status': 'connected', 'url': 'https://...', 'message': 'Connection successful'}
    """
    try:
        client = get_supabase_client()
        supabase_url = os.getenv("SUPABASE_URL", "unknown")

        # Try a simple query to test connection
        response = client.table("profiles").select("id").limit(1).execute()

        return {
            "status": "connected",
            "url": supabase_url,
            "message": "Successfully connected to Supabase",
            "service": "Voyanero Backend"
        }

    except Exception as e:
        return {
            "status": "error",
            "url": os.getenv("SUPABASE_URL", "unknown"),
            "message": f"Failed to connect to Supabase: {str(e)}",
            "service": "Voyanero Backend"
        }


# Export for convenience
__all__ = ["SupabaseClient", "get_supabase_client", "test_connection"]
