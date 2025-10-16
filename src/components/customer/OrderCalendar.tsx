
import { useState } from "react";
import { useOrders } from "./hooks/useOrders";
import { useVendors } from "@/hooks/useVendors";
import { useProducts } from "@/hooks/useProducts";
import OrderForm from "./components/OrderForm";

const OrderCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { getOrdersForDate, addOrder, deleteOrder, refetch } = useOrders();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { products, loading: productsLoading } = useProducts();

  // Get all products from master table (no longer vendor-specific)
  const vendorsWithProducts = vendors.map(vendor => {
    const vendorProducts = products
      .filter(p => p.is_active)
      .map(p => ({ id: p.id, name: p.name }));
    
    return {
      id: vendor.id,
      name: vendor.name,
      products: vendorProducts
    };
  });

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
      />
    </div>
  );
};

export default OrderCalendar;
