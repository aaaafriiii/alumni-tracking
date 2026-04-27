# 🎓 Alumni Tracker System (Optimized with SQLite)

Sistem manajemen alumni yang mampu menangani 142.292 data secara instan dan efisien di lingkungan Serverless (Vercel).

## ✨ Fitur Utama

- 🚀 **Ultra Fast Performance**: Menggunakan SQLite untuk akses data kilat tanpa membebani RAM.
- 🔒 **Secure Authentication**: Menggunakan `cookie-session` untuk menjaga status login di Vercel.
- 📊 **Real-time Stats**: Statistik kategori pekerjaan dari ratusan ribu data.
- 🔍 **Powerful Search**: Pencarian cepat berbasis database indexing.

## 🛠️ Teknologi

- **Backend**: Node.js & Express.js
- **Database**: SQLite (Optimized for Serverless)
- **Session**: Cookie-Session
- **Frontend**: Vanilla HTML/CSS/JS (Modern Glassmorphism)

## 🚀 Deployment (Vercel)

Proyek ini menggunakan **SQLite (`alumni.db`)** sebagai pengganti JSON untuk menghindari limitasi memori Vercel.

### Keunggulan SQLite di Vercel:
- **Zero Memory Bloat**: Tidak perlu memuat file JSON besar ke RAM.
- **Fast Startup**: Aplikasi langsung siap tanpa waktu dekompresi.

### Cara Deploy:
1. **Push ke GitHub**: Pastikan file `alumni.db` terunggah (ukuran ~33MB).
2. **Vercel Connect**: Hubungkan repo dan deploy. Sistem akan otomatis berjalan lancar.

## 🔑 Kredensial
- **Username**: `admin`
- **Password**: `alumni2026`
