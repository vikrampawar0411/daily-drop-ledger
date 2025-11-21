import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProductEditRequest {
  id: string;
  product_id: string;
  vendor_id: string;
  requested_by_user_id: string;
  proposed_name: string | null;
  proposed_category: string | null;
  proposed_unit: string | null;
  proposed_description: string | null;
  proposed_subscribe_before: string | null;
  proposed_delivery_before: string | null;
  proposed_image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  product?: any;
  vendor?: any;
}

export const useProductEditRequests = (vendorId?: string) => {
  const [editRequests, setEditRequests] = useState<ProductEditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEditRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("product_edit_requests")
        .select(`
          *,
          product:products(*),
          vendor:vendors(*)
        `)
        .order("created_at", { ascending: false });

      if (vendorId) {
        query = query.eq("vendor_id", vendorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEditRequests((data || []) as ProductEditRequest[]);
    } catch (error: any) {
      toast({
        title: "Error fetching edit requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditRequests();
  }, [vendorId]);

  const createEditRequest = async (request: {
    product_id: string;
    vendor_id: string;
    requested_by_user_id: string;
    proposed_name?: string;
    proposed_category?: string;
    proposed_unit?: string;
    proposed_description?: string;
    proposed_subscribe_before?: string;
    proposed_delivery_before?: string;
    proposed_image_url?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("product_edit_requests")
        .insert(request)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Edit request submitted",
        description: "Your product edit request has been sent to admin for approval",
      });

      await fetchEditRequests();
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating edit request",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const approveEditRequest = async (id: string, adminUserId: string, adminNotes?: string) => {
    try {
      // Get the edit request
      const { data: request, error: fetchError } = await supabase
        .from("product_edit_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Update the product with proposed changes
      const updates: any = {};
      if (request.proposed_name) updates.name = request.proposed_name;
      if (request.proposed_category) updates.category = request.proposed_category;
      if (request.proposed_unit) updates.unit = request.proposed_unit;
      if (request.proposed_description !== undefined) updates.description = request.proposed_description;
      if (request.proposed_subscribe_before !== undefined) updates.subscribe_before = request.proposed_subscribe_before;
      if (request.proposed_delivery_before !== undefined) updates.delivery_before = request.proposed_delivery_before;
      if (request.proposed_image_url) updates.image_url = request.proposed_image_url;

      const { error: updateProductError } = await supabase
        .from("products")
        .update(updates)
        .eq("id", request.product_id);

      if (updateProductError) throw updateProductError;

      // Mark request as approved
      const { error: updateRequestError } = await supabase
        .from("product_edit_requests")
        .update({
          status: "approved",
          reviewed_by_user_id: adminUserId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", id);

      if (updateRequestError) throw updateRequestError;

      toast({
        title: "Request approved",
        description: "Product has been updated successfully",
      });

      await fetchEditRequests();
    } catch (error: any) {
      toast({
        title: "Error approving request",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const rejectEditRequest = async (id: string, adminUserId: string, adminNotes: string) => {
    try {
      const { error } = await supabase
        .from("product_edit_requests")
        .update({
          status: "rejected",
          reviewed_by_user_id: adminUserId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Request rejected",
        description: "Edit request has been rejected",
      });

      await fetchEditRequests();
    } catch (error: any) {
      toast({
        title: "Error rejecting request",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    editRequests,
    loading,
    createEditRequest,
    approveEditRequest,
    rejectEditRequest,
    refetch: fetchEditRequests,
  };
};
