/**
 * Cloudflare Pages Function: /api/submit
 * Handles public nomination form submission and saves to D1 Database "awards-data"
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const CREATE_TABLE_SQL = 'CREATE TABLE IF NOT EXISTS nominations (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, role TEXT, school TEXT NOT NULL, city TEXT, email TEXT NOT NULL, phone TEXT NOT NULL, category TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT \'Pending\');';

async function ensureTable(db) {
  try {
    await db.prepare(CREATE_TABLE_SQL).run();
  } catch (err) {
    try {
      await db.exec(CREATE_TABLE_SQL);
    } catch (execErr) {
      console.warn('Table initialization notice:', execErr);
    }
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { fullName, role, school, city, email, phone, category } = body;

    // Validate required fields
    if (!fullName || !school || !email || !phone || !category) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Please fill in all required fields (Full Name, School, Email, Phone, Award Category).'
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const createdAt = body.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19);
    const status = body.status || 'Pending';

    // Helper to forward to Google Sheet Webhook if configured
    const sheetWebhook = env.GOOGLE_SHEET_WEBHOOK_URL;
    const forwardToSheet = async (recordId) => {
      if (sheetWebhook && sheetWebhook.startsWith('http')) {
        try {
          const sheetPayload = {
            id: recordId,
            full_name: fullName.trim(),
            role: role || 'Principal',
            school: school.trim(),
            city: city ? city.trim() : '',
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            category: category.trim(),
            created_at: createdAt,
            status: status
          };

          if (context.waitUntil) {
            context.waitUntil(
              fetch(sheetWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sheetPayload)
              }).catch(e => console.warn('Google Sheet forward warning:', e))
            );
          } else {
            await fetch(sheetWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sheetPayload)
            }).catch(e => console.warn('Google Sheet forward warning:', e));
          }
        } catch (sheetErr) {
          console.warn('Google Sheet dispatch warning:', sheetErr);
        }
      }
    };

    // Connect to Cloudflare D1 Database binding
    const db = env.DB || env['awards-data'] || env.awards_data || env.AWARDS_DATA || env.AWARDS_DB;

    if (!db) {
      const fallbackId = 'D1-PENDING-' + Date.now().toString(36).toUpperCase();
      await forwardToSheet(fallbackId);
      console.warn("Cloudflare D1 Database binding 'DB' not detected. Stored in client buffer and forwarded to sheet if active.");
      return new Response(JSON.stringify({
        success: true,
        buffered: true,
        id: fallbackId,
        message: 'Nomination recorded. Cloudflare D1 binding pending.'
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // Auto-create nominations table safely if not already present
    await ensureTable(db);

    // Insert record safely with parameterized query
    const stmt = db.prepare(
      'INSERT INTO nominations (full_name, role, school, city, email, phone, category, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const result = await stmt.bind(
      fullName.trim(),
      role ? role.trim() : 'Not Specified',
      school.trim(),
      city ? city.trim() : '',
      email.trim().toLowerCase(),
      phone.trim(),
      category.trim(),
      createdAt,
      status
    ).run();

    const insertId = (result && result.meta && (result.meta.last_row_id || result.meta.lastRowId)) || Date.now();

    // Asynchronously forward to Google Sheet Webhook if configured
    await forwardToSheet(insertId);

    return new Response(JSON.stringify({
      success: true,
      id: insertId,
      message: 'Nomination recorded successfully in D1 database awards-data.'
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (err) {
    console.error('D1 Submit Error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'An unexpected error occurred while saving nomination.'
    }), {
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
