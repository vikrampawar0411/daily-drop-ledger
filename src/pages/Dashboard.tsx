import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import VendorApp from "@/components/vendor/VendorApp";
import CustomerApp from "@/components/customer/CustomerApp";
import AdminApp from "@/components/admin/AdminApp";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, getUserRole, signOut } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'vendor' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState(false);

  useEffect(() => {
    if (user) {
      getUserRole().then(role => {
        setUserRole(role);
        if (!role) {
          setRoleError(true);
        }
        setLoading(false);
      });
    } else {
      navigate('/auth');
    }
  }, [user, getUserRole, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (roleError || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Setup Incomplete</h2>
            <p className="text-gray-600 mb-6">
              Your account role is not configured properly. This may happen if your account was created before the system was fully set up.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please contact support or try signing up again with a new account.
            </p>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userRole === 'admin') {
    return <AdminApp />;
  }

  if (userRole === 'vendor') {
    return <VendorApp />;
  }

  if (userRole === 'customer') {
    return <CustomerApp />;
  }

  return null;
};

export default Dashboard;
