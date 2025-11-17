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
            today: (date) => {
              const today = new Date();
              return date.toDateString() === today.toDateString();
            },
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
            today: {
              boxShadow: '0 0 0 3px hsl(var(--primary)) inset',
              fontWeight: '700'
            },
            pauseFrom: {
              backgroundColor: 'hsl(48 96% 89%)',
              color: 'hsl(36 45% 15%)',
              fontWeight: '600',
              border: '2px solid hsl(38 92% 50%)'
            },
            pauseUntil: {
              backgroundColor: 'hsl(48 96% 89%)',
              color: 'hsl(36 45% 15%)',
              fontWeight: '600',
              border: '2px solid hsl(38 92% 50%)'
            },
            pauseRange: {
              backgroundColor: 'hsl(48 100% 96%)',
              color: 'hsl(36 45% 15%)',
              fontWeight: 'normal'
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
          disabled={(date) => isBefore(date, today)}
        />
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142 76% 73%)', border: '2px solid hsl(142 71% 45%)' }}></div>
            <span className="font-medium">Delivered orders (past)</span>
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
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(48 96% 89%)', border: '2px solid hsl(38 92% 50%)' }}></div>
            <span className="font-medium">Selected pause dates</span>
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

export default SubscriptionCalendarView;
