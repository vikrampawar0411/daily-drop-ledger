import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, isBefore, isAfter, startOfDay } from "date-fns";

interface SubscriptionCalendarViewProps {
  pauseFromDate: Date | undefined;
  pauseUntilDate: Date | undefined;
  onSelectPauseFrom: (date: Date | undefined) => void;
  onSelectPauseUntil: (date: Date | undefined) => void;
  orders: any[];
}

const SubscriptionCalendarView = ({ 
  pauseFromDate, 
  pauseUntilDate, 
  onSelectPauseFrom, 
  onSelectPauseUntil,
  orders
}: SubscriptionCalendarViewProps) => {
  const today = startOfDay(new Date());

  // Check if a date has orders
  const hasOrdersOnDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return orders.some(order => format(new Date(order.order_date), 'yyyy-MM-dd') === dateStr);
  };

  // Check if order is in the past
  const isOrderInPast = (date: Date) => {
    return isBefore(startOfDay(date), today);
  };

  // Check if order is in the future
  const isOrderInFuture = (date: Date) => {
    return isAfter(startOfDay(date), today);
  };

  // Check if order is delivered
  const isOrderDelivered = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return orders.some(order => 
      format(new Date(order.order_date), 'yyyy-MM-dd') === dateStr && 
      order.status === 'delivered'
    );
  };

  // Check if order is pending
  const isOrderPending = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return orders.some(order => 
      format(new Date(order.order_date), 'yyyy-MM-dd') === dateStr && 
      order.status === 'pending'
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!pauseFromDate) {
      onSelectPauseFrom(date);
    } else if (!pauseUntilDate) {
      // Ensure pause until is after pause from
      if (isAfter(date, pauseFromDate) || format(date, 'yyyy-MM-dd') === format(pauseFromDate, 'yyyy-MM-dd')) {
        onSelectPauseUntil(date);
      } else {
        // Reset and start over
        onSelectPauseFrom(date);
        onSelectPauseUntil(undefined);
      }
    } else {
      // Reset and start over
      onSelectPauseFrom(date);
      onSelectPauseUntil(undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Pause Period</CardTitle>
        <div className="text-sm text-muted-foreground">
          {!pauseFromDate && "Click to select pause start date"}
          {pauseFromDate && !pauseUntilDate && "Click to select pause end date"}
          {pauseFromDate && pauseUntilDate && `Pausing from ${format(pauseFromDate, 'PPP')} to ${format(pauseUntilDate, 'PPP')}`}
        </div>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={pauseFromDate}
          onSelect={handleDateSelect}
          className={cn("rounded-md border pointer-events-auto")}
          modifiers={{
            pauseFrom: pauseFromDate ? [pauseFromDate] : [],
            pauseUntil: pauseUntilDate ? [pauseUntilDate] : [],
            pauseRange: pauseFromDate && pauseUntilDate ? {
              from: pauseFromDate,
              to: pauseUntilDate
            } : undefined,
            deliveredOrder: (date) => hasOrdersOnDate(date) && isOrderDelivered(date) && isOrderInPast(date),
            pendingOrder: (date) => hasOrdersOnDate(date) && isOrderPending(date),
            futureOrder: (date) => hasOrdersOnDate(date) && isOrderInFuture(date)
          }}
          modifiersStyles={{
            pauseFrom: {
              backgroundColor: '#fef3c7',
              color: '#92400e',
              fontWeight: 'bold',
              border: '2px solid #f59e0b'
            },
            pauseUntil: {
              backgroundColor: '#fef3c7',
              color: '#92400e',
              fontWeight: 'bold',
              border: '2px solid #f59e0b'
            },
            pauseRange: {
              backgroundColor: '#fef9e7',
              color: '#92400e'
            },
            deliveredOrder: {
              backgroundColor: '#86efac',
              color: '#166534',
              fontWeight: 'bold'
            },
            pendingOrder: {
              backgroundColor: '#60a5fa',
              color: '#1e3a8a',
              fontWeight: 'bold'
            },
            futureOrder: {
              backgroundColor: '#bfdbfe',
              color: '#1e40af',
              fontWeight: '500'
            }
          }}
          disabled={(date) => isBefore(date, today)}
        />
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[#86efac] border border-[#166534] rounded"></div>
            <span>Delivered orders (past)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[#60a5fa] border border-[#1e3a8a] rounded"></div>
            <span>Pending orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[#bfdbfe] border border-[#1e40af] rounded"></div>
            <span>Future orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[#fef3c7] border-2 border-[#f59e0b] rounded"></div>
            <span>Selected pause dates</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCalendarView;
