-- Migration: Add website scraping fields to leads table
-- Purpose: Store scraped website data for better AI email personalization

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS services TEXT[], -- Array of detected services
ADD COLUMN IF NOT EXISTS about_text TEXT; -- Company description from website

COMMENT ON COLUMN leads.meta_description IS 'Meta description scraped from website';
COMMENT ON COLUMN leads.meta_keywords IS 'Meta keywords scraped from website';
COMMENT ON COLUMN leads.services IS 'Detected services from website content';
COMMENT ON COLUMN leads.about_text IS 'Company description/about text from website';
