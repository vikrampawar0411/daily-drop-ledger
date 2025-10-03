import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrderWithDetails {
  id: string;
  order_date: string;
  quantity: number;
  status: string;
  unit: string;
  total_amount: number;
  customer: {
    id: string;
    name: string;
    address: string;
    phone: string;
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

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(id, name, address, phone),
          vendor:vendors(id, name, category),
          product:products(id, name, category, price)
        `)
        .order("order_date", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(order => ({
        id: order.id,
        order_date: order.order_date,
        quantity: order.quantity,
        status: order.status,
        unit: order.unit,
        total_amount: order.total_amount,
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
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast({
        title: "Success",
        description: "Order status updated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    orders,
    loading,
    updateOrderStatus,
    refetch: fetchOrders,
  };
};
