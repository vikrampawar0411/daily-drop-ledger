import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface City {
  id: string;
  state_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useCities = (stateId?: string) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCities = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("cities")
        .select("*")
        .order("name");

      if (stateId) {
        query = query.eq("state_id", stateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCities(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching cities",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, [stateId]);

  return {
    cities,
    loading,
    refetch: fetchCities,
  };
};
