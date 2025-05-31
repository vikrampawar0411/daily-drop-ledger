
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vendor } from "../types/order";

interface OrderFormProps {
  selectedDate: Date | undefined;
  vendors: Vendor[];
  onPlaceOrder: (vendor: string, product: string, quantity: number) => void;
  onCancel: () => void;
}

const OrderForm = ({ selectedDate, vendors, onPlaceOrder, onCancel }: OrderFormProps) => {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedVendorData = vendors.find(v => v.name === selectedVendor);

  const handlePlaceOrder = () => {
    if (selectedVendor && selectedProduct && quantity > 0) {
      onPlaceOrder(selectedVendor, selectedProduct, quantity);
      setSelectedVendor("");
      setSelectedProduct("");
      setQuantity(1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Schedule Order for {selectedDate?.toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="flex space-x-2">
          <Button onClick={handlePlaceOrder} className="bg-green-600 hover:bg-green-700">
            Schedule Order
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
