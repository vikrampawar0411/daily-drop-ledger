import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Milk, Newspaper, Users, DollarSign, TrendingUp, MapPin, Receipt } from "lucide-react";

const VendorDashboard = () => {
  const todayStats = {
    totalOrders: 125,
    milkOrders: 85,
    newspaperOrders: 40,
    totalRevenue: 2450.75,
    areasServed: 8,
    societiesServed: 15
  };

  const areaStats = [
    { area: "Bandra West", societies: 3, orders: 25, revenue: 650 },
    { area: "Andheri East", societies: 4, orders: 35, revenue: 890 },
    { area: "Powai", societies: 2, orders: 18, revenue: 470 },
    { area: "Goregaon West", societies: 3, orders: 22, revenue: 580 },
    { area: "Malad East", societies: 3, orders: 25, revenue: 610 }
  ];

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
              <Receipt className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalOrders}</div>
              <p className="text-xs opacity-90">orders today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Areas Served</CardTitle>
              <MapPin className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.areasServed}</div>
              <p className="text-xs opacity-90">areas covered</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Societies</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.societiesServed}</div>
              <p className="text-xs opacity-90">societies served</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{todayStats.totalRevenue}</div>
              <p className="text-xs opacity-90">today's earnings</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Area-wise Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Area-wise Performance</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {areaStats.map((area) => (
                <div key={area.area} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{area.area}</h4>
                    <p className="text-sm text-gray-600">{area.societies} societies</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{area.orders}</div>
                    <div className="text-xs text-gray-500">orders</div>
                  </div>
                  <div className="text-center ml-4">
                    <div className="text-lg font-bold text-green-600">₹{area.revenue}</div>
                    <div className="text-xs text-gray-500">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-600">
                <Milk className="h-5 w-5" />
                <span>Milk Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{todayStats.milkOrders}</div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <TrendingUp className="h-4 w-4" />
                <span>68% of total orders</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <Newspaper className="h-5 w-5" />
                <span>Newspaper Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{todayStats.newspaperOrders}</div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <TrendingUp className="h-4 w-4" />
                <span>32% of total orders</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
