import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Home, Users, Package, ArrowLeft, ChevronRight } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useSocieties } from "@/hooks/useSocieties";
import { useAreas } from "@/hooks/useAreas";
import { startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";

type ViewLevel = "societies" | "wings" | "flats";

interface NavigationState {
  level: ViewLevel;
  societyId?: string;
  societyName?: string;
  wingNumber?: string;
}

const SocietyHierarchyView = () => {
  const { orders, loading } = useOrders();
  const { societies } = useSocieties();
  const { areas } = useAreas();
  const [navigation, setNavigation] = useState<NavigationState>({ level: "societies" });
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "year">("today");

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
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

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange();
    return orders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, timeRange]);

  // Group orders by society
  const societyData = useMemo(() => {
    const grouped = new Map();
    
    filteredOrders.forEach(order => {
      const societyId = order.customer?.society_id;
      const societyName = societies.find(s => s.id === societyId)?.name || "Unknown Society";
      
      if (!grouped.has(societyId)) {
        grouped.set(societyId, {
          id: societyId,
          name: societyName,
          totalOrders: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          wings: new Map()
        });
      }
      
      const society = grouped.get(societyId);
      society.totalOrders++;
      if (order.status === 'pending') society.pendingOrders++;
      if (order.status === 'delivered') society.deliveredOrders++;
      
      // Group by wing
      const wing = order.customer?.wing_number || "No Wing";
      if (!society.wings.has(wing)) {
        society.wings.set(wing, {
          number: wing,
          orders: [],
          totalOrders: 0,
          pendingOrders: 0
        });
      }
      
      const wingData = society.wings.get(wing);
      wingData.orders.push(order);
      wingData.totalOrders++;
      if (order.status === 'pending') wingData.pendingOrders++;
    });
    
    return Array.from(grouped.values());
  }, [filteredOrders, societies]);

  // Get wings for selected society
  const wingsData = useMemo(() => {
    if (navigation.level !== "wings" || !navigation.societyId) return [];
    
    const society = societyData.find(s => s.id === navigation.societyId);
    return society ? Array.from(society.wings.values()) : [];
  }, [navigation, societyData]);

  // Get flats for selected wing - only pending orders
  const flatsData = useMemo(() => {
    if (navigation.level !== "flats" || !navigation.societyId || !navigation.wingNumber) return [];
    
    const society = societyData.find(s => s.id === navigation.societyId);
    const wing = society?.wings.get(navigation.wingNumber);
    
    if (!wing) return [];
    
    const grouped = new Map();
    // Filter only pending orders
    wing.orders
      .filter(order => order.status === 'pending')
      .forEach(order => {
        const flatNumber = order.customer?.flat_plot_house_number || "Unknown";
        const customerName = order.customer?.name || "Unknown Customer";
        
        if (!grouped.has(flatNumber)) {
          grouped.set(flatNumber, {
            flatNumber,
            customerName,
            orders: []
          });
        }
        
        grouped.get(flatNumber).orders.push(order);
      });
    
    return Array.from(grouped.values());
  }, [navigation, societyData]);

  const handleBack = () => {
    if (navigation.level === "flats") {
      setNavigation({ level: "wings", societyId: navigation.societyId, societyName: navigation.societyName });
    } else if (navigation.level === "wings") {
      setNavigation({ level: "societies" });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Loading hierarchy...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {navigation.level !== "societies" && (
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {navigation.level === "societies" && "Societies"}
            {navigation.level === "wings" && `${navigation.societyName} - Wings`}
            {navigation.level === "flats" && `${navigation.societyName} - Wing ${navigation.wingNumber} - Flats`}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4" />
            <span>
              {navigation.level === "societies" && `${societyData.length} Societies`}
              {navigation.level === "wings" && `${wingsData.length} Wings`}
              {navigation.level === "flats" && `${flatsData.length} Flats`}
            </span>
          </div>
        </div>
      </div>

      {/* Societies View */}
      {navigation.level === "societies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {societyData.map((society) => (
            <Card 
              key={society.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setNavigation({ 
                level: "wings", 
                societyId: society.id, 
                societyName: society.name 
              })}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="text-lg">{society.name}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <Badge variant="outline">{society.totalOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <Badge className="bg-orange-100 text-orange-800">{society.pendingOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivered</span>
                    <Badge className="bg-green-100 text-green-800">{society.deliveredOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Wings</span>
                    <span className="text-sm font-bold text-blue-600">{society.wings.size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wings View */}
      {navigation.level === "wings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {wingsData.map((wing: any) => (
            <Card 
              key={wing.number} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setNavigation({ 
                ...navigation, 
                level: "flats", 
                wingNumber: wing.number 
              })}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-purple-600" />
                    <span>Wing {wing.number}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Orders</span>
                    <Badge variant="outline">{wing.totalOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <Badge className="bg-orange-100 text-orange-800">{wing.pendingOrders}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Flats View - Simple view for pending orders */}
      {navigation.level === "flats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flatsData.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">No pending orders for this wing</p>
              </CardContent>
            </Card>
          ) : (
            flatsData.map((flat) => (
              <Card key={flat.flatNumber} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    <span className="text-lg">Flat {flat.flatNumber}</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">{flat.customerName}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {flat.orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="flex items-center justify-between p-2 bg-orange-50 rounded border-l-4 border-orange-500"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{order.product.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.order_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">{order.quantity} {order.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SocietyHierarchyView;
