const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy for Vercel
app.set('trust proxy', 1);

// Health check
app.get('/api/health', (req, res) => {
    const dbExists = fs.existsSync(path.join(__dirname, 'alumni.db'));
    res.json({ status: 'ok', dbExists: dbExists, dirname: __dirname });
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Explicit routes for HTML pages
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(publicPath, 'dashboard.html')));

app.use(cookieSession({
    name: 'alumni-session',
    keys: ['alumni-secret-key'],
    maxAge: 24 * 60 * 60 * 1000
}));

// SQLite Connection (Open once)
const dbPath = path.join(__dirname, 'alumni.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) console.error("Error opening database:", err);
    else console.log("Connected to SQLite database.");
});

// Login Credentials
const USERS = [{ username: 'admin', password: 'alumni2026' }];

// Auth Middleware
const checkAuth = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.status(401).json({ message: 'Unauthorized' });
};

// API Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.isLoggedIn = true;
        req.session.username = username;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy ? req.session.destroy() : (req.session = null);
    res.json({ success: true });
});

// Optimized Paginated Alumni API with SQLite
app.get('/api/alumni', checkAuth, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    let query = "SELECT * FROM alumni";
    let countQuery = "SELECT COUNT(*) as count FROM alumni";
    let params = [];

    if (search) {
        query += " WHERE nama LIKE ? OR nim LIKE ?";
        countQuery += " WHERE nama LIKE ? OR nim LIKE ?";
        params = [`%${search}%`, `%${search}%`];
    }

    query += " LIMIT ? OFFSET ?";
    const queryParams = [...params, limit, offset];

    // Get Data and Total Count
    db.get(countQuery, params, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const total = row.count;

        db.all(query, queryParams, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            // Stats (PNS vs others) - Calculated from the full set (might be slow for 142k, but SQLite handles it)
            db.get("SELECT COUNT(*) as count FROM alumni WHERE tipe_pekerjaan = 'PNS'", (err, pnsRow) => {
                const pnsCount = pnsRow ? pnsRow.count : 0;
                
                // Map DB rows to the format expected by frontend
                const data = rows.map(r => ({
                    id: r.id,
                    nama: r.nama,
                    nim: r.nim,
                    prodi: r.prodi,
                    tahun_lulus: r.tahun_lulus,
                    social_media: { linkedin: r.linkedin, ig: r.ig, fb: r.fb, tiktok: r.tiktok },
                    email: r.email,
                    no_hp: r.no_hp,
                    pekerjaan: { tempat: r.tempat_kerja, alamat: r.alamat_kerja, posisi: r.posisi, tipe: r.tipe_pekerjaan, sosmed_kantor: r.sosmed_kantor }
                }));

                res.json({
                    total: total,
                    page: page,
                    limit: limit,
                    data: data,
                    stats: { pns: pnsCount, working: total - pnsCount }
                });
            });
        });
    });
});

app.get('/api/session', (req, res) => {
    res.json({ loggedIn: !!req.session.isLoggedIn, user: req.session.username });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

module.exports = app;
