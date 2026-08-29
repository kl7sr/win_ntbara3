// Cloudflare Pages Function: /api/resolve-google-maps
// Complete Google Places API flow: Short Link Redirect -> Place ID / Find Place -> Place Details -> Place Photos -> Clean Response

interface Env {
  GOOGLE_PLACES_API_KEY?: string;
  VITE_GOOGLE_MAPS_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const urlParam = new URL(context.request.url).searchParams.get('url');
  const apiKey = context.env.GOOGLE_PLACES_API_KEY || context.env.VITE_GOOGLE_MAPS_API_KEY;

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

    // Step 1: Follow Redirects to expand short links (maps.app.goo.gl -> full google.com/maps/place/...)
    const redirectResponse = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.7',
      },
    });

    const finalUrl = redirectResponse.url;
    const rawHtml = await redirectResponse.text();

    // 1. Extract Coordinates from resolved URL
    let lat: number | null = null;
    let lng: number | null = null;

    const placeMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (placeMatch) {
      lat = parseFloat(placeMatch[1]);
      lng = parseFloat(placeMatch[2]);
    }

    if (!lat || !lng) {
      const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        lat = parseFloat(atMatch[1]);
        lng = parseFloat(atMatch[2]);
      }
    }

    if (!lat || !lng) {
      const qMatch = finalUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        lat = parseFloat(qMatch[1]);
        lng = parseFloat(qMatch[2]);
      }
    }

    // 2. Extract Business / Place Name
    let placeName: string = '';
    const placeSlugMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/);
    if (placeSlugMatch && placeSlugMatch[1]) {
      let slug = placeSlugMatch[1];
      try {
        slug = decodeURIComponent(slug);
        slug = decodeURIComponent(slug);
      } catch {}
      slug = slug.split('+').join(' ').replace(/\s+/g, ' ').trim();
      if (slug && !slug.toLowerCase().includes('google maps') && !slug.includes('خرائط')) {
        placeName = slug;
      }
    }

    // 3. Extract Place CID / Feature ID / Place ID candidate
    let placeId: string = '';
    const placeIdParamMatch = finalUrl.match(/[?&]ftid=([^&]+)/) || finalUrl.match(/!1s([^!]+)!/);
    if (placeIdParamMatch && placeIdParamMatch[1]) {
      placeId = placeIdParamMatch[1];
    }

    let phone: string = '';
    let address: string = '';
    let commune: string = '';
    const photos: string[] = [];

    // Step 2 & 3: If Google Places API Key is present, run official Places API Flow
    if (apiKey) {
      try {
        // Find Place ID if not directly extracted
        let targetPlaceId = placeId;
        if (!targetPlaceId && placeName) {
          const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
            placeName + (lat && lng ? ` ${lat},${lng}` : '')
          )}&inputtype=textquery&fields=place_id,name,formatted_address,geometry&key=${apiKey}`;

          const findRes = await fetch(findUrl);
          if (findRes.ok) {
            const findData: any = await findRes.json();
            if (findData.candidates && findData.candidates.length > 0) {
              targetPlaceId = findData.candidates[0].place_id;
              if (findData.candidates[0].name) placeName = findData.candidates[0].name;
            }
          }
        }

        // Fetch Place Details: phone, photos, address, name
        if (targetPlaceId) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${targetPlaceId}&fields=name,formatted_phone_number,international_phone_number,formatted_address,photos,geometry,address_components&key=${apiKey}&language=fr`;
          const detailsRes = await fetch(detailsUrl);
          if (detailsRes.ok) {
            const detailsData: any = await detailsRes.json();
            const result = detailsData.result;

            if (result) {
              if (result.name) placeName = result.name;
              if (result.formatted_phone_number || result.international_phone_number) {
                let rawPhone = result.formatted_phone_number || result.international_phone_number;
                rawPhone = rawPhone.replace(/[\s\-\.]/g, '').trim();
                if (rawPhone.startsWith('+213')) rawPhone = '0' + rawPhone.substring(4);
                phone = rawPhone;
              }
              if (result.formatted_address) {
                address = result.formatted_address;
              }
              if (result.geometry?.location) {
                lat = result.geometry.location.lat;
                lng = result.geometry.location.lng;
              }

              // Step 4: Fetch Real Photo URLs from Photo References
              if (result.photos && result.photos.length > 0) {
                for (const p of result.photos.slice(0, 3)) {
                  if (p.photo_reference) {
                    const photoApiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`;
                    // Follow redirect to obtain persistent CDN image URL
                    const pRes = await fetch(photoApiUrl, { redirect: 'follow' });
                    if (pRes.url && !photos.includes(pRes.url)) {
                      photos.push(pRes.url);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Google Places API call failed, falling back:', e);
      }
    }

    // Step 5: High-Precision Fallback Extraction if no API Key or for fields not yet resolved
    if (!phone) {
      // Look for Algerian numbers: 05, 06, 07, 02 or +213 in page payload
      const unescaped = rawHtml.replace(/\\\//g, '/').replace(/\\u0022/g, '"').replace(/\\/g, '');
      const phoneRegex = /(?:tel:|\"|'|>|:|\s)(\+?213\s*[5672][0-9\s]{7,11}|0[5672][0-9\s]{8,12})(?:\"|'|<|\s|,)/g;
      let pMatch;
      while ((pMatch = phoneRegex.exec(unescaped)) !== null) {
        let candidate = pMatch[1].replace(/[\s\-\.]/g, '').trim();
        if (candidate.startsWith('+213')) candidate = '0' + candidate.substring(4);
        if (candidate.length === 10 && candidate.startsWith('0') && !candidate.startsWith('000')) {
          phone = candidate;
          break;
        }
      }
    }

    // Extract photos from direct place gallery
    if (photos.length === 0) {
      const unescaped = rawHtml.replace(/\\\//g, '/').replace(/\\u0022/g, '"').replace(/\\/g, '');
      const photoRegex = /https:\/\/[a-z0-9\.\_\/-]*googleusercontent\.com\/p\/[a-zA-Z0-9_\-]+/g;
      const foundPhotos = unescaped.match(photoRegex) || [];
      for (const pUrl of foundPhotos) {
        const cleanUrl = pUrl.split('=')[0] + '=w800-h600-k-no';
        if (!photos.includes(cleanUrl) && photos.length < 3) {
          photos.push(cleanUrl);
        }
      }
    }

    // Reverse Geocode Commune & Address in Arabic
    if (lat && lng && (!commune || !address)) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
          { headers: { 'User-Agent': 'WinNtbara3/1.0 (win-ntbara3.pages.dev)' } }
        );
        if (geoRes.ok) {
          const geoData: any = await geoRes.json();
          if (geoData && geoData.address) {
            commune = geoData.address.suburb || geoData.address.town || geoData.address.village || geoData.address.city || '';
            const road = geoData.address.road || '';
            const wilayaName = geoData.address.state || '';
            if (!address) address = [road, commune, wilayaName].filter(Boolean).join('، ');
          }
        }
      } catch (e) {
        console.warn('Geocoding fallback:', e);
      }
    }

    return new Response(
      JSON.stringify({
        success: Boolean(lat && lng),
        finalUrl,
        lat,
        lng,
        title: placeName || undefined,
        phone: phone || undefined,
        address: address || undefined,
        commune: commune || undefined,
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
