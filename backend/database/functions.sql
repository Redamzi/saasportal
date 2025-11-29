-- =====================================================
-- VOYANERO CREDIT MANAGEMENT FUNCTIONS
-- =====================================================
-- These functions handle credit transactions with proper locking
-- to prevent race conditions and ensure data consistency

-- =====================================================
-- ADD CREDITS FUNCTION
-- =====================================================
-- Used when user purchases credits via Stripe
-- Adds credits to user balance and logs transaction

CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_payment_intent_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Validate input
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Amount must be positive',
            'amount', p_amount
        );
    END IF;

    -- Lock row for update (prevents race conditions)
    SELECT credits_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    -- Check if user exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found',
            'user_id', p_user_id
        );
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;

    -- Update profile
    UPDATE public.profiles
    SET credits_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        type,
        description,
        metadata
    )
    VALUES (
        p_user_id,
        p_amount,
        'purchase',
        p_description,
        jsonb_build_object(
            'payment_intent_id', p_payment_intent_id,
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance
        )
    )
    RETURNING id INTO v_transaction_id;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'previous_balance', v_current_balance,
        'new_balance', v_new_balance,
        'amount_added', p_amount,
        'transaction_id', v_transaction_id
    );
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.add_credits TO service_role;


-- =====================================================
-- DEDUCT CREDITS FUNCTION
-- =====================================================
-- Used when user uses credits (lead crawling, email generation, etc.)
-- Deducts credits from user balance and logs transaction

CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Validate input
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Amount must be positive',
            'amount', p_amount
        );
    END IF;

    -- Lock row for update (prevents race conditions)
    SELECT credits_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    -- Check if user exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found',
            'user_id', p_user_id
        );
    END IF;

    -- Check sufficient balance
    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'current_balance', v_current_balance,
            'required', p_amount,
            'missing', p_amount - v_current_balance
        );
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance - p_amount;

    -- Update profile
    UPDATE public.profiles
    SET credits_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Log transaction (negative amount for usage)
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        type,
        description,
        metadata
    )
    VALUES (
        p_user_id,
        -p_amount,  -- Negative for deduction
        'usage',
        p_description,
        jsonb_build_object(
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance
        ) || p_metadata  -- Merge with provided metadata
    )
    RETURNING id INTO v_transaction_id;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'previous_balance', v_current_balance,
        'new_balance', v_new_balance,
        'amount_deducted', p_amount,
        'transaction_id', v_transaction_id
    );
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.deduct_credits TO service_role;


-- =====================================================
-- GET USER CREDITS FUNCTION
-- =====================================================
-- Quick function to get current credit balance

CREATE OR REPLACE FUNCTION public.get_user_credits(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT credits_balance INTO v_balance
    FROM public.profiles
    WHERE id = p_user_id;

    RETURN COALESCE(v_balance, 0);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_credits TO authenticated, service_role;


-- =====================================================
-- REFUND CREDITS FUNCTION
-- =====================================================
-- Used for refunds or credit adjustments

CREATE OR REPLACE FUNCTION public.refund_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_original_transaction_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Validate input
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Amount must be positive'
        );
    END IF;

    -- Lock row for update
    SELECT credits_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;

    -- Update profile
    UPDATE public.profiles
    SET credits_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        type,
        description,
        metadata
    )
    VALUES (
        p_user_id,
        p_amount,
        'refund',
        p_description,
        jsonb_build_object(
            'original_transaction_id', p_original_transaction_id,
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance
        )
    )
    RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'previous_balance', v_current_balance,
        'new_balance', v_new_balance,
        'amount_refunded', p_amount,
        'transaction_id', v_transaction_id
    );
END;
$$;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION public.refund_credits TO service_role;
