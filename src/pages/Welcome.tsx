import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShoppingBag, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, signOut, getUserRole } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'vendor' | 'customer' | null>(null);
  const [userName, setUserName] = useState("");
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const role = await getUserRole();
      setUserRole(role);

      // Get user name based on role
      if (role === 'admin') {
        setUserName('Admin');
        // Admin sees all connections
        const { count } = await supabase
          .from('vendor_customer_connections')
          .select('*', { count: 'exact', head: true });
        setConnectionCount(count || 0);
      } else if (role === 'vendor') {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('name')
          .eq('email', user.email)
          .single();
        
        if (vendor) {
          setUserName(vendor.name);
          // Get vendor's customer connections
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('id')
            .eq('email', user.email)
            .single();
          
          if (vendorData) {
            const { count } = await supabase
              .from('vendor_customer_connections')
              .select('*', { count: 'exact', head: true })
              .eq('vendor_id', vendorData.id);
            setConnectionCount(count || 0);
          }
        }
      } else if (role === 'customer') {
        const { data: customer } = await supabase
          .from('customers')
          .select('name')
          .eq('email', user.email)
          .single();
        
        if (customer) {
          setUserName(customer.name);
          // Get customer's vendor connections
          const { data: customerData } = await supabase
            .from('customers')
            .select('id')
            .eq('email', user.email)
            .single();
          
          if (customerData) {
            const { count } = await supabase
              .from('vendor_customer_connections')
              .select('*', { count: 'exact', head: true })
              .eq('customer_id', customerData.id);
            setConnectionCount(count || 0);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleEnterPortal = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Daily Drop Ledger</h1>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Welcome Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome {userName} — Role: <span className="capitalize inline-flex items-center">
              {userRole === 'admin' && <Shield className="h-8 w-8 ml-2 mr-1 text-red-600" />}
              {userRole}
            </span>
          </h2>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {userRole === 'vendor' ? 'Connected Customers' : userRole === 'customer' ? 'Connected Vendors' : 'Total Connections'}
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{connectionCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Your Role</CardTitle>
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold capitalize">{userRole}</div>
            </CardContent>
          </Card>
        </div>

        {/* Enter Portal Button */}
        <div className="text-center">
          <Button 
            onClick={handleEnterPortal}
            size="lg"
            className="px-8 py-6 text-lg"
          >
            Enter My Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
