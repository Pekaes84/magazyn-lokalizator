import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName } = await req.json();
    
    if (!productName) {
      console.error('No product name provided');
      return new Response(
        JSON.stringify({ error: 'Nazwa produktu jest wymagana' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for product: ${productName}`);

    // Search on jakobczak.pl
    const searchQuery = encodeURIComponent(productName);
    const searchUrl = `https://jakobczak.pl/szukaj?controller=search&s=${searchQuery}`;
    
    console.log(`Fetching URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          imageUrl: null, 
          availability: 'Nie można sprawdzić dostępności',
          productUrl: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    console.log(`Received HTML length: ${html.length}`);

    // Parse the HTML to find product image and availability
    let imageUrl: string | null = null;
    let availability = 'Brak informacji o dostępności';
    let productUrl: string | null = null;

    // Try to find product image from search results
    // Look for product thumbnail in search results
    const imgPatterns = [
      /src="(https?:\/\/jakobczak\.pl\/\d+-[^"]+\.jpg)"/gi,
      /data-src="(https?:\/\/jakobczak\.pl\/[^"]+\.jpg)"/gi,
      /src="(https?:\/\/[^"]*jakobczak[^"]*\.jpg)"/gi,
    ];

    for (const pattern of imgPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !match[1].includes('logo') && !match[1].includes('icon')) {
          imageUrl = match[1];
          break;
        }
      }
      if (imageUrl) break;
    }

    // Look for product URL
    const urlPattern = /href="(https?:\/\/jakobczak\.pl\/[^"]*\.html)"/gi;
    const urlMatches = html.matchAll(urlPattern);
    for (const match of urlMatches) {
      if (match[1] && !match[1].includes('regulamin') && !match[1].includes('kontakt')) {
        productUrl = match[1];
        break;
      }
    }

    // Check availability patterns
    if (html.includes('Dostępny') || html.includes('dostępny') || html.includes('W magazynie')) {
      availability = 'Dostępny';
    } else if (html.includes('Niedostępny') || html.includes('niedostępny') || html.includes('Brak')) {
      availability = 'Niedostępny';
    } else if (html.includes('Na zamówienie')) {
      availability = 'Na zamówienie';
    } else if (html.includes('Produkt') || html.includes('produkt')) {
      availability = 'Sprawdź na stronie';
    }

    // If we found a product URL but no image, try fetching the product page directly
    if (productUrl && !imageUrl) {
      try {
        console.log(`Fetching product page: ${productUrl}`);
        const productResponse = await fetch(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });
        
        if (productResponse.ok) {
          const productHtml = await productResponse.text();
          
          // Look for main product image
          const mainImgPattern = /src="(https?:\/\/jakobczak\.pl\/\d+-large_default\/[^"]+\.jpg)"/i;
          const mainMatch = productHtml.match(mainImgPattern);
          if (mainMatch) {
            imageUrl = mainMatch[1];
          }
          
          // Check availability on product page
          if (productHtml.includes('Dostępny') || productHtml.includes('W magazynie')) {
            availability = 'Dostępny';
          } else if (productHtml.includes('Niedostępny')) {
            availability = 'Niedostępny';
          }
        }
      } catch (e) {
        console.log('Error fetching product page:', e);
      }
    }

    console.log(`Found - Image: ${imageUrl}, Availability: ${availability}, URL: ${productUrl}`);

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        availability,
        productUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in scrape-product-details:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        imageUrl: null,
        availability: 'Błąd podczas pobierania danych'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
