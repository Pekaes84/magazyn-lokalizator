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
    const { productName, productSymbol } = await req.json();
    
    if (!productName && !productSymbol) {
      console.error('No product name or symbol provided');
      return new Response(
        JSON.stringify({ error: 'Nazwa produktu jest wymagana' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use product name for search (more likely to find results)
    const searchTerm = productName || productSymbol;
    console.log(`Searching for product: ${searchTerm}`);

    // Search on jakobczak.pl
    const searchQuery = encodeURIComponent(searchTerm);
    const searchUrl = `https://jakobczak.pl/szukaj?controller=search&s=${searchQuery}`;
    
    console.log(`Fetching URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
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
    // Look for both src and data-src attributes (lazy loading)
    const imgPatterns = [
      // data-src patterns (lazy loading)
      /data-src="(https?:\/\/jakobczak\.pl\/[^"]+\.jpg)"/gi,
      /data-src="(\/[^"]+\.jpg)"/gi,
      // Regular src patterns
      /src="(https?:\/\/jakobczak\.pl\/\d+-[^"]+\.jpg)"/gi,
      /src="(https?:\/\/jakobczak\.pl\/[^"]+\.jpg)"/gi,
      // Environment/cache paths
      /(?:src|data-src)="(\/environment\/cache\/images\/[^"]+\.(?:jpg|png|webp))"/gi,
    ];

    for (const pattern of imgPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !match[1].includes('logo') && !match[1].includes('icon') && !match[1].includes('banner')) {
          let imgUrl = match[1];
          // Convert relative URLs to absolute
          if (imgUrl.startsWith('/')) {
            imgUrl = `https://jakobczak.pl${imgUrl}`;
          }
          imageUrl = imgUrl;
          console.log(`Found image URL: ${imageUrl}`);
          break;
        }
      }
      if (imageUrl) break;
    }

    // Look for product URL
    const urlPatterns = [
      /href="(https?:\/\/jakobczak\.pl\/[^"]*\.html)"/gi,
      /href="(\/[^"]*\.html)"/gi,
    ];
    
    for (const pattern of urlPatterns) {
      const urlMatches = html.matchAll(pattern);
      for (const match of urlMatches) {
        if (match[1] && !match[1].includes('regulamin') && !match[1].includes('kontakt') && !match[1].includes('polityka')) {
          let url = match[1];
          if (url.startsWith('/')) {
            url = `https://jakobczak.pl${url}`;
          }
          productUrl = url;
          console.log(`Found product URL: ${productUrl}`);
          break;
        }
      }
      if (productUrl) break;
    }

    // Check availability patterns
    if (html.includes('Dostępny') || html.includes('dostępny') || html.includes('W magazynie') || html.includes('w magazynie')) {
      availability = 'Dostępny';
    } else if (html.includes('Niedostępny') || html.includes('niedostępny') || html.includes('Brak w magazynie')) {
      availability = 'Niedostępny';
    } else if (html.includes('Na zamówienie') || html.includes('na zamówienie')) {
      availability = 'Na zamówienie';
    } else if (html.includes('product-miniature') || html.includes('products-grid')) {
      // Found product listing but no explicit availability
      availability = 'Sprawdź na stronie';
    }

    // If we found a product URL but no image, try fetching the product page directly
    if (productUrl && !imageUrl) {
      try {
        console.log(`Fetching product page: ${productUrl}`);
        const productResponse = await fetch(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pl-PL,pl;q=0.9',
          },
        });
        
        if (productResponse.ok) {
          const productHtml = await productResponse.text();
          
          // Look for main product image with various patterns
          const productImgPatterns = [
            /data-src="(https?:\/\/jakobczak\.pl\/[^"]+large[^"]*\.jpg)"/i,
            /src="(https?:\/\/jakobczak\.pl\/\d+-large_default\/[^"]+\.jpg)"/i,
            /data-image-large-src="([^"]+)"/i,
            /src="(https?:\/\/jakobczak\.pl\/[^"]+\.jpg)"/i,
          ];
          
          for (const pattern of productImgPatterns) {
            const match = productHtml.match(pattern);
            if (match && match[1]) {
              let imgUrl = match[1];
              if (imgUrl.startsWith('/')) {
                imgUrl = `https://jakobczak.pl${imgUrl}`;
              }
              imageUrl = imgUrl;
              console.log(`Found product page image: ${imageUrl}`);
              break;
            }
          }
          
          // Check availability on product page
          if (productHtml.includes('Dostępny') || productHtml.includes('W magazynie')) {
            availability = 'Dostępny';
          } else if (productHtml.includes('Niedostępny') || productHtml.includes('Brak')) {
            availability = 'Niedostępny';
          }
        }
      } catch (e) {
        console.log('Error fetching product page:', e);
      }
    }

    console.log(`Result - Image: ${imageUrl}, Availability: ${availability}, URL: ${productUrl}`);

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
        availability: 'Błąd podczas pobierania danych',
        productUrl: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
