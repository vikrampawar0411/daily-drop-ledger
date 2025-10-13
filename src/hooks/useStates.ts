import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface State {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useStates = () => {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("states")
        .select("*")
        .order("name");

      if (error) throw error;
      setStates(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching states",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  return {
    states,
    loading,
    refetch: fetchStates,
  };
};
