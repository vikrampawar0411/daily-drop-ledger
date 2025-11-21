
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Milk, Newspaper, Users, Receipt, TrendingUp, Calendar, MapPin, ArrowLeft, LogOut, Package, User, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import VendorDashboard from "./VendorDashboard";
import CustomerManagement from "./CustomerManagement";
import OrderManagement from "./OrderManagement";
import ProductManagement from "./ProductManagement";
import { AreaSocietyManagement } from "./AreaSocietyManagement";
import SocietyHierarchyView from "./SocietyHierarchyView";
import AreaHierarchyView from "./AreaHierarchyView";
import { useAuth } from "@/contexts/AuthContext";
import { useVendors } from "@/hooks/useVendors";
import { supabase } from "@/integrations/supabase/client";

const VendorApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [navigationParams, setNavigationParams] = useState<any>({});
  const { signOut, user } = useAuth();
  const { vendors } = useVendors();
  const [vendorName, setVendorName] = useState("");
  
  // Get the current vendor's ID
  const currentVendorId = vendors[0]?.id || "";

  useEffect(() => {
    const loadVendorName = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('vendors')
        .select('name, contact_person')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setVendorName(data.contact_person || data.name);
      }
    };

    loadVendorName();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-3 py-2 rounded-lg">
                <Milk className="h-6 w-6" />
                <Newspaper className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vendor Dashboard</h1>
                <p className="text-sm text-gray-600 hidden md:block">Manage your distribution network</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                        {vendorName ? vendorName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <div className="text-sm font-medium">{vendorName || user?.email?.split('@')[0]}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveTab('account')}>
                    <Settings className="h-4 w-4 mr-2" />
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
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5 gap-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="products-orders" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Products & Orders</span>
            </TabsTrigger>
            <TabsTrigger value="service-areas" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Service Areas</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <VendorDashboard onNavigate={handleNavigation} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="products-orders" className="space-y-6">
            <Tabs defaultValue="products" className="w-full">
              <TabsList>
                <TabsTrigger value="products">Product Management</TabsTrigger>
                <TabsTrigger value="orders">Order Management</TabsTrigger>
              </TabsList>
              <TabsContent value="products">
                <ProductManagement />
              </TabsContent>
              <TabsContent value="orders">
                <OrderManagement 
                  initialTimeRange={navigationParams?.initialTimeRange}
                  initialStatus={navigationParams?.initialStatus}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="service-areas" className="space-y-6">
            <Tabs defaultValue="society" className="w-full">
              <TabsList>
                <TabsTrigger value="society">Society View</TabsTrigger>
                <TabsTrigger value="area">Area View</TabsTrigger>
                {currentVendorId && <TabsTrigger value="setup">Area Setup</TabsTrigger>}
              </TabsList>
              <TabsContent value="society">
                <SocietyHierarchyView initialTimeRange={navigationParams?.initialTimeRange} />
              </TabsContent>
              <TabsContent value="area">
                <AreaHierarchyView initialTimeRange={navigationParams?.initialTimeRange} />
              </TabsContent>
              {currentVendorId && (
                <TabsContent value="setup">
                  <AreaSocietyManagement />
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Account settings for vendors coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorApp;
