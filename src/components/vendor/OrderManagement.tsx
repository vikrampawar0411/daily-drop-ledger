import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, CheckCircle, AlertCircle, Package, Filter, Search } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { format } from "date-fns";

const OrderManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryDateTime, setDeliveryDateTime] = useState("");
  const { orders, loading, updateOrderStatus } = useOrders();

  const handleMarkDelivered = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDeliveryDateTime(new Date().toISOString().slice(0, 16));
    setDeliveryDialogOpen(true);
  };

  const confirmDelivery = () => {
    if (selectedOrderId && deliveryDateTime) {
      updateOrderStatus(selectedOrderId, "delivered", new Date(deliveryDateTime).toISOString());
      setDeliveryDialogOpen(false);
      setSelectedOrderId(null);
    }
  };

  // Filter orders by selected date
  const todayOrders = orders.filter(order => order.order_date === selectedDate);

  const filterOrders = () => {
    return todayOrders.filter(order => {
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      const matchesSearch = searchTerm === "" || 
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  };

  const filteredOrders = filterOrders();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading orders...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-md px-3 py-1"
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Customer, product, vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Badge variant="outline" className="h-10 px-4">
                {filteredOrders.length} orders found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{order.customer.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Customer:</span>
                        <div className="text-gray-600">{order.customer.name}</div>
                        <div className="text-gray-600">{order.customer.address}</div>
                        <div className="text-gray-600">{order.customer.phone}</div>
                      </div>
                      <div>
                        <span className="font-medium">Vendor:</span>
                        <div className="text-gray-600">{order.vendor.name}</div>
                        <div className="text-gray-600 text-xs">{order.vendor.category}</div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-sm">Product:</span>
                      <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 mt-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">{order.product.name}</div>
                          <div className="text-xs text-gray-600">
                            {order.quantity} {order.unit} × ₹{order.product.price} = ₹{order.total_amount}
                          </div>
                        </div>
                      </div>
                    </div>

                    {order.delivered_at && (
                      <div className="bg-green-50 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium text-green-800">Delivered: </span>
                        <span className="text-green-600">
                          {format(new Date(order.delivered_at), "PPp")}
                        </span>
                      </div>
                    )}

                    {order.dispute_raised && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium text-red-800">⚠️ Dispute Raised: </span>
                        <span className="text-red-600">{order.dispute_reason}</span>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      {order.status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMarkDelivered(order.id)}
                          >
                            Mark Delivered
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                          >
                            Cancel Order
                          </Button>
                        </>
                      )}
                      {order.status === "delivered" && (
                        <Button size="sm" variant="outline" disabled>
                          ✓ Completed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No orders found for {selectedDate}</p>
                <p className="text-sm text-gray-500 mt-2">Try selecting a different date or adjusting filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delivery Time Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Delivered</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delivery-time">Delivery Date & Time</Label>
              <Input
                id="delivery-time"
                type="datetime-local"
                value={deliveryDateTime}
                onChange={(e) => setDeliveryDateTime(e.target.value)}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Defaults to current time. Modify if needed.
              </p>
            </div>
            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmDelivery} className="bg-green-600 hover:bg-green-700">
                Confirm Delivery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;
