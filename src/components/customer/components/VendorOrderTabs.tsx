import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package } from "lucide-react";

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
  dailyOrders: VendorOrder[];
  monthlyTotal: number;
  monthlyOrders: number;
  avgDailySpend: number;
  monthlyProducts: MonthlyProductStats[];
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
    avgDailySpend: 120,
    monthlyProducts: [
      { product: "Fresh Milk", totalQuantity: 60, unit: "litres", pricePerUnit: 60, totalAmount: 3600 }
    ]
  },
  {
    name: "News Express",
    dailyOrders: [
      { date: "2024-12-01", product: "Times of India", quantity: 1, unit: "copy", amount: 8 },
      { date: "2024-12-02", product: "Times of India", quantity: 1, unit: "copy", amount: 8 },
    ],
    monthlyTotal: 240,
    monthlyOrders: 30,
    avgDailySpend: 8,
    monthlyProducts: [
      { product: "Times of India", totalQuantity: 30, unit: "copies", pricePerUnit: 8, totalAmount: 240 }
    ]
  },
  {
    name: "Daily Essentials",
    dailyOrders: [
      { date: "2024-12-01", product: "Indian Express", quantity: 1, unit: "copy", amount: 6 },
    ],
    monthlyTotal: 360,
    monthlyOrders: 30,
    avgDailySpend: 12,
    monthlyProducts: [
      { product: "Indian Express", totalQuantity: 30, unit: "copies", pricePerUnit: 6, totalAmount: 180 },
      { product: "Fresh Milk", totalQuantity: 30, unit: "litres", pricePerUnit: 6, totalAmount: 180 }
    ]
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
