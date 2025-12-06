import { supabase } from "@/integrations/supabase/client";

export interface ProductDetails {
  success: boolean;
  imageUrl: string | null;
  availability: string | null;
  productUrl: string | null;
  searchTerm?: string;
}

export async function scrapeProductDetails(productName: string, productSymbol?: string): Promise<ProductDetails> {
  console.log(`[Scraper] Fetching details for: ${productName}, symbol: ${productSymbol}`);
  
  const { data, error } = await supabase.functions.invoke('scrape-product-details', {
    body: { productName, productSymbol }
  });

  console.log('[Scraper] Response:', { data, error });

  if (error) {
    console.error('[Scraper] Error calling scrape function:', error);
    return {
      success: false,
      imageUrl: null,
      availability: null,
      productUrl: `https://jakobczak.pl/szukaj?q=${encodeURIComponent(productSymbol || productName)}`
    };
  }

  return {
    success: data?.success ?? false,
    imageUrl: data?.imageUrl || null,
    availability: data?.availability || null,
    productUrl: data?.productUrl || `https://jakobczak.pl/szukaj?q=${encodeURIComponent(productSymbol || productName)}`,
    searchTerm: data?.searchTerm
  };
}
