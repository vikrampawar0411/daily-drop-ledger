-- Phase 1: Remove stock reservation system and implement time-based ordering

-- Drop existing triggers first (correct order)
DROP TRIGGER IF EXISTS trigger_reserve_stock ON orders;
DROP TRIGGER IF EXISTS trigger_release_stock ON orders;
DROP TRIGGER IF EXISTS reserve_stock_on_order ON orders;
DROP TRIGGER IF EXISTS release_stock_on_order_change ON orders;

-- Now drop the functions with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS reserve_stock_on_order() CASCADE;
DROP FUNCTION IF EXISTS release_stock_on_order_change() CASCADE;

-- Add order_type column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'auto' CHECK (order_type IN ('auto', 'request'));

-- Update status to support new workflow (keeping existing statuses for compatibility)
-- Status can now be: pending, pending_approval, accepted, rejected, delivered, cancelled

-- Create function to set order type based on subscribe_before time
CREATE OR REPLACE FUNCTION set_order_type_based_on_time()
RETURNS TRIGGER AS $$
DECLARE
  product_subscribe_before TIME;
  order_time TIME;
BEGIN
  -- Get the subscribe_before time from the product
  SELECT subscribe_before INTO product_subscribe_before
  FROM products
  WHERE id = NEW.product_id;
  
  -- Get current time
  order_time := CURRENT_TIME;
  
  -- If subscribe_before is set and current time is past it, mark as request
  IF product_subscribe_before IS NOT NULL AND order_time > product_subscribe_before THEN
    NEW.order_type := 'request';
    NEW.status := 'pending_approval';
  ELSE
    NEW.order_type := 'auto';
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-set order type on insert
CREATE TRIGGER set_order_type_on_insert
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_type_based_on_time();

-- Add index for faster queries on order_type
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_status_vendor ON orders(status, vendor_id);

-- Add comment for documentation
COMMENT ON COLUMN orders.order_type IS 'Type of order: auto (before subscribe_before time) or request (after subscribe_before time, requires vendor approval)';

-- Reset stock_reserved for all vendor_products (since we're removing stock blocking)
UPDATE vendor_products SET stock_reserved = 0;