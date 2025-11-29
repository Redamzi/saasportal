"""
Stripe Payment Routes for Voyanero
Handles credit purchases and webhook events
"""

from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
import stripe
import os
from typing import Optional

from services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")


class CreateCheckoutRequest(BaseModel):
    """Request model for creating Stripe checkout session"""
    user_id: str
    package: int  # Number of credits (500, 1500, 5000)
    amount: int  # Price in cents
    package_name: str


@router.post("/checkout")
async def create_checkout_session(request: CreateCheckoutRequest):
    """
    Create Stripe checkout session for credit purchase
    
    Returns checkout URL for redirect
    """
    try:
        # Define credit packages
        packages = {
            500: {"price": 4900, "name": "Starter Package - 500 Credits"},
            1500: {"price": 12900, "name": "Pro Package - 1500 Credits"},
            5000: {"price": 39900, "name": "Business Package - 5000 Credits"}
        }
        
        if request.package not in packages:
            raise HTTPException(status_code=400, detail="Invalid package")
        
        package_info = packages[request.package]
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': package_info['name'],
                        'description': f'{request.package} Credits für VOYANERO Lead Generation',
                    },
                    'unit_amount': package_info['price'],
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=os.getenv("FRONTEND_URL", "http://localhost:5173") + '/dashboard?payment=success',
            cancel_url=os.getenv("FRONTEND_URL", "http://localhost:5173") + '/credits?payment=cancelled',
            metadata={
                'user_id': request.user_id,
                'credits': str(request.package),
                'package_name': package_info['name']
            }
        )
        
        return {
            "success": True,
            "url": session.url,
            "session_id": session.id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating checkout session: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """
    Handle Stripe webhook events
    
    Processes checkout.session.completed to add credits
    """
    payload = await request.body()
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Extract metadata
        user_id = session['metadata']['user_id']
        credits = int(session['metadata']['credits'])
        package_name = session['metadata']['package_name']
        payment_intent = session.get('payment_intent', 'unknown')
        
        # Add credits using SQL function
        from services.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        try:
            result = supabase.rpc('add_credits', {
                'p_user_id': user_id,
                'p_amount': credits,
                'p_description': f'Purchase: {package_name}',
                'p_payment_intent_id': payment_intent
            }).execute()
            
            if result.data and result.data.get('success'):
                return {
                    "success": True,
                    "message": "Credits added successfully",
                    "credits_added": credits,
                    "new_balance": result.data.get('new_balance')
                }
            else:
                # Log error but return 200 to Stripe (don't retry)
                print(f"Error adding credits: {result.data}")
                return {"received": True, "error": "Failed to add credits"}
                
        except Exception as e:
            print(f"Database error: {str(e)}")
            return {"received": True, "error": str(e)}
    
    # Return 200 for all events
    return {"received": True}


@router.get("/packages")
async def get_credit_packages():
    """
    Get available credit packages
    """
    return {
        "packages": [
            {
                "id": "starter",
                "credits": 500,
                "price": 49,
                "price_cents": 4900,
                "price_per_credit": 0.098,
                "popular": False
            },
            {
                "id": "pro",
                "credits": 1500,
                "price": 129,
                "price_cents": 12900,
                "price_per_credit": 0.086,
                "popular": True
            },
            {
                "id": "business",
                "credits": 5000,
                "price": 399,
                "price_cents": 39900,
                "price_per_credit": 0.080,
                "popular": False
            }
        ]
    }
