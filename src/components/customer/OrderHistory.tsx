
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Milk, Newspaper, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

const OrderHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const orders = [
    {
      id: 1,
      orderNumber: "ORD-001",
      date: "2024-11-30",
      vendor: "Fresh Dairy Co.",
      products: [
        { name: "Fresh Milk", quantity: 2, unit: "litres", price: 50 }
      ],
      total: 50,
      status: "delivered",
      deliveryTime: "6:30 AM"
    },
    {
      id: 2,
      orderNumber: "ORD-002",
      date: "2024-11-30",
      vendor: "News Express",
      products: [
        { name: "Times of India", quantity: 1, unit: "copy", price: 5 }
      ],
      total: 5,
      status: "delivered",
      deliveryTime: "6:00 AM"
    },
    {
      id: 3,
      orderNumber: "ORD-003",
      date: "2024-11-29",
      vendor: "Fresh Dairy Co.",
      products: [
        { name: "Fresh Milk", quantity: 2, unit: "litres", price: 50 },
        { name: "Organic Milk", quantity: 1, unit: "litre", price: 35 }
      ],
      total: 85,
      status: "delivered",
      deliveryTime: "6:30 AM"
    },
    {
      id: 4,
      orderNumber: "ORD-004",
      date: "2024-11-28",
      vendor: "Daily Essentials",
      products: [
        { name: "Fresh Milk", quantity: 1, unit: "litre", price: 23 }
      ],
      total: 23,
      status: "cancelled",
      deliveryTime: "7:00 AM"
    },
    {
      id: 5,
      orderNumber: "ORD-005",
      date: "2024-12-01",
      vendor: "Fresh Dairy Co.",
      products: [
        { name: "Fresh Milk", quantity: 2, unit: "litres", price: 50 }
      ],
      total: 50,
      status: "scheduled",
      deliveryTime: "6:30 AM"
    }
  ];

  const vendors = ["Fresh Dairy Co.", "News Express", "Daily Essentials"];
  const statuses = ["delivered", "scheduled", "cancelled"];
  const months = ["November 2024", "December 2024"];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = selectedVendor === "all" || order.vendor === selectedVendor;
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    // Add month filtering logic here if needed
    
    return matchesSearch && matchesVendor && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTotalSpent = () => {
    return filteredOrders
      .filter(order => order.status === "delivered")
      .reduce((total, order) => total + order.total, 0);
  };

  const getOrderStats = () => {
    const delivered = filteredOrders.filter(order => order.status === "delivered").length;
    const scheduled = filteredOrders.filter(order => order.status === "scheduled").length;
    const cancelled = filteredOrders.filter(order => order.status === "cancelled").length;
    
    return { delivered, scheduled, cancelled, total: filteredOrders.length };
  };

  const stats = getOrderStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">₹{getTotalSpent()}</div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger>
                <SelectValue placeholder="All vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedVendor("all");
              setSelectedStatus("all");
              setSelectedMonth("all");
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <span>•</span>
                    <span>{order.vendor}</span>
                    <span>•</span>
                    <span>{order.deliveryTime}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-sm">Products:</span>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {order.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-3">
                        {product.name.toLowerCase().includes('milk') ? (
                          <Milk className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Newspaper className="h-4 w-4 text-orange-600" />
                        )}
                        <span className="text-sm">
                          {product.quantity} {product.unit} {product.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium">₹{product.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                  {order.status === "delivered" && (
                    <Button size="sm" variant="outline">
                      Reorder
                    </Button>
                  )}
                  {order.status === "scheduled" && (
                    <Button size="sm" variant="outline">
                      Modify Order
                    </Button>
                  )}
                </div>
                <div className="text-lg font-bold">
                  Total: ₹{order.total}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No orders found matching your criteria</p>
            <Button className="mt-4" variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedVendor("all");
              setSelectedStatus("all");
              setSelectedMonth("all");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderHistory;
