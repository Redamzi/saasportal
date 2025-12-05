-- Performance Indexes for Scalability
-- Run this to ensure optimal performance with millions of leads

-- Check existing indexes first (informational)
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- ============================================
-- LEADS TABLE - Most Critical
-- ============================================

-- Index for filtering leads by campaign (most common query)
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

-- Index for email lookups and duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL;

-- Index for status filtering (contacted, converted, etc.)
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Composite index for campaign + status queries
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status ON leads(campaign_id, status);

-- Index for website lookups (used in deduplication)
CREATE INDEX IF NOT EXISTS idx_leads_website ON leads(website) WHERE website IS NOT NULL;

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================

-- Index for filtering campaigns by user
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

-- Index for filtering by status (draft, crawling, completed)
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);

-- Index for created_at (for sorting/filtering recent campaigns)
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- ============================================
-- CAMPAIGN_EMAILS TABLE
-- ============================================

-- Index for finding emails by lead
CREATE INDEX IF NOT EXISTS idx_campaign_emails_lead_id ON campaign_emails(lead_id);

-- Index for finding emails by campaign
CREATE INDEX IF NOT EXISTS idx_campaign_emails_campaign_id ON campaign_emails(campaign_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_campaign_emails_status ON campaign_emails(status);

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
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);

-- Index for created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify all indexes were created:
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('leads', 'campaigns', 'campaign_emails', 'impressum_cache', 'credit_transactions')
-- ORDER BY tablename, indexname;

-- Check index usage (run after some time in production):
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
