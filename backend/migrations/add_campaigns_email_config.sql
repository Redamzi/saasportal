-- Migration: Add LLM Email Configuration to campaigns table
-- Purpose: Store campaign-specific email generation settings

-- Add email configuration fields to campaigns table
ALTER TABLE campaigns 

-- Target Customer Profile
ADD COLUMN IF NOT EXISTS target_industries TEXT[],
ADD COLUMN IF NOT EXISTS target_company_size TEXT,
ADD COLUMN IF NOT EXISTS target_pain_points TEXT,
ADD COLUMN IF NOT EXISTS target_opportunities TEXT,

-- Acquisition Goal
ADD COLUMN IF NOT EXISTS acquisition_goal TEXT,
ADD COLUMN IF NOT EXISTS acquisition_cta TEXT,

-- Tone & Style
ADD COLUMN IF NOT EXISTS email_tone TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS email_formality TEXT DEFAULT 'sie',
ADD COLUMN IF NOT EXISTS email_language TEXT DEFAULT 'de',
ADD COLUMN IF NOT EXISTS email_max_length INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS email_style_rules TEXT,

-- Email configuration status
ADD COLUMN IF NOT EXISTS email_config_completed BOOLEAN DEFAULT false,

-- JSON field for flexible email configuration
ADD COLUMN IF NOT EXISTS email_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON TABLE campaigns IS 'Campaigns with LLM email generation configuration';
