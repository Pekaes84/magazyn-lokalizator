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

      // First, let's try to get all items to debug
      console.log("Searching for:", searchTerm);
      
      const { data, error } = await externalSupabase
        .from("Lokalizacje")
        .select("*")
        .or(`Symbol.ilike.%${searchTerm}%,Nazwa.ilike.%${searchTerm}%`)
        .order("Symbol")
        .limit(50);

      console.log("Search results:", data, "Error:", error);

      if (error) {
        console.error("Error fetching inventory:", error);
        throw error;
      }

      return data as InventoryItem[];
    },
    enabled: searchTerm.length >= 2,
  });
}

// Debug function to check if table has any data
export function useInventoryDebug() {
  return useQuery({
    queryKey: ["inventory-debug"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("Lokalizacje")
        .select("*")
        .limit(5);

      console.log("Debug - First 5 items:", data, "Error:", error);
      return { data, error };
    },
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
