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

    // Connect to Cloudflare D1 Database binding
    const db = env.DB || env['awards-data'] || env.awards_data || env.AWARDS_DATA || env.AWARDS_DB;

    if (!db) {
      // If D1 is not bound yet in Cloudflare dashboard, return success with notice
      // so the browser stores it in local buffer and user is not blocked
      console.warn("Cloudflare D1 Database binding 'DB' not detected. Stored in client buffer.");
      return new Response(JSON.stringify({
        success: true,
        buffered: true,
        id: 'D1-PENDING-' + Date.now().toString(36).toUpperCase(),
        message: 'Nomination recorded. Cloudflare D1 binding pending.'
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // Auto-create nominations table if it does not already exist
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

    // Insert record safely with parameterized query
    const stmt = db.prepare(`
      INSERT INTO nominations (full_name, role, school, city, email, phone, category, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `);

    const result = await stmt.bind(
      fullName.trim(),
      role ? role.trim() : 'Not Specified',
      school.trim(),
      city ? city.trim() : '',
      email.trim().toLowerCase(),
      phone.trim(),
      category.trim()
    ).run();

    const insertId = result.meta && result.meta.last_row_id ? result.meta.last_row_id : Date.now();

    // Asynchronously forward to Google Sheet Webhook if configured
    const sheetWebhook = env.GOOGLE_SHEET_WEBHOOK_URL;
    if (sheetWebhook && sheetWebhook.startsWith('http')) {
      try {
        const sheetPayload = {
          id: insertId,
          full_name: fullName.trim(),
          role: role || 'Principal',
          school: school.trim(),
          city: city ? city.trim() : '',
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          category: category.trim(),
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Pending'
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
          fetch(sheetWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sheetPayload)
          }).catch(e => console.warn('Google Sheet forward warning:', e));
        }
      } catch (sheetErr) {
        console.warn('Google Sheet dispatch warning:', sheetErr);
      }
    }

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
