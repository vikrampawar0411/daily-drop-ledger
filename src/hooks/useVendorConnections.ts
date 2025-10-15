import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useVendorConnections = () => {
  const [connectedVendorIds, setConnectedVendorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchConnections = async () => {
    try {
      if (!user) {
        setConnectedVendorIds([]);
        setLoading(false);
        return;
      }

      // Get customer record for the logged-in user
      const { data: customerData } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customerData) {
        setConnectedVendorIds([]);
        setLoading(false);
        return;
      }

      // Get vendor connections
      const { data, error } = await supabase
        .from("vendor_customer_connections")
        .select("vendor_id")
        .eq("customer_id", customerData.id);

      if (error) throw error;

      setConnectedVendorIds(data?.map(c => c.vendor_id) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching connections",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  const connectToVendor = async (vendorId: string) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to connect to vendors",
          variant: "destructive",
        });
        return;
      }

      // Get customer record
      const { data: customerData } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customerData) {
        toast({
          title: "Customer record not found",
          description: "Please complete your customer profile first",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("vendor_customer_connections")
        .insert({ vendor_id: vendorId, customer_id: customerData.id });

      if (error) throw error;

      setConnectedVendorIds(prev => [...prev, vendorId]);
      toast({
        title: "Success",
        description: "Connected to vendor successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error connecting to vendor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const disconnectFromVendor = async (vendorId: string) => {
    try {
      if (!user) return;

      // Get customer record
      const { data: customerData } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customerData) return;

      const { error } = await supabase
        .from("vendor_customer_connections")
        .delete()
        .eq("vendor_id", vendorId)
        .eq("customer_id", customerData.id);

      if (error) throw error;

      setConnectedVendorIds(prev => prev.filter(id => id !== vendorId));
      toast({
        title: "Success",
        description: "Disconnected from vendor",
      });
    } catch (error: any) {
      toast({
        title: "Error disconnecting from vendor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isConnected = (vendorId: string) => connectedVendorIds.includes(vendorId);

  return {
    connectedVendorIds,
    loading,
    connectToVendor,
    disconnectFromVendor,
    isConnected,
    refetch: fetchConnections,
  };
};
