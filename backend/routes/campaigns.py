"""
Campaign Management API Routes for Voyanero
Provides endpoints for creating, reading, updating, and deleting marketing campaigns
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from .auth import get_token_from_header


# Create router
router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])


# =====================================================
# REQUEST MODELS
# =====================================================

class CampaignCreate(BaseModel):
    """Request model for creating a campaign"""
    name: str = Field(..., min_length=1, description="Campaign name")
    description: Optional[str] = Field(None, description="Campaign description")
    budget: Optional[float] = Field(None, ge=0, description="Campaign budget")
    start_date: Optional[datetime] = Field(None, description="Campaign start date")
    end_date: Optional[datetime] = Field(None, description="Campaign end date")
    status: str = Field(default="draft", description="Campaign status (draft, active, paused, completed)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Summer Sale 2024",
                "description": "Summer promotional campaign",
                "budget": 10000.0,
                "start_date": "2024-06-01T00:00:00",
                "end_date": "2024-08-31T23:59:59",
                "status": "draft"
            }
        }


class CampaignUpdate(BaseModel):
    """Request model for updating a campaign"""
    name: Optional[str] = Field(None, min_length=1, description="Campaign name")
    description: Optional[str] = Field(None, description="Campaign description")
    budget: Optional[float] = Field(None, ge=0, description="Campaign budget")
    start_date: Optional[datetime] = Field(None, description="Campaign start date")
    end_date: Optional[datetime] = Field(None, description="Campaign end date")
    status: Optional[str] = Field(None, description="Campaign status")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Updated Campaign Name",
                "status": "active"
            }
        }


# =====================================================
# RESPONSE MODELS
# =====================================================

class CampaignResponse(BaseModel):
    """Standard campaign response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


# =====================================================
# CAMPAIGN ENDPOINTS
# =====================================================

@router.get("/", response_model=CampaignResponse)
async def list_campaigns(
    token: str = Depends(get_token_from_header),
    skip: int = 0,
    limit: int = 100
) -> CampaignResponse:
    """
    List all campaigns for the authenticated user

    Requires valid JWT token in Authorization header.

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    try:
        # TODO: Implement actual database query
        # For now, return mock data
        campaigns = [
            {
                "id": "1",
                "name": "Sample Campaign",
                "description": "This is a sample campaign",
                "budget": 5000.0,
                "status": "active",
                "created_at": datetime.now().isoformat()
            }
        ]

        return CampaignResponse(
            success=True,
            message="Campaigns retrieved successfully",
            data={
                "campaigns": campaigns,
                "total": len(campaigns),
                "skip": skip,
                "limit": limit
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    token: str = Depends(get_token_from_header)
) -> CampaignResponse:
    """
    Get a specific campaign by ID

    Requires valid JWT token in Authorization header.
    """
    try:
        # TODO: Implement actual database query
        # For now, return mock data
        campaign = {
            "id": campaign_id,
            "name": "Sample Campaign",
            "description": "This is a sample campaign",
            "budget": 5000.0,
            "status": "active",
            "created_at": datetime.now().isoformat()
        }

        return CampaignResponse(
            success=True,
            message="Campaign retrieved successfully",
            data={"campaign": campaign}
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    request: CampaignCreate,
    token: str = Depends(get_token_from_header)
) -> CampaignResponse:
    """
    Create a new campaign

    Requires valid JWT token in Authorization header.

    - **name**: Campaign name (required)
    - **description**: Campaign description (optional)
    - **budget**: Campaign budget (optional)
    - **start_date**: Campaign start date (optional)
    - **end_date**: Campaign end date (optional)
    - **status**: Campaign status (default: draft)
    """
    try:
        # TODO: Implement actual database insert
        # For now, return mock data
        campaign = {
            "id": "new-campaign-id",
            "name": request.name,
            "description": request.description,
            "budget": request.budget,
            "start_date": request.start_date.isoformat() if request.start_date else None,
            "end_date": request.end_date.isoformat() if request.end_date else None,
            "status": request.status,
            "created_at": datetime.now().isoformat()
        }

        return CampaignResponse(
            success=True,
            message="Campaign created successfully",
            data={"campaign": campaign}
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


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    request: CampaignUpdate,
    token: str = Depends(get_token_from_header)
) -> CampaignResponse:
    """
    Update an existing campaign

    Requires valid JWT token in Authorization header.
    """
    try:
        # TODO: Implement actual database update
        # For now, return mock data
        campaign = {
            "id": campaign_id,
            "name": request.name or "Updated Campaign",
            "description": request.description,
            "budget": request.budget,
            "status": request.status or "active",
            "updated_at": datetime.now().isoformat()
        }

        return CampaignResponse(
            success=True,
            message="Campaign updated successfully",
            data={"campaign": campaign}
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


@router.delete("/{campaign_id}", response_model=CampaignResponse)
async def delete_campaign(
    campaign_id: str,
    token: str = Depends(get_token_from_header)
) -> CampaignResponse:
    """
    Delete a campaign

    Requires valid JWT token in Authorization header.
    """
    try:
        # TODO: Implement actual database delete

        return CampaignResponse(
            success=True,
            message="Campaign deleted successfully",
            data={"campaign_id": campaign_id}
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
