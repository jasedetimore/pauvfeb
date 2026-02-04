-- Add unique constraint on ticker column in issuer_details
-- This is required for foreign key references from other tables

ALTER TABLE public.issuer_details 
ADD CONSTRAINT issuer_details_ticker_unique UNIQUE (ticker);
