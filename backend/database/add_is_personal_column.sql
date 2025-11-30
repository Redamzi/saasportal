-- Add is_personal column to leads table
-- This column indicates if the email appears to be a personal email (e.g., firstname.lastname@domain.com)

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN leads.is_personal IS 'Indicates if the email appears to be a personal email address';
