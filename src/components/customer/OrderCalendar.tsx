
import { useState, useEffect, useMemo } from "react";
import { useOrders } from "./hooks/useOrders";
import { useVendors } from "@/hooks/useVendors";
import { useProducts } from "@/hooks/useProducts";
import OrderForm from "./components/OrderForm";
import { supabase } from "@/integrations/supabase/client";

const OrderCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { getOrdersForDate, addOrder, deleteOrder, refetch } = useOrders();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { products, loading: productsLoading } = useProducts();
  const [vendorProductsMap, setVendorProductsMap] = useState<Record<string, any[]>>({});

  // Fetch vendor-specific products
  useEffect(() => {
    const fetchAllVendorProducts = async () => {
      const productsMap: Record<string, any[]> = {};
      
      for (const vendor of vendors) {
        const { data } = await supabase
          .from('vendor_products')
          .select('product_id, products(*)')
          .eq('vendor_id', vendor.id)
          .eq('is_active', true);
        
        if (data && data.length > 0) {
          productsMap[vendor.id] = data.map(vp => ({
            id: vp.products.id,
            name: vp.products.name
          }));
        } else {
          // Fallback to all active products if vendor has no specific products
          productsMap[vendor.id] = products
            .filter(p => p.is_active)
            .map(p => ({ id: p.id, name: p.name }));
        }
      }
      
      setVendorProductsMap(productsMap);
    };

    if (vendors.length > 0 && products.length > 0) {
      fetchAllVendorProducts();
    }
  }, [vendors, products]);

  // Create vendors with products structure
  const vendorsWithProducts = useMemo(() => {
    return vendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      products: vendorProductsMap[vendor.id] || []
    }));
  }, [vendors, vendorProductsMap]);

  const handlePlaceOrder = async (vendorName: string, productName: string, quantity: number, dates: Date[]) => {
    const selectedProduct = products.find(p => p.name === productName);
    const unit = selectedProduct?.unit || 'unit';
    
    // Add order for each selected date
    for (const date of dates) {
      await addOrder(date, { vendor: vendorName, product: productName, quantity, unit });
    }
    
    // Refetch orders to update calendar
    await refetch();
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (selectedDate) {
      await deleteOrder(selectedDate, orderId);
      await refetch();
    }
  };

  if (vendorsLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Calendar</h2>
      </div>

      <OrderForm
        selectedDate={selectedDate}
        vendors={vendorsWithProducts}
        onPlaceOrder={handlePlaceOrder}
        onCancel={() => {}}
        allOrders={getOrdersForDate}
        onDeleteOrder={handleDeleteOrder}
        hasAnyOrdersOnDate={(date) => {
          const dateStr = date.toISOString().split('T')[0];
          const orders = getOrdersForDate(date);
          return orders.length > 0;
        }}
      />
    </div>
  );
};

export default OrderCalendar;
