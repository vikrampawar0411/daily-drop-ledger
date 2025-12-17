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
  subscribe_before: string | null;
  delivery_before: string | null;
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
        price: product.price,
        unit: product.unit,
        availability: product.availability,
        description: product.description,
        is_active: product.is_active,
        status: product.status,
        image_url: product.image_url,
        images: product.images || [],
        subscribe_before: product.subscribe_before || null,
        delivery_before: product.delivery_before || null,
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
      const { data, error } = await supabase
        .from("products")
        .insert([product])
        .select()
        .single();

      if (error) throw error;

      const mappedProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        price: data.price,
        unit: data.unit,
        availability: data.availability,
        description: data.description,
        is_active: data.is_active,
        status: data.status,
        image_url: data.image_url,
        subscribe_before: (data as any).subscribe_before || null,
        delivery_before: (data as any).delivery_before || null,
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
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const mappedProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        price: data.price,
        unit: data.unit,
        availability: data.availability,
        description: data.description,
        is_active: data.is_active,
        status: data.status,
        image_url: data.image_url,
        subscribe_before: (data as any).subscribe_before || null,
        delivery_before: (data as any).delivery_before || null,
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
