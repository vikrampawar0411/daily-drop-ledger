import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Bell, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface OnboardingCardProps {
  userType: 'vendor' | 'customer';
  onDismiss: () => void;
  onAddAction: () => void;
  hasData: boolean;
}

export const OnboardingCard = ({ userType, onDismiss, onAddAction, hasData }: OnboardingCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `oobe-dismissed-${userType}`;

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    setIsVisible(!hasData && !dismissed);
  }, [hasData, storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onDismiss();
  };

  const handleRemindLater = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const content = userType === 'vendor' ? {
    title: "Welcome to Vendor Dashboard!",
    addText: "Add Your First Customer",
    items: [
      { icon: <PlusCircle className="h-5 w-5" />, text: "Add customers to start managing orders" },
      { icon: <BookOpen className="h-5 w-5" />, text: "Check our user guide for best practices" },
      { icon: <Bell className="h-5 w-5" />, text: "Stay updated with new features" }
    ]
  } : {
    title: "Welcome to Customer Dashboard!",
    addText: "Connect with Vendors",
    items: [
      { icon: <PlusCircle className="h-5 w-5" />, text: "Browse and connect with vendors" },
      { icon: <BookOpen className="h-5 w-5" />, text: "Learn how to place orders efficiently" },
      { icon: <Bell className="h-5 w-5" />, text: "Get notified about order updates" }
    ]
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle className="text-xl text-blue-900">{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {content.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 text-gray-700">
              <div className="text-blue-600 mt-0.5">{item.icon}</div>
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={onAddAction} className="flex-1">
            {content.addText}
          </Button>
          <Button variant="outline" onClick={handleRemindLater}>
            Remind Me Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
