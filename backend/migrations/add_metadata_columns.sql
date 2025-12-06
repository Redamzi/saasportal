-- Migration: Add new metadata columns to leads table
-- Run this in Supabase SQL Editor if columns don't exist

-- Check if columns exist first
DO $$ 
BEGIN
    -- Add schema_org column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'schema_org'
    ) THEN
        ALTER TABLE leads ADD COLUMN schema_org JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added schema_org column';
    ELSE
        RAISE NOTICE 'schema_org column already exists';
    END IF;

    -- Add headlines column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'headlines'
    ) THEN
        ALTER TABLE leads ADD COLUMN headlines TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE 'Added headlines column';
    ELSE
        RAISE NOTICE 'headlines column already exists';
    END IF;

    -- Add og_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'og_data'
    ) THEN
        ALTER TABLE leads ADD COLUMN og_data JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added og_data column';
    ELSE
        RAISE NOTICE 'og_data column already exists';
    END IF;
END $$;

-- Verify the columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('schema_org', 'headlines', 'og_data')
ORDER BY column_name;
