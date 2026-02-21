-- Fix: drop old get_waitlist_neighbors signature and recreate with referral columns
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

-- Grant execute to service_role and auth admin
GRANT EXECUTE ON FUNCTION public.process_referral(UUID, TEXT) TO service_role;
