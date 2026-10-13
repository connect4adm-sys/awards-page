/**
 * Cloudflare Pages Function: /api/admin/submissions
 * Provides authenticated CRUD access to nominations in D1 Database "awards-data"
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const DEFAULT_ADMIN_PASSWORD = 'Awardsmmc@123';

function isAuthorized(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.substring(7).trim();
  try {
    const decoded = atob(token);
    const expectedPassword = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    return decoded.startsWith(`${expectedPassword}:`);
  } catch (e) {
    return false;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Please log in.' }), {
      status: 401,
      headers: CORS_HEADERS
    });
  }

  const db = env.DB || env['awards-data'] || env.awards_data || env.AWARDS_DATA || env.AWARDS_DB;
  if (!db) {
    return new Response(JSON.stringify({
      success: true,
      database: 'awards-data',
      databaseId: '47a46db1-2e59-4595-bcf5-01ee1fd29210',
      count: 0,
      data: [],
      google_sheet_webhook: env.GOOGLE_SHEET_WEBHOOK_URL || '',
      d1_connected: false,
      warning: "D1 Database binding 'DB' not configured. Bind D1 'awards-data' to variable 'DB' in Cloudflare Pages Settings."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  try {
    // Ensure table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS nominations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        role TEXT,
        school TEXT NOT NULL,
        city TEXT,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Pending'
      );
    `);

    const { results } = await db.prepare(
      'SELECT id, full_name, role, school, city, email, phone, category, created_at, status FROM nominations ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({
      success: true,
      database: 'awards-data',
      databaseId: '47a46db1-2e59-4595-bcf5-01ee1fd29210',
      count: results ? results.length : 0,
      data: results || [],
      google_sheet_webhook: env.GOOGLE_SHEET_WEBHOOK_URL || '',
      d1_connected: true
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: CORS_HEADERS
    });
  }

  const db = env.DB || env['awards-data'] || env.awards_data || env.AWARDS_DATA || env.AWARDS_DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'D1 Database not bound' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }

  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return new Response(JSON.stringify({ success: false, error: 'Missing id or status' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await db.prepare('UPDATE nominations SET status = ? WHERE id = ?').bind(status, id).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Nomination #${id} status updated to ${status}`
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: CORS_HEADERS
    });
  }

  const db = env.DB || env['awards-data'] || env.awards_data || env.AWARDS_DATA || env.AWARDS_DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'D1 Database not bound' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing id query parameter' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await db.prepare('DELETE FROM nominations WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Nomination #${id} successfully removed`
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}
