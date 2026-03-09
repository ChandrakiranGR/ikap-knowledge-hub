
-- Create admin_emails table for allowlist
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(check_email)
  )
$$;

-- Seed the initial admin emails
INSERT INTO public.admin_emails (email) VALUES
  ('guthavariramesh.c@northeastern.edu'),
  ('sugurushetty.s@northeastern.edu'),
  ('bhadrappanavar.p@northeastern.edu');
