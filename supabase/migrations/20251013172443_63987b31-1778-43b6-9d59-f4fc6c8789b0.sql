-- Add created_by tracking fields to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_role text;

-- Add created_by tracking fields to vendors table
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_role text;

-- Add created_by tracking fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_role text;

-- Add created_by tracking fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_role text;

-- Create function to automatically link all active vendors to all customers
CREATE OR REPLACE FUNCTION create_vendor_customer_connections_for_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Link all active vendors to all active customers
  INSERT INTO vendor_customer_connections (vendor_id, customer_id)
  SELECT v.id, c.id
  FROM vendors v
  CROSS JOIN customers c
  WHERE v.is_active = true 
  AND c.is_active = true
  ON CONFLICT (vendor_id, customer_id) DO NOTHING;
END;
$$;

-- Run the function to create all connections
SELECT create_vendor_customer_connections_for_all();

-- Create trigger to automatically link new vendors to all customers
CREATE OR REPLACE FUNCTION auto_link_new_vendor_to_customers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Link the new vendor to all active customers
  INSERT INTO vendor_customer_connections (vendor_id, customer_id)
  SELECT NEW.id, c.id
  FROM customers c
  WHERE c.is_active = true
  ON CONFLICT (vendor_id, customer_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_link_new_vendor ON vendors;
CREATE TRIGGER trigger_auto_link_new_vendor
  AFTER INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_new_vendor_to_customers();

-- Create trigger to automatically link new customers to all vendors
CREATE OR REPLACE FUNCTION auto_link_new_customer_to_vendors()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Link the new customer to all active vendors
  INSERT INTO vendor_customer_connections (vendor_id, customer_id)
  SELECT v.id, NEW.id
  FROM vendors v
  WHERE v.is_active = true
  ON CONFLICT (vendor_id, customer_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_link_new_customer ON customers;
CREATE TRIGGER trigger_auto_link_new_customer
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_new_customer_to_vendors();

-- Fix vendor with null user_id
SELECT link_orphaned_records();