-- RLS policies for issuer_details: allow linked users to read/edit their own record

-- Allow issuers to read their own record via user_id
CREATE POLICY "Issuer can read own record"
    ON public.issuer_details
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow issuers to update their own profile fields (bio, social links, photo, headline)
CREATE POLICY "Issuer can update own record"
    ON public.issuer_details
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
