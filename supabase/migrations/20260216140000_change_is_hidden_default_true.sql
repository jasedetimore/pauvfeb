-- Change default of is_hidden to TRUE so newly approved issuers start hidden.
-- An admin must explicitly unhide them before they appear on the site.

ALTER TABLE public.issuer_details
  ALTER COLUMN is_hidden SET DEFAULT TRUE;
