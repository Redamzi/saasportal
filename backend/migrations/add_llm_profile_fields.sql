-- Migration: Add LLM Profile Fields to profiles table
-- Purpose: Store user/company data for AI-powered email generation

-- Add LLM Profile fields to profiles table
ALTER TABLE profiles 

-- 1. Company/User Information
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS company_industry TEXT,
ADD COLUMN IF NOT EXISTS company_services TEXT,
ADD COLUMN IF NOT EXISTS company_usp TEXT,

-- 2. Target Customer Profile
ADD COLUMN IF NOT EXISTS target_industries TEXT[],
ADD COLUMN IF NOT EXISTS target_company_size TEXT,
ADD COLUMN IF NOT EXISTS target_pain_points TEXT,
ADD COLUMN IF NOT EXISTS target_opportunities TEXT,

-- 3. Acquisition Goal
ADD COLUMN IF NOT EXISTS acquisition_goal TEXT,
ADD COLUMN IF NOT EXISTS acquisition_cta TEXT,

-- 4. Tone & Style
ADD COLUMN IF NOT EXISTS email_tone TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS email_formality TEXT DEFAULT 'sie',
ADD COLUMN IF NOT EXISTS email_language TEXT DEFAULT 'de',
ADD COLUMN IF NOT EXISTS email_max_length INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS email_style_rules TEXT,

-- 5. Trigger Information
ADD COLUMN IF NOT EXISTS value_proposition TEXT,
ADD COLUMN IF NOT EXISTS problem_solution TEXT,
ADD COLUMN IF NOT EXISTS success_metrics TEXT,

-- Certification (for future use)
ADD COLUMN IF NOT EXISTS certification_file_url TEXT,
ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certification_verified_at TIMESTAMP,

-- Email Sender Settings (for future use)
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_email TEXT,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false;

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE profiles IS 'User profiles with LLM email generation settings';
