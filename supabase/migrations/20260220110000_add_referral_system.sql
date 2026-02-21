-- ============================================================
-- REFERRAL SYSTEM
-- Adds referral codes, referral tracking, and position bumping
-- to the waitlist table.
-- ============================================================

-- 1. Drop the identity property so position can be updated
ALTER TABLE public.waitlist ALTER COLUMN position DROP IDENTITY IF EXISTS;

-- 2. Add referral columns
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0;

-- 3. Helper: generate a unique PV-XXXXXX referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'PV-' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.waitlist WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 4. Backfill existing rows with referral codes
UPDATE public.waitlist
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- 5. Now make referral_code NOT NULL
ALTER TABLE public.waitlist ALTER COLUMN referral_code SET NOT NULL;

-- 6. Update the trigger to assign position manually + generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_waitlist_entry()
RETURNS TRIGGER AS $$
DECLARE
    v_next_position INT;
BEGIN
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position FROM public.waitlist;
    INSERT INTO public.waitlist (user_id, position, referral_code)
    VALUES (NEW.user_id, v_next_position, public.generate_referral_code())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Core referral function: links referrer, bumps them up 50, shifts others
CREATE OR REPLACE FUNCTION public.process_referral(p_new_user_id UUID, p_referral_code TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_referrer_user_id UUID;
  v_referrer_old_position INT;
  v_referrer_new_position INT;
  v_already_referred BOOLEAN;
BEGIN
  -- Guard: new user must not already have a referrer
  SELECT (referred_by IS NOT NULL) INTO v_already_referred
  FROM public.waitlist
  WHERE user_id = p_new_user_id;

  IF v_already_referred IS TRUE THEN
    RETURN json_build_object('error', 'Already referred');
  END IF;

  -- Look up the referrer
  SELECT user_id, position INTO v_referrer_user_id, v_referrer_old_position
  FROM public.waitlist
  WHERE referral_code = p_referral_code;

  IF v_referrer_user_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid referral code');
  END IF;

  IF v_referrer_user_id = p_new_user_id THEN
    RETURN json_build_object('error', 'Cannot refer yourself');
  END IF;

  -- Mark the new user as referred
  UPDATE public.waitlist
  SET referred_by = v_referrer_user_id
  WHERE user_id = p_new_user_id;

  -- Increment referrer's count
  UPDATE public.waitlist
  SET referral_count = referral_count + 1
  WHERE user_id = v_referrer_user_id;

  -- Calculate new position (minimum 1)
  v_referrer_new_position := GREATEST(1, v_referrer_old_position - 50);

  -- No movement needed if already at or above target
  IF v_referrer_new_position >= v_referrer_old_position THEN
    RETURN json_build_object('success', true, 'new_position', v_referrer_old_position);
  END IF;

  -- Shift everyone in [new_position, old_position-1] down by 1
  UPDATE public.waitlist
  SET position = position + 1
  WHERE position >= v_referrer_new_position
    AND position < v_referrer_old_position
    AND user_id != v_referrer_user_id;

  -- Move referrer into the vacated slot
  UPDATE public.waitlist
  SET position = v_referrer_new_position
  WHERE user_id = v_referrer_user_id;

  RETURN json_build_object('success', true, 'new_position', v_referrer_new_position);
END;
$$;

-- 8. Drop + recreate get_waitlist_neighbors with referral columns in the return type
DROP FUNCTION IF EXISTS public.get_waitlist_neighbors(UUID, INT);

CREATE OR REPLACE FUNCTION public.get_waitlist_neighbors(
    p_user_id UUID,
    p_radius INT DEFAULT 2
)
RETURNS TABLE(
    "position" INT,
    username TEXT,
    "userId" UUID,
    "isCurrentUser" BOOLEAN,
    "referralCode" TEXT,
    "referralCount" INT
)
AS $$
DECLARE
    v_position INT;
BEGIN
    SELECT w.position INTO v_position
    FROM public.waitlist w
    WHERE w.user_id = p_user_id;

    IF v_position IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        w.position,
        u.username,
        w.user_id,
        (w.user_id = p_user_id) AS "isCurrentUser",
        CASE WHEN w.user_id = p_user_id THEN w.referral_code ELSE NULL END AS "referralCode",
        CASE WHEN w.user_id = p_user_id THEN w.referral_count ELSE 0 END AS "referralCount"
    FROM public.waitlist w
    JOIN public.users u ON u.user_id = w.user_id
    WHERE w.position BETWEEN v_position - p_radius AND v_position + p_radius
    ORDER BY w.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute on the new functions
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.process_referral(UUID, TEXT) TO service_role;
