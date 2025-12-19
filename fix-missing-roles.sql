-- Fix missing user roles by ensuring user_roles table has entries for all users
-- This script will create missing user_roles entries based on profiles.user_type

-- Insert missing user_roles from profiles
INSERT INTO user_roles (user_id, role)
SELECT p.id, p.user_type
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.user_id IS NULL 
  AND p.user_type IS NOT NULL;

-- For any users without profiles or user_type, check vendors table
INSERT INTO user_roles (user_id, role)
SELECT v.user_id, 'vendor'::text
FROM vendors v
LEFT JOIN user_roles ur ON ur.user_id = v.user_id
WHERE ur.user_id IS NULL;

-- For any users without profiles or user_type, check customers table
INSERT INTO user_roles (user_id, role)
SELECT c.user_id, 'customer'::text
FROM customers c
LEFT JOIN user_roles ur ON ur.user_id = c.user_id
WHERE ur.user_id IS NULL;

-- Display results
SELECT 
  u.email,
  COALESCE(ur.role, p.user_type, 'NO ROLE') as role,
  CASE 
    WHEN v.user_id IS NOT NULL THEN 'Has vendor record'
    WHEN c.user_id IS NOT NULL THEN 'Has customer record'
    ELSE 'No vendor/customer record'
  END as record_status
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN vendors v ON v.user_id = u.id
LEFT JOIN customers c ON c.user_id = u.id
ORDER BY u.created_at DESC;
