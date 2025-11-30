-- =====================================================
-- EMAIL FIELDS FOR LEADS TABLE
-- =====================================================
-- Add email-related columns to leads table for Outscraper integration

-- Add email column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email_source column (outscraper, impressum_crawler, manual)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_source TEXT;

-- Add email_verified column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Create index for place_id lookups (for deduplication)
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON public.leads((metadata->>'place_id'));

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
