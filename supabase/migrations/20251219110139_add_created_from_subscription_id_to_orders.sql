-- Add created_from_subscription_id column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS created_from_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_created_from_subscription_id 
ON orders(created_from_subscription_id);

-- Add a comment to document the column
COMMENT ON COLUMN orders.created_from_subscription_id IS 
'Reference to the subscription that created this order (if any). Used to track and manage subscription-generated orders.';
