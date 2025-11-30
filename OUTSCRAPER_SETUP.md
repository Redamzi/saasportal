# Outscraper Setup Guide

## 1. Outscraper Account erstellen

1. Gehe zu https://outscraper.com/
2. Klick auf "Sign Up"
3. Registriere dich mit deiner Email
4. Bestätige deine Email

## 2. API Key holen

1. Login zu Outscraper Dashboard
2. Gehe zu **Profile** → **API**
3. Kopiere deinen **API Key**

## 3. API Key in Coolify hinzufügen

1. Gehe zu Coolify → Backend Service
2. Klick auf **Environment Variables**
3. Füge hinzu:
   ```
   OUTSCRAPER_API_KEY=your_api_key_here
   ```
4. Speichern

## 4. Supabase SQL ausführen

Führe das SQL aus `backend/database/email_fields.sql` in Supabase SQL Editor aus:

```sql
-- Add email column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email_source column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_source TEXT;

-- Add email_verified column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON public.leads((metadata->>'place_id'));

-- Refresh schema
NOTIFY pgrst, 'reload schema';
```

## 5. Backend Redeploy

1. Gehe zu Coolify → Backend Service
2. Klick auf **Redeploy**
3. Warte bis Deployment fertig ist

## 6. Testen

1. Gehe zur Campaigns-Seite
2. Erstelle eine neue Kampagne
3. Starte einen Crawl mit z.B. 50 Leads
4. Prüfe:
   - ✅ Crawling funktioniert
   - ✅ Mehr als 60 Leads möglich
   - ✅ Einige Leads haben Emails

## Kosten

- **Erste 500 Leads/Monat:** Kostenlos
- **501-100.000 Leads:** $3 pro 1.000 Leads
- **100.000+ Leads:** $1 pro 1.000 Leads

**Beispiel:** 1.000 Leads = $3 (vs. $17 mit Google Places API)

## Troubleshooting

### "OUTSCRAPER_API_KEY not found"
→ API Key in Coolify Environment Variables hinzufügen

### "Invalid API Key"
→ API Key in Outscraper Dashboard überprüfen

### "Quota exceeded"
→ Prepaid Credits in Outscraper kaufen

### "No results found"
→ Suchquery anpassen (z.B. "Restaurant in München" statt nur "Restaurant")
