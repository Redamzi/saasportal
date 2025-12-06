-- Vollständige Übersicht aller gescrapten Felder für alle Leads
-- Zeigt ALLE Datenfelder, die der Scraper extrahiert

SELECT 
    -- Basis-Informationen
    l.id,
    l.company_name,
    l.website,
    l.address,
    l.phone,
    l.city,
    
    -- ALT: Klassische Metadaten
    l.meta_description,
    l.meta_keywords,
    l.about_text,
    l.services,
    
    -- NEU: Erweiterte Metadaten
    l.headlines,
    l.schema_org,
    l.og_data,
    
    -- Status & Timestamps
    l.status,
    l.created_at,
    l.updated_at,
    
    -- Campaign Info
    c.name as campaign_name,
    c.type as campaign_type
    
FROM leads l
LEFT JOIN campaigns c ON l.campaign_id = c.id
WHERE l.campaign_id = (SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 1)
ORDER BY l.company_name;

-- ============================================
-- DETAILLIERTE ANSICHT: Nur gefüllte Felder
-- ============================================

SELECT 
    company_name,
    website,
    
    -- Zeige nur wenn vorhanden
    CASE WHEN meta_description IS NOT NULL AND meta_description != '' 
         THEN LEFT(meta_description, 100) || '...' 
         ELSE NULL END as meta_desc_preview,
    
    CASE WHEN meta_keywords IS NOT NULL AND meta_keywords != '' 
         THEN meta_keywords 
         ELSE NULL END as keywords,
    
    CASE WHEN about_text IS NOT NULL AND about_text != '' 
         THEN LEFT(about_text, 100) || '...' 
         ELSE NULL END as about_preview,
    
    CASE WHEN services IS NOT NULL AND array_length(services, 1) > 0 
         THEN array_to_string(services, ', ') 
         ELSE NULL END as services_list,
    
    CASE WHEN headlines IS NOT NULL AND array_length(headlines, 1) > 0 
         THEN array_to_string(headlines, ' | ') 
         ELSE NULL END as headlines_list,
    
    CASE WHEN schema_org IS NOT NULL AND schema_org::text != '{}' 
         THEN schema_org->>'description' 
         ELSE NULL END as schema_description,
    
    CASE WHEN og_data IS NOT NULL AND og_data::text != '{}' 
         THEN og_data->>'title' 
         ELSE NULL END as og_title
    
FROM leads
WHERE campaign_id = (SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 1)
ORDER BY company_name;

-- ============================================
-- EXPORT-FREUNDLICH: CSV-Format
-- ============================================

SELECT 
    company_name,
    website,
    COALESCE(meta_description, '') as meta_description,
    COALESCE(meta_keywords, '') as meta_keywords,
    COALESCE(about_text, '') as about_text,
    COALESCE(array_to_string(services, '; '), '') as services,
    COALESCE(array_to_string(headlines, '; '), '') as headlines,
    COALESCE(schema_org->>'description', '') as schema_org_description,
    COALESCE(og_data->>'title', '') as og_title
FROM leads
WHERE campaign_id = (SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 1)
ORDER BY company_name;
