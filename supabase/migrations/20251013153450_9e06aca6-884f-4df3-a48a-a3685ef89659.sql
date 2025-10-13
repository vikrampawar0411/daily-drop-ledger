-- Clear all test/mock data from tables
TRUNCATE TABLE daily_deliveries CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE vendors CASCADE;
TRUNCATE TABLE societies CASCADE;
TRUNCATE TABLE areas CASCADE;
TRUNCATE TABLE vendor_customer_connections CASCADE;

-- Update profiles table to include name column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Update profiles table structure to ensure we have the right columns
-- Note: id, email, user_type already exist from previous migrations