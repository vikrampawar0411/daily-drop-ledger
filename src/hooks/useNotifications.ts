import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  recipient_user_id: string;
  sender_user_id?: string;
  order_id?: string;
  vendor_id?: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setNotifications(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
  };

  return { notifications, loading, fetchNotifications, markAsRead };
};
