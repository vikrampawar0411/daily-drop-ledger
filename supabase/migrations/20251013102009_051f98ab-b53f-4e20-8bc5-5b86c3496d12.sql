-- Add order tracking fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS placed_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS placed_by_role app_role;

-- Create vendor_customer_connections table to track relationships
CREATE TABLE IF NOT EXISTS vendor_customer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, customer_id)
);

-- Enable RLS on connections table
ALTER TABLE vendor_customer_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for connections
CREATE POLICY "Admins can manage all connections"
  ON vendor_customer_connections FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can view their connections"
  ON vendor_customer_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN profiles p ON p.email = v.email
      WHERE v.id = vendor_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their connections"
  ON vendor_customer_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN profiles p ON p.email = c.email
      WHERE c.id = customer_id AND p.id = auth.uid()
    )
  );

-- Update RLS policies for orders to support admin access
DROP POLICY IF EXISTS "Admins and staff can view all orders" ON orders;
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Update vendors RLS to allow admins
DROP POLICY IF EXISTS "Admins and staff can view all vendors" ON vendors;
CREATE POLICY "Admins can manage all vendors"
  ON vendors FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Update customers RLS to allow admins
DROP POLICY IF EXISTS "Admins and staff can view all customers" ON customers;
CREATE POLICY "Admins can manage all customers"
  ON customers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Update products RLS to allow admins
DROP POLICY IF EXISTS "Admins and staff can view all products" ON products;
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Function to create vendor-customer connection when order is placed
CREATE OR REPLACE FUNCTION create_vendor_customer_connection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create connection if both vendor_id and customer_id exist
  IF NEW.vendor_id IS NOT NULL AND NEW.customer_id IS NOT NULL THEN
    INSERT INTO vendor_customer_connections (vendor_id, customer_id)
    VALUES (NEW.vendor_id, NEW.customer_id)
    ON CONFLICT (vendor_id, customer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create connections
DROP TRIGGER IF EXISTS create_connection_on_order ON orders;
CREATE TRIGGER create_connection_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_vendor_customer_connection();