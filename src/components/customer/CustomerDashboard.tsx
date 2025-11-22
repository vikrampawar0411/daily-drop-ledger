import { useMemo, useState, useEffect } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ShoppingCart, Calendar as CalendarIcon, Package, Plus, Bell, TrendingUp, CheckCircle2, Clock, Download, FileDown, ChevronDown, ChevronUp, AlertTriangle, MoreVertical, Edit, Trash2, Eye, Pencil, Check, X, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VendorOrderTabs } from "./components/VendorOrderTabs";
import OrderCalendarView from "./components/OrderCalendarView";
import { useOrders } from "@/hooks/useOrders";
import { useOrders as useCustomerOrders } from "@/components/customer/hooks/useOrders";
import { useVendors } from "@/hooks/useVendors";
import { useVendorProducts } from "@/hooks/useVendorProducts";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx-js-style';
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { NotificationBanner } from "./NotificationBanner";

interface CustomerDashboardProps {
  onNavigate?: (tab: string, params?: any) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  navigationParams?: any;
}

const CustomerDashboard = ({ onNavigate, activeTab, setActiveTab, navigationParams }: CustomerDashboardProps) => {
  const { user } = useAuth();
  const { orders, loading: ordersLoading, updateOrderStatus, raiseDispute, clearDispute, deleteOrder, updateOrder, refetch } = useOrders();
  const { addOrder: addCalendarOrder, refetch: refetchCalendar } = useCustomerOrders();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [connectionCount, setConnectionCount] = useState(0);
  const [loadingWelcome, setLoadingWelcome] = useState(true);
  
  // Calendar state - Multiple dates support
  const [calendarSelectedDates, setCalendarSelectedDates] = useState<Date[] | undefined>(undefined);
  
  // Date range state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dateRangeType, setDateRangeType] = useState<'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [customStartOpen, setCustomStartOpen] = useState(false);
  const [customEndOpen, setCustomEndOpen] = useState(false);
  
  // Filter state
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Inline editing state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  
  // Cancel order state
  const [orderToCancel, setOrderToCancel] = useState<{ id: string; productName: string } | null>(null);

  // Set initial vendor after vendors load
  useEffect(() => {
    if (vendors.length > 0 && !selectedVendor) {
      const savedVendor = localStorage.getItem('lastSelectedVendor');
      const validVendor = savedVendor && vendors.find(v => v.id === savedVendor);
      setSelectedVendor(validVendor ? savedVendor : vendors[0].id);
    }
  }, [vendors, selectedVendor]);

  // Get available products from filtered orders
  const availableProducts = useMemo(() => {
    const filteredOrders = orders.filter(o => !selectedVendor || o.vendor.id === selectedVendor);
    const uniqueProducts = Array.from(
      new Map(filteredOrders.map(o => [o.product.id, o.product])).values()
    );
    return uniqueProducts;
  }, [orders, selectedVendor]);

  // Handle navigation params from other tabs (e.g., Place Order from VendorDirectory)
  useEffect(() => {
    if (navigationParams?.vendorId) {
      const vendorExists = vendors.find(v => v.id === navigationParams.vendorId);
      if (vendorExists) {
        setSelectedVendor(navigationParams.vendorId);
        localStorage.setItem('lastSelectedVendor', navigationParams.vendorId);
        
        // If productId is also provided, set it directly
        if (navigationParams?.productId) {
          setSelectedProduct(navigationParams.productId);
        }
        
        // Expand calendar, select today's date, and show the form
        setCalendarExpanded(true);
        setTableExpanded(true);
        const today = new Date();
        setCalendarSelectedDates([today]);
        
        // Pre-fill the order form
        setNewOrderFormData({
          vendor_id: navigationParams.vendorId,
          product_id: navigationParams.productId || '',
          quantity: 1,
          order_date: today,
        });
        
        // Scroll to calendar section
        setTimeout(() => {
          const calendarSection = document.querySelector('[data-calendar-section]');
          if (calendarSection) {
            calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
        
        // Clear params after processing
        setTimeout(() => {
          if (onNavigate) {
            onNavigate('dashboard', {});
          }
        }, 300);
      }
    }
  }, [navigationParams, vendors, onNavigate]);

  // Auto-select most used product when vendor changes (Issue 2 Fix)
  useEffect(() => {
    if (selectedVendor && availableProducts.length > 0) {
      const productFrequency = orders
        .filter(o => o.vendor.id === selectedVendor)
        .reduce((acc, order) => {
          acc[order.product.id] = (acc[order.product.id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const mostUsedProductId = Object.entries(productFrequency)
        .sort(([, a], [, b]) => b - a)[0]?.[0];
      
      if (mostUsedProductId) {
        setSelectedProduct(mostUsedProductId);
      } else {
        setSelectedProduct('all');
      }
    }
  }, [selectedVendor, orders, availableProducts]);

  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [tableExpanded, setTableExpanded] = useState(true);
  const [calendarExpanded, setCalendarExpanded] = useState(true);
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
    vendor_id: '',
  });
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const { vendorProducts, loading: vendorProductsLoading } = useVendorProducts(editFormData.vendor_id);
  const [bulkEditFormData, setBulkEditFormData] = useState({
    quantity: 0,
    order_date: '',
  });
  
  // Calendar order form state
  const [newOrderFormData, setNewOrderFormData] = useState({
    vendor_id: '',
    product_id: '',
    quantity: 1,
    order_date: new Date(),
  });


  // Auto-apply filters when vendor is selected in new order form
  useEffect(() => {
    if (newOrderFormData.vendor_id && newOrderFormData.vendor_id !== selectedVendor) {
      // Keep calendar selected dates visible when vendor changes
      
      // Update main vendor filter
      setSelectedVendor(newOrderFormData.vendor_id);
      
      // Find most ordered product from this vendor
      const productFrequency = orders
        .filter(o => o.vendor.id === newOrderFormData.vendor_id)
        .reduce((acc, order) => {
          acc[order.product.id] = (acc[order.product.id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const mostUsedProductId = Object.entries(productFrequency)
        .sort(([, a], [, b]) => b - a)[0]?.[0];
      
      if (mostUsedProductId) {
        // Update main product filter
        setSelectedProduct(mostUsedProductId);
        // Update new order form product
        setNewOrderFormData(prev => ({
          ...prev,
          product_id: mostUsedProductId
        }));
      }
    }
  }, [newOrderFormData.vendor_id, orders, selectedVendor]);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setOrderDetailsDialogOpen(true);
  };

  // Helper to check if all selected dates are in the past
  const areAllDatesPast = (dates: Date[] | undefined): boolean => {
    if (!dates || dates.length === 0) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    
    return dates.every(date => {
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate < today;
    });
  };

  // Helper to check if a date is in the past (before today)
  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "border-2 border-gray-400 text-gray-700";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
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
    const titleRowCount = 6;
    
    // Get unique statuses
    const statuses = [...new Set(monthlyStats.orders.map(o => o.status))];
    
    // Calculate date range for order period
    const [year, month] = selectedMonth.split('-');
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    const periodString = `${format(firstDay, 'd-MMM-yyyy')} to ${format(lastDay, 'd-MMM-yyyy')}`;
    
    // Title rows
    const titleRows = [
      ['MONTHLY ORDER REPORT'],
      [`Customer Name: ${customerName || 'N/A'}`],
      [`Order Period: ${periodString}`],
      [`Report Generated By: ${customerName || 'N/A'}`],
      [`Generated On: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`],
      []
    ];
    
    // Prepare order data rows
    const orderRows = monthlyStats.orders.map(order => [
      new Date(order.order_date).toLocaleDateString(),
      order.vendor.name,
      order.product.name,
      order.quantity,
      order.unit,
      Number(order.product.price),
      Number(order.total_amount),
      order.status
    ]);

    // Header row
    const headerRow = ['Date', 'Vendor', 'Product', 'Quantity', 'Unit', 'Price/Unit', 'Amount', 'Status'];
    
    // Calculate row indices (accounting for 6 title rows)
    const orderDataStartRow = titleRowCount + 2; // Row 8 in Excel (0-indexed as 7)
    const orderDataEndRow = titleRowCount + orderRows.length + 1; // Last data row
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
      { f: `SUM(B${summaryDataStartRow}:B${summaryDataEndRow})` },
      { f: `SUM(C${summaryDataStartRow}:C${summaryDataEndRow})` }
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
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders-${selectedMonth}-with-summary.xlsx`);
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
      // Determine the target status based on current selection
      const selectedOrders = monthlyStats.orders.filter(order => 
        selectedOrderIds.includes(order.id)
      );
      
      const allSelectedAreDelivered = selectedOrders.every(order => {
        const isVendorUpdated = order.updated_by_user_id && 
          order.customer?.user_id && 
          order.updated_by_user_id !== order.customer.user_id;
        return order.status === 'delivered' && !isVendorUpdated;
      });
      
      const newStatus = allSelectedAreDelivered ? 'pending' : 'delivered';
      
      // Update all selected orders
      const updatePromises = selectedOrderIds.map(orderId => 
        updateOrderStatus(orderId, newStatus, newStatus === 'delivered' ? new Date().toISOString() : undefined)
      );
      
      await Promise.all(updatePromises);
      
      setSelectedOrderIds([]);
      setBulkUpdateDialogOpen(false);
      
      toast({
        title: "Success",
        description: `${selectedOrderIds.length} order(s) marked as ${newStatus}`,
      });
      
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
      vendor_id: order.vendor.id,
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
      // Get the selected vendor product to get the correct price
      const selectedVendorProduct = vendorProducts.find(vp => vp.product_id === editFormData.product_id);
      const pricePerUnit = selectedVendorProduct?.price_override || selectedVendorProduct?.product?.price || editingOrder.price_per_unit;
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

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      const deletePromises = selectedOrderIds.map(orderId => deleteOrder(orderId));
      await Promise.all(deletePromises);
      
      setSelectedOrderIds([]);
      setBulkDeleteDialogOpen(false);
      await refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete orders",
        variant: "destructive",
      });
    }
  };

  const handleBulkModify = async () => {
    if (selectedOrderIds.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to modify",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatePromises = selectedOrderIds.map(orderId => {
        const order = monthlyStats.orders.find(o => o.id === orderId);
        if (!order) return Promise.resolve();
        
      const updates: any = {};
        if (bulkEditFormData.quantity > 0) {
          updates.quantity = bulkEditFormData.quantity;
          updates.total_amount = bulkEditFormData.quantity * Number(order.product.price);
        }
        if (bulkEditFormData.order_date) {
          updates.order_date = bulkEditFormData.order_date;
        }
        
        return updateOrder(orderId, updates);
      });
      
      await Promise.all(updatePromises);
      
      setSelectedOrderIds([]);
      setBulkEditDialogOpen(false);
      await refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to modify orders",
        variant: "destructive",
      });
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

  useEffect(() => {
    if (selectedVendor) {
      localStorage.setItem('lastSelectedVendor', selectedVendor);
    }
  }, [selectedVendor]);

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
    let startDate: Date, endDate: Date;
    
    // Determine date range based on type
    if (dateRangeType === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      // Default to current month if custom dates not set
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.order_date);
      
      // If filtering by calendar selected dates (multiple dates support)
      if (calendarSelectedDates && calendarSelectedDates.length > 0) {
        const selectedDateStrs = calendarSelectedDates.map(d => format(d, 'yyyy-MM-dd'));
        const matchesSelectedDates = selectedDateStrs.includes(o.order_date);
        const matchesVendor = !selectedVendor || o.vendor.id === selectedVendor;
        const matchesProduct = selectedProduct === 'all' || o.product.id === selectedProduct;
        return matchesSelectedDates && matchesVendor && matchesProduct && o.status !== 'cancelled';
      }
      
      // Otherwise, show full month range
      const matchesDate = orderDate >= startDate && orderDate <= endDate;
      const matchesVendor = !selectedVendor || o.vendor.id === selectedVendor;
      const matchesProduct = selectedProduct === 'all' || o.product.id === selectedProduct;
      return matchesDate && matchesVendor && matchesProduct && o.status !== 'cancelled';
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
    const deliveredNonDisputed = monthOrders.filter(o => o.status === 'delivered' && !o.dispute_raised).length;
    const deliveredDisputed = monthOrders.filter(o => o.status === 'delivered' && o.dispute_raised === true).length;
    const scheduledOrders = monthOrders.filter(o => o.status === 'pending').length;
    
    const deliveredNonDisputedSpend = monthOrders
      .filter(o => o.status === 'delivered' && !o.dispute_raised)
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    const deliveredDisputedAmount = monthOrders
      .filter(o => o.status === 'delivered' && o.dispute_raised === true)
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    const forecastedBill = monthOrders
      .filter(o => o.status === 'pending')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    return {
      totalOrders,
      deliveredOrders: deliveredNonDisputed,
      deliveredDisputedOrders: deliveredDisputed,
      scheduledOrders,
      deliveredSpend: Math.round(deliveredNonDisputedSpend),
      deliveredDisputedAmount: Math.round(deliveredDisputedAmount),
      forecastedBill: Math.round(forecastedBill),
      orders: sortedOrders
    };
  }, [orders, selectedMonth, selectedVendor, selectedProduct, dateRangeType, customStartDate, customEndDate, sortColumn, sortDirection, calendarSelectedDates]);

  // Unfiltered orders for calendar display - shows all orders in the month for selected vendor
  const calendarOrders = useMemo(() => {
    let startDate: Date, endDate: Date;
    
    if (dateRangeType === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    return orders.filter(o => {
      const orderDate = new Date(o.order_date);
      const matchesDateRange = orderDate >= startDate && orderDate <= endDate;
      const matchesVendor = !selectedVendor || o.vendor.id === selectedVendor;
      const notCancelled = o.status !== 'cancelled';
      
      return matchesDateRange && matchesVendor && notCancelled;
    });
  }, [orders, selectedMonth, dateRangeType, customStartDate, customEndDate, selectedVendor]);

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
    <TooltipProvider>
      <div className="space-y-6">
      {/* Notification Banner */}
      <NotificationBanner />
      
      {/* OOBE Card for New Users */}
      {setActiveTab && (
        <OnboardingCard
          userType="customer"
          hasData={orders.length > 0}
          onDismiss={() => {}}
          onAddAction={() => setActiveTab("vendors")}
        />
      )}

      {/* Cancel Order Handler */}
      {(() => {
        const handleCancelOrder = async () => {
          if (!orderToCancel) return;
          
          try {
            await deleteOrder(orderToCancel.id);
            toast({
              title: "Order Cancelled",
              description: `Your order for ${orderToCancel.productName} has been successfully cancelled.`,
            });
            setOrderToCancel(null);
            refetch();
          } catch (error) {
            console.error('Error canceling order:', error);
            toast({
              title: "Error",
              description: "Failed to cancel the order. Please try again.",
              variant: "destructive",
            });
          }
        };
        
        // Store handler in component scope
        (window as any).__handleCancelOrder = handleCancelOrder;
        return null;
      })()}

      {/* Next Due Orders Card (Issue 1 Fix) */}
      <Card className="bg-white border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Upcoming Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Get first upcoming order per connected vendor
            const nextOrdersByVendor = vendors.map(vendor => {
              const vendorOrders = orders
                .filter(o => {
                  const orderDate = new Date(o.order_date);
                  orderDate.setHours(0, 0, 0, 0);
                  return o.vendor.id === vendor.id && 
                         orderDate >= today && 
                         o.status === 'pending';
                })
                .sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
              
              return vendorOrders[0];
            }).filter(Boolean);
            
            const sortedNextOrders = nextOrdersByVendor.sort((a, b) => 
              new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
            );

            if (sortedNextOrders.length === 0) {
              return <p className="text-gray-500">No upcoming orders. Place a new order to get started!</p>;
            }

            return sortedNextOrders.map(order => (
              <div key={order.id} className="bg-gray-50 rounded-lg p-3 border space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-gray-900">{order.product.name}</p>
                    <p className="text-sm text-gray-500">
                      {order.vendor.name} • {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{order.quantity} {order.unit}</p>
                    <p className="text-sm text-gray-600">₹{order.total_amount}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setOrderToCancel({ id: order.id, productName: order.product.name })}
                    className="text-xs"
                  >
                    Cancel Order
                  </Button>
                </div>
              </div>
            ));
          })()}
          <div className="flex items-center space-x-4 text-gray-600 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{connectionCount} Connected Vendors</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your order for <strong>{orderToCancel?.productName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!orderToCancel) return;
                
                try {
                  await deleteOrder(orderToCancel.id);
                  toast({
                    title: "Order Cancelled",
                    description: `Your order for ${orderToCancel.productName} has been successfully cancelled.`,
                  });
                  setOrderToCancel(null);
                  refetch();
                } catch (error) {
                  console.error('Error canceling order:', error);
                  toast({
                    title: "Error",
                    description: "Failed to cancel the order. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                const today = new Date();
                setCalendarExpanded(true);
                setCalendarSelectedDates([today]);
                setTableExpanded(true);
                
                // Pre-fill form with current filter selections
                setNewOrderFormData({
                  vendor_id: selectedVendor || '',
                  product_id: selectedProduct !== 'all' ? selectedProduct : '',
                  quantity: 1,
                  order_date: today,
                });
                
                // Scroll to calendar after state updates
                setTimeout(() => {
                  const calendarElement = document.querySelector('[data-calendar-section]');
                  if (calendarElement) {
                    calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
            >
              <Plus className="h-6 w-6" />
              <span>Place New Order</span>
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

      {/* Order Statistics */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Order Statistics</CardTitle>
            </div>
        
        {/* Filters Section - New Order */}
        <div className="space-y-4">
          {/* 1. Vendor Filter - Horizontal Radio Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filter by Vendor</Label>
            <RadioGroup 
              value={selectedVendor} 
              onValueChange={setSelectedVendor} 
              className="flex flex-wrap gap-2"
            >
              {vendors.map((vendor) => (
                <div 
                  key={vendor.id} 
                  className="flex items-center space-x-2 px-3 py-2 rounded-md border border-input hover:bg-accent cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={vendor.id} id={`vendor-${vendor.id}`} />
                  <Label 
                    htmlFor={`vendor-${vendor.id}`} 
                    className="cursor-pointer font-normal text-sm whitespace-nowrap"
                  >
                    {vendor.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 2. Product Filter - Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filter by Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Date Range Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex gap-2">
              <Button
                variant={dateRangeType === 'month' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-10"
                onClick={() => {
                  setDateRangeType('month');
                  setCustomStartDate(undefined);
                  setCustomEndDate(undefined);
                }}
              >
                By Month
              </Button>
              <Button
                variant={dateRangeType === 'custom' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-10"
                onClick={() => setDateRangeType('custom')}
              >
                Custom Range
              </Button>
            </div>
          </div>

          {/* 4. Month Selector (Conditional) */}
          {dateRangeType === 'month' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Month</Label>
              <Select 
                value={selectedMonth} 
                onValueChange={(value) => {
                  setSelectedMonth(value);
                  setCalendarSelectedDates(undefined);
                  setSelectedVendor('');
                  setSelectedProduct('all');
                }}
              >
                <SelectTrigger className="w-full h-10">
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
          )}

          {/* 5. Custom Range Selector (Conditional) */}
          {dateRangeType === 'custom' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom Date Range</Label>
              <div className="flex flex-col gap-2">
                <Popover open={customStartOpen} onOpenChange={setCustomStartOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-10 justify-start text-sm font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        setCustomStartOpen(false);
                      }}
                      disabled={(date) => date > new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={customEndOpen} onOpenChange={setCustomEndOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-10 justify-start text-sm font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        if (date && customStartDate) {
                          const diffTime = Math.abs(date.getTime() - customStartDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          if (diffDays > 90) {
                            toast({
                              title: "Invalid Range",
                              description: "Date range cannot exceed 3 months (90 days)",
                              variant: "destructive",
                            });
                            return;
                          }
                        }
                        setCustomEndDate(date);
                        setCustomEndOpen(false);
                      }}
                      disabled={(date) => {
                        if (!customStartDate) return date > new Date();
                        const diffTime = Math.abs(date.getTime() - customStartDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return date < customStartDate || diffDays > 90 || date > new Date();
                      }}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics Cards - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card 
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('orders')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{monthlyStats.totalOrders}</div>
                <p className="text-xs text-blue-600 mt-1">
                  ₹{(monthlyStats.deliveredSpend + monthlyStats.deliveredDisputedAmount + monthlyStats.forecastedBill).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('orders')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900">Delivered Orders</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{monthlyStats.deliveredOrders}</div>
                <p className="text-xs text-green-600 mt-1">₹{monthlyStats.deliveredSpend}</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('orders')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-900">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">{monthlyStats.scheduledOrders}</div>
                <p className="text-xs text-amber-600 mt-1">₹{monthlyStats.forecastedBill}</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.('orders')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Disputed Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{monthlyStats.deliveredDisputedOrders}</div>
                <p className="text-xs text-red-600 mt-1">₹{monthlyStats.deliveredDisputedAmount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Calendar View - Collapsed by default */}
          <Collapsible open={calendarExpanded} onOpenChange={setCalendarExpanded} className="mb-6">
            <div className="space-y-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline">
                  {calendarExpanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                  {calendarExpanded ? 'Hide' : 'Show'} Calendar View
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div data-calendar-section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Calendar - Left Side */}
                  <OrderCalendarView
                    selectedDates={calendarSelectedDates}
                    onSelectDates={setCalendarSelectedDates}
                    hasOrdersOnDate={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      return calendarOrders.some(o => o.order_date === dateStr);
                    }}
                    getOrdersForDate={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      return calendarOrders.filter(o => o.order_date === dateStr);
                    }}
                    month={new Date(selectedMonth + '-01')}
                    onMonthChange={(newMonth) => {
                      const monthStr = format(newMonth, 'yyyy-MM');
                      setSelectedMonth(monthStr);
                      setCalendarSelectedDates(undefined); // This triggers the useEffect to auto-clear filters
                    }}
                    onDateClick={(dates) => {
                      if (dates.length > 0) {
                        // Dates are selected
                        const lastDate = dates[dates.length - 1];
                        const dateMonth = format(lastDate, 'yyyy-MM');
                        if (dateMonth !== selectedMonth) {
                          setSelectedMonth(dateMonth);
                        }
                        
                        setTableExpanded(true);
                        
                        // Ensure we always have a vendor selected
                        let vendorId = selectedVendor;
                        if (!vendorId && vendors.length > 0) {
                          vendorId = vendors[0].id;
                          setSelectedVendor(vendorId);
                        }
                        
                        // Ensure we always have a product selected
                        let productId = selectedProduct !== 'all' ? selectedProduct : '';
                        if (!productId && availableProducts.length > 0) {
                          productId = availableProducts[0].id;
                          setSelectedProduct(productId);
                        }
                        
                        // Pre-fill the form with guaranteed values
                        setNewOrderFormData({
                          vendor_id: vendorId,
                          product_id: productId,
                          quantity: 1,
                          order_date: lastDate,
                        });
                      } else {
                        // Dates are cleared - only reset form, keep filters intact
                        setNewOrderFormData({
                          vendor_id: selectedVendor || '',
                          product_id: selectedProduct !== 'all' ? selectedProduct : '',
                          quantity: 1,
                          order_date: new Date(),
                        });
                      }
                    }}
                  />

                  {/* Order Form - Right Side */}
                  {calendarSelectedDates && calendarSelectedDates.length > 0 && (
                    <>
                      {areAllDatesPast(calendarSelectedDates) ? (
                        /* VIEW-ONLY MODE FOR PAST DATES */
                        <Card>
                          <CardHeader>
                            <CardTitle>View Orders</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {calendarSelectedDates.length === 1 
                                ? `For ${format(calendarSelectedDates[0], 'MMMM d, yyyy')}`
                                : `For ${calendarSelectedDates.length} selected dates`
                              }
                            </p>
                            {calendarSelectedDates.length > 1 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {calendarSelectedDates
                                  .sort((a, b) => a.getTime() - b.getTime())
                                  .map(d => format(d, 'MMM d'))
                                  .join(', ')}
                              </p>
                            )}
                            <p className="text-xs text-amber-600 mt-2 flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Past dates - viewing existing orders only
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {(() => {
                              if (!calendarSelectedDates || calendarSelectedDates.length === 0) return null;
                              
                              const allExistingOrders = calendarSelectedDates.flatMap(date => {
                                const dateStr = format(date, 'yyyy-MM-dd');
                                return monthlyStats.orders
                                  .filter(o => o.order_date === dateStr)
                                  .map(o => ({ ...o, displayDate: dateStr }));
                              });
                              
                              if (allExistingOrders.length === 0) {
                                return (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No orders found for selected date{calendarSelectedDates.length > 1 ? 's' : ''}</p>
                                  </div>
                                );
                              }

                              // Group orders by date
                              const ordersByDate = allExistingOrders.reduce((acc, order) => {
                                if (!acc[order.displayDate]) {
                                  acc[order.displayDate] = [];
                                }
                                acc[order.displayDate].push(order);
                                return acc;
                              }, {} as Record<string, typeof allExistingOrders>);
                              
                              return (
                                <div className="space-y-4">
                                  {Object.entries(ordersByDate)
                                    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                                    .map(([dateStr, orders]) => (
                                      <div key={dateStr}>
                                        <p className="text-sm font-semibold mb-2">
                                          {format(new Date(dateStr), 'MMMM d, yyyy')}
                                        </p>
                                        <div className="space-y-2">
                                          {orders.map(order => (
                                            <div key={order.id} className="bg-muted p-3 rounded-lg">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <p className="font-medium">{order.product.name}</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    {order.vendor.name}
                                                  </p>
                                                  <p className="text-sm">
                                                    Quantity: {order.quantity} {order.unit}
                                                  </p>
                                                </div>
                                                <div className="text-right">
                                                  <Badge variant={
                                                    order.status === 'delivered' ? 'default' :
                                                    order.status === 'pending' ? 'secondary' :
                                                    order.status === 'cancelled' ? 'destructive' : 'outline'
                                                  }>
                                                    {order.status}
                                                  </Badge>
                                                  <p className="text-sm font-medium mt-1">
                                                    ₹{order.total_amount || 0}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      ) : (
                        /* PLACE NEW ORDER MODE FOR CURRENT/FUTURE DATES */
                        <Card>
                          <CardHeader>
                            <CardTitle>Place New Order</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {calendarSelectedDates.length === 1 
                                ? `For ${format(calendarSelectedDates[0], 'MMMM d, yyyy')}`
                                : `For ${calendarSelectedDates.length} selected dates`
                              }
                            </p>
                            {calendarSelectedDates.length > 1 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {calendarSelectedDates
                                  .sort((a, b) => a.getTime() - b.getTime())
                                  .map(d => format(d, 'MMM d'))
                                  .join(', ')}
                              </p>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            
                            {/* Vendor Dropdown - Always visible with pre-selected value */}
                            <div className="space-y-2">
                              <Label>Select Vendor</Label>
                              <Select
                                value={newOrderFormData.vendor_id || selectedVendor}
                                onValueChange={(value) => {
                                  setNewOrderFormData({ 
                                    vendor_id: value,
                                    product_id: '', // Reset product when vendor changes
                                    quantity: 1,
                                    order_date: calendarSelectedDates && calendarSelectedDates.length > 0 
                                      ? calendarSelectedDates[0] 
                                      : new Date()
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose vendor" />
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

                            {/* Product Dropdown - Show after vendor is selected */}
                            {(newOrderFormData.vendor_id || selectedVendor) && (
                              <div className="space-y-2">
                                <Label>Select Product</Label>
                                <Select
                                  value={newOrderFormData.product_id || (selectedProduct !== 'all' ? selectedProduct : '')}
                                  onValueChange={(value) => 
                                    setNewOrderFormData({ 
                                      ...newOrderFormData, 
                                      product_id: value 
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableProducts
                                      .filter(p => {
                                        const vendorId = newOrderFormData.vendor_id || selectedVendor;
                                        return orders.some(o => o.vendor.id === vendorId && o.product.id === p.id);
                                      })
                                      .map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Quantity Input - Show after product is selected */}
                            {(newOrderFormData.product_id || (selectedProduct !== 'all')) && (
                              <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={newOrderFormData.quantity}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    setNewOrderFormData({ 
                                      ...newOrderFormData, 
                                      quantity: value
                                    })
                                  }}
                                  placeholder="Enter quantity"
                                  autoFocus
                                />
                              </div>
                            )}

                            {/* Place Order Button */}
                            <Button
                              className="w-full"
                              disabled={
                                !newOrderFormData.quantity || 
                                newOrderFormData.quantity < 1 ||
                                !(newOrderFormData.vendor_id || selectedVendor) ||
                                !(newOrderFormData.product_id || (selectedProduct !== 'all'))
                              }
                              onClick={async () => {
                                try {
                                  const finalVendorId = newOrderFormData.vendor_id || selectedVendor;
                                  const finalProductId = newOrderFormData.product_id || selectedProduct;
                                  
                                  const vendor = vendors.find(v => v.id === finalVendorId);
                                  const product = orders.find(o => o.product.id === finalProductId)?.product 
                                               || availableProducts.find(p => p.id === finalProductId);
                                  
                                  if (!vendor || !product || !calendarSelectedDates || calendarSelectedDates.length === 0) {
                                    toast({
                                      title: "Error",
                                      description: "Invalid vendor, product, or dates selected",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  // Separate past dates from valid dates
                                  const pastDates = calendarSelectedDates.filter(date => isDateInPast(date));
                                  const validDates = calendarSelectedDates.filter(date => !isDateInPast(date));

                                  // If all dates are in the past, show error
                                  if (validDates.length === 0) {
                                    toast({
                                      title: "Cannot Place Orders",
                                      description: "Orders cannot be placed for past dates. Please select today or future dates.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  // If some dates are in the past, show warning
                                  if (pastDates.length > 0) {
                                    toast({
                                      title: "Past Dates Skipped",
                                      description: `Skipped ${pastDates.length} past date(s). Orders will be placed only for ${validDates.length} valid date(s).`,
                                      variant: "default",
                                    });
                                  }

                                  // Place orders only for valid dates (today or future)
                                  const orderPromises = validDates.map(date => 
                                    addCalendarOrder(date, {
                                      vendor: vendor.name,
                                      product: product.name,
                                      quantity: newOrderFormData.quantity,
                                      unit: '',
                                      status: 'pending',
                                    })
                                  );

                                  await Promise.all(orderPromises);
                                  
                                  await refetch();
                                  await refetchCalendar();
                                  
                                  toast({
                                    title: "Order(s) Placed",
                                    description: validDates.length === 1
                                      ? `Order for ${format(validDates[0], 'MMM d, yyyy')} created successfully`
                                      : `${validDates.length} orders created successfully`,
                                  });
                                  
                                  // Reset form - keep vendor/product from filters
                                  setCalendarSelectedDates(undefined);
                                  setNewOrderFormData({
                                    vendor_id: selectedVendor || '',
                                    product_id: selectedProduct !== 'all' ? selectedProduct : '',
                                    quantity: 1,
                                    order_date: new Date(),
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to place order(s)",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Place Order{calendarSelectedDates && calendarSelectedDates.length > 1 ? 's' : ''}
                            </Button>

                            {/* Show existing orders for selected dates */}
                            {(() => {
                              if (!calendarSelectedDates || calendarSelectedDates.length === 0) return null;
                              
                              const allExistingOrders = calendarSelectedDates.flatMap(date => {
                                const dateStr = format(date, 'yyyy-MM-dd');
                                return monthlyStats.orders
                                  .filter(o => o.order_date === dateStr)
                                  .map(o => ({ ...o, displayDate: dateStr }));
                              });
                              
                              if (allExistingOrders.length === 0) return null;

                              const existingOrders = allExistingOrders;
                              
                              if (existingOrders.length > 0) {
                                return (
                                  <div className="pt-4 border-t">
                                    <p className="text-sm font-medium mb-2">Existing Orders:</p>
                                    <div className="space-y-2">
                                      {existingOrders.map(order => (
                                        <div key={order.id} className="text-xs bg-muted p-2 rounded">
                                          <p className="font-medium">{order.product.name}</p>
                                          <p className="text-muted-foreground">
                                            {order.vendor.name} • {order.quantity} {order.unit}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Orders Table for Selected Period */}
          <Collapsible open={tableExpanded} onOpenChange={setTableExpanded}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    {tableExpanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                    {tableExpanded ? 'Hide' : 'Show'} Detailed Orders
                    {!tableExpanded && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {calendarSelectedDates && calendarSelectedDates.length > 0 ? (
                          calendarSelectedDates.length === 1 
                            ? `(${format(calendarSelectedDates[0], 'MMM d, yyyy')})`
                            : `(${calendarSelectedDates.length} dates selected)`
                        ) : dateRangeType === 'custom' && customStartDate && customEndDate ? (
                          `(${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d, yyyy')})`
                        ) : (
                          `(${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')})`
                        )}
                      </span>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <div className="flex gap-2 items-center flex-wrap">
                  {calendarSelectedDates && calendarSelectedDates.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {calendarSelectedDates.length === 1 
                          ? `Filtered: ${format(calendarSelectedDates[0], 'MMM d, yyyy')}`
                          : `${calendarSelectedDates.length} dates selected`}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCalendarSelectedDates(undefined);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Date Filter
                      </Button>
                    </div>
                  )}
                
                  {selectedOrderIds.length > 0 && (() => {
                    // Calculate selected orders information for bulk actions
                    const selectedOrders = monthlyStats.orders.filter(order => 
                      selectedOrderIds.includes(order.id)
                    );

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const hasAnyPastDateSelected = selectedOrders.some(order => {
                      const orderDate = new Date(order.order_date);
                      orderDate.setHours(0, 0, 0, 0);
                      return orderDate < today;
                    });

                    const allSelectedAreDelivered = selectedOrders.length > 0 && selectedOrders.every(order => {
                      const isVendorUpdated = order.updated_by_user_id && 
                        order.customer?.user_id && 
                        order.updated_by_user_id !== order.customer.user_id;
                      return order.status === 'delivered' && !isVendorUpdated;
                    });

                    const statusButtonText = allSelectedAreDelivered 
                      ? `Mark ${selectedOrderIds.length} as Pending` 
                      : `Mark ${selectedOrderIds.length} as Delivered`;

                    const StatusIcon = allSelectedAreDelivered ? Clock : CheckCircle;
                    const statusButtonClass = allSelectedAreDelivered 
                      ? "bg-amber-600 hover:bg-amber-700" 
                      : "bg-green-600 hover:bg-green-700";

                    return (
                      <>
                        <Button onClick={() => setBulkUpdateDialogOpen(true)} className={statusButtonClass} size="sm">
                          <StatusIcon className="h-4 w-4 mr-2" />
                          {statusButtonText}
                        </Button>
                        {selectedOrderIds.length === 1 && (
                          <Button onClick={() => setBulkEditDialogOpen(true)} variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Modify
                          </Button>
                        )}
                        {!hasAnyPastDateSelected && (
                          <Button onClick={() => setBulkDeleteDialogOpen(true)} variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete {selectedOrderIds.length}
                          </Button>
                        )}
                      </>
                    );
                  })()}
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
                              <TableCell colSpan={8}>
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
                              orderDate.setHours(0, 0, 0, 0);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const isPastDate = orderDate < today;
                              const isSunday = orderDate.getDay() === 0;
                              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                              const dayName = days[orderDate.getDay()];
                              const isVendorUpdated = order.updated_by_user_id && order.customer?.user_id && order.updated_by_user_id !== order.customer.user_id;
                              const canModify = !isPastDate || (isPastDate && !isVendorUpdated);
                              
                              return (
                                <TableRow 
                                  key={order.id} 
                                  className="group cursor-pointer hover:bg-muted/50"
                                >
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                      checked={selectedOrderIds.includes(order.id)}
                                      onCheckedChange={() => toggleOrderSelection(order.id)}
                                      disabled={isVendorUpdated}
                                    />
                                  </TableCell>
                                  <TableCell 
                                    className={`font-semibold ${isSunday ? 'text-blue-600' : ''}`}
                                    onClick={() => handleOrderClick(order)}
                                  >
                                    {dayName}
                                  </TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)}>{orderDate.toLocaleDateString()}</TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)}>
                                    {order.product.name}
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    {editingOrderId === order.id ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min="1"
                                          step="1"
                                          value={editQuantity}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value) || 1;
                                            if (value >= 1 || e.target.value === '') {
                                              setEditQuantity(value);
                                            }
                                          }}
                                          className="w-20 h-8"
                                          autoFocus
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={async () => {
                                            if (editQuantity >= 1) {
                                              const product = vendorProducts.find(vp => vp.product_id === order.product.id);
                                              const pricePerUnit = product?.price_override || order.product.price;
                                              await updateOrder(order.id, {
                                                quantity: editQuantity,
                                                total_amount: editQuantity * pricePerUnit
                                              });
                                              setEditingOrderId(null);
                                            } else {
                                              toast({
                                                title: "Invalid Quantity",
                                                description: "Quantity must be at least 1",
                                                variant: "destructive",
                                              });
                                            }
                                          }}
                                        >
                                          <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => setEditingOrderId(null)}
                                        >
                                          <X className="h-4 w-4 text-gray-600" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 group">
                                        <span onClick={() => handleOrderClick(order)} className="cursor-pointer">
                                          {order.quantity} {order.unit}
                                        </span>
                                        {canModify && !(isPastDate && order.status === 'delivered') && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                              setEditingOrderId(order.id);
                                              setEditQuantity(order.quantity);
                                            }}
                                          >
                                            <Pencil className="h-4 w-4 text-gray-600" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)} className="font-semibold">
                                    ₹{order.total_amount}
                                  </TableCell>
                                  <TableCell onClick={() => handleOrderClick(order)}>
                                    <div className="text-sm">
                                      {order.status === 'delivered' ? (
                                        order.dispute_raised ? 'Delivered (Disputed)' : 'Delivered'
                                      ) : (
                                        'Pending'
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                      {/* Toggle Status Button - Hide for vendor-delivered orders */}
                                      {!(isVendorUpdated && order.status === 'delivered') && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant={order.status === 'delivered' ? 'ghost' : 'default'}
                                                className={`h-8 w-8 p-0 ${
                                                  order.status === 'delivered' 
                                                    ? 'bg-green-100 hover:bg-green-200' 
                                                    : 'bg-amber-100 hover:bg-amber-200'
                                                }`}
                                                onClick={() => handleStatusToggle(order)}
                                                disabled={isVendorUpdated || (isPastDate && !canModify)}
                                              >
                                                {order.status === 'delivered' ? (
                                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                  <XCircle className="h-4 w-4 text-amber-600" />
                                                )}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{isVendorUpdated ? 'Status updated by vendor' : 'Toggle status'}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}

                                      {/* 3-Dot Menu for Vendor-Delivered Orders */}
                                      {isVendorUpdated && order.status === 'delivered' && !order.dispute_raised && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="bg-background z-50">
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                setDisputeOrderId(order.id);
                                                setDisputeReason("");
                                                setDisputeDialogOpen(true);
                                              }}
                                            >
                                              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                                              Raise Dispute
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}

                                      {/* Delete Button */}
                                      {canModify && !(isPastDate && order.status === 'delivered') && (
                                        <Button
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => {
                                            setDeleteOrderId(order.id);
                                            setDeleteDialogOpen(true);
                                          }}
                                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                          title="Delete Order"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}

                                      {order.dispute_raised && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={async () => {
                                                await clearDispute(order.id, order.status);
                                                refetch();
                                              }}
                                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Clear dispute</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        ))
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
                
                {/* Summary at bottom - Hide when filtering by selected dates */}
                {(!calendarSelectedDates || calendarSelectedDates.length === 0) && (
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
                            <TableCell className="text-orange-700 font-medium flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Delivered (Disputed)
                            </TableCell>
                            <TableCell className="text-right">{monthlyStats.deliveredDisputedOrders}</TableCell>
                            <TableCell className="text-right">{monthlyStats.deliveredDisputedAmount}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-blue-700 font-medium">Pending</TableCell>
                            <TableCell className="text-right">{monthlyStats.scheduledOrders}</TableCell>
                            <TableCell className="text-right">{monthlyStats.forecastedBill}</TableCell>
                          </TableRow>
                          <TableRow className="font-bold bg-gray-50">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">{monthlyStats.totalOrders}</TableCell>
                            <TableCell className="text-right">
                              ₹{(monthlyStats.deliveredSpend + monthlyStats.deliveredDisputedAmount + monthlyStats.forecastedBill).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
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

              {selectedOrder.updated_by_user_id && selectedOrder.updated_by && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <Label className="text-sm text-blue-800">Status Last Updated By:</Label>
                  <div className="text-blue-600">
                    {selectedOrder.updated_by.name || 'Unknown'} ({selectedOrder.updated_by.user_type})
                  </div>
                  {selectedOrder.delivered_at && (
                    <div className="text-xs text-blue-500 mt-1">
                      at {format(new Date(selectedOrder.delivered_at), "PPp")}
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.dispute_raised && (
                <div className="border-2 border-orange-500 rounded-lg p-3 space-y-3">
                  <Label className="text-sm text-orange-800">Dispute Raised:</Label>
                  <div className="text-orange-700">{selectedOrder.dispute_reason}</div>
                  
                  {user && selectedOrder.customer?.user_id === user.id && (
                    <div className="flex space-x-2 pt-2 border-t border-orange-200">
                      <Button 
                        size="sm" 
                        onClick={async () => {
                          await clearDispute(selectedOrder.id, 'delivered');
                          setOrderDetailsDialogOpen(false);
                          toast({
                            title: "Success",
                            description: "Dispute resolved and marked as delivered",
                          });
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve as Delivered
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={async () => {
                          await clearDispute(selectedOrder.id, 'pending');
                          setOrderDetailsDialogOpen(false);
                          toast({
                            title: "Success",
                            description: "Dispute resolved and marked as pending",
                          });
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Resolve as Pending
                      </Button>
                    </div>
                  )}
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
              Select the reason for disputing this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dispute-reason">Dispute Reason</Label>
              <Select
                value={disputeReason}
                onValueChange={setDisputeReason}
              >
                <SelectTrigger id="dispute-reason">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="Product not delivered">Product not delivered</SelectItem>
                  <SelectItem value="Wrong product delivered">Wrong product delivered</SelectItem>
                  <SelectItem value="Damaged product">Damaged product</SelectItem>
                  <SelectItem value="Quantity mismatch">Quantity mismatch</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                    description: "Please select a reason for the dispute",
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
            <AlertDialogAction onClick={handleDeleteOrder} className="border-2 border-red-600 text-red-600 hover:border-red-700 hover:bg-red-50">
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
          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select
                value={editFormData.product_id}
                onValueChange={(value) => setEditFormData({...editFormData, product_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {vendorProductsLoading ? (
                    <SelectItem value="loading" disabled>Loading products...</SelectItem>
                  ) : (
                    vendorProducts
                      .filter(vp => vp.is_active && vp.product)
                      .map((vp) => (
                        <SelectItem key={vp.product_id} value={vp.product_id}>
                          {vp.product?.name} - ₹{vp.price_override || vp.product?.price}/{vp.product?.unit}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
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
                min="1"
                step="1"
                value={editFormData.quantity}
                onChange={(e) => setEditFormData({...editFormData, quantity: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
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

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedOrderIds.length} order(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="border-2 border-red-600 text-red-600 hover:border-red-700 hover:bg-red-50"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Modify Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Multiple Orders</DialogTitle>
            <DialogDescription>
              Update quantity and/or date for {selectedOrderIds.length} selected order(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Quantity (leave 0 to keep unchanged)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={bulkEditFormData.quantity}
                onChange={(e) => setBulkEditFormData({
                  ...bulkEditFormData, 
                  quantity: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div>
              <Label>New Order Date (leave empty to keep unchanged)</Label>
              <Input
                type="date"
                value={bulkEditFormData.order_date}
                onChange={(e) => setBulkEditFormData({
                  ...bulkEditFormData, 
                  order_date: e.target.value
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkModify}>
              Update {selectedOrderIds.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default CustomerDashboard;
