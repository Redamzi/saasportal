-- Add metadata column to campaigns table if it doesn't exist
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to leads table if it doesn't exist
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Refresh the schema cache in Supabase
NOTIFY pgrst, 'reload schema';
