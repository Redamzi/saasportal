# Voyanero Database Schema

This directory contains the database schema and setup instructions for the Voyanero platform.

## Overview

The Voyanero database uses Supabase (PostgreSQL) with Row Level Security (RLS) enabled for all tables. Each user can only access their own data.

## Schema Structure

### Tables

1. **profiles** - Extended user profiles
   - Links to `auth.users` table
   - Stores company information and credits balance
   - Each user starts with 5 free credits

2. **leads** - Lead management
   - Stores captured lead information
   - Includes lead scoring and status tracking
   - Supports custom metadata via JSONB field

3. **credit_transactions** - Credit transaction history
   - Tracks all credit purchases, usage, refunds, and bonuses
   - Provides full audit trail for billing

### Security

All tables have Row Level Security (RLS) enabled:
- Users can only view, insert, and update their own data
- Credit transactions can only be inserted by the service role (backend)
- Profile creation is automatically triggered on user signup

## Setup Instructions

### 1. Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor section
3. Create a new query

### 2. Run the Schema

Copy the contents of `schema.sql` and execute it in the SQL Editor.

```sql
-- Copy entire contents of schema.sql and run
```

### 3. Verify Installation

After running the schema, verify the installation:

```sql
-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'leads', 'credit_transactions');

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'leads', 'credit_transactions');

-- Check if triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### 4. Test User Creation

When you create a new user through the auth system:

```sql
-- After user signup, check if profile was created
SELECT * FROM profiles WHERE id = '<user-id>';

-- Check if welcome bonus was added
SELECT * FROM credit_transactions
WHERE user_id = '<user-id>'
AND type = 'bonus';
```

## Environment Variables

Make sure these environment variables are set in your backend `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

You can find these values in your Supabase project settings:
- **Project URL**: Settings > API > Project URL
- **Service Key**: Settings > API > Project API keys > service_role key

## Database Functions

### handle_updated_at()
Automatically updates the `updated_at` timestamp on profile and lead updates.

### handle_new_user()
Trigger function that:
1. Creates a profile entry when a new user signs up
2. Adds 5 welcome bonus credits
3. Records the bonus transaction

## Views

### user_stats
Provides aggregated statistics for each user:
- Total leads
- Converted leads
- Total purchased credits
- Total used credits
- Current credit balance

Query example:
```sql
SELECT * FROM user_stats WHERE id = '<user-id>';
```

## Migration Best Practices

1. **Backup First**: Always backup your database before running migrations
2. **Test Locally**: Test the schema in a development environment first
3. **Review Policies**: Ensure RLS policies match your security requirements
4. **Monitor Performance**: Check query performance after adding indexes
5. **Document Changes**: Update this README when modifying the schema

## Troubleshooting

### RLS Policies Not Working

If you can't access data even though you're authenticated:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View all policies
SELECT * FROM pg_policies
WHERE schemaname = 'public';

-- Test policy as specific user
SET ROLE authenticated;
SET request.jwt.claim.sub = '<user-id>';
SELECT * FROM profiles;
RESET ROLE;
```

### Profile Not Created on Signup

Check if the trigger is working:

```sql
-- View trigger definition
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Manually create profile if needed
INSERT INTO profiles (id, company_name, credits_balance)
VALUES ('<user-id>', 'Company Name', 5);
```

## Sample Queries

### Get User's Total Credits
```sql
SELECT credits_balance FROM profiles WHERE id = '<user-id>';
```

### Get User's Lead Conversion Rate
```sql
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'converted')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as conversion_rate
FROM leads
WHERE user_id = '<user-id>';
```

### Get Credit Transaction History
```sql
SELECT
  type,
  amount,
  description,
  created_at
FROM credit_transactions
WHERE user_id = '<user-id>'
ORDER BY created_at DESC
LIMIT 20;
```

## Schema Updates

When updating the schema:

1. Create a new migration file with timestamp: `YYYYMMDD_description.sql`
2. Document breaking changes
3. Update this README
4. Test thoroughly before deploying to production

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review PostgreSQL RLS docs: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
