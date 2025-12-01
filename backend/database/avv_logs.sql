-- Create AVV Logs table
CREATE TABLE IF NOT EXISTS public.avv_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    signature_data TEXT NOT NULL, -- Base64 PNG
    ip_address TEXT,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contract_version TEXT DEFAULT '1.0',
    UNIQUE(user_id) -- One active contract per user
);

-- Add flag to profiles for quick check
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_avv_signed BOOLEAN DEFAULT FALSE;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_avv_logs_user_id ON public.avv_logs(user_id);

-- RLS Policies
ALTER TABLE public.avv_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own logs
CREATE POLICY "Users can view own avv logs" 
ON public.avv_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own logs (only once due to UNIQUE constraint)
CREATE POLICY "Users can sign avv" 
ON public.avv_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
