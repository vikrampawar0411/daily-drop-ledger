import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShoppingCart, Calendar, Package, Plus, Bell, TrendingUp, CheckCircle2, Clock, Download, FileDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorOrderTabs } from "./components/VendorOrderTabs";
import { useOrders } from "@/hooks/useOrders";
import { useVendors } from "@/hooks/useVendors";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

interface CustomerDashboardProps {
  onNavigate?: (tab: string) => void;
}

const CustomerDashboard = ({ onNavigate }: CustomerDashboardProps) => {
  const { user } = useAuth();
  const { orders, loading: ordersLoading } = useOrders();
  const { vendors, loading: vendorsLoading } = useVendors();
  const [customerName, setCustomerName] = useState("");
  const [connectionCount, setConnectionCount] = useState(0);
  const [loadingWelcome, setLoadingWelcome] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setOrderDetailsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const exportToCSV = () => {
    const csvData = monthlyStats.orders.map(order => ({
      'Date': new Date(order.order_date).toLocaleDateString(),
      'Vendor': order.vendor.name,
      'Product': order.product.name,
      'Quantity': `${order.quantity} ${order.unit}`,
      'Total': order.total_amount,
      'Status': order.status,
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${selectedMonth}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    const excelData = monthlyStats.orders.map(order => ({
      'Date': new Date(order.order_date).toLocaleDateString(),
      'Vendor': order.vendor.name,
      'Product': order.product.name,
      'Quantity': `${order.quantity} ${order.unit}`,
      'Total': order.total_amount,
      'Status': order.status,
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders-${selectedMonth}.xlsx`);
  };

  useEffect(() => {
    const loadCustomerData = async () => {
      if (!user) return;
      
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (customer) {
          setCustomerName(customer.name);
          const { count } = await supabase
            .from('vendor_customer_connections')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.id);
          setConnectionCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading customer data:', error);
      } finally {
        setLoadingWelcome(false);
      }
    };

    loadCustomerData();
  }, [user]);

  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }, []);

  const monthlyStats = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.order_date);
      const matchesDate = orderDate >= firstDay && orderDate <= lastDay;
      const matchesVendor = selectedVendors.length === 0 || selectedVendors.includes(o.vendor.id);
      return matchesDate && matchesVendor;
    });
    
    const totalOrders = monthOrders.length;
    const deliveredOrders = monthOrders.filter(o => o.status === 'delivered').length;
    const scheduledOrders = monthOrders.filter(o => o.status === 'pending').length;
    
    const deliveredSpend = monthOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    const forecastedBill = monthOrders
      .filter(o => o.status === 'pending')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    return {
      totalOrders,
      deliveredOrders,
      scheduledOrders,
      deliveredSpend: Math.round(deliveredSpend),
      forecastedBill: Math.round(forecastedBill),
      orders: monthOrders.sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime())
    };
  }, [orders, selectedMonth, selectedVendors]);

  const customerStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const uniqueVendors = new Set(orders.map(o => o.vendor.id));
    
    // Filter pending orders only till today (not future)
    const upcomingOrders = orders.filter(o => {
      const orderDate = new Date(o.order_date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate <= today && o.status === 'pending';
    });
    
    const monthlyOrders = orders.filter(o => 
      new Date(o.order_date) >= firstDayOfMonth
    );
    const monthlySpend = monthlyOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    return {
      activeVendors: uniqueVendors.size,
      totalOrders: orders.length,
      upcomingDeliveries: upcomingOrders.length,
      monthlySpend: Math.round(monthlySpend)
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        vendorName: order.vendor.name,
        product: order.product.name,
        quantity: order.quantity,
        unit: order.unit,
        deliveryDate: order.order_date,
        status: order.status
      }));
  }, [orders]);

  const connectedVendors = useMemo(() => {
    return vendors.slice(0, 5).map(vendor => {
      const vendorOrders = orders.filter(o => o.vendor.id === vendor.id);
      const activeOrders = vendorOrders.filter(o => o.status === 'pending').length;
      
      return {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        area: "N/A",
        rating: 0,
        activeOrders
      };
    });
  }, [vendors, orders]);

  if (ordersLoading || vendorsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6">
        {loadingWelcome ? (
          <Skeleton className="h-16 w-full bg-white/20" />
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2">Welcome back, {customerName}!</h2>
            <div className="flex items-center space-x-4 text-green-100">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{connectionCount} Connected Vendors</span>
              </div>
              <span className="px-2 py-1 bg-white/20 rounded text-sm">Customer</span>
            </div>
          </>
        )}
      </div>


      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate?.('calendar')}
            >
              <Plus className="h-6 w-6" />
              <span>Place New Order</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate?.('vendors')}
            >
              <Users className="h-6 w-6" />
              <span>Find Vendors</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate?.('subscriptions')}
            >
              <Bell className="h-6 w-6" />
              <span>Manage Subscriptions</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Statistics */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Statistics</CardTitle>
              <div className="flex flex-col items-end space-y-1">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const [year, month] = selectedMonth.split('-').map(Number);
                    const firstDay = new Date(year, month - 1, 1);
                    const lastDay = new Date(year, month, 0);
                    return `${firstDay.toLocaleDateString()} - ${lastDay.toLocaleDateString()}`;
                  })()}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filter by Vendor (Multi-select)</Label>
              <div className="flex flex-wrap gap-2">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={vendor.id}
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVendors([...selectedVendors, vendor.id]);
                        } else {
                          setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={vendor.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {vendor.name}
                    </label>
                  </div>
                ))}
              </div>
              {selectedVendors.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedVendors([])}
                >
                  Clear Vendor Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card 
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('subscriptions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{monthlyStats.totalOrders}</div>
                <p className="text-xs text-blue-700">orders this month</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('subscriptions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900">Orders Delivered</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{monthlyStats.deliveredOrders}</div>
                <p className="text-xs text-green-700">completed deliveries</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('subscriptions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-900">Orders Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">{monthlyStats.scheduledOrders}</div>
                <p className="text-xs text-amber-700">pending deliveries</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('subscriptions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-900">Monthly Spend</CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">₹{monthlyStats.deliveredSpend}</div>
                <p className="text-xs text-purple-700">on delivered orders</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('subscriptions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rose-900">Forecasted Bill</CardTitle>
                <TrendingUp className="h-4 w-4 text-rose-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-900">₹{monthlyStats.forecastedBill}</div>
                <p className="text-xs text-rose-700">scheduled orders</p>
              </CardContent>
            </Card>
          </div>


          {/* Orders Table for Selected Period */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Orders for Selected Period</h3>
              {monthlyStats.orders.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={exportToCSV}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToExcel}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyStats.orders.length > 0 ? (
                    <>
                      {monthlyStats.orders.map((order) => {
                        const orderDate = new Date(order.order_date);
                        const isSunday = orderDate.getDay() === 0;
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const dayName = days[orderDate.getDay()];
                        
                        return (
                          <TableRow 
                            key={order.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleOrderClick(order)}
                          >
                            <TableCell className={`font-semibold ${isSunday ? 'text-red-700' : ''}`}>
                              {dayName}
                            </TableCell>
                            <TableCell>{orderDate.toLocaleDateString()}</TableCell>
                            <TableCell>
                              {order.vendor.name}
                            </TableCell>
                            <TableCell>
                              {order.product.name}
                            </TableCell>
                            <TableCell>{order.quantity} {order.unit}</TableCell>
                            <TableCell className="font-semibold">₹{order.total_amount}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Summary Rows */}
                      <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                        <TableCell colSpan={4} className="text-right">TOTAL (All Orders):</TableCell>
                        <TableCell>{monthlyStats.orders.reduce((sum, o) => sum + Number(o.quantity), 0).toFixed(2)}</TableCell>
                        <TableCell>₹{Math.round(monthlyStats.orders.reduce((sum, o) => sum + Number(o.total_amount), 0))}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow className="bg-green-50 font-semibold">
                        <TableCell colSpan={4} className="text-right">Delivered Orders:</TableCell>
                        <TableCell>{monthlyStats.orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.quantity), 0).toFixed(2)}</TableCell>
                        <TableCell>₹{monthlyStats.deliveredSpend}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow className="bg-blue-50 font-semibold">
                        <TableCell colSpan={4} className="text-right">Pending Orders:</TableCell>
                        <TableCell>{monthlyStats.orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + Number(o.quantity), 0).toFixed(2)}</TableCell>
                        <TableCell>₹{monthlyStats.forecastedBill}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {monthlyStats.orders.some(o => o.status === 'cancelled') && (
                        <TableRow className="bg-red-50 font-semibold">
                          <TableCell colSpan={4} className="text-right">Cancelled Orders:</TableCell>
                          <TableCell>{monthlyStats.orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + Number(o.quantity), 0).toFixed(2)}</TableCell>
                          <TableCell>₹{Math.round(monthlyStats.orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + Number(o.total_amount), 0))}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No orders found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Order ID</Label>
                  <div className="font-medium">#{selectedOrder.id.slice(0, 8)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <div className="font-medium">{new Date(selectedOrder.order_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Vendor</Label>
                  <div className="font-medium">{selectedOrder.vendor.name}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Product</Label>
                  <div className="font-medium">{selectedOrder.product.name}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Quantity</Label>
                  <div className="font-medium">{selectedOrder.quantity} {selectedOrder.unit}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Amount</Label>
                  <div className="font-medium">₹{selectedOrder.total_amount}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1 capitalize">{selectedOrder.status}</span>
                  </Badge>
                </div>
              </div>
              {selectedOrder.delivered_at && (
                <div className="bg-green-50 rounded-lg p-3">
                  <Label className="text-sm text-green-800">Delivered at:</Label>
                  <div className="text-green-600">{format(new Date(selectedOrder.delivered_at), "PPp")}</div>
                </div>
              )}
              {selectedOrder.dispute_raised && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <Label className="text-sm text-red-800">Dispute Raised:</Label>
                  <div className="text-red-600">{selectedOrder.dispute_reason}</div>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOrderDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CustomerDashboard;
