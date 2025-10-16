
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Calendar as CalendarIcon, CheckCircle, Clock, XCircle, AlertTriangle, FileDown, Edit } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface OrderHistoryProps {
  initialVendorFilter?: string;
  initialStatusFilter?: string;
}

const OrderHistory = ({ initialVendorFilter, initialStatusFilter }: OrderHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(initialVendorFilter || "all");
  const [selectedStatus, setSelectedStatus] = useState(initialStatusFilter || "all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [modifyOrderDialogOpen, setModifyOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { orders, loading, raiseDispute } = useOrders();

  // Hash function to generate consistent colors for vendor-product combinations
  const getVendorProductColor = (vendorName: string, productName: string) => {
    const combined = `${vendorName}-${productName}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate distinct hue values
    const hue = Math.abs(hash % 360);
    // Use high saturation and medium lightness for vibrant, readable colors
    return `hsl(${hue}, 70%, 45%)`;
  };

  // Apply initial filters
  useEffect(() => {
    if (initialVendorFilter) setSelectedVendor(initialVendorFilter);
    if (initialStatusFilter) setSelectedStatus(initialStatusFilter);
  }, [initialVendorFilter, initialStatusFilter]);

  const handleRaiseDispute = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDisputeReason("");
    setDisputeDialogOpen(true);
  };

  const submitDispute = () => {
    if (selectedOrderId && disputeReason.trim()) {
      raiseDispute(selectedOrderId, disputeReason);
      setDisputeDialogOpen(false);
      setSelectedOrderId(null);
      setDisputeReason("");
    }
  };

  const vendors = useMemo(() => {
    return [...new Set(orders.map(o => o.vendor.name))];
  }, [orders]);

  const statuses = ["pending", "delivered", "cancelled"];

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVendor = selectedVendor === "all" || order.vendor.name === selectedVendor;
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      
      // Date range filter
      const orderDate = new Date(order.order_date);
      const matchesStartDate = !startDate || orderDate >= startDate;
      const matchesEndDate = !endDate || orderDate <= endDate;
      
      return matchesSearch && matchesVendor && matchesStatus && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
  }, [orders, searchTerm, selectedVendor, selectedStatus, startDate, endDate]);

  const getDayName = (dateString: string) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const isSunday = (dateString: string) => {
    return new Date(dateString).getDay() === 0;
  };

  const orderSummary = useMemo(() => {
    const totalQuantity = filteredOrders.reduce((sum, order) => sum + Number(order.quantity), 0);
    const totalSpending = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const deliveredSpending = filteredOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + Number(order.total_amount), 0);
    
    return {
      totalQuantity: totalQuantity.toFixed(2),
      totalSpending: Math.round(totalSpending),
      deliveredSpending: Math.round(deliveredSpending)
    };
  }, [filteredOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTotalSpent = () => {
    return filteredOrders
      .filter(order => order.status === "delivered")
      .reduce((total, order) => total + Number(order.total_amount), 0);
  };

  const getOrderStats = () => {
    const delivered = filteredOrders.filter(order => order.status === "delivered").length;
    const pending = filteredOrders.filter(order => order.status === "pending").length;
    const cancelled = filteredOrders.filter(order => order.status === "cancelled").length;
    
    return { delivered, pending, cancelled, total: filteredOrders.length };
  };

  const stats = getOrderStats();

  const exportToCSV = () => {
    const csvData = filteredOrders.map(order => ({
      'Order ID': order.id.slice(0, 8),
      'Date': new Date(order.order_date).toLocaleDateString(),
      'Vendor': order.vendor.name,
      'Product': order.product.name,
      'Quantity': `${order.quantity} ${order.unit}`,
      'Price/Unit': order.product.price,
      'Total': order.total_amount,
      'Status': order.status,
      'Delivered At': order.delivered_at ? format(new Date(order.delivered_at), "PPp") : '-',
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    const excelData = filteredOrders.map(order => ({
      'Order ID': order.id.slice(0, 8),
      'Date': new Date(order.order_date).toLocaleDateString(),
      'Vendor': order.vendor.name,
      'Product': order.product.name,
      'Quantity': `${order.quantity} ${order.unit}`,
      'Price/Unit': order.product.price,
      'Total': order.total_amount,
      'Status': order.status,
      'Delivered At': order.delivered_at ? format(new Date(order.delivered_at), "PPp") : '-',
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order History');
    XLSX.writeFile(wb, `order-history-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleModifyOrder = (order: any) => {
    setSelectedOrder(order);
    setModifyOrderDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-600">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export History
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
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">₹{getTotalSpent()}</div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger>
                <SelectValue placeholder="All vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedVendor("all");
              setSelectedStatus("all");
              setStartDate(undefined);
              setEndDate(undefined);
            }}>
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="font-bold">Vendor</TableHead>
                    <TableHead className="font-bold">Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleModifyOrder(order)}
                  >
                    <TableCell className={`font-semibold ${isSunday(order.order_date) ? 'text-red-700' : ''}`}>
                      {getDayName(order.order_date)}
                    </TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell 
                      className="font-bold"
                      style={{ color: getVendorProductColor(order.vendor.name, order.product.name) }}
                    >
                      {order.vendor.name}
                    </TableCell>
                    <TableCell 
                      className="font-bold"
                      style={{ color: getVendorProductColor(order.vendor.name, order.product.name) }}
                    >
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
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {order.status === "delivered" && !order.dispute_raised && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRaiseDispute(order.id);
                            }}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Summary Row */}
                {filteredOrders.length > 0 && (
                  <>
                    <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                      <TableCell colSpan={4} className="text-right">TOTAL (All Orders):</TableCell>
                      <TableCell>{orderSummary.totalQuantity}</TableCell>
                      <TableCell>₹{orderSummary.totalSpending}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                    <TableRow className="bg-green-50 font-semibold">
                      <TableCell colSpan={4} className="text-right">Delivered Orders:</TableCell>
                      <TableCell>{filteredOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.quantity), 0).toFixed(2)}</TableCell>
                      <TableCell>₹{orderSummary.deliveredSpending}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 font-semibold">
                      <TableCell colSpan={4} className="text-right">Pending Orders:</TableCell>
                      <TableCell>{filteredOrders.filter(o => o.status === 'pending').reduce((sum, o) => sum + Number(o.quantity), 0).toFixed(2)}</TableCell>
                      <TableCell>₹{Math.round(filteredOrders.filter(o => o.status === 'pending').reduce((sum, o) => sum + Number(o.total_amount), 0))}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                    {filteredOrders.some(o => o.status === 'cancelled') && (
                      <TableRow className="bg-red-50 font-semibold">
                        <TableCell colSpan={4} className="text-right">Cancelled Orders:</TableCell>
                        <TableCell>{filteredOrders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + Number(o.quantity), 0).toFixed(2)}</TableCell>
                        <TableCell>₹{Math.round(filteredOrders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + Number(o.total_amount), 0))}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No orders found matching your criteria</p>
            <Button className="mt-4" variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedVendor("all");
              setSelectedStatus("all");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dispute-reason">Reason for Dispute</Label>
              <Textarea
                id="dispute-reason"
                placeholder="Please describe the issue with your order..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="mt-2 min-h-[100px]"
              />
            </div>
            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitDispute} 
                className="bg-red-600 hover:bg-red-700"
                disabled={!disputeReason.trim()}
              >
                Submit Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modify Order Dialog */}
      <Dialog open={modifyOrderDialogOpen} onOpenChange={setModifyOrderDialogOpen}>
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
                <Button variant="outline" onClick={() => setModifyOrderDialogOpen(false)}>
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

export default OrderHistory;
