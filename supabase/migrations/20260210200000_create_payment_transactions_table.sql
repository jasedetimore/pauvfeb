-- Create payment_transactions table for Soap payment tracking
-- Tracks both deposits and withdrawals through the Soap checkout flow

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkout_id TEXT UNIQUE, -- Soap checkout session ID
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'succeeded', 'failed', 'held', 'expired', 'terminally_failed', 'returned', 'voided'
  )),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  balance_after NUMERIC, -- Balance after transaction completed
  failure_reason TEXT,
  provider_data JSONB, -- Raw Soap response data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
-- Index for checkout_id lookups (webhook processing)
CREATE INDEX idx_payment_transactions_checkout_id ON payment_transactions(checkout_id);
-- Index for status filtering
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
-- Index for type + status combo (common query pattern)
CREATE INDEX idx_payment_transactions_type_status ON payment_transactions(type, status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();

-- RLS Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment transactions
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payment transactions
CREATE POLICY "Users can insert own payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access to payment transactions"
  ON payment_transactions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
