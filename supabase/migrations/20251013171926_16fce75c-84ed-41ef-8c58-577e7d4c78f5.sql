-- Create a function to link existing customer/vendor records to auth users by email
CREATE OR REPLACE FUNCTION link_orphaned_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- STEP 1: Create missing profiles for auth users FIRST
  INSERT INTO profiles (id, email, user_type, name)
  SELECT 
    au.id,
    au.email,
    CASE 
      WHEN EXISTS (SELECT 1 FROM customers c WHERE c.email = au.email) THEN 'customer'
      WHEN EXISTS (SELECT 1 FROM vendors v WHERE v.email = au.email) THEN 'vendor'
      ELSE 'customer'
    END,
    COALESCE(
      (SELECT name FROM customers WHERE email = au.email LIMIT 1),
      (SELECT contact_person FROM vendors WHERE email = au.email LIMIT 1),
      split_part(au.email, '@', 1)
    )
  FROM auth.users au
  WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id);
  
  -- STEP 2: Link customers to auth users by email
  UPDATE customers c
  SET user_id = au.id
  FROM auth.users au
  WHERE c.email = au.email 
  AND c.user_id IS NULL;
  
  -- STEP 3: Link vendors to auth users by email
  UPDATE vendors v
  SET user_id = au.id
  FROM auth.users au
  WHERE v.email = au.email 
  AND v.user_id IS NULL;
  
  -- STEP 4: Create missing user_roles
  INSERT INTO user_roles (user_id, role)
  SELECT 
    au.id,
    CASE 
      WHEN EXISTS (SELECT 1 FROM customers WHERE user_id = au.id) THEN 'customer'::app_role
      WHEN EXISTS (SELECT 1 FROM vendors WHERE user_id = au.id) THEN 'vendor'::app_role
      ELSE 'customer'::app_role
    END
  FROM auth.users au
  WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = au.id)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Run the function to fix existing data
SELECT link_orphaned_records();