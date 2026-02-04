-- Add RLS policy to allow public read access to issuer_details
-- This policy allows anyone (including anonymous users) to SELECT from the table

CREATE POLICY "Allow public read access to issuer_details"
ON public.issuer_details
FOR SELECT
TO public
USING (true);
