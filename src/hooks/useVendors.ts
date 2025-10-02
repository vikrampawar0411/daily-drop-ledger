import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

export const useVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching vendors",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const addVendor = async (vendor: Omit<Vendor, "id" | "is_active">) => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .insert([vendor])
        .select()
        .single();

      if (error) throw error;

      setVendors((prev) => [data, ...prev]);
      toast({
        title: "Success",
        description: "Vendor added successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error adding vendor",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setVendors((prev) =>
        prev.map((vendor) => (vendor.id === id ? data : vendor))
      );
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating vendor",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    vendors,
    loading,
    addVendor,
    updateVendor,
    refetch: fetchVendors,
  };
};
