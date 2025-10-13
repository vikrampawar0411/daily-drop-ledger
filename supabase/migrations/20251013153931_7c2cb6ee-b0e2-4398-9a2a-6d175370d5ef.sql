-- Add user_id column to customers table to link with profiles
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add user_id column to vendors table to link with profiles  
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create unique constraints to ensure one profile per customer/vendor
ALTER TABLE customers ADD CONSTRAINT customers_user_id_unique UNIQUE (user_id);
ALTER TABLE vendors ADD CONSTRAINT vendors_user_id_unique UNIQUE (user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);