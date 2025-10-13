import { useQuery } from "@tanstack/react-query";
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
  const { toast } = useToast();

  const { data: cities = [], isLoading: loading } = useQuery({
    queryKey: ["cities", stateId],
    queryFn: async () => {
      let query = supabase
        .from("cities")
        .select("*")
        .order("name");

      if (stateId) {
        query = query.eq("state_id", stateId);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error fetching cities",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data as City[];
    },
  });

  return {
    cities,
    loading,
  };
};
