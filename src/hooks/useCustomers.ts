import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  route: string | null;
  is_active: boolean;
  area_id?: string | null;
  society_id?: string | null;
  wing_number?: string | null;
  flat_plot_house_number?: string | null;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, getUserRole } = useAuth();

  const fetchCustomers = async () => {
    try {
      if (!user) {
        setCustomers([]);
        setLoading(false);
        return;
      }

      // Get user role
      const role = await getUserRole();
      
      let query = supabase
        .from("customers")
        .select("*");

      // Filter based on user role
      if (role === 'vendor') {
        // Get vendor ID from vendors table
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (vendorData) {
          // Get connected customer IDs from vendor_customer_connections
          const { data: connections } = await supabase
            .from('vendor_customer_connections')
            .select('customer_id')
            .eq('vendor_id', vendorData.id);
          
          if (connections && connections.length > 0) {
            const customerIds = connections.map(c => c.customer_id);
            query = query.in('id', customerIds);
          } else {
            // No connections, return empty array
            setCustomers([]);
            setLoading(false);
            return;
          }
        }
      } else if (role === 'customer') {
        // Customers should only see themselves
        query = query.eq('email', user.email);
      }
      // Admin sees all customers - no filter needed

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const addCustomer = async (customer: Omit<Customer, "id" | "is_active">) => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert([customer])
        .select()
        .single();

      if (error) throw error;

      setCustomers((prev) => [data, ...prev]);
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error adding customer",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((customer) => (customer.id === id ? data : customer))
      );
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating customer",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleCustomerStatus = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;

    await updateCustomer(id, { is_active: !customer.is_active });
  };

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    toggleCustomerStatus,
    refetch: fetchCustomers,
  };
};
