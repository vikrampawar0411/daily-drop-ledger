
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Milk, Newspaper, Users, UserPlus, LogOut } from "lucide-react";
import VendorApp from "@/components/vendor/VendorApp";
import CustomerApp from "@/components/customer/CustomerApp";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'vendor' | 'customer' | null>(null);
  const { user, signOut, getUserRole } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'vendor' | 'customer' | null>(null);

  useEffect(() => {
    if (user) {
      getUserRole().then(setUserRole);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setUserType(null);
    navigate('/auth');
  };

  if (userType === 'vendor') {
    return <VendorApp onBack={() => setUserType(null)} />;
  }

  if (userType === 'customer') {
    return <CustomerApp onBack={() => setUserType(null)} />;
  }

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
                <h1 className="text-xl font-bold text-gray-900">Daily Drop Ledger</h1>
                <p className="text-sm text-gray-600">Vendor-Customer Distribution Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Daily Drop Ledger</h2>
          <p className="text-lg text-gray-600">Choose your role to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setUserType('vendor')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">I'm a Vendor</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Manage your delivery routes, track customers by area/society/wing, and handle orders efficiently.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Access Vendor Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setUserType('customer')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">I'm a Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Register with multiple vendors, place orders for future dates, and manage your subscriptions.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Access Customer Portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
