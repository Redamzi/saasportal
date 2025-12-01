-- Cleanup Script: Remove all test leads and scraper cache
-- WARNING: This will delete ALL leads and scraper cache data!
-- Use with caution in production!

-- Delete all leads (this will cascade delete related data if foreign keys are set up)
DELETE FROM leads;

-- Delete all scraper cache entries
DELETE FROM impressum_cache;

-- Optional: Reset campaigns status to draft (if you want to keep campaigns but reset their data)
-- UPDATE campaigns SET status = 'draft', metadata = '{}';

-- Optional: Delete all campaigns entirely
-- DELETE FROM campaigns;

-- Verify deletion
SELECT 'Leads remaining:' as info, COUNT(*) as count FROM leads
UNION ALL
SELECT 'Cache entries remaining:' as info, COUNT(*) as count FROM impressum_cache;
