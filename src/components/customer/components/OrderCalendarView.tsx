import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  onDateClick?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  onCalendarAreaClick?: () => void;
}

const OrderCalendarView = ({ selectedDate, onSelectDate, hasOrdersOnDate, getOrdersForDate, onDateClick, month, onMonthChange, onCalendarAreaClick }: OrderCalendarViewProps) => {
  const handleDateSelect = (date: Date | undefined) => {
    onSelectDate(date);
    if (date && onDateClick) {
      onDateClick(date);
    }
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Check if click is NOT on a date button (rdp-day class)
    const target = e.target as HTMLElement;
    const isDateButton = target.closest('.rdp-day');
    
    if (!isDateButton && onCalendarAreaClick) {
      onCalendarAreaClick();
    }
  };
  
  return (
    <Card onClick={handleCardClick}>
      <CardHeader>
        <CardTitle>Order View</CardTitle>
        <p className="text-xs text-muted-foreground">(Select date to place new order)</p>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          month={month}
          onMonthChange={onMonthChange}
          className={cn("rounded-md border pointer-events-auto")}
          modifiers={{
            today: (date) => {
              const today = new Date();
              return date.toDateString() === today.toDateString();
            },
            selected: selectedDate,
            deliveredOrder: (date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const orders = getOrdersForDate(date);
              return orders.some(o => 
                o.order_date && 
                o.order_date === dateStr && 
                o.status === 'delivered'
              );
            },
            pendingOrder: (date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const orders = getOrdersForDate(date);
              return orders.some(o => 
                o.order_date && 
                o.order_date === dateStr && 
                o.status === 'pending'
              );
            },
            futureOrder: (date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const today = format(new Date(), 'yyyy-MM-dd');
              const orders = getOrdersForDate(date);
              return dateStr > today && orders.length > 0;
            }
          }}
          modifiersStyles={{
            today: {
              boxShadow: '0 0 0 3px hsl(var(--primary)) inset',
              fontWeight: '700'
            },
            selected: {
              boxShadow: '0 0 0 4px hsl(var(--ring)) inset'
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
              backgroundColor: 'hsl(214 95% 93%)',
              color: 'hsl(213 97% 70%)',
              fontWeight: '400',
              border: '1px solid hsl(213 97% 78%)',
              opacity: 0.7
            }
          }}
          modifiersClassNames={{
            selected: '!ring-4 !ring-ring !ring-offset-2'
          }}
        />
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142 76% 73%)', border: '2px solid hsl(142 71% 45%)' }}></div>
            <span className="font-normal">Delivered orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(38 92% 56%)', border: '2px solid hsl(38 92% 50%)' }}></div>
            <span className="font-normal">Pending orders (action needed)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(214 95% 93%)', border: '1px solid hsl(213 97% 78%)', opacity: 0.7 }}></div>
            <span className="font-normal text-gray-500">Future orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-background" style={{ border: '4px solid hsl(var(--primary))' }}></div>
            <span className="font-normal">Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCalendarView;
