"""
Credits API Routes
Handles Stripe checkout for credit purchases
"""

from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, Field
from typing import Optional
import os
import stripe

from services.supabase_client import get_supabase_client

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
        # Get frontend URL from environment, default to production
        frontend_url = os.getenv('FRONTEND_URL', 'https://app.voyanero.com')

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
            success_url=f'{frontend_url}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/credits?payment=cancelled',
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


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events

    This endpoint receives events from Stripe when payments are completed.
    It adds credits to the user's account and logs the transaction.

    IMPORTANT: Configure this webhook in Stripe Dashboard:
    1. Go to Developers → Webhooks
    2. Add endpoint: https://api.voyanero.com/api/credits/webhook
    3. Select event: checkout.session.completed
    4. Copy signing secret and set STRIPE_WEBHOOK_SECRET env variable
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    if not webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook secret not configured"
        )

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # Extract metadata
        user_id = session['metadata'].get('user_id')
        credits = int(session['metadata'].get('credits', 0))
        package_name = session['metadata'].get('package_name', 'Unknown')
        payment_intent = session.get('payment_intent', '')

        if not user_id or not credits:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required metadata"
            )

        try:
            # Get Supabase client
            supabase = get_supabase_client()

            # Add credits to user's account
            # Using RPC function for atomic operation
            supabase.rpc('add_credits', {
                'p_user_id': user_id,
                'p_amount': credits
            }).execute()

            # Log the transaction
            supabase.table('credit_transactions').insert({
                'user_id': user_id,
                'amount': credits,
                'type': 'purchase',
                'description': f'Purchased {package_name} - {credits} credits',
                'stripe_payment_intent': payment_intent,
                'stripe_session_id': session['id']
            }).execute()

            print(f"✅ Successfully added {credits} credits to user {user_id}")

        except Exception as e:
            # Log error but return 200 to Stripe to avoid retries
            print(f"❌ Error processing payment for user {user_id}: {str(e)}")
            # Don't raise exception - we still return 200 to Stripe
            # Manual investigation needed for failed credit additions

            # Log failed transaction for manual review
            try:
                supabase.table('failed_transactions').insert({
                    'user_id': user_id,
                    'credits': credits,
                    'error': str(e),
                    'stripe_session_id': session['id'],
                    'stripe_payment_intent': payment_intent
                }).execute()
            except:
                pass  # Even logging failed, but we must return 200 to Stripe

    # Return 200 to acknowledge receipt of event
    return {"success": True, "event_type": event['type']}


@router.get("/health")
async def credits_health_check():
    """Health check for credits API"""
    stripe_configured = bool(stripe.api_key)
    webhook_configured = bool(os.getenv('STRIPE_WEBHOOK_SECRET'))
    return {
        "status": "healthy",
        "service": "credits-api",
        "stripe_configured": stripe_configured,
        "webhook_configured": webhook_configured
    }
