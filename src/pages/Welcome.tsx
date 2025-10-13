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

      // First, try to get name from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (profile?.name) {
        setUserName(profile.name);
      }

      // Get connection count based on role
      if (role === 'admin') {
        // Admin sees all connections
        const { count } = await supabase
          .from('vendor_customer_connections')
          .select('*', { count: 'exact', head: true });
        setConnectionCount(count || 0);
      } else if (role === 'vendor') {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (vendor) {
          if (!profile?.name) setUserName(vendor.name);
          const { count } = await supabase
            .from('vendor_customer_connections')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id);
          setConnectionCount(count || 0);
        }
      } else if (role === 'customer') {
        const { data: customer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (customer) {
          if (!profile?.name) setUserName(customer.name);
          const { count } = await supabase
            .from('vendor_customer_connections')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.id);
          setConnectionCount(count || 0);
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
            Welcome {userName || 'User'}
          </h2>
          <p className="text-2xl text-gray-600 flex items-center justify-center">
            Your Role: 
            <span className="ml-2 capitalize font-semibold flex items-center">
              {userRole === 'admin' && <Shield className="h-6 w-6 mr-1 text-red-600" />}
              {userRole || 'Loading...'}
            </span>
          </p>
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
