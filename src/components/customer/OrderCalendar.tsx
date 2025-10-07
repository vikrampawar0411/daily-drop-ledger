
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { useOrders } from "./hooks/useOrders";
import { useVendors } from "@/hooks/useVendors";
import { useProducts } from "@/hooks/useProducts";
import OrderCalendarView from "./components/OrderCalendarView";
import OrderDetailsView from "./components/OrderDetailsView";
import OrderForm from "./components/OrderForm";

const OrderCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showOrderForm, setShowOrderForm] = useState(false);
  const { getOrdersForDate, hasOrdersOnDate, addOrder, deleteOrder } = useOrders();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { products, loading: productsLoading } = useProducts();

  // Group products by vendor for the order form
  const vendorsWithProducts = vendors.map(vendor => {
    const vendorProducts = products
      .filter(p => p.vendor_id === vendor.id && p.is_active)
      .map(p => ({ id: p.id, name: p.name }));
    
    return {
      id: vendor.id,
      name: vendor.name,
      products: vendorProducts
    };
  });

  const handlePlaceOrder = (vendorName: string, productName: string, quantity: number, dates: Date[]) => {
    const selectedProduct = products.find(p => p.name === productName);
    const unit = selectedProduct?.unit || 'unit';
    
    // Add order for each selected date
    dates.forEach(date => {
      addOrder(date, { vendor: vendorName, product: productName, quantity, unit });
    });
    
    setShowOrderForm(false);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (selectedDate) {
      deleteOrder(selectedDate, orderId);
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
        <Button 
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="bg-green-600 hover:bg-green-700"
          disabled={vendorsWithProducts.length === 0}
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          Schedule Order
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderCalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          hasOrdersOnDate={hasOrdersOnDate}
        />

        <OrderDetailsView
          selectedDate={selectedDate}
          orders={selectedDate ? getOrdersForDate(selectedDate) : []}
          onDeleteOrder={handleDeleteOrder}
          onShowOrderForm={() => setShowOrderForm(true)}
        />
      </div>

      {showOrderForm && (
        <OrderForm
          selectedDate={selectedDate}
          vendors={vendorsWithProducts}
          onPlaceOrder={handlePlaceOrder}
          onCancel={() => setShowOrderForm(false)}
        />
      )}
    </div>
  );
};

export default OrderCalendar;
