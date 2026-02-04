-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    description TEXT,
    number_of_issuers INTEGER NOT NULL DEFAULT 0 CHECK (number_of_issuers >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Index to speed up tag lookups
CREATE INDEX IF NOT EXISTS idx_tags_tag ON public.tags(tag);

-- Allow public read access
CREATE POLICY "Allow public read access to tags"
ON public.tags
FOR SELECT
TO public
USING (true);
