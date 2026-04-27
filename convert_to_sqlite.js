const fs = require('fs');
const zlib = require('zlib');
const sqlite3 = require('sqlite3').verbose();

const gzPath = 'alumni_db.json.gz';
const dbPath = 'alumni.db';

console.log("Reading compressed JSON...");
const compressedData = fs.readFileSync(gzPath);
const decompressedData = zlib.gunzipSync(compressedData);
const alumni = JSON.parse(decompressedData.toString());

console.log(`Converting ${alumni.length} records to SQLite...`);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS alumni");
    db.run("CREATE TABLE alumni (id INTEGER PRIMARY KEY, nama TEXT, nim TEXT, prodi TEXT, tahun_lulus TEXT, email TEXT, no_hp TEXT, linkedin TEXT, ig TEXT, fb TEXT, tiktok TEXT, tempat_kerja TEXT, alamat_kerja TEXT, posisi TEXT, tipe_pekerjaan TEXT, sosmed_kantor TEXT)");

    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare(`INSERT INTO alumni VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    
    alumni.forEach((a, i) => {
        stmt.run(
            a.id, a.nama, a.nim, a.prodi, a.tahun_lulus, a.email, a.no_hp,
            a.social_media.linkedin, a.social_media.ig, a.social_media.fb, a.social_media.tiktok,
            a.pekerjaan.tempat, a.pekerjaan.alamat, a.pekerjaan.posisi, a.pekerjaan.tipe, a.pekerjaan.sosmed_kantor
        );
        if ((i + 1) % 10000 === 0) console.log(`Processed ${i + 1} records...`);
    });

    stmt.finalize();
    db.run("COMMIT", (err) => {
        if (err) console.error(err);
        console.log("Conversion finished! File: alumni.db");
        db.close();
    });
});
