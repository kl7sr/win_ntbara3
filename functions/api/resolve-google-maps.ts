// Cloudflare Pages Function: /api/resolve-google-maps
// Resolves shortened Google Maps links (maps.app.goo.gl), extracts coordinates, place title, and photos

export const onRequestGet: PagesFunction = async (context) => {
  const urlParam = new URL(context.request.url).searchParams.get('url');

  if (!urlParam) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let targetUrl = urlParam.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Follow redirect on Cloudflare server-side (Bypasses CORS restrictions)
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,fr;q=0.9,en;q=0.8',
      },
    });

    const finalUrl = response.url;
    const htmlText = await response.text();

    // 1. Extract Coordinates
    let lat: number | null = null;
    let lng: number | null = null;

    // Match @lat,lng,zoom
    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }

    // Match !3dlat!4dlng (Google Maps Place format)
    if (!lat || !lng) {
      const placeMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (placeMatch) {
        lat = parseFloat(placeMatch[1]);
        lng = parseFloat(placeMatch[2]);
      }
    }

    // Match ?q=lat,lng or ll=lat,lng
    if (!lat || !lng) {
      const qMatch = finalUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        lat = parseFloat(qMatch[1]);
        lng = parseFloat(qMatch[2]);
      }
    }

    // Match within HTML source if still not found in URL
    if (!lat || !lng) {
      const htmlCoordMatch = htmlText.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
      if (htmlCoordMatch) {
        lat = parseFloat(htmlCoordMatch[1]);
        lng = parseFloat(htmlCoordMatch[2]);
      }
    }

    // 2. Extract Place Title
    let title: string = '';
    
    // OpenGraph meta title
    const ogTitleMatch = htmlText.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) 
      || htmlText.match(/<title>([^<]+)<\/title>/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].replace(/ - Google Maps$/, '').replace(/^Google Maps - /, '').trim();
    }

    // Fallback: extract place name from URL slug
    if (!title || title === 'Google Maps') {
      const placeSlugMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/);
      if (placeSlugMatch) {
        title = decodeURIComponent(placeSlugMatch[1].replace(/\+/g, ' '));
      }
    }

    // 3. Extract Photos (og:image + googleusercontent photos)
    const photos: string[] = [];

    // OG Image
    const ogImageMatch = htmlText.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch && !ogImageMatch[1].includes('maps_preview') && !ogImageMatch[1].includes('staticmap')) {
      photos.push(ogImageMatch[1]);
    }

    // Find lh5/lh3 googleusercontent photo URLs inside page
    const photoRegex = /https:\/\/lh[3-6]\.googleusercontent\.com\/p\/[a-zA-Z0-9_\-]+/g;
    const foundPhotos = htmlText.match(photoRegex) || [];
    for (const pUrl of foundPhotos) {
      const fullSizeUrl = pUrl + '=s800'; // High resolution 800px
      if (!photos.includes(fullSizeUrl) && photos.length < 3) {
        photos.push(fullSizeUrl);
      }
    }

    return new Response(
      JSON.stringify({
        success: Boolean(lat && lng),
        finalUrl,
        lat,
        lng,
        title: title || undefined,
        photos: photos.slice(0, 3),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to resolve link: ' + err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
