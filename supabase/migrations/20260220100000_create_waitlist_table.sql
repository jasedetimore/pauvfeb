-- Create the waitlist table
-- When a user creates an account, they get a sequential position number.

CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    position INT GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Index for fast neighbor lookups
CREATE INDEX idx_waitlist_position ON public.waitlist(position);
CREATE INDEX idx_waitlist_user_id ON public.waitlist(user_id);

-- RLS: Authenticated users can read all waitlist rows (needed for neighbor display)
CREATE POLICY "Authenticated users can read waitlist"
ON public.waitlist
FOR SELECT
TO authenticated
USING (true);

-- RLS: Only service role can insert/update/delete
CREATE POLICY "Service role manages waitlist"
ON public.waitlist
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger function: auto-add to waitlist when a user row is created
CREATE OR REPLACE FUNCTION public.handle_new_waitlist_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.waitlist (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire after a row is inserted in public.users
DROP TRIGGER IF EXISTS on_user_created_add_to_waitlist ON public.users;
CREATE TRIGGER on_user_created_add_to_waitlist
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_waitlist_entry();

-- Grant permissions so the auth trigger chain can reach waitlist
GRANT ALL ON public.waitlist TO supabase_auth_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

-- Postgres function: get a user's position + nearby neighbors
CREATE OR REPLACE FUNCTION public.get_waitlist_neighbors(
    p_user_id UUID,
    p_radius INT DEFAULT 2
)
RETURNS TABLE(
    "position" INT,
    username TEXT,
    "userId" UUID,
    "isCurrentUser" BOOLEAN
)
AS $$
DECLARE
    v_position INT;
BEGIN
    -- Get the caller's position
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
        (w.user_id = p_user_id) AS "isCurrentUser"
    FROM public.waitlist w
    JOIN public.users u ON u.user_id = w.user_id
    WHERE w.position BETWEEN v_position - p_radius AND v_position + p_radius
    ORDER BY w.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: add existing users to waitlist in order of their created_at
INSERT INTO public.waitlist (user_id)
SELECT user_id
FROM public.users
ORDER BY created_at ASC
ON CONFLICT (user_id) DO NOTHING;
