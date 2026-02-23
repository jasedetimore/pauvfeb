-- Rate limiting log table for distributed rate limiting across serverless instances
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_rate_limit_log_lookup
  ON rate_limit_log (identifier, endpoint, created_at DESC);

-- Auto-cleanup: delete rows older than 1 hour via pg_cron
-- (Requires pg_cron extension, which is available on Supabase)
SELECT cron.schedule(
  'cleanup-rate-limit-log',
  '*/15 * * * *',
  $$DELETE FROM rate_limit_log WHERE created_at < now() - interval '1 hour'$$
);

-- RLS: only service_role should access this table
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;
