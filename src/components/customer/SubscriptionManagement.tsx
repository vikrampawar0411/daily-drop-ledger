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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useVendors } from "@/hooks/useVendors";
import { useProducts } from "@/hooks/useProducts";
import { useVendorProducts } from "@/hooks/useVendorProducts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
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
  const { toast } = useToast();
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
  const [quickOrderDialogOpen, setQuickOrderDialogOpen] = useState(false);
  const [quickOrderProduct, setQuickOrderProduct] = useState<any | null>(null);
  const [quickOrderVendorName, setQuickOrderVendorName] = useState("");
  const [quickOrderQuantity, setQuickOrderQuantity] = useState(1);
  const [quickOrderSubmitting, setQuickOrderSubmitting] = useState(false);
  
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
  const [pauseFromDate, setPauseFromDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [pauseUntilDate, setPauseUntilDate] = useState<Date | undefined>(addDays(new Date(), 2));
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
          const price = vp.price_override || product.price;
          const candidate = {
            ...product,
            price,
            vendor_id: vp.vendor_id,
            vendor_product_id: vp.id
          } as any;

          // If we haven't seen this product yet, or if this vendor offers a better price
          if (!uniqueProductsMap.has(product.id)) {
            uniqueProductsMap.set(product.id, candidate);
          } else {
            // Keep the lowest price variant
            const existing = uniqueProductsMap.get(product.id);
            const currentPrice = price;
            if (currentPrice < existing.price) {
              uniqueProductsMap.set(product.id, candidate);
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
          vendor_id: vp.vendor_id,
          vendor_product_id: vp.id
        } : null;
      })
      .filter(p => p !== null);
  }, [vendorProducts, products, selectedVendorFilter, newSubscription.vendor_id, subscriptions]);

  // All active products across all vendors (deduped by product id, choose lowest price)

    const handleQuickOrderClick = (product: any) => {
      const vendorName = vendors.find(v => v.id === product.vendor_id)?.name || "Unknown";
      const quantity = productQuantities[product.id] || 1;
      setQuickOrderProduct(product);
      setQuickOrderVendorName(vendorName);
      setQuickOrderQuantity(quantity);
      setQuickOrderDialogOpen(true);
    };

    const placeQuickOrder = async () => {

      if (!user || !quickOrderProduct) return;
      try {
        setQuickOrderSubmitting(true);

        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('[DEBUG] QuickOrder: user.id:', user.id);
        console.log('[DEBUG] QuickOrder: customerData:', customerData);
        if (customerError) {
          console.error('[DEBUG] QuickOrder: customerError:', customerError);
          throw customerError;
        }
        if (!customerData) {
          toast({ title: "Customer profile not found", variant: "destructive" });
          console.error('[DEBUG] QuickOrder: No customer profile found for user.id:', user.id);
          return;
        }

        // Resolve vendor product
        const resolvedVendorProduct =
          vendorProducts.find(vp => vp.id === quickOrderProduct.vendor_product_id) ||
          vendorProducts.find(vp => vp.product_id === quickOrderProduct.id && vp.vendor_id === quickOrderProduct.vendor_id);

        if (!resolvedVendorProduct) {
          throw new Error('Selected vendor/product combination is unavailable. Please refresh and try again.');
        }

        // Derive price per unit; block if missing to avoid NOT NULL violations
        const pricePerUnit = Number(
          quickOrderProduct.price ??
          quickOrderProduct.price_per_unit ??
          resolvedVendorProduct.price_override ??
          resolvedVendorProduct.product?.price ??
          quickOrderProduct.default_price ??
          quickOrderProduct.mrp
        );

        if (!pricePerUnit || Number.isNaN(pricePerUnit)) {
          throw new Error('Price unavailable for this product. Please contact support.');
        }

        const total = pricePerUnit * quickOrderQuantity;

        const unit = quickOrderProduct.unit || resolvedVendorProduct.product?.unit;
        if (!unit) {
          throw new Error('Unit is missing for this product. Please contact support.');
        }

        // Ensure orderDate is defined and set to today if not provided
        let orderDate: string;
        if (quickOrderProduct.order_date) {
          orderDate = quickOrderProduct.order_date;
        } else {
          // Default to today in YYYY-MM-DD
          const today = new Date();
          orderDate = today.toISOString().split('T')[0];
        }

        const { error: orderError } = await supabase.from('orders').insert({
          customer_id: customerData.id,
          vendor_id: resolvedVendorProduct.vendor_id,
          product_id: quickOrderProduct.id,
          vendor_product_id: resolvedVendorProduct.id,
          price_per_unit: pricePerUnit,
          quantity: quickOrderQuantity,
          unit,
          total_amount: total,
          order_date: orderDate,
          status: 'pending',
          delivered_at: null,
          dispute_raised: false,
          dispute_reason: null,
          dispute_raised_at: null,
          updated_by_user_id: user.id,
          order_type: 'request' // Mark as quick order
        });

        if (orderError) throw orderError;

        // Send notification to vendor
        if (resolvedVendorProduct.vendor_id) {
          const vendorUserIdRes = await supabase
            .from('vendors')
            .select('user_id')
            .eq('id', resolvedVendorProduct.vendor_id)
            .maybeSingle();
          const vendorUserId = vendorUserIdRes?.data?.user_id;
          if (vendorUserId) {
            await (supabase.from('notifications' as any).insert({
              recipient_user_id: vendorUserId,
              sender_user_id: user.id,
              order_id: null, // Optionally set order_id if available
              vendor_id: resolvedVendorProduct.vendor_id,
              message: `New order placed for ${quickOrderProduct.name} (${quickOrderQuantity} ${unit}) by customer`,
              type: 'order_placed',
              is_read: false,
              created_at: new Date().toISOString(),
            }) as any);
          }
        }

        // Reflect in local cart UI when available
        if (addToCart) {
          const vendor = vendors.find(v => v.id === resolvedVendorProduct.vendor_id);
          if (vendor) {
            const productForCart = { ...quickOrderProduct, price: pricePerUnit };
            addToCart(productForCart, vendor, quickOrderQuantity);
          }
        }

        toast({ title: "Order placed", description: `${quickOrderProduct.name} x${quickOrderQuantity} confirmed` });
        setQuickOrderDialogOpen(false);
      } catch (err: any) {
        console.error('Quick order failed', err);
        const description = err?.message || 'Could not place order. Please try again.';
        toast({ title: "Failed to place order", description, variant: "destructive" });
      } finally {
        setQuickOrderSubmitting(false);
      }
    };
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

  // Ensure pause dates are prefilled and coherent when dialog is open
  useEffect(() => {
    if (!pauseDialogOpen) return;

    const tomorrow = addDays(new Date(), 1);
    const defaultFrom = pauseFromDate || tomorrow;
    const nextDay = addDays(defaultFrom, 1);

    if (!pauseFromDate) {
      setPauseFromDate(defaultFrom);
    }

    if (!pauseUntilDate || (pauseFromDate && pauseUntilDate <= pauseFromDate)) {
      setPauseUntilDate(nextDay);
    }
    // Keep pause to one day by default when opening
    if (pauseFromDate && (!pauseUntilDate || pauseUntilDate.getTime() !== addDays(pauseFromDate, 1).getTime())) {
      setPauseUntilDate(addDays(pauseFromDate, 1));
    }
  }, [pauseDialogOpen, pauseFromDate, pauseUntilDate]);

  const handlePause = (subscriptionId: string) => {
    setSelectedSubscription(subscriptionId);
    setPauseFromDate(addDays(new Date(), 1));
    setPauseUntilDate(addDays(new Date(), 2));
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
        const subscription = subscriptions.find(sub => sub.id === selectedSubscription);
        const cutoffStr = (subscription?.product as any)?.subscribe_before || "";

        // If pause starts within next day and cutoff passed, block
        if (cutoffStr) {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const daysDiff = Math.floor((pauseFromDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 1) {
            const [time, meridian] = cutoffStr.split(/\s+/);
            const [hourStr, minuteStr] = time?.split(":") || [];
            let hours = parseInt(hourStr || "0", 10);
            const minutes = parseInt(minuteStr || "0", 10);
            const isPM = (meridian || "").toUpperCase().startsWith("P");
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;

            const cutoffDate = new Date();
            cutoffDate.setHours(hours, minutes, 0, 0);

            if (now > cutoffDate) {
              toast({
                title: "Pause cut-off passed",
                description: "This product's cut-off time is over for the selected start date.",
                variant: "destructive",
              });
              return;
            }
          }
        }

        await pauseSubscription(
          selectedSubscription,
          format(pauseFromDate, 'yyyy-MM-dd'),
          format(pauseUntilDate, 'yyyy-MM-dd')
        );
        setPauseDialogOpen(false);
        setSelectedSubscription(null);
        setPauseFromDate(addDays(new Date(), 1));
        setPauseUntilDate(addDays(new Date(), 2));
      } catch (error) {
        console.error('Error pausing subscription:', error);
      }
    }
  };
  
  const handleResume = (subscriptionId: string) => {
    const subscription = subscriptions.find(sub => sub.id === subscriptionId);
    const cutoffStr = (subscription?.product as any)?.subscribe_before || "";

    // Always default to tomorrow for resume
    let defaultResumeDate = addDays(new Date(), 1);
    
    // If cutoff not passed today, can resume today
    if (cutoffStr) {
      const [time, meridian] = cutoffStr.split(/\s+/);
      const [hourStr, minuteStr] = time?.split(":") || [];
      let hours = parseInt(hourStr || "0", 10);
      const minutes = parseInt(minuteStr || "0", 10);
      const isPM = (meridian || "").toUpperCase().startsWith("P");
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      const cutoffDate = new Date();
      cutoffDate.setHours(hours, minutes, 0, 0);

      // Only if cutoff NOT passed, allow today
      if (new Date() <= cutoffDate) {
        defaultResumeDate = new Date();
      }
    }

    setSelectedSubscription(subscriptionId);
    setResumeDate(defaultResumeDate);
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
        
        // Regenerate orders for the resumed subscription
        try {
          const response = await fetch(
            'https://ssaogbrpjvxvlxtdivah.supabase.co/functions/v1/generate-subscription-orders',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYW9nYnJwanZ4dmx4dGRpdmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzE1OTIsImV4cCI6MjA3NTAwNzU5Mn0.QQn4MgbPVHi83q5jWwL5qYJNrwnFylHlUyawK_bJaiM`,
              },
              body: JSON.stringify({}),
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            toast({
              title: "Subscription Resumed",
              description: `Orders regenerated from ${format(resumeDate, "PPP")}`,
            });
          }
        } catch (genError) {
          console.error('Error regenerating orders:', genError);
        }
        
        // Refresh subscriptions
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
                  <Card
                    key={subscription.id}
                    id={`subscription-${subscription.id}`}
                    className="hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] w-full"
                    onClick={() => {
                      // Always use full product details from products array if available
                      const fullProduct = products.find(p => p.id === subscription.product_id);
                      setSelectedProduct(fullProduct || subscription.product);
                      setProductDetailsDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-3 flex flex-col items-center">
                      <div className="aspect-square w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                        {subscription.product?.image_url ? (
                          <img src={subscription.product.image_url} alt={subscription.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div className="w-full text-center">
                        <h4 className="font-semibold text-sm mb-1 truncate">{subscription.product?.name}</h4>
                        <div className="text-xs text-muted-foreground truncate">{subscription.vendor?.name}</div>
                      </div>
                      <div className="flex gap-2 mt-3 justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              aria-label="Cancel Subscription"
                              size="icon"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation();
                                setSubscriptionToCancel(subscription.id);
                                setCancelDialogOpen(true);
                              }}
                              className="relative bg-green-50 hover:bg-green-100"
                            >
                              <CalendarIcon className="h-4 w-4" />
                              <span className="absolute -top-1 -right-1 bg-green-600 rounded-full p-[0.5px] flex items-center justify-center">
                                <svg className="h-1 w-1 text-white" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l3 3 5-5" />
                                </svg>
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Cancel Subscription</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              aria-label={subscription.status === 'paused' ? 'Resume' : subscription.status === 'active' ? 'Pause' : 'Cancel'}
                              size="icon"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation();
                                if (subscription.status === 'active') handlePause(subscription.id);
                                else if (subscription.status === 'paused') handleResume(subscription.id);
                                else {
                                  setSubscriptionToCancel(subscription.id);
                                  setCancelDialogOpen(true);
                                }
                              }}
                            >
                              {subscription.status === 'active' ? <Pause className="h-4 w-4" /> : subscription.status === 'paused' ? <Play className="h-4 w-4" /> : <X className="h-4 w-4 text-red-600" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {subscription.status === 'active' ? 'Pause' : subscription.status === 'paused' ? 'Resume' : 'Cancel'}
                          </TooltipContent>
                        </Tooltip>
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
                    className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col justify-between min-w-[140px] w-full"
                    onClick={() => {
                      setSelectedProduct(product);
                      setProductDetailsDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-3 flex flex-col items-center">
                      <div className="aspect-square w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div className="w-full text-center">
                        <h4 className="font-semibold text-sm mb-1 truncate">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">₹{product.price}/{product.unit}</p>
                        <Badge variant="outline" className="text-xs mt-1">{product.category}</Badge>
                      </div>
                      <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              aria-label="Subscribe"
                              size="icon"
                              variant="outline"
                              onClick={() => handleSubscribeFromProduct(product)}
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Subscribe</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              aria-label="Quick Order"
                              size="icon"
                              variant="outline"
                              onClick={() => handleQuickOrderClick(product)}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Quick Order</TooltipContent>
                        </Tooltip>
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

        {/* Quick Order Confirmation */}
        <Dialog open={quickOrderDialogOpen} onOpenChange={setQuickOrderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Quick Order</DialogTitle>
            </DialogHeader>

            {quickOrderProduct && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {quickOrderProduct.image_url ? (
                    <img
                      src={quickOrderProduct.image_url}
                      alt={quickOrderProduct.name}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{quickOrderVendorName}</p>
                    <h4 className="font-semibold truncate">{quickOrderProduct.name}</h4>
                    <p className="text-sm text-muted-foreground">₹{quickOrderProduct.price}/{quickOrderProduct.unit}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setQuickOrderQuantity(qty => Math.max(1, qty - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[2rem] text-center font-semibold">{quickOrderQuantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setQuickOrderQuantity(qty => Math.min(50, qty + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-semibold">₹{(quickOrderProduct.price * quickOrderQuantity).toFixed(2)}</span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setQuickOrderDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={quickOrderSubmitting}
                onClick={placeQuickOrder}
              >
                {quickOrderSubmitting ? "Placing..." : "Confirm Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              Default pause is for one day. Adjust the resume date if needed.
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
                    onSelect={(date) => {
                      if (!date) return;
                      setPauseFromDate(date);
                      setPauseUntilDate(addDays(date, 1));
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Resume On</Label>
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
                    {pauseUntilDate ? format(pauseUntilDate, "PPP") : "Select resume date"}
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
                  <div className="font-medium">{selectedProduct.category || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Price</Label>
                  <div className="font-medium text-lg">₹{selectedProduct.price}/{selectedProduct.unit}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Availability</Label>
                  <div className="font-medium">{selectedProduct.availability || 'Not specified'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Subscribe Before</Label>
                  <div className="font-medium">{selectedProduct.subscribe_before || 'Not specified'}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Delivery Before</Label>
                  <div className="font-medium">{selectedProduct.delivery_before || 'Not specified'}</div>
                </div>
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

      {/* Cart Dialog moved to global header (CustomerApp). */}
    </div>
  );
};

export default SubscriptionManagement;
