
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrderCalendarViewProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  hasOrdersOnDate: (date: Date) => boolean;
}

const OrderCalendarView = ({ selectedDate, onSelectDate, hasOrdersOnDate }: OrderCalendarViewProps) => {
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
          className="rounded-md border pointer-events-auto"
          modifiers={{
            hasOrders: (date) => hasOrdersOnDate(date)
          }}
          modifiersStyles={{
            hasOrders: {
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              fontWeight: 'bold'
            }
          }}
        />
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Dates with orders</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCalendarView;
