import { useMemo, useState, useEffect } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ShoppingCart, Calendar, Package, Plus, Bell, TrendingUp, CheckCircle2, Clock, Download, FileDown, ChevronDown, ChevronUp, AlertTriangle, MoreVertical, Edit, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface CustomerDashboardProps {
  onNavigate?: (tab: string) => void;
}

const CustomerDashboard = ({ onNavigate }: CustomerDashboardProps) => {
  const { user } = useAuth();
  const { orders, loading: ordersLoading, updateOrderStatus, raiseDispute, deleteOrder, updateOrder, refetch } = useOrders();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { toast } = useToast();
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
  const [tableExpanded, setTableExpanded] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    const currentMonth = format(new Date(), 'MMMM yyyy');
    return new Set([currentMonth]);
  });
  const [sortColumn, setSortColumn] = useState<string>('order_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    quantity: 0,
    product_id: '',
    order_date: '',
  });

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
      'Quantity': order.quantity,
      'Unit': order.unit,
      'Amount': order.total_amount,
      'Status': order.status,
    }));
    
    // Calculate totals
    const totalQuantity = monthlyStats.orders.reduce((sum, o) => sum + Number(o.quantity), 0);
    const totalAmount = monthlyStats.orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    // Add summary rows
    csvData.push({
      'Date': '',
      'Vendor': '',
      'Product': '',
      'Quantity': totalQuantity,
      'Unit': '',
      'Amount': totalAmount,
      'Status': 'TOTAL'
    });
    
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
      'Quantity': order.quantity,
      'Unit': order.unit,
      'Amount': order.total_amount,
      'Status': order.status,
    }));
    
    // Calculate totals
    const totalQuantity = monthlyStats.orders.reduce((sum, o) => sum + Number(o.quantity), 0);
    const totalAmount = monthlyStats.orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    // Add summary row
    excelData.push({
      'Date': '',
      'Vendor': '',
      'Product': '',
      'Quantity': totalQuantity,
      'Unit': '',
      'Amount': totalAmount,
      'Status': 'TOTAL'
    });
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders-${selectedMonth}.xlsx`);
  };

  const handleStatusToggle = async (order: any) => {
    try {
      const newStatus = order.status === 'pending' ? 'delivered' : 'pending';
      await updateOrderStatus(order.id, newStatus, newStatus === 'delivered' ? new Date().toISOString() : undefined);
      await refetch();
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to update",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update all selected orders to delivered
      const updatePromises = selectedOrderIds.map(orderId => 
        updateOrderStatus(orderId, 'delivered', new Date().toISOString())
      );
      
      await Promise.all(updatePromises);
      
      // Show single consolidated success message
      toast({
        title: "Success",
        description: `${selectedOrderIds.length} order(s) marked as delivered`,
      });
      
      setSelectedOrderIds([]);
      setBulkUpdateDialogOpen(false);
      
      // Refresh orders list
      await refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update orders",
        variant: "destructive",
      });
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    const pendingOrders = monthlyStats.orders.filter(o => o.status === 'pending');
    if (selectedOrderIds.length === pendingOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrders.map(o => o.id));
    }
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setEditFormData({
      quantity: order.quantity,
      product_id: order.product.id,
      order_date: order.order_date,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;
    
    try {
      await deleteOrder(deleteOrderId);
      setDeleteDialogOpen(false);
      setDeleteOrderId(null);
    } catch (error) {
      console.error("Failed to delete order:", error);
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    
    try {
      const pricePerUnit = editingOrder.price_per_unit;
      const totalAmount = editFormData.quantity * pricePerUnit;
      
      await updateOrder(editingOrder.id, {
        quantity: editFormData.quantity,
        product_id: editFormData.product_id,
        order_date: editFormData.order_date,
        price_per_unit: pricePerUnit,
        total_amount: totalAmount,
      });
      
      setEditDialogOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error("Failed to update order:", error);
    }
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

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const monthlyStats = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.order_date);
      const matchesDate = orderDate >= firstDay && orderDate <= lastDay;
      const matchesVendor = selectedVendors.length === 0 || selectedVendors.includes(o.vendor.id);
      // Exclude cancelled orders
      return matchesDate && matchesVendor && o.status !== 'cancelled';
    });
    
    // Sort orders based on selected column
    const sortedOrders = [...monthOrders].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortColumn) {
        case 'order_date':
          aVal = new Date(a.order_date).getTime();
          bVal = new Date(b.order_date).getTime();
          break;
        case 'vendor':
          aVal = a.vendor.name.toLowerCase();
          bVal = b.vendor.name.toLowerCase();
          break;
        case 'product':
          aVal = a.product.name.toLowerCase();
          bVal = b.product.name.toLowerCase();
          break;
        case 'quantity':
          aVal = Number(a.quantity);
          bVal = Number(b.quantity);
          break;
        case 'total_amount':
          aVal = Number(a.total_amount);
          bVal = Number(b.total_amount);
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        default:
          aVal = new Date(a.order_date).getTime();
          bVal = new Date(b.order_date).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
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
      orders: sortedOrders
    };
  }, [orders, selectedMonth, selectedVendors, sortColumn, sortDirection]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    monthlyStats.orders.forEach(order => {
      const orderDate = new Date(order.order_date);
      const monthKey = format(orderDate, 'MMMM yyyy');
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(order);
    });
    
    return groups;
  }, [monthlyStats.orders]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };

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
          <Collapsible open={tableExpanded} onOpenChange={setTableExpanded}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    {tableExpanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                    {tableExpanded ? 'Hide' : 'Show'} Detailed Orders
                  </Button>
                </CollapsibleTrigger>
                <div className="flex gap-2">
                  {selectedOrderIds.length > 0 && (
                    <Button onClick={() => setBulkUpdateDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark {selectedOrderIds.length} as Delivered
                    </Button>
                  )}
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
              </div>

              <CollapsibleContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedOrderIds.length === monthlyStats.orders.filter(o => o.status === 'pending').length && monthlyStats.orders.filter(o => o.status === 'pending').length > 0}
                            onCheckedChange={toggleAllOrders}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('order_date')}>
                          Day {sortColumn === 'order_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('order_date')}>
                          Date {sortColumn === 'order_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('vendor')}>
                          Vendor {sortColumn === 'vendor' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('product')}>
                          Product {sortColumn === 'product' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('quantity')}>
                          Quantity {sortColumn === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('total_amount')}>
                          Total {sortColumn === 'total_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                          Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(groupedOrders).length > 0 ? (
                        Object.entries(groupedOrders).map(([month, monthOrders]) => (
                          <React.Fragment key={month}>
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={9}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMonth(month)}
                                  className="w-full justify-start font-semibold"
                                >
                                  {expandedMonths.has(month) ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                                  {month}
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedMonths.has(month) && (monthOrders as any[]).map((order: any) => {
                              const orderDate = new Date(order.order_date);
                              const isSunday = orderDate.getDay() === 0;
                              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                              const dayName = days[orderDate.getDay()];
                              
                              return (
                                <TableRow 
                                  key={order.id} 
                                  className="cursor-pointer hover:bg-muted/50"
                                >
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    {order.status === 'pending' && (
                                      <Checkbox 
                                        checked={selectedOrderIds.includes(order.id)}
                                        onCheckedChange={() => toggleOrderSelection(order.id)}
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell 
                                    className={`font-semibold ${isSunday ? 'text-red-700' : ''}`}
                                    onClick={() => handleOrderClick(order)}
                                  >
                                    {dayName}
                                  </TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)}>{orderDate.toLocaleDateString()}</TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)}>
                                    {order.vendor.name}
                                  </TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)}>
                                    {order.product.name}
                                  </TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)}>
                                    {order.quantity} {order.unit}
                                  </TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)} className="font-semibold">
                                    ₹{order.total_amount}
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                      {order.updated_by_user_id && order.customer?.user_id && order.updated_by_user_id !== order.customer.user_id ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setDisputeOrderId(order.id);
                                            setDisputeReason("");
                                            setDisputeDialogOpen(true);
                                          }}
                                          disabled={order.dispute_raised}
                                        >
                                          {order.dispute_raised ? (
                                            <>
                                              <AlertTriangle className="h-4 w-4 mr-1 text-yellow-600" />
                                              Disputed
                                            </>
                                          ) : (
                                            "Dispute"
                                          )}
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                                          onClick={() => handleStatusToggle(order)}
                                        >
                                          {order.status === 'delivered' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                                          {order.status === 'pending' ? 'Pending' : 'Delivered'}
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    {order.status === 'pending' && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Order
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              setDeleteOrderId(order.id);
                                              setDeleteDialogOpen(true);
                                            }}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Order
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No orders found for the selected period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Summary at bottom */}
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Order Summary</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Amount (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-green-700 font-medium">Delivered</TableCell>
                          <TableCell className="text-right">{monthlyStats.deliveredOrders}</TableCell>
                          <TableCell className="text-right">{monthlyStats.deliveredSpend}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-blue-700 font-medium">Pending</TableCell>
                          <TableCell className="text-right">{monthlyStats.scheduledOrders}</TableCell>
                          <TableCell className="text-right">{monthlyStats.forecastedBill}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View complete information about this order
            </DialogDescription>
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

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Status Update</DialogTitle>
            <DialogDescription>
              Update the delivery status for multiple orders at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to mark {selectedOrderIds.length} order(s) as delivered?</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setBulkUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkStatusUpdate} className="bg-green-600 hover:bg-green-700">
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise Dispute</DialogTitle>
            <DialogDescription>
              Describe the issue with this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dispute-reason">Reason for Dispute</Label>
              <Textarea
                id="dispute-reason"
                placeholder="Please describe the issue..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDisputeDialogOpen(false);
              setDisputeReason("");
              setDisputeOrderId(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (disputeOrderId && disputeReason.trim()) {
                  await raiseDispute(disputeOrderId, disputeReason);
                  setDisputeDialogOpen(false);
                  setDisputeReason("");
                  setDisputeOrderId(null);
                } else {
                  toast({
                    title: "Error",
                    description: "Please provide a reason for the dispute",
                    variant: "destructive",
                  });
                }
              }}
            >
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Modify order details below
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div>
                <Label>Order Date</Label>
                <Input
                  type="date"
                  value={editFormData.order_date}
                  onChange={(e) => setEditFormData({...editFormData, order_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData({...editFormData, quantity: Number(e.target.value)})}
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div>
                <Label>Product</Label>
                <div className="text-sm text-muted-foreground">
                  {editingOrder.product.name} (₹{editingOrder.price_per_unit}/{editingOrder.unit})
                </div>
              </div>
              <div>
                <Label>Total Amount</Label>
                <div className="text-lg font-semibold">
                  ₹{(editFormData.quantity * editingOrder.price_per_unit).toFixed(2)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrder}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CustomerDashboard;
