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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx-js-style';

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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-6">
        {loadingWelcome ? (
          <Skeleton className="h-16 w-full bg-white/20" />
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-2xl font-bold">Welcome back, {vendorName}!</h2>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex items-center space-x-4 text-blue-100">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{connectionCount} Connected Customers</span>
              </div>
              <span className="px-2 py-1 bg-white/20 rounded text-sm">Vendor</span>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default VendorDashboard;
