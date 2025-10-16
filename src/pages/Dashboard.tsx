import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import VendorApp from "@/components/vendor/VendorApp";
import CustomerApp from "@/components/customer/CustomerApp";
import AdminApp from "@/components/admin/AdminApp";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, getUserRole } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'vendor' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserRole().then(role => {
        setUserRole(role);
        setLoading(false);
      });
    } else {
      navigate('/auth');
    }
  }, [user, getUserRole, navigate]);

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
