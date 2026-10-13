const http = require('http');
const fs = require('fs');
const path = require('path');

let port = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'nominations.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Awadsmmc@123';

// Ensure data folder and file exist for local mock storage
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([
    {
      id: 1,
      full_name: "Dr. Sunita Sharma",
      role: "Principal",
      school: "Delhi Public School, R.K. Puram",
      city: "New Delhi",
      email: "principal@dpsrkp.net",
      phone: "+91 98112 34567",
      category: "Best School Leadership Award",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString().replace('T', ' ').substring(0, 19),
      status: "Verified"
    },
    {
      id: 2,
      full_name: "Mr. Rajesh Nair",
      role: "Vice-Principal",
      school: "The Heritage School",
      city: "Gurugram",
      email: "rajesh.nair@heritage.edu.in",
      phone: "+91 98765 43210",
      category: "Best STEM Education Award",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString().replace('T', ' ').substring(0, 19),
      status: "Shortlisted"
    },
    {
      id: 3,
      full_name: "Ms. Ananya Sengupta",
      role: "School Counsellor",
      school: "Modern High School for Girls",
      city: "Kolkata",
      email: "ananya.s@mhs.ac.in",
      phone: "+91 94330 12345",
      category: "Best Career Guidance Award",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString().replace('T', ' ').substring(0, 19),
      status: "Pending"
    }
  ], null, 2), 'utf8');
}

function getNominations() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveNominations(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function isAuthorized(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.substring(7).trim();
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    return decoded.startsWith(`${ADMIN_PASSWORD}:`);
  } catch (e) {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = decodeURI(parsedUrl.pathname);

  // Set standard CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API ROUTING (Local Fallback matching Cloudflare D1 Functions) ---

  // POST /api/submit
  if (reqPath === '/api/submit' && req.method === 'POST') {
    const body = await readBody(req);
    const { fullName, role, school, city, email, phone, category } = body;

    if (!fullName || !school || !email || !phone || !category) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
      return;
    }

    const items = getNominations();
    const newId = items.length ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
    const record = {
      id: newId,
      full_name: fullName.trim(),
      role: role || 'Not Specified',
      school: school.trim(),
      city: (city || '').trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      category: category.trim(),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending'
    };

    items.unshift(record);
    saveNominations(items);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      id: newId,
      message: 'Nomination saved successfully in awards-data.'
    }));
    return;
  }

  // POST /api/admin/login
  if (reqPath === '/api/admin/login' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.password === ADMIN_PASSWORD) {
      const token = Buffer.from(`${ADMIN_PASSWORD}:session_${Date.now()}`).toString('base64');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        token: token,
        database: 'awards-data',
        databaseId: '47a46db1-2e59-4595-bcf5-01ee1fd29210',
        message: 'Authentication successful'
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Incorrect password. Access denied.' }));
    }
    return;
  }

  // GET /api/admin/submissions
  if (reqPath === '/api/admin/submissions' && req.method === 'GET') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }
    const items = getNominations();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      database: 'awards-data',
      databaseId: '47a46db1-2e59-4595-bcf5-01ee1fd29210',
      count: items.length,
      data: items
    }));
    return;
  }

  // PATCH /api/admin/submissions
  if (reqPath === '/api/admin/submissions' && req.method === 'PATCH') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }
    const body = await readBody(req);
    const items = getNominations();
    const item = items.find(i => String(i.id) === String(body.id));
    if (item) {
      item.status = body.status;
      saveNominations(items);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Status updated' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Record not found' }));
    }
    return;
  }

  // DELETE /api/admin/submissions
  if (reqPath === '/api/admin/submissions' && req.method === 'DELETE') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }
    const id = parsedUrl.searchParams.get('id');
    let items = getNominations();
    items = items.filter(i => String(i.id) !== String(id));
    saveNominations(items);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Deleted' }));
    return;
  }

  // --- STATIC ROUTING ---

  // Handle root
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }
  // Handle /admin and /admin/
  if (reqPath === '/admin' || reqPath === '/admin/') {
    reqPath = '/admin/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.stat(filePath, (fileErr, fileStats) => {
      if (fileErr || !fileStats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });
});

function startServer(p) {
  server.listen(p, () => {
    console.log(`\n  ➜ Local:   http://localhost:${p}/`);
    console.log(`  ➜ Admin:   http://localhost:${p}/admin`);
    console.log(`  ➜ Root:    ${PUBLIC_DIR}\n`);
    console.log(`Press Ctrl+C to stop.\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${port} is currently in use, trying port ${port + 1}...`);
    port += 1;
    setTimeout(() => startServer(port), 200);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

startServer(port);
