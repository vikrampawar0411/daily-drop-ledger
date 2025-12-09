import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pause, Play, X, Calendar as CalendarIcon, Plus, Package, History, Download, Eye, Minus } from "lucide-react";
import OrderCalendar from "./OrderCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
}

const SubscriptionManagement = ({ onNavigate, navigationParams }: SubscriptionManagementProps = {}) => {
  const { user } = useAuth();
  const { subscriptions, loading, pauseSubscription, resumeSubscription, cancelSubscription, createSubscription } = useSubscriptions();
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
  
  // New subscription form state
  const [newSubscription, setNewSubscription] = useState({
    vendor_id: "",
    product_id: "",
    quantity: 1,
    frequency: "daily",
    start_date: new Date().toISOString().split('T')[0],
    weekly_days: [] as number[],
    monthly_date: 1
  });

  // Product quantity state for quick subscribe
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

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
  
  // Generate month options (last 12 months)
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

  // Filter orders with history filters applied
  const subscriptionOrders = useMemo(() => {
    let filtered = allOrders;
    
    // PRIORITY 1: Date range filter (overrides month filter)
    if (historyStartDate || historyEndDate) {
      if (historyStartDate) {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.order_date);
          return orderDate >= historyStartDate;
        });
      }
      
      if (historyEndDate) {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.order_date);
          return orderDate <= historyEndDate;
        });
      }
    } else {
      // PRIORITY 2: Month filter (only applies when no date range is set)
      if (historyMonth !== "all") {
        const [year, month] = historyMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.order_date);
          return orderDate >= firstDay && orderDate <= lastDay;
        });
      }
    }
    
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
  }, [allOrders, historyMonth, historyVendorFilter, historyProductFilter, historyStatusFilter, historyStartDate, historyEndDate]);
  
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
    const titleRowCount = 6;
    
    // Get unique statuses
    const statuses = [...new Set(subscriptionOrders.map(o => o.status))];
    
    // Title rows
    const titleRows = [
      ['SUBSCRIPTION ORDERS REPORT'],
      [`Customer: ${user?.email || 'N/A'}`],
      [`Total Orders: ${subscriptionOrders.length}`],
      [`Report Generated By: ${user?.email || 'N/A'}`],
      [`Generated On: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`],
      []
    ];
    
    // Prepare order data rows
    const orderRows = subscriptionOrders.map(order => [
      format(new Date(order.order_date), 'yyyy-MM-dd'),
      order.vendor.name,
      order.product.name,
      order.quantity,
      order.unit,
      Number(order.total_amount) / Number(order.quantity),
      order.total_amount,
      order.status
    ]);

    // Header row
    const headerRow = ['Date', 'Vendor', 'Product', 'Quantity', 'Unit', 'Price/Unit', 'Total', 'Status'];
    
    // Calculate row indices (accounting for 6 title rows)
    const orderDataStartRow = titleRowCount + 2;
    const orderDataEndRow = titleRowCount + orderRows.length + 1;
    const statusSummaryTextRow = titleRowCount + orderRows.length + 3;
    const summaryHeaderRow = titleRowCount + orderRows.length + 4;
    const summaryDataStartRow = titleRowCount + orderRows.length + 6;
    const summaryDataEndRow = titleRowCount + orderRows.length + 5 + statuses.length;
    const grandTotalRowNum = titleRowCount + orderRows.length + 5 + statuses.length;
    
    // Summary rows with formulas
    const summaryRows = statuses.map((status) => [
      status.toUpperCase(),
      { f: `COUNTIF(H${orderDataStartRow}:H${orderDataEndRow},"${status}")` },
      { f: `SUMIF(H${orderDataStartRow}:H${orderDataEndRow},"${status}",G${orderDataStartRow}:G${orderDataEndRow})` }
    ]);
    
    // Grand total
    const grandTotalRow = [
      'GRAND TOTAL',
      { f: `COUNTA(H${orderDataStartRow}:H${orderDataEndRow})` },
      { f: `SUM(G${orderDataStartRow}:G${orderDataEndRow})` }
    ];
    
    const allData = [
      ...titleRows,
      headerRow,
      ...orderRows,
      [],
      [],
      ['STATUS SUMMARY'],
      ['Status', 'Order Count', 'Total Amount (₹)'],
      ...summaryRows,
      grandTotalRow
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Auto-size columns based on content
    const calculateColumnWidth = (data: any[][], colIndex: number): number => {
      let maxWidth = 10;
      data.forEach(row => {
        if (row[colIndex] !== undefined && row[colIndex] !== null) {
          const cellValue = String(row[colIndex]);
          maxWidth = Math.max(maxWidth, cellValue.length);
        }
      });
      return Math.min(maxWidth + 2, 50);
    };
    
    const numColumns = headerRow.length;
    ws['!cols'] = Array.from({ length: numColumns }, (_, i) => ({
      wch: calculateColumnWidth(allData, i)
    }));
    
    // Add borders and styling to all cells
    const solidBorder = { style: 'thin', color: { rgb: '000000' } };
    const dottedBorder = { style: 'dotted', color: { rgb: '000000' } };
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    const mainHeaderRow = titleRowCount;
    const firstDataRow = titleRowCount + 1;
    const lastDataRow = titleRowCount + orderRows.length;
    const firstSummaryDataRow = summaryDataStartRow;
    const lastSummaryDataRow = summaryDataEndRow;
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellAddress];
        
        if (!cell || (!cell.v && cell.v !== 0)) continue;
        if (!cell.s) cell.s = {};
        
        // Title section styling (no borders)
        if (row < titleRowCount) {
          if (row === 0) {
            cell.s.font = { bold: true, sz: 16 };
            cell.s.alignment = { horizontal: 'left' };
          } else if (row >= 1 && row <= 4) {
            cell.s.font = { sz: 11 };
          }
          continue;
        }
        
        // Determine row type
        const isMainHeader = row === mainHeaderRow;
        const isFirstData = row === firstDataRow;
        const isLastData = row === lastDataRow;
        const isMiddleData = row > firstDataRow && row < lastDataRow;
        const isEmptyRow = row > lastDataRow && row < statusSummaryTextRow;
        const isStatusSummaryText = row === statusSummaryTextRow;
        const isSummaryHeader = row === summaryHeaderRow;
        const isFirstSummaryData = row === firstSummaryDataRow;
        const isMiddleSummaryData = row > firstSummaryDataRow && row < lastSummaryDataRow;
        const isLastSummaryData = row === lastSummaryDataRow;
        const isGrandTotal = row === grandTotalRowNum;
        
        // Skip empty rows
        if (isEmptyRow) continue;
        
        let topBorder, bottomBorder, leftBorder, rightBorder;
        
        leftBorder = solidBorder;
        rightBorder = solidBorder;
        
        if (isMainHeader) {
          topBorder = solidBorder;
          bottomBorder = solidBorder;
          cell.s.font = { bold: true, sz: 11 };
        } else if (isFirstData) {
          topBorder = solidBorder;
          bottomBorder = dottedBorder;
          cell.s.font = { sz: 11 };
        } else if (isMiddleData) {
          topBorder = dottedBorder;
          bottomBorder = dottedBorder;
          cell.s.font = { sz: 11 };
        } else if (isLastData) {
          topBorder = dottedBorder;
          bottomBorder = solidBorder;
          cell.s.font = { sz: 11 };
        } else if (isStatusSummaryText) {
          topBorder = undefined;
          bottomBorder = solidBorder;
          cell.s.font = { bold: true, sz: 11 };
        } else if (isSummaryHeader) {
          topBorder = solidBorder;
          bottomBorder = solidBorder;
          cell.s.font = { bold: true, sz: 11 };
        } else if (isFirstSummaryData) {
          topBorder = solidBorder;
          bottomBorder = dottedBorder;
          cell.s.font = { sz: 11 };
        } else if (isMiddleSummaryData) {
          topBorder = dottedBorder;
          bottomBorder = dottedBorder;
          cell.s.font = { sz: 11 };
        } else if (isLastSummaryData) {
          topBorder = dottedBorder;
          bottomBorder = dottedBorder;
          cell.s.font = { sz: 11 };
        } else if (isGrandTotal) {
          topBorder = dottedBorder;
          bottomBorder = solidBorder;
          cell.s.font = { bold: true, sz: 11 };
        }
        
        cell.s.border = {
          top: topBorder,
          bottom: bottomBorder,
          left: leftBorder,
          right: rightBorder
        };
      }
    }

    // Apply number format to Price/Unit (column F, index 5) and Amount (column G, index 6)
    for (let row = firstDataRow; row <= lastDataRow; row++) {
      const priceCell = ws[XLSX.utils.encode_cell({ r: row, c: 5 })];
      const amountCell = ws[XLSX.utils.encode_cell({ r: row, c: 6 })];
      
      if (priceCell) {
        if (!priceCell.s) priceCell.s = {};
        priceCell.z = '0.00';
      }
      
      if (amountCell) {
        if (!amountCell.s) amountCell.s = {};
        amountCell.z = '0.00';
      }
      }
      
      // Apply number format to Price/Unit (column F, index 5) and Amount (column G, index 6)
      for (let row = firstDataRow; row <= lastDataRow; row++) {
        const priceCell = ws[XLSX.utils.encode_cell({ r: row, c: 5 })];
        const amountCell = ws[XLSX.utils.encode_cell({ r: row, c: 6 })];
        
        if (priceCell) {
          if (!priceCell.s) priceCell.s = {};
          priceCell.t = 'n';
          priceCell.z = '0.00';
        }
        
        if (amountCell) {
          if (!amountCell.s) amountCell.s = {};
          amountCell.t = 'n';
          amountCell.z = '0.00';
        }
      }
      
      // Apply number format to summary table amount column (column C, index 2)
      for (let row = firstSummaryDataRow; row <= grandTotalRowNum; row++) {
        const summaryCountCell = ws[XLSX.utils.encode_cell({ r: row, c: 1 })];
        const summaryAmountCell = ws[XLSX.utils.encode_cell({ r: row, c: 2 })];
        
        if (summaryCountCell && summaryCountCell.v !== undefined) {
          if (!summaryCountCell.s) summaryCountCell.s = {};
          summaryCountCell.t = 'n';
        }
        
        if (summaryAmountCell && summaryAmountCell.v !== undefined) {
          if (!summaryAmountCell.s) summaryAmountCell.s = {};
          summaryAmountCell.t = 'n';
          summaryAmountCell.z = '0.00';
        }
      }

      const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscription Orders");
    XLSX.writeFile(wb, `subscription_orders_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

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
        start_date: new Date().toISOString().split('T')[0],
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
        return <Badge className="border-2 border-gray-400 text-gray-700">Cancelled</Badge>;
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
        <Button onClick={() => { setCreateDialogVendors(availableVendors); setCreateDialogOpen(true); }} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          New Subscription
        </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelled(!showCancelled)}
            >
              {showCancelled ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Hide Cancelled
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Cancelled ({subscriptions.filter(s => s.status === 'cancelled').length})
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Render active and paused subscriptions individually */}
            {subscriptions
              .filter(sub => sub.status !== 'cancelled')
              .map((subscription) => (
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
                        <CardTitle className="text-lg truncate">{subscription.vendor?.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{subscription.product?.name}</p>
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

            {/* Render cancelled subscriptions grouped by vendor+product */}
            {showCancelled && (() => {
              const cancelledSubs = subscriptions.filter(sub => sub.status === 'cancelled');
              const groupedCancelled = cancelledSubs.reduce((acc, sub) => {
                const key = `${sub.vendor_id}-${sub.product_id}`;
                if (!acc[key]) {
                  acc[key] = [];
                }
                acc[key].push(sub);
                return acc;
              }, {} as Record<string, typeof cancelledSubs>);

              return Object.entries(groupedCancelled).map(([key, subs]) => {
                const firstSub = subs[0];
                return (
                  <Card key={key} className="hover:shadow-lg transition-shadow border border-gray-300">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="aspect-square w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            {firstSub.product?.image_url ? (
                              <img src={firstSub.product.image_url} alt={firstSub.product?.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{firstSub.vendor?.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{firstSub.product?.name}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge('cancelled')}
                          {subs.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {subs.length} subscriptions
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{subs.length} cancelled subscription{subs.length > 1 ? 's' : ''}</p>
                          <p className="text-xs text-muted-foreground mt-1">Originally started: {format(new Date(firstSub.original_start_date || firstSub.start_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCancelledDialogSubs(subs);
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
                                vendorId: firstSub.vendor_id,
                                productId: firstSub.product_id
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
                );
              });
            })()}
        </div>
        </div>
      )}

      {/* Other Products Section */}
      {availableProducts.length > 0 && (
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
                    className="hover:shadow-lg transition-shadow"
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
                      
                      <div className="mt-3 space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleSubscribeFromProduct(product)}
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Subscribe
                        </Button>
                        
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
                  {(createDialogVendors && createDialogVendors.length > 0 ? createDialogVendors : availableVendors).map((vendor) => (
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
                disabled={!newSubscription.vendor_id && !newSubscription.product_id}
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
    </div>
  );
};

export default SubscriptionManagement;
