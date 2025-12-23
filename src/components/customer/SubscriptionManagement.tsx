import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pause, Play, X, Calendar as CalendarIcon, Plus, Package, History, Download, Eye, Minus, ShoppingCart } from "lucide-react";
import OrderCalendar from "./OrderCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
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
import * as XLSX from 'xlsx-js-style';
import SubscriptionCalendarView from "./components/SubscriptionCalendarView";

interface SubscriptionManagementProps {
  onNavigate?: (tab: string, params?: any) => void;
  navigationParams?: {
    vendorId?: string;
    productId?: string;
    highlightSubscriptionId?: string;
  };
  addToCart?: (product: any, vendor: any, quantity: number) => void;
}

const SubscriptionManagement = ({ onNavigate, navigationParams, addToCart }: SubscriptionManagementProps) => {
  const { user } = useAuth();
  const { subscriptions, loading, pauseSubscription, resumeSubscription, cancelSubscription, createSubscription, isCreating } = useSubscriptions();
  const { vendors } = useVendors();
  const { products } = useProducts();
  const { vendorProducts } = useVendorProducts();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumeDate, setResumeDate] = useState<Date | undefined>(undefined);
  const [showCancelled, setShowCancelled] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("active");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<string | null>(null);
  const [cancelledDialogOpen, setCancelledDialogOpen] = useState(false);
  const [cancelledDialogSubs, setCancelledDialogSubs] = useState<any[]>([]);
  const [createDialogVendors, setCreateDialogVendors] = useState<typeof vendors>([] as any);
  
  // Grouping state - default to 'vendor'
  const [groupBy, setGroupBy] = useState<'vendor' | 'product'>('vendor');
  
  // Group active/paused subscriptions by vendor or product
  const groupedActiveSubscriptions = useMemo(() => {
    const activeSubs = subscriptions.filter(sub => sub.status !== 'cancelled');
    
    console.log('Active subscriptions:', activeSubs);
    console.log('Group by:', groupBy);
    
    if (groupBy === 'vendor') {
      // Group by vendor
      const grouped = activeSubs.reduce((acc, sub) => {
        const vendorId = sub.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            id: vendorId,
            name: sub.vendor?.name || 'Unknown Vendor',
            subscriptions: []
          };
        }
        acc[vendorId].subscriptions.push(sub);
        return acc;
      }, {} as Record<string, { id: string; name: string; subscriptions: typeof activeSubs }>);
      
      console.log('Grouped by vendor:', grouped);
      return grouped;
    } else {
      // Group by product
      const grouped = activeSubs.reduce((acc, sub) => {
        const productId = sub.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: sub.product?.name || 'Unknown Product',
            subscriptions: []
          };
        }
        acc[productId].subscriptions.push(sub);
        return acc;
      }, {} as Record<string, { id: string; name: string; subscriptions: typeof activeSubs }>);
      
      console.log('Grouped by product:', grouped);
      return grouped;
    }
  }, [subscriptions, groupBy]);
  
  // Group cancelled subscriptions by vendor or product
  const groupedCancelledSubscriptions = useMemo(() => {
    const cancelledSubs = subscriptions.filter(sub => sub.status === 'cancelled');
    
    if (groupBy === 'vendor') {
      // Group by vendor, then by product within each vendor
      return cancelledSubs.reduce((acc, sub) => {
        const vendorId = sub.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            id: vendorId,
            name: sub.vendor?.name || 'Unknown Vendor',
            products: {}
          };
        }
        
        const productId = sub.product_id;
        const key = `${vendorId}-${productId}`;
        if (!acc[vendorId].products[key]) {
          acc[vendorId].products[key] = {
            productId,
            vendorId,
            productName: sub.product?.name || 'Unknown Product',
            vendorName: sub.vendor?.name || 'Unknown Vendor',
            productImage: sub.product?.image_url,
            subscriptions: []
          };
        }
        acc[vendorId].products[key].subscriptions.push(sub);
        return acc;
      }, {} as Record<string, { id: string; name: string; products: Record<string, any> }>);
    } else {
      // Group by product, then by vendor within each product
      return cancelledSubs.reduce((acc, sub) => {
        const productId = sub.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: sub.product?.name || 'Unknown Product',
            products: {}
          };
        }
        
        const vendorId = sub.vendor_id;
        const key = `${vendorId}-${productId}`;
        if (!acc[productId].products[key]) {
          acc[productId].products[key] = {
            productId,
            vendorId,
            productName: sub.product?.name || 'Unknown Product',
            vendorName: sub.vendor?.name || 'Unknown Vendor',
            productImage: sub.product?.image_url,
            subscriptions: []
          };
        }
        acc[productId].products[key].subscriptions.push(sub);
        return acc;
      }, {} as Record<string, { id: string; name: string; products: Record<string, any> }>);
    }
  }, [subscriptions, groupBy]);
  
  // Calendar filter state
  const [calendarVendorId, setCalendarVendorId] = useState<string>("");
  const [calendarProductId, setCalendarProductId] = useState<string>("");
  
  // Order history filters
  const [historyVendorFilter, setHistoryVendorFilter] = useState("all");
  const [historyProductFilter, setHistoryProductFilter] = useState("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyStartDate, setHistoryStartDate] = useState<Date | undefined>(undefined);
  const [historyEndDate, setHistoryEndDate] = useState<Date | undefined>(undefined);
  const [historyMonth, setHistoryMonth] = useState(() => {
    // Default to previous month
    const today = new Date();
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false);
  const [pauseFromDate, setPauseFromDate] = useState<Date | undefined>(new Date());
  const [pauseUntilDate, setPauseUntilDate] = useState<Date | undefined>(undefined);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const getDefaultSubscriptionDates = () => {
    const today = new Date();
    const start = today.toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().split('T')[0];
    return { start, end };
  };

  // New subscription form state
  const [newSubscription, setNewSubscription] = useState(() => {
    const { start, end } = getDefaultSubscriptionDates();
    return {
      vendor_id: "",
      product_id: "",
      quantity: 1,
      frequency: "daily",
      start_date: start,
      end_date: end,
      weekly_days: [] as number[],
      monthly_date: 1
    };
  });

  // Product quantity state for quick subscribe
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [productDetailsDialogOpen, setProductDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productComboOpen, setProductComboOpen] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [vendorComboOpen, setVendorComboOpen] = useState(false);

  

  // Handle highlighting subscription when navigated from vendor directory
  useEffect(() => {
    if (navigationParams?.highlightSubscriptionId) {
      // Scroll to the subscription card
      setTimeout(() => {
        const element = document.getElementById(`subscription-${navigationParams.highlightSubscriptionId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add temporary highlight animation
          element.classList.add('ring-2', 'ring-orange-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-2');
          }, 3000);
        }
      }, 100);
    }
  }, [navigationParams]);

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
  
  // Get available vendors (only those with products)
  const availableVendors = useMemo(() => {
    // If a product is selected in the create dialog, show only vendors that offer that product and are active
    if (newSubscription.product_id) {
      const vendorIds = new Set(
        vendorProducts
          .filter(vp => vp.product_id === newSubscription.product_id && vp.is_active)
          .map(vp => vp.vendor_id)
      );
      return vendors.filter(v => v.is_active && vendorIds.has(v.id));
    }

    // Default: vendors with at least one active vendorProduct
    const vendorIds = new Set(vendorProducts.filter(vp => vp.is_active).map(vp => vp.vendor_id));
    return vendors.filter(v => v.is_active && vendorIds.has(v.id));
  }, [vendors, vendorProducts, newSubscription.product_id]);
  const availableProducts = useMemo(() => {
    // Get product IDs that are already subscribed (active or paused)
    const subscribedProductIds = new Set(
      subscriptions
        .filter(sub => sub.status === 'active' || sub.status === 'paused')
        .map(sub => sub.product_id)
    );
    
    // Use the vendor from the create dialog if it's set, otherwise use the filter
    const vendorIdToFilter = newSubscription.vendor_id || selectedVendorFilter;
    
    if (vendorIdToFilter === "all" || !vendorIdToFilter) {
      // Get all active vendor products
      const allVendorProducts = vendorProducts.filter(vp => vp.is_active);
      
      // Create a Map to deduplicate by product_id
      const uniqueProductsMap = new Map();
      
      allVendorProducts.forEach(vp => {
        const product = vp.product || products.find(p => p.id === vp.product_id);
        // Skip if product is already subscribed
        if (product && !subscribedProductIds.has(product.id)) {
          // If we haven't seen this product yet, or if this vendor offers a better price
          if (!uniqueProductsMap.has(product.id)) {
            uniqueProductsMap.set(product.id, {
              ...product,
              price: vp.price_override || product.price,
              vendor_id: vp.vendor_id
            });
          } else {
            // Keep the lowest price variant
            const existing = uniqueProductsMap.get(product.id);
            const currentPrice = vp.price_override || product.price;
            if (currentPrice < existing.price) {
              uniqueProductsMap.set(product.id, {
                ...product,
                price: currentPrice,
                vendor_id: vp.vendor_id
              });
            }
          }
        }
      });
      
      return Array.from(uniqueProductsMap.values());
    }
    
    // When a specific vendor is selected, show all their products (except subscribed ones)
    return vendorProducts
      .filter(vp => vp.vendor_id === vendorIdToFilter && vp.is_active)
      .map(vp => {
        const product = vp.product || products.find(p => p.id === vp.product_id);
        return product && !subscribedProductIds.has(product.id) ? {
          ...product,
          price: vp.price_override || product.price,
          vendor_id: vp.vendor_id
        } : null;
      })
      .filter(p => p !== null);
  }, [vendorProducts, products, selectedVendorFilter, newSubscription.vendor_id, subscriptions]);

  // All active products across all vendors (deduped by product id, choose lowest price)
  const allActiveProducts = useMemo(() => {
    const map = new Map<string, any>();
    vendorProducts.filter(vp => vp.is_active).forEach(vp => {
      const product = vp.product || products.find(p => p.id === vp.product_id);
      if (!product) return;
      const price = vp.price_override || product.price;
      const existing = map.get(product.id);
      if (!existing || price < existing.price) {
        map.set(product.id, { ...product, price });
      }
    });
    return Array.from(map.values());
  }, [vendorProducts, products]);
  
  // Reset product search when vendor changes or dialog opens
  useEffect(() => {
    setProductSearchQuery("");
  }, [newSubscription.vendor_id, createDialogOpen]);

  const handlePause = (subscriptionId: string) => {
    setSelectedSubscription(subscriptionId);
    setPauseDialogOpen(true);
  };

  const handleSubscribeFromProduct = async (product: any) => {
    try {
      // Fetch active vendor_products for this product directly from Supabase to avoid stale cache
      const { data: vpData, error } = await supabase
        .from('vendor_products')
        .select('vendor_id')
        .eq('product_id', product.id)
        .eq('is_active', true);

      if (error) throw error;

      const offeringVendorIds = (vpData || []).map((v: any) => v.vendor_id).filter(Boolean);

      // Filter vendors list to only those offering this product and active
      const dialogVendors = vendors.filter(v => v.is_active && offeringVendorIds.includes(v.id));
      setCreateDialogVendors(dialogVendors as any);

      const activeOfferingVendor = offeringVendorIds.length === 1 ? offeringVendorIds[0] : "";

      setNewSubscription(prev => ({ ...prev, product_id: product.id, quantity: productQuantities[product.id] || 1, vendor_id: activeOfferingVendor }));
      setCreateDialogOpen(true);
    } catch (err) {
      console.error('Error fetching vendor offerings for product:', err);
      // Fallback: open dialog with current available vendors
      setCreateDialogVendors(availableVendors as any);
      setNewSubscription(prev => ({ ...prev, product_id: product.id, quantity: productQuantities[product.id] || 1 }));
      setCreateDialogOpen(true);
    }
  };

  const handlePauseConfirm = async () => {
    if (selectedSubscription && pauseFromDate && pauseUntilDate) {
      try {
        await pauseSubscription(
          selectedSubscription,
          format(pauseFromDate, 'yyyy-MM-dd'),
          format(pauseUntilDate, 'yyyy-MM-dd')
        );
        setPauseDialogOpen(false);
        setSelectedSubscription(null);
        setPauseFromDate(new Date());
        setPauseUntilDate(undefined);
      } catch (error) {
        console.error('Error pausing subscription:', error);
      }
    }
  };
  
  const handleResume = (subscriptionId: string) => {
    setSelectedSubscription(subscriptionId);
    setResumeDate(new Date());
    setResumeDialogOpen(true);
  };

  const handleResumeConfirm = async () => {
    if (selectedSubscription && resumeDate) {
      try {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            start_date: format(resumeDate, 'yyyy-MM-dd'),
            paused_from: null,
            paused_until: null
          })
          .eq('id', selectedSubscription);
        
        setResumeDialogOpen(false);
        setSelectedSubscription(null);
        setResumeDate(undefined);
        
        // Refresh subscriptions
        window.location.reload();
      } catch (error) {
        console.error('Error resuming subscription:', error);
      }
    }
  };
  
  const handleCreateSubscription = async () => {
    if (!customerId || !newSubscription.vendor_id || !newSubscription.product_id || !newSubscription.end_date) return;
    
    const selectedProduct = availableProducts.find((p: any) => p.id === newSubscription.product_id);
    if (!selectedProduct) return;
    
    try {
      console.log('Creating subscription with:', {
        start_date: newSubscription.start_date,
        end_date: newSubscription.end_date,
        frequency: newSubscription.frequency,
        product: selectedProduct.name
      });
      
      await createSubscription({
        customer_id: customerId,
        vendor_id: newSubscription.vendor_id,
        product_id: newSubscription.product_id,
        quantity: newSubscription.quantity,
        unit: selectedProduct.unit,
        price_per_unit: selectedProduct.price,
        frequency: newSubscription.frequency,
        start_date: newSubscription.start_date,
        end_date: newSubscription.end_date,
        status: 'active',
        paused_from: null,
        paused_until: null,
      });
      
      setCreateDialogOpen(false);
      const { start, end } = getDefaultSubscriptionDates();
      setNewSubscription({
        vendor_id: "",
        product_id: "",
        quantity: 1,
        frequency: "daily",
        start_date: start,
        end_date: end,
        weekly_days: [],
        monthly_date: 1
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  const handleConfirmCancel = async () => {
    if (!subscriptionToCancel) return;
    
    try {
      await cancelSubscription(subscriptionToCancel);
      setCancelDialogOpen(false);
      setSubscriptionToCancel(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case "cancelled":
        return <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 border border-red-300">Cancelled</span>;
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
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCartDialogOpen(true)}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartItems.length > 0 && (
              <Badge className="absolute top-0 right-0 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {cartItems.length}
              </Badge>
            )}
          </Button>
          <Button onClick={() => { setCreateDialogVendors(availableVendors); setCreateDialogOpen(true); }} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            New Subscription
          </Button>
        </div>
      </div>
      
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="active">
            <Package className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">

      {/* Active Subscriptions Section */}
      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No active subscriptions</p>
            <p className="text-sm text-muted-foreground mt-2">Create a subscription when placing an order</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Subscriptions</h3>
            <div className="flex gap-2">
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={groupBy === 'vendor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGroupBy('vendor')}
                  className="h-8"
                >
                  By Vendor
                </Button>
                <Button
                  variant={groupBy === 'product' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGroupBy('product')}
                  className="h-8"
                >
                  By Product
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelled(!showCancelled)}
              >
                {showCancelled ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Active
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Cancelled ({subscriptions.filter(s => s.status === 'cancelled').length})
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Grouped Active/Paused Subscriptions */}
          {!showCancelled && Object.entries(groupedActiveSubscriptions).map(([groupId, group]) => (
            <div key={groupId} className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground px-1">
                {group.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.subscriptions.map((subscription) => (
                  <Card key={subscription.id} id={`subscription-${subscription.id}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="aspect-square w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            {subscription.product?.image_url ? (
                              <img src={subscription.product.image_url} alt={subscription.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{subscription.product?.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{subscription.vendor?.name}</p>
                          </div>
                        </div>
                        {getStatusBadge(subscription.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">Originally Started:</span>
                        <div className="text-muted-foreground">
                          {format(new Date(subscription.original_start_date || subscription.start_date), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      {subscription.status === "paused" && subscription.paused_from && subscription.paused_until && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">Paused Period:</span>
                          <div className="text-yellow-700 dark:text-yellow-300 text-sm">
                            From: {format(new Date(subscription.paused_from), 'MMM dd, yyyy')}<br/>
                            Until: {format(new Date(subscription.paused_until), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      )}

                      {subscription.status === "active" && subscription.paused_from && (
                        <div className="text-xs text-muted-foreground">
                          Last resumed: {format(new Date(subscription.start_date), 'MMM dd, yyyy')}
                        </div>
                      )}

                      {subscription.end_date && (
                        <div>
                          <span className="font-medium">Ended:</span>
                          <div className="text-muted-foreground">
                            {format(new Date(subscription.end_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex space-x-2">
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
                            variant="default"
                            onClick={() => handleResume(subscription.id)}
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        )}
                        {subscription.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSubscriptionToCancel(subscription.id);
                              setCancelDialogOpen(true);
                            }}
                            className="flex-1 border border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onNavigate?.('dashboard', {
                            vendorId: subscription.vendor_id,
                            productId: subscription.product_id
                          });
                        }}
                        className="w-full"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        See Calendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            </div>
          ))}

          {/* Render cancelled subscriptions grouped by vendor or product */}
          {showCancelled && Object.entries(groupedCancelledSubscriptions).map(([groupId, group]) => (
            <div key={groupId} className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground px-1">
                {group.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(group.products).map(([key, productGroup]: [string, any]) => (
                  <Card key={key} className="hover:shadow-lg transition-shadow border border-gray-300">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="aspect-square w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            {productGroup.productImage ? (
                              <img src={productGroup.productImage} alt={productGroup.productName} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{productGroup.productName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{productGroup.vendorName}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge('cancelled')}
                          {productGroup.subscriptions.length > 1 && (
                            <span className="text-xs text-muted-foreground">
                              {productGroup.subscriptions.length} subscriptions
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{productGroup.subscriptions.length} cancelled subscription{productGroup.subscriptions.length > 1 ? 's' : ''}</p>
                          <p className="text-xs text-muted-foreground mt-1">Originally started: {format(new Date(productGroup.subscriptions[0].original_start_date || productGroup.subscriptions[0].start_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCancelledDialogSubs(productGroup.subscriptions);
                              setCancelledDialogOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onNavigate?.('dashboard', {
                                vendorId: productGroup.vendorId,
                                productId: productGroup.productId
                              });
                            }}
                          >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            See Calendar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other Products Section - Only show when viewing active subscriptions */}
      {!showCancelled && availableProducts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Subscribe to New Products</CardTitle>
              <Select value={selectedVendorFilter} onValueChange={setSelectedVendorFilter}>
                <SelectTrigger className="w-full sm:w-48">
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
              {availableProducts.slice(0, 12).map((product: any) => {
                const quantity = productQuantities[product.id] || 1;
                return (
                  <Card 
                    key={product.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product);
                      setProductDetailsDialogOpen(true);
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
                      
                      <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleSubscribeFromProduct(product)}
                          >
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Subscribe
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              const vendorName = vendors.find(v => v.id === product.vendor_id)?.name || 'Unknown';
                              addToCart(product, { id: product.vendor_id, name: vendorName }, quantity);
                            }}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Quick Order
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              const newQty = Math.max(1, quantity - 1);
                              setProductQuantities(prev => ({...prev, [product.id]: newQty}));
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">{quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              const newQty = Math.min(10, quantity + 1);
                              setProductQuantities(prev => ({...prev, [product.id]: newQty}));
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
      </Tabs>

      {/* Create Subscription Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product's Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            
            
            <div>
              <Label>Product</Label>
              <Popover open={productComboOpen} onOpenChange={setProductComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productComboOpen}
                    className="w-full justify-between"
                  >
                    {(() => {
                      const sel = allActiveProducts.find((p: any) => p.id === newSubscription.product_id);
                      return sel ? `${sel.name} - ₹${sel.price}/${sel.unit}` : "Select product";
                    })()}
                    <span className="ml-2 text-muted-foreground">▾</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                  <Command>
                    <CommandInput
                      placeholder="Search products..."
                      value={productSearchQuery}
                      onValueChange={(q) => {
                        setProductSearchQuery(q);
                        if (q.trim().length > 0) {
                          setNewSubscription(prev => ({ ...prev, vendor_id: "" }));
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="all-products"
                          value="All Products"
                          onSelect={() => {
                            setNewSubscription({ ...newSubscription, product_id: "" });
                            setProductComboOpen(false);
                          }}
                        >
                          All Products (clear selection)
                        </CommandItem>
                        {(() => {
                          const query = productSearchQuery.toLowerCase().trim();
                          const source = allActiveProducts as any[];
                          const filtered = source.filter((p: any) => p.name.toLowerCase().includes(query));
                          return filtered.map((product: any) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => {
                                setNewSubscription({ ...newSubscription, product_id: product.id, vendor_id: "" });
                                setProductComboOpen(false);
                              }}
                            >
                              {product.name} - ₹{product.price}/{product.unit}
                            </CommandItem>
                          ));
                        })()}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Vendor</Label>
              <Popover open={vendorComboOpen} onOpenChange={setVendorComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={vendorComboOpen}
                    className="w-full justify-between"
                  >
                    {(() => {
                      const vendorSource = availableVendors;
                      const sel = vendorSource.find((v: any) => v.id === newSubscription.vendor_id);
                      return sel ? sel.name : (newSubscription.product_id ? "Select vendor" : "Select product first");
                    })()}
                    <span className="ml-2 text-muted-foreground">▾</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                  <Command>
                    <CommandInput
                      placeholder="Search vendors..."
                      value={vendorSearchQuery}
                      onValueChange={(q) => setVendorSearchQuery(q)}
                    />
                    <CommandList>
                      <CommandEmpty>No vendors found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="all-vendors"
                          value="All Vendors"
                          onSelect={() => {
                            setNewSubscription({ ...newSubscription, vendor_id: "" });
                            setVendorComboOpen(false);
                          }}
                        >
                          All Vendors (clear filter)
                        </CommandItem>
                        {(() => {
                          const vendorSource = availableVendors;
                          const query = vendorSearchQuery.toLowerCase().trim();
                          const filtered = vendorSource.filter((v: any) => v.name.toLowerCase().includes(query));
                          return filtered.map((vendor: any) => (
                            <CommandItem
                              key={vendor.id}
                              value={vendor.name}
                              onSelect={() => {
                                setNewSubscription({ ...newSubscription, vendor_id: vendor.id });
                                setVendorComboOpen(false);
                              }}
                            >
                              {vendor.name}
                            </CommandItem>
                          ));
                        })()}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Quantity</Label>
              <Input 
                type="number" 
                min="1"
                step="1"
                value={newSubscription.quantity}
                onChange={(e) => setNewSubscription({...newSubscription, quantity: parseInt(e.target.value) || 1})}
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
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
              </Select>
            </div>
            
            {newSubscription.frequency === "weekly" && (
              <div>
                <Label>Delivery Days</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => (
                    <Button
                      key={day}
                      type="button"
                      variant={newSubscription.weekly_days.includes(index) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newDays = newSubscription.weekly_days.includes(index)
                          ? newSubscription.weekly_days.filter(d => d !== index)
                          : [...newSubscription.weekly_days, index];
                        setNewSubscription({...newSubscription, weekly_days: newDays});
                      }}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {newSubscription.frequency === "monthly" && (
              <div>
                <Label>Delivery Date (Day of Month)</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={newSubscription.monthly_date}
                  onChange={(e) => setNewSubscription({...newSubscription, monthly_date: Number(e.target.value)})}
                />
              </div>
            )}
            
            <div>
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={newSubscription.start_date}
                onChange={(e) => setNewSubscription({...newSubscription, start_date: e.target.value})}
              />
            </div>
            
            <div>
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={newSubscription.end_date}
                min={newSubscription.start_date}
                required
                onChange={(e) => setNewSubscription({...newSubscription, end_date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateSubscription}
              disabled={!newSubscription.vendor_id || !newSubscription.product_id || !newSubscription.end_date || isCreating}
            >
              {isCreating ? "Creating..." : "Create Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Subscription Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pause Subscription</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select the period during which you want to pause deliveries
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Pause From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !pauseFromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pauseFromDate ? format(pauseFromDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={pauseFromDate}
                    onSelect={setPauseFromDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Pause Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !pauseUntilDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pauseUntilDate ? format(pauseUntilDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={pauseUntilDate}
                    onSelect={setPauseUntilDate}
                    disabled={(date) => !pauseFromDate || date <= pauseFromDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {pauseFromDate && pauseUntilDate && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                <p className="font-medium">Pause Duration:</p>
                <p className="text-muted-foreground">
                  {Math.ceil((pauseUntilDate.getTime() - pauseFromDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePauseConfirm}
              disabled={!pauseFromDate || !pauseUntilDate}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Subscription Dialog */}
      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resume Subscription</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select when you want to resume deliveries
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Resume From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !resumeDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {resumeDate ? format(resumeDate, "PPP") : "Select resume date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={resumeDate}
                    onSelect={setResumeDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-2">
                Deliveries will resume from this date onwards
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResumeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResumeConfirm}
              disabled={!resumeDate}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this subscription? This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your subscription will be cancelled immediately and no future orders will be placed.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCancelDialogOpen(false);
                setSubscriptionToCancel(null);
              }}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel}
            >
              Yes, Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancelled Subscriptions Details Dialog */}
      <Dialog open={cancelledDialogOpen} onOpenChange={setCancelledDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Cancelled Subscriptions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 overflow-auto max-h-[60vh]">
            {cancelledDialogSubs.map((subscription, index) => (
              <div key={subscription.id} className={cn("text-sm space-y-2 p-3 rounded-lg bg-muted/50", index > 0 && "border-t")}>
                {cancelledDialogSubs.length > 1 && (
                  <div className="text-xs font-medium text-muted-foreground mb-2">Subscription #{index + 1}</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium">Quantity:</span>
                    <div className="text-muted-foreground">{subscription.quantity} {subscription.unit}</div>
                  </div>
                  <div>
                    <span className="font-medium">Price:</span>
                    <div className="text-muted-foreground">₹{subscription.price_per_unit}/{subscription.unit}</div>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Frequency:</span>
                  <div className="text-muted-foreground">{getFrequencyLabel(subscription.frequency)}</div>
                </div>
                <div>
                  <span className="font-medium">Originally Started:</span>
                  <div className="text-muted-foreground">{format(new Date(subscription.original_start_date || subscription.start_date), 'MMM dd, yyyy')}</div>
                </div>
                {subscription.end_date && (
                  <div>
                    <span className="font-medium">Ended:</span>
                    <div className="text-muted-foreground">{format(new Date(subscription.end_date), 'MMM dd, yyyy')}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelledDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={productDetailsDialogOpen} onOpenChange={setProductDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {/* Image Carousel */}
              {((selectedProduct as any).images?.length > 0 || selectedProduct.image_url) ? (
                <div className="relative">
                  {(selectedProduct as any).images?.length > 1 ? (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {(selectedProduct as any).images.map((img: string, idx: number) => (
                          <CarouselItem key={idx}>
                            <div className="w-full h-80 rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={img} 
                                alt={`${selectedProduct.name} ${idx + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {(selectedProduct as any).images.length} photos
                      </div>
                    </Carousel>
                  ) : (
                    <div className="w-full h-80 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={(selectedProduct as any).images?.[0] || selectedProduct.image_url} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-80 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Category</Label>
                  <div className="font-medium">{selectedProduct.category}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Price</Label>
                  <div className="font-medium text-lg">₹{selectedProduct.price}/{selectedProduct.unit}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Availability</Label>
                  <div className="font-medium">{selectedProduct.availability}</div>
                </div>
                {selectedProduct.subscribe_before && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Subscribe Before</Label>
                    <div className="font-medium">{selectedProduct.subscribe_before}</div>
                  </div>
                )}
                {selectedProduct.delivery_before && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Delivery Before</Label>
                    <div className="font-medium">{selectedProduct.delivery_before}</div>
                  </div>
                )}
              </div>

              {selectedProduct.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{selectedProduct.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDetailsDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              setProductDetailsDialogOpen(false);
              handleSubscribeFromProduct(selectedProduct);
            }}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Subscribe to this Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
            </DialogTitle>
          </DialogHeader>
          
          {cartItems.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">Add items using the Quick Order button</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {cartItems.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex gap-3">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.productName}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{item.productName}</h4>
                        <p className="text-xs text-muted-foreground">{item.vendorName}</p>
                        <p className="text-sm font-medium mt-1">₹{item.price}/{item.unit}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 border rounded p-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Items:</span>
                  <span>{cartItems.length}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCartDialogOpen(false)}
              className="flex-1"
            >
              Continue Shopping
            </Button>
            {cartItems.length > 0 && (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  // TODO: Implement checkout logic
                  // For now, show a simple notification
                  console.log('Checkout clicked with items:', cartItems);
                  // This would integrate with order creation
                }}
              >
                Checkout
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
