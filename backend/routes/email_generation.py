from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import anthropic
import os
import traceback
from datetime import datetime

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


class EmailGenerationRequest(BaseModel):
    campaign_id: str


class EmailGenerationResponse(BaseModel):
    generated_count: int
    failed_count: int
    total_leads: int
    errors: Optional[List[str]] = []


class GeneratedEmail(BaseModel):
    id: str
    lead_id: str
    lead_name: str
    lead_company: str
    subject: str
    body: str
    status: str
    edited_by_user: bool
    created_at: datetime


class EmailUpdateRequest(BaseModel):
    subject: str
    body: str


@router.post("/{campaign_id}/generate-emails", response_model=EmailGenerationResponse)
async def generate_emails_for_campaign(campaign_id: str):
    """
    Generate personalized emails for all leads in a campaign using Claude AI.
    
    Process:
    1. Load campaign configuration (email config, target profile)
    2. Load user profile data (company info, USP, etc.)
    3. For each lead in the campaign:
       - Combine profile + campaign + lead data
       - Call Claude API to generate personalized email
       - Save to campaign_emails table
    4. Deduct credits (0.5 credits per email)
    """
    try:
        from services.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        # 1. Load campaign data
        campaign_response = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
        if not campaign_response.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        campaign = campaign_response.data
        user_id = campaign["user_id"]
        
        # 2. Load user profile data
        profile_response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        profile = profile_response.data
        
        # 3. Load all leads for this campaign
        leads_response = supabase.table("leads").select("*").eq("campaign_id", campaign_id).execute()
        leads = leads_response.data
        
        if not leads:
            raise HTTPException(status_code=400, detail="No leads found in campaign")
        
        # 4. Check if emails already generated
        existing_emails = supabase.table("campaign_emails").select("lead_id").eq("campaign_id", campaign_id).execute()
        existing_lead_ids = {email["lead_id"] for email in existing_emails.data}
        
        # Filter out leads that already have emails
        leads_to_process = [lead for lead in leads if lead["id"] not in existing_lead_ids]
        
        if not leads_to_process:
            return EmailGenerationResponse(
                generated_count=0,
                failed_count=0,
                total_leads=len(leads),
                errors=["All leads already have generated emails"]
            )
        
        # 5. Initialize Claude client
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
        
        client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
        
        # 6. Generate emails for each lead
        generated_count = 0
        failed_count = 0
        errors = []
        
        for lead in leads_to_process:
            try:
                # Build AI prompt
                prompt = build_email_prompt(profile, campaign, lead)
                
                # Call Claude API
                message = await client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=800,
                    temperature=0.7,
                    system="Du bist ein Experte für B2B-Akquise-Emails. Erstelle DSGVO-konforme, personalisierte Emails auf Deutsch.",
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                
                # Parse response
                ai_content = message.content[0].text
                email_data = parse_email_response(ai_content)
                
                # Save to database
                supabase.table("campaign_emails").insert({
                    "campaign_id": campaign_id,
                    "lead_id": lead["id"],
                    "subject": email_data["subject"],
                    "body": email_data["body"],
                    "status": "draft"
                }).execute()
                
                generated_count += 1
                
            except Exception as e:
                failed_count += 1
                error_msg = f"Lead {lead.get('company_name', 'Unknown')}: {str(e)}"
                errors.append(error_msg)
                print(f"❌ Email generation error: {error_msg}")
                traceback.print_exc()
        
        # 7. Deduct credits (0.5 credits per generated email)
        if generated_count > 0:
            credits_to_deduct = generated_count * 0.5
            # TODO: Implement credit deduction
            # await deduct_credits(user_id, credits_to_deduct, f"Email generation for campaign {campaign_id}")
        
        return EmailGenerationResponse(
            generated_count=generated_count,
            failed_count=failed_count,
            total_leads=len(leads_to_process),
            errors=errors if errors else None
        )
        
    except Exception as e:
        print(f"❌ Campaign email generation error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}/emails", response_model=List[GeneratedEmail])
