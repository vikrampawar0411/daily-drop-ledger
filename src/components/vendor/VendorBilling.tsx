import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, addDays } from "date-fns";
import { DollarSign, TrendingUp, Receipt, Download, FileText, Users, ChevronDown, ChevronUp, Building } from "lucide-react";
import * as XLSX from 'xlsx-js-style';

interface CustomerBillSummary {
  customerId: string;
  customerName: string;
  phone: string;
  area: string;
  society: string;
  wing: string;
  flat: string;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  orders: any[];
}

const VendorBilling = () => {
  const { user } = useAuth();
  const { orders, loading } = useOrders();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [vendorId, setVendorId] = useState("");

  useEffect(() => {
    const loadVendorData = async () => {
      if (!user) return;
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (vendor) {
        setVendorId(vendor.id);
      }
    };
    loadVendorData();
  }, [user]);

  const getDateRangeForMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    return { start: monthStart, end: endOfMonth(monthStart) };
  };

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRangeForMonth();
    return orders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, selectedMonth]);

  const customerBillSummaries = useMemo(() => {
    const customerMap = new Map<string, CustomerBillSummary>();

    filteredOrders.forEach(order => {
      const customerId = order.customer_id || 'unknown';
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName: order.customer?.name || 'Unknown Customer',
          phone: order.customer?.phone || '',
          area: order.customer?.areas?.name || 'Unknown',
          society: order.customer?.societies?.name || 'Unknown',
          wing: order.customer?.wing_number || 'N/A',
          flat: order.customer?.flat_plot_house_number || 'N/A',
          totalOrders: 0,
          deliveredOrders: 0,
          pendingOrders: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          orders: [],
        });
      }

      const summary = customerMap.get(customerId)!;
      summary.totalOrders++;
      summary.totalAmount += Number(order.total_amount);
      summary.orders.push(order);

      if (order.status === 'delivered') {
        summary.deliveredOrders++;
        summary.paidAmount += Number(order.total_amount);
      } else {
        summary.pendingOrders++;
        summary.pendingAmount += Number(order.total_amount);
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredOrders]);

  const billingSummary = useMemo(() => {
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
    
    return {
      totalCustomers: customerBillSummaries.length,
      totalOrders: filteredOrders.length,
      deliveredRevenue: deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      pendingRevenue: pendingOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      totalRevenue: filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
    };
  }, [filteredOrders, customerBillSummaries]);

  const toggleCustomerExpansion = (customerId: string) => {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const exportBillToExcel = (customer: CustomerBillSummary) => {
    const exportData = customer.orders.map(order => ({
      'Date': format(new Date(order.order_date), 'yyyy-MM-dd'),
      'Product': order.product?.name || '',
      'Quantity': order.quantity,
      'Unit': order.unit,
      'Price/Unit': order.price_per_unit,
      'Total': order.total_amount,
      'Status': order.status,
    }));

    // Add summary row
    exportData.push({
      'Date': '',
      'Product': 'TOTAL',
      'Quantity': '' as any,
      'Unit': '',
      'Price/Unit': '' as any,
      'Total': customer.totalAmount,
      'Status': '',
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bill");

    const fileName = `bill-${customer.customerName.replace(/\s+/g, '-')}-${selectedMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Bill Generated",
      description: `Bill exported to ${fileName}`,
    });
  };

  const exportAllBills = () => {
    const exportData = customerBillSummaries.flatMap(customer => 
      customer.orders.map(order => ({
        'Customer': customer.customerName,
        'Phone': customer.phone,
        'Area': customer.area,
        'Society': customer.society,
        'Wing': customer.wing,
        'Flat': customer.flat,
        'Date': format(new Date(order.order_date), 'yyyy-MM-dd'),
        'Product': order.product?.name || '',
        'Quantity': order.quantity,
        'Unit': order.unit,
        'Price/Unit': order.price_per_unit,
        'Total': order.total_amount,
        'Status': order.status,
      }))
    );

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Bills");

    const fileName = `all-customer-bills-${selectedMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Export Successful",
      description: `All bills exported to ${fileName}`,
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
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Month:</label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button onClick={exportAllBills} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All Bills
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingSummary.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{billingSummary.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collected (Delivered)</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{billingSummary.deliveredRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Collection</CardTitle>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{billingSummary.pendingRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Customer Bills - {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerBillSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No billing data found for the selected month
                    </TableCell>
                  </TableRow>
                ) : (
                  customerBillSummaries.map((customer) => (
                    <React.Fragment key={customer.customerId}>
                      {/* Customer Summary Row */}
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleCustomerExpansion(customer.customerId)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {expandedCustomers.has(customer.customerId) ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                            <div>
                              <div>{customer.customerName}</div>
                              <div className="text-xs text-muted-foreground">{customer.phone}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.society}</div>
                            <div className="text-xs text-muted-foreground">
                              {customer.wing !== 'N/A' && `Wing ${customer.wing}, `}{customer.flat}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{customer.totalOrders}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{customer.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{customer.paidAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          ₹{customer.pendingAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportBillToExcel(customer);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Generate Bill
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Order Details */}
                      {expandedCustomers.has(customer.customerId) && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-0">
                            <div className="p-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Price/Unit</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {customer.orders.map((order: any) => (
                                    <TableRow key={order.id}>
                                      <TableCell>{format(new Date(order.order_date), 'dd MMM')}</TableCell>
                                      <TableCell>{order.product?.name || 'Unknown'}</TableCell>
                                      <TableCell className="text-center">{order.quantity} {order.unit}</TableCell>
                                      <TableCell className="text-right">₹{order.price_per_unit}</TableCell>
                                      <TableCell className="text-right">₹{order.total_amount}</TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                          {order.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          {customerBillSummaries.length > 0 && (
            <div className="mt-4 pt-4 border-t flex flex-col md:flex-row justify-between gap-4">
              <div className="flex gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Customers: </span>
                  <span className="font-semibold">{billingSummary.totalCustomers}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Orders: </span>
                  <span className="font-semibold">{billingSummary.totalOrders}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-lg">₹{billingSummary.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-green-600">Collected: ₹{billingSummary.deliveredRevenue.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-amber-600">Pending: ₹{billingSummary.pendingRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorBilling;
