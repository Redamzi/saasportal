-- Migration: Update credits to support decimals (0.5 credits)
-- Description: Changes credits_balance from INTEGER to NUMERIC(10,2) and updates all related functions

-- 1. Alter table column
ALTER TABLE public.profiles 
ALTER COLUMN credits_balance TYPE NUMERIC(10, 2);

-- 2. Alter credit_transactions table
ALTER TABLE public.credit_transactions 
ALTER COLUMN amount TYPE NUMERIC(10, 2);

-- 3. Update Default value for new users (Beta Bonus: 10 Credits)
ALTER TABLE public.profiles 
ALTER COLUMN credits_balance SET DEFAULT 10.00;

-- 4. Update Functions

-- Drop existing functions first (required to change return types or parameter types clean)
DROP FUNCTION IF EXISTS public.get_user_credits(UUID);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.deduct_credits(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.refund_credits(UUID, INTEGER, TEXT, UUID);

-- ADD_CREDITS
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id UUID,
    p_amount NUMERIC,
    p_description TEXT DEFAULT 'Credits purchased',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
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

    -- Lock row for update
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

    -- Initialize balance if null
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
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
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance
        ) || p_metadata
    )
    RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'previous_balance', v_current_balance,
        'new_balance', v_new_balance,
        'amount_added', p_amount,
        'transaction_id', v_transaction_id
    );
END;
$$;

-- DEDUCT_CREDITS
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount NUMERIC,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
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

    -- Lock row for update
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

    -- Initialize balance if null
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;

    -- Check sufficient funds
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
        -p_amount,
        'usage',
        p_description,
        jsonb_build_object(
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance
        ) || p_metadata
    )
    RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'previous_balance', v_current_balance,
        'new_balance', v_new_balance,
        'amount_deducted', p_amount,
        'transaction_id', v_transaction_id
    );
END;
$$;

-- GET_USER_CREDITS
CREATE OR REPLACE FUNCTION public.get_user_credits(
    p_user_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT credits_balance INTO v_balance
    FROM public.profiles
    WHERE id = p_user_id;

    RETURN COALESCE(v_balance, 0);
END;
$$;

-- REFUND_CREDITS
CREATE OR REPLACE FUNCTION public.refund_credits(
    p_user_id UUID,
    p_amount NUMERIC,
    p_description TEXT,
    p_original_transaction_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
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

    -- Lock row for update
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

    -- Initialize balance if null
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;

    -- Calculate new balance (refund adds credits back)
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
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance,
            'original_transaction_id', p_original_transaction_id
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
