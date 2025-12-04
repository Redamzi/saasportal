from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
import httpx
from bs4 import BeautifulSoup
import os
import json
import traceback
import anthropic

router = APIRouter(prefix="/api/profile", tags=["profile"])


class AutoFillRequest(BaseModel):
    website_url: HttpUrl


class AutoFillResponse(BaseModel):
    company_description: str
    company_industry: str
    company_services: str
    company_usp: str
    value_proposition: str
    problem_solution: str
    success_metrics: str


@router.post("/auto-fill", response_model=AutoFillResponse)
async def auto_fill_from_website(request: AutoFillRequest):
    """
    Auto-fill company profile data from website URL.
    Crawls the website, extracts content, and uses AI (Claude) to analyze.
    """
    try:
        # 1. Fetch website content
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            try:
                response = await client.get(str(request.website_url))
                response.raise_for_status()
                html_content = response.text
            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Fehler beim Abrufen der Website: {str(e)}"
                )

        # 2. Extract text from HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer"]):
            script.decompose()
        
        # Get text
        text = soup.get_text(separator=' ', strip=True)
        
        # Clean up text (limit to first 3000 characters for AI)
        text = ' '.join(text.split())[:3000]
        
        # Get meta description
        meta_desc = ""
        meta_tag = soup.find("meta", attrs={"name": "description"})
        if meta_tag and meta_tag.get("content"):
            meta_desc = meta_tag.get("content")
        
        # Get title
        title = soup.find("title")
        title_text = title.string if title else ""

        # 3. Use AI to analyze (Anthropic Claude)
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            raise HTTPException(
                status_code=500,
                detail="ANTHROPIC_API_KEY nicht konfiguriert"
            )

        # Prepare AI prompt
        prompt = f"""Analysiere diese Website und extrahiere folgende Informationen auf Deutsch:

Website-Titel: {title_text}
Meta-Beschreibung: {meta_desc}
Website-Content: {text}

Extrahiere:
1. company_description: Was macht das Unternehmen? (2-3 Sätze)
2. company_industry: Branche (z.B. IT-Dienstleistungen, Handwerk, Marketing)
3. company_services: Dienstleistungen/Produkte (Aufzählung)
4. company_usp: Alleinstellungsmerkmal/USP (1-2 Sätze)
5. value_proposition: Wertversprechen (1-2 Sätze)
6. problem_solution: Problem → Lösung (2 Sätze)
7. success_metrics: Messbare Erfolge/Zahlen (falls vorhanden, sonst generisch)

Antworte NUR mit einem JSON-Objekt in diesem Format:
{{
  "company_description": "...",
  "company_industry": "...",
  "company_services": "...",
  "company_usp": "...",
  "value_proposition": "...",
  "problem_solution": "...",
  "success_metrics": "..."
}}"""

        # Call Anthropic API
        try:
            client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
            
            message = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                temperature=0.7,
                system="Du bist ein Experte für Unternehmensanalyse. Antworte immer nur mit validem JSON.",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Extract AI response
            ai_content = message.content[0].text
            
            # Parse JSON from AI response
            # Remove markdown code blocks if present
            if "```json" in ai_content:
                ai_content = ai_content.split("```json")[1].split("```")[0]
            elif "```" in ai_content:
                ai_content = ai_content.split("```")[1].split("```")[0]
            
            result = json.loads(ai_content.strip())
            
            return AutoFillResponse(**result)
            
        except anthropic.APIError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Fehler bei der AI-Analyse (Claude): {str(e)}"
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise HTTPException(
                status_code=500,
                detail=f"Fehler beim Parsen der AI-Antwort: {str(e)}"
            )

    except Exception as e:
        print(f"❌ Auto-fill error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Unerwarteter Fehler: {str(e)}"
        )
