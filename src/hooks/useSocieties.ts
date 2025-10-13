import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Society {
  id: string;
  vendor_id: string;
  area_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const useSocieties = (areaId?: string, vendorId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: societies = [], isLoading } = useQuery({
    queryKey: ["societies", areaId, vendorId],
    queryFn: async () => {
      let query = supabase.from("societies").select("*").order("name");
      
      if (areaId) {
        query = query.eq("area_id", areaId);
      }
      if (vendorId) {
        query = query.eq("vendor_id", vendorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Society[];
    },
    enabled: !!areaId || !!vendorId,
  });

  const createSociety = useMutation({
    mutationFn: async (newSociety: { vendor_id: string; area_id: string; name: string }) => {
      const { data, error } = await supabase
        .from("societies")
        .insert([newSociety])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["societies"] });
      toast({
        title: "Success",
        description: "Society created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create society",
        variant: "destructive",
      });
    },
  });

  const updateSociety = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("societies")
        .update({ name })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["societies"] });
      toast({
        title: "Success",
        description: "Society updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update society",
        variant: "destructive",
      });
    },
  });

  const deleteSociety = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("societies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["societies"] });
      toast({
        title: "Success",
        description: "Society deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete society",
        variant: "destructive",
      });
    },
  });

  return {
    societies,
    isLoading,
    createSociety: createSociety.mutate,
    updateSociety: updateSociety.mutate,
    deleteSociety: deleteSociety.mutate,
  };
};
