import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Result interface for duplicate check
 */
export interface DuplicateCheckResult {
  emailExists: boolean;
  phoneExists: boolean;
  existsInTable: "vendors" | "customers" | null;
}

/**
 * Hook state interface
 */
interface UseDuplicateCheckReturn {
  /**
   * Whether the duplicate check is currently in progress
   */
  isChecking: boolean;
  /**
   * Result of the last duplicate check
   */
  result: DuplicateCheckResult | null;
  /**
   * Error message if check failed
   */
  error: string | null;
  /**
   * Manually trigger a duplicate check
   */
  checkDuplicate: (email?: string, phone?: string) => Promise<DuplicateCheckResult | null>;
}

/**
 * useDuplicateCheck Hook
 * 
 * Custom hook for checking if email or phone number already exists in the database.
 * Implements debouncing to prevent excessive API calls during typing.
 * 
 * Features:
 * - Automatic debouncing (500ms by default)
 * - Loading state management
 * - Error handling
 * - Cancellation of pending requests
 * - Manual trigger support
 * 
 * @param email - Email to check (optional)
 * @param phone - Phone number to check (optional)
 * @param debounceMs - Debounce delay in milliseconds (default: 500)
 * @param enabled - Whether to enable automatic checking (default: true)
 * 
 * @example
 * ```tsx
 * const { isChecking, result, error } = useDuplicateCheck(email, phone);
 * 
 * if (result?.emailExists) {
 *   // Show error: Email already registered
 * }
 * ```
 */
export function useDuplicateCheck(
  email?: string,
  phone?: string,
  debounceMs: number = 500,
  enabled: boolean = true
): UseDuplicateCheckReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DuplicateCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track the latest timeout ID for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use ref to track the latest request for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Perform the actual duplicate check via Supabase RPC
   */
  const performCheck = async (
    checkEmail?: string,
    checkPhone?: string
  ): Promise<DuplicateCheckResult | null> => {
    // Don't check if both email and phone are empty
    if (!checkEmail && !checkPhone) {
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

      // Call the RPC function to check for duplicates
      const { data, error: rpcError } = await supabase.rpc(
        "check_email_phone_exists",
        {
          p_email: checkEmail || null,
          p_phone: checkPhone || null,
        }
      );

      // Handle errors from RPC call
      if (rpcError) {
        console.error("Duplicate check error:", rpcError);
        setError("Failed to verify email/phone. Please try again.");
        return null;
      }

      // Parse and set the result (data is Json type from RPC)
      const jsonData = data as any;
      const checkResult: DuplicateCheckResult = {
        emailExists: jsonData?.emailExists || false,
        phoneExists: jsonData?.phoneExists || false,
        existsInTable: jsonData?.existsInTable || null,
      };

      setResult(checkResult);
      return checkResult;
    } catch (err: any) {
      // Ignore abort errors (expected when cancelling)
      if (err.name === "AbortError") {
        return null;
      }

      console.error("Duplicate check exception:", err);
      setError("An unexpected error occurred during validation.");
      return null;
    } finally {
      setIsChecking(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * Debounced effect for automatic checking when email or phone changes
   */
  useEffect(() => {
    // Skip if hook is disabled or no inputs provided
    if (!enabled || (!email && !phone)) {
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced check
    timeoutRef.current = setTimeout(() => {
      performCheck(email, phone);
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
  }, [email, phone, debounceMs, enabled]);

  /**
   * Manual check function that can be called imperatively
   */
  const checkDuplicate = async (
    checkEmail?: string,
    checkPhone?: string
  ): Promise<DuplicateCheckResult | null> => {
    return performCheck(checkEmail, checkPhone);
  };

  return {
    isChecking,
    result,
    error,
    checkDuplicate,
  };
}
