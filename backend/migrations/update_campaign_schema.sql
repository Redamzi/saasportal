-- Migration to support Multi-Step Campaign Modal and new Campaign Types

-- 1. Add new columns to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'lead_generation',
ADD COLUMN IF NOT EXISTS target_lead_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leads_found INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_lead NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS phone_config JSONB DEFAULT '{}'::jsonb;

-- 2. Create index for campaign type
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);

-- 3. Update existing campaigns to have 'lead_generation' type
UPDATE campaigns 
SET type = 'lead_generation' 
WHERE type IS NULL;

-- 4. Add email status tracking to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS email_status TEXT, -- 'sent', 'opened', 'bounced', etc.
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone_call_status TEXT, -- 'pending', 'called', 'voicemail', etc.
ADD COLUMN IF NOT EXISTS phone_called_at TIMESTAMP WITH TIME ZONE;

-- 5. Create index for status fields
CREATE INDEX IF NOT EXISTS idx_leads_email_status ON leads(email_status);
CREATE INDEX IF NOT EXISTS idx_leads_phone_call_status ON leads(phone_call_status);
