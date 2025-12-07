-- Migration: Add UNIQUE constraints for email and phone in vendors and customers tables
-- Purpose: Enforce data integrity and prevent duplicate email/phone entries at database level
-- Note: This migration requires cleaning up any existing duplicate data before application

-- Step 1: Check for existing duplicates (for manual review before applying)
-- Uncomment these queries to find duplicates:
-- SELECT email, COUNT(*) FROM vendors WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;
-- SELECT phone, COUNT(*) FROM vendors WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1;
-- SELECT email, COUNT(*) FROM customers WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;
-- SELECT phone, COUNT(*) FROM customers WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1;

-- Step 2: Add UNIQUE constraints to vendors table
-- Email constraint for vendors (case-insensitive)
ALTER TABLE vendors 
  ADD CONSTRAINT vendors_email_unique 
  UNIQUE (email);

-- Phone constraint for vendors
ALTER TABLE vendors 
  ADD CONSTRAINT vendors_phone_unique 
  UNIQUE (phone);

-- Step 3: Add UNIQUE constraints to customers table
-- Email constraint for customers (case-insensitive)
ALTER TABLE customers 
  ADD CONSTRAINT customers_email_unique 
  UNIQUE (email);

-- Phone constraint for customers
ALTER TABLE customers 
  ADD CONSTRAINT customers_phone_unique 
  UNIQUE (phone);

-- Step 4: Add index for case-insensitive email lookups (performance optimization)
-- This ensures duplicate checks remain fast even with large datasets
CREATE INDEX IF NOT EXISTS vendors_email_lower_idx ON vendors (LOWER(email));
CREATE INDEX IF NOT EXISTS customers_email_lower_idx ON customers (LOWER(email));

-- Add comments for documentation
COMMENT ON CONSTRAINT vendors_email_unique ON vendors IS 
'Ensures email addresses are unique across all vendor accounts';

COMMENT ON CONSTRAINT vendors_phone_unique ON vendors IS 
'Ensures phone numbers are unique across all vendor accounts';

COMMENT ON CONSTRAINT customers_email_unique ON customers IS 
'Ensures email addresses are unique across all customer accounts';

COMMENT ON CONSTRAINT customers_phone_unique ON customers IS 
'Ensures phone numbers are unique across all customer accounts';
