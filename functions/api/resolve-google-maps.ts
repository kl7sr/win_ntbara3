// Cloudflare Pages Function: /api/resolve-google-maps
// Resolves Google Maps links, cleans title, extracts coordinates, address, commune, phone, and photos

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

    // 1. Follow redirect to get final expanded Google Maps URL and HTML
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.7',
      },
    });

    const finalUrl = response.url;
    let htmlText = await response.text();

    // 2. Extract Exact Coordinates
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

    // 3. Extract Clean Place Title
    let title: string = '';
    const placeSlugMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/);
    if (placeSlugMatch && placeSlugMatch[1]) {
      let slug = placeSlugMatch[1];
      try {
        slug = decodeURIComponent(slug);
        slug = decodeURIComponent(slug);
      } catch {}
      slug = slug.split('+').join(' ').replace(/\s+/g, ' ').trim();
      if (slug && !slug.toLowerCase().includes('google maps') && !slug.includes('خرائط')) {
        title = slug;
      }
    }

    if (!title) {
      const ogTitleMatch = htmlText.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) 
        || htmlText.match(/<title>([^<]+)<\/title>/i);
      if (ogTitleMatch) {
        let candidate = ogTitleMatch[1]
          .replace(/ - Google Maps.*$/i, '')
          .replace(/^Google Maps - /i, '')
          .replace(/ - خرائط Google.*$/i, '')
          .replace(/^خرائط Google - /i, '')
          .trim();
        candidate = candidate.split('+').join(' ').replace(/\s+/g, ' ').trim();
        if (candidate && candidate !== 'Google Maps' && candidate !== 'خرائط Google') {
          title = candidate;
        }
      }
    }

    // 4. Extract Phone Number (Direct from Maps HTML or Google Knowledge Search)
    let phone: string = '';
    const phoneRegex = /(?:tel:|\"|'|>|\s)(0[5672][0-9\s]{8,12}|\+213\s*[5672][0-9\s]{8,11})(?:\"|'|<|\s)/g;
    let pMatch;
    while ((pMatch = phoneRegex.exec(htmlText)) !== null) {
      let candidatePhone = pMatch[1].replace(/[\s\-\.]/g, '').trim();
      if (candidatePhone.startsWith('+213')) {
        candidatePhone = '0' + candidatePhone.substring(4);
      }
      if (candidatePhone.length === 10 && candidatePhone.startsWith('0')) {
        phone = candidatePhone;
        break;
      }
    }

    // If phone not in Maps HTML, search Google for the place contact
    if (!phone && title) {
      try {
        const searchRes = await fetch(
          `https://www.google.com/search?q=${encodeURIComponent(title + ' algerie telephone')}&hl=fr`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8',
            },
          }
        );
        if (searchRes.ok) {
          const searchText = await searchRes.text();
          let sMatch;
          while ((sMatch = phoneRegex.exec(searchText)) !== null) {
            let candidate = sMatch[1].replace(/[\s\-\.]/g, '').trim();
            if (candidate.startsWith('+213')) candidate = '0' + candidate.substring(4);
            if (candidate.length === 10 && candidate.startsWith('0')) {
              phone = candidate;
              break;
            }
          }
        }
      } catch (e) {
        console.warn('Google search phone fetch error:', e);
      }
    }

    // 5. Reverse Geocode for High-Accuracy Address and Commune
    let address: string = '';
    let commune: string = '';
    let wilayaName: string = '';

    if (lat && lng) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
          { headers: { 'User-Agent': 'WinNtbara3/1.0 (win-ntbara3.pages.dev)' } }
        );
        if (geoRes.ok) {
          const geoData: any = await geoRes.json();
          if (geoData && geoData.address) {
            commune = geoData.address.suburb || geoData.address.town || geoData.address.village || geoData.address.city || '';
            wilayaName = geoData.address.state || '';
            const road = geoData.address.road || '';
            address = [road, commune, wilayaName].filter(Boolean).join('، ');
          }
        }
      } catch (e) {
        console.warn('Reverse geocode fallback:', e);
      }
    }

    if (!address) {
      const addressMetaMatch = htmlText.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i);
      if (addressMetaMatch && addressMetaMatch[1] && !addressMetaMatch[1].toLowerCase().includes('find local businesses')) {
        let candidateAddr = addressMetaMatch[1].replace(/^·\s*/, '').trim();
        candidateAddr = candidateAddr.split('+').join(' ').replace(/\s+/g, ' ').trim();
        if (candidateAddr.length > 3) {
          address = candidateAddr;
        }
      }
    }

    // 6. Extract Photos
    const photos: string[] = [];

    // Check og:image
    const ogImageMatch = htmlText.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch && !ogImageMatch[1].includes('maps_preview') && !ogImageMatch[1].includes('staticmap')) {
      photos.push(ogImageMatch[1]);
    }

    // Check googleusercontent URLs in HTML
    const photoRegex = /https:\/\/[a-z0-9\.\_\/-]*googleusercontent\.com\/p\/[a-zA-Z0-9_\-]+/g;
    const foundPhotos = htmlText.match(photoRegex) || [];
    for (const pUrl of foundPhotos) {
      const cleanUrl = pUrl.split('=')[0] + '=w800-h600-k-no';
      if (!photos.includes(cleanUrl) && photos.length < 3) {
        photos.push(cleanUrl);
      }
    }

    // If fewer than 3 photos, generate clean OpenStreetMap / Mapbox / Satellite location visual previews
    if (photos.length === 0 && lat && lng) {
      photos.push(`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=600,400&z=16&l=sat,skl&pt=${lng},${lat},pm2rdm`);
      photos.push(`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=600,400&z=17&l=map&pt=${lng},${lat},pm2grm`);
    }

    return new Response(
      JSON.stringify({
        success: Boolean(lat && lng),
        finalUrl,
        lat,
        lng,
        title: title || undefined,
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
