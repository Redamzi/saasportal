-- Function to check for duplicate leads based on Place ID, Domain, or Email
-- Returns details about the duplicate if found

CREATE OR REPLACE FUNCTION check_duplicate_lead(
    p_user_id UUID,
    p_place_id TEXT,
    p_domain TEXT,
    p_email TEXT
)
RETURNS TABLE (
    is_duplicate BOOLEAN,
    duplicate_reason TEXT,
    existing_lead_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- 1. Check Place ID (Strongest signal)
    IF p_place_id IS NOT NULL AND p_place_id != '' THEN
        RETURN QUERY 
        SELECT TRUE, 'place_id', id 
        FROM leads 
        WHERE user_id = p_user_id AND place_id = p_place_id 
        LIMIT 1;
        
        IF FOUND THEN RETURN; END IF;
    END IF;

    -- 2. Check Domain (Medium signal)
    -- We assume p_domain is already normalized (e.g., "example.com")
    IF p_domain IS NOT NULL AND p_domain != '' THEN
        RETURN QUERY 
        SELECT TRUE, 'domain', id 
        FROM leads 
        WHERE user_id = p_user_id 
        AND (
            website ILIKE '%' || p_domain || '%' 
            OR email ILIKE '%@' || p_domain
        )
        LIMIT 1;
        
        IF FOUND THEN RETURN; END IF;
    END IF;

    -- 3. Check Email (Strong signal)
    IF p_email IS NOT NULL AND p_email != '' THEN
        RETURN QUERY 
        SELECT TRUE, 'email', id 
        FROM leads 
        WHERE user_id = p_user_id AND email = p_email 
        LIMIT 1;
        
        IF FOUND THEN RETURN; END IF;
    END IF;

    -- No duplicate found
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::UUID;
END;
$$;
