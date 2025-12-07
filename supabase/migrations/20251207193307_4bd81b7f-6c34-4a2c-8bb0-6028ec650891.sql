-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create function to get email by username
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE username = _username LIMIT 1;
$$;