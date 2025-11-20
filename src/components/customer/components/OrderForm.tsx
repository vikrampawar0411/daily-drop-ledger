
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X, Trash2 } from "lucide-react";
import type { Vendor } from "../types/order";
import { CustomerDetailsDialog } from "../CustomerDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface OrderFormProps {
  selectedDate: Date | undefined;
  vendors: Vendor[];
  onPlaceOrder: (vendor: string, product: string, quantity: number, dates: Date[]) => Promise<void>;
  onCancel: () => void;
  allOrders: (date: Date) => any[];
  onDeleteOrder: (orderId: string) => Promise<void>;
  hasAnyOrdersOnDate?: (date: Date) => boolean;
  filterVendorId?: string;
  filterProductId?: string;
  refetch: () => Promise<void>;
}

const OrderForm = ({ selectedDate, vendors, onPlaceOrder, onCancel, allOrders, onDeleteOrder, hasAnyOrdersOnDate, filterVendorId = "", filterProductId = "", refetch }: OrderFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedDates, setSelectedDates] = useState<Date[]>(selectedDate ? [selectedDate] : []);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragSelectedDates, setDragSelectedDates] = useState<Date[]>([]);

  const selectedVendorData = vendors.find(v => v.name === selectedVendor);

  // Preselect last ordered vendor and product
  useEffect(() => {
    const lastOrder = allOrders(new Date())[0];
    if (lastOrder && !selectedVendor && !selectedProduct) {
      setSelectedVendor(lastOrder.vendor);
      setSelectedProduct(lastOrder.product);
    }
  }, [allOrders, selectedVendor, selectedProduct]);

  // Get customer ID based on auth state
  useEffect(() => {
    const initCustomer = async () => {
      setIsLoadingCustomer(true);
      
      if (user) {
        // User is logged in - fetch their customer record
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data && !error) {
          setCustomerId(data.id);
          setIsLoadingCustomer(false);
          return;
        }
      }
      
      // Guest user - check localStorage
      const storedCustomerId = localStorage.getItem('guestCustomerId');
      
      if (storedCustomerId) {
        // Verify the customer still exists
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', storedCustomerId)
          .maybeSingle();
        
        if (data && !error) {
          setCustomerId(storedCustomerId);
          setIsLoadingCustomer(false);
          return;
        }
      }
      
      // Create a new guest customer
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: 'Guest',
          phone: '',
          address: 'Incomplete'
        }])
        .select()
        .single();
      
      if (data && !error) {
        setCustomerId(data.id);
        localStorage.setItem('guestCustomerId', data.id);
      }
      
      setIsLoadingCustomer(false);
    };
    
    initCustomer();
  }, [user]);

  const handleDateSelect = async (date: Date | undefined, modifiers?: any, e?: any) => {
    if (!date || !selectedVendor || !selectedProduct || quantity <= 0) {
      if (!selectedVendor || !selectedProduct) {
        toast({
          title: "Please select vendor and product first",
          variant: "destructive",
        });
      }
      return;
    }

    // Check if order already exists for this date
    const existingOrders = getOrdersForDate(date);
    const existingOrder = existingOrders.find(
      o => o.vendor === selectedVendor && o.product === selectedProduct
    );

    if (existingOrder) {
      // Check if order is delivered - prevent deletion
      if (existingOrder.status === 'delivered') {
        toast({
          title: "Cannot remove delivered order",
          description: "Delivered orders cannot be modified from the calendar",
          variant: "destructive",
        });
        return;
      }
      
      // Check customer details before deletion
      const isComplete = await checkCustomerDetailsComplete();
      if (!isComplete) {
        setPendingOrderData({
          vendor: selectedVendor,
          product: selectedProduct,
          quantity,
          dates: [date]
        });
        setShowCustomerDialog(true);
        return;
      }

      // Order exists and not delivered → Remove it
      await onDeleteOrder(existingOrder.id);
      await refetch();
      toast({
        title: "Order removed",
        description: `Removed order for ${date.toLocaleDateString()}`,
      });
    } else {
      // Check customer details before placing order
      const isComplete = await checkCustomerDetailsComplete();
      if (!isComplete) {
        setPendingOrderData({
          vendor: selectedVendor,
          product: selectedProduct,
          quantity,
          dates: [date]
        });
        setShowCustomerDialog(true);
        return;
      }
      
      // No order → Place it
      await onPlaceOrder(selectedVendor, selectedProduct, quantity, [date]);
      await refetch();
      toast({
        title: "Order placed",
        description: `Order scheduled for ${date.toLocaleDateString()}`,
      });
    }
  };

  // Helper function to get all dates in range
  const getDatesInRange = (start: Date, end: Date): Date[] => {
    const dates: Date[] = [];
    const startDate = start < end ? start : end;
    const endDate = start < end ? end : start;
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Mouse event handlers (desktop)
  const handleMouseDown = (date: Date) => {
    if (!selectedVendor || !selectedProduct) return;
    
    setIsDragging(true);
    setDragStartDate(date);
    setDragSelectedDates([date]);
  };

  const handleMouseEnter = (date: Date) => {
    if (!isDragging || !dragStartDate) return;
    
    // Calculate all dates between start and current
    const datesInRange = getDatesInRange(dragStartDate, date);
    setDragSelectedDates(datesInRange);
  };

  const handleMouseUp = async () => {
    if (!isDragging || dragSelectedDates.length === 0) {
      setIsDragging(false);
      return;
    }

    // Check customer details
    const isComplete = await checkCustomerDetailsComplete();
    if (!isComplete) {
      setPendingOrderData({
        vendor: selectedVendor,
        product: selectedProduct,
        quantity,
        dates: dragSelectedDates
      });
      setShowCustomerDialog(true);
      setIsDragging(false);
      setDragSelectedDates([]);
      return;
    }

    // Place orders for all selected dates
    for (const date of dragSelectedDates) {
      const existingOrders = getOrdersForDate(date);
      const existingOrder = existingOrders.find(
        o => o.vendor === selectedVendor && o.product === selectedProduct
      );
      
      if (!existingOrder) {
        await onPlaceOrder(selectedVendor, selectedProduct, quantity, [date]);
      }
    }

    await refetch();
    
    toast({
      title: "Orders placed",
      description: `Placed orders for ${dragSelectedDates.length} date${dragSelectedDates.length > 1 ? 's' : ''}`,
    });

    // Reset drag state
    setIsDragging(false);
    setDragStartDate(null);
    setDragSelectedDates([]);
  };

  // Touch event handlers (mobile)
  const handleTouchStart = (date: Date, e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown(date);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.getAttribute('data-date')) {
      const dateStr = element.getAttribute('data-date');
      const date = new Date(dateStr!);
      handleMouseEnter(date);
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    
    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, dragSelectedDates, selectedVendor, selectedProduct, quantity]);

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(prev => prev.filter(d => d.toDateString() !== dateToRemove.toDateString()));
  };

  // Get orders for selected product on calendar
  const hasOrdersOnDate = (date: Date) => {
    if (!selectedVendor || !selectedProduct) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const orders = allOrders(date);
    return orders.some(order => {
      if (!order.order_date) return false;
      return order.order_date === dateStr && order.vendor === selectedVendor && order.product === selectedProduct;
    });
  };

  // Get orders for a specific date - show ALL orders for the date
  const getOrdersForDate = (date: Date) => {
    // The allOrders function already returns filtered orders for the date
    const orders = allOrders(date);
    // Apply additional filters if set
    return orders.filter((order: any) => {
      if (filterVendorId && order.vendor_id !== filterVendorId) return false;
      if (filterProductId && order.product_id !== filterProductId) return false;
      return true;
    });
  };

  const checkCustomerDetailsComplete = async () => {
    if (!customerId) return false;
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();
    
    if (error || !data) return false;
    
    // If user is logged in, assume their details are complete
    if (user) return true;
    
    // For guest users, check if all required fields are complete
    return !!(
      data.name && 
      data.name !== 'Guest' &&
      data.phone && 
      data.area_id && 
      data.society_id && 
      data.flat_plot_house_number
    );
  };

  const handlePlaceOrder = async () => {
    if (selectedVendor && selectedProduct && quantity > 0 && selectedDates.length > 0) {
      // Check if customer details are complete
      const isComplete = await checkCustomerDetailsComplete();
      
      if (!isComplete) {
        // Store the order data and show customer details dialog
        setPendingOrderData({
          vendor: selectedVendor,
          product: selectedProduct,
          quantity,
          dates: selectedDates
        });
        setShowCustomerDialog(true);
        return;
      }
      
      // Proceed with order
      onPlaceOrder(selectedVendor, selectedProduct, quantity, selectedDates);
      setSelectedVendor("");
      setSelectedProduct("");
      setQuantity(1);
      setSelectedDates([]);
    }
  };

  const handleCustomerDetailsSubmit = async (customerData: any) => {
    if (!customerId) return;
    
    try {
      // Update customer with complete details
      const { error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', customerId);
      
      if (error) throw error;
      
      setShowCustomerDialog(false);
      
      // Now place the pending order
      if (pendingOrderData) {
        onPlaceOrder(
          pendingOrderData.vendor,
          pendingOrderData.product,
          pendingOrderData.quantity,
          pendingOrderData.dates
        );
        setSelectedVendor("");
        setSelectedProduct("");
        setQuantity(1);
        setSelectedDates([]);
        setPendingOrderData(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save customer details",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <CustomerDetailsDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onSubmit={handleCustomerDetailsSubmit}
      />
      
      <Card>
      <CardHeader>
        <CardTitle>
          Schedule Order for Multiple Days
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Vendor</label>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.name}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Select Product</label>
                <Select 
                  value={selectedProduct} 
                  onValueChange={setSelectedProduct}
                  disabled={!selectedVendor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose product" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedVendorData?.products.map(product => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <Select 
                  value={quantity.toString()} 
                  onValueChange={(value) => setQuantity(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedDates.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Selected Dates ({selectedDates.length})</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedDates.map((date, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {date.toLocaleDateString()}
                      <X 
                        className="h-3 w-3 cursor-pointer text-gray-600 hover:text-gray-800" 
                        onClick={() => removeDate(date)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select Dates
            </label>
            <div 
              onMouseUp={handleMouseUp}
              onTouchEnd={handleTouchEnd}
              style={{ userSelect: 'none' }}
            >
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={undefined}
                className={cn("rounded-md border pointer-events-auto")}
                modifiers={{
                  today: (date) => {
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                  },
                  dragSelected: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return dragSelectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
                  },
                  deliveredOrder: (date) => {
                    const orders = getOrdersForDate(date);
                    return orders.some(o => o.status === 'delivered' && 
                      o.vendor === selectedVendor && o.product === selectedProduct);
                  },
                  pendingOrder: (date) => {
                    const orders = getOrdersForDate(date);
                    return orders.some(o => o.status === 'pending' && 
                      o.vendor === selectedVendor && o.product === selectedProduct);
                  },
                  futureOrder: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const today = format(new Date(), 'yyyy-MM-dd');
                    const orders = getOrdersForDate(date);
                    return dateStr > today && 
                      orders.some(o => o.vendor === selectedVendor && o.product === selectedProduct);
                  }
                }}
                modifiersStyles={{
                  today: {
                    boxShadow: '0 0 0 3px hsl(var(--primary)) inset',
                    fontWeight: '700'
                  },
                  dragSelected: {
                    boxShadow: '0 0 0 2px hsl(217 91% 60%) inset',
                    backgroundColor: 'hsl(217 91% 90%)'
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
                onDayClick={handleDateSelect}
              />
            </div>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Click</strong> to place/remove single order<br/>
                <strong>Note:</strong> Delivered orders cannot be removed
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142 76% 73%)', border: '2px solid hsl(142 71% 45%)' }}></div>
                <span className="font-medium">Delivered orders</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(38 92% 56%)', border: '2px solid hsl(38 92% 50%)' }}></div>
                <span className="font-medium">Pending orders (action needed)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(214 95% 93%)', border: '1px solid hsl(213 97% 78%)', opacity: 0.7 }}></div>
                <span className="font-medium text-gray-500">Future orders (lighter color)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-background" style={{ border: '4px solid hsl(var(--primary))' }}></div>
                <span className="font-medium">Today</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedDates.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Orders on Selected Dates</label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-left py-2 px-3">Vendor</th>
                      <th className="text-left py-2 px-3">Product</th>
                      <th className="text-left py-2 px-3">Quantity</th>
                      <th className="text-right py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDates.map((date, index) => {
                      const ordersOnDate = getOrdersForDate(date);
                      return (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-3 font-medium">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-2 px-3">
                            {ordersOnDate.length > 0 ? (
                              ordersOnDate.map((order, idx) => (
                                <div key={idx}>{order.vendor}</div>
                              ))
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {ordersOnDate.length > 0 ? (
                              ordersOnDate.map((order, idx) => (
                                <div key={idx}>{order.product}</div>
                              ))
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {ordersOnDate.length > 0 ? (
                              ordersOnDate.map((order, idx) => (
                                <div key={idx}>{order.quantity} {order.unit}</div>
                              ))
                            ) : (
                              <span className="text-gray-500">No orders</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {ordersOnDate.length > 0 && (
                              <div className="flex justify-end space-x-1">
                                {ordersOnDate.map((order) => (
                                  <Button
                                    key={order.id}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDeleteOrder(order.id)}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              type="button"
              onClick={handlePlaceOrder} 
              className="bg-green-600 hover:bg-green-700"
              disabled={selectedDates.length === 0 || !selectedVendor || !selectedProduct || isLoadingCustomer}
            >
              Schedule Order for {selectedDates.length} {selectedDates.length === 1 ? 'Day' : 'Days'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default OrderForm;
