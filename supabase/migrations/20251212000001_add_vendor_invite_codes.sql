-- ============================================================================
-- Migration: Add Vendor Invite Codes System
-- Purpose: Enable secure vendor-customer connections via invite codes, QR codes, or shareable links
-- 
-- This migration creates the infrastructure for vendors to generate unique invite codes
-- that customers can use to establish connections. Supports multiple connection methods:
-- - QR code scanning
-- - Manual code entry (e.g., VEN-ABC123)
-- - Shareable link clicking
-- 
-- Key Features:
-- - Unique 8-character codes per vendor
-- - Optional expiry dates for time-limited codes
-- - Usage tracking (max uses and current usage count)
-- - Active/inactive toggle for code management
-- - Connection method tracking for analytics
-- ============================================================================

-- ============================================================================
-- STEP 1: Create vendor_invite_codes table
-- ============================================================================

-- Table to store vendor-generated invite codes
-- Each vendor can create multiple codes with different settings (expiry, usage limits)
CREATE TABLE IF NOT EXISTS vendor_invite_codes (
  -- Primary key: unique identifier for each invite code
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key: which vendor created this code
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Unique 8-character code (e.g., VEN-ABC12345)
  -- Format: uppercase letters and numbers for easy reading/typing
  code TEXT NOT NULL UNIQUE,
  
  -- Human-readable label for the code (optional)
  -- Example: "New Year Promo", "Society XYZ", "Walk-in Customers"
  label TEXT,
  
  -- Optional expiry date (NULL means never expires)
  -- Vendors can create time-limited codes for promotions or events
  expires_at TIMESTAMPTZ,
  
  -- Maximum number of times this code can be used (NULL means unlimited)
  -- Useful for limiting codes to specific number of customers
  max_uses INTEGER,
  
  -- Current count of how many times this code has been used
  -- Automatically incremented when a customer uses the code
  used_count INTEGER DEFAULT 0,
  
  -- Whether this code is currently active
  -- Vendors can deactivate codes without deleting them (preserves history)
  is_active BOOLEAN DEFAULT true,
  
  -- Audit trail: when was this code created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit trail: when was this code last modified
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Add connection_method to vendor_customer_connections
-- ============================================================================

-- Add enum type for tracking how the connection was established
-- This helps vendors understand which connection methods are most effective
DO $$ BEGIN
  CREATE TYPE connection_method_enum AS ENUM (
    'invite_code',    -- Customer entered a code manually
    'qr_scan',        -- Customer scanned a QR code
    'shared_link',    -- Customer clicked a shareable link
    'first_order'     -- Legacy: auto-connected when placing first order
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to track connection method and which invite code was used
ALTER TABLE vendor_customer_connections
  ADD COLUMN IF NOT EXISTS connection_method connection_method_enum,
  ADD COLUMN IF NOT EXISTS invite_code_id UUID REFERENCES vendor_invite_codes(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

-- Index on code for fast lookup when customer enters/scans code
CREATE INDEX IF NOT EXISTS idx_vendor_invite_codes_code 
  ON vendor_invite_codes(code) 
  WHERE is_active = true;

-- Index on vendor_id for listing a vendor's codes
CREATE INDEX IF NOT EXISTS idx_vendor_invite_codes_vendor 
  ON vendor_invite_codes(vendor_id) 
  WHERE is_active = true;

-- Index on connection method for analytics
CREATE INDEX IF NOT EXISTS idx_connections_method 
  ON vendor_customer_connections(connection_method);

-- Index on invite_code_id to track which code generated which connections
CREATE INDEX IF NOT EXISTS idx_connections_invite_code 
  ON vendor_customer_connections(invite_code_id);

-- ============================================================================
-- STEP 4: Create RLS policies for vendor_invite_codes
-- ============================================================================

-- Enable RLS on the new table
ALTER TABLE vendor_invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all invite codes
CREATE POLICY "Admins can manage all invite codes"
  ON vendor_invite_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Vendors can view their own invite codes
CREATE POLICY "Vendors can view own invite codes"
  ON vendor_invite_codes
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can create new invite codes
CREATE POLICY "Vendors can create invite codes"
  ON vendor_invite_codes
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can update their own invite codes (deactivate, change label, etc.)
CREATE POLICY "Vendors can update own invite codes"
  ON vendor_invite_codes
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can delete their own invite codes
CREATE POLICY "Vendors can delete own invite codes"
  ON vendor_invite_codes
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Policy: Customers (and anonymous users during signup) can view active, non-expired codes
-- This allows validation when a customer enters a code
CREATE POLICY "Anyone can validate active codes"
  ON vendor_invite_codes
  FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses)
  );

-- ============================================================================
-- STEP 5: Create function to generate unique invite codes
-- ============================================================================

-- Function to generate a random 8-character alphanumeric code
-- Format: VEN-XXXXXXXX (where X = A-Z or 0-9)
-- Ensures uniqueness by checking against existing codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Character set: uppercase letters and numbers (excludes confusing chars like O, 0, I, 1)
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT;
  done BOOLEAN := false;
BEGIN
  -- Keep generating codes until we get a unique one
  WHILE NOT done LOOP
    -- Generate 8 random characters
    result := 'VEN-' || (
      SELECT string_agg(
        substr(chars, floor(random() * length(chars) + 1)::int, 1),
        ''
      )
      FROM generate_series(1, 8)
    );
    
    -- Check if this code already exists
    done := NOT EXISTS (
      SELECT 1 FROM vendor_invite_codes WHERE code = result
    );
  END LOOP;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- STEP 6: Create function to validate and use invite codes
-- ============================================================================

-- Function to validate an invite code and create a vendor-customer connection
-- Returns JSON with success status and vendor details or error message
CREATE OR REPLACE FUNCTION validate_and_use_invite_code(
  p_code TEXT,
  p_customer_id UUID,
  p_connection_method connection_method_enum
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite_code vendor_invite_codes%ROWTYPE;
  v_vendor vendors%ROWTYPE;
  v_existing_connection UUID;
BEGIN
  -- Step 1: Validate the invite code
  SELECT * INTO v_invite_code
  FROM vendor_invite_codes
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);
  
  -- Check if code exists and is valid
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invite code'
    );
  END IF;
  
  -- Step 2: Get vendor details
  SELECT * INTO v_vendor
  FROM vendors
  WHERE id = v_invite_code.vendor_id
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vendor not found or inactive'
    );
  END IF;
  
  -- Step 3: Check if connection already exists
  SELECT id INTO v_existing_connection
  FROM vendor_customer_connections
  WHERE vendor_id = v_invite_code.vendor_id
    AND customer_id = p_customer_id;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You are already connected to this vendor'
    );
  END IF;
  
  -- Step 4: Create the connection
  INSERT INTO vendor_customer_connections (
    vendor_id,
    customer_id,
    connection_method,
    invite_code_id
  ) VALUES (
    v_invite_code.vendor_id,
    p_customer_id,
    p_connection_method,
    v_invite_code.id
  );
  
  -- Step 5: Increment the usage count for this invite code
  UPDATE vendor_invite_codes
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = v_invite_code.id;
  
  -- Step 6: Return success with vendor details
  RETURN json_build_object(
    'success', true,
    'vendor', json_build_object(
      'id', v_vendor.id,
      'name', v_vendor.name,
      'category', v_vendor.category,
      'phone', v_vendor.phone
    )
  );
END;
$$;

-- ============================================================================
-- STEP 7: Add helpful comments for documentation
-- ============================================================================

COMMENT ON TABLE vendor_invite_codes IS 
'Stores vendor-generated invite codes for secure customer connections. 
Vendors create codes to share via QR, link, or manually. Tracks usage and supports expiry.';

COMMENT ON FUNCTION generate_invite_code IS 
'Generates a unique 8-character invite code in format VEN-XXXXXXXX. 
Uses only uppercase letters and numbers, excluding confusing characters.';

COMMENT ON FUNCTION validate_and_use_invite_code IS 
'Validates an invite code and creates a vendor-customer connection.
Returns JSON with success status and vendor details or error message.
Automatically increments usage count when successful.';
