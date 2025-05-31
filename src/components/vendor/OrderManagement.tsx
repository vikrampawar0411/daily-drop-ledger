
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, CheckCircle, AlertCircle, Milk, Newspaper, Filter, Search, MapPin, Building, Home } from "lucide-react";

const OrderManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedSociety, setSelectedSociety] = useState("all");
  const [selectedWing, setSelectedWing] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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
      area: "Bandra West",
      society: "Sea View Apartments",
      wing: "A",
      flatNo: "701",
      products: [
        { name: "Newspaper", quantity: 2, unit: "copies" }
      ],
      status: "pending",
      deliveryTime: "07:00 AM"
    },
    {
      id: 4,
      customerName: "Sunita Joshi",
      area: "Bandra West",
      society: "Sea View Apartments",
      wing: "B",
      flatNo: "201",
      products: [
        { name: "Milk", quantity: 1, unit: "litre" },
        { name: "Newspaper", quantity: 1, unit: "copy" }
      ],
      status: "pending",
      deliveryTime: "06:15 AM"
    },
    {
      id: 5,
      customerName: "Ravi Mehta",
      area: "Andheri East",
      society: "Green Valley Society",
      wing: "A",
      flatNo: "102",
      products: [
        { name: "Milk", quantity: 3, unit: "litres" }
      ],
      status: "delivered",
      deliveryTime: "06:45 AM"
    }
  ];

  const upcomingOrders = [
    {
      id: 6,
      customerName: "Sunita Joshi",
      date: "2024-12-02",
      area: "Bandra West",
      society: "Sea View Apartments",
      wing: "B",
      flatNo: "201",
      products: [
        { name: "Milk", quantity: 1, unit: "litre" },
        { name: "Newspaper", quantity: 1, unit: "copy" }
      ],
      isRecurring: true
    },
    {
      id: 7,
      customerName: "Ravi Mehta",
      date: "2024-12-03",
      area: "Andheri East",
      society: "Green Valley Society",
      wing: "A",
      flatNo: "102",
      products: [
        { name: "Milk", quantity: 3, unit: "litres" }
      ],
      isRecurring: false
    }
  ];

  const getUniqueValues = (field: string) => {
    const values = todayOrders.map(order => order[field as keyof typeof order] as string);
    return [...new Set(values)].sort();
  };

  const filterOrders = (orders: any[]) => {
    return orders.filter(order => {
      const matchesArea = selectedArea === "all" || order.area === selectedArea;
      const matchesSociety = selectedSociety === "all" || order.society === selectedSociety;
      const matchesWing = selectedWing === "all" || order.wing === selectedWing;
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      const matchesSearch = searchTerm === "" || 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.flatNo.includes(searchTerm) ||
        order.society.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesArea && matchesSociety && matchesWing && matchesStatus && matchesSearch;
    });
  };

  const getClusteredOrders = () => {
    const filtered = filterOrders(todayOrders);
    const clustered: { [key: string]: any[] } = {};
    
    filtered.forEach(order => {
      const key = `${order.area} > ${order.society} > Wing ${order.wing}`;
      if (!clustered[key]) {
        clustered[key] = [];
      }
      clustered[key].push(order);
    });
    
    return clustered;
  };

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

  const clusteredOrders = getClusteredOrders();

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Customer, flat, society..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Area</label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {getUniqueValues("area").map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Society</label>
              <Select value={selectedSociety} onValueChange={setSelectedSociety}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Societies</SelectItem>
                  {getUniqueValues("society").map(society => (
                    <SelectItem key={society} value={society}>{society}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Wing</label>
              <Select value={selectedWing} onValueChange={setSelectedWing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wings</SelectItem>
                  {getUniqueValues("wing").map(wing => (
                    <SelectItem key={wing} value={wing}>Wing {wing}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="clustered" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clustered">Clustered View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="clustered" className="space-y-4">
          {Object.keys(clusteredOrders).length > 0 ? (
            Object.entries(clusteredOrders).map(([location, orders]) => (
              <Card key={location} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span>{location}</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-sm">
                      {orders.length} orders
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {orders.map((order) => (
                      <div key={order.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Home className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">Flat {order.flatNo}</span>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{order.customerName}</div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {order.products.map((product, index) => (
                            <div key={index} className="flex items-center space-x-1 bg-white rounded px-2 py-1 text-xs">
                              {product.name === "Milk" ? (
                                <Milk className="h-3 w-3 text-blue-600" />
                              ) : (
                                <Newspaper className="h-3 w-3 text-orange-600" />
                              )}
                              <span>{product.quantity} {product.unit}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">{order.deliveryTime}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No orders found matching your filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filterOrders(todayOrders).map((order) => (
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
                  <div className="text-sm text-gray-600">
                    <div>{order.society}, Wing {order.wing}, Flat {order.flatNo}</div>
                    <div>{order.area}</div>
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
      </Tabs>
    </div>
  );
};

export default OrderManagement;
