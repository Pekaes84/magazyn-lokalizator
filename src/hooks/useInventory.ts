import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/externalSupabase";

export interface InventoryItem {
  id: string;
  Symbol: string;
  "Kod kreskowy": string | null;
  Nazwa: string | null;
  Kontener: string | null;
  Regał: string | null;
  Półka: string | null;
}

export function useInventorySearch(searchTerm: string) {
  return useQuery({
    queryKey: ["inventory", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const { data, error } = await externalSupabase
        .from("Lokalizacje")
        .select("*")
        .ilike("Symbol", `%${searchTerm}%`)
        .order("Symbol")
        .limit(50);

      if (error) {
        console.error("Error fetching inventory:", error);
        throw error;
      }

      return data as InventoryItem[];
    },
    enabled: searchTerm.length >= 2,
  });
}

export function useInventoryById(id: string) {
  return useQuery({
    queryKey: ["inventory", "single", id],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("Lokalizacje")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching inventory item:", error);
        throw error;
      }

      return data as InventoryItem | null;
    },
    enabled: !!id,
  });
}
