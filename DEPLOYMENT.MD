# Panduan Deployment: Absence Registration & Coupon Management System

Panduan lengkap untuk melakukan deployment sistem **Absence** ke cloud production:
- **Frontend:** [Vercel](https://vercel.com) (React 19 + TypeScript + Vite)
- **Backend:** [Railway](https://railway.app) (Laravel 11 REST API)
- **Database:** [Railway PostgreSQL](https://railway.app) (Managed Database)
- **CI/CD:** Otomatis deploy setiap kali melakukan `git push` ke repositori GitHub.

---

## 1. Arsitektur Deployment & Alur Kerja

```
                           +---------------------------+
                           |        GitHub Repo        |
                           |  (main / master branch)   |
                           +-------------+-------------+
                                         |
                   +---------------------+---------------------+
                   | git push                                  | git push
                   v                                           v
       +-----------------------+                   +-----------------------+
       |     VERCEL (Frontend) |                   |   RAILWAY (Backend)   |
       |  React + Vite + TS    |                   |       Laravel 11      |
       |  https://*.vercel.app |                   |  https://*.railway.app|
       +-----------+-----------+                   +-----------+-----------+
                   |                                           |
                   | API Request (HTTPS / Bearer Token)        | Internal TCP (5432)
                   +------------------------------------------>|
                                                               v
                                                   +-----------------------+
                                                   |  RAILWAY POSTGRESQL   |
                                                   |    Managed Database   |
                                                   +-----------------------+
```

---

## 2. Persiapan Repositori GitHub

Anda dapat menggunakan struktur **Monorepo (Satu Repositori)** yang mencakup folder `absence-backend` dan `absence-frontend`. Ini adalah pendekatan paling praktis dan direkomendasikan.

### Langkah Inisialisasi & Push ke GitHub:

1. Buat repositori baru di akun GitHub Anda (misalnya: `absence-event-system`), biarkan kosong tanpa README.
2. Buka terminal di direktori root project (`/home/ark/absence`):

```bash
# Masuk ke direktori root project
cd /home/ark/absence

# Inisialisasi git pada root project (jika belum)
git init

# Tambahkan semua file ke staging (file sensitif .env sudah diabaikan oleh .gitignore)
git add .

# Buat commit pertama
git commit -m "feat: complete frontend-backend integration with postgresql"

# Ubah branch utama menjadi main
git branch -M main

# Hubungkan dengan remote repository GitHub Anda (ganti URL sesuai repo Anda)
git remote add origin https://github.com/USERNAME_ANDA/absence-event-system.git

# Push ke GitHub
git push -u origin main
```

---

## 3. Deployment Database & Backend di Railway

### Langkah 3.1: Buat Proyek Baru & Database PostgreSQL

1. Buka [Railway Dashboard](https://railway.app) dan login dengan akun GitHub Anda.
2. Klik tombol **"+ New Project"**.
3. Pilih **"Provision PostgreSQL"**.
4. Railway akan membuat instance PostgreSQL dalam beberapa detik.
5. Klik kartu layanan **Postgres**, lalu buka tab **Variables**. Anda akan melihat variabel koneksi seperti `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, dan `PGDATABASE`.

---

### Langkah 3.2: Hubungkan Backend Laravel ke Railway

1. Di dalam project yang sama di Railway, klik **"+ Create"** atau **"+ New"** di pojok kanan atas.
2. Pilih **"GitHub Repo"**, lalu pilih repositori GitHub Anda (`absence-event-system`).
3. Setelah service ditambahkan, klik service tersebut dan buka tab **Settings**:
   - **Service Name:** Ubah menjadi `absence-backend` (opsional, untuk kerapian).
   - **Root Directory:** Isi dengan `absence-backend` *(Sangat penting jika menggunakan monorepo!)*.
4. Buka tab **Variables**, lalu tambahkan Environment Variables berikut:

| Nama Variabel | Nilai / Deskripsi | Contoh Nilai |
|---|---|---|
| `APP_NAME` | Nama aplikasi | `EduPass` |
| `APP_ENV` | Mode environment | `production` |
| `APP_KEY` | Kunci enkripsi Laravel (32-char base64) | Salin dari `.env` lokal Anda atau generate dengan `php artisan key:generate --show` |
| `APP_DEBUG` | Nonaktifkan debug untuk keamanan | `false` |
| `APP_URL` | URL backend Railway Anda (diisi setelah domain di-generate) | `https://absence-backend-production.up.railway.app` |
| `DB_CONNECTION` | Driver database | `pgsql` |
| `DATABASE_URL` | Referensi ke database Railway Postgres | `${{Postgres.DATABASE_URL}}` |
| `FRONTEND_URL` | URL frontend Vercel (untuk CORS) | `https://your-project.vercel.app` (atau `*`) |
| `SESSION_DRIVER` | Driver session | `database` atau `cookie` |
| `CACHE_STORE` | Driver cache | `database` atau `file` |
| `QUEUE_CONNECTION` | Driver queue | `database` atau `sync` |

> [!TIP]
> Pada variabel `DATABASE_URL`, Anda cukup mengetikkan `${{Postgres.DATABASE_URL}}` di Railway. Railway akan otomatis menghubungkan backend dengan kredensial database PostgreSQL internal secara dinamis.

---

### Langkah 3.3: Konfigurasi Build & Start Command Otomatis (`railway.json`)

File [`railway.json`](file:///home/ark/absence/absence-backend/railway.json) sudah otomatis disediakan di dalam folder `absence-backend`. Railway akan otomatis menjalankan proses berikut saat deploy:

```bash
php artisan migrate --force && php artisan db:seed --class=SchoolSeeder --force && php artisan db:seed --class=AdminSeeder --force && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan serve --host=0.0.0.0 --port=$PORT
```

Perintah di atas memastikan:
1. Skema database (tabel `schools`, `admins`, `participants`, `personal_access_tokens`) otomatis termigrasi.
2. Data sekolah dan akun admin default otomatis di-seed ke database production.
3. Cache route & konfigurasi Laravel dioptimasi untuk kecepatan maksimal di production.
4. Server berjalan dan mengikat ke port dinamis `$PORT` yang disediakan oleh Railway.

---

### Langkah 3.4: Generate Domain Publik Backend

1. Di service `absence-backend`, buka tab **Settings**.
2. Gulir ke bagian **Networking**.
3. Klik **"Generate Domain"**.
4. Anda akan mendapatkan URL publik HTTPS, contoh:
   ```
   https://absence-backend-production.up.railway.app
   ```
5. Simpan URL ini, karena akan digunakan sebagai target API pada frontend di Vercel.

---

## 4. Deployment Frontend di Vercel

### Langkah 4.1: Import Proyek ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Temukan repositori GitHub Anda (`absence-event-system`), lalu klik **"Import"**.

---

### Langkah 4.2: Konfigurasi Project Settings di Vercel

Pada halaman konfigurasi deployment Vercel:

1. **Project Name:** Beri nama, misalnya `absence-frontend` atau `edupass-openhouse`.
2. **Framework Preset:** Pilih `Vite`.
3. **Root Directory:**
   - Klik tombol **Edit** di samping Root Directory.
   - Pilih folder `absence-frontend`.
   - Klik **Continue**.
4. **Build and Output Settings:**
   - Build Command: `npm run build` (Default)
   - Output Directory: `dist` (Default)
   - Install Command: `npm install` (Default)

---

### Langkah 4.3: Tambahkan Environment Variable di Vercel

Buka menu dropdown **Environment Variables**, tambahkan variabel berikut:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://absence-backend-production.up.railway.app/api` |

*(Ganti `absence-backend-production.up.railway.app` dengan domain Railway asli yang didapatkan pada Langkah 3.4).*

---

### Langkah 4.4: Deploy & Routing SPA

File [`vercel.json`](file:///home/ark/absence/absence-frontend/vercel.json) sudah otomatis disediakan di dalam folder `absence-frontend`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

File ini mencegah error 404 saat pengguna me-refresh halaman di browser pada route React SPA.

Klik **"Deploy"**. Vercel akan meng-compile aplikasi React dan memberikan URL publik HTTPS, contoh:
```
https://absence-frontend.vercel.app
```

---

## 5. Hubungkan CORS Frontend & Backend

Setelah mendapatkan domain Vercel Anda:

1. Buka kembali dashboard [Railway](https://railway.app).
2. Masuk ke service `absence-backend` -> tab **Variables**.
3. Update nilai variabel `FRONTEND_URL` dengan domain Vercel Anda, contoh:
   ```
   FRONTEND_URL=https://absence-frontend.vercel.app
   ```
4. Update nilai `APP_URL` dengan domain backend Railway Anda, contoh:
   ```
   APP_URL=https://absence-backend-production.up.railway.app
   ```
5. Railway akan otomatis melakukan *re-deploy* dengan konfigurasi CORS yang baru.

---

## 6. Alur Continuous Deployment (Push to Deploy)

Dengan integrasi GitHub, Anda tidak perlu lagi melakukan upload manual:

```bash
# 1. Lakukan perubahan kode di frontend atau backend secara lokal
# 2. Tambahkan perubahan ke Git
git add .

# 3. Buat commit pesan yang jelas
git commit -m "update: fitur baru atau penyesuaian desain"

# 4. Push ke GitHub
git push origin main
```

**Otomasi yang terjadi secara otomatis:**
* **Vercel** mendeteksi perubahan pada folder `absence-frontend/`, melakukan build otomatis dalam ~30 detik, dan memperbarui web live tanpa downtime.
* **Railway** mendeteksi perubahan pada folder `absence-backend/`, mengeksekusi migrasi database jika ada migration baru, lalu me-restart service backend secara mulus.

---

## 7. Kredensial Default & Checklist Verifikasi Production

### Kredensial Login Admin Default:
* **URL Admin:** Buka aplikasi web di Vercel -> Klik tombol **"Login Admin"** di pojok kanan atas.
* **Username:** `admin`
* **Password:** `admin123`

> [!IMPORTANT]
> Untuk keamanan production, ubah password admin melalui Railway CLI atau Tinker:
> ```bash
> php artisan tinker --execute="App\Models\Admin::where('username', 'admin')->first()->update(['password' => bcrypt('PasswordBaruYangKuat123!')]);"
> ```

### Checklist Pengujian Setelah Deploy:
- [ ] **Dropdown Sekolah Publik:** Buka halaman registrasi, pastikan dropdown sekolah berhasil memuat daftar sekolah dari PostgreSQL Railway.
- [ ] **Pendaftaran Peserta:** Isi formulir pendaftaran, pastikan tiket digital muncul dengan kode kupon sequential (contoh: `ABSC-0001`) dan barcode/QR Code.
- [ ] **Login Admin:** Masuk menggunakan username `admin` dan password `admin123`. Pastikan token Sanctum tersimpan dan dashboard terbuka.
- [ ] **Pemindaian Kupon (Scanner):** Masukkan kode kupon yang baru dibuat. Pastikan status menjadi valid (hijau).
- [ ] **Uji Anti-Double Scan:** Masukkan kembali kode kupon yang sama. Pastikan sistem menolak dengan pesan peringatan merah *"Kupon sudah di-scan sebelumnya"*.
- [ ] **Walk-in & Delete:** Uji penambahan peserta langsung dari meja loket admin dan hapus data uji coba.

---

## 8. Panduan Troubleshooting

| Gejala Kendala | Penyebab Umum | Solusi |
|---|---|---|
| Dropdown sekolah kosong / fetch error | `VITE_API_BASE_URL` salah atau backend belum aktif | Periksa nilai `VITE_API_BASE_URL` di Vercel. Pastikan berakhiran `/api` dan backend Railway berstatus *Active*. |
| Error `CORS Header Missing` di konsol browser | Domain Vercel belum diizinkan backend | Pastikan `FRONTEND_URL` di Railway sudah diisi domain Vercel Anda, dan periksa [`config/cors.php`](file:///home/ark/absence/absence-backend/config/cors.php). |
| Railway Deploy Error: `500 Server Error` | `APP_KEY` belum terisi di Environment Variables Railway | Tambahkan `APP_KEY` di tab Variables Railway (generate nilai dengan `php artisan key:generate --show`). |
| Database Connection Refused di Railway | Variabel `DATABASE_URL` belum terhubung ke service Postgres | Pastikan service Postgres sudah dibuat dalam 1 project Railway dan variabel `DATABASE_URL` berisi `${{Postgres.DATABASE_URL}}`. |
| Halaman 404 saat reload browser di Vercel | Konfigurasi routing rewrite SPA belum ada | Pastikan file [`absence-frontend/vercel.json`](file:///home/ark/absence/absence-frontend/vercel.json) ada di repositori GitHub Anda. |

