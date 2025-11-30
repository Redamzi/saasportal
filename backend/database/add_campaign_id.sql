-- =====================================================
-- ADD CAMPAIGN_ID TO LEADS TABLE
-- =====================================================
-- Links leads to campaigns for better organization

-- Add campaign_id column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Create index for campaign lookups
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
