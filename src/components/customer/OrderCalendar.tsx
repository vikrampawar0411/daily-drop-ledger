
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { useOrders } from "./hooks/useOrders";
import OrderCalendarView from "./components/OrderCalendarView";
import OrderDetailsView from "./components/OrderDetailsView";
import OrderForm from "./components/OrderForm";
import type { Vendor } from "./types/order";

const OrderCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showOrderForm, setShowOrderForm] = useState(false);
  const { getOrdersForDate, hasOrdersOnDate, addOrder, deleteOrder } = useOrders();

  const vendors: Vendor[] = [
    { id: 1, name: "Fresh Dairy Co.", products: ["Fresh Milk", "Organic Milk"] },
    { id: 2, name: "News Express", products: ["Times of India", "Maharashtra Times"] },
    { id: 3, name: "Daily Essentials", products: ["Fresh Milk", "Indian Express"] }
  ];

  const handlePlaceOrder = (vendor: string, product: string, quantity: number, dates: Date[]) => {
    const unit = product.toLowerCase().includes('milk') 
      ? (quantity > 1 ? 'litres' : 'litre') 
      : (quantity > 1 ? 'copies' : 'copy');
    
    // Add order for each selected date
    dates.forEach(date => {
      addOrder(date, { vendor, product, quantity, unit });
    });
    
    setShowOrderForm(false);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (selectedDate) {
      deleteOrder(selectedDate, orderId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Calendar</h2>
        <Button 
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="bg-green-600 hover:bg-green-700"
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
          vendors={vendors}
          onPlaceOrder={handlePlaceOrder}
          onCancel={() => setShowOrderForm(false)}
        />
      )}
    </div>
  );
};

export default OrderCalendar;
