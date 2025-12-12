-- ============================================================================
-- Migration: Public Invite Code Validation
-- ============================================================================
-- Purpose: Allow public (unauthenticated) users to validate invite codes
--          and see vendor preview information for hassle-free connections
-- ============================================================================

-- STEP 1: Add public read policy for invite codes (validation only)
-- This allows anyone to check if a code is valid without authentication
DROP POLICY IF EXISTS "Anyone can validate active codes" ON vendor_invite_codes;

CREATE POLICY "Public can validate active invite codes"
  ON vendor_invite_codes FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses)
  );

-- STEP 2: Create RPC function for safe vendor preview
-- This function validates a code and returns ONLY public vendor info
-- No sensitive data (customer lists, internal IDs, etc.) is exposed
CREATE OR REPLACE FUNCTION validate_invite_code_preview(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator's privileges to bypass RLS
AS $$
DECLARE
  v_invite_code vendor_invite_codes%ROWTYPE;
  v_vendor vendors%ROWTYPE;
BEGIN
  -- Fetch the invite code
  SELECT * INTO v_invite_code
  FROM vendor_invite_codes
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);
  
  -- If code not found or invalid
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid or expired invite code');
  END IF;
  
  -- Fetch vendor public information
  SELECT * INTO v_vendor 
  FROM vendors 
  WHERE id = v_invite_code.vendor_id 
    AND is_active = true;
  
  -- If vendor not found or inactive
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Vendor not found or inactive');
  END IF;
  
  -- Return ONLY public vendor information (safe for unauthenticated users)
  RETURN json_build_object(
    'id', v_vendor.id,
    'name', v_vendor.name,
    'category', v_vendor.category,
    'phone', v_vendor.phone,
    'address', v_vendor.address,
    'business_email', v_vendor.business_email
  );
END;
$$;

-- STEP 3: Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION validate_invite_code_preview(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_invite_code_preview(TEXT) TO authenticated;

-- Success message
SELECT 'Public invite code validation enabled! ✅' as status;

-- ============================================================================
-- TESTING
-- ============================================================================
-- To test this migration:
-- 
-- 1. Create an invite code as a vendor
-- 2. Logout (or use incognito mode)
-- 3. Visit: /connect?code=VEN-XXXXXXXX
-- 4. Should see vendor preview WITHOUT login prompt
-- 5. Click connect → redirected to signup/login
-- 6. After auth → automatically connected
-- ============================================================================
