import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";

interface VendorOrderTabsProps {
  onNavigateToHistory?: (vendorName: string, status?: string) => void;
}

interface VendorOrder {
  date: string;
  product: string;
  quantity: number;
  unit: string;
  amount: number;
}

interface MonthlyProductStats {
  product: string;
  totalQuantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
}

interface VendorStats {
  name: string;
  vendorId: string;
  dailyOrders: VendorOrder[];
  monthlyTotal: number;
  monthlyOrders: number;
  avgDailySpend: number;
  monthlyProducts: MonthlyProductStats[];
}

export const VendorOrderTabs = ({ onNavigateToHistory }: VendorOrderTabsProps) => {
  const { orders, loading } = useOrders();
  const [selectedVendorTab, setSelectedVendorTab] = useState<string>("");

  const vendorStats: VendorStats[] = useMemo(() => {
    // Group orders by vendor
    const vendorMap = new Map<string, any[]>();
    
    orders.forEach(order => {
      if (order.vendor && order.vendor.id) {
        if (!vendorMap.has(order.vendor.id)) {
          vendorMap.set(order.vendor.id, []);
        }
        vendorMap.get(order.vendor.id)!.push(order);
      }
    });

    // Calculate stats for each vendor
    return Array.from(vendorMap.entries()).map(([vendorId, vendorOrders]) => {
      const vendorName = vendorOrders[0]?.vendor?.name || "Unknown Vendor";
      
      // Daily orders (most recent 10)
      const dailyOrders: VendorOrder[] = vendorOrders
        .slice(0, 10)
        .map(order => ({
          date: order.order_date,
          product: order.product?.name || "Unknown",
          quantity: Number(order.quantity),
          unit: order.unit,
          amount: Number(order.total_amount)
        }));

      // Monthly product aggregation
      const productMap = new Map<string, {
        totalQuantity: number;
        unit: string;
        pricePerUnit: number;
        totalAmount: number;
      }>();

      vendorOrders.forEach(order => {
        const productName = order.product?.name || "Unknown";
        if (!productMap.has(productName)) {
          productMap.set(productName, {
            totalQuantity: 0,
            unit: order.unit,
            pricePerUnit: Number(order.price_per_unit || 0),
            totalAmount: 0
          });
        }
        const stats = productMap.get(productName)!;
        stats.totalQuantity += Number(order.quantity);
        stats.totalAmount += Number(order.total_amount);
      });

      const monthlyProducts: MonthlyProductStats[] = Array.from(productMap.entries()).map(
        ([product, stats]) => ({
          product,
          ...stats
        })
      );

      const monthlyTotal = vendorOrders.reduce((sum, order) => 
        sum + Number(order.total_amount), 0
      );
      const monthlyOrders = vendorOrders.length;
      const avgDailySpend = monthlyOrders > 0 ? monthlyTotal / monthlyOrders : 0;

      return {
        name: vendorName,
        vendorId,
        dailyOrders,
        monthlyTotal,
        monthlyOrders,
        avgDailySpend,
        monthlyProducts
      };
    });
  }, [orders]);

  // Initialize selected vendor tab when vendor stats are available
  useMemo(() => {
    if (vendorStats.length > 0 && !selectedVendorTab) {
      setSelectedVendorTab(vendorStats[0].name);
    }
  }, [vendorStats, selectedVendorTab]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading vendor order details...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (vendorStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No order data available. Place some orders to see vendor statistics.
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Order Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedVendorTab} onValueChange={setSelectedVendorTab} className="w-full">
          <TabsList className="w-full justify-start">
            {vendorStats.map((vendor) => (
              <TabsTrigger key={vendor.name} value={vendor.name}>
                {vendor.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {vendorStats.map((vendor) => (
            <TabsContent key={vendor.name} value={vendor.name} className="space-y-4">
              {/* Monthly Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => onNavigateToHistory?.(vendor.name, 'all')}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">₹{vendor.monthlyTotal}</div>
                      <div className="text-sm text-muted-foreground">Monthly Total</div>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => onNavigateToHistory?.(vendor.name, 'all')}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{vendor.monthlyOrders}</div>
                      <div className="text-sm text-muted-foreground">Total Orders</div>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => onNavigateToHistory?.(vendor.name, 'delivered')}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">₹{vendor.avgDailySpend}</div>
                      <div className="text-sm text-muted-foreground">Avg Daily Spend</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Product Details */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Monthly Order Details by Product
                </h4>
                <div className="space-y-2">
                  {vendor.monthlyProducts.map((product, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-base">{product.product}</div>
                        <div className="text-lg font-bold text-primary">₹{product.totalAmount}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Quantity</div>
                          <div className="font-semibold">{product.totalQuantity} {product.unit}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Price per Unit</div>
                          <div className="font-semibold">₹{product.pricePerUnit}/{product.unit.slice(0, -1)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Amount</div>
                          <div className="font-semibold">₹{product.totalAmount}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Orders */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Daily Orders
                </h4>
                <div className="space-y-2">
                  {vendor.dailyOrders.map((order, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{order.product}</div>
                        <div className="text-sm text-muted-foreground">{order.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {order.quantity} {order.unit}
                        </div>
                        <div className="text-sm text-primary font-semibold">₹{order.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
