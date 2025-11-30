# Database Setup Guide

## SQL-Dateien die in Supabase ausgeführt werden müssen

Führe diese SQL-Dateien **in dieser Reihenfolge** in Supabase SQL Editor aus:

### 1. Campaign ID hinzufügen
**Datei:** `backend/database/add_campaign_id.sql`

```sql
-- Links leads to campaigns
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);

NOTIFY pgrst, 'reload schema';
```

### 2. Email-Felder hinzufügen
**Datei:** `backend/database/email_fields.sql`

```sql
-- Add email_source column (outscraper, impressum_crawler, manual)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_source TEXT;

-- Add email_verified column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON public.leads((metadata->>'place_id'));

NOTIFY pgrst, 'reload schema';
```

### 3. Impressum Cache Tabelle erstellen
**Datei:** `backend/database/impressum_cache.sql`

```sql
CREATE TABLE IF NOT EXISTS public.impressum_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT UNIQUE NOT NULL,
    website TEXT NOT NULL,
    email TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_personal BOOLEAN DEFAULT FALSE,
    contact_person TEXT,
    all_emails JSONB DEFAULT '[]'::jsonb,
    scraped_from TEXT,
    crawled_at TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_impressum_cache_domain ON public.impressum_cache(domain);
CREATE INDEX IF NOT EXISTS idx_impressum_cache_crawled_at ON public.impressum_cache(crawled_at);
CREATE INDEX IF NOT EXISTS idx_impressum_cache_success ON public.impressum_cache(success) WHERE success = true;

-- Trigger
CREATE OR REPLACE FUNCTION update_impressum_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_impressum_cache_updated_at ON public.impressum_cache;
CREATE TRIGGER trigger_update_impressum_cache_updated_at
    BEFORE UPDATE ON public.impressum_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_impressum_cache_updated_at();

NOTIFY pgrst, 'reload schema';
```

## Verifizierung

Nach dem Ausführen aller SQL-Dateien, prüfe ob alles funktioniert:

```sql
-- Prüfe leads Tabelle
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
  AND column_name IN ('campaign_id', 'email', 'email_source', 'email_verified');

-- Prüfe impressum_cache Tabelle
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'impressum_cache';
```

**Erwartetes Ergebnis:**
- `leads.campaign_id` → uuid
- `leads.email` → text
- `leads.email_source` → text
- `leads.email_verified` → boolean
- `impressum_cache` Tabelle existiert mit allen Feldern

## Nach dem SQL-Setup

1. **Warte 10-20 Sekunden** (Schema Cache Reload)
2. **Backend Redeploy** in Coolify
3. **Teste einen Crawl** mit 20-30 Leads
4. **Prüfe ob Impressum Scraper funktioniert**
