from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/legal", tags=["Legal"])

class AVVSignRequest(BaseModel):
    signature_data: str
    user_id: str

@router.post("/avv/sign")
async def sign_avv(request: AVVSignRequest, req: Request):
    """
    Sign the AV-Contract
    """
    supabase = get_supabase_client()
    
    try:
        # Get IP address
        client_host = req.client.host
        
        # 1. Insert into avv_logs
        log_data = {
            "user_id": request.user_id,
            "signature_data": request.signature_data,
            "ip_address": client_host,
            "contract_version": "1.0",
            "signed_at": datetime.now().isoformat()
        }
        
        # Try to insert (will fail if already signed due to UNIQUE constraint)
        try:
            supabase.table('avv_logs').insert(log_data).execute()
        except Exception as e:
            if "unique constraint" in str(e).lower():
                # Already signed, just update the signature? 
                # For now, we assume one signature is enough.
                print(f"User {request.user_id} already signed AVV")
            else:
                raise e
        
        # 2. Update profile
        supabase.table('profiles').update({'is_avv_signed': True}).eq('id', request.user_id).execute()
        
        return {
            "success": True,
            "message": "AV-Contract signed successfully"
        }
        
    except Exception as e:
        print(f"💥 Error signing AVV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/avv/status/{user_id}")
async def get_avv_status(user_id: str):
    """
    Check if user has signed AVV
    """
    supabase = get_supabase_client()
    
    try:
        res = supabase.table('profiles').select('is_avv_signed').eq('id', user_id).single().execute()
        
        if not res.data:
            return {"is_signed": False}
            
        return {"is_signed": res.data.get('is_avv_signed', False)}
        
    except Exception as e:
        print(f"💥 Error checking AVV status: {str(e)}")
        return {"is_signed": False}
