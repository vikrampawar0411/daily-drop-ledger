-- Add updated_by_user_id column to orders table to track who updated the order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by_user_id UUID REFERENCES auth.users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_updated_by_user_id ON orders(updated_by_user_id);