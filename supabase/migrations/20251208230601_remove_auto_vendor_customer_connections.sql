-- Remove automatic vendor-customer connection triggers
-- Purpose: Stop auto-connecting new customers to all vendors
-- Connections should only be created when customer explicitly requests vendor services

-- Drop the trigger that auto-links new customers to all vendors
DROP TRIGGER IF EXISTS trigger_auto_link_new_customer ON customers;

-- Drop the trigger that auto-links new vendors to all customers
DROP TRIGGER IF EXISTS trigger_auto_link_new_vendor ON vendors;

-- Drop the associated functions
DROP FUNCTION IF EXISTS auto_link_new_customer_to_vendors();
DROP FUNCTION IF EXISTS auto_link_new_vendor_to_customers();

-- Drop the bulk connection function (no longer needed)
DROP FUNCTION IF EXISTS create_vendor_customer_connections_for_all();

-- Add comment to the table explaining the new behavior
COMMENT ON TABLE vendor_customer_connections IS 
'Vendor-customer connections are now created only when:
1. Customer explicitly requests to connect with a vendor
2. Customer places an order with a vendor
3. Admin manually creates a connection
Automatic connections on signup have been removed.';
