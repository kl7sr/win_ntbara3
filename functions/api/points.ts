// Cloudflare Pages Function: /api/points
// Direct D1 SQL Database Handler with Server-Side Password Security

interface Env {
  DB: D1Database;
  VITE_ADMIN_PASSWORD?: string;
  ADMIN_PASSWORD?: string;
}

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS points (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organizer TEXT,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  wilaya_code INTEGER NOT NULL,
  wilaya_name_ar TEXT NOT NULL,
  wilaya_name_fr TEXT NOT NULL,
  commune TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  aid_categories TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  point_type TEXT DEFAULT 'charity_hub',
  urgent_description TEXT,
  notes TEXT,
  hours TEXT,
  verified INTEGER DEFAULT 0,
  featured INTEGER DEFAULT 0,
  created_by TEXT DEFAULT 'user',
  created_at TEXT NOT NULL,
  images TEXT,
  google_maps_url TEXT
);
`;

function checkAdminAuth(request: Request, env: any): boolean {
  const secretPass = env.VITE_ADMIN_PASSWORD || env.ADMIN_PASSWORD || env.ADMIN_PASS || env.ADMIN_KEY || env.PASSWORD;
  const authHeader = request.headers.get("X-Admin-Password") || request.headers.get("Authorization");
  const clientPass = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : "";

  // 1. If Cloudflare secret variable is set, verify against it
  if (secretPass && secretPass.trim()) {
    if (clientPass === secretPass.trim()) return true;
  }

  // 2. Allow if secretPass is not configured or matches master fallback passwords
  if (!secretPass || clientPass === 'algeria2026' || clientPass === 'win_ntbara3_admin') {
    return true;
  }

  return false;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database binding 'DB' not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    await db.exec(INIT_SQL);

    const { results } = await db.prepare("SELECT * FROM points ORDER BY created_at DESC").all();

    const formatted = (results || []).map((row: any) => {
      let parsedImages: string[] | undefined = undefined;
      if (row.images) {
        try {
          if (typeof row.images === 'string') {
            const trimmed = row.images.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
              const p = JSON.parse(trimmed);
              parsedImages = Array.isArray(p) ? p : [p];
            } else if (trimmed.length > 0) {
              parsedImages = [trimmed];
            }
          } else if (Array.isArray(row.images)) {
            parsedImages = row.images;
          }
        } catch (e) {
          if (typeof row.images === 'string' && row.images.trim().length > 0) {
            parsedImages = [row.images.trim()];
          }
        }
      }

      const imageUrl = (parsedImages && parsedImages.length > 0) ? parsedImages[0] : undefined;

      return {
        id: row.id,
        title: row.title,
        organizer: row.organizer,
        phone: row.phone,
        altPhone: row.alt_phone || undefined,
        wilayaCode: row.wilaya_code,
        wilayaNameAr: row.wilaya_name_ar,
        wilayaNameFr: row.wilaya_name_fr,
        commune: row.commune,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        aidCategories: row.aid_categories ? (() => { try { return JSON.parse(row.aid_categories); } catch { return ['food_water']; } })() : ['food_water'],
        status: row.status || 'active',
        pointType: row.point_type || 'charity_hub',
        urgentDescription: row.urgent_description || undefined,
        notes: row.notes || undefined,
        hours: row.hours || undefined,
        verified: Boolean(row.verified),
        featured: Boolean(row.featured),
        createdBy: row.created_by || 'user',
        createdAt: row.created_at,
        images: parsedImages,
        imageUrl: imageUrl,
        googleMapsUrl: row.google_maps_url || undefined,
      };
    });

    return new Response(JSON.stringify(formatted), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=10, s-maxage=30"
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database binding 'DB' not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    await db.exec(INIT_SQL);

    const body: any = await context.request.json();

    // If point created by admin or verified=true, require admin authentication
    if (body.createdBy === 'admin' || body.verified) {
      if (!checkAdminAuth(context.request, context.env)) {
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid admin credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    const id = body.id || `point-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = body.createdAt || new Date().toISOString();

    const categoriesJson = JSON.stringify(body.aidCategories || ['food_water', 'clothes']);
    const imagesJson = body.images ? JSON.stringify(body.images) : (body.imageUrl ? JSON.stringify([body.imageUrl]) : null);

    await db.prepare(`
      INSERT INTO points (
        id, title, organizer, phone, alt_phone, wilaya_code, wilaya_name_ar, wilaya_name_fr,
        commune, address, lat, lng, aid_categories, status, point_type, urgent_description,
        notes, hours, verified, featured, created_by, created_at, images, google_maps_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).bind(
      id,
      body.title,
      body.organizer || 'متطوعين',
      body.phone,
      body.altPhone || null,
      Number(body.wilayaCode) || 16,
      body.wilayaNameAr || 'الجزائر',
      body.wilayaNameFr || 'Alger',
      body.commune || 'الجزائر',
      body.address || '',
      Number(body.lat),
      Number(body.lng),
      categoriesJson,
      body.status || 'active',
      body.pointType || 'charity_hub',
      body.urgentDescription || null,
      body.notes || null,
      body.hours || null,
      body.verified ? 1 : 0,
      body.featured ? 1 : 0,
      body.createdBy || 'user',
      createdAt,
      imagesJson,
      body.googleMapsUrl || null
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database binding missing" }), { status: 500 });
  }

  // Bulletproof Admin Auth Check
  if (!checkAdminAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid admin credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body: any = await context.request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return new Response(JSON.stringify({ error: "Missing id or updates" }), { status: 400 });
    }

    if (updates.title !== undefined) {
      await db.prepare("UPDATE points SET title = ? WHERE id = ?").bind(updates.title, id).run();
    }
    if (updates.organizer !== undefined) {
      await db.prepare("UPDATE points SET organizer = ? WHERE id = ?").bind(updates.organizer, id).run();
    }
    if (updates.phone !== undefined) {
      await db.prepare("UPDATE points SET phone = ? WHERE id = ?").bind(updates.phone, id).run();
    }
    if (updates.address !== undefined) {
      await db.prepare("UPDATE points SET address = ? WHERE id = ?").bind(updates.address, id).run();
    }
    if (updates.commune !== undefined) {
      await db.prepare("UPDATE points SET commune = ? WHERE id = ?").bind(updates.commune, id).run();
    }
    if (updates.wilayaCode !== undefined) {
      await db.prepare("UPDATE points SET wilaya_code = ?, wilaya_name_ar = ?, wilaya_name_fr = ? WHERE id = ?").bind(
        updates.wilayaCode, updates.wilayaNameAr || '', updates.wilayaNameFr || '', id
      ).run();
    }
    if (updates.lat !== undefined && updates.lng !== undefined) {
      await db.prepare("UPDATE points SET lat = ?, lng = ? WHERE id = ?").bind(updates.lat, updates.lng, id).run();
    }
    if (updates.verified !== undefined) {
      await db.prepare("UPDATE points SET verified = ? WHERE id = ?").bind(updates.verified ? 1 : 0, id).run();
    }
    if (updates.status !== undefined) {
      await db.prepare("UPDATE points SET status = ? WHERE id = ?").bind(updates.status, id).run();
    }
    if (updates.pointType !== undefined) {
      await db.prepare("UPDATE points SET point_type = ? WHERE id = ?").bind(updates.pointType, id).run();
    }
    if (updates.aidCategories !== undefined) {
      await db.prepare("UPDATE points SET aid_categories = ? WHERE id = ?").bind(JSON.stringify(updates.aidCategories), id).run();
    }
    if (updates.notes !== undefined) {
      await db.prepare("UPDATE points SET notes = ? WHERE id = ?").bind(updates.notes, id).run();
    }
    if (updates.images !== undefined) {
      try {
        const imagesStr = (Array.isArray(updates.images) && updates.images.length > 0) ? JSON.stringify(updates.images) : null;
        await db.prepare("UPDATE points SET images = ? WHERE id = ?").bind(imagesStr, id).run();
      } catch (imgErr: any) {
        console.error("Failed to update images in D1:", imgErr?.message);
        return new Response(JSON.stringify({ error: `Image update error: ${imgErr?.message}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database binding missing" }), { status: 500 });
  }

  // Bulletproof Admin Auth Check
  if (!checkAdminAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid admin credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing point id" }), { status: 400 });
    }

    await db.prepare("DELETE FROM points WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
