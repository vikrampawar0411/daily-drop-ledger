import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Store, ShoppingCart, Package, TrendingUp, Bell } from "lucide-react";
import { useState, useEffect } from "react";

interface WelcomeDialogProps {
  userType: 'vendor' | 'customer';
  userName?: string;
}

export const WelcomeDialog = ({ userType, userName }: WelcomeDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const storageKey = `welcome-dialog-shown-${userType}`;

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(storageKey);
    if (!hasSeenWelcome) {
      // Show welcome dialog after a short delay for better UX
      setTimeout(() => setIsOpen(true), 500);
    }
  }, [storageKey]);

  const handleClose = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
  };

  const customerContent = {
    title: `Welcome, ${userName || 'Customer'}! 🎉`,
    subtitle: "Your One-Stop Solution for Daily Essentials",
    description: "Daily Drop Ledger connects you with trusted local vendors for seamless delivery management.",
    features: [
      {
        icon: <Store className="h-6 w-6 text-blue-600" />,
        title: "Connect with Trusted Vendors",
        description: "Browse and connect with verified vendors offering milk, newspapers, groceries, and more"
      },
      {
        icon: <ShoppingCart className="h-6 w-6 text-green-600" />,
        title: "Easy Order Management",
        description: "Place one-time orders or set up subscriptions for recurring deliveries"
      },
      {
        icon: <Bell className="h-6 w-6 text-purple-600" />,
        title: "Stay Informed",
        description: "Get real-time notifications about your orders and vendor updates"
      }
    ],
    nextSteps: [
      "Browse the Vendor Directory to find vendors in your area",
      "Connect with vendors by clicking the 'Connect' button",
      "Start placing orders once connected"
    ],
    cta: "Start Connecting with Vendors"
  };

  const vendorContent = {
    title: `Welcome, ${userName || 'Vendor'}! 🎉`,
    subtitle: "Your One-Stop Solution to Grow Your Business",
    description: "Daily Drop Ledger helps you manage customers, track orders, and streamline your delivery operations.",
    features: [
      {
        icon: <Users className="h-6 w-6 text-blue-600" />,
        title: "Grow Your Customer Base",
        description: "Customers can discover and connect with your business through our platform"
      },
      {
        icon: <Package className="h-6 w-6 text-green-600" />,
        title: "Manage Orders Efficiently",
        description: "Track all orders, subscriptions, and deliveries in one centralized dashboard"
      },
      {
        icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
        title: "Business Insights",
        description: "Monitor your sales, popular products, and customer preferences"
      }
    ],
    nextSteps: [
      "Customers will find you through the Vendor Directory",
      "Accept connection requests from interested customers",
      "Start receiving and managing orders seamlessly"
    ],
    cta: "Start Managing Your Business"
  };

  const content = userType === 'customer' ? customerContent : vendorContent;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-lg font-semibold text-blue-600 mt-2">
            {content.subtitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Main Description */}
          <p className="text-gray-700 leading-relaxed">
            {content.description}
          </p>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Key Features:</h3>
            {content.features.map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex-shrink-0 mt-1">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-lg">Getting Started:</h3>
            <div className="space-y-2">
              {content.nextSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="pt-4 border-t">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-800 text-center">
                <span className="font-semibold">Need help?</span> Explore the dashboard to discover all features, 
                or check our help section for detailed guides.
              </p>
            </div>
            <Button 
              onClick={handleClose} 
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
              size="lg"
            >
              {content.cta}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
