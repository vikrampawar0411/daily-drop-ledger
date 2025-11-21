import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Users, Package, Calendar, TrendingUp, MapPin, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import CustomerManagement from "@/components/vendor/CustomerManagement";
import VendorManagement from "./VendorManagement";
import OrderManagement from "@/components/vendor/OrderManagement";
import { ServiceAreaManagement } from "./ServiceAreaManagement";
import AdminOrderHistory from "./AdminOrderHistory";
import ProductManagement from "./ProductManagement";

const AdminApp = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const loadAdminData = async () => {
      if (!user) return;
      
      try {
        // Load profile name
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileData?.name) {
          setAdminName(profileData.name);
        }

        const { count: vendorCount } = await supabase
          .from('vendors')
          .select('*', { count: 'exact', head: true });
        setTotalVendors(vendorCount || 0);

        const { count: customerCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        setTotalCustomers(customerCount || 0);

        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        setTotalProducts(productCount || 0);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadAdminData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600 hidden md:block">Manage vendors, customers and operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="hidden md:inline">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{totalVendors} Vendors</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{totalCustomers} Customers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4" />
                  <span>{totalProducts} Products</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {adminName ? adminName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <div className="text-sm font-medium">{adminName || user?.email?.split('@')[0]}</div>
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

      {/* Admin Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5 mb-8 gap-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="products-orders" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Products & Orders</span>
            </TabsTrigger>
            <TabsTrigger value="service-area" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Service Areas</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Tabs defaultValue="customers" className="w-full">
              <TabsList>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="vendors">Vendors</TabsTrigger>
              </TabsList>
              <TabsContent value="customers">
                <CustomerManagement />
              </TabsContent>
              <TabsContent value="vendors">
                <VendorManagement />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="products-orders" className="space-y-6">
            <Tabs defaultValue="products" className="w-full">
              <TabsList>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Current Orders</TabsTrigger>
                <TabsTrigger value="history">Order History</TabsTrigger>
              </TabsList>
              <TabsContent value="products">
                <ProductManagement />
              </TabsContent>
              <TabsContent value="orders">
                <OrderManagement />
              </TabsContent>
              <TabsContent value="history">
                <AdminOrderHistory />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="service-area">
            <ServiceAreaManagement />
          </TabsContent>

          <TabsContent value="account">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
              <p className="text-gray-600">Admin account settings coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminApp;
