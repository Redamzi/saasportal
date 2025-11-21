-- Supabase SQL Migration for Stripe Credit Purchase Integration
-- Run this in Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- =====================================================
-- 1. ENSURE PROFILES TABLE HAS CREDIT COLUMNS
-- =====================================================

-- Add credit columns to profiles table if they don't exist
-- (Skip if columns already exist)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credits_purchased INTEGER DEFAULT 0;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_credits
ON profiles(credits_balance);


-- =====================================================
-- 2. CREATE CREDIT TRANSACTIONS TABLE
-- =====================================================

-- Table to log all credit transactions (purchases, usage, etc.)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    description TEXT,
    stripe_payment_intent TEXT,
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
ON credit_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
ON credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_session
ON credit_transactions(stripe_session_id);

-- Enable Row Level Security
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY IF NOT EXISTS "Users can view own transactions"
ON credit_transactions FOR SELECT
USING (auth.uid() = user_id);


-- =====================================================
-- 3. CREATE FAILED TRANSACTIONS TABLE
-- =====================================================

-- Table to log failed credit additions for manual review
CREATE TABLE IF NOT EXISTS failed_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    credits INTEGER NOT NULL,
    error TEXT,
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_failed_transactions_user_id
ON failed_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_failed_transactions_resolved
ON failed_transactions(resolved) WHERE resolved = FALSE;


-- =====================================================
-- 4. CREATE ADD_CREDITS FUNCTION (ATOMIC OPERATION)
-- =====================================================

-- Function to add credits to user account
-- This is called by the Stripe webhook
-- SECURITY DEFINER ensures it runs with elevated privileges

CREATE OR REPLACE FUNCTION add_credits(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update credits balance and total purchased
    UPDATE profiles
    SET
        credits_balance = credits_balance + p_amount,
        total_credits_purchased = COALESCE(total_credits_purchased, 0) + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Raise exception if user not found
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found', p_user_id;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
-- (Webhook will use service role key which has full access)
GRANT EXECUTE ON FUNCTION add_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits(UUID, INTEGER) TO service_role;


-- =====================================================
-- 5. CREATE FUNCTION TO DEDUCT CREDITS (FOR USAGE)
-- =====================================================

-- Function to deduct credits when user uses them
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT 'Credit usage'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT credits_balance INTO current_balance
    FROM profiles
    WHERE id = p_user_id;

    -- Check if user exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found', p_user_id;
    END IF;

    -- Check if sufficient credits
    IF current_balance < p_amount THEN
        RETURN FALSE; -- Insufficient credits
    END IF;

    -- Deduct credits
    UPDATE profiles
    SET credits_balance = credits_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Log the transaction
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -p_amount, 'usage', p_description);

    RETURN TRUE; -- Success
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT) TO service_role;


-- =====================================================
-- 6. CREATE VIEW FOR USER CREDIT STATS
-- =====================================================

CREATE OR REPLACE VIEW user_credit_stats AS
SELECT
    p.id AS user_id,
    p.credits_balance,
    p.total_credits_purchased,
    COUNT(ct.id) FILTER (WHERE ct.type = 'purchase') AS purchase_count,
    COUNT(ct.id) FILTER (WHERE ct.type = 'usage') AS usage_count,
    SUM(ct.amount) FILTER (WHERE ct.type = 'purchase') AS total_purchased_amount,
    ABS(SUM(ct.amount)) FILTER (WHERE ct.type = 'usage') AS total_used_amount
FROM profiles p
LEFT JOIN credit_transactions ct ON p.id = ct.user_id
GROUP BY p.id, p.credits_balance, p.total_credits_purchased;

-- Grant access
GRANT SELECT ON user_credit_stats TO authenticated;


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if everything was created successfully
-- Run these to verify:

-- SELECT * FROM profiles LIMIT 1;
-- SELECT * FROM credit_transactions LIMIT 1;
-- SELECT * FROM failed_transactions LIMIT 1;
-- SELECT * FROM user_credit_stats LIMIT 1;

-- Test the add_credits function (replace with real user ID):
-- SELECT add_credits('your-user-id-here'::UUID, 100);

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- Uncomment to rollback changes:
-- DROP FUNCTION IF EXISTS add_credits(UUID, INTEGER);
-- DROP FUNCTION IF EXISTS deduct_credits(UUID, INTEGER, TEXT);
-- DROP VIEW IF EXISTS user_credit_stats;
-- DROP TABLE IF EXISTS credit_transactions;
-- DROP TABLE IF EXISTS failed_transactions;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS credits_balance;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS total_credits_purchased;
