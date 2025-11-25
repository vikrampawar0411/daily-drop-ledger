import { useRef, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Order {
  id: string;
  order_date: string;
  status: string;
  [key: string]: any;
}

interface Vendor {
  id: string;
  name: string;
  [key: string]: any;
}

interface Product {
  id: string;
  name: string;
  [key: string]: any;
}

interface OrderCalendarViewProps {
  selectedDates: Date[] | undefined;
  onSelectDates: (dates: Date[] | undefined) => void;
  hasOrdersOnDate: (date: Date) => boolean;
  getOrdersForDate: (date: Date) => Order[];
  onDateClick?: (dates: Date[]) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  subscribeBeforeTime?: string | null;
  subscriptionCount?: number;
  onNavigateToSubscriptions?: () => void;
  vendors: Vendor[];
  availableProducts: Product[];
  selectedVendor: string;
  selectedProduct: string;
  onVendorChange: (vendorId: string) => void;
  onProductChange: (productId: string) => void;
  orders: any[];
}

const OrderCalendarView = ({ 
  selectedDates, 
  onSelectDates, 
  hasOrdersOnDate, 
  getOrdersForDate, 
  onDateClick, 
  month, 
  onMonthChange, 
  subscribeBeforeTime, 
  subscriptionCount, 
  onNavigateToSubscriptions,
  vendors,
  availableProducts,
  selectedVendor,
  selectedProduct,
  onVendorChange,
  onProductChange,
  orders
}: OrderCalendarViewProps) => {
  const calendarRef = useRef<HTMLDivElement>(null);

  // Autofocus calendar when vendor and product are selected
  useEffect(() => {
    if (selectedVendor && selectedProduct && selectedProduct !== 'all' && calendarRef.current) {
      const calendarButton = calendarRef.current.querySelector('button[name="day"]');
      if (calendarButton) {
        (calendarButton as HTMLElement).focus();
      }
    }
  }, [selectedVendor, selectedProduct]);

  const handleDateSelect = (dates: Date[] | undefined) => {
    onSelectDates(dates);
    
    // Always call onDateClick, even when dates are cleared
    if (onDateClick) {
      if (dates && dates.length > 0) {
        onDateClick(dates);
      } else {
        // Pass empty array when dates are cleared
        onDateClick([]);
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order View</CardTitle>
        <p className="text-xs text-muted-foreground">(Select date(s) to place new order)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vendor Dropdown */}
        <div className="space-y-2">
          <Label>Select Vendor</Label>
          <Select
            value={selectedVendor}
            onValueChange={onVendorChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose vendor" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Dropdown - Show after vendor is selected */}
        {selectedVendor && (
          <div className="space-y-2">
            <Label>Select Product</Label>
            <Select
              value={selectedProduct !== 'all' ? selectedProduct : ''}
              onValueChange={onProductChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose product" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {availableProducts
                  .filter(p => {
                    return orders.some(o => o.vendor.id === selectedVendor && o.product.id === p.id);
                  })
                  .map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
        

        <div ref={calendarRef}>
          <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={handleDateSelect}
              month={month}
              onMonthChange={onMonthChange}
              className={cn("rounded-md border pointer-events-auto")}
              disabled={(date) => {
              const compareDate = new Date(date);
              compareDate.setHours(0, 0, 0, 0);
              
              // If no cutoff time is set, only disable past dates
              if (!subscribeBeforeTime) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return compareDate < today;
              }
              
              // Calculate cutoff datetime for this specific date
              // Cutoff = (orderDate - 1 day) at subscribe_before time
              const now = new Date();
              const [hours, minutes] = subscribeBeforeTime.split(':').map(Number);
              
              const cutoffDateTime = new Date(compareDate);
              cutoffDateTime.setDate(cutoffDateTime.getDate() - 1); // Day before delivery
              cutoffDateTime.setHours(hours, minutes, 0, 0);
              
              // If current time is past the cutoff, this date cannot be selected
              return now > cutoffDateTime;
            }}
          modifiers={{
            today: (date) => {
              const today = new Date();
              return date.toDateString() === today.toDateString();
            },
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
              color: 'hsl(215 20% 25%)',
              fontWeight: '400',
              border: '1px solid hsl(213 97% 78%)',
              opacity: 1
            }
          }}
          modifiersClassNames={{
            selected: '!ring-4 !ring-ring !ring-offset-2',
            disabled: 'cursor-not-allowed'
          }}
        />
        </div>
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
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(214 95% 93%)', border: '1px solid hsl(213 97% 78%)' }}></div>
            <span className="font-normal">Future orders</span>
          </div>
          {subscriptionCount !== undefined && subscriptionCount > 0 && onNavigateToSubscriptions && (
            <div className="pt-2 border-t border-border">
              <button 
                onClick={onNavigateToSubscriptions}
                className="flex items-center space-x-2 hover:text-primary transition-colors cursor-pointer text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                <span className="underline">{subscriptionCount} subscribed {subscriptionCount === 1 ? 'product' : 'products'}</span>
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCalendarView;
