
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Receipt, Calendar, ShoppingCart, ArrowLeft, LogOut, Repeat } from "lucide-react";
import CustomerDashboard from "./CustomerDashboard";
import VendorDirectory from "./VendorDirectory";
import OrderHistory from "./OrderHistory";
import OrderCalendar from "./OrderCalendar";
import SubscriptionManagement from "./SubscriptionManagement";
import { useAuth } from "@/contexts/AuthContext";

const CustomerApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-2 rounded-lg">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600">Manage your orders and vendors</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5 gap-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Vendors</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CustomerDashboard onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorDirectory onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="calendar">
            <OrderCalendar />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManagement />
          </TabsContent>

          <TabsContent value="history">
            <OrderHistory 
              initialVendorFilter={sessionStorage.getItem('orderHistoryVendor') || undefined}
              initialStatusFilter={sessionStorage.getItem('orderHistoryStatus') || undefined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerApp;
