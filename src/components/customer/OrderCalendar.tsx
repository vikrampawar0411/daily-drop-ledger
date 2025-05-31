
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus, Milk, Newspaper, Plus } from "lucide-react";

const OrderCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const vendors = [
    { id: 1, name: "Fresh Dairy Co.", products: ["Fresh Milk", "Organic Milk"] },
    { id: 2, name: "News Express", products: ["Times of India", "Maharashtra Times"] },
    { id: 3, name: "Daily Essentials", products: ["Fresh Milk", "Indian Express"] }
  ];

  const orders = [
    {
      date: "2024-12-01",
      orders: [
        { vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" },
        { vendor: "News Express", product: "Times of India", quantity: 1, unit: "copy" }
      ]
    },
    {
      date: "2024-12-02",
      orders: [
        { vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" }
      ]
    },
    {
      date: "2024-12-03",
      orders: [
        { vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" },
        { vendor: "News Express", product: "Times of India", quantity: 1, unit: "copy" },
        { vendor: "Daily Essentials", product: "Indian Express", quantity: 1, unit: "copy" }
      ]
    }
  ];

  const getOrdersForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return orders.find(order => order.date === dateString)?.orders || [];
  };

  const hasOrdersOnDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return orders.some(order => order.date === dateString);
  };

  const handlePlaceOrder = () => {
    if (selectedDate && selectedVendor && selectedProduct && quantity > 0) {
      console.log("Placing order:", {
        date: selectedDate.toISOString().split('T')[0],
        vendor: selectedVendor,
        product: selectedProduct,
        quantity
      });
      setShowOrderForm(false);
      setSelectedVendor("");
      setSelectedProduct("");
      setQuantity(1);
    }
  };

  const selectedVendorData = vendors.find(v => v.name === selectedVendor);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Calendar</h2>
        <Button 
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="bg-green-600 hover:bg-green-700"
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          Schedule Order
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
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

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? `Orders for ${selectedDate.toLocaleDateString()}` : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                {getOrdersForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getOrdersForDate(selectedDate).map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {order.product.toLowerCase().includes('milk') ? (
                            <Milk className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Newspaper className="h-5 w-5 text-orange-600" />
                          )}
                          <div>
                            <div className="font-medium">{order.product}</div>
                            <div className="text-sm text-gray-600">{order.vendor}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{order.quantity} {order.unit}</div>
                          <Badge variant="outline" className="text-xs">Scheduled</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No orders scheduled for this date</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowOrderForm(true)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Order
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a date to view or add orders</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Form */}
      {showOrderForm && (
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
              <Button variant="outline" onClick={() => setShowOrderForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderCalendar;
