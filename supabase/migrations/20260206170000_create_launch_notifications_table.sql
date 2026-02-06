-- Table to store email signups for issuer launch notifications
CREATE TABLE IF NOT EXISTS public.launch_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ticker TEXT NOT NULL REFERENCES public.issuer_details(ticker) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, ticker)
);

-- RLS
ALTER TABLE public.launch_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public signup)
CREATE POLICY "Anyone can sign up for launch notifications"
  ON public.launch_notifications
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read launch notifications"
  ON public.launch_notifications
  FOR SELECT
  USING (
    (SELECT is_admin() )
  );
