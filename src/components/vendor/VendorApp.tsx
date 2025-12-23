
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Milk, Newspaper, Users, Receipt, TrendingUp, Calendar, MapPin, ArrowLeft, LogOut, Package, User, Settings, DollarSign, ShoppingCart, Bell } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import VendorDashboard from "./VendorDashboard";
import CustomerManagement from "./CustomerManagement";
import OrderManagement from "./OrderManagement";
import ProductManagement from "./ProductManagement";
import VendorBilling from "./VendorBilling";
import { AreaSocietyManagement } from "./AreaSocietyManagement";
import SocietyHierarchyView from "./SocietyHierarchyView";
import AreaHierarchyView from "./AreaHierarchyView";
import { WelcomeTourButton } from "@/components/onboarding/WelcomeTourButton";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useVendors } from "@/hooks/useVendors";
import { supabase } from "@/integrations/supabase/client";
import VendorAccountSettings from "./VendorAccountSettings";
import { useToast } from "@/hooks/use-toast";

const VendorApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [navigationParams, setNavigationParams] = useState<any>({});
  const [productsOrdersInnerTab, setProductsOrdersInnerTab] = useState<"products" | "orders">("products");
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const { vendors } = useVendors();
  const [vendorName, setVendorName] = useState("");
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  
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

  // Listen for cross-component navigation events (e.g. from child components)
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<any>;
      const tab = ev?.detail?.tab;
      const params = ev?.detail?.params || {};
      if (tab) {
        setActiveTab(tab);
        setNavigationParams(params);
      }
    };

    window.addEventListener("vendor:navigate", handler as EventListener);
    return () => window.removeEventListener("vendor:navigate", handler as EventListener);
  }, []);

  // When navigationParams change, update inner products/orders tab selection
  useEffect(() => {
    if (activeTab === 'products-orders') {
      if (navigationParams?.initialCustomerId) {
        setProductsOrdersInnerTab('orders');
      } else if (navigationParams?.initialTab === 'products') {
        setProductsOrdersInnerTab('products');
      }
    }
  }, [navigationParams, activeTab]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-2">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-10 w-10 rounded-full flex items-center justify-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                        {vendorName ? vendorName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
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
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vendor Dashboard</h1>
                <p className="text-sm text-gray-600 hidden md:block">Manage your distribution network</p>
              </div>
              <WelcomeTourButton onClick={() => setWelcomeDialogOpen(true)} />
            </div>
            {/* Notification and Cart Buttons - right aligned, borderless until hover */}
            <div className="flex-1 flex justify-end items-center gap-2">
              <NotificationDropdown />
              <Button
                variant="ghost"
                size="icon"
                className="relative border border-transparent hover:border-gray-300 focus:border-gray-400 rounded-full"
                aria-label="Cart"
                // TODO: Implement vendor cart dialog if needed
                disabled
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
            {/* Date removed from top bar */}
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
            <TabsTrigger value="billing" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="service-areas" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Service Areas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <VendorDashboard onNavigate={handleNavigation} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement
              onViewOrders={async (customer: any) => {
                // Check if customer has any orders
                const { count } = await supabase
                  .from('orders')
                  .select('id', { count: 'exact', head: true })
                  .eq('customer_id', customer.id)
                  .eq('vendor_id', currentVendorId);
                
                if (count === 0) {
                  // Show toast if no orders exist
                  toast({
                    title: 'No orders found',
                    description: `No orders exist for ${customer.name}`,
                  });
                  return;
                }
                
                handleNavigation('products-orders', {
                  initialCustomerId: customer.id,
                  initialCustomerName: customer.name,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="products-orders" className="space-y-6">
              <Tabs value={productsOrdersInnerTab} onValueChange={(value) => setProductsOrdersInnerTab(value as "products" | "orders")} className="w-full">
              <TabsList>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>
              <TabsContent value="products">
                <ProductManagement />
              </TabsContent>
              <TabsContent value="orders">
                <OrderManagement 
                  initialTimeRange={navigationParams?.initialTimeRange}
                  initialStatus={navigationParams?.initialStatus}
                  initialCustomerId={navigationParams?.initialCustomerId}
                  initialCustomerName={navigationParams?.initialCustomerName}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="billing">
            <VendorBilling />
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
            <VendorAccountSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Welcome Tour Dialog */}
      <WelcomeDialog 
        userType="vendor" 
        userName={vendorName}
        isOpen={welcomeDialogOpen}
        onClose={() => setWelcomeDialogOpen(false)}
      />
    </div>
  );
};

export default VendorApp;
