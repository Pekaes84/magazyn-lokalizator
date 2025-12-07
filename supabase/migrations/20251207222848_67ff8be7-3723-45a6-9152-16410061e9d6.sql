-- Update get_email_by_username function to generate email from username
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
BEGIN
  -- Find the user by username in profiles and get the corresponding email from auth.users
  SELECT au.email INTO user_email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE LOWER(p.username) = LOWER(_username);
  
  RETURN user_email;
END;
$$;