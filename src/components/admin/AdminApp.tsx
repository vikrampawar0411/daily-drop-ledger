import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import CustomerManagement from "@/components/vendor/CustomerManagement";
import VendorManagement from "./VendorManagement";
import OrderManagement from "@/components/vendor/OrderManagement";
import { ServiceAreaManagement } from "./ServiceAreaManagement";
import AdminOrderHistory from "./AdminOrderHistory";
import ProductManagement from "@/components/vendor/ProductManagement";

const AdminApp = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminName, setAdminName] = useState("");
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profile?.name) {
          setAdminName(profile.name);
        }

        const { count } = await supabase
          .from('vendor_customer_connections')
          .select('*', { count: 'exact', head: true });
        setConnectionCount(count || 0);
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
                <p className="text-sm text-gray-600">Welcome back, {adminName || 'Administrator'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{connectionCount} connections</span>
              </div>
              <span className="text-sm text-gray-600 font-semibold flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Administrator</span>
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-8 h-auto">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm">Customers</TabsTrigger>
            <TabsTrigger value="vendors" className="text-xs sm:text-sm">Vendors</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm">Products</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">Order History</TabsTrigger>
            <TabsTrigger value="service-area" className="text-xs sm:text-sm">Service Area</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="history">
            <AdminOrderHistory />
          </TabsContent>

          <TabsContent value="service-area">
            <ServiceAreaManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminApp;
