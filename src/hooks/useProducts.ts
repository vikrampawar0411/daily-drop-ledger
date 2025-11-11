import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  availability: string;
  description: string | null;
  is_active: boolean;
  status: string;
  image_url: string | null;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, "id" | "is_active">) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([product])
        .select()
        .single();

      if (error) throw error;

      setProducts((prev) => [data, ...prev]);
      toast({
        title: "Success",
        description: "Product added successfully",
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

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setProducts((prev) =>
        prev.map((product) => (product.id === id ? data : product))
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

  const toggleProductStatus = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    await updateProduct(id, { is_active: !product.is_active });
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    toggleProductStatus,
    refetch: fetchProducts,
  };
};
