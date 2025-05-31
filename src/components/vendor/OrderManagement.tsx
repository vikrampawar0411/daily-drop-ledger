
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, AlertCircle, Milk, Newspaper } from "lucide-react";

const OrderManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const todayOrders = [
    {
      id: 1,
      customerName: "Rajesh Sharma",
      area: "Bandra West",
      society: "Sea View Apartments",
      wing: "A",
      flatNo: "402",
      products: [
        { name: "Milk", quantity: 2, unit: "litres" },
        { name: "Newspaper", quantity: 1, unit: "copy" }
      ],
      status: "pending",
      deliveryTime: "06:00 AM"
    },
    {
      id: 2,
      customerName: "Priya Patel",
      area: "Andheri East",
      society: "Green Valley Society",
      wing: "B",
      flatNo: "305",
      products: [
        { name: "Milk", quantity: 1, unit: "litre" }
      ],
      status: "delivered",
      deliveryTime: "06:30 AM"
    },
    {
      id: 3,
      customerName: "Amit Kumar",
      area: "Powai",
      society: "Lake View Heights",
      wing: "C",
      flatNo: "701",
      products: [
        { name: "Newspaper", quantity: 2, unit: "copies" }
      ],
      status: "pending",
      deliveryTime: "07:00 AM"
    }
  ];

  const upcomingOrders = [
    {
      id: 4,
      customerName: "Sunita Joshi",
      date: "2024-12-02",
      products: [
        { name: "Milk", quantity: 1, unit: "litre" },
        { name: "Newspaper", quantity: 1, unit: "copy" }
      ],
      isRecurring: true
    },
    {
      id: 5,
      customerName: "Ravi Mehta",
      date: "2024-12-03",
      products: [
        { name: "Milk", quantity: 3, unit: "litres" }
      ],
      isRecurring: false
    }
  ];

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

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Orders</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Orders</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {todayOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.customerName}</CardTitle>
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
                      <span className="font-medium">Address:</span>
                      <div className="text-gray-600">
                        {order.society}, Wing {order.wing}, Flat {order.flatNo}
                      </div>
                      <div className="text-gray-600">{order.area}</div>
                    </div>
                    <div>
                      <span className="font-medium">Delivery Time:</span>
                      <div className="text-gray-600">{order.deliveryTime}</div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">Products:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                          {product.name === "Milk" ? (
                            <Milk className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Newspaper className="h-4 w-4 text-orange-600" />
                          )}
                          <span className="text-sm">
                            {product.quantity} {product.unit} {product.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    {order.status === "pending" && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Mark Delivered
                        </Button>
                        <Button size="sm" variant="outline">
                          Contact Customer
                        </Button>
                      </>
                    )}
                    {order.status === "delivered" && (
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {upcomingOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.customerName}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {order.date}
                      </Badge>
                      {order.isRecurring && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium text-sm">Products:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                          {product.name === "Milk" ? (
                            <Milk className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Newspaper className="h-4 w-4 text-orange-600" />
                          )}
                          <span className="text-sm">
                            {product.quantity} {product.unit} {product.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline">
                      Edit Order
                    </Button>
                    <Button size="sm" variant="outline">
                      Cancel Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">Order history will be displayed here</p>
              <Button className="mt-4" variant="outline">
                Load Order History
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderManagement;
