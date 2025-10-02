import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp } from "lucide-react";

interface VendorOrder {
  date: string;
  product: string;
  quantity: number;
  unit: string;
  amount: number;
}

interface VendorStats {
  name: string;
  dailyOrders: VendorOrder[];
  monthlyTotal: number;
  monthlyOrders: number;
  avgDailySpend: number;
}

const vendorStats: VendorStats[] = [
  {
    name: "Fresh Dairy Co.",
    dailyOrders: [
      { date: "2024-12-01", product: "Fresh Milk", quantity: 2, unit: "litres", amount: 120 },
      { date: "2024-12-02", product: "Fresh Milk", quantity: 2, unit: "litres", amount: 120 },
    ],
    monthlyTotal: 3600,
    monthlyOrders: 30,
    avgDailySpend: 120
  },
  {
    name: "News Express",
    dailyOrders: [
      { date: "2024-12-01", product: "Times of India", quantity: 1, unit: "copy", amount: 8 },
      { date: "2024-12-02", product: "Times of India", quantity: 1, unit: "copy", amount: 8 },
    ],
    monthlyTotal: 240,
    monthlyOrders: 30,
    avgDailySpend: 8
  },
  {
    name: "Daily Essentials",
    dailyOrders: [
      { date: "2024-12-01", product: "Indian Express", quantity: 1, unit: "copy", amount: 6 },
    ],
    monthlyTotal: 180,
    monthlyOrders: 30,
    avgDailySpend: 6
  }
];

export const VendorOrderTabs = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Order Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={vendorStats[0].name} className="w-full">
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
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">₹{vendor.monthlyTotal}</div>
                      <div className="text-sm text-muted-foreground">Monthly Total</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{vendor.monthlyOrders}</div>
                      <div className="text-sm text-muted-foreground">Total Orders</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">₹{vendor.avgDailySpend}</div>
                      <div className="text-sm text-muted-foreground">Avg Daily Spend</div>
                    </div>
                  </CardContent>
                </Card>
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
