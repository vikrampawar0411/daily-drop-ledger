import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { toast } = useToast();

  const { data: states = [], isLoading: loading } = useQuery({
    queryKey: ["states"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("states")
        .select("*")
        .order("name");

      if (error) {
        toast({
          title: "Error fetching states",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data as State[];
    },
  });

  return {
    states,
    loading,
  };
};
