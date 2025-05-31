
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Milk, Newspaper, Users, DollarSign, TrendingUp, Package } from "lucide-react";

const Dashboard = () => {
  const todayStats = {
    milkDelivered: 45,
    newspapersDelivered: 120,
    totalCustomers: 85,
    todayRevenue: 450.75,
    milkRevenue: 315.00,
    newspaperRevenue: 135.75
  };

  const monthlyStats = {
    totalRevenue: 12500.50,
    milkSold: 1350,
    newspapersSold: 3600,
    avgDailyRevenue: 416.68
  };

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Milk Delivered</CardTitle>
              <Milk className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.milkDelivered}</div>
              <p className="text-xs opacity-90">litres today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Newspapers</CardTitle>
              <Newspaper className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.newspapersDelivered}</div>
              <p className="text-xs opacity-90">copies delivered</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Customers</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalCustomers}</div>
              <p className="text-xs opacity-90">active today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{todayStats.todayRevenue}</div>
              <p className="text-xs opacity-90">total earnings</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-600">
                <Milk className="h-5 w-5" />
                <span>Milk Sales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">₹{todayStats.milkRevenue}</div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <TrendingUp className="h-4 w-4" />
                <span>70% of total revenue</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <Newspaper className="h-5 w-5" />
                <span>Newspaper Sales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{todayStats.newspaperRevenue}</div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <Package className="h-4 w-4" />
                <span>30% of total revenue</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month's Overview</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">₹{monthlyStats.totalRevenue}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{monthlyStats.milkSold}</div>
                <div className="text-sm text-gray-600">Litres Sold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{monthlyStats.newspapersSold}</div>
                <div className="text-sm text-gray-600">Papers Sold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{monthlyStats.avgDailyRevenue}</div>
                <div className="text-sm text-gray-600">Avg Daily</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
