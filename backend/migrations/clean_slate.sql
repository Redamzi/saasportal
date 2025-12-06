-- CLEAN SLATE STRATEGY
-- Warning: This will delete ALL campaign and lead data!

BEGIN;

-- 1. Truncate dependent tables first to avoid foreign key violations
TRUNCATE TABLE generated_emails CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE campaigns CASCADE;
-- Note: We keep profiles and credit_transactions to preserve user balances/history

-- 2. Reset sequences if necessary (optional but good for clean IDs)
-- (Supabase/Postgres specific: UUIDs don't need reset, but if you used SERIAL id somewhere...)

COMMIT;
