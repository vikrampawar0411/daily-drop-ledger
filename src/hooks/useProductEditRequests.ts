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
  proposed_price?: number | null;
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
        description: error?.message ?? String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditRequests();
  }, [vendorId]);

  // Realtime subscription: refresh list when product_edit_requests change
  useEffect(() => {
    let isFetching = false;
    // Support both supabase-js v1 and v2 APIs. If v2 is present, prefer channel-based
    const anySupabase: any = supabase as any;

    if (typeof anySupabase.channel === "function") {
      // v2+ realtime via channel/postgres_changes
      const channel = anySupabase
        .channel("product_edit_requests_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "product_edit_requests" },
          async () => {
            if (!isFetching) {
              isFetching = true;
              await fetchEditRequests();
              isFetching = false;
            }
          }
        )
        .subscribe();

      return () => {
        try {
          anySupabase.removeChannel?.(channel);
        } catch (e) {
          // ignore
        }
      };
    }

    // Fallback for v1 API
    try {
      const subscription: any = anySupabase
        .from("product_edit_requests")
        .on("INSERT", async () => {
          if (!isFetching) {
            isFetching = true;
            await fetchEditRequests();
            isFetching = false;
          }
        })
        .on("UPDATE", async () => {
          if (!isFetching) {
            isFetching = true;
            await fetchEditRequests();
            isFetching = false;
          }
        })
        .on("DELETE", async () => {
          if (!isFetching) {
            isFetching = true;
            await fetchEditRequests();
            isFetching = false;
          }
        })
        .subscribe();

      return () => {
        try {
          anySupabase.removeSubscription?.(subscription);
        } catch (e) {
          // ignore cleanup errors
        }
      };
    } catch (e) {
      // If realtime isn't supported in the environment, silently ignore
      return () => {};
    }
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
    proposed_price?: number;
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
        description: error?.message ?? String(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const approveEditRequest = async (id: string, adminUserId: string, adminNotes?: string) => {
    try {
      // Optimistically mark approved in UI
      const reviewedAt = new Date().toISOString();
      setEditRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved", reviewed_by_user_id: adminUserId, reviewed_at: reviewedAt, admin_notes: adminNotes || null } : r)));

      // Get the edit request to read proposed fields
      const { data: request, error: fetchError } = await supabase
        .from("product_edit_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Only allow updating 'unit' and 'price' from edit requests. Do NOT apply
      // proposed name or category changes here (enforced at approval time).
      const updates: any = {};
      const reqAny: any = request as any;
      if (reqAny?.proposed_unit) updates.unit = reqAny.proposed_unit;
      if (reqAny?.proposed_price !== undefined && reqAny?.proposed_price !== null) updates.price = reqAny.proposed_price;

      const { error: updateProductError } = await supabase.from("products").update(updates).eq("id", request!.product_id);
      if (updateProductError) throw updateProductError;

      const { error: updateRequestError } = await supabase
        .from("product_edit_requests")
        .update({
          status: "approved",
          reviewed_by_user_id: adminUserId,
          reviewed_at: reviewedAt,
          admin_notes: adminNotes || null,
        })
        .eq("id", id);
      if (updateRequestError) throw updateRequestError;

      toast({ title: "Request approved", description: "Product has been updated successfully" });
      await fetchEditRequests();
    } catch (error: any) {
      // revert by refetching fresh data
      await fetchEditRequests();
      toast({ title: "Error approving request", description: error?.message ?? String(error), variant: "destructive" });
      throw error;
    }
  };

  const rejectEditRequest = async (id: string, adminUserId: string, adminNotes: string) => {
    try {
      // Optimistically update UI
      const reviewedAt = new Date().toISOString();
      setEditRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected", reviewed_by_user_id: adminUserId, reviewed_at: reviewedAt, admin_notes: adminNotes } : r)));

      const { error } = await supabase
        .from("product_edit_requests")
        .update({
          status: "rejected",
          reviewed_by_user_id: adminUserId,
          reviewed_at: reviewedAt,
          admin_notes: adminNotes,
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Request rejected", description: "Edit request has been rejected" });

      await fetchEditRequests();
    } catch (error: any) {
      await fetchEditRequests();
      toast({ title: "Error rejecting request", description: error?.message ?? String(error), variant: "destructive" });
      throw error;
    }
  };

  // Admin-only: delete an edit request
  const deleteEditRequest = async (id: string, isAdmin: boolean) => {
    if (!isAdmin) {
      toast({ title: "Permission denied", description: "Only admins can delete edit requests.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase
        .from("product_edit_requests")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Edit request deleted" });
      await fetchEditRequests();
    } catch (error: any) {
      toast({ title: "Error deleting request", description: error?.message ?? String(error), variant: "destructive" });
      throw error;
    }
  };

  return {
    editRequests,
    loading,
    createEditRequest,
    approveEditRequest,
    rejectEditRequest,
    deleteEditRequest,
    refetch: fetchEditRequests,
  };
};
