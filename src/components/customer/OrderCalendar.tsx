
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus, Milk, Newspaper, Plus, Trash2, Edit } from "lucide-react";

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

  const [orders, setOrders] = useState([
    {
      date: "2024-12-01",
      orders: [
        { id: 1, vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" },
        { id: 2, vendor: "News Express", product: "Times of India", quantity: 1, unit: "copy" },
        { id: 3, vendor: "Daily Essentials", product: "Indian Express", quantity: 1, unit: "copy" }
      ]
    },
    {
      date: "2024-12-02",
      orders: [
        { id: 4, vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" },
        { id: 5, vendor: "News Express", product: "Times of India", quantity: 1, unit: "copy" }
      ]
    },
    {
      date: "2024-12-03",
      orders: [
        { id: 6, vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" },
        { id: 7, vendor: "News Express", product: "Times of India", quantity: 1, unit: "copy" },
        { id: 8, vendor: "Daily Essentials", product: "Indian Express", quantity: 1, unit: "copy" }
      ]
    }
  ]);

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
      const dateString = selectedDate.toISOString().split('T')[0];
      const newOrder = {
        id: Date.now(),
        vendor: selectedVendor,
        product: selectedProduct,
        quantity,
        unit: selectedProduct.toLowerCase().includes('milk') ? (quantity > 1 ? 'litres' : 'litre') : (quantity > 1 ? 'copies' : 'copy')
      };

      setOrders(prevOrders => {
        const existingDateIndex = prevOrders.findIndex(order => order.date === dateString);
        if (existingDateIndex >= 0) {
          const updatedOrders = [...prevOrders];
          updatedOrders[existingDateIndex].orders.push(newOrder);
          return updatedOrders;
        } else {
          return [...prevOrders, { date: dateString, orders: [newOrder] }];
        }
      });

      setShowOrderForm(false);
      setSelectedVendor("");
      setSelectedProduct("");
      setQuantity(1);
    }
  };

  const handleDeleteOrder = (orderId: number) => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setOrders(prevOrders => {
        return prevOrders.map(dateOrder => {
          if (dateOrder.date === dateString) {
            return {
              ...dateOrder,
              orders: dateOrder.orders.filter(order => order.id !== orderId)
            };
          }
          return dateOrder;
        }).filter(dateOrder => dateOrder.orders.length > 0);
      });
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
            <CardTitle className="flex items-center justify-between">
              {selectedDate ? `Orders for ${selectedDate.toLocaleDateString()}` : "Select a date"}
              {selectedDate && getOrdersForDate(selectedDate).length > 0 && (
                <Badge variant="outline" className="text-sm">
                  {getOrdersForDate(selectedDate).length} orders
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                {getOrdersForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getOrdersForDate(selectedDate).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                        <div className="flex items-center space-x-2">
                          <div className="text-right mr-2">
                            <div className="font-medium">{order.quantity} {order.unit}</div>
                            <Badge variant="outline" className="text-xs">Scheduled</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
