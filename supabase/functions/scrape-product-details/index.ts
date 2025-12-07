import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productSymbol } = await req.json();
    const searchTerm = productSymbol || productName;
    
    if (!searchTerm) {
      console.error('[SCRAPER] No search term provided');
      return new Response(
        JSON.stringify({ success: false, imageUrl: null, availability: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      console.error('[SCRAPER] FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, imageUrl: null, availability: null, error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SCRAPER] Searching for: "${searchTerm}" using Firecrawl`);

    // Use Firecrawl search to find the product on jakobczak.pl
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:jakobczak.pl ${searchTerm}`,
        limit: 3,
        scrapeOptions: {
          formats: ['markdown', 'html'],
        }
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`[SCRAPER] Firecrawl search error: ${searchResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ success: false, imageUrl: null, availability: null, error: 'Search failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log(`[SCRAPER] Firecrawl search returned ${searchData.data?.length || 0} results`);

    let imageUrl: string | null = null;
    let availability: string | null = null;
    let productUrl: string | null = null;

    // Find the best matching product URL
    if (searchData.data && searchData.data.length > 0) {
      for (const result of searchData.data) {
        const url = result.url || '';
        // Look for product pages (contain /p/ in URL)
        if (url.includes('/pl/p/') || url.includes('jakobczak.pl/p/')) {
          productUrl = url;
          console.log(`[SCRAPER] Found product URL: ${productUrl}`);
          break;
        }
      }

      // If no product page found, use first result
      if (!productUrl && searchData.data[0]?.url) {
        productUrl = searchData.data[0].url;
        console.log(`[SCRAPER] Using first result URL: ${productUrl}`);
      }
    }

    // If we found a product URL, scrape it directly for better data
    if (productUrl) {
      console.log(`[SCRAPER] Scraping product page: ${productUrl}`);
      
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: productUrl,
          formats: ['html'],
          waitFor: 2000, // Wait for JS to load
        }),
      });

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || '';
        
        console.log(`[SCRAPER] Scraped ${html.length} bytes of HTML`);

        // Extract main product image from HTML
        // Look for og:image meta tag first (most reliable)
        const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                            html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
        if (ogImageMatch) {
          imageUrl = ogImageMatch[1];
          console.log(`[SCRAPER] Found og:image: ${imageUrl}`);
        }

        // If no og:image, look for product image in HTML
        if (!imageUrl) {
          // Look for main product image container
          const productImgMatch = html.match(/<img[^>]+class="[^"]*mainimg[^"]*"[^>]+src="([^"]+)"/i) ||
                                  html.match(/<img[^>]+id="[^"]*mainimg[^"]*"[^>]+src="([^"]+)"/i) ||
                                  html.match(/<div[^>]+class="[^"]*product-image[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i) ||
                                  html.match(/<a[^>]+class="[^"]*mainimg[^"]*"[^>]+href="([^"]+)"/i);
          
          if (productImgMatch) {
            imageUrl = productImgMatch[1];
            // Handle data-src lazy loading
            const dataSrcMatch = html.match(/<img[^>]+class="[^"]*mainimg[^"]*"[^>]+data-src="([^"]+)"/i);
            if (dataSrcMatch && !dataSrcMatch[1].includes('1px')) {
              imageUrl = dataSrcMatch[1];
            }
            console.log(`[SCRAPER] Found product image: ${imageUrl}`);
          }
        }

        // If still no image, try finding any large product image
        if (!imageUrl) {
          const imgMatches = html.matchAll(/<img[^>]+src="(https:\/\/jakobczak\.pl\/[^"]+\/products\/[^"]+)"/gi);
          for (const match of imgMatches) {
            if (!match[1].includes('1px') && !match[1].includes('thumbnail')) {
              imageUrl = match[1];
              console.log(`[SCRAPER] Found product image from products folder: ${imageUrl}`);
              break;
            }
          }
        }

        // Check availability
        if (html.includes('Do koszyka') || html.includes('do koszyka') || html.includes('addtobasket')) {
          availability = 'Dostępny';
          console.log('[SCRAPER] Product is available (add to cart button found)');
        } else if (html.includes('niedostępny') || html.includes('Niedostępny') || html.includes('brak w magazynie')) {
          availability = 'Niedostępny';
          console.log('[SCRAPER] Product is unavailable');
        } else if (html.includes('na zamówienie') || html.includes('Na zamówienie')) {
          availability = 'Na zamówienie';
          console.log('[SCRAPER] Product is available on order');
        } else if (html.includes('Ten produkt jest niedostępny')) {
          availability = 'Niedostępny';
          console.log('[SCRAPER] Product page shows unavailable');
        }

        // Make sure image URL is absolute
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://jakobczak.pl${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
      } else {
        console.error(`[SCRAPER] Scrape failed: ${scrapeResponse.status}`);
      }
    }

    console.log(`[SCRAPER] Final result - Image: ${imageUrl}, Availability: ${availability}`);

    return new Response(
      JSON.stringify({ 
        success: !!(imageUrl || availability),
        imageUrl, 
        availability,
        productUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SCRAPER] Error: ${msg}`);
    return new Response(
      JSON.stringify({ success: false, imageUrl: null, availability: null, error: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
