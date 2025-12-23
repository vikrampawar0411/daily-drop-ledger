
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, Milk, Newspaper, Plus, Trash2, Calendar } from "lucide-react";
import type { Order } from "../types/order";

interface OrderDetailsViewProps {
  selectedDate: Date | undefined;
  orders: Order[];
  onDeleteOrder: (orderId: string) => void;
  onShowOrderForm: () => void;
}

const OrderDetailsView = ({ selectedDate, orders, onDeleteOrder, onShowOrderForm }: OrderDetailsViewProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">
            {selectedDate ? `Orders for ${selectedDate.toLocaleDateString()}` : "Select a date"}
          </CardTitle>
          {selectedDate && orders.length > 0 && (
            <Badge variant="outline" className="text-sm self-start sm:self-auto">
              {orders.length} orders
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedDate ? (
          <div className="space-y-4">
            {orders.length > 0 ? (
                <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {order.product.toLowerCase().includes('milk') ? (
                        <Milk className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Newspaper className="h-5 w-5 text-orange-600" />
                      )}
                      <div>
                        <div className="font-medium">{order.product}</div>
                        <div className="text-sm text-gray-600">{order.vendor}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Order Type: {order.order_type === 'auto' ? 'Subscription' : order.order_type === 'request' ? 'Quick Order' : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-2">
                        <div className="font-medium">{order.quantity} {order.unit}</div>
                        <Badge variant="outline" className="text-xs">Scheduled</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No orders scheduled for this date</p>
                <Button 
                  className="mt-4" 
                  onClick={onShowOrderForm}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Order
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select a date to view or add orders</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderDetailsView;
