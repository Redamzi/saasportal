"""
Credits API Routes
Handles Stripe checkout for credit purchases
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
import os
import stripe

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

router = APIRouter(prefix="/api/credits", tags=["Credits"])


class CheckoutRequest(BaseModel):
    """Request model for Stripe checkout"""
    user_id: str = Field(..., description="User ID")
    package: int = Field(..., description="Number of credits")
    amount: int = Field(..., description="Amount in cents")
    package_name: str = Field(..., description="Package name")


class CheckoutResponse(BaseModel):
    """Response model for checkout"""
    url: str = Field(..., description="Stripe checkout URL")


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(request: CheckoutRequest):
    """
    Create a Stripe checkout session for credit purchase

    Args:
        request: Checkout parameters

    Returns:
        Stripe checkout URL
    """
    try:
        # Get frontend URL from environment
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')

        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f'{request.package_name} - {request.package} Credits',
                            'description': f'Voyanero Credits Package: {request.package} credits',
                        },
                        'unit_amount': request.amount,
                    },
                    'quantity': 1,
                }
            ],
            mode='payment',
            success_url=f'{frontend_url}/credits?success=true&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/credits?canceled=true',
            metadata={
                'user_id': request.user_id,
                'credits': str(request.package),
                'package_name': request.package_name,
            },
            client_reference_id=request.user_id,
        )

        return CheckoutResponse(url=session.url)

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@router.get("/health")
async def credits_health_check():
    """Health check for credits API"""
    stripe_configured = bool(stripe.api_key)
    return {
        "status": "healthy",
        "service": "credits-api",
        "stripe_configured": stripe_configured
    }
