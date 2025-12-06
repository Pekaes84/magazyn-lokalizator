import { supabase } from "@/integrations/supabase/client";

export interface ProductDetails {
  imageUrl: string | null;
  availability: string;
  productUrl: string | null;
}

export async function scrapeProductDetails(productName: string): Promise<ProductDetails> {
  const { data, error } = await supabase.functions.invoke('scrape-product-details', {
    body: { productName }
  });

  if (error) {
    console.error('Error calling scrape function:', error);
    return {
      imageUrl: null,
      availability: 'Błąd połączenia',
      productUrl: null
    };
  }

  return {
    imageUrl: data?.imageUrl || null,
    availability: data?.availability || 'Brak informacji',
    productUrl: data?.productUrl || null
  };
}
