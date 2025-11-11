import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface OrderWithDetails {
  id: string;
  order_date: string;
  quantity: number;
  status: string;
  unit: string;
  total_amount: number;
  delivered_at: string | null;
  dispute_raised: boolean;
  dispute_reason: string | null;
  dispute_raised_at: string | null;
  updated_by?: {
    name: string | null;
    email: string;
  };
  customer: {
    id: string;
    name: string;
    address: string;
    phone: string;
    area_id: string | null;
    society_id: string | null;
    wing_number: string | null;
  };
  vendor: {
    id: string;
    name: string;
    category: string;
  };
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
}

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, getUserRole } = useAuth();

  const fetchOrders = async () => {
    try {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Get user role
      const role = await getUserRole();
      
      let query = supabase
        .from("orders")
        .select(`
          *,
          customer:customers(id, name, address, phone, area_id, society_id, wing_number),
          vendor:vendors(id, name, category),
          product:products(id, name, category, price),
          updated_by:profiles!orders_updated_by_user_id_fkey(name, email)
        `);

      // Filter based on user role
      if (role === 'vendor') {
        // Get vendor ID from vendors table using user_id
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (vendorData) {
          query = query.eq('vendor_id', vendorData.id);
        } else {
          // No vendor profile found, return empty
          setOrders([]);
          setLoading(false);
          return;
        }
      } else if (role === 'customer') {
        // Get customer ID from customers table using user_id
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (customerData) {
          query = query.eq('customer_id', customerData.id);
        } else {
          // No customer profile found, return empty
          setOrders([]);
          setLoading(false);
          return;
        }
      }
      // Admin sees all orders - no filter needed

      const { data, error } = await query.order("order_date", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map((order: any) => ({
        id: order.id,
        order_date: order.order_date,
        quantity: order.quantity,
        status: order.status,
        unit: order.unit,
        total_amount: order.total_amount,
        delivered_at: order.delivered_at,
        dispute_raised: order.dispute_raised || false,
        dispute_reason: order.dispute_reason,
        dispute_raised_at: order.dispute_raised_at,
        updated_by: order.updated_by,
        customer: Array.isArray(order.customer) ? order.customer[0] : order.customer,
        vendor: Array.isArray(order.vendor) ? order.vendor[0] : order.vendor,
        product: Array.isArray(order.product) ? order.product[0] : order.product,
      })) || [];

      setOrders(transformedData);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: string, deliveredAt?: string) => {
    try {
      const updateData: any = { status };
      
      // If marking as delivered, set the delivered_at timestamp and track who updated it
      if (status === 'delivered') {
        updateData.delivered_at = deliveredAt || new Date().toISOString();
        if (user) {
          updateData.updated_by_user_id = user.id;
        }
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated",
      });
      
      // Refetch to get updated data with user info
      await fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const raiseDispute = async (orderId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          dispute_raised: true, 
          dispute_reason: reason,
          dispute_raised_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                dispute_raised: true, 
                dispute_reason: reason,
                dispute_raised_at: new Date().toISOString()
              } 
            : order
        )
      );

      toast({
        title: "Success",
        description: "Dispute raised successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error raising dispute",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    orders,
    loading,
    updateOrderStatus,
    raiseDispute,
    refetch: fetchOrders,
  };
};
