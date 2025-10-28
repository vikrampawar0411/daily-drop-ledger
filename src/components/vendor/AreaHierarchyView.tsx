import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Users, Package } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";

interface AreaHierarchyViewProps {
  initialTimeRange?: "today" | "week" | "month" | "year";
}

const AreaHierarchyView = ({ initialTimeRange }: AreaHierarchyViewProps = {}) => {
  const { orders, loading } = useOrders();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedSociety, setSelectedSociety] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "year">(initialTimeRange || "today");

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
      return orderDate >= start && orderDate <= end && order.status === 'pending';
    });
  }, [orders, timeRange]);

  // Get unique areas with order counts
  const areasData = useMemo(() => {
    const areaMap = new Map();
    
    filteredOrders.forEach(order => {
        const area = order.customer?.address || 'Unknown Area';
        const society = order.customer?.society_id || 'Unknown Society';
        
        if (!areaMap.has(area)) {
          areaMap.set(area, {
            name: area,
            societies: new Set(),
            orderCount: 0
          });
        }
        
        const areaData = areaMap.get(area);
        areaData.societies.add(society);
        areaData.orderCount += 1;
      });
    
    return Array.from(areaMap.values()).map(area => ({
      name: area.name,
      societyCount: area.societies.size,
      orderCount: area.orderCount
    })).sort((a, b) => b.orderCount - a.orderCount);
  }, [filteredOrders]);

  // Get societies for selected area
  const societiesData = useMemo(() => {
    if (!selectedArea) return [];
    
    const societyMap = new Map();
    
    filteredOrders
      .filter(order => order.customer?.address === selectedArea)
      .forEach(order => {
        const societyId = order.customer?.society_id || 'unknown';
        const societyName = order.customer?.wing_number 
          ? `${order.customer.wing_number}` 
          : 'Unknown Society';
        
        if (!societyMap.has(societyId)) {
          societyMap.set(societyId, {
            id: societyId,
            name: societyName,
            orderCount: 0,
            flats: new Set()
          });
        }
        
        const society = societyMap.get(societyId);
        society.orderCount += 1;
        const flatNumber = (order.customer as any)?.flat_plot_house_number;
        if (flatNumber) {
          society.flats.add(flatNumber);
        }
      });
    
    return Array.from(societyMap.values()).sort((a, b) => b.orderCount - a.orderCount);
  }, [filteredOrders, selectedArea]);

  // Get flats for selected society
  const flatsData = useMemo(() => {
    if (!selectedArea || !selectedSociety) return [];
    
    const flatMap = new Map();
    
    filteredOrders
      .filter(order => 
        order.customer?.address === selectedArea &&
        order.customer?.society_id === selectedSociety
      )
      .forEach(order => {
        const flatNumber = (order.customer as any)?.flat_plot_house_number || 'Unknown';
        
        if (!flatMap.has(flatNumber)) {
          flatMap.set(flatNumber, {
            flatNumber,
            customerName: order.customer?.name || 'Unknown',
            orders: []
          });
        }
        
        flatMap.get(flatNumber).orders.push({
          productName: order.product?.name || 'Unknown Product',
          quantity: order.quantity,
          unit: order.unit
        });
      });
    
    return Array.from(flatMap.values());
  }, [filteredOrders, selectedArea, selectedSociety]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  // Show areas list
  if (!selectedArea) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Areas Overview</h2>
            <p className="text-gray-600">Select an area to view delivery details</p>
          </div>
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
        </div>

        {areasData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areasData.map((area) => (
              <Card 
                key={area.name}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedArea(area.name)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span>{area.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{area.societyCount}</div>
                      <div className="text-xs text-gray-600">Societies</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{area.orderCount}</div>
                      <div className="text-xs text-gray-600">Pending Orders</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No pending orders found
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show societies for selected area
  if (selectedArea && !selectedSociety) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedArea(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Areas
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedArea}</h2>
            <p className="text-gray-600">Select a wing/society to view flats</p>
          </div>
        </div>

        {societiesData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {societiesData.map((society: any) => (
              <Card 
                key={society.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedSociety(society.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Wing {society.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{society.flats.size}</div>
                      <div className="text-xs text-gray-600">Flats</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{society.orderCount}</div>
                      <div className="text-xs text-gray-600">Pending Orders</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No pending orders in this area
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show flats for selected society
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedSociety(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Societies
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{selectedArea}</h2>
          <p className="text-gray-600">Wing {societiesData.find((s: any) => s.id === selectedSociety)?.name}</p>
        </div>
      </div>

      {flatsData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flatsData.map((flat) => (
            <Card key={flat.flatNumber} className="border-orange-200">
              <CardHeader className="pb-3 bg-orange-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Flat {flat.flatNumber}</span>
                  <Package className="h-5 w-5 text-orange-600" />
                </CardTitle>
                <p className="text-sm text-gray-600">{flat.customerName}</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {flat.orders.map((order: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium text-sm">{order.productName}</span>
                      <span className="text-sm text-gray-600">{order.quantity} {order.unit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No pending orders in this wing
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AreaHierarchyView;
