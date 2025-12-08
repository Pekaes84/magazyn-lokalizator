import { useMutation, useQueryClient } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/externalSupabase";
import { toast } from "@/hooks/use-toast";

interface CreateInventoryData {
  Symbol: string;
  Nazwa?: string;
  Kontener?: string;
  Regał?: string;
  Półka?: string;
}

interface UpdateInventoryData {
  originalSymbol: string;
  Symbol: string;
  Nazwa?: string;
  Kontener?: string;
  Regał?: string;
  Półka?: string;
}

export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInventoryData) => {
      const { data: result, error } = await externalSupabase
        .from("Lokalizacje")
        .insert({
          Symbol: data.Symbol,
          Nazwa: data.Nazwa || null,
          Kontener: data.Kontener || null,
          Regał: data.Regał || null,
          Półka: data.Półka || null,
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
      const { error, count } = await externalSupabase
        .from("Lokalizacje")
        .update({
          Symbol: data.Symbol,
          Nazwa: data.Nazwa || null,
          Kontener: data.Kontener || null,
          Regał: data.Regał || null,
          Półka: data.Półka || null,
        })
        .eq("Symbol", data.originalSymbol);

      if (error) throw error;
      return { success: true };
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
      const { error } = await externalSupabase.from("Lokalizacje").delete().eq("id", id);
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