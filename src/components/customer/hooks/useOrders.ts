import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { DateOrders, Order } from "../types/order";

export const useOrders = () => {
  const [orders, setOrders] = useState<DateOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendor:vendors(name),
          product:products(name)
        `)
        .order("order_date", { ascending: false });

      if (error) throw error;

      // Group orders by date
      const groupedOrders: { [key: string]: Order[] } = {};
      
      data?.forEach((order: any) => {
        const dateString = order.order_date;
        if (!groupedOrders[dateString]) {
          groupedOrders[dateString] = [];
        }
        groupedOrders[dateString].push({
          id: order.id,
          vendor: order.vendor?.name || "Unknown",
          product: order.product?.name || "Unknown",
          quantity: parseFloat(order.quantity),
          unit: order.unit,
        });
      });

      const formattedOrders: DateOrders[] = Object.entries(groupedOrders).map(
        ([date, orders]) => ({
          date,
          orders,
        })
      );

      setOrders(formattedOrders);
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

  const getOrdersForDate = (date: Date): Order[] => {
    const dateString = date.toISOString().split('T')[0];
    return orders.find(order => order.date === dateString)?.orders || [];
  };

  const hasOrdersOnDate = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return orders.some(order => order.date === dateString);
  };

  const addOrder = async (date: Date, order: Omit<Order, 'id'>): Promise<void> => {
    const dateString = date.toISOString().split('T')[0];
    
    try {
      // Get current user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, get vendor and product IDs
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id")
        .eq("name", order.vendor)
        .single();

      const { data: products } = await supabase
        .from("products")
        .select("id, price")
        .eq("name", order.product)
        .single();

      if (!vendors || !products) {
        throw new Error("Vendor or product not found");
      }

      const { data: newOrder, error } = await supabase
        .from("orders")
        .insert([{
          order_date: dateString,
          vendor_id: vendors.id,
          product_id: products.id,
          quantity: order.quantity,
          unit: order.unit,
          price_per_unit: products.price,
          total_amount: order.quantity * products.price,
          status: "pending",
          customer_id: user.id,
        }])
        .select(`
          *,
          vendor:vendors(name),
          product:products(name)
        `)
        .single();

      if (error) throw error;

      // Update local state
      const formattedOrder: Order = {
        id: newOrder.id,
        vendor: newOrder.vendor?.name || "Unknown",
        product: newOrder.product?.name || "Unknown",
        quantity: Number(newOrder.quantity),
        unit: newOrder.unit,
      };

      setOrders(prevOrders => {
        const existingDateIndex = prevOrders.findIndex(order => order.date === dateString);
        if (existingDateIndex >= 0) {
          const updatedOrders = [...prevOrders];
          updatedOrders[existingDateIndex].orders.push(formattedOrder);
          return updatedOrders;
        } else {
          return [...prevOrders, { date: dateString, orders: [formattedOrder] }];
        }
      });

      toast({
        title: "Success",
        description: "Order added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error adding order",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteOrder = async (date: Date, orderId: string): Promise<void> => {
    const dateString = date.toISOString().split('T')[0];
    
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      setOrders(prevOrders => {
        return prevOrders.map(dateOrder => {
          if (dateOrder.date === dateString) {
            return {
              ...dateOrder,
              orders: dateOrder.orders.filter(order => order.id !== orderId)
            };
          }
          return dateOrder;
        }).filter(dateOrder => dateOrder.orders.length > 0);
      });

      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting order",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    orders,
    loading,
    getOrdersForDate,
    hasOrdersOnDate,
    addOrder,
    deleteOrder,
    refetch: fetchOrders,
  };
};
