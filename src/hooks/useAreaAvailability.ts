import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Result interface for area availability check
 */
export interface AreaAvailabilityResult {
  // For vendor signup (checking customers in area)
  customerCount?: number;
  societyCount?: number;
  
  // For customer signup (checking vendors availability)
  vendorCount?: number;
  categoryCount?: number;
  categories?: string[];
  
  // Common fields
  areaName: string | null;
  hasCustomers?: boolean;
  hasVendors?: boolean;
  message: string;
}

/**
 * Hook return interface
 */
interface UseAreaAvailabilityReturn {
  /**
   * Whether the availability check is in progress
   */
  isChecking: boolean;
  /**
   * Result of the availability check
   */
  result: AreaAvailabilityResult | null;
  /**
   * Error message if check failed
   */
  error: string | null;
  /**
   * Manually trigger an availability check
   */
  checkAvailability: (areaId: string, type: 'vendor' | 'customer') => Promise<AreaAvailabilityResult | null>;
}

/**
 * useAreaAvailability Hook
 * 
 * Custom hook to check vendor/customer availability in a specific area during signup.
 * Provides real-time feedback about service availability to help users make informed decisions.
 * 
 * Features:
 * - Automatic debouncing (500ms default) to prevent excessive API calls
 * - Loading state management for UX feedback
 * - Error handling with user-friendly messages
 * - Cancellation of pending requests
 * - Manual trigger support for re-checking
 * 
 * @param areaId - Area ID to check availability for
 * @param type - 'vendor' for checking customers, 'customer' for checking vendors
 * @param debounceMs - Debounce delay in milliseconds (default: 500)
 * @param enabled - Whether to enable automatic checking (default: true)
 * 
 * @example
 * ```tsx
 * // For customer signup - check if vendors are available
 * const { isChecking, result } = useAreaAvailability(selectedAreaId, 'customer');
 * 
 * // For vendor signup - check if customers exist in area
 * const { isChecking, result } = useAreaAvailability(selectedAreaId, 'vendor');
 * 
 * // Display feedback
 * {result && (
 *   <div className={result.hasVendors ? "text-green-600" : "text-orange-600"}>
 *     {result.message}
 *   </div>
 * )}
 * ```
 */
export function useAreaAvailability(
  areaId?: string,
  type?: 'vendor' | 'customer',
  debounceMs: number = 500,
  enabled: boolean = true
): UseAreaAvailabilityReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<AreaAvailabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Track timeout for debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Perform the actual availability check via Supabase RPC
   */
  const performCheck = async (
    checkAreaId: string,
    checkType: 'vendor' | 'customer'
  ): Promise<AreaAvailabilityResult | null> => {
    // Don't check if areaId is empty
    if (!checkAreaId || !checkType) {
      return null;
    }

    try {
      setIsChecking(true);
      setError(null);

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      let data, rpcError;

      // Call appropriate RPC function based on signup type
      if (checkType === 'vendor') {
        // Vendor signing up - check if customers exist in the area
        ({ data, error: rpcError } = await supabase.rpc(
          "check_customers_in_area" as any,
          { p_area_id: checkAreaId }
        ));
      } else {
        // Customer signing up - check if vendors are available
        ({ data, error: rpcError } = await supabase.rpc(
          "check_vendors_availability" as any,
          { p_area_id: checkAreaId }
        ));
      }

      // Handle RPC errors
      if (rpcError) {
        console.error("Area availability check error:", rpcError);
        setError("Failed to check availability. Please try again.");
        return null;
      }

      // Parse and set the result
      const jsonData = data as any;
      const availabilityResult: AreaAvailabilityResult = {
        customerCount: jsonData?.customerCount,
        societyCount: jsonData?.societyCount,
        vendorCount: jsonData?.vendorCount,
        categoryCount: jsonData?.categoryCount,
        categories: jsonData?.categories,
        areaName: jsonData?.areaName,
        hasCustomers: jsonData?.hasCustomers,
        hasVendors: jsonData?.hasVendors,
        message: jsonData?.message || "Checking availability...",
      };

      setResult(availabilityResult);
      return availabilityResult;
    } catch (err: any) {
      // Ignore abort errors (expected when cancelling)
      if (err.name === "AbortError") {
        return null;
      }

      console.error("Area availability check exception:", err);
      setError("An unexpected error occurred while checking availability.");
      return null;
    } finally {
      setIsChecking(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * Debounced effect for automatic checking when areaId or type changes
   */
  useEffect(() => {
    // Skip if hook is disabled or no inputs provided
    if (!enabled || !areaId || !type) {
      setResult(null); // Clear previous results
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced check
    timeoutRef.current = setTimeout(() => {
      performCheck(areaId, type);
    }, debounceMs);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [areaId, type, debounceMs, enabled]);

  /**
   * Manual check function for imperative calls
   */
  const checkAvailability = async (
    checkAreaId: string,
    checkType: 'vendor' | 'customer'
  ): Promise<AreaAvailabilityResult | null> => {
    return performCheck(checkAreaId, checkType);
  };

  return {
    isChecking,
    result,
    error,
    checkAvailability,
  };
}
