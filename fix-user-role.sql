-- First, let's see what users exist
SELECT id, email, raw_user_meta_data FROM auth.users;

-- Check user_roles table
SELECT * FROM user_roles;

-- Check profiles table
SELECT id, user_type FROM profiles;
