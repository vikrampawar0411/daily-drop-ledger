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
  original_start_date: string;
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
    image_url: string | null;
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
          product:products(name, category, image_url)
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

  const createSubscription = async (subscription: Omit<Subscription, "id" | "created_at" | "updated_at" | "original_start_date">) => {
    try {
      console.log('Creating subscription with data:', {
        ...subscription,
        original_start_date: subscription.start_date,
        created_by_user_id: user?.id || null
      });
      
      const { data, error } = await supabase
        .from("subscriptions")
        .insert([{
          ...subscription,
          original_start_date: subscription.start_date,
          created_by_user_id: user?.id || null
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('Subscription created successfully:', data);

      console.log('Subscription created:', data.id);

      // Wait a moment to ensure subscription is committed to database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Trigger order generation for this subscription
      try {
        console.log('Calling generate-subscription-orders function for subscription:', data.id);
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
        
        console.log('Function response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Orders generated:', result);
          
          // Show details about generated orders
          if (result.ordersCreated > 0) {
            toast({
              title: "Orders Generated",
              description: `${result.ordersCreated} orders have been created for your subscription. Navigate through calendar months to see them.`,
            });
          } else {
            console.warn('No orders were created. Result:', result);
            toast({
              title: "Subscription Created",
              description: "Subscription created but no new orders generated. Check if orders already exist.",
              variant: "default",
            });
          }
          
          // Wait longer for orders to be fully created, then trigger a page reload
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          const errorText = await response.text();
          console.error('Function call failed:', response.status, errorText);
          toast({
            title: "Warning",
            description: "Subscription created but order generation may have failed. Please refresh the page.",
            variant: "destructive",
          });
          
          // Still reload to show subscription
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (generationError) {
        console.error('Error generating orders:', generationError);
        toast({
          title: "Warning",
          description: "Subscription created but order generation encountered an error. Please refresh the page.",
          variant: "destructive",
        });
        // Don't fail the subscription creation if order generation fails
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

      await fetchSubscriptions();
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
