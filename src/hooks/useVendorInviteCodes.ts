import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Type definition for Vendor Invite Code
 * 
 * Represents a single invite code with all its properties:
 * - Identification: id, vendor_id, code
 * - Configuration: label, expires_at, max_uses
 * - Tracking: used_count, is_active
 * - Audit: created_at, updated_at
 */
export interface VendorInviteCode {
  id: string;
  vendor_id: string;
  code: string;
  label: string | null;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Type definition for Connection Method
 * Tracks how a customer connected with a vendor
 */
export type ConnectionMethod = 'invite_code' | 'qr_scan' | 'shared_link' | 'first_order';

/**
 * Custom hook for managing vendor invite codes
 * 
 * This hook provides functionality for vendors to:
 * - Generate new invite codes for customer connections
 * - View and manage existing invite codes
 * - Track code usage and analytics
 * - Deactivate or delete codes as needed
 * 
 * Features:
 * - Automatic code generation with uniqueness validation
 * - Optional expiry dates and usage limits
 * - Real-time usage tracking
 * - Support for code labeling (e.g., "New Year Promo")
 * 
 * @param vendorId - The ID of the vendor whose codes to manage
 * 
 * @example
 * ```tsx
 * const { codes, isLoading, createCode, updateCode, deleteCode } = useVendorInviteCodes(vendorId);
 * 
 * // Create a new code
 * await createCode({
 *   label: "Summer Promotion",
 *   expires_at: "2024-08-31",
 *   max_uses: 100
 * });
 * ```
 */
export function useVendorInviteCodes(vendorId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [codes, setCodes] = useState<VendorInviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  /**
   * Fetch all invite codes for the vendor
   * Includes both active and inactive codes for management purposes
   */
  const fetchCodes = async () => {
    if (!vendorId) {
      setCodes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("vendor_invite_codes" as any)
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes((data || []) as unknown as VendorInviteCode[]);
    } catch (error: any) {
      console.error("Error fetching invite codes:", error);
      toast({
        title: "Error fetching codes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load codes when vendorId changes
   */
  useEffect(() => {
    fetchCodes();
  }, [vendorId]);

  /**
   * Create a new invite code for the vendor
   * Automatically generates a unique code using the database function
   */
  const createCode = async (params: {
    label?: string;
    expires_at?: string;
    max_uses?: number;
  }) => {
    if (!vendorId) {
      toast({
        title: "Error",
        description: "Vendor ID is required",
        variant: "destructive",
      });
      return;
    }

    setIsMutating(true);

    try {
      // Step 1: Generate a unique code using the database function
      const { data: generatedCode, error: codeError } = await supabase
        .rpc("generate_invite_code" as any);

      if (codeError || !generatedCode) {
        throw new Error("Failed to generate invite code");
      }

      // Step 2: Insert the code with optional parameters
      const { data, error } = await supabase
        .from("vendor_invite_codes" as any)
        .insert({
          vendor_id: vendorId,
          code: generatedCode,
          label: params.label || null,
          expires_at: params.expires_at || null,
          max_uses: params.max_uses || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh the list
      await fetchCodes();

      toast({
        title: "Invite code created",
        description: `Code ${generatedCode} is ready to share with customers.`,
      });

      return data as unknown as VendorInviteCode;
    } catch (error: any) {
      console.error("Error creating invite code:", error);
      toast({
        title: "Failed to create invite code",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * Update an existing invite code
   * Can change label, expiry, usage limits, or active status
   */
  const updateCode = async (params: {
    id: string;
    label?: string;
    expires_at?: string | null;
    max_uses?: number | null;
    is_active?: boolean;
  }) => {
    setIsMutating(true);

    try {
      const { data, error } = await supabase
        .from("vendor_invite_codes" as any)
        .update({
          label: params.label,
          expires_at: params.expires_at,
          max_uses: params.max_uses,
          is_active: params.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .select()
        .single();

      if (error) throw error;

      // Refresh the list
      await fetchCodes();

      toast({
        title: "Invite code updated",
        description: "Your changes have been saved.",
      });

      return data as unknown as VendorInviteCode;
    } catch (error: any) {
      console.error("Error updating invite code:", error);
      toast({
        title: "Failed to update invite code",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * Delete an invite code
   * Note: Deleting a code doesn't affect existing connections created with it
   */
  const deleteCode = async (codeId: string) => {
    setIsMutating(true);

    try {
      const { error } = await supabase
        .from("vendor_invite_codes" as any)
        .delete()
        .eq("id", codeId);

      if (error) throw error;

      // Refresh the list
      await fetchCodes();

      toast({
        title: "Invite code deleted",
        description: "The code has been removed.",
      });
    } catch (error: any) {
      console.error("Error deleting invite code:", error);
      toast({
        title: "Failed to delete invite code",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    /**
     * List of all invite codes for the vendor
     */
    codes,
    
    /**
     * Whether the codes are currently being loaded
     */
    isLoading: loading,
    
    /**
     * Create a new invite code
     * @param params - Code configuration (label, expiry, usage limits)
     */
    createCode,
    
    /**
     * Update an existing invite code
     * @param params - Code ID and fields to update
     */
    updateCode,
    
    /**
     * Delete an invite code permanently
     * @param codeId - ID of the code to delete
     */
    deleteCode,
    
    /**
     * Whether a create/update/delete operation is in progress
     */
    isMutating,

    /**
     * Manually refresh the codes list
     */
    refetch: fetchCodes,
  };
}
