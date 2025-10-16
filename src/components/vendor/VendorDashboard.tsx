import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Milk, Newspaper, Users, DollarSign, TrendingUp, MapPin, Receipt, ShieldCheck } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VendorDashboardProps {
  onNavigate?: (tab: string) => void;
}

const VendorDashboard = ({ onNavigate }: VendorDashboardProps) => {
  const { user } = useAuth();
  const { orders, loading } = useOrders();
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "year">("today");
  const [vendorName, setVendorName] = useState("");
  const [connectionCount, setConnectionCount] = useState(0);
  const [loadingWelcome, setLoadingWelcome] = useState(true);

  useEffect(() => {
    const loadVendorData = async () => {
      if (!user) return;
      
      try {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (vendor) {
          setVendorName(vendor.name);
          const { count } = await supabase
            .from('vendor_customer_connections')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id);
          setConnectionCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      } finally {
        setLoadingWelcome(false);
      }
    };

    loadVendorData();
  }, [user]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "week":
        return { start: startOfWeek(now), end: endOfDay(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfDay(now) };
      case "year":
        return { start: startOfYear(now), end: endOfDay(now) };
      default: // today
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: endOfDay(now) };
    }
  };

  const todayStats = useMemo(() => {
    const { start, end } = getDateRange();
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= start && orderDate <= end;
    });

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    
    // Count unique customers (areas)
    const uniqueCustomers = new Set(filteredOrders.map(order => order.customer?.address).filter(Boolean));
    
    // Group by product category
    const milkOrders = filteredOrders.filter(order => 
      order.product?.category?.toLowerCase() === 'milk'
    ).length;
    const newspaperOrders = filteredOrders.filter(order => 
      order.product?.category?.toLowerCase() === 'newspaper'
    ).length;

    return {
      totalOrders: filteredOrders.length,
      milkOrders,
      newspaperOrders,
      totalRevenue: totalRevenue.toFixed(2),
      areasServed: uniqueCustomers.size,
      societiesServed: uniqueCustomers.size // Using customer count as society count
    };
  }, [orders, timeRange]);

  const areaStats = useMemo(() => {
    const { start, end } = getDateRange();
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= start && orderDate <= end;
    });

    const areaMap = new Map();
    
    filteredOrders.forEach(order => {
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
  }, [orders, timeRange]);

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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-6">
        {loadingWelcome ? (
          <Skeleton className="h-16 w-full bg-white/20" />
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-2xl font-bold">Welcome back, {vendorName}!</h2>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex items-center space-x-4 text-blue-100">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{connectionCount} Connected Customers</span>
              </div>
              <span className="px-2 py-1 bg-white/20 rounded text-sm">Vendor</span>
            </div>
          </>
        )}
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Today's Summary */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {timeRange === "today" ? "Today's Overview" : 
           timeRange === "week" ? "This Week's Overview" :
           timeRange === "month" ? "This Month's Overview" : "This Year's Overview"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate?.('orders')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
              <Receipt className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalOrders}</div>
              <p className="text-xs opacity-90">orders today</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate?.('areas')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Areas Served</CardTitle>
              <MapPin className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.areasServed}</div>
              <p className="text-xs opacity-90">areas covered</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate?.('customers')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Societies</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.societiesServed}</div>
              <p className="text-xs opacity-90">societies served</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate?.('orders')}
          >
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
              <p className="text-center text-gray-500 py-8">No orders yet. Your customers will place orders soon!</p>
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
