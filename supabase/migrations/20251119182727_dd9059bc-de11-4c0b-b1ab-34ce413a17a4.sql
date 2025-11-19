-- Fix security warnings: Add search_path to functions

CREATE OR REPLACE FUNCTION reserve_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_product RECORD;
BEGIN
  SELECT vp.id, vp.stock_available, vp.in_stock, vp.price_override, 
         p.price as base_price, p.unit
  INTO v_vendor_product
  FROM vendor_products vp
  JOIN products p ON p.id = vp.product_id
  WHERE vp.id = NEW.vendor_product_id
    AND vp.is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor product not found or inactive';
  END IF;
  
  IF NOT v_vendor_product.in_stock THEN
    RAISE EXCEPTION 'Product is currently out of stock';
  END IF;
  
  IF v_vendor_product.stock_available < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
      v_vendor_product.stock_available, NEW.quantity;
  END IF;
  
  NEW.price_per_unit := COALESCE(v_vendor_product.price_override, v_vendor_product.base_price);
  NEW.total_amount := NEW.quantity * NEW.price_per_unit;
  NEW.unit := v_vendor_product.unit;
  
  UPDATE vendor_products
  SET stock_reserved = stock_reserved + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.vendor_product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_in_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.stock_quantity - NEW.stock_reserved) <= 0 THEN
    NEW.in_stock := false;
  END IF;
  
  NEW.last_stock_update := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;