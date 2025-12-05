-- Add Missing Performance Indexes
-- Only creates indexes that don't already exist
-- Safe to run multiple times (IF NOT EXISTS)

-- ============================================
-- LEADS TABLE - Missing Indexes
-- ============================================

-- Index for status filtering (contacted, converted, invalid, new)
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Composite index for campaign + status queries (very common)
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status ON leads(campaign_id, status);

-- Index for website lookups (used in deduplication)
CREATE INDEX IF NOT EXISTS idx_leads_website ON leads(website) WHERE website IS NOT NULL;

-- ============================================
-- CAMPAIGNS TABLE - Missing Indexes
-- ============================================

-- Composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);

-- ============================================
-- IMPRESSUM_CACHE TABLE
-- ============================================

-- Index for cache lookups by domain (critical for performance)
CREATE INDEX IF NOT EXISTS idx_impressum_cache_domain ON impressum_cache(domain);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_impressum_cache_created_at ON impressum_cache(created_at);

-- ============================================
-- CREDIT_TRANSACTIONS TABLE
-- ============================================

-- Index for user transaction history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);

-- Index for transaction type filtering
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- Index for created_at (for sorting transaction history)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify all new indexes were created:
-- SELECT 
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname IN (
--     'idx_leads_status',
--     'idx_leads_campaign_status',
--     'idx_leads_website',
--     'idx_campaigns_user_status',
--     'idx_impressum_cache_domain',
--     'idx_impressum_cache_created_at',
--     'idx_credit_transactions_user_id',
--     'idx_credit_transactions_type',
--     'idx_credit_transactions_created_at'
--   )
-- ORDER BY tablename, indexname;
