import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, getUserRole } = useAuth();

  const fetchVendors = async () => {
    try {
      if (!user) {
        setVendors([]);
        setLoading(false);
        return;
      }

      // Get user role
      const role = await getUserRole();
      
      let query = supabase
        .from("vendors")
        .select("*");

      // Filter based on user role
      if (role === 'customer') {
        // Get customer ID from customers table
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (customerData) {
          // Get connected vendor IDs from vendor_customer_connections
          const { data: connections } = await supabase
            .from('vendor_customer_connections')
            .select('vendor_id')
            .eq('customer_id', customerData.id);
          
          if (connections && connections.length > 0) {
            const vendorIds = connections.map(c => c.vendor_id);
            query = query.in('id', vendorIds);
          } else {
            // No connections, return empty array
            setVendors([]);
            setLoading(false);
            return;
          }
        }
      } else if (role === 'vendor') {
        // Vendors should only see themselves
        query = query.eq('email', user.email);
      }
      // Admin sees all vendors - no filter needed

      const { data, error } = await query.order("created_at", { ascending: false });

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
  }, [user]);

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
