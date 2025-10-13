import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Area {
  id: string;
  name: string;
  description: string | null;
  status: string;
  city_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useAreas = (vendorId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data as Area[];
    },
  });

  const createArea = useMutation({
    mutationFn: async (newArea: { name: string; description?: string; status?: string }) => {
      const { data, error } = await supabase
        .from("areas")
        .insert([{ ...newArea, status: newArea.status || 'active' }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "Success",
        description: "Area created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create area",
        variant: "destructive",
      });
    },
  });

  const updateArea = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("areas")
        .update({ name })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "Success",
        description: "Area updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update area",
        variant: "destructive",
      });
    },
  });

  const deleteArea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("areas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "Success",
        description: "Area deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete area",
        variant: "destructive",
      });
    },
  });

  return {
    areas,
    isLoading,
    createArea: createArea.mutate,
    updateArea: updateArea.mutate,
    deleteArea: deleteArea.mutate,
  };
};
