
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShoppingCart, Calendar, Package, Plus, Bell } from "lucide-react";
import { VendorOrderTabs } from "./components/VendorOrderTabs";

const CustomerDashboard = () => {
  const customerStats = {
    activeVendors: 3,
    totalOrders: 45,
    upcomingDeliveries: 8,
    monthlySpend: 1250
  };

  const recentOrders = [
    {
      id: 1,
      vendorName: "Fresh Dairy Co.",
      product: "Fresh Milk",
      quantity: 2,
      unit: "litres",
      deliveryDate: "2024-12-01",
      status: "delivered"
    },
    {
      id: 2,
      vendorName: "News Express",
      product: "Times of India",
      quantity: 1,
      unit: "copy",
      deliveryDate: "2024-12-01",
      status: "delivered"
    },
    {
      id: 3,
      vendorName: "Fresh Dairy Co.",
      product: "Fresh Milk",
      quantity: 2,
      unit: "litres",
      deliveryDate: "2024-12-02",
      status: "scheduled"
    }
  ];

  const connectedVendors = [
    {
      id: 1,
      name: "Fresh Dairy Co.",
      products: ["Fresh Milk", "Organic Milk"],
      area: "Bandra West",
      rating: 4.8,
      activeOrders: 5
    },
    {
      id: 2,
      name: "News Express",
      products: ["Times of India", "Maharashtra Times"],
      area: "Bandra West",
      rating: 4.6,
      activeOrders: 2
    },
    {
      id: 3,
      name: "Daily Essentials",
      products: ["Fresh Milk", "Economic Times"],
      area: "Bandra West",
      rating: 4.5,
      activeOrders: 1
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-green-100">Manage your daily essentials with ease</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Active Vendors</CardTitle>
            <Users className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.activeVendors}</div>
            <p className="text-xs opacity-90">vendors connected</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.totalOrders}</div>
            <p className="text-xs opacity-90">orders placed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.upcomingDeliveries}</div>
            <p className="text-xs opacity-90">deliveries scheduled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Monthly Spend</CardTitle>
            <Package className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{customerStats.monthlySpend}</div>
            <p className="text-xs opacity-90">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <Plus className="h-6 w-6" />
              <span>Place New Order</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span>Find Vendors</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Bell className="h-6 w-6" />
              <span>Manage Subscriptions</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Order Details */}
      <VendorOrderTabs />

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{order.product}</div>
                  <div className="text-sm text-gray-600">{order.vendorName}</div>
                  <div className="text-xs text-gray-500">{order.deliveryDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{order.quantity} {order.unit}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    order.status === 'delivered' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Connected Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Vendors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectedVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{vendor.name}</div>
                  <div className="text-sm text-gray-600">{vendor.area}</div>
                  <div className="text-xs text-gray-500">
                    {vendor.products.join(", ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">★ {vendor.rating}</div>
                  <div className="text-xs text-gray-500">
                    {vendor.activeOrders} active orders
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;
