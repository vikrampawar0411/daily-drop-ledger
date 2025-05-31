
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Vendor } from "../types/order";

interface OrderFormProps {
  selectedDate: Date | undefined;
  vendors: Vendor[];
  onPlaceOrder: (vendor: string, product: string, quantity: number, dates: Date[]) => void;
  onCancel: () => void;
}

const OrderForm = ({ selectedDate, vendors, onPlaceOrder, onCancel }: OrderFormProps) => {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedDates, setSelectedDates] = useState<Date[]>(selectedDate ? [selectedDate] : []);

  const selectedVendorData = vendors.find(v => v.name === selectedVendor);

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

  const handlePlaceOrder = () => {
    if (selectedVendor && selectedProduct && quantity > 0 && selectedDates.length > 0) {
      onPlaceOrder(selectedVendor, selectedProduct, quantity, selectedDates);
      setSelectedVendor("");
      setSelectedProduct("");
      setQuantity(1);
      setSelectedDates([]);
    }
  };

  return (
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
                      <SelectItem key={product} value={product}>
                        {product}
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
  );
};

export default OrderForm;
