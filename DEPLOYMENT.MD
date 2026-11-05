# Panduan Deployment: Wasmer.io + Neon PostgreSQL + Vercel
## Absence Registration & Coupon Management System

Panduan final deployment sistem **Absence** dengan arsitektur 100% gratis tanpa memerlukan kartu kredit:

- **Backend:** [Wasmer.io](https://wasmer.io) — WebAssembly Serverless Edge (CLI `wasmer deploy`)
- **Database:** [Neon.tech](https://neon.tech) — Serverless PostgreSQL Gratis Selamanya
- **Frontend:** [Vercel](https://vercel.com) — React 19 + TypeScript + Vite

---

## 1. Arsitektur Sistem

```
       +--------------------------------------------------------+
       |               FRONTEND: VERCEL                         |
       |  React + TypeScript + Vite                             |
       |  URL: https://your-project.vercel.app                  |
       +---------------------------+----------------------------+
                                   |
                                   | HTTPS API Calls (/api)
                                   v
       +--------------------------------------------------------+
       |               BACKEND: WASMER.IO                       |
       |  Laravel 11 running on Wasmer Edge (WASI / PHP 8.3)    |
       |  URL: https://absence-backend-<user>.wasmer.app       |
       +---------------------------+----------------------------+
                                   |
                                   | PostgreSQL SSL Connection (Port 5432)
                                   v
       +--------------------------------------------------------+
       |               DATABASE: NEON.TECH                      |
       |  Serverless PostgreSQL (No Credit Card / Permanent)    |
       |  URI: postgresql://neondb_owner:...@ep-xxx.neon.tech   |
       +--------------------------------------------------------+
```

---

## 2. Langkah 1: Persiapan Database di Neon.tech

1. Buka [https://neon.tech](https://neon.tech) dan login dengan akun GitHub Anda (Gratis, Tanpa Kartu Kredit).
2. Buat project baru bernama `absence-db` di region terdekat (misal: `Asia Pacific (Singapore)`).
3. Salin **Connection String (URI)** Anda dari dashboard Neon, contoh:
   ```
   postgresql://neondb_owner:nXXXXXXXXXX@ep-cool-fog-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### Jalankan Migrasi & Seeding Database ke Neon dari Lokal:
Jalankan perintah ini di terminal lokal Anda agar tabel dan data awal sekolah serta admin langsung terisi di database Neon:

```bash
cd /home/ark/absence/absence-backend

# Jalankan migrasi ke Neon
DATABASE_URL="PASTE_URL_NEON_ANDA_DI_SINI" php artisan migrate --force

# Seed daftar sekolah & akun admin awal
DATABASE_URL="PASTE_URL_NEON_ANDA_DI_SINI" php artisan db:seed --class=SchoolSeeder --force
DATABASE_URL="PASTE_URL_NEON_ANDA_DI_SINI" php artisan db:seed --class=AdminSeeder --force
```

---

## 3. Langkah 2: Deploy Backend ke Wasmer.io

CLI Wasmer sudah terinstal di komputer Anda (`wasmer 7.5.0`). File konfigurasi [`wasmer.toml`](file:///home/ark/absence/absence-backend/wasmer.toml) dan [`app.yaml`](file:///home/ark/absence/absence-backend/app.yaml) sudah disiapkan di folder `absence-backend`.

### 1. Login ke Wasmer
Buka terminal dan jalankan:
```bash
wasmer login
```
*(Browser akan terbuka untuk mengonfirmasi login akun Wasmer Anda, atau Anda dapat memasukkan token API Wasmer).*

### 2. Deploy Aplikasi Backend
Masuk ke folder `absence-backend` dan jalankan:
```bash
cd /home/ark/absence/absence-backend
wasmer deploy
```

CLI Wasmer akan memvalidasi package PHP, mengunggah ke Wasmer Edge, dan memberikan URL publik aplikasi Anda:
```
https://absence-backend.wasmer.app
```

### 3. Masukkan Database URL & App Key ke Wasmer Secrets
Jalankan perintah `create` (atau `update` jika sudah pernah dibuat) dengan flag `--redeploy`:

```bash
# Tambahkan DATABASE_URL dari Neon
wasmer app secret create --redeploy DATABASE_URL "PASTE_URL_NEON_ANDA_DI_SINI"

# Tambahkan APP_KEY Laravel
wasmer app secret create --redeploy APP_KEY "base64:8i7uR5eAPqRkmx0h/2poX+qXQxlU2rezMGG8lleDcTY="
```

*(Catatan: Jika secret sudah ada dan ingin diubah, gunakan perintah `wasmer app secret update ...`)*

#### Alternatif Melalui Web Dashboard Wasmer (Tanpa Terminal):
1. Buka [https://wasmer.io](https://wasmer.io) -> masuk ke dashboard app Anda (`absence-backend`).
2. Masuk ke tab **Secrets**.
3. Klik **"Create Secret"**:
   - Name: `DATABASE_URL` | Value: `postgresql://neondb_owner:...`
   - Name: `APP_KEY` | Value: `base64:8i7uR5eAPqRkmx0h/2poX+qXQxlU2rezMGG8lleDcTY=`
4. Klik **Save / Deploy**.

---

## 4. Langkah 3: Hubungkan Frontend di Vercel

Frontend Anda sudah siap di Vercel. Anda hanya perlu mengarahkan API URL ke Wasmer:

1. Buka [Vercel Dashboard](https://vercel.com) -> pilih proyek `absence-frontend` Anda.
2. Buka tab **Settings** -> **Environment Variables**.
3. Edit atau tambahkan variabel:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://absence-backend.wasmer.app/api` *(Pastikan berakhiran `/api`)*.
4. Buka tab **Deployments**, klik titik tiga `...` pada deployment terakhir -> pilih **"Redeploy"**.
5. Frontend Anda di Vercel sekarang sudah terhubung penuh ke backend Wasmer dan database Neon!

---

## 5. Kredensial Admin & Uji Coba

- **Halaman Pendaftaran Publik:** Buka URL Vercel Anda (`https://your-project.vercel.app`).
  - Dropdown sekolah akan otomatis terisi dengan 10 sekolah dari Neon.
  - Setelah mengisi form, kupon `ABSC-XXXX` akan otomatis terbit.
- **Login Admin Loket:**
  - Klik tombol **"Login Admin"** di kanan atas web Vercel.
  - **Username:** `admin`
  - **Password:** `admin123`
  - Anda dapat langsung melakukan scan barcode kupon atau input manual untuk verifikasi kehadiran.

---

## 6. Ringkasan File Konfigurasi yang Tersedia

1. [**`absence-backend/wasmer.toml`**](file:///home/ark/absence/absence-backend/wasmer.toml): Konfigurasi runtime PHP 8.3 WASI untuk Wasmer Edge.
2. [**`absence-backend/app.yaml`**](file:///home/ark/absence/absence-backend/app.yaml): Konfigurasi Wasmer Edge App dengan fitur Instaboot.
3. [**`absence-frontend/vercel.json`**](file:///home/ark/absence/absence-frontend/vercel.json): Konfigurasi SPA rewrite agar tidak terjadi 404 pada Vercel.
4. [**`absence-backend/config/database.php`**](file:///home/ark/absence/absence-backend/config/database.php#L89): Otomatis membaca variabel `DATABASE_URL` dari Neon.
