-- Migration: Cleanup - Remove campaign-specific fields from profiles
-- Purpose: Move campaign-specific fields to campaigns table

-- Remove campaign-specific fields from profiles (they should be in campaigns table)
ALTER TABLE profiles 
DROP COLUMN IF EXISTS target_industries,
DROP COLUMN IF EXISTS target_company_size,
DROP COLUMN IF EXISTS target_pain_points,
DROP COLUMN IF EXISTS target_opportunities,
DROP COLUMN IF EXISTS acquisition_goal,
DROP COLUMN IF EXISTS acquisition_cta,
DROP COLUMN IF EXISTS email_tone,
DROP COLUMN IF EXISTS email_formality,
DROP COLUMN IF EXISTS email_language,
DROP COLUMN IF EXISTS email_max_length,
DROP COLUMN IF EXISTS email_style_rules;

-- Keep only user/company master data in profiles:
-- company_description, company_industry, company_services, company_usp
-- value_proposition, problem_solution, success_metrics
-- certification_file_url, is_certified, sender_name, sender_email, custom_domain

COMMENT ON TABLE profiles IS 'User profiles with company master data for LLM email generation';
