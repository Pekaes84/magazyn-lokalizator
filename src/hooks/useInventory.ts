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
        console.log("Search term too short:", searchTerm);
        return [];
      }

      console.log("Searching for:", searchTerm);
      
      try {
        // First, let's check if we can access the table at all
        const { data: testData, error: testError } = await externalSupabase
          .from("Lokalizacje")
          .select("*")
          .limit(5);
        
        console.log("Table access test:", { testData, testError });
        
        const { data, error } = await externalSupabase
          .from("Lokalizacje")
          .select("*")
          .or(`Symbol.ilike.%${searchTerm}%,Nazwa.ilike.%${searchTerm}%`)
          .order("Symbol")
          .limit(50);

        console.log("Search result:", { data, error });

        if (error) {
          console.error("Error fetching inventory:", error);
          throw error;
        }

        return data as InventoryItem[];
      } catch (err) {
        console.error("Unexpected error during search:", err);
        throw err;
      }
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
