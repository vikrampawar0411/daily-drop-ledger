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
            today: (date) => {
              const today = new Date();
              return date.toDateString() === today.toDateString();
            },
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
            today: {
              boxShadow: '0 0 0 3px hsl(var(--primary)) inset',
              fontWeight: '700'
            },
            deliveredOrder: {
              backgroundColor: 'hsl(142 76% 73%)',
              color: 'hsl(142 76% 20%)',
              fontWeight: '600',
              border: '2px solid hsl(142 71% 45%)'
            },
            pendingOrder: {
              backgroundColor: 'hsl(38 92% 56%)',
              color: 'hsl(36 55% 15%)',
              fontWeight: '600',
              border: '2px solid hsl(38 92% 50%)'
            },
            futureOrder: {
              backgroundColor: 'hsl(213 97% 78%)',
              color: 'hsl(221 83% 33%)',
              fontWeight: '500',
              border: '2px solid hsl(217 91% 60%)'
            }
          }}
        />
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142 76% 73%)', border: '2px solid hsl(142 71% 45%)' }}></div>
            <span className="font-medium">Delivered orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(38 92% 56%)', border: '2px solid hsl(38 92% 50%)' }}></div>
            <span className="font-medium">Pending orders (action needed)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(213 97% 78%)', border: '2px solid hsl(217 91% 60%)' }}></div>
            <span className="font-medium">Future orders (scheduled)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-background" style={{ border: '4px solid hsl(var(--primary))' }}></div>
            <span className="font-medium">Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCalendarView;
