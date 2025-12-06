import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InventoryItem {
  id: string;
  sku: string;
  location: string;
  last_updated: string;
}

export function useInventorySearch(searchTerm: string) {
  return useQuery({
    queryKey: ["inventory", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .ilike("sku", `%${searchTerm}%`)
        .order("sku")
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
      const { data, error } = await supabase
        .from("inventory")
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
