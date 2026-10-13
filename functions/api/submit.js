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
    const db = env.DB || env['awards-data'] || env.AWARDS_DATA;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: "Cloudflare D1 Database binding 'DB' was not found in environment. Ensure 'awards-data' is bound to variable 'DB' in Pages settings."
      }), {
        status: 500,
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
