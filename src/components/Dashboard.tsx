import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, ShoppingCart, Package, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVendors: 0,
    totalOrders: 0,
    totalProducts: 0,
    todayOrders: 0,
    thisMonthOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total customers
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        // Get total vendors
        const { count: vendorsCount } = await supabase
          .from('vendors')
          .select('*', { count: 'exact', head: true });

        // Get total products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Get all orders
        const { data: allOrders } = await supabase
          .from('orders')
          .select('order_date, total_amount');

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        // Calculate statistics from orders
        const todayOrdersData = allOrders?.filter(order => order.order_date === today) || [];
        const thisMonthOrdersData = allOrders?.filter(order => order.order_date >= firstDayOfMonth) || [];
        
        const totalRevenue = allOrders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
        const todayRevenue = todayOrdersData.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

        setStats({
          totalCustomers: customersCount || 0,
          totalVendors: vendorsCount || 0,
          totalOrders: allOrders?.length || 0,
          totalProducts: productsCount || 0,
          todayOrders: todayOrdersData.length,
          thisMonthOrders: thisMonthOrdersData.length,
          totalRevenue,
          todayRevenue,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-blue-100">Complete overview of the system</p>
      </div>

      {/* System Overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate?.('customers')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Customers</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs opacity-90">registered customers</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate?.('vendors')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Vendors</CardTitle>
              <Store className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVendors}</div>
              <p className="text-xs opacity-90">active vendors</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate?.('products')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Products</CardTitle>
              <Package className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs opacity-90">in catalog</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate?.('orders')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs opacity-90">all time</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Activity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
                <span>Orders Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.todayOrders}</div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <TrendingUp className="h-4 w-4" />
                <span>orders placed today</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <DollarSign className="h-5 w-5" />
                <span>Today's Revenue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{stats.todayRevenue.toFixed(2)}</div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <TrendingUp className="h-4 w-4" />
                <span>total earnings today</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">₹{stats.totalRevenue.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-2">Total Revenue</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.thisMonthOrders}</div>
                <div className="text-sm text-gray-600 mt-2">Orders This Month</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  ₹{stats.thisMonthOrders > 0 ? (stats.totalRevenue / stats.thisMonthOrders).toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-gray-600 mt-2">Avg Order Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
