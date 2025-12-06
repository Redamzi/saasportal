-- ============================================
-- CLEANUP SCRIPT: Remove all test campaigns and leads
-- ============================================
-- This script removes all campaign and lead data while preserving:
-- - User accounts (profiles table)
-- - Credit balances
-- - Transaction history
-- ============================================

-- 1. Delete generated emails (if exists)
DELETE FROM generated_emails;

-- 2. Delete all leads
DELETE FROM leads;

-- 3. Delete all campaigns
DELETE FROM campaigns;

-- 4. Clear impressum cache (optional - removes cached scraping results)
DELETE FROM impressum_cache;

-- 5. Verify cleanup
SELECT 'Campaigns remaining:' as info, COUNT(*) as count FROM campaigns
UNION ALL
SELECT 'Leads remaining:', COUNT(*) FROM leads
UNION ALL
SELECT 'Generated emails remaining:', COUNT(*) FROM generated_emails
UNION ALL
SELECT 'Cache entries remaining:', COUNT(*) FROM impressum_cache;
