"""
Authentication API Routes for Voyanero
Provides endpoints for user registration, login, logout, and profile management
"""

from fastapi import APIRouter, HTTPException, status, Depends, Header
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from gotrue.errors import AuthApiError

from ..services.auth_service import get_auth_service, AuthService


# Create router
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# =====================================================
# REQUEST MODELS
# =====================================================

class SignupRequest(BaseModel):
    """Request model for user signup"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="User's password (min 6 characters)")
    company_name: str = Field(..., min_length=1, description="Company name")
    full_name: Optional[str] = Field(None, description="Full name of the user")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "company_name": "Acme Corp",
                "full_name": "John Doe"
            }
        }


class LoginRequest(BaseModel):
    """Request model for user login"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }


class PasswordResetRequest(BaseModel):
    """Request model for password reset"""
    email: EmailStr = Field(..., description="User's email address")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class UpdatePasswordRequest(BaseModel):
    """Request model for updating password"""
    new_password: str = Field(..., min_length=6, description="New password (min 6 characters)")

    class Config:
        json_schema_extra = {
            "example": {
                "new_password": "newsecurepassword123"
            }
        }


class UpdateProfileRequest(BaseModel):
    """Request model for updating user profile"""
    company_name: Optional[str] = Field(None, description="Company name")
    full_name: Optional[str] = Field(None, description="Full name")
    subdomain: Optional[str] = Field(None, description="Custom subdomain")

    class Config:
        json_schema_extra = {
            "example": {
                "company_name": "New Company Name",
                "full_name": "Jane Doe",
                "subdomain": "mycompany"
            }
        }


# =====================================================
# RESPONSE MODELS
# =====================================================

class AuthResponse(BaseModel):
    """Standard authentication response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


# =====================================================
# DEPENDENCY FUNCTIONS
# =====================================================

def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract JWT token from Authorization header

    Args:
        authorization: Authorization header value

    Returns:
        JWT token string

    Raises:
        HTTPException: If token is missing or invalid format
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )

    # Check for Bearer token format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: Bearer <token>"
        )

    return parts[1]


# =====================================================
# AUTHENTICATION ENDPOINTS
# =====================================================

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: SignupRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Register a new user account

    - **email**: Valid email address
    - **password**: Minimum 6 characters
    - **company_name**: Company name (required)
    - **full_name**: Full name (optional)

    Returns user data and session token.
    A verification email will be sent to the provided email address.
    """
    try:
        result = await auth_service.signup(
            email=request.email,
            password=request.password,
            company_name=request.company_name,
            full_name=request.full_name
        )

        return AuthResponse(
            success=True,
            message="Registration successful. Please check your email to verify your account.",
            data=result
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Login with email and password

    - **email**: Valid email address
    - **password**: User's password

    Returns user data, session token, and profile information.
    """
    try:
        result = await auth_service.login(
            email=request.email,
            password=request.password
        )

        return AuthResponse(
            success=True,
            message="Login successful",
            data=result
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/logout", response_model=AuthResponse)
async def logout(
    token: str = Depends(get_token_from_header),
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Logout current user

    Requires valid JWT token in Authorization header.
    Invalidates the current session.
    """
    try:
        result = await auth_service.logout(token)

        return AuthResponse(
            success=True,
            message=result["message"],
            data=None
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/me", response_model=AuthResponse)
async def get_current_user(
    token: str = Depends(get_token_from_header),
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Get current authenticated user

    Requires valid JWT token in Authorization header.
    Returns user data and profile information.
    """
    try:
        result = await auth_service.get_current_user(token)

        return AuthResponse(
            success=True,
            message="User retrieved successfully",
            data=result
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# =====================================================
# PASSWORD MANAGEMENT ENDPOINTS
# =====================================================

@router.post("/password/reset-request", response_model=AuthResponse)
async def request_password_reset(
    request: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Request password reset email

    - **email**: Valid email address

    Sends a password reset email to the provided address.
    """
    try:
        result = await auth_service.reset_password_request(request.email)

        return AuthResponse(
            success=True,
            message=result["message"],
            data=None
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/password/update", response_model=AuthResponse)
async def update_password(
    request: UpdatePasswordRequest,
    token: str = Depends(get_token_from_header),
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Update user password

    Requires valid JWT token in Authorization header.

    - **new_password**: New password (min 6 characters)
    """
    try:
        result = await auth_service.update_password(token, request.new_password)

        return AuthResponse(
            success=True,
            message=result["message"],
            data=None
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# =====================================================
# PROFILE MANAGEMENT ENDPOINTS
# =====================================================

@router.put("/profile", response_model=AuthResponse)
async def update_profile(
    request: UpdateProfileRequest,
    token: str = Depends(get_token_from_header),
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Update user profile

    Requires valid JWT token in Authorization header.

    - **company_name**: Updated company name (optional)
    - **full_name**: Updated full name (optional)
    - **subdomain**: Updated custom subdomain (optional)
    """
    try:
        # Get current user first
        user_data = await auth_service.get_current_user(token)
        user_id = user_data["user"]["id"]

        # Update profile
        result = await auth_service.update_user_profile(
            user_id=user_id,
            company_name=request.company_name,
            full_name=request.full_name,
            subdomain=request.subdomain
        )

        return AuthResponse(
            success=True,
            message="Profile updated successfully",
            data={"profile": result}
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/profile/{user_id}", response_model=AuthResponse)
async def get_user_profile(
    user_id: str,
    token: str = Depends(get_token_from_header),
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Get user profile by ID

    Requires valid JWT token in Authorization header.
    Users can only access their own profile.
    """
    try:
        # Verify the requesting user
        current_user = await auth_service.get_current_user(token)

        # Check if user is requesting their own profile
        if current_user["user"]["id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own profile"
            )

        profile = await auth_service.get_user_profile(user_id)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        return AuthResponse(
            success=True,
            message="Profile retrieved successfully",
            data={"profile": profile}
        )

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
