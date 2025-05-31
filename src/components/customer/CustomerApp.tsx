
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Receipt, Calendar, ShoppingCart, ArrowLeft } from "lucide-react";
import CustomerDashboard from "./CustomerDashboard";
import VendorDirectory from "./VendorDirectory";
import OrderHistory from "./OrderHistory";
import OrderCalendar from "./OrderCalendar";

interface CustomerAppProps {
  onBack: () => void;
}

const CustomerApp = ({ onBack }: CustomerAppProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-2 rounded-lg">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600">Manage your orders and vendors</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Vendors</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Order Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Order History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CustomerDashboard />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorDirectory />
          </TabsContent>

          <TabsContent value="calendar">
            <OrderCalendar />
          </TabsContent>

          <TabsContent value="history">
            <OrderHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerApp;
