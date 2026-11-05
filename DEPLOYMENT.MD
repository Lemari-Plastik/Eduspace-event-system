# Panduan Deployment: Absence Registration & Coupon Management System

Panduan lengkap untuk melakukan deployment sistem **Absence** ke cloud production:
- **Frontend:** [Vercel](https://vercel.com) (React 19 + TypeScript + Vite)
- **Backend:** [Render.com](https://render.com) (Dockerized Laravel 11 REST API)
- **Database:** [Render PostgreSQL](https://render.com) (Managed Cloud Database)
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
       |     VERCEL (Frontend) |                   |    RENDER (Backend)   |
       |  React + Vite + TS    |                   |  Docker + Nginx + PHP |
       |  https://*.vercel.app |                   |  https://*.onrender   |
       +-----------+-----------+                   +-----------+-----------+
                   |                                           |
                   | API Request (HTTPS / Bearer Token)        | Internal TCP (5432)
                   +------------------------------------------>|
                                                               v
                                                   +-----------------------+
                                                   |   RENDER POSTGRESQL   |
                                                   |    Managed Database   |
                                                   +-----------------------+
```

---

## 2. Persiapan Repositori GitHub

Sistem ini disusun sebagai **Monorepo** yang memuat folder `absence-backend` dan `absence-frontend`.

### Langkah Inisialisasi & Push ke GitHub:

1. Buat repositori baru di akun GitHub Anda (misalnya: `absence-event-system`), biarkan repositori dalam keadaan kosong tanpa mencentang README.
2. Buka terminal di folder root project (`/home/ark/absence`):

```bash
# Masuk ke folder root project
cd /home/ark/absence

# Inisialisasi git pada root project (jika belum)
git init

# Tambahkan seluruh file ke staging (.gitignore root sudah mengabaikan file sensitif .env, vendor, node_modules)
git add .

# Buat commit pertama
git commit -m "feat: complete dockerized laravel backend and vercel frontend"

# Set branch utama ke main
git branch -M main

# Hubungkan dengan remote repository GitHub Anda (ganti URL sesuai akun Anda)
git remote add origin https://github.com/USERNAME_ANDA/absence-event-system.git

# Push ke GitHub
git push -u origin main
```

---

## 3. Deployment Database & Backend di Render.com

Render menyediakan database PostgreSQL terkelola dan Web Service berbasis Docker. Anda dapat memilih salah satu dari dua cara di bawah ini:

---

### Cara A: 1-Click Deployment Menggunakan Blueprint (`render.yaml`) *(Paling Cepat & Otomatis)*

File konfigurasi [`render.yaml`](file:///home/ark/absence/render.yaml) sudah disediakan di root proyek.

1. Buka [Dashboard Render](https://dashboard.render.com/) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"New +"** di pojok kanan atas -> pilih **"Blueprint"**.
3. Pilih repositori GitHub Anda (`absence-event-system`).
4. Render akan membaca file `render.yaml` dan otomatis mendeteksi:
   - **1 Database PostgreSQL:** `absence-postgres` (Plan Free).
   - **1 Web Service Docker:** `absence-backend` yang otomatis terhubung ke database.
5. Anda akan diminta mengisi nilai variabel `APP_KEY`:
   - Generate kunci enkripsi baru atau gunakan kunci dari `.env` lokal Anda:
     ```bash
     php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
     ```
   - Masukkan nilai tersebut ke input `APP_KEY`.
6. Klik **"Apply"**. Render akan membuat database dan mem-build container Docker backend secara otomatis!

---

### Cara B: Setup Manual Melalui Dashboard Render

Jika ingin membuat service satu per satu secara manual:

#### Langkah 3.1: Buat PostgreSQL Database di Render
1. Di [Dashboard Render](https://dashboard.render.com/), klik **"New +"** -> pilih **"PostgreSQL"**.
2. Isi detail database:
   - **Name:** `absence-postgres`
   - **Database:** `absence`
   - **User:** `abs`
   - **Region:** Pilih region terdekat (misal: `Singapore` atau `Oregon`).
   - **Plan:** Pilih **Free**.
3. Klik **"Create Database"**.
4. Setelah dibuat, gulir ke bagian **Connections**. Salin nilai **Internal Database URL** (format: `postgres://abs:password@dpg-xxxxxx/absence`).

#### Langkah 3.2: Buat Web Service Docker untuk Backend
1. Di Dashboard Render, klik **"New +"** -> pilih **"Web Service"**.
2. Pilih repositori GitHub Anda (`absence-event-system`).
3. Pada halaman konfigurasi:
   - **Name:** `absence-backend`
   - **Region:** Pilih region yang sama dengan database PostgreSQL Anda.
   - **Branch:** `main`
   - **Root Directory:** Isi dengan `absence-backend`
   - **Runtime:** Pilih **Docker**
   - **Plan:** Pilih **Free**
4. Gulir ke bagian **Environment Variables**, klik **"Add Environment Variable"** dan masukkan:

| Key | Value | Catatan |
|---|---|---|
| `APP_NAME` | `EduPass` | Nama aplikasi |
| `APP_ENV` | `production` | Mode production |
| `APP_KEY` | `base64:8i7uR5eAPqRkmx0h/2poX+qXQxlU2rezMGG8lleDcTY=` | Kunci enkripsi Laravel (32-char base64) |
| `APP_DEBUG` | `false` | Matikan debug mode untuk keamanan |
| `DB_CONNECTION` | `pgsql` | Driver database PostgreSQL |
| `DATABASE_URL` | *Paste Internal Database URL dari Langkah 3.1* | Contoh: `postgres://abs:...@dpg-xxx/absence` |
| `LOG_CHANNEL` | `stderr` | Menyalurkan log aplikasi ke console Render |
| `FRONTEND_URL` | `*` (atau domain Vercel Anda setelah dibuat) | Mengizinkan permintaan CORS dari frontend |

5. Klik **"Create Web Service"**.

---

### Apa yang Dilakukan Dockerfile Otomatis Saat Build di Render?

Container Docker yang telah disediakan ([`absence-backend/Dockerfile`](file:///home/ark/absence/absence-backend/Dockerfile)) bekerja bersama [`docker/entrypoint.sh`](file:///home/ark/absence/absence-backend/docker/entrypoint.sh):
1. Menginstal runtime PHP 8.2 FPM, Nginx, ekstensi `pdo_pgsql`, `pgsql`, `opcache`, dan `zip`.
2. Menyesuaikan port Nginx secara dinamis dengan variabel `$PORT` yang diberikan oleh Render.
3. Otomatis menjalankan migrasi database: `php artisan migrate --force`.
4. Otomatis men-seed sekolah dan admin default: `SchoolSeeder` dan `AdminSeeder`.
5. Mengoptimasi cache: `config:cache`, `route:cache`, dan `view:cache`.
6. Menjalankan Nginx dan PHP-FPM di latar belakang.

---

### Langkah 3.3: Salin URL Publik Backend Render

Setelah deployment selesai dan berstatus **"Live"**, salin URL publik HTTPS backend Anda di bagian atas halaman service Render, contoh:
```
https://absence-backend-xxxx.onrender.com
```

---

## 4. Deployment Frontend di Vercel

### Langkah 4.1: Import Proyek ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..."** -> pilih **"Project"**.
3. Temukan repositori GitHub Anda (`absence-event-system`), lalu klik **"Import"**.

---

### Langkah 4.2: Konfigurasi Project Settings di Vercel

1. **Project Name:** Beri nama, misalnya `absence-frontend` atau `edupass-openhouse`.
2. **Framework Preset:** Pilih `Vite`.
3. **Root Directory:**
   - Klik tombol **Edit** di samping Root Directory.
   - Pilih folder `absence-frontend`.
   - Klik **Continue**.
4. **Build & Output Settings:**
   - Build Command: `npm run build` (Default)
   - Output Directory: `dist` (Default)

---

### Langkah 4.3: Tambahkan Environment Variable di Vercel

Buka menu dropdown **Environment Variables**, tambahkan:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://absence-backend-xxxx.onrender.com/api` |

*(Ganti `absence-backend-xxxx.onrender.com` dengan URL domain Render yang Anda dapatkan pada Langkah 3.3).*

---

### Langkah 4.4: Deploy & SPA Routing

File konfigurasi [`absence-frontend/vercel.json`](file:///home/ark/absence/absence-frontend/vercel.json) sudah otomatis disiapkan di repositori:
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
File ini memastikan tidak ada error 404 saat pengguna me-refresh halaman browser pada rute React.

Klik tombol **"Deploy"**. Dalam ~30 detik, website Anda akan aktif dan Vercel akan memberikan domain publik, contoh:
```
https://absence-frontend-xxxx.vercel.app
```

---

## 5. Hubungkan CORS Frontend & Backend

Setelah mendapatkan domain Vercel Anda:

1. Buka kembali dashboard [Render](https://dashboard.render.com/) -> buka service `absence-backend`.
2. Masuk ke tab **Environment**.
3. Edit variabel `FRONTEND_URL` menjadi domain Vercel Anda, contoh:
   ```
   FRONTEND_URL=https://absence-frontend-xxxx.vercel.app
   ```
4. Tambahkan/update variabel `APP_URL` dengan domain Render Anda, contoh:
   ```
   APP_URL=https://absence-backend-xxxx.onrender.com
   ```
5. Klik **"Save Changes"**. Render akan otomatis me-restart service dengan pengaturan CORS terbaru.

---

## 6. Alur Continuous Deployment (Push to Deploy)

Setelah setup awal selesai, alur rilis update fitur ke production sangat mudah:

```bash
# 1. Edit kode di lokal (frontend maupun backend)
# 2. Tambahkan perubahan ke git
git add .

# 3. Buat commit
git commit -m "update: perbaikan UI atau penambahan fitur"

# 4. Push ke GitHub
git push origin main
```

**Yang terjadi secara otomatis:**
* **Vercel** mendeteksi perubahan pada folder `absence-frontend/`, menjalankan build Vite, dan meng-update website dalam ~30 detik tanpa downtime.
* **Render** mendeteksi perubahan pada folder `absence-backend/`, mem-build image Docker baru, menjalankan migrasi database baru jika ada, dan mengganti container lama secara otomatis (*zero-downtime rolling update*).

---

## 7. Kredensial Default & Checklist Pengujian

### Kredensial Admin Loket:
* **Tombol Akses:** Klik **"Login Admin"** di pojok kanan atas website Vercel Anda.
* **Username:** `admin`
* **Password:** `admin123`

> [!TIP]
> **Catatan Cold Start Render Free Tier:**
> Layanan Web Service gratis di Render akan memasuki mode *sleep* jika tidak menerima traffic selama 15 menit. Request pertama setelah masa tidur memerlukan waktu ~30-50 detik untuk bangun kembali (*spin-up*). Setelah aktif, request berikutnya akan berjalan normal dan cepat.

### Checklist Pengujian Setelah Deploy:
- [ ] **Dropdown Sekolah Publik:** Buka halaman registrasi, pastikan dropdown sekolah berhasil memuat daftar sekolah dari database PostgreSQL Render.
- [ ] **Pendaftaran Peserta:** Lakukan pendaftaran peserta baru, pastikan tiket digital muncul dengan kode kupon sequential (contoh: `ABSC-0001`) dan barcode/QR Code.
- [ ] **Login Admin:** Masuk dengan username `admin` dan password `admin123`. Pastikan token Sanctum tersimpan dan dashboard terbuka.
- [ ] **Pemindaian Kupon (Scanner):** Masukkan kode kupon yang baru dibuat. Pastikan status menjadi valid (hijau).
- [ ] **Uji Anti-Double Scan:** Masukkan kembali kode kupon yang sama. Pastikan sistem menolak dengan pesan peringatan merah *"Kupon sudah di-scan sebelumnya"*.
- [ ] **Pendaftaran Walk-in:** Klik tombol *"+ Tambah Walk-in"* di dashboard admin dan pastikan peserta baru langsung tercatat di database.

---

## 8. Panduan Troubleshooting

| Gejala Kendala | Penyebab Umum | Solusi |
|---|---|---|
| Dropdown sekolah kosong / Fetch Failed | `VITE_API_BASE_URL` salah atau backend Render sedang *sleeping* | Periksa nilai `VITE_API_BASE_URL` di Vercel (harus berakhiran `/api`). Buka URL backend Render langsung di browser untuk memastikan container sudah aktif (*Live*). |
| Error `CORS Header Missing` di konsol browser | Nilai `FRONTEND_URL` di Render belum mencakup domain Vercel Anda | Masuk ke Environment Variables di Render, isi `FRONTEND_URL` dengan domain Vercel Anda (atau sementara isi `*` untuk mengizinkan semua origin). |
| Render Build Failed pada Docker | Dockerfile tidak ditemukan karena Root Directory salah | Pastikan pada pengaturan Service Render, kolom **Root Directory** diisi dengan `absence-backend`. |
| Database Connection Refused di Render | `DATABASE_URL` menggunakan External URL atau salah format | Pastikan menggunakan **Internal Database URL** yang disediakan Render Postgres agar koneksi berjalan cepat dan aman di dalam jaringan internal Render. |
| Halaman 404 saat refresh URL di Vercel | Konfigurasi SPA rewrite belum terpasang | Pastikan file [`absence-frontend/vercel.json`](file:///home/ark/absence/absence-frontend/vercel.json) ada di repositori GitHub Anda. |
