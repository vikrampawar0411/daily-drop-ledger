
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

interface OrderFormProps {
  selectedDate: Date | undefined;
  vendors: Vendor[];
  onPlaceOrder: (vendor: string, product: string, quantity: number, dates: Date[]) => void;
  onCancel: () => void;
  allOrders: (date: Date) => any[];
  onDeleteOrder: (orderId: string) => void;
  hasAnyOrdersOnDate?: (date: Date) => boolean;
}

const OrderForm = ({ selectedDate, vendors, onPlaceOrder, onCancel, allOrders, onDeleteOrder, hasAnyOrdersOnDate }: OrderFormProps) => {
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

  const handleDateSelect = (date: Date | undefined, modifiers?: any, e?: any) => {
    if (!date) return;
    
    // Check if shift key is pressed for range selection
    if (e?.shiftKey && selectedDates.length > 0) {
      const lastDate = selectedDates[selectedDates.length - 1];
      const startDate = lastDate < date ? lastDate : date;
      const endDate = lastDate < date ? date : lastDate;
      
      // Generate all dates in the range
      const datesInRange: Date[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        datesInRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Add dates that aren't already selected
      setSelectedDates(prev => {
        const newDates = [...prev];
        datesInRange.forEach(d => {
          if (!newDates.some(existing => existing.toDateString() === d.toDateString())) {
            newDates.push(d);
          }
        });
        return newDates.sort((a, b) => a.getTime() - b.getTime());
      });
    } else {
      // Normal single date toggle
      setSelectedDates(prev => {
        const dateExists = prev.some(d => d.toDateString() === date.toDateString());
        if (dateExists) {
          return prev.filter(d => d.toDateString() !== date.toDateString());
        } else {
          return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
        }
      });
    }
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(prev => prev.filter(d => d.toDateString() !== dateToRemove.toDateString()));
  };

  // Get orders for selected product on calendar
  const hasOrdersOnDate = (date: Date) => {
    if (!selectedVendor || !selectedProduct) return false;
    // Create a date string in YYYY-MM-DD format for consistent comparison
    const dateStr = date.toISOString().split('T')[0];
    const orders = allOrders(date);
    return orders.some(order => {
      if (!order.order_date) return false;
      const orderDate = new Date(order.order_date);
      if (isNaN(orderDate.getTime())) return false; // Check if date is valid
      const orderDateStr = orderDate.toISOString().split('T')[0];
      return orderDateStr === dateStr && order.vendor === selectedVendor && order.product === selectedProduct;
    });
  };

  // Get orders for a specific date - show ALL orders for the date
  const getOrdersForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const orders = allOrders(date);
    
    // Return all orders for the date
    return orders.filter(order => {
      if (!order.order_date) return false;
      const orderDate = new Date(order.order_date);
      if (isNaN(orderDate.getTime())) return false;
      const orderDateStr = orderDate.toISOString().split('T')[0];
      return orderDateStr === dateStr;
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
                        className="h-3 w-3 cursor-pointer hover:text-red-600" 
                        onClick={() => removeDate(date)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Dates</label>
            <Calendar
              mode="single"
              selected={undefined}
              onDayClick={handleDateSelect}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                selected: (date) => selectedDates.some(d => d.toDateString() === date.toDateString()),
                hasOrders: (date) => {
                  // Always show green for ANY dates with existing orders
                  const anyOrders = hasAnyOrdersOnDate ? hasAnyOrdersOnDate(date) : false;
                  // Don't show green if date is already selected (blue takes priority)
                  const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
                  return anyOrders && !isSelected;
                }
              }}
              modifiersStyles={{
                selected: {
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                },
                hasOrders: {
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }
              }}
            />
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-600">
                Click dates to select/deselect • Hold Shift + Click to select range
              </p>
              <div className="flex flex-col gap-1 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Selected dates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Dates with existing orders</span>
                </div>
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
                                    className="h-7 w-7 p-0 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
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
