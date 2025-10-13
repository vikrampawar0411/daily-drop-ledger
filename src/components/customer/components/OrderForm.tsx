
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Vendor } from "../types/order";
import { CustomerDetailsDialog } from "../CustomerDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderFormProps {
  selectedDate: Date | undefined;
  vendors: Vendor[];
  onPlaceOrder: (vendor: string, product: string, quantity: number, dates: Date[]) => void;
  onCancel: () => void;
}

const OrderForm = ({ selectedDate, vendors, onPlaceOrder, onCancel }: OrderFormProps) => {
  const { toast } = useToast();
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedDates, setSelectedDates] = useState<Date[]>(selectedDate ? [selectedDate] : []);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  const [guestCustomerId, setGuestCustomerId] = useState<string | null>(null);

  const selectedVendorData = vendors.find(v => v.name === selectedVendor);

  // Get or create guest customer on mount
  useEffect(() => {
    const initGuestCustomer = async () => {
      const storedCustomerId = localStorage.getItem('guestCustomerId');
      
      if (storedCustomerId) {
        // Verify the customer still exists
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', storedCustomerId)
          .single();
        
        if (data && !error) {
          setGuestCustomerId(storedCustomerId);
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
        setGuestCustomerId(data.id);
        localStorage.setItem('guestCustomerId', data.id);
      }
    };
    
    initGuestCustomer();
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates(prev => {
      const dateExists = prev.some(d => d.toDateString() === date.toDateString());
      if (dateExists) {
        return prev.filter(d => d.toDateString() !== date.toDateString());
      } else {
        return [...prev, date];
      }
    });
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(prev => prev.filter(d => d.toDateString() !== dateToRemove.toDateString()));
  };

  const checkCustomerDetailsComplete = async () => {
    if (!guestCustomerId) return false;
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', guestCustomerId)
      .single();
    
    if (error || !data) return false;
    
    // Check if all required fields are complete
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
    if (!guestCustomerId) return;
    
    try {
      // Update customer with complete details
      const { error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', guestCustomerId);
      
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
        vendorId={selectedVendorData?.id || ""}
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
              onSelect={handleDateSelect}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                selected: (date) => selectedDates.some(d => d.toDateString() === date.toDateString())
              }}
              modifiersStyles={{
                selected: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 'bold'
                }
              }}
            />
            <p className="text-sm text-gray-600 mt-2">
              Click on dates to select/deselect them for the order
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handlePlaceOrder} 
            className="bg-green-600 hover:bg-green-700"
            disabled={selectedDates.length === 0 || !selectedVendor || !selectedProduct}
          >
            Schedule Order for {selectedDates.length} {selectedDates.length === 1 ? 'Day' : 'Days'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default OrderForm;
