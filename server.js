const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(publicPath, 'dashboard.html')));

app.use(cookieSession({
    name: 'alumni-session',
    keys: ['alumni-secret-key'],
    maxAge: 24 * 60 * 60 * 1000
}));

// Global DB instance
let db;

// Initialize SQL.js
async function initDatabase() {
    if (db) return db;
    const SQL = await initSqlJs({
        locateFile: file => path.join(__dirname, file)
    });
    const dbPath = path.join(__dirname, 'alumni.db');
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log("SQL.js Database initialized.");
    return db;
}

// Ensure DB is loaded before handling requests
app.use(async (req, res, next) => {
    try {
        await initDatabase();
        next();
    } catch (err) {
        res.status(500).json({ error: "Failed to initialize database: " + err.message });
    }
});

const USERS = [{ username: 'admin', password: 'alumni2026' }];

const checkAuth = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.status(401).json({ message: 'Unauthorized' });
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.isLoggedIn = true;
        req.session.username = username;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

app.get('/api/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
});

app.get('/api/alumni', checkAuth, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    let query = "SELECT * FROM alumni";
    let countQuery = "SELECT COUNT(*) as count FROM alumni";
    let params = {};

    if (search) {
        query += " WHERE nama LIKE :search OR nim LIKE :search";
        countQuery += " WHERE nama LIKE :search OR nim LIKE :search";
        params = { ':search': `%${search}%` };
    }

    query += ` LIMIT ${limit} OFFSET ${offset}`;

    try {
        // Total Count
        const countRes = db.exec(countQuery, params);
        const total = countRes[0].values[0][0];

        // Data
        const dataRes = db.exec(query, params);
        const columns = dataRes[0] ? dataRes[0].columns : [];
        const values = dataRes[0] ? dataRes[0].values : [];

        // Stats
        const pnsRes = db.exec("SELECT COUNT(*) FROM alumni WHERE tipe_pekerjaan = 'PNS'");
        const pnsCount = pnsRes[0].values[0][0];

        // Format
        const data = values.map(row => {
            const obj = {};
            columns.forEach((col, i) => obj[col] = row[i]);
            return {
                id: obj.id,
                nama: obj.nama,
                nim: obj.nim,
                prodi: obj.prodi,
                tahun_lulus: obj.tahun_lulus,
                social_media: { linkedin: obj.linkedin, ig: obj.ig, fb: obj.fb, tiktok: obj.tiktok },
                email: obj.email,
                no_hp: obj.no_hp,
                pekerjaan: { tempat: obj.tempat_kerja, alamat: obj.alamat_kerja, posisi: obj.posisi, tipe: obj.tipe_pekerjaan, sosmed_kantor: obj.sosmed_kantor }
            };
        });

        res.json({
            total: total,
            page: page,
            limit: limit,
            data: data,
            stats: { pns: pnsCount, working: total - pnsCount }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/session', (req, res) => {
    res.json({ loggedIn: !!req.session.isLoggedIn, user: req.session.username });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

module.exports = app;
