-- Clean up existing automatic vendor-customer connections
-- Purpose: Remove all auto-created connections from the database
-- Only keep connections that were created through actual orders or explicit requests

-- WARNING: This will remove all vendor-customer connections
-- If you want to preserve connections where orders exist, uncomment the alternative approach below

-- Option 1: Remove ALL connections (clean slate - customers must reconnect)
TRUNCATE TABLE vendor_customer_connections;

-- Option 2: Keep only connections where orders exist (commented out by default)
-- Uncomment the section below if you want to preserve connections with actual orders
/*
DELETE FROM vendor_customer_connections vcc
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.vendor_id = vcc.vendor_id 
  AND o.customer_id = vcc.customer_id
);
*/

-- Add a comment explaining the cleanup
COMMENT ON TABLE vendor_customer_connections IS 
'All automatic connections have been removed. 
Connections are now created only when:
1. Customer explicitly connects with a vendor
2. Customer places an order with a vendor
3. Admin manually creates a connection';
