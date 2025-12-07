-- Migration: Add RPC function for duplicate email/phone checking during signup
-- Purpose: Allows anonymous users to check if email or phone already exists in vendors or customers tables
-- This prevents duplicate accounts and provides real-time validation feedback during signup

-- Create function to check if email or phone number already exists
CREATE OR REPLACE FUNCTION check_email_phone_exists(
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_exists BOOLEAN := FALSE;
  v_phone_exists BOOLEAN := FALSE;
  v_exists_in_table TEXT := NULL;
  v_result JSON;
BEGIN
  -- Check for email in vendors table
  IF p_email IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM vendors WHERE LOWER(email) = LOWER(p_email)
    ) INTO v_email_exists;
    
    -- If email exists in vendors, set the table name
    IF v_email_exists THEN
      v_exists_in_table := 'vendors';
    ELSE
      -- Check for email in customers table
      SELECT EXISTS (
        SELECT 1 FROM customers WHERE LOWER(email) = LOWER(p_email)
      ) INTO v_email_exists;
      
      -- If email exists in customers, set the table name
      IF v_email_exists THEN
        v_exists_in_table := 'customers';
      END IF;
    END IF;
  END IF;

  -- Check for phone in vendors table (only if email doesn't exist yet)
  IF p_phone IS NOT NULL AND NOT v_email_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM vendors WHERE phone = p_phone
    ) INTO v_phone_exists;
    
    -- If phone exists in vendors, set the table name
    IF v_phone_exists THEN
      v_exists_in_table := 'vendors';
    ELSE
      -- Check for phone in customers table
      SELECT EXISTS (
        SELECT 1 FROM customers WHERE phone = p_phone
      ) INTO v_phone_exists;
      
      -- If phone exists in customers, set the table name
      IF v_phone_exists THEN
        v_exists_in_table := 'customers';
      END IF;
    END IF;
  END IF;

  -- Build JSON response
  v_result := json_build_object(
    'emailExists', v_email_exists,
    'phoneExists', v_phone_exists,
    'existsInTable', v_exists_in_table
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission to anonymous users for signup validation
GRANT EXECUTE ON FUNCTION check_email_phone_exists(TEXT, TEXT) TO anon;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_email_phone_exists(TEXT, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION check_email_phone_exists IS 
'Checks if email or phone number already exists in vendors or customers tables. 
Returns JSON with emailExists, phoneExists, and existsInTable fields.
Used for real-time validation during signup process.';
