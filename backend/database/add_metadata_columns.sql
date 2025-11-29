-- =====================================================
-- ADD METADATA COLUMNS TO ALL TABLES
-- =====================================================
-- This migration adds JSONB metadata columns to tables that need them
-- Run this in Supabase SQL Editor

-- Add metadata column to campaigns table if it doesn't exist
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to leads table if it doesn't exist
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to credit_transactions table if it doesn't exist
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Refresh the schema cache in Supabase (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Verify the columns were created
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('campaigns', 'leads', 'credit_transactions')
  AND column_name = 'metadata'
ORDER BY table_name;
