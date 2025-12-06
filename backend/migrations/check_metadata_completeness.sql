-- Check metadata for all leads in current campaign
-- This shows which leads have headlines and schema_org data

SELECT 
    company_name,
    website,
    CASE 
        WHEN meta_description IS NOT NULL AND meta_description != '' THEN '✓'
        ELSE '✗'
    END as has_meta_desc,
    CASE 
        WHEN meta_keywords IS NOT NULL AND meta_keywords != '' THEN '✓'
        ELSE '✗'
    END as has_keywords,
    CASE 
        WHEN headlines IS NOT NULL AND array_length(headlines, 1) > 0 THEN '✓ (' || array_length(headlines, 1) || ')'
        ELSE '✗'
    END as has_headlines,
    CASE 
        WHEN schema_org IS NOT NULL AND schema_org::text != '{}' THEN '✓'
        ELSE '✗'
    END as has_schema,
    CASE 
        WHEN services IS NOT NULL AND array_length(services, 1) > 0 THEN '✓ (' || array_length(services, 1) || ')'
        ELSE '✗'
    END as has_services
FROM leads
WHERE campaign_id = (SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 1)
ORDER BY company_name;

-- Summary statistics
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN meta_description IS NOT NULL AND meta_description != '' THEN 1 END) as with_meta_desc,
    COUNT(CASE WHEN meta_keywords IS NOT NULL AND meta_keywords != '' THEN 1 END) as with_keywords,
    COUNT(CASE WHEN headlines IS NOT NULL AND array_length(headlines, 1) > 0 THEN 1 END) as with_headlines,
    COUNT(CASE WHEN schema_org IS NOT NULL AND schema_org::text != '{}' THEN 1 END) as with_schema,
    COUNT(CASE WHEN services IS NOT NULL AND array_length(services, 1) > 0 THEN 1 END) as with_services
FROM leads
WHERE campaign_id = (SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 1);
