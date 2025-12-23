import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Users, Package, Calendar, TrendingUp, MapPin, Settings, ShoppingCart, Bell } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
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
import AdminAccountSettings from "./AdminAccountSettings";

const AdminApp = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [adminName, setAdminName] = useState("");
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [orderFilterCustomer, setOrderFilterCustomer] = useState<{id: string, name: string} | null>(null);

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
          <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-2">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-10 w-10 rounded-full flex items-center justify-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {adminName ? adminName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
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
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600 hidden md:block">Manage vendors, customers and operations</p>
              </div>
            </div>
            {/* Notification and Cart Buttons - right aligned, borderless until hover */}
            <div className="flex-1 flex justify-end items-center gap-2">
              <NotificationDropdown />
              <Button
                variant="ghost"
                size="icon"
                className="relative border border-transparent hover:border-gray-300 focus:border-gray-400 rounded-full"
                aria-label="Cart"
                // TODO: Implement admin cart dialog if needed
                disabled
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
            {/* Date and stats removed from top bar */}
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4 mb-8 gap-1">
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
                <CustomerManagement
                  onEditCustomer={(customer) => setEditCustomer(customer)}
                  onViewOrders={(customer) => {
                    setOrderFilterCustomer({ id: customer.id, name: customer.name });
                    setActiveTab("products-orders");
                  }}
                />
                {/* Edit Customer Dialog (simple example) */}
                {editCustomer && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h2 className="text-lg font-bold mb-4">Edit Customer</h2>
                      <div className="mb-2"><b>Name:</b> {editCustomer.name}</div>
                      <div className="mb-2"><b>Email:</b> {editCustomer.email}</div>
                      <div className="mb-2"><b>Phone:</b> {editCustomer.phone}</div>
                      {/* Add real edit fields here as needed */}
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setEditCustomer(null)}>Close</Button>
                        {/* <Button onClick={handleSaveCustomerEdit}>Save</Button> */}
                      </div>
                    </div>
                  </div>
                )}
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
                <OrderManagement
                  initialCustomerId={orderFilterCustomer?.id}
                  initialCustomerName={orderFilterCustomer?.name}
                />
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
            <AdminAccountSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminApp;
