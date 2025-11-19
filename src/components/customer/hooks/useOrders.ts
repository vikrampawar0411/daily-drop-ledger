import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { DateOrders, Order } from "../types/order";

export const useOrders = () => {
  const [orders, setOrders] = useState<DateOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrders = async () => {
    try {
      // Get customer ID - either from logged-in user or guest
      let customerId = null;
      
      if (user) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        customerId = customerData?.id || null;
      } else {
        customerId = localStorage.getItem('guestCustomerId');
      }

      if (!customerId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendor:vendors(name),
          product:products(name)
        `)
        .eq('customer_id', customerId)
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
          vendor_id: order.vendor_id,
          product_id: order.product_id,
          order_date: order.order_date,
          status: order.status,
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
  }, [user]);

  const getOrdersForDate = (date: Date): Order[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    return orders.find(order => order.date === dateString)?.orders || [];
  };

  const hasOrdersOnDate = (date: Date): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    return orders.some(order => order.date === dateString);
  };

  const addOrder = async (date: Date, order: Omit<Order, 'id'>): Promise<void> => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    try {
      // Get customer ID - either from logged-in user or guest
      let customerId = null;
      
      if (user) {
        // Fetch customer record for logged-in user
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        customerId = customerData?.id || null;
      } else {
        // Get guest customer ID from localStorage
        customerId = localStorage.getItem('guestCustomerId');
      }

      // First, get vendor and product IDs
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id")
        .eq("name", order.vendor)
        .maybeSingle();

      const { data: products } = await supabase
        .from("products")
        .select("id, price")
        .eq("name", order.product)
        .maybeSingle();

      if (!vendors || !products) {
        throw new Error("Vendor or product not found");
      }

      // Get vendor_product_id
      const { data: vendorProduct } = await supabase
        .from("vendor_products")
        .select("id, price_override, stock_available, in_stock")
        .eq("vendor_id", vendors.id)
        .eq("product_id", products.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!vendorProduct) {
        throw new Error("This vendor does not offer this product");
      }

      if (!vendorProduct.in_stock) {
        throw new Error("Product is currently out of stock");
      }

      if (vendorProduct.stock_available < order.quantity) {
        throw new Error(`Insufficient stock. Only ${vendorProduct.stock_available} available`);
      }

      const actualPrice = vendorProduct.price_override || products.price;

      const { data: newOrder, error } = await supabase
        .from("orders")
        .insert([{
          order_date: dateString,
          vendor_id: vendors.id,
          product_id: products.id,
          vendor_product_id: vendorProduct.id,
          quantity: order.quantity,
          unit: order.unit,
          price_per_unit: actualPrice,
          total_amount: order.quantity * actualPrice,
          status: "pending",
          customer_id: customerId,
          placed_by_user_id: user?.id || null,
          placed_by_role: 'customer',
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
