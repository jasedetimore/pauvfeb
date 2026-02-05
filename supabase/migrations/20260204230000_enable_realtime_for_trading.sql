-- Enable Supabase Realtime for issuer_trading table
-- This allows clients to subscribe to changes via Supabase Realtime

-- Add the table to the supabase_realtime publication
-- This is required for postgres_changes to work
ALTER PUBLICATION supabase_realtime ADD TABLE public.issuer_trading;

-- Optionally, also enable realtime for transactions (for activity feeds)
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Note: You can also enable this in the Supabase Dashboard:
-- Database > Replication > Select the tables to replicate
