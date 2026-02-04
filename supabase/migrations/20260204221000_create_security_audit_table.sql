-- Migration: Create security_audit table for tracking all admin actions
-- This table logs every action taken on the admin subdomain

CREATE TABLE IF NOT EXISTS public.security_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Timestamp of the action
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- The admin who performed the action
    admin_id UUID NOT NULL,
    
    -- Type of action performed
    action TEXT NOT NULL,
    
    -- The table that was affected
    target_table TEXT NOT NULL,
    
    -- The ID of the record that was affected (stored as text for flexibility)
    target_id TEXT,
    
    -- The old value before the change (JSONB for flexibility)
    old_value JSONB,
    
    -- The new value after the change (JSONB for flexibility)
    new_value JSONB,
    
    -- Additional context/metadata about the action
    metadata JSONB DEFAULT '{}',
    
    -- IP address of the requester (if available)
    ip_address INET,
    
    -- User agent string (if available)
    user_agent TEXT,
    
    -- Request ID for tracing
    request_id TEXT,
    
    -- Foreign key to auth.users
    CONSTRAINT fk_security_audit_admin_id 
        FOREIGN KEY (admin_id) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX idx_security_audit_timestamp ON public.security_audit(timestamp DESC);
CREATE INDEX idx_security_audit_admin_id ON public.security_audit(admin_id);
CREATE INDEX idx_security_audit_action ON public.security_audit(action);
CREATE INDEX idx_security_audit_target_table ON public.security_audit(target_table);
CREATE INDEX idx_security_audit_target_id ON public.security_audit(target_id);

-- Add a comment to the table
COMMENT ON TABLE public.security_audit IS 'Audit log for all admin actions on sensitive tables';

-- RLS Policy: Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit
FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- RLS Policy: Service role has full access for inserting audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.security_audit
FOR INSERT
TO service_role
WITH CHECK (true);

-- RLS Policy: Service role can read all audit logs
CREATE POLICY "Service role can read audit logs"
ON public.security_audit
FOR SELECT
TO service_role
USING (true);

-- Prevent deletion of audit logs (immutable audit trail)
CREATE POLICY "No one can delete audit logs"
ON public.security_audit
FOR DELETE
TO authenticated
USING (false);

-- Prevent updates to audit logs (immutable audit trail)
CREATE POLICY "No one can update audit logs"
ON public.security_audit
FOR UPDATE
TO authenticated
USING (false);

-- Function to log an audit entry (for use in triggers and functions)
CREATE OR REPLACE FUNCTION public.log_audit_entry(
    p_admin_id UUID,
    p_action TEXT,
    p_target_table TEXT,
    p_target_id TEXT DEFAULT NULL,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.security_audit (
        admin_id,
        action,
        target_table,
        target_id,
        old_value,
        new_value,
        metadata,
        ip_address,
        user_agent,
        request_id
    ) VALUES (
        p_admin_id,
        p_action,
        p_target_table,
        p_target_id,
        p_old_value,
        p_new_value,
        p_metadata,
        p_ip_address,
        p_user_agent,
        p_request_id
    )
    RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;

-- Grant execute on the logging function to service_role
REVOKE EXECUTE ON FUNCTION public.log_audit_entry FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_entry TO service_role;

-- Comment on the function
COMMENT ON FUNCTION public.log_audit_entry IS 'Logs an entry to the security_audit table. Should only be called by service_role.';
