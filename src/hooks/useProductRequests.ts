import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProductRequest {
  id: string;
  vendor_id: string;
  requested_by_user_id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  availability: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  vendor?: {
    name: string;
    email: string;
  };
}

export const useProductRequests = (vendorId?: string) => {
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProductRequests = async () => {
    try {
      let query = supabase
        .from("product_requests")
        .select(`
          *,
          vendor:vendors(name, email)
        `)
        .order("created_at", { ascending: false });

      if (vendorId) {
        query = query.eq("vendor_id", vendorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProductRequests((data || []) as ProductRequest[]);
    } catch (error: any) {
      toast({
        title: "Error fetching product requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductRequests();
  }, [vendorId]);

  const createProductRequest = async (
    request: Omit<ProductRequest, "id" | "status" | "admin_notes" | "reviewed_by_user_id" | "reviewed_at" | "created_at">
  ) => {
    try {
      const { data, error } = await supabase
        .from("product_requests")
        .insert([request])
        .select()
        .single();

      if (error) throw error;

      setProductRequests((prev) => [data as ProductRequest, ...prev]);
      toast({
        title: "Success",
        description: "Product request submitted for admin approval",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating product request",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const approveProductRequest = async (requestId: string, adminNotes?: string) => {
    try {
      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from("product_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;

      // Create the product in the master products table
      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert([{
          name: request.name,
          category: request.category,
          price: request.price,
          unit: request.unit,
          availability: request.availability,
          description: request.description,
          status: "active",
        }])
        .select()
        .single();

      if (productError) throw productError;

      // Automatically add the product to the requesting vendor's list
      const { error: vendorProductError } = await supabase
        .from("vendor_products")
        .insert([{
          vendor_id: request.vendor_id,
          product_id: newProduct.id,
        }]);

      if (vendorProductError) throw vendorProductError;

      // Update the request status
      const { data, error } = await supabase
        .from("product_requests")
        .update({
          status: "approved",
          admin_notes: adminNotes,
          reviewed_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      setProductRequests((prev) =>
        prev.map((req) => (req.id === requestId ? data as ProductRequest : req))
      );
      toast({
        title: "Success",
        description: "Product request approved and added to master list",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error approving product request",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const rejectProductRequest = async (requestId: string, adminNotes?: string) => {
    try {
      const { data, error } = await supabase
        .from("product_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          reviewed_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      setProductRequests((prev) =>
        prev.map((req) => (req.id === requestId ? data as ProductRequest : req))
      );
      toast({
        title: "Success",
        description: "Product request rejected",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error rejecting product request",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    productRequests,
    loading,
    createProductRequest,
    approveProductRequest,
    rejectProductRequest,
    refetch: fetchProductRequests,
  };
};
