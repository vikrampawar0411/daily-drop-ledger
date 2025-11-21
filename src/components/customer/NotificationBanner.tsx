import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  message: string;
  vendor_contact: string | null;
  is_read: boolean;
  created_at: string;
}

export const NotificationBanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerId = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setCustomerId(data.id);
      }
    };

    fetchCustomerId();
  }, [user]);

  useEffect(() => {
    if (!customerId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("customer_notifications")
        .select("*")
        .eq("customer_id", customerId)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data || []);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "customer_notifications",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          toast({
            title: "New notification",
            description: "You have a new product update",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, toast]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("customer_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {notifications.map((notification) => (
        <Alert key={notification.id} variant="destructive" className="relative">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="pr-8">
              <p className="font-medium mb-1">{notification.message}</p>
              {notification.vendor_contact && (
                <p className="text-sm mt-2">{notification.vendor_contact}</p>
              )}
            </div>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => markAsRead(notification.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
};
