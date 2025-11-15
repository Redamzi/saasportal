-- =====================================================
-- VOYANERO DATABASE SCHEMA
-- =====================================================
-- This schema defines the complete database structure for Voyanero SaaS platform
-- Including user profiles, leads management, and credit transaction tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Extends auth.users with additional user profile information
-- Each user gets 5 free credits on signup

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    full_name TEXT,
    credits_balance INTEGER DEFAULT 5 NOT NULL CHECK (credits_balance >= 0),
    subdomain TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster subdomain lookups
CREATE INDEX IF NOT EXISTS profiles_subdomain_idx ON public.profiles(subdomain);

-- =====================================================
-- LEADS TABLE
-- =====================================================
-- Stores lead information captured by users
-- Each lead has a score and status for tracking

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    city TEXT,
    industry TEXT,
    lead_score INTEGER DEFAULT 50 CHECK (lead_score >= 0 AND lead_score <= 100),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at DESC);

-- =====================================================
-- CREDIT TRANSACTIONS TABLE
-- =====================================================
-- Tracks all credit transactions for audit and billing purposes
-- Types: purchase, usage, refund, bonus

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_type_idx ON public.credit_transactions(type);
CREATE INDEX IF NOT EXISTS credit_transactions_created_at_idx ON public.credit_transactions(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile (triggered on signup)
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- LEADS POLICIES
-- =====================================================

-- Users can view their own leads
CREATE POLICY "Users can view own leads"
    ON public.leads
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own leads
CREATE POLICY "Users can insert own leads"
    ON public.leads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own leads
CREATE POLICY "Users can update own leads"
    ON public.leads
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own leads
CREATE POLICY "Users can delete own leads"
    ON public.leads
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- CREDIT TRANSACTIONS POLICIES
-- =====================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON public.credit_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only allow service role to insert transactions (backend only)
CREATE POLICY "Service role can insert transactions"
    ON public.credit_transactions
    FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Function to create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, company_name, full_name, credits_balance)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        5
    );

    -- Create initial bonus credit transaction
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (
        NEW.id,
        5,
        'bonus',
        'Welcome bonus - 5 free credits'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View for user stats
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
    p.id,
    p.company_name,
    p.credits_balance,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.status = 'converted' THEN l.id END) as converted_leads,
    COALESCE(SUM(CASE WHEN ct.type = 'purchase' THEN ct.amount ELSE 0 END), 0) as total_purchased_credits,
    COALESCE(SUM(CASE WHEN ct.type = 'usage' THEN ABS(ct.amount) ELSE 0 END), 0) as total_used_credits
FROM public.profiles p
LEFT JOIN public.leads l ON p.id = l.user_id
LEFT JOIN public.credit_transactions ct ON p.id = ct.user_id
GROUP BY p.id, p.company_name, p.credits_balance;

-- Grant permissions on view
GRANT SELECT ON public.user_stats TO authenticated;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - REMOVE IN PRODUCTION)
-- =====================================================

-- Uncomment below to insert sample data for testing
/*
-- Sample profile (requires auth.users entry first)
INSERT INTO public.profiles (id, company_name, full_name, subdomain, credits_balance)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Acme Corp',
    'John Doe',
    'acme',
    100
);

-- Sample leads
INSERT INTO public.leads (user_id, company_name, email, phone, city, industry, lead_score, status)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'Tech Startup GmbH', 'info@techstartup.de', '+49 30 12345678', 'Berlin', 'Technology', 85, 'qualified'),
    ('00000000-0000-0000-0000-000000000000', 'Marketing Agency', 'contact@marketing.de', '+49 89 87654321', 'Munich', 'Marketing', 70, 'contacted');

-- Sample credit transactions
INSERT INTO public.credit_transactions (user_id, amount, type, description)
VALUES
    ('00000000-0000-0000-0000-000000000000', 100, 'purchase', 'Initial credit purchase'),
    ('00000000-0000-0000-0000-000000000000', -5, 'usage', 'Lead enrichment');
*/
