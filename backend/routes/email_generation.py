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
        
        # IMPORTANT: Only process leads that have an email address
        leads_with_email = [lead for lead in leads_to_process if lead.get("email")]
        leads_without_email = len(leads_to_process) - len(leads_with_email)
        
        if not leads_with_email:
            return EmailGenerationResponse(
                generated_count=0,
                failed_count=0,
                total_leads=len(leads),
                errors=[f"No leads with email addresses found. {leads_without_email} leads have no email."]
            )
        
        # Update leads_to_process to only include leads with email
        leads_to_process = leads_with_email
        
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
                # Get email config
                email_config = campaign.get("email_config", {})
                custom_prompt = email_config.get("custom_prompt")
                
                # Build AI prompt (custom or default)
                if custom_prompt:
                    # Replace variables in custom prompt
                    prompt = custom_prompt.format(
                        company_name=lead.get("company_name", "Ihr Unternehmen"),
                        user_name=profile.get("full_name", ""),
                        word_count=email_config.get("max_words", 200),
                        lead_industry=lead.get("industry", ""),
                        lead_website=lead.get("website", ""),
                        lead_location=lead.get("location", ""),
                        user_company=profile.get("company_name", ""),
                        user_position=profile.get("position", "Business Development"),
                        tone=email_config.get("tone", "professional"),
                        salutation=email_config.get("salutation", "sie"),
                        language=email_config.get("language", "de"),
                        goal=email_config.get("email_goal", "appointment"),
                        meta_description=lead.get("meta_description", "Keine Angabe"),
                        meta_keywords=lead.get("meta_keywords", "Keine Angabe"),
                        services=lead.get("services", "Keine Angabe"),
                        about_text=lead.get("about_text", "Keine Angabe")
                    )
                    system_prompt = "Du bist ein Experte für B2B-Akquise-Emails. Erstelle DSGVO-konforme, personalisierte Emails auf Deutsch."
                else:
                    # Use default prompt
                    prompt = build_email_prompt(profile, campaign, lead)
                    system_prompt = "Du bist ein Experte für B2B-Akquise-Emails. Erstelle DSGVO-konforme, personalisierte Emails auf Deutsch."
                
                # Call Claude API (Haiku - only available model)
                message = await client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=1024,
                    temperature=0.3,
                    system=system_prompt,
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
                
                # 7. Deduct credits (0.5 credits per generated email)
                credits_to_deduct = 0.5
                await supabase.rpc('deduct_credits', {
                    'p_user_id': user_id, 
                    'p_amount': credits_to_deduct, 
                    'p_description': f"Email generation for lead {lead.get('id')} in campaign {campaign_id}"
                }).execute()
                
                generated_count += 1
                
            except Exception as e:
                failed_count += 1
                error_msg = f"Lead {lead.get('company_name', 'Unknown')}: {str(e)}"
                errors.append(error_msg)
                print(f"❌ Email generation error: {error_msg}")
                traceback.print_exc()
        
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
- Kontaktperson: {lead_name if lead_name else ""}
- Branche: {lead_industry if lead_industry else ""}

**Email-Konfiguration:**
- Ziel: {email_goal}
- Tonfall: {tone}
- Anrede: {salutation}
- Max. Wörter: {max_words}

**KRITISCHE REGELN (STRIKT EINHALTEN):**

1. **KEINE FALSCHEN BEHAUPTUNGEN:**
   - Erfinde KEINE Informationen über {lead_company}
   - Behaupte NICHT, dass du ihre Website analysiert hast
   - Sage NICHT "keine Website" oder "veraltete Website" ohne Beweise
   - Nutze NUR die gegebenen Informationen

2. **PERSONALISIERUNG:**
   - Verwende den Namen "{lead_name if lead_name else 'Sehr geehrte Damen und Herren'}"
   - Erwähne die Branche "{lead_industry}" nur wenn relevant
   - Erwähne {company_name} maximal 1x im Text

3. **STRUKTUR:**
   - Kurze, prägnante Sätze
   - Maximal {max_words} Wörter
   - Klarer Call-to-Action am Ende
   - Keine Wiederholungen

4. **TONFALL:**
   - {tone}
   - {salutation}
   - Professionell, aber nicht aufdringlich
   - Keine Spam-Wörter ("KOSTENLOS", "JETZT", "SUPER ANGEBOT")

5. **INHALT:**
   - Fokus auf EINEN konkreten Mehrwert
   - Keine generischen Phrasen
   - Klare Handlungsaufforderung
   - DSGVO-konform (B2B erlaubt)

6. **VERBOTEN:**
   - Erfundene Details über {lead_company}
   - Mehrfache Nennung von {company_name}
   - Lange Aufzählungen
   - Übertriebene Versprechungen

**Antwortformat (NUR JSON):**
{{
  "subject": "Betreffzeile (max. 50 Zeichen, personalisiert auf {lead_company})",
  "body": "Email-Text (max. {max_words} Wörter, direkt und konkret)"
}}"""
    
    return prompt


def parse_email_response(ai_content: str) -> dict:
    """Parse Claude's JSON response"""
    import json
    import re
    
    # Debug: Log raw AI response
    print(f"🔍 Raw AI response length: {len(ai_content)}")
    print(f"🔍 Raw AI response (first 500 chars): {ai_content[:500]}")
    
    # Check if response is empty
    if not ai_content or len(ai_content.strip()) == 0:
        raise ValueError("AI returned empty response")
    
    # Remove markdown code blocks if present
    if "```json" in ai_content:
        ai_content = ai_content.split("```json")[1].split("```")[0]
    elif "```" in ai_content:
        ai_content = ai_content.split("```")[1].split("```")[0]
    
    # Clean up control characters that break JSON parsing
    ai_content = ai_content.strip()
    
    # If still empty after cleanup
    if not ai_content:
        raise ValueError("AI response empty after cleanup")
    
    # Try to parse as JSON first
    try:
        result = json.loads(ai_content)
        # Validate required fields
        if "subject" not in result or "body" not in result:
            raise ValueError(f"AI response missing required fields. Got: {list(result.keys())}")
        return result
    except (json.JSONDecodeError, ValueError):
        # If JSON parsing fails, treat as plain text email
        print("ℹ️ AI returned plain text instead of JSON, auto-generating subject")
        
        # Extract first line as basis for subject
        lines = ai_content.split('\n')
        first_line = lines[0].strip() if lines else ""
        
        # Generate subject from first line (extract company name if present)
        company_match = re.search(r'(?:Team von|Hallo)\s+([^,]+)', first_line)
        if company_match:
            company_name = company_match.group(1).strip()
            subject = f"Zusammenarbeit mit {company_name}"
        else:
            subject = "Gemeinsam erfolgreicher werden"
        
        return {
            "subject": subject,
            "body": ai_content
        }
