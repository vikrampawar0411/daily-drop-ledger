import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VendorProduct {
  id: string;
  vendor_id: string;
  product_id: string;
  price_override: number | null;
  is_active: boolean;
  stock_quantity: number;
  stock_reserved: number;
  stock_available: number;
  in_stock: boolean;
  last_stock_update: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    description: string | null;
    image_url: string | null;
    status: string;
  };
}

export const useVendorProducts = (vendorId?: string) => {
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVendorProducts = async () => {
    try {
      let query = supabase
        .from("vendor_products")
        .select(`
          *,
          product:products(*)
        `)
        .order("created_at", { ascending: false });

      // Only filter by vendor_id if one is provided
      if (vendorId) {
        query = query.eq("vendor_id", vendorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Remove duplicates based on product_id
      const uniqueProducts = (data || []).filter((item, index, self) =>
        index === self.findIndex((t) => t.product_id === item.product_id)
      );
      
      setVendorProducts(uniqueProducts);
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

  const updateStock = async (vendorProductId: string, quantity: number) => {
    try {
      const { data, error } = await supabase
        .from("vendor_products")
        .update({ 
          stock_quantity: quantity,
          last_stock_update: new Date().toISOString()
        })
        .eq("id", vendorProductId)
        .select(`*, product:products(*)`)
        .single();

      if (error) throw error;

      setVendorProducts(prev =>
        prev.map(vp => vp.id === vendorProductId ? data : vp)
      );

      toast({
        title: "Stock Updated",
        description: "Stock quantity updated successfully",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating stock",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addStock = async (vendorProductId: string, quantity: number) => {
    try {
      const currentVP = vendorProducts.find(vp => vp.id === vendorProductId);
      if (!currentVP) throw new Error("Product not found");

      const { data, error } = await supabase
        .from("vendor_products")
        .update({ 
          stock_quantity: (currentVP.stock_quantity || 0) + quantity
        })
        .eq("id", vendorProductId)
        .select(`*, product:products(*)`)
        .single();

      if (error) throw error;

      setVendorProducts(prev =>
        prev.map(vp => vp.id === vendorProductId ? data : vp)
      );

      toast({
        title: "Stock Updated",
        description: `Added ${quantity} units to stock`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating stock",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStockStatus = async (vendorProductId: string, inStock: boolean) => {
    return updateVendorProduct(vendorProductId, { in_stock: inStock });
  };

  const updatePrice = async (vendorProductId: string, price: number) => {
    return updateVendorProduct(vendorProductId, { price_override: price });
  };

  return {
    vendorProducts,
    loading,
    addVendorProduct,
    updateVendorProduct,
    removeVendorProduct,
    addStock,
    updateStock,
    updateStockStatus,
    updatePrice,
    refetch: fetchVendorProducts,
  };
};
