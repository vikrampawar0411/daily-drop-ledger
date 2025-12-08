import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Milk, Newspaper, Users, DollarSign, TrendingUp, MapPin, Receipt, ShieldCheck, ChevronDown, ChevronUp, Building, Download, CheckCircle, Clock, ShoppingCart } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfWeek, startOfMonth, startOfYear, endOfDay, addDays, endOfWeek, endOfMonth, startOfDay, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx-js-style';
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { InviteCustomerDialog } from "./InviteCustomerDialog";
import { UserPlus } from "lucide-react";

interface VendorDashboardProps {
  onNavigate?: (tab: string, params?: any) => void;
}

const VendorDashboard = ({ onNavigate }: VendorDashboardProps) => {
  const { user } = useAuth();
  const { orders, loading, updateOrderStatus } = useOrders();
  const { toast } = useToast();
  const [timeView, setTimeView] = useState<"today" | "tomorrow" | "week" | "month">("today");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [vendorName, setVendorName] = useState("");
  const [connectionCount, setConnectionCount] = useState(0);
  const [loadingWelcome, setLoadingWelcome] = useState(true);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedSocieties, setExpandedSocieties] = useState<Set<string>>(new Set());
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [currentDeliveryIndex, setCurrentDeliveryIndex] = useState(0);

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
          setVendorId(vendor.id);
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

  // Reset carousel index when time view or orders change
  useEffect(() => {
    setCurrentDeliveryIndex(0);
  }, [timeView, selectedMonth, orders]);

  const getDateRangeForView = () => {
    const now = new Date();
    switch (timeView) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "tomorrow":
        const tomorrow = addDays(now, 1);
        return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "month":
        const [year, month] = selectedMonth.split('-');
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        return { start: monthStart, end: endOfMonth(monthStart) };
    }
  };

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRangeForView();
    return orders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, timeView, selectedMonth]);

  const groupedOrdersByHierarchy = useMemo(() => {
    const hierarchy = new Map();
    
    filteredOrders.forEach(order => {
      const areaId = order.customer?.area_id || 'unknown';
      const societyId = order.customer?.society_id || 'unknown';
      const wingNumber = order.customer?.wing_number || 'N/A';
      const flatNumber = order.customer?.flat_plot_house_number || 'N/A';
      
      if (!hierarchy.has(areaId)) {
        hierarchy.set(areaId, {
          areaId,
          areaName: order.customer?.areas?.name || 'Unknown Area',
          societies: new Map(),
          totalOrders: 0,
          totalRevenue: 0,
        });
      }
      
      const areaData = hierarchy.get(areaId);
      areaData.totalOrders++;
      areaData.totalRevenue += Number(order.total_amount);
      
      if (!areaData.societies.has(societyId)) {
        areaData.societies.set(societyId, {
          societyId,
          societyName: order.customer?.societies?.name || 'Unknown Society',
          wings: new Map(),
          totalOrders: 0,
          totalRevenue: 0,
        });
      }
      
      const societyData = areaData.societies.get(societyId);
      societyData.totalOrders++;
      societyData.totalRevenue += Number(order.total_amount);
      
      if (!societyData.wings.has(wingNumber)) {
        societyData.wings.set(wingNumber, {
          wingNumber,
          flats: new Map(),
          totalOrders: 0,
          totalRevenue: 0,
        });
      }
      
      const wingData = societyData.wings.get(wingNumber);
      wingData.totalOrders++;
      wingData.totalRevenue += Number(order.total_amount);
      
      if (!wingData.flats.has(flatNumber)) {
        wingData.flats.set(flatNumber, {
          flatNumber,
          orders: [],
          totalOrders: 0,
          totalRevenue: 0,
        });
      }
      
      const flatData = wingData.flats.get(flatNumber);
      flatData.orders.push(order);
      flatData.totalOrders++;
      flatData.totalRevenue += Number(order.total_amount);
    });
    
    return Array.from(hierarchy.values());
  }, [filteredOrders]);

  const statisticsSummary = useMemo(() => {
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
    
    return {
      totalOrders: filteredOrders.length,
      deliveredCount: deliveredOrders.length,
      pendingCount: pendingOrders.length,
      deliveredRevenue: deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      pendingRevenue: pendingOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      totalRevenue: filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      areasServed: new Set(filteredOrders.map(o => o.customer?.area_id).filter(Boolean)).size,
      societiesServed: new Set(filteredOrders.map(o => o.customer?.society_id).filter(Boolean)).size,
    };
  }, [filteredOrders]);

  const toggleAreaExpansion = (areaId: string) => {
    setExpandedAreas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(areaId)) {
        newSet.delete(areaId);
      } else {
        newSet.add(areaId);
      }
      return newSet;
    });
  };

  const toggleSocietyExpansion = (societyId: string) => {
    setExpandedSocieties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(societyId)) {
        newSet.delete(societyId);
      } else {
        newSet.add(societyId);
      }
      return newSet;
    });
  };

  const handleStatusToggle = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'delivered' : 'pending';
    const deliveredAt = newStatus === 'delivered' ? new Date().toISOString() : null;
    
    try {
      await updateOrderStatus(orderId, newStatus, deliveredAt);
      toast({
        title: "Status Updated",
        description: `Order marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const exportData = filteredOrders.map(order => ({
      'Date': format(new Date(order.order_date), 'yyyy-MM-dd'),
      'Area': order.customer?.areas?.name || 'Unknown',
      'Society': order.customer?.societies?.name || 'Unknown',
      'Wing': order.customer?.wing_number || 'N/A',
      'Flat': order.customer?.flat_plot_house_number || 'N/A',
      'Customer': order.customer?.name || '',
      'Phone': order.customer?.phone || '',
      'Product': order.product?.name || '',
      'Quantity': order.quantity,
      'Unit': order.unit,
      'Total': order.total_amount,
      'Status': order.status,
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    
    const fileName = `vendor-orders-${timeView}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Export Successful",
      description: `Orders exported to ${fileName}`,
    });
  };

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
      {/* OOBE Card for New Vendors */}
      <OnboardingCard
        userType="vendor"
        hasData={connectionCount > 0}
        onDismiss={() => {}}
        onAddAction={() => onNavigate?.('customers')}
      />

      {/* Next Deliveries Info Card */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Today's next deliveries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayOrders = filteredOrders.filter(o => {
              const orderDate = new Date(o.order_date);
              orderDate.setHours(0, 0, 0, 0);
              return orderDate.getTime() === today.getTime() && o.status === 'pending';
            });

            if (todayOrders.length === 0) {
              return <p className="text-green-100">No pending deliveries for today!</p>;
            }

            const currentOrder = todayOrders[currentDeliveryIndex];
            
            return (
              <>
                {/* Single Delivery Display */}
                <div className="bg-white/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-lg">{currentOrder.customer?.name || 'Customer'}</p>
                      <p className="text-sm text-green-100">
                        {currentOrder.product?.name} • {currentOrder.customer?.societies?.name || 'Unknown'}
                        {currentOrder.customer?.wing_number && ` • Wing ${currentOrder.customer.wing_number}`}
                        {currentOrder.customer?.flat_plot_house_number && ` • ${currentOrder.customer.flat_plot_house_number}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl">{currentOrder.quantity} {currentOrder.unit}</p>
                      <p className="text-lg">₹{currentOrder.total_amount}</p>
                    </div>
                  </div>

                  {/* Mark as Delivered Button */}
                  <Button
                    className="w-full bg-white text-green-600 hover:bg-green-50 font-semibold"
                    onClick={async () => {
                      await handleStatusToggle(currentOrder.id, currentOrder.status);
                      // Auto-advance to next delivery after marking
                      if (currentDeliveryIndex < todayOrders.length - 1) {
                        setCurrentDeliveryIndex(prev => prev + 1);
                      } else {
                        setCurrentDeliveryIndex(0); // Reset to first
                      }
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </Button>
                </div>

                {/* Slider for Navigation */}
                {todayOrders.length > 1 && (
                  <div className="space-y-2 px-2">
                    <Slider
                      value={[currentDeliveryIndex]}
                      onValueChange={(value) => setCurrentDeliveryIndex(value[0])}
                      min={0}
                      max={todayOrders.length - 1}
                      step={1}
                      className="cursor-pointer"
                    />
                    <p className="text-center text-sm text-green-100">
                      Delivery {currentDeliveryIndex + 1} of {todayOrders.length}
                    </p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Connected Customers Section */}
          <div className="flex items-center justify-between pt-2 border-t border-white/20">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-green-100 hover:text-white hover:bg-white/20 p-2 rounded-lg"
              onClick={() => onNavigate?.('customers')}
            >
              <Users className="h-4 w-4" />
              <span>{connectionCount} Connected Customers</span>
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setInviteDialogOpen(true)}
              className="bg-white/20 hover:bg-white/30"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Customer Dialog */}
      <InviteCustomerDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        vendorId={vendorId}
        vendorName={vendorName}
      />

      {/* Time View Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={timeView === "today" ? "default" : "outline"}
                onClick={() => setTimeView("today")}
              >
                Today
              </Button>
              <Button
                variant={timeView === "tomorrow" ? "default" : "outline"}
                onClick={() => setTimeView("tomorrow")}
              >
                Tomorrow
              </Button>
              <Button
                variant={timeView === "week" ? "default" : "outline"}
                onClick={() => setTimeView("week")}
              >
                This Week
              </Button>
              <Button
                variant={timeView === "month" ? "default" : "outline"}
                onClick={() => setTimeView("month")}
              >
                Monthly
              </Button>
            </div>
            {timeView === "month" && (
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full md:w-auto"
              />
            )}
            <Button onClick={exportToExcel} variant="outline" className="w-full md:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statisticsSummary.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivered Orders</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statisticsSummary.deliveredCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statisticsSummary.pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Coverage</CardTitle>
            <MapPin className="h-5 w-5 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statisticsSummary.areasServed} Areas / {statisticsSummary.societiesServed} Societies
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Orders by Area & Society</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area / Society / Wing / Flat</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No orders found for the selected time period
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedOrdersByHierarchy.map((areaData: any) => (
                    <React.Fragment key={areaData.areaId}>
                      {/* Area Header Row */}
                      <TableRow className="bg-blue-50 dark:bg-blue-950 font-semibold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900" onClick={() => toggleAreaExpansion(areaData.areaId)}>
                        <TableCell className="flex items-center space-x-2">
                          {expandedAreas.has(areaData.areaId) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <Building className="h-4 w-4" />
                          <span>{areaData.areaName}</span>
                        </TableCell>
                        <TableCell colSpan={3}>{areaData.totalOrders} orders</TableCell>
                        <TableCell>₹{areaData.totalRevenue.toFixed(2)}</TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>

                      {/* Society Rows (if area is expanded) */}
                      {expandedAreas.has(areaData.areaId) &&
                        Array.from(areaData.societies.entries()).map(([societyId, societyData]: [string, any]) => (
                          <React.Fragment key={`${areaData.areaId}-${societyId}`}>
                            <TableRow className="bg-green-50 dark:bg-green-950 font-semibold cursor-pointer hover:bg-green-100 dark:hover:bg-green-900" onClick={() => toggleSocietyExpansion(`${areaData.areaId}-${societyId}`)}>
                              <TableCell className="pl-8 flex items-center space-x-2">
                                {expandedSocieties.has(`${areaData.areaId}-${societyId}`) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <Building className="h-4 w-4" />
                                <span>{societyData.societyName}</span>
                              </TableCell>
                              <TableCell colSpan={3}>{societyData.totalOrders} orders</TableCell>
                              <TableCell>₹{societyData.totalRevenue.toFixed(2)}</TableCell>
                              <TableCell colSpan={3}></TableCell>
                            </TableRow>

                            {/* Wing Rows (if society is expanded) */}
                            {expandedSocieties.has(`${areaData.areaId}-${societyId}`) &&
                              Array.from(societyData.wings.entries()).map(([wingNumber, wingData]: [string, any]) => (
                                <React.Fragment key={`${areaData.areaId}-${societyId}-${wingNumber}`}>
                                  <TableRow className="bg-yellow-50 dark:bg-yellow-950">
                                    <TableCell className="pl-16 font-medium">
                                      Wing: {wingNumber}
                                    </TableCell>
                                    <TableCell colSpan={3}>{wingData.totalOrders} orders</TableCell>
                                    <TableCell>₹{wingData.totalRevenue.toFixed(2)}</TableCell>
                                    <TableCell colSpan={3}></TableCell>
                                  </TableRow>

                                  {/* Flat Rows (individual orders) */}
                                  {Array.from(wingData.flats.entries()).map(([flatNumber, flatData]: [string, any]) =>
                                    flatData.orders.map((order: any) => (
                                      <TableRow key={order.id} className="hover:bg-muted/50">
                                        <TableCell className="pl-24 text-sm">
                                          Flat: {flatNumber}
                                        </TableCell>
                                        <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                                        <TableCell>{order.product?.name || 'N/A'}</TableCell>
                                        <TableCell>{order.quantity} {order.unit}</TableCell>
                                        <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                            {order.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{format(new Date(order.order_date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>
                                          <Button
                                            size="sm"
                                            variant={order.status === 'delivered' ? 'outline' : 'default'}
                                            onClick={() => handleStatusToggle(order.id, order.status)}
                                          >
                                            {order.status === 'delivered' ? 'Pending' : 'Delivered'}
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </React.Fragment>
                              ))}
                          </React.Fragment>
                        ))}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          {filteredOrders.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">Delivered</TableCell>
                    <TableCell>{statisticsSummary.deliveredCount} orders</TableCell>
                    <TableCell className="font-semibold">₹{statisticsSummary.deliveredRevenue.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Pending</TableCell>
                    <TableCell>{statisticsSummary.pendingCount} orders</TableCell>
                    <TableCell className="font-semibold">₹{statisticsSummary.pendingRevenue.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="font-bold">{statisticsSummary.totalOrders} orders</TableCell>
                    <TableCell className="font-bold">₹{(statisticsSummary.deliveredRevenue + statisticsSummary.pendingRevenue).toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default VendorDashboard;
