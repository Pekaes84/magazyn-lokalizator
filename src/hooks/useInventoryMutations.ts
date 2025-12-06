import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateInventoryData {
  sku: string;
  location: string;
}

interface UpdateInventoryData {
  id: string;
  sku: string;
  location: string;
}

export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInventoryData) => {
      const { data: result, error } = await supabase
        .from("inventory")
        .insert({
          sku: data.sku,
          location: data.location,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Sukces",
        description: "Towar został dodany pomyślnie",
      });
    },
    onError: (error) => {
      console.error("Error creating inventory:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać towaru",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateInventoryData) => {
      const { data: result, error } = await supabase
        .from("inventory")
        .update({
          sku: data.sku,
          location: data.location,
          last_updated: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Sukces",
        description: "Towar został zaktualizowany",
      });
    },
    onError: (error) => {
      console.error("Error updating inventory:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować towaru",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Sukces",
        description: "Towar został usunięty",
      });
    },
    onError: (error) => {
      console.error("Error deleting inventory:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć towaru",
        variant: "destructive",
      });
    },
  });
}
