-- Migration: Add Area Availability Check Functions
-- Purpose: Check if vendors/customers are available in a specific area during signup
-- Provides real-time feedback to users about service availability in their area
--
-- Functions created:
-- 1. check_customers_in_area: Count active customers in an area (for vendor signup)
-- 2. check_vendors_availability: Check if any active vendors exist (for customer signup)

-- ============================================================================
-- FUNCTION 1: Check Customers in Area (for Vendor Signup)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_customers_in_area(p_area_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_count INTEGER := 0;
  v_society_count INTEGER := 0;
  v_area_name TEXT := NULL;
  v_result JSON;
BEGIN
  -- Get area name for response
  SELECT name INTO v_area_name
  FROM areas
  WHERE id = p_area_id;

  -- Count active customers in the specified area
  IF p_area_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_customer_count
    FROM customers
    WHERE area_id = p_area_id
      AND (user_id IS NOT NULL OR email IS NOT NULL); -- Only count registered customers
    
    -- Count societies in the area
    SELECT COUNT(*)
    INTO v_society_count
    FROM societies
    WHERE area_id = p_area_id
      AND status = 'active';
  END IF;

  -- Build JSON response with availability information
  v_result := json_build_object(
    'customerCount', v_customer_count,
    'societyCount', v_society_count,
    'areaName', v_area_name,
    'hasCustomers', v_customer_count > 0,
    'message', CASE
      WHEN v_customer_count = 0 THEN 'Be the first vendor to serve this area! No customers registered yet.'
      WHEN v_customer_count BETWEEN 1 AND 5 THEN v_customer_count || ' potential customer' || (CASE WHEN v_customer_count > 1 THEN 's' ELSE '' END) || ' in this area.'
      WHEN v_customer_count BETWEEN 6 AND 20 THEN 'Good opportunity! ' || v_customer_count || ' customers in this area.'
      ELSE 'Great choice! ' || v_customer_count || '+ customers actively looking for vendors in this area.'
    END
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION 2: Check Vendors Availability (for Customer Signup)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_vendors_availability(p_area_id TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vendor_count INTEGER := 0;
  v_category_count INTEGER := 0;
  v_area_name TEXT := NULL;
  v_categories TEXT[] := ARRAY[]::TEXT[];
  v_result JSON;
BEGIN
  -- Get area name if provided
  IF p_area_id IS NOT NULL THEN
    SELECT name INTO v_area_name
    FROM areas
    WHERE id = p_area_id;
  END IF;

  -- Count total active vendors in the system
  -- Note: Vendors typically serve multiple areas, so we check overall availability
  SELECT COUNT(*)
  INTO v_vendor_count
  FROM vendors
  WHERE is_active = true;

  -- Get distinct vendor categories available
  SELECT COUNT(DISTINCT category), ARRAY_AGG(DISTINCT category)
  INTO v_category_count, v_categories
  FROM vendors
  WHERE is_active = true;

  -- Build JSON response with availability information
  v_result := json_build_object(
    'vendorCount', v_vendor_count,
    'categoryCount', v_category_count,
    'categories', v_categories,
    'areaName', v_area_name,
    'hasVendors', v_vendor_count > 0,
    'message', CASE
      WHEN v_vendor_count = 0 THEN 'No vendors available yet. You can still sign up and we''ll notify you when vendors join!'
      WHEN v_vendor_count BETWEEN 1 AND 3 THEN v_vendor_count || ' vendor' || (CASE WHEN v_vendor_count > 1 THEN 's' ELSE '' END) || ' available to serve your area.'
      WHEN v_vendor_count BETWEEN 4 AND 10 THEN 'Good selection! ' || v_vendor_count || ' vendors ready to serve you.'
      ELSE 'Excellent! ' || v_vendor_count || '+ vendors available across ' || v_category_count || ' categories.'
    END
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- STEP 3: Grant Permissions
-- ============================================================================

-- Grant execute permission to anonymous users (for signup validation)
GRANT EXECUTE ON FUNCTION check_customers_in_area(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_vendors_availability(TEXT) TO anon;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_customers_in_area(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_vendors_availability(TEXT) TO authenticated;

-- ============================================================================
-- STEP 4: Add Documentation Comments
-- ============================================================================

COMMENT ON FUNCTION check_customers_in_area IS 
'Checks the number of customers and societies in a specific area.
Used during vendor signup to show potential customer base.
Returns JSON with customerCount, societyCount, and helpful message.';

COMMENT ON FUNCTION check_vendors_availability IS 
'Checks the availability of active vendors in the system.
Used during customer signup to inform about service availability.
Returns JSON with vendorCount, categories, and helpful message.';
