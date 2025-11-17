
import { useState, useEffect, useMemo } from "react";
import { useOrders } from "./hooks/useOrders";
import { useVendors } from "@/hooks/useVendors";
import { useProducts } from "@/hooks/useProducts";
import OrderForm from "./components/OrderForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface OrderCalendarProps {
  filterVendorId?: string;
  filterProductId?: string;
  onClearFilters?: () => void;
}

const OrderCalendar = ({ filterVendorId = "", filterProductId = "", onClearFilters }: OrderCalendarProps) => {
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

  // Get vendor and product names for display
  const filterVendorName = vendors.find(v => v.id === filterVendorId)?.name || "";
  const filterProductName = products.find(p => p.id === filterProductId)?.name || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Calendar</h2>
        {(filterVendorId || filterProductId) && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {(filterVendorId || filterProductId) && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900">
            Filtered View: {filterVendorName && `Vendor: ${filterVendorName}`}
            {filterVendorName && filterProductName && " | "}
            {filterProductName && `Product: ${filterProductName}`}
          </p>
        </div>
      )}

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
          // Apply filters if set
          const filteredOrders = orders.filter(order => {
            if (filterVendorId && order.vendor_id !== filterVendorId) return false;
            if (filterProductId && order.product_id !== filterProductId) return false;
            return true;
          });
          return filteredOrders.length > 0;
        }}
        filterVendorId={filterVendorId}
        filterProductId={filterProductId}
        refetch={refetch}
      />
    </div>
  );
};

export default OrderCalendar;
