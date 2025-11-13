import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_date: string;
  status: string;
  [key: string]: any;
}

interface OrderCalendarViewProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  hasOrdersOnDate: (date: Date) => boolean;
  getOrdersForDate: (date: Date) => Order[];
}

const OrderCalendarView = ({ selectedDate, onSelectDate, hasOrdersOnDate, getOrdersForDate }: OrderCalendarViewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Date</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          className={cn("rounded-md border pointer-events-auto")}
          modifiers={{
            hasOrders: (date) => hasOrdersOnDate(date),
            deliveredOrder: (date) => {
              const dateStr = date.toISOString().split('T')[0];
              const orders = getOrdersForDate(date);
              return orders.some(o => 
                o.order_date && 
                new Date(o.order_date).toISOString().split('T')[0] === dateStr && 
                o.status === 'delivered'
              );
            },
            pendingOrder: (date) => {
              const dateStr = date.toISOString().split('T')[0];
              const orders = getOrdersForDate(date);
              return orders.some(o => 
                o.order_date && 
                new Date(o.order_date).toISOString().split('T')[0] === dateStr && 
                o.status === 'pending'
              );
            },
            futureOrder: (date) => {
              const dateStr = date.toISOString().split('T')[0];
              const today = new Date().toISOString().split('T')[0];
              const orders = getOrdersForDate(date);
              return dateStr > today && orders.length > 0;
            }
          }}
          modifiersStyles={{
            hasOrders: {
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              fontWeight: 'bold'
            },
            deliveredOrder: {
              backgroundColor: '#86efac',
              color: '#166534',
              fontWeight: 'bold'
            },
            pendingOrder: {
              backgroundColor: '#fbbf24',
              color: '#78350f',
              fontWeight: '600'
            },
            futureOrder: {
              backgroundColor: '#93c5fd',
              color: '#1e3a8a',
              fontWeight: '500'
            }
          }}
        />
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#86efac] border border-[#166534] rounded"></div>
            <span>Delivered orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#fbbf24] border border-[#78350f] rounded"></div>
            <span>Pending orders (action needed)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#93c5fd] border border-[#1e3a8a] rounded"></div>
            <span>Future orders (scheduled)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCalendarView;
