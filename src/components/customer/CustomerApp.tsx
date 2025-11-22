
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, ShoppingCart, LogOut, Repeat, User, UserCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CustomerDashboard from "./CustomerDashboard";
import VendorDirectory from "./VendorDirectory";
import OrderCalendar from "./OrderCalendar";
import SubscriptionManagement from "./SubscriptionManagement";
import AccountSettings from "./AccountSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CustomerApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [navigationParams, setNavigationParams] = useState<any>({});
  const { signOut, user } = useAuth();
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const loadCustomerName = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('customers')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setCustomerName(data.name);
      }
    };

    loadCustomerName();
  }, [user]);

  const handleNavigation = (tab: string, params?: any) => {
    setActiveTab(tab);
    setNavigationParams(params || {});
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-2">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-2 rounded-lg">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600 hidden md:block">Manage your orders and vendors</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 order-3 md:order-none w-full md:w-auto">
              <div className="flex items-center space-x-2 text-sm text-gray-600 order-last md:order-none w-full md:w-auto justify-start md:justify-center">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                        {customerName ? customerName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <div className="text-sm font-medium">{customerName || user?.email?.split('@')[0]}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveTab('account')}>
                    <User className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3 gap-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Vendors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CustomerDashboard 
              onNavigate={handleNavigation} 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              navigationParams={navigationParams}
            />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManagement onNavigate={handleNavigation} navigationParams={navigationParams} />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorDirectory onNavigate={handleNavigation} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerApp;
