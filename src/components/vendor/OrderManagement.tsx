import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Filter, MapPin } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";
import { format, startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";

interface OrderManagementProps {
  initialTimeRange?: "today" | "week" | "month" | "year";
  initialStatus?: string;
}

const OrderManagement = ({ initialTimeRange, initialStatus }: OrderManagementProps = {}) => {
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year">(initialTimeRange || "today");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedSociety, setSelectedSociety] = useState("all");
  const [selectedWing, setSelectedWing] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || "pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderDate, setSelectedOrderDate] = useState<string | null>(null);
  const [deliveryDateTime, setDeliveryDateTime] = useState("");
  const { orders, loading, updateOrderStatus } = useOrders();
  const { areas } = useAreas();
  const { societies } = useSocieties();

  const getDateRange = () => {
    const now = new Date();
    
    switch (dateRange) {
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

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange();
    
    return orders.filter(order => {
      const orderDate = new Date(order.order_date);
      const matchesDate = orderDate >= start && orderDate <= end;
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      const matchesArea = selectedArea === "all" || order.customer?.area_id === selectedArea;
      const matchesSociety = selectedSociety === "all" || order.customer?.society_id === selectedSociety;
      const matchesWing = selectedWing === "all" || order.customer?.wing_number === selectedWing;
      const matchesSearch = searchTerm === "" || 
        order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesDate && matchesStatus && matchesArea && matchesSociety && matchesWing && matchesSearch;
    }).sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
  }, [orders, dateRange, selectedStatus, selectedArea, selectedSociety, selectedWing, searchTerm]);

  const wings = useMemo(() => {
    return [...new Set(orders.map(o => o.customer?.wing_number).filter(Boolean))];
  }, [orders]);

  const handleMarkDelivered = (orderId: string, orderDate: string) => {
    setSelectedOrderId(orderId);
    setSelectedOrderDate(orderDate);
    setDeliveryDateTime(new Date().toISOString().slice(0, 16));
    setDeliveryDialogOpen(true);
  };

  const handleSetPreviousDelivery = () => {
    if (selectedOrderDate) {
      const orderDate = new Date(selectedOrderDate);
      orderDate.setHours(7, 0, 0, 0);
      setDeliveryDateTime(orderDate.toISOString().slice(0, 16));
    }
  };

  const isDeliveryDateDifferent = () => {
    if (!selectedOrderDate || !deliveryDateTime) return false;
    const orderDate = new Date(selectedOrderDate).toDateString();
    const deliveryDate = new Date(deliveryDateTime).toDateString();
    return orderDate !== deliveryDate;
  };

  const confirmDelivery = () => {
    if (selectedOrderId && deliveryDateTime) {
      updateOrderStatus(selectedOrderId, "delivered", new Date(deliveryDateTime).toISOString());
      setDeliveryDialogOpen(false);
      setSelectedOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { className: "bg-orange-100 text-orange-800", icon: <Clock className="h-3 w-3" /> },
      delivered: { className: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { className: "border-2 border-gray-400 text-gray-700", icon: <AlertCircle className="h-3 w-3" /> },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    return (
      <Badge className={config.className}>
        {config.icon}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const stats = useMemo(() => {
    const pending = filteredOrders.filter(o => o.status === "pending").length;
    const delivered = filteredOrders.filter(o => o.status === "delivered").length;
    const revenue = filteredOrders.filter(o => o.status === "delivered")
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    return { total: filteredOrders.length, pending, delivered, revenue };
  }, [filteredOrders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading orders...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
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
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
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
              <div className="text-2xl font-bold text-blue-600">₹{stats.revenue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Revenue</div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <Label>Time Period</Label>
              <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                <SelectTrigger>
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

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Area */}
            <div>
              <Label>Area</Label>
              <Select value={selectedArea} onValueChange={(v) => {
                setSelectedArea(v);
                setSelectedSociety("all");
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Society */}
            <div>
              <Label>Society</Label>
              <Select value={selectedSociety} onValueChange={setSelectedSociety}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Societies</SelectItem>
                  {societies
                    .filter(s => selectedArea === "all" || s.area_id === selectedArea)
                    .map(society => (
                      <SelectItem key={society.id} value={society.id}>{society.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wing */}
            <div>
              <Label>Wing</Label>
              <Select value={selectedWing} onValueChange={setSelectedWing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wings</SelectItem>
                  {wings.map(wing => (
                    <SelectItem key={wing} value={wing as string}>{wing}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="md:col-span-3">
              <Label>Search Customer/Product</Label>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <>
                    <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                        >
                          {expandedRow === order.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>{format(new Date(order.order_date), "MMM dd")}</TableCell>
                      <TableCell className="font-medium">{order.customer?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {order.customer?.wing_number && `Wing ${order.customer.wing_number}`}
                        </div>
                      </TableCell>
                      <TableCell>{order.product.name}</TableCell>
                      <TableCell className="text-right">{order.quantity} {order.unit}</TableCell>
                      <TableCell className="text-right font-medium">₹{order.total_amount}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.status === "pending" && new Date(order.order_date) <= new Date() && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMarkDelivered(order.id, order.order_date)}
                          >
                            Deliver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRow === order.id && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-gray-50">
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Phone:</span> {order.customer?.phone || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Address:</span> {order.customer?.address || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Price per unit:</span> ₹{order.product.price}
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {order.product.category}
                              </div>
                            </div>
                            {order.delivered_at && (
                              <div className="bg-green-50 rounded px-3 py-2 text-sm">
                                <span className="font-medium text-green-800">Delivered:</span>{" "}
                                <span className="text-green-600">{format(new Date(order.delivered_at), "PPp")}</span>
                              </div>
                            )}
                            {order.dispute_raised && (
                              <div className="border-2 border-orange-500 rounded px-3 py-2 text-sm text-orange-700">
                                <span className="font-medium text-orange-800">⚠️ Dispute:</span>{" "}
                                <span className="text-orange-700">{order.dispute_reason}</span>
                              </div>
                            )}
                            {order.status === "pending" && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateOrderStatus(order.id, "cancelled")}
                                >
                                  Cancel Order
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No orders found for the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delivery Time Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isDeliveryDateDifferent() 
                ? "Confirm Order Delivery - Different Date Detected" 
                : "Confirm Order is Delivered"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delivery-time">Delivery Date & Time</Label>
              <Input
                id="delivery-time"
                type="datetime-local"
                value={deliveryDateTime}
                onChange={(e) => setDeliveryDateTime(e.target.value)}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Defaults to current time. Modify if needed.
              </p>
            </div>
            {isDeliveryDateDifferent() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 mb-2">
                  ⚠️ Delivery date differs from order date
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSetPreviousDelivery}
                  className="w-full"
                >
                  Previous Delivered Entry
                </Button>
              </div>
            )}
            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmDelivery} className="bg-green-600 hover:bg-green-700">
                Confirm Delivery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;
