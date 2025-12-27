import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  name: string;
  category: string;
  // price, unit, availability removed for admin add
  description: string | null;
  is_active: boolean;
  // status removed for admin add
  image_url: string | null;
  images?: string[];
  // subscribe_before, delivery_before removed for admin add
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
      
      // Map the data to ensure all fields are present
      const mappedData = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        is_active: product.is_active,
        image_url: product.image_url,
        images: product.images || [],
      }));
      
      setProducts(mappedData);
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

  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const allowed = {
        name: product.name,
        category: product.category,
        description: product.description,
        image_url: product.image_url,
        images: product.images || [],
        is_active: product.is_active !== undefined ? product.is_active : true,
      };
      const { data, error } = await supabase
        .from("products")
        .insert([allowed])
        .select()
        .single();

      if (error) throw error;

      const mappedProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        description: data.description,
        is_active: data.is_active,
        image_url: data.image_url,
        images: data.images || [],
      };

      setProducts((prev) => [mappedProduct, ...prev]);
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      return mappedProduct;
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
      const allowed: Partial<Product> = {
        name: updates.name,
        category: updates.category,
        description: updates.description,
        image_url: updates.image_url,
        images: updates.images,
        is_active: updates.is_active,
      };
      const { data, error } = await supabase
        .from("products")
        .update(allowed)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const mappedProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        description: data.description,
        is_active: data.is_active,
        image_url: data.image_url,
        images: data.images || [],
      };

      setProducts((prev) =>
        prev.map((product) => (product.id === id ? mappedProduct : product))
      );
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      return mappedProduct;
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
