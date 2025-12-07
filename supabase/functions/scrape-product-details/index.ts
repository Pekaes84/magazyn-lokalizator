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
          formats: ['html'],
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
          waitFor: 3000, // Wait for JS to load
        }),
      });

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || '';
        
        console.log(`[SCRAPER] Scraped ${html.length} bytes of HTML`);

        // Extract main product image - jakobczak.pl uses this pattern:
        // <img class="photo innerzoom productimg" src="https://jakobczak.pl/environment/cache/images/500_500_productGfx_17111/KP032-2.webp">
        const mainImgMatch = html.match(/<img[^>]+class="[^"]*photo[^"]*productimg[^"]*"[^>]+src="([^"]+)"/i) ||
                            html.match(/<img[^>]+class="[^"]*productimg[^"]*photo[^"]*"[^>]+src="([^"]+)"/i);
        
        if (mainImgMatch && mainImgMatch[1]) {
          imageUrl = mainImgMatch[1];
          console.log(`[SCRAPER] Found main product image: ${imageUrl}`);
        }

        // Try alternative: look for productdetailsimgsize container
        if (!imageUrl) {
          const containerMatch = html.match(/<div[^>]+class="[^"]*mainimg[^"]*productdetailsimgsize[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i);
          if (containerMatch && containerMatch[1]) {
            imageUrl = containerMatch[1];
            console.log(`[SCRAPER] Found image from mainimg container: ${imageUrl}`);
          }
        }

        // Try gallery images as fallback
        if (!imageUrl) {
          const galleryMatch = html.match(/<a[^>]+class="gallery[^"]*current"[^>]+href="([^"]+)"/i);
          if (galleryMatch && galleryMatch[1]) {
            imageUrl = galleryMatch[1];
            console.log(`[SCRAPER] Found image from gallery: ${imageUrl}`);
          }
        }

        // Try any image in environment/cache/images with product ID
        if (!imageUrl) {
          const cacheImgMatch = html.match(/src="(https:\/\/jakobczak\.pl\/environment\/cache\/images\/[^"]+)"/i);
          if (cacheImgMatch && cacheImgMatch[1] && !cacheImgMatch[1].includes('1px')) {
            imageUrl = cacheImgMatch[1];
            console.log(`[SCRAPER] Found cached image: ${imageUrl}`);
          }
        }

        // IMPROVED AVAILABILITY DETECTION
        // Priority 1: Check for explicit availability text like "Dostępność: duża ilość"
        const availMatch = html.match(/<span[^>]+class="first"[^>]*>\s*Dostępność:\s*<\/span>\s*<span[^>]+class="second"[^>]*>\s*([^<]+)/i);
        if (availMatch && availMatch[1]) {
          const availText = availMatch[1].trim();
          const availTextLower = availText.toLowerCase();
          console.log(`[SCRAPER] Found availability text: "${availText}"`);
          
          if (availTextLower.includes('brak') || availTextLower.includes('niedostępn') || availText === '0') {
            availability = 'Niedostępny';
          } else if (availTextLower.includes('zamówien')) {
            availability = 'Na zamówienie';
          } else if (availTextLower.includes('duża ilość')) {
            availability = 'duża ilość';
          } else if (availTextLower.includes('średnia ilość')) {
            availability = 'średnia ilość';
          } else if (availTextLower.includes('mała ilość')) {
            availability = 'mała ilość';
          } else if (availTextLower.includes('szt') || availTextLower.includes('dostępn') || /\d+/.test(availText)) {
            availability = 'Dostępny';
          }
        }

        // Priority 2: Check for active "Do koszyka" button (not hidden with "none" class)
        // Look for button.addtobasket that is NOT inside a container with class "none"
        if (!availability) {
          // Check if there's an active addtobasket button in form-basket
          const formBasketMatch = html.match(/<form[^>]+class="form-basket"[^>]*>[\s\S]*?<fieldset[^>]+class="addtobasket-container"[^>]*>[\s\S]*?<button[^>]+class="addtobasket[^"]*"[^>]*>/i);
          if (formBasketMatch) {
            // Check if this form has an ACTIVE addtobasket (not hidden)
            const basketSection = html.match(/<fieldset[^>]+class="addtobasket-container"[^>]*>[\s\S]*?<\/fieldset>/i);
            if (basketSection && !basketSection[0].includes('class="none"') && !basketSection[0].includes('class="hide"')) {
              availability = 'Dostępny';
              console.log('[SCRAPER] Found active "Do koszyka" button - product available');
            }
          }
        }

        // Priority 3: Check for VISIBLE "Powiadom o dostępności" button (unavailable)
        // The button is hidden when product is available: fieldset class="availability-notifier-container none"
        if (!availability) {
          // Look for availability-notifier that is NOT hidden (doesn't have "none" class)
          const notifierMatch = html.match(/<fieldset[^>]+class="availability-notifier-container([^"]*)"[^>]*>/i);
          if (notifierMatch) {
            const classValue = notifierMatch[1] || '';
            // If the class doesn't contain "none" or "hide", the button is visible = product unavailable
            if (!classValue.includes('none') && !classValue.includes('hide')) {
              availability = 'Niedostępny';
              console.log('[SCRAPER] Found VISIBLE "Powiadom o dostępności" - product unavailable');
            } else {
              console.log('[SCRAPER] "Powiadom o dostępności" button is hidden - product is available');
            }
          }
        }

        // Priority 4: Check for schema.org InStock indicator
        if (!availability) {
          if (html.includes('schema.org/InStock')) {
            availability = 'Dostępny';
            console.log('[SCRAPER] Found schema.org/InStock - product available');
          } else if (html.includes('schema.org/OutOfStock')) {
            availability = 'Niedostępny';
            console.log('[SCRAPER] Found schema.org/OutOfStock - product unavailable');
          }
        }

        // Priority 5: Check for explicit unavailable message
        if (!availability) {
          if (html.includes('Ten produkt jest niedostępny')) {
            availability = 'Niedostępny';
            console.log('[SCRAPER] Product page shows unavailable message');
          }
        }

        // Make sure image URL is absolute
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://jakobczak.pl${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
      } else {
        const errText = await scrapeResponse.text();
        console.error(`[SCRAPER] Scrape failed: ${scrapeResponse.status} - ${errText}`);
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
