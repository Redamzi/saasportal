"""
Authentication Service for Voyanero
Handles all authentication operations using Supabase
"""

from typing import Optional, Dict, Any
from supabase import create_client, Client
from gotrue.errors import AuthApiError
import os
from datetime import datetime


class AuthService:
    """Service class for handling authentication operations"""

    def __init__(self):
        """Initialize Supabase client"""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment")

        self.client: Client = create_client(supabase_url, supabase_key)

    async def signup(
        self,
        email: str,
        password: str,
        company_name: str,
        full_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Register a new user with email and password

        Args:
            email: User's email address
            password: User's password (min 6 characters)
            company_name: Company name for the profile
            full_name: Optional full name of the user

        Returns:
            Dict containing user data and session

        Raises:
            AuthApiError: If signup fails
            ValueError: If validation fails
        """
        try:
            # Validate inputs
            if not email or not password:
                raise ValueError("Email and password are required")

            if len(password) < 6:
                raise ValueError("Password must be at least 6 characters")

            if not company_name:
                raise ValueError("Company name is required")

            # Sign up user with metadata
            response = self.client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "company_name": company_name,
                        "full_name": full_name or ""
                    }
                }
            })

            if not response.user:
                raise AuthApiError("Signup failed - no user returned")

            return {
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "created_at": response.user.created_at,
                    "email_confirmed_at": response.user.email_confirmed_at
                },
                "session": {
                    "access_token": response.session.access_token if response.session else None,
                    "refresh_token": response.session.refresh_token if response.session else None,
                    "expires_at": response.session.expires_at if response.session else None
                } if response.session else None,
                "message": "Signup successful. Please check your email to verify your account."
            }

        except AuthApiError as e:
            raise AuthApiError(f"Signup failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error during signup: {str(e)}")

    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Login user with email and password

        Args:
            email: User's email address
            password: User's password

        Returns:
            Dict containing user data, session, and profile

        Raises:
            AuthApiError: If login fails
            ValueError: If validation fails
        """
        try:
            # Validate inputs
            if not email or not password:
                raise ValueError("Email and password are required")

            # Sign in user
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if not response.user or not response.session:
                raise AuthApiError("Login failed - invalid credentials")

            # Fetch user profile
            profile_response = self.client.table("profiles").select("*").eq("id", response.user.id).single().execute()

            return {
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "email_confirmed_at": response.user.email_confirmed_at
                },
                "session": {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_at": response.session.expires_at,
                    "token_type": response.session.token_type
                },
                "profile": profile_response.data if profile_response.data else None
            }

        except AuthApiError as e:
            raise AuthApiError(f"Login failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error during login: {str(e)}")

    async def logout(self, access_token: str) -> Dict[str, str]:
        """
        Logout user by invalidating session

        Args:
            access_token: User's access token

        Returns:
            Dict with success message

        Raises:
            AuthApiError: If logout fails
        """
        try:
            # Set the session before signing out
            self.client.auth.set_session(access_token, access_token)  # Note: In production, store refresh token properly
            self.client.auth.sign_out()

            return {"message": "Logout successful"}

        except AuthApiError as e:
            raise AuthApiError(f"Logout failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error during logout: {str(e)}")

    async def get_current_user(self, access_token: str) -> Dict[str, Any]:
        """
        Get current user data from access token

        Args:
            access_token: User's access token

        Returns:
            Dict containing user data and profile

        Raises:
            AuthApiError: If token is invalid
        """
        try:
            # Get user from token
            user_response = self.client.auth.get_user(access_token)

            if not user_response.user:
                raise AuthApiError("Invalid or expired token")

            # Fetch user profile
            profile_response = self.client.table("profiles").select("*").eq("id", user_response.user.id).single().execute()

            return {
                "user": {
                    "id": user_response.user.id,
                    "email": user_response.user.email,
                    "email_confirmed_at": user_response.user.email_confirmed_at,
                    "created_at": user_response.user.created_at
                },
                "profile": profile_response.data if profile_response.data else None
            }

        except AuthApiError as e:
            raise AuthApiError(f"Failed to get user: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error getting user: {str(e)}")

    async def verify_email(self, token: str, type_: str = "signup") -> Dict[str, str]:
        """
        Verify user email with token

        Args:
            token: Email verification token
            type_: Token type (signup, recovery, etc.)

        Returns:
            Dict with success message

        Raises:
            AuthApiError: If verification fails
        """
        try:
            response = self.client.auth.verify_otp({
                "token_hash": token,
                "type": type_
            })

            if not response.user:
                raise AuthApiError("Email verification failed")

            return {"message": "Email verified successfully"}

        except AuthApiError as e:
            raise AuthApiError(f"Email verification failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error during email verification: {str(e)}")

    async def reset_password_request(self, email: str) -> Dict[str, str]:
        """
        Send password reset email

        Args:
            email: User's email address

        Returns:
            Dict with success message

        Raises:
            AuthApiError: If request fails
        """
        try:
            if not email:
                raise ValueError("Email is required")

            self.client.auth.reset_password_email(email)

            return {"message": "Password reset email sent. Please check your inbox."}

        except AuthApiError as e:
            raise AuthApiError(f"Password reset request failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error during password reset request: {str(e)}")

    async def update_password(self, access_token: str, new_password: str) -> Dict[str, str]:
        """
        Update user password

        Args:
            access_token: User's access token
            new_password: New password (min 6 characters)

        Returns:
            Dict with success message

        Raises:
            AuthApiError: If update fails
            ValueError: If validation fails
        """
        try:
            if len(new_password) < 6:
                raise ValueError("Password must be at least 6 characters")

            # Set session and update password
            self.client.auth.set_session(access_token, access_token)
            self.client.auth.update_user({"password": new_password})

            return {"message": "Password updated successfully"}

        except AuthApiError as e:
            raise AuthApiError(f"Password update failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error during password update: {str(e)}")

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile by user ID

        Args:
            user_id: User's UUID

        Returns:
            User profile data or None

        Raises:
            Exception: If query fails
        """
        try:
            response = self.client.table("profiles").select("*").eq("id", user_id).single().execute()
            return response.data if response.data else None

        except Exception as e:
            raise Exception(f"Failed to get user profile: {str(e)}")

    async def update_user_profile(
        self,
        user_id: str,
        company_name: Optional[str] = None,
        full_name: Optional[str] = None,
        subdomain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update user profile

        Args:
            user_id: User's UUID
            company_name: Updated company name
            full_name: Updated full name
            subdomain: Updated subdomain

        Returns:
            Updated profile data

        Raises:
            Exception: If update fails
        """
        try:
            update_data = {}
            if company_name is not None:
                update_data["company_name"] = company_name
            if full_name is not None:
                update_data["full_name"] = full_name
            if subdomain is not None:
                update_data["subdomain"] = subdomain

            if not update_data:
                raise ValueError("No data provided for update")

            response = self.client.table("profiles").update(update_data).eq("id", user_id).execute()

            if not response.data:
                raise Exception("Profile update failed")

            return response.data[0]

        except Exception as e:
            raise Exception(f"Failed to update profile: {str(e)}")


# Singleton instance
_auth_service: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    """Get or create AuthService singleton instance"""
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service
