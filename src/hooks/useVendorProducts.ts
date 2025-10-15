import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VendorProduct {
  id: string;
  vendor_id: string;
  product_id: string;
  price_override: number | null;
  is_active: boolean;
  product?: {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    availability: string;
    description: string | null;
  };
}

export const useVendorProducts = (vendorId?: string) => {
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVendorProducts = async () => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("vendor_products")
        .select(`
          *,
          product:products(*)
        `)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVendorProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching vendor products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorProducts();
  }, [vendorId]);

  const addVendorProduct = async (productId: string, priceOverride?: number) => {
    if (!vendorId) return;

    try {
      const { data, error } = await supabase
        .from("vendor_products")
        .insert([{
          vendor_id: vendorId,
          product_id: productId,
          price_override: priceOverride || null,
        }])
        .select(`
          *,
          product:products(*)
        `)
        .single();

      if (error) throw error;

      setVendorProducts((prev) => [data, ...prev]);
      toast({
        title: "Success",
        description: "Product added to your list",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVendorProduct = async (id: string, updates: Partial<VendorProduct>) => {
    try {
      const { data, error } = await supabase
        .from("vendor_products")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          product:products(*)
        `)
        .single();

      if (error) throw error;

      setVendorProducts((prev) =>
        prev.map((vp) => (vp.id === id ? data : vp))
      );
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeVendorProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vendor_products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setVendorProducts((prev) => prev.filter((vp) => vp.id !== id));
      toast({
        title: "Success",
        description: "Product removed from your list",
      });
    } catch (error: any) {
      toast({
        title: "Error removing product",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    vendorProducts,
    loading,
    addVendorProduct,
    updateVendorProduct,
    removeVendorProduct,
    refetch: fetchVendorProducts,
  };
};
