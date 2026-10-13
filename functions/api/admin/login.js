/**
 * Cloudflare Pages Function: /api/admin/login
 * Validates admin credentials against configured password (Awadsmmc@123)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const DEFAULT_ADMIN_PASSWORD = 'Awadsmmc@123';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { password } = body;

    const expectedPassword = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (!password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Password is required'
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    if (password === expectedPassword) {
      // Generate standard session auth token
      const sessionPayload = `mmc_awards_admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const token = btoa(`${expectedPassword}:${sessionPayload}`);

      return new Response(JSON.stringify({
        success: true,
        token: token,
        database: 'awards-data',
        databaseId: '47a46db1-2e59-4595-bcf5-01ee1fd29210',
        message: 'Authentication successful. Access granted to Awards Command Center.'
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Incorrect password. Access denied.'
      }), {
        status: 401,
        headers: CORS_HEADERS
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Authentication error'
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