async def get_campaign_emails(campaign_id: str):
    """Get all generated emails for a campaign"""
    try:
        from services.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        # Get emails with lead data
        response = supabase.table("campaign_emails")\
            .select("*, leads(company_name)")\
            .eq("campaign_id", campaign_id)\
            .execute()
        
        emails = []
        for email in response.data:
            emails.append(GeneratedEmail(
                id=email["id"],
                lead_id=email["lead_id"],
                lead_name=email["leads"]["company_name"] or "Unknown",
                lead_company=email["leads"]["company_name"] or "Unknown",
                subject=email["subject"],
                body=email["body"],
                status=email["status"],
                edited_by_user=email["edited_by_user"],
                created_at=email["created_at"]
            ))
        
        return emails
        
    except Exception as e:
        print(f"❌ Get campaign emails error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{campaign_id}/emails/{email_id}")
async def update_campaign_email(campaign_id: str, email_id: str, update: EmailUpdateRequest):
    """Update a generated email (user edited)"""
    try:
        from services.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        response = supabase.table("campaign_emails")\
            .update({
                "subject": update.subject,
                "body": update.body,
                "edited_by_user": True,
                "status": "edited"
            })\
            .eq("id", email_id)\
            .eq("campaign_id", campaign_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return {"message": "Email updated successfully"}
        
    except Exception as e:
        print(f"❌ Update email error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def build_email_prompt(profile: dict, campaign: dict, lead: dict) -> str:
    """Build AI prompt for email generation"""
    
    # Extract data
    company_name = profile.get("company_name", "Unser Unternehmen")
    company_description = profile.get("company_description", "")
    company_services = profile.get("company_services", "")
    company_usp = profile.get("company_usp", "")
    value_proposition = profile.get("value_proposition", "")
    
    lead_company = lead.get("company_name", "Ihr Unternehmen")
    lead_name = lead.get("contact_name", "")
    lead_industry = lead.get("industry", "")
    
    # Campaign config (from email_config JSON field)
    email_config = campaign.get("email_config", {})
    target_size = email_config.get("target_company_size", "")
    pain_points = email_config.get("pain_points", "")
    opportunities = email_config.get("opportunities", "")
    email_goal = email_config.get("email_goal", "Termin vereinbaren")
    cta = email_config.get("call_to_action", "")
    tone = email_config.get("tone", "Professionell")
    salutation = email_config.get("salutation", "Sie (förmlich)")
    max_words = email_config.get("max_words", 200)
    
    prompt = f"""Erstelle eine personalisierte B2B-Akquise-Email auf Deutsch.

**Absender-Firma:**
- Name: {company_name}
- Beschreibung: {company_description}
- Dienstleistungen: {company_services}
- USP: {company_usp}
- Wertversprechen: {value_proposition}

**Empfänger:**
- Firma: {lead_company}
- Kontaktperson: {lead_name if lead_name else "Geschäftsführung"}
- Branche: {lead_industry if lead_industry else "unbekannt"}

**Email-Ziel:** {email_goal}
**Call-to-Action:** {cta}
**Tonfall:** {tone}
**Anrede:** {salutation}
**Max. Wortanzahl:** {max_words}

**Pain Points der Zielgruppe:** {pain_points}
**Erkennbare Chancen:** {opportunities}

**Wichtige Regeln:**
1. DSGVO-konform (B2B erlaubt)
2. Personalisiert auf {lead_company} und {lead_industry}
3. Keine Spam-Wörter ("KOSTENLOS", "SUPER ANGEBOT", etc.)
4. Professionell und respektvoll
5. Klarer Call-to-Action
6. Kein Footer (wird automatisch hinzugefügt)

**Antwortformat (NUR JSON):**
{{
  "subject": "Betreffzeile (max. 60 Zeichen)",
  "body": "Email-Text (max. {max_words} Wörter)"
}}"""
    
    return prompt


def parse_email_response(ai_content: str) -> dict:
    """Parse Claude's JSON response"""
    import json
    import re
    
    # Remove markdown code blocks if present
    if "```json" in ai_content:
        ai_content = ai_content.split("```json")[1].split("```")[0]
    elif "```" in ai_content:
        ai_content = ai_content.split("```")[1].split("```")[0]
    
    # Clean up control characters that break JSON parsing
    # Replace newlines, tabs, and other control chars within strings
    ai_content = ai_content.strip()
    
    # Try to parse, if it fails, attempt to fix common issues
    try:
        result = json.loads(ai_content)
    except json.JSONDecodeError:
        # Remove control characters (except spaces)
        ai_content = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', ai_content)
        # Try again
        result = json.loads(ai_content)
    
    # Validate required fields
    if "subject" not in result or "body" not in result:
        raise ValueError("AI response missing required fields (subject, body)")
    
    return result
