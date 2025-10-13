-- Function to check if any admin exists in the system
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  );
$$;

-- Function to bootstrap first admin (can only be called if no admin exists)
CREATE OR REPLACE FUNCTION public.bootstrap_admin(admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if no admin exists yet
  IF admin_exists() THEN
    RAISE EXCEPTION 'An admin already exists in the system';
  END IF;
  
  -- Create admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile
  UPDATE profiles 
  SET user_type = 'admin' 
  WHERE id = admin_user_id;
END;
$$;