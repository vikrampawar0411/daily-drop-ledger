import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pause, Play, X, Calendar as CalendarIcon, Plus, Package, History, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useVendors } from "@/hooks/useVendors";
import { useProducts } from "@/hooks/useProducts";
import { useVendorProducts } from "@/hooks/useVendorProducts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

interface SubscriptionManagementProps {
  onNavigate?: (tab: string) => void;
}

const SubscriptionManagement = ({ onNavigate }: SubscriptionManagementProps = {}) => {
  const { user } = useAuth();
  const { subscriptions, loading, pauseSubscription, resumeSubscription, cancelSubscription, createSubscription } = useSubscriptions();
  const { vendors } = useVendors();
  const { products } = useProducts();
  const { vendorProducts } = useVendorProducts();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("active");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  
  // Order history filters
  const [historyVendorFilter, setHistoryVendorFilter] = useState("all");
  const [historyProductFilter, setHistoryProductFilter] = useState("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [pauseFromDate, setPauseFromDate] = useState<Date | undefined>(new Date());
  const [pauseUntilDate, setPauseUntilDate] = useState<Date | undefined>(undefined);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  // New subscription form state
  const [newSubscription, setNewSubscription] = useState({
    vendor_id: "",
    product_id: "",
    quantity: 1,
    frequency: "daily",
    start_date: new Date().toISOString().split('T')[0]
  });

  // Fetch customer ID and all orders
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user) return;
      
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (customerData) {
        setCustomerId(customerData.id);
        
        // Fetch all orders for this customer
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            vendor:vendors(id, name),
            product:products(id, name)
          `)
          .eq('customer_id', customerData.id)
          .order('order_date', { ascending: false });
        
        setAllOrders(ordersData || []);
      }
    };
    
    fetchCustomerData();
  }, [user]);
  
  // Get available products for selected vendor
  const availableProducts = useMemo(() => {
    if (selectedVendorFilter === "all") {
      return vendorProducts
        .filter(vp => vp.is_active)
        .map(vp => {
          const product = products.find(p => p.id === vp.product_id);
          return product ? {
            ...product,
            price: vp.price_override || product.price
          } : null;
        })
        .filter(p => p !== null);
    }
    
    return vendorProducts
      .filter(vp => vp.vendor_id === (selectedVendorFilter || newSubscription.vendor_id) && vp.is_active)
      .map(vp => {
        const product = products.find(p => p.id === vp.product_id);
        return product ? {
          ...product,
          price: vp.price_override || product.price
        } : null;
      })
      .filter(p => p !== null);
  }, [vendorProducts, products, selectedVendorFilter, newSubscription.vendor_id]);
  
  // Filter orders with history filters applied
  const subscriptionOrders = useMemo(() => {
    let filtered = allOrders;
    
    // Apply vendor filter
    if (historyVendorFilter !== "all") {
      filtered = filtered.filter(order => order.vendor_id === historyVendorFilter);
    }
    
    // Apply product filter
    if (historyProductFilter !== "all") {
      filtered = filtered.filter(order => order.product_id === historyProductFilter);
    }
    
    // Apply status filter
    if (historyStatusFilter !== "all") {
      filtered = filtered.filter(order => order.status === historyStatusFilter);
    }
    
    return filtered;
  }, [allOrders, historyVendorFilter, historyProductFilter, historyStatusFilter]);
  
  const exportToCSV = () => {
    const csvData = subscriptionOrders.map(order => ({
      Date: format(new Date(order.order_date), 'yyyy-MM-dd'),
      Vendor: order.vendor.name,
      Product: order.product.name,
      Quantity: order.quantity,
      Unit: order.unit,
      Price: Number(order.total_amount) / Number(order.quantity),
      Total: order.total_amount,
      Status: order.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscription Orders");
    XLSX.writeFile(wb, `subscription_orders_${format(new Date(), 'yyyy-MM-dd')}.csv`, { bookType: 'csv' });
  };

  const exportToExcel = () => {
    const excelData = subscriptionOrders.map(order => ({
      Date: format(new Date(order.order_date), 'yyyy-MM-dd'),
      Vendor: order.vendor.name,
      Product: order.product.name,
      Quantity: order.quantity,
      Unit: order.unit,
      'Price per Unit': Number(order.total_amount) / Number(order.quantity),
      'Total Amount': order.total_amount,
      Status: order.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscription Orders");
    XLSX.writeFile(wb, `subscription_orders_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handlePause = (subscriptionId: string) => {
    setSelectedSubscription(subscriptionId);
    setPauseDialogOpen(true);
  };

  const handlePauseConfirm = async () => {
    if (selectedSubscription && pauseFromDate && pauseUntilDate) {
      await pauseSubscription(
        selectedSubscription,
        pauseFromDate.toISOString().split('T')[0],
        pauseUntilDate.toISOString().split('T')[0]
      );
      setPauseDialogOpen(false);
      setSelectedSubscription(null);
      setPauseFromDate(new Date());
      setPauseUntilDate(undefined);
    }
  };
  
  const handleCreateSubscription = async () => {
    if (!customerId || !newSubscription.vendor_id || !newSubscription.product_id) return;
    
    const selectedProduct = availableProducts.find((p: any) => p.id === newSubscription.product_id);
    if (!selectedProduct) return;
    
    try {
      await createSubscription({
        customer_id: customerId,
        vendor_id: newSubscription.vendor_id,
        product_id: newSubscription.product_id,
        quantity: newSubscription.quantity,
        unit: selectedProduct.unit,
        price_per_unit: selectedProduct.price,
        frequency: newSubscription.frequency,
        start_date: newSubscription.start_date,
        end_date: null,
        status: 'active',
        paused_from: null,
        paused_until: null,
      });
      
      setCreateDialogOpen(false);
      setNewSubscription({
        vendor_id: "",
        product_id: "",
        quantity: 1,
        frequency: "daily",
        start_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "Every Day";
      case "weekly":
        return "Every Week";
      case "monthly":
        return "Every Month";
      default:
        return frequency;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-sm text-muted-foreground">Manage recurring orders and view history</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          New Subscription
        </Button>
      </div>
      
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            <Package className="h-4 w-4 mr-2" />
            Active Subscriptions
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Order History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">

        {/* Vendor Filter for Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Subscribe - Popular Products</CardTitle>
              <Select value={selectedVendorFilter} onValueChange={setSelectedVendorFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {availableProducts.slice(0, 12).map((product: any) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setNewSubscription({...newSubscription, product_id: product.id});
                    setCreateDialogOpen(true);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square mb-2 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-1 truncate">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">₹{product.price}/{product.unit}</p>
                    <Badge variant="outline" className="text-xs mt-1">{product.category}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No active subscriptions</p>
            <p className="text-sm text-muted-foreground mt-2">Create a subscription when placing an order</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{subscription.vendor?.name}</CardTitle>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Product:</span>
                  <div className="text-muted-foreground">{subscription.product?.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Quantity:</span>
                    <div className="text-muted-foreground">{subscription.quantity} {subscription.unit}</div>
                  </div>
                  <div>
                    <span className="font-medium">Price:</span>
                    <div className="text-muted-foreground">₹{subscription.price_per_unit}/{subscription.unit}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Frequency:</span>
                  <div className="text-muted-foreground">{getFrequencyLabel(subscription.frequency)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Started:</span>
                    <div className="text-muted-foreground">
                      {new Date(subscription.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  {subscription.end_date && (
                    <div>
                      <span className="font-medium">Ends:</span>
                      <div className="text-muted-foreground">
                        {new Date(subscription.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
                {subscription.status === "paused" && subscription.paused_from && subscription.paused_until && (
                  <div className="text-sm bg-yellow-50 p-2 rounded">
                    <span className="font-medium">Paused:</span>
                    <div className="text-muted-foreground">
                      {new Date(subscription.paused_from).toLocaleDateString()} - {new Date(subscription.paused_until).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <div className="flex space-x-2 pt-2">
                  {subscription.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(subscription.id)}
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {subscription.status === "paused" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resumeSubscription(subscription.id)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  {subscription.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => cancelSubscription(subscription.id)}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Order History</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={exportToCSV}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportToExcel}>
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm mb-2">Vendor</Label>
                    <Select value={historyVendorFilter} onValueChange={setHistoryVendorFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Vendors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vendors</SelectItem>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2">Product</Label>
                    <Select value={historyProductFilter} onValueChange={setHistoryProductFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2">Status</Label>
                    <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subscriptionOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders from subscriptions yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{format(new Date(order.order_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{order.vendor.name}</TableCell>
                          <TableCell>{order.product.name}</TableCell>
                          <TableCell>{order.quantity} {order.unit}</TableCell>
                          <TableCell>₹{(Number(order.total_amount) / Number(order.quantity)).toFixed(2)}</TableCell>
                          <TableCell>₹{order.total_amount}</TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Subscription Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vendor</Label>
              <Select 
                value={newSubscription.vendor_id} 
                onValueChange={(value) => setNewSubscription({...newSubscription, vendor_id: value, product_id: ""})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Product</Label>
              <Select 
                value={newSubscription.product_id} 
                onValueChange={(value) => setNewSubscription({...newSubscription, product_id: value})}
                disabled={!newSubscription.vendor_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₹{product.price}/{product.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Quantity</Label>
              <Input 
                type="number" 
                min="1"
                value={newSubscription.quantity}
                onChange={(e) => setNewSubscription({...newSubscription, quantity: parseInt(e.target.value)})}
              />
            </div>
            
            <div>
              <Label>Frequency</Label>
              <Select 
                value={newSubscription.frequency} 
                onValueChange={(value) => setNewSubscription({...newSubscription, frequency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={newSubscription.start_date}
                onChange={(e) => setNewSubscription({...newSubscription, start_date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateSubscription}
              disabled={!newSubscription.vendor_id || !newSubscription.product_id}
            >
              Create Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Subscription Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pause From</Label>
              <Calendar
                mode="single"
                selected={pauseFromDate}
                onSelect={setPauseFromDate}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label>Resume On</Label>
              <Calendar
                mode="single"
                selected={pauseUntilDate}
                onSelect={setPauseUntilDate}
                className="rounded-md border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePauseConfirm} disabled={!pauseFromDate || !pauseUntilDate}>
              Confirm Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
