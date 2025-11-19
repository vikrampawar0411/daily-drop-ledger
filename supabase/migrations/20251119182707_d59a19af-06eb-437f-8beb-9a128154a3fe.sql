-- MIGRATION: Stock Management & Order-VendorProduct Linkage
-- Part 1: Add unique constraint (CRITICAL - prevents race conditions)

ALTER TABLE vendor_products
ADD CONSTRAINT vendor_products_vendor_product_unique UNIQUE (vendor_id, product_id);

CREATE INDEX idx_vendor_products_lookup ON vendor_products(vendor_id, product_id) 
WHERE is_active = true;

-- Part 2: Add stock management columns
ALTER TABLE vendor_products
ADD COLUMN stock_quantity NUMERIC DEFAULT 0 CHECK (stock_quantity >= 0),
ADD COLUMN stock_reserved NUMERIC DEFAULT 0 CHECK (stock_reserved >= 0),
ADD COLUMN stock_available NUMERIC GENERATED ALWAYS AS (stock_quantity - stock_reserved) STORED,
ADD COLUMN in_stock BOOLEAN DEFAULT true,
ADD COLUMN last_stock_update TIMESTAMPTZ DEFAULT now();

CREATE INDEX idx_vendor_products_stock_status ON vendor_products(vendor_id, in_stock, stock_available)
WHERE is_active = true;

-- Part 3: Add vendor_product_id to orders table
ALTER TABLE orders
ADD COLUMN vendor_product_id UUID;

-- Backfill existing orders
UPDATE orders o
SET vendor_product_id = vp.id
FROM vendor_products vp
WHERE o.vendor_id = vp.vendor_id 
  AND o.product_id = vp.product_id;

-- Make it required after backfill
ALTER TABLE orders
ALTER COLUMN vendor_product_id SET NOT NULL,
ADD CONSTRAINT orders_vendor_product_fkey 
  FOREIGN KEY (vendor_product_id) 
  REFERENCES vendor_products(id) 
  ON DELETE RESTRICT;

CREATE INDEX idx_orders_vendor_product ON orders(vendor_product_id);

-- Part 4: Create product_change_history table
CREATE TABLE product_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  changed_by_user_id UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('price', 'details', 'status')),
  old_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  applied_to_orders TEXT NOT NULL CHECK (applied_to_orders IN ('none', 'pending', 'all')),
  affected_orders_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_change_history_product ON product_change_history(product_id, created_at DESC);
CREATE INDEX idx_product_change_history_user ON product_change_history(changed_by_user_id);

ALTER TABLE product_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all history"
ON product_change_history FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert history"
ON product_change_history FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Part 5: Update RLS policies for vendor_products
CREATE POLICY "Vendors can update their product stock and price"
ON vendor_products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
);

-- Part 6: Stock reservation function with proper locking
CREATE OR REPLACE FUNCTION reserve_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_product RECORD;
BEGIN
  -- Lock and fetch vendor_product (prevents race conditions)
  SELECT vp.id, vp.stock_available, vp.in_stock, vp.price_override, 
         p.price as base_price, p.unit
  INTO v_vendor_product
  FROM vendor_products vp
  JOIN products p ON p.id = vp.product_id
  WHERE vp.id = NEW.vendor_product_id
    AND vp.is_active = true
  FOR UPDATE;
  
  -- Validate vendor product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor product not found or inactive';
  END IF;
  
  -- Validate stock status
  IF NOT v_vendor_product.in_stock THEN
    RAISE EXCEPTION 'Product is currently out of stock';
  END IF;
  
  -- Validate sufficient quantity
  IF v_vendor_product.stock_available < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
      v_vendor_product.stock_available, NEW.quantity;
  END IF;
  
  -- Set price from vendor_product
  NEW.price_per_unit := COALESCE(v_vendor_product.price_override, v_vendor_product.base_price);
  NEW.total_amount := NEW.quantity * NEW.price_per_unit;
  NEW.unit := v_vendor_product.unit;
  
  -- Reserve the stock
  UPDATE vendor_products
  SET stock_reserved = stock_reserved + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.vendor_product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_reserve_stock ON orders;
CREATE TRIGGER trigger_reserve_stock
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION reserve_stock_on_order();

-- Part 7: Release stock function
CREATE OR REPLACE FUNCTION release_stock_on_order_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
    
    UPDATE vendor_products
    SET stock_reserved = GREATEST(0, stock_reserved - OLD.quantity),
        updated_at = now()
    WHERE id = OLD.vendor_product_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_release_stock_delete ON orders;
CREATE TRIGGER trigger_release_stock_delete
AFTER DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION release_stock_on_order_change();

DROP TRIGGER IF EXISTS trigger_release_stock_cancel ON orders;
CREATE TRIGGER trigger_release_stock_cancel
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
EXECUTE FUNCTION release_stock_on_order_change();

-- Part 8: Auto-update in_stock status
CREATE OR REPLACE FUNCTION update_in_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.stock_quantity - NEW.stock_reserved) <= 0 THEN
    NEW.in_stock := false;
  END IF;
  
  NEW.last_stock_update := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_in_stock ON vendor_products;
CREATE TRIGGER trigger_update_in_stock
BEFORE UPDATE OF stock_quantity, stock_reserved ON vendor_products
FOR EACH ROW
WHEN (NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity 
   OR NEW.stock_reserved IS DISTINCT FROM OLD.stock_reserved)
EXECUTE FUNCTION update_in_stock_status();