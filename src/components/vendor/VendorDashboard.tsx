import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Milk, Newspaper, Users, DollarSign, TrendingUp, MapPin, Receipt } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Skeleton } from "@/components/ui/skeleton";

const VendorDashboard = () => {
  const { orders, loading } = useOrders();

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => 
      order.order_date.startsWith(today)
    );

    const totalRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    
    // Count unique customers (areas)
    const uniqueCustomers = new Set(todayOrders.map(order => order.customer?.address).filter(Boolean));
    
    // Group by product category
    const milkOrders = todayOrders.filter(order => 
      order.product?.category?.toLowerCase() === 'milk'
    ).length;
    const newspaperOrders = todayOrders.filter(order => 
      order.product?.category?.toLowerCase() === 'newspaper'
    ).length;

    return {
      totalOrders: todayOrders.length,
      milkOrders,
      newspaperOrders,
      totalRevenue: totalRevenue.toFixed(2),
      areasServed: uniqueCustomers.size,
      societiesServed: uniqueCustomers.size // Using customer count as society count
    };
  }, [orders]);

  const areaStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => 
      order.order_date.startsWith(today)
    );

    const areaMap = new Map();
    
    todayOrders.forEach(order => {
      const area = order.customer?.address || 'Unknown Area';
      if (!areaMap.has(area)) {
        areaMap.set(area, {
          area,
          societies: 1,
          orders: 0,
          revenue: 0
        });
      }
      const stats = areaMap.get(area);
      stats.orders += 1;
      stats.revenue += Number(order.total_amount);
    });

    return Array.from(areaMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer-wise Performance</h3>
        <Card>
          <CardContent className="pt-6">
            {areaStats.length > 0 ? (
              <div className="space-y-4">
                {areaStats.map((area) => (
                  <div key={area.area} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{area.area}</h4>
                      <p className="text-sm text-gray-600">{area.societies} customer{area.societies > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{area.orders}</div>
                      <div className="text-xs text-gray-500">orders</div>
                    </div>
                    <div className="text-center ml-4">
                      <div className="text-lg font-bold text-green-600">₹{area.revenue.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No orders today</p>
            )}
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
                <span>{todayStats.totalOrders > 0 ? Math.round((todayStats.milkOrders / todayStats.totalOrders) * 100) : 0}% of total orders</span>
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
                <span>{todayStats.totalOrders > 0 ? Math.round((todayStats.newspaperOrders / todayStats.totalOrders) * 100) : 0}% of total orders</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
