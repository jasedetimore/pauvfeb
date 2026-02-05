-- Create issuer_requests table
-- Stores submissions from people who want to list themselves as issuers

CREATE TABLE IF NOT EXISTS public.issuer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    social_media_platform TEXT NOT NULL,
    social_media_handle TEXT NOT NULL,
    desired_ticker TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.issuer_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form submission)
CREATE POLICY "Anyone can submit an issuer request"
    ON public.issuer_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins can view/update/delete requests
CREATE POLICY "Admins can view issuer requests"
    ON public.issuer_requests
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "Admins can update issuer requests"
    ON public.issuer_requests
    FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "Admins can delete issuer requests"
    ON public.issuer_requests
    FOR DELETE
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Create indexes
CREATE INDEX idx_issuer_requests_email ON public.issuer_requests(email);
CREATE INDEX idx_issuer_requests_status ON public.issuer_requests(status);
CREATE INDEX idx_issuer_requests_desired_ticker ON public.issuer_requests(desired_ticker);

-- Add a comment to the table
COMMENT ON TABLE public.issuer_requests IS 'Stores issuer listing requests submitted via the List Yourself form';
