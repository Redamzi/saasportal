-- =====================================================
-- IMPRESSUM CACHE TABLE
-- =====================================================
-- Stores scraped email data from Impressum pages to avoid re-crawling

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

-- Index für schnelle Domain-Lookups
CREATE INDEX IF NOT EXISTS idx_impressum_cache_domain 
ON public.impressum_cache(domain);

-- Index für TTL (90 Tage) - für Cleanup
CREATE INDEX IF NOT EXISTS idx_impressum_cache_crawled_at 
ON public.impressum_cache(crawled_at);

-- Index für erfolgreiche Crawls
CREATE INDEX IF NOT EXISTS idx_impressum_cache_success 
ON public.impressum_cache(success) WHERE success = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_impressum_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_impressum_cache_updated_at ON public.impressum_cache;
CREATE TRIGGER trigger_update_impressum_cache_updated_at
    BEFORE UPDATE ON public.impressum_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_impressum_cache_updated_at();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
