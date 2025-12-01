-- 1. Add last_contacted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_contacted_at') THEN
        ALTER TABLE leads ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS leads_last_contacted_at_idx ON leads(last_contacted_at);

-- 2. Function to check if a lead can be contacted (90-Day Rule)
CREATE OR REPLACE FUNCTION can_contact_lead(
    p_lead_id UUID,
    p_days_threshold INTEGER DEFAULT 90
)
RETURNS TABLE (
    can_contact BOOLEAN,
    reason TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_last_contacted TIMESTAMPTZ;
    v_domain TEXT;
    v_email TEXT;
    v_user_id UUID;
BEGIN
    -- Get lead details
    SELECT last_contacted_at, get_domain(website), email, user_id
    INTO v_last_contacted, v_domain, v_email, v_user_id
    FROM leads
    WHERE id = p_lead_id;

    -- 1. Check specific lead last contact
    IF v_last_contacted IS NOT NULL AND v_last_contacted > NOW() - (p_days_threshold || ' days')::INTERVAL THEN
        RETURN QUERY SELECT FALSE, 'Lead contacted recently (' || v_last_contacted::DATE || ')';
        RETURN;
    END IF;

    -- 2. Check Domain-wide contact (prevent spamming same company via different people)
    -- If we contacted ANYONE at this domain in the last 90 days, we should probably wait.
    IF v_domain IS NOT NULL THEN
        PERFORM 1 FROM leads 
        WHERE user_id = v_user_id 
        AND get_domain(website) = v_domain 
        AND last_contacted_at > NOW() - (p_days_threshold || ' days')::INTERVAL
        AND id != p_lead_id; -- Exclude self (already checked)
        
        IF FOUND THEN
            RETURN QUERY SELECT FALSE, 'Domain contacted recently';
            RETURN;
        END IF;
    END IF;

    -- Eligible
    RETURN QUERY SELECT TRUE, 'Eligible';
END;
$$;
