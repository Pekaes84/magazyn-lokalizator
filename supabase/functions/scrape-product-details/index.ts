import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

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
      console.error('No search term provided');
      return new Response(
        JSON.stringify({ success: false, imageUrl: null, availability: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SCRAPER] Searching for: "${searchTerm}"`);

    // PrestaShop standard search URL
    const searchUrl = `https://jakobczak.pl/szukaj?controller=search&s=${encodeURIComponent(searchTerm)}`;
    console.log(`[SCRAPER] Fetching: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
    });

    console.log(`[SCRAPER] Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[SCRAPER] HTTP error: ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, imageUrl: null, availability: null, error: `HTTP ${response.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    console.log(`[SCRAPER] Received ${html.length} bytes of HTML`);

    const $ = cheerio.load(html);
    
    let imageUrl: string | null = null;
    let availability: string | null = null;

    // Find first product container (PrestaShop selectors)
    const productSelectors = [
      'article.product-miniature',
      '.product-miniature',
      '.product-container',
      '.product-item',
      '.js-product-miniature',
      '[data-id-product]',
      '.products article',
      '.product-grid article',
    ];

    let productContainer = null;
    for (const selector of productSelectors) {
      productContainer = $(selector).first();
      if (productContainer.length > 0) {
        console.log(`[SCRAPER] Found product with selector: ${selector}`);
        break;
      }
    }

    if (productContainer && productContainer.length > 0) {
      // Extract image from product container
      const img = productContainer.find('img').first();
      const imgSrc = img.attr('data-full-size-image-url') || 
                     img.attr('data-src') || 
                     img.attr('src');
      
      if (imgSrc) {
        imageUrl = imgSrc.startsWith('http') ? imgSrc : `https://jakobczak.pl${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
        console.log(`[SCRAPER] Found image: ${imageUrl}`);
      }

      // Extract availability from product container
      const availabilitySelectors = [
        '.availability',
        '.stock',
        '.product-availability',
        '[data-stock]',
        '.available',
        '.in-stock',
        '.out-of-stock',
      ];

      for (const selector of availabilitySelectors) {
        const availEl = productContainer.find(selector);
        if (availEl.length > 0) {
          const text = availEl.text().trim().toLowerCase();
          console.log(`[SCRAPER] Found availability element: "${text}"`);
          if (text.includes('dostępny') || text.includes('w magazynie')) {
            availability = 'Dostępny';
          } else if (text.includes('niedostępny') || text.includes('brak')) {
            availability = 'Niedostępny';
          } else if (text.includes('zamówienie')) {
            availability = 'Na zamówienie';
          }
          if (availability) break;
        }
      }

      // Fallback: check entire product container text
      if (!availability) {
        const containerText = productContainer.text().toLowerCase();
        if (containerText.includes('dostępny') || containerText.includes('koszyka')) {
          availability = 'Dostępny';
        } else if (containerText.includes('niedostępny') || containerText.includes('brak')) {
          availability = 'Niedostępny';
        }
      }
    }

    // Fallback: scan entire page for image if not found in container
    if (!imageUrl) {
      console.log('[SCRAPER] No image in container, scanning page...');
      const pageImgSelectors = [
        '.product-cover img',
        '.product-image img',
        '.thumbnail-container img',
        '#product-images img',
      ];
      
      for (const selector of pageImgSelectors) {
        const img = $(selector).first();
        const src = img.attr('data-src') || img.attr('src');
        if (src && !src.includes('logo') && !src.includes('icon')) {
          imageUrl = src.startsWith('http') ? src : `https://jakobczak.pl${src}`;
          console.log(`[SCRAPER] Found page image: ${imageUrl}`);
          break;
        }
      }
    }

    // Check page-wide availability if not found
    if (!availability) {
      const bodyText = $('body').text().toLowerCase();
      if (bodyText.includes('dodaj do koszyka')) {
        availability = 'Dostępny';
      }
    }

    console.log(`[SCRAPER] Final result - Image: ${imageUrl}, Availability: ${availability}`);

    return new Response(
      JSON.stringify({ 
        success: !!(imageUrl || availability),
        imageUrl, 
        availability 
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
