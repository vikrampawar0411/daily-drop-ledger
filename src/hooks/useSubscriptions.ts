import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Subscription {
  id: string;
  customer_id: string;
  vendor_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  frequency: string;
  start_date: string;
  end_date: string | null;
  status: string;
  paused_from: string | null;
  paused_until: string | null;
  created_at: string;
  vendor?: {
    name: string;
  };
  product?: {
    name: string;
    category: string;
  };
}

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSubscriptions = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      // Get customer ID
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customer) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          vendor:vendors(name),
          product:products(name, category)
        `)
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching subscriptions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const createSubscription = async (subscription: Omit<Subscription, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert([subscription])
        .select()
        .single();

      if (error) throw error;

      // Trigger order generation for this subscription
      try {
        const response = await fetch(
          'https://ssaogbrpjvxvlxtdivah.supabase.co/functions/v1/generate-subscription-orders',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYW9nYnJwanZ4dmx4dGRpdmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzE1OTIsImV4cCI6MjA3NTAwNzU5Mn0.QQn4MgbPVHi83q5jWwL5qYJNrwnFylHlUyawK_bJaiM`,
            },
            body: JSON.stringify({}),
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          console.log('Orders generated:', result);
        }
      } catch (generationError) {
        console.error('Error generating orders:', generationError);
        // Don't fail the subscription creation if order generation fails
      }

      await fetchSubscriptions();
      toast({
        title: "Success",
        description: "Subscription created successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating subscription",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const pauseSubscription = async (id: string, pausedFrom: string, pausedUntil: string) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "paused",
          paused_from: pausedFrom,
          paused_until: pausedUntil,
        })
        .eq("id", id);

      if (error) throw error;

      await fetchSubscriptions();
      toast({
        title: "Success",
        description: "Subscription paused successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error pausing subscription",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const resumeSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          paused_from: null,
          paused_until: null,
        })
        .eq("id", id);

      if (error) throw error;

      await fetchSubscriptions();
      toast({
        title: "Success",
        description: "Subscription resumed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error resuming subscription",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq("id", id);

      if (error) throw error;

      await fetchSubscriptions();
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error cancelling subscription",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    subscriptions,
    loading,
    createSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    refetch: fetchSubscriptions,
  };
};
