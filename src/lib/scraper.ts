import { supabase } from "@/integrations/supabase/client";

export interface ProductDetails {
  success: boolean;
  imageUrl: string | null;
  availability: string | null;
}

export async function scrapeProductDetails(productName: string, productSymbol?: string): Promise<ProductDetails> {
  console.log(`[Scraper] Fetching details for symbol: ${productSymbol}, name: ${productName}`);
  
  const { data, error } = await supabase.functions.invoke('scrape-product-details', {
    body: { productName, productSymbol }
  });

  console.log('[Scraper] Edge function response:', data, error);

  if (error) {
    console.error('[Scraper] Error:', error);
    return { success: false, imageUrl: null, availability: null };
  }

  return {
    success: data?.success ?? false,
    imageUrl: data?.imageUrl || null,
    availability: data?.availability || null,
  };
}
