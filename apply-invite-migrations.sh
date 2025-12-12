#!/bin/bash

# ============================================================================
# Script to apply vendor invite codes migrations to Supabase
# ============================================================================

echo "📋 Vendor Invite Codes - Migration Guide"
echo "=========================================="
echo ""
echo "⚠️  You need to apply these SQL migrations to your Supabase database"
echo ""
echo "🔗 Steps:"
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your project: daily-drop-ledger"
echo "3. Click: SQL Editor (left sidebar)"
echo "4. Click: New Query"
echo "5. Copy the SQL below and paste it into the editor"
echo "6. Click: Run (or press Ctrl+Enter)"
echo ""
echo "=========================================="
echo ""
echo "📄 MIGRATION 1: Add Vendor Invite Codes System"
echo ""
echo "Copy this entire SQL block:"
echo ""
echo "----------------------------------------"

cat << 'EOF'
-- ============================================================================
-- Migration: Add Vendor Invite Codes System
-- ============================================================================

-- STEP 1: Create vendor_invite_codes table
CREATE TABLE IF NOT EXISTS vendor_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Add connection_method enum and columns
DO $$ BEGIN
  CREATE TYPE connection_method_enum AS ENUM (
    'invite_code',
    'qr_scan',
    'shared_link',
    'first_order'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE vendor_customer_connections
  ADD COLUMN IF NOT EXISTS connection_method connection_method_enum,
  ADD COLUMN IF NOT EXISTS invite_code_id UUID REFERENCES vendor_invite_codes(id) ON DELETE SET NULL;

-- STEP 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_invite_codes_code 
  ON vendor_invite_codes(code) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_vendor_invite_codes_vendor 
  ON vendor_invite_codes(vendor_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_connections_method 
  ON vendor_customer_connections(connection_method);

CREATE INDEX IF NOT EXISTS idx_connections_invite_code 
  ON vendor_customer_connections(invite_code_id);

-- STEP 4: Enable RLS
ALTER TABLE vendor_invite_codes ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS policies
CREATE POLICY "Admins can manage all invite codes"
  ON vendor_invite_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Vendors can view own invite codes"
  ON vendor_invite_codes FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create invite codes"
  ON vendor_invite_codes FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own invite codes"
  ON vendor_invite_codes FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete own invite codes"
  ON vendor_invite_codes FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can validate active codes"
  ON vendor_invite_codes FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses)
  );

-- STEP 6: Create function to generate codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT;
  done BOOLEAN := false;
BEGIN
  WHILE NOT done LOOP
    result := 'VEN-' || (
      SELECT string_agg(
        substr(chars, floor(random() * length(chars) + 1)::int, 1),
        ''
      )
      FROM generate_series(1, 8)
    );
    done := NOT EXISTS (
      SELECT 1 FROM vendor_invite_codes WHERE code = result
    );
  END LOOP;
  RETURN result;
END;
$$;

-- STEP 7: Create function to validate and use codes
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
  SELECT * INTO v_invite_code
  FROM vendor_invite_codes
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;
  
  SELECT * INTO v_vendor FROM vendors WHERE id = v_invite_code.vendor_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Vendor not found or inactive');
  END IF;
  
  SELECT id INTO v_existing_connection
  FROM vendor_customer_connections
  WHERE vendor_id = v_invite_code.vendor_id AND customer_id = p_customer_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You are already connected to this vendor');
  END IF;
  
  INSERT INTO vendor_customer_connections (vendor_id, customer_id, connection_method, invite_code_id)
  VALUES (v_invite_code.vendor_id, p_customer_id, p_connection_method, v_invite_code.id);
  
  UPDATE vendor_invite_codes SET used_count = used_count + 1, updated_at = NOW()
  WHERE id = v_invite_code.id;
  
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

-- Success message
SELECT 'Migration 1 completed successfully! ✅' as status;
EOF

echo "----------------------------------------"
echo ""
echo ""
echo "📄 MIGRATION 2: Update Customer Privacy"
echo ""
echo "After running Migration 1, run this:"
echo ""
echo "----------------------------------------"

cat << 'EOF'
-- ============================================================================
-- Migration: Update Customer Privacy RLS Policies
-- ============================================================================

-- Create index
CREATE INDEX IF NOT EXISTS idx_connections_vendor_customer_status 
  ON vendor_customer_connections(vendor_id, customer_id);

-- Drop old policies
DROP POLICY IF EXISTS "Vendors can view customers" ON customers;
DROP POLICY IF EXISTS "Vendors can view all customers" ON customers;
DROP POLICY IF EXISTS "Vendors can view their connected customers" ON customers;

-- Create new policies
DROP POLICY IF EXISTS "Customers can view own profile" ON customers;
CREATE POLICY "Customers can view own profile"
  ON customers FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own profile" ON customers;
CREATE POLICY "Customers can update own profile"
  ON customers FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can view connected customers only" ON customers;
CREATE POLICY "Vendors can view connected customers only"
  ON customers FOR SELECT
  USING (
    id IN (
      SELECT customer_id FROM vendor_customer_connections
      WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

-- Success message
SELECT 'Migration 2 completed successfully! ✅' as status;
EOF

echo "----------------------------------------"
echo ""
echo "✅ After running both migrations:"
echo "   1. Refresh your browser at http://localhost:8080/"
echo "   2. Login as vendor"
echo "   3. Scroll to bottom of dashboard"
echo "   4. You should see 'Invite Codes' section"
echo ""
echo "📖 Need help? Check TESTING_GUIDE_INVITE_CODES.md"
echo ""
