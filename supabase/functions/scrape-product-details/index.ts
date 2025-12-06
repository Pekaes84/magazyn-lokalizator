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
      console.error('[SCRAPER] No search term provided');
      return new Response(
        JSON.stringify({ success: false, imageUrl: null, availability: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SCRAPER] Searching for: "${searchTerm}"`);

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
      },
    });

    console.log(`[SCRAPER] Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[SCRAPER] HTTP error: ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, imageUrl: null, availability: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    console.log(`[SCRAPER] Received ${html.length} bytes of HTML`);

    const $ = cheerio.load(html);
    
    let imageUrl: string | null = null;
    let availability: string | null = null;

    // Find first product - jakobczak.pl uses .product.row or div[data-product-id]
    const productContainer = $('div.product.row, div[data-product-id]').first();
    
    if (productContainer.length > 0) {
      console.log('[SCRAPER] Found product container');
      
      // Extract image - images use data-src for lazy loading
      const img = productContainer.find('img').first();
      const imgSrc = img.attr('data-src') || img.attr('src');
      
      if (imgSrc && !imgSrc.includes('1px.gif') && !imgSrc.includes('base64')) {
        // Convert relative path to absolute
        imageUrl = imgSrc.startsWith('http') ? imgSrc : `https://jakobczak.pl${imgSrc}`;
        console.log(`[SCRAPER] Found image: ${imageUrl}`);
      }

      // Check if product has "Do koszyka" button = available
      const addToCartBtn = productContainer.find('button.addtobasket, .addtobasket');
      if (addToCartBtn.length > 0) {
        availability = 'Dostępny';
        console.log('[SCRAPER] Found add to cart button - product available');
      }
    } else {
      console.log('[SCRAPER] No product container found, trying alternative selectors');
      
      // Try alternative selectors
      const altImg = $('img[data-src*="/environment/cache/images/"]').first();
      const altSrc = altImg.attr('data-src');
      if (altSrc) {
        imageUrl = altSrc.startsWith('http') ? altSrc : `https://jakobczak.pl${altSrc}`;
        console.log(`[SCRAPER] Found alt image: ${imageUrl}`);
      }
    }

    // Check page text for availability if not found
    if (!availability) {
      const bodyText = $('body').text().toLowerCase();
      if (bodyText.includes('do koszyka') || bodyText.includes('dodaj do koszyka')) {
        availability = 'Dostępny';
      } else if (bodyText.includes('niedostępny') || bodyText.includes('brak w magazynie')) {
        availability = 'Niedostępny';
      } else if (bodyText.includes('na zamówienie')) {
        availability = 'Na zamówienie';
      }
    }

    // Check if no products found
    if (!imageUrl && !availability) {
      const noResultsText = $('body').text();
      if (noResultsText.includes('Brak produktów') || noResultsText.includes('Nie znaleziono')) {
        console.log('[SCRAPER] No products found for this search');
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
