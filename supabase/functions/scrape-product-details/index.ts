import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'max-age=0',
  'Connection': 'keep-alive',
  'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
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
        JSON.stringify({ success: false, error: 'Brak nazwy produktu', imageUrl: null, availability: null, productUrl: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for: ${searchTerm}`);

    // Try multiple URL formats
    const searchUrls = [
      `https://jakobczak.pl/szukaj?q=${encodeURIComponent(searchTerm)}`,
      `https://jakobczak.pl/szukaj?s=${encodeURIComponent(searchTerm)}`,
      `https://jakobczak.pl/search?q=${encodeURIComponent(searchTerm)}`,
    ];

    let html = '';
    let successfulUrl = '';
    
    for (const url of searchUrls) {
      console.log(`Trying URL: ${url}`);
      try {
        const response = await fetch(url, { headers: browserHeaders });
        console.log(`Response status for ${url}: ${response.status}`);
        
        if (response.ok) {
          html = await response.text();
          successfulUrl = url;
          console.log(`Success! Got ${html.length} bytes from ${url}`);
          break;
        }
      } catch (e) {
        console.log(`Failed to fetch ${url}: ${e}`);
      }
    }

    if (!html) {
      console.log('All search URLs failed, returning fallback');
      return new Response(
        JSON.stringify({ 
          success: false, 
          imageUrl: null, 
          availability: null, 
          productUrl: `https://jakobczak.pl/szukaj?q=${encodeURIComponent(searchTerm)}`,
          searchTerm 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse HTML with cheerio
    const $ = cheerio.load(html);
    
    let imageUrl: string | null = null;
    let availability: string | null = null;
    let productUrl: string | null = null;

    // Strategy 1: Try og:image meta tag
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && !ogImage.includes('logo')) {
      imageUrl = ogImage;
      console.log(`Found og:image: ${imageUrl}`);
    }

    // Strategy 2: Try common product image selectors
    if (!imageUrl) {
      const imageSelectors = [
        '.product-image img',
        '.product-thumbnail img',
        '.product-miniature img',
        '.product-cover img',
        '.js-qv-product-cover',
        '[data-id-product] img',
        '.thumbnail-container img',
        '.product-images img',
        'article.product-miniature img',
        '.products img',
      ];

      for (const selector of imageSelectors) {
        const img = $(selector).first();
        const src = img.attr('data-src') || img.attr('data-full-size-image-url') || img.attr('src');
        if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('banner')) {
          imageUrl = src.startsWith('http') ? src : `https://jakobczak.pl${src.startsWith('/') ? '' : '/'}${src}`;
          console.log(`Found image via selector ${selector}: ${imageUrl}`);
          break;
        }
      }
    }

    // Strategy 3: Find any product image in HTML
    if (!imageUrl) {
      $('img').each((_, el) => {
        if (imageUrl) return;
        const src = $(el).attr('data-src') || $(el).attr('src');
        if (src && src.includes('jakobczak') && !src.includes('logo') && !src.includes('icon')) {
          imageUrl = src;
          console.log(`Found fallback image: ${imageUrl}`);
        }
      });
    }

    // Find product URL
    const productUrlSelectors = [
      'a.product-thumbnail',
      'a.thumbnail',
      '.product-miniature a',
      'article a[href*=".html"]',
      'a[href*="/p/"]',
      '.product-title a',
    ];

    for (const selector of productUrlSelectors) {
      const link = $(selector).first().attr('href');
      if (link && !link.includes('regulamin') && !link.includes('kontakt')) {
        productUrl = link.startsWith('http') ? link : `https://jakobczak.pl${link.startsWith('/') ? '' : '/'}${link}`;
        console.log(`Found product URL: ${productUrl}`);
        break;
      }
    }

    // Check availability in text content
    const bodyText = $('body').text().toLowerCase();
    if (bodyText.includes('dostępny') || bodyText.includes('w magazynie') || bodyText.includes('dodaj do koszyka')) {
      availability = 'Dostępny';
    } else if (bodyText.includes('niedostępny') || bodyText.includes('brak w magazynie')) {
      availability = 'Niedostępny';
    } else if (bodyText.includes('na zamówienie')) {
      availability = 'Na zamówienie';
    }

    // If we found a product URL but no image, try fetching product page
    if (productUrl && !imageUrl) {
      try {
        console.log(`Fetching product page: ${productUrl}`);
        const productResponse = await fetch(productUrl, { headers: browserHeaders });
        if (productResponse.ok) {
          const productHtml = await productResponse.text();
          const $product = cheerio.load(productHtml);
          
          // Try og:image first
          const productOgImage = $product('meta[property="og:image"]').attr('content');
          if (productOgImage) {
            imageUrl = productOgImage;
            console.log(`Found product page og:image: ${imageUrl}`);
          }
          
          // Try product cover image
          if (!imageUrl) {
            const coverImg = $product('.product-cover img, .product-image img, #product-images img').first();
            const src = coverImg.attr('data-src') || coverImg.attr('src');
            if (src) {
              imageUrl = src.startsWith('http') ? src : `https://jakobczak.pl${src}`;
              console.log(`Found product cover image: ${imageUrl}`);
            }
          }

          // Check availability on product page
          const productText = $product('body').text().toLowerCase();
          if (productText.includes('dostępny') || productText.includes('dodaj do koszyka')) {
            availability = 'Dostępny';
          } else if (productText.includes('niedostępny')) {
            availability = 'Niedostępny';
          }
        }
      } catch (e) {
        console.log(`Error fetching product page: ${e}`);
      }
    }

    const result = {
      success: true,
      imageUrl,
      availability,
      productUrl: productUrl || `https://jakobczak.pl/szukaj?q=${encodeURIComponent(searchTerm)}`,
      searchTerm,
    };

    console.log(`Final result:`, JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in scrape-product-details:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        imageUrl: null,
        availability: null,
        productUrl: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
