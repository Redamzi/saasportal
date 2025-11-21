from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

class CreateCampaignRequest(BaseModel):
    user_id: str
    name: str
    description: Optional[str] = ""
    type: str  # "Lead Generation", "Email Outreach", "Cold Calling"

@router.post("/create")
async def create_campaign(req: CreateCampaignRequest):
    try:
        supabase = get_supabase_client()

        result = supabase.table('campaigns').insert({
            'user_id': req.user_id,
            'name': req.name,
            'description': req.description,
            'type': req.type,
            'status': 'draft'
        }).execute()

        return {
            "success": True,
            "campaign": result.data[0]
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/list/{user_id}")
async def list_campaigns(user_id: str):
    try:
        supabase = get_supabase_client()

        result = supabase.table('campaigns')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .execute()

        return {"campaigns": result.data}
    except Exception as e:
        raise HTTPException(500, str(e))
