-- Step 1: Insert missing user_roles based on profiles.user_type
INSERT INTO public.user_roles (user_id, role)
SELECT 
  p.id as user_id,
  p.user_type::app_role as role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.id IS NULL
  AND p.user_type IS NOT NULL
  AND p.user_type IN ('admin', 'vendor', 'customer', 'staff')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Update handle_new_user trigger to also create customer/vendor records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  user_role_type app_role;
  user_name text;
BEGIN
  user_role_type := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'customer'::app_role
  );

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'contactPerson',
    split_part(NEW.email, '@', 1)
  );

  -- Insert profile
  INSERT INTO public.profiles (id, email, user_type, name)
  VALUES (NEW.id, NEW.email, user_role_type::text, user_name)
  ON CONFLICT (id) DO NOTHING;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_type)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create customer record if role is customer
  IF user_role_type = 'customer' THEN
    INSERT INTO public.customers (
      user_id, name, phone, email, address,
      created_by_user_id, created_by_role
    )
    VALUES (
      NEW.id, 
      user_name,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email,
      'Address pending',
      NEW.id, 
      'customer'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create vendor record if role is vendor
  IF user_role_type = 'vendor' THEN
    INSERT INTO public.vendors (
      user_id, name, category, contact_person,
      phone, email, address,
      created_by_user_id, created_by_role
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'businessName', user_name),
      COALESCE(NEW.raw_user_meta_data->>'category', 'Other'),
      user_name,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email,
      'Address pending',
      NEW.id, 
      'vendor'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 3: Create complete_customer_signup RPC function
CREATE OR REPLACE FUNCTION public.complete_customer_signup(
  p_area_id uuid,
  p_society_id uuid,
  p_wing_number text,
  p_flat_plot_house_number text,
  p_full_address text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE customers
  SET 
    area_id = p_area_id,
    society_id = p_society_id,
    wing_number = p_wing_number,
    flat_plot_house_number = p_flat_plot_house_number,
    address = p_full_address
  WHERE user_id = auth.uid();
END;
$$;