# Panduan Deployment 100% Gratis (Tanpa Kartu Kredit)
## Absence Registration & Coupon Management System

Panduan ini disusun khusus agar Anda dapat melakukan deployment seluruh sistem **tanpa perlu memasukkan kartu kredit (No Credit Card Required)**:

- **Database:** [Neon.tech](https://neon.tech) — Serverless PostgreSQL Gratis Selamanya (Tanpa Kartu Kredit, Data Tidak Kedaluwarsa)
- **Backend:** [Render.com](https://render.com) — Manual Web Service Docker Gratis (Tanpa Kartu Kredit)
- **Frontend:** [Vercel](https://vercel.com) — React 19 + Vite (Tanpa Kartu Kredit)

---

## Mengapa Render Meminta Kartu Kredit & Cara Menghindarinya?

Ada 2 penyebab utama mengapa Render meminta verifikasi kartu kredit:
1. **Fitur Blueprint (`render.yaml`):** Render menerapkan verifikasi kartu kredit pada semua setup otomatis berbasis Infrastructure-as-Code (Blueprint) untuk mencegah bot/spam, meskipun semua komponen diatur ke gratis.
2. **Database PostgreSQL Bawaan Render:** Secara default memilih paket berbayar ($7/bulan), dan versi gratisnya memiliki limitasi buruk (**dihapus otomatis setelah 30 hari**).

### Solusi Terbaik (100% Gratis & Tanpa Kartu Kredit):
* **Gunakan [Neon.tech](https://neon.tech) untuk Database PostgreSQL:** Daftar menggunakan akun GitHub dalam 10 detik, 100% gratis, **tidak meminta kartu kredit**, dan database Anda **aktif selamanya** (tidak kedaluwarsa setelah 30 hari).
* **Gunakan Manual Web Service di Render (Bukan Blueprint):** Render **TIDAK** meminta kartu kredit jika Anda membuat **Web Service** secara manual dengan memilih paket **Free ($0)**.

---

## 1. Arsitektur Deployment Tanpa Kartu Kredit

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
       |  React + Vite + TS    |                   |  Docker Web Service   |
       |  (No Credit Card)     |                   |  (No Credit Card)     |
       |  https://*.vercel.app |                   |  https://*.onrender   |
       +-----------+-----------+                   +-----------+-----------+
                   |                                           |
                   | API Request (HTTPS / Bearer Token)        | PostgreSQL SSL (TCP 5432)
                   +------------------------------------------>|
                                                               v
                                                   +-----------------------+
                                                   |    NEON.TECH (DB)     |
                                                   | Serverless PostgreSQL |
                                                   | (No Credit Card / Perm|
                                                   +-----------------------+
```

---

## 2. Langkah 1: Buat Database PostgreSQL di Neon.tech (30 Detik)

1. Buka [https://neon.tech](https://neon.tech).
2. Klik **"Sign Up"** dan pilih **"Continue with GitHub"** (Tidak ada formulir kartu kredit sama sekali).
3. Setelah masuk, beri nama proyek Anda, contoh: `absence-db`.
4. Pilih region yang paling dekat (misalnya: `Asia Pacific (Singapore)`).
5. Klik **"Create Project"**.
6. Pada dashboard Neon, Anda akan langsung melihat kotak **Connection Details**.
7. Pastikan dropdown memilih **"Connection string"** dan formatnya adalah **URI**:
   ```
   postgresql://neondb_owner:nXXXXXXXXXX@ep-cool-fog-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
8. Klik tombol **Copy**. Simpan URL ini, ini adalah nilai `DATABASE_URL` Anda!

---

## 3. Langkah 2: Push Kode ke Repositori GitHub

Pastikan seluruh file project sudah di-commit dan di-push ke GitHub:

```bash
# Buka terminal di folder root project
cd /home/ark/absence

# Inisialisasi git jika belum
git init

# Tambahkan semua file (file lokal .env sudah otomatis diabaikan oleh .gitignore)
git add .

# Commit
git commit -m "feat: production ready for neon db render and vercel"

# Set branch ke main
git branch -M main

# Hubungkan ke repository GitHub Anda (ganti dengan URL repo Anda)
git remote add origin https://github.com/USERNAME_ANDA/absence-event-system.git

# Push ke GitHub
git push -u origin main
```

---

## 4. Langkah 3: Deploy Backend di Render (Manual Web Service)

> [!IMPORTANT]
> **JANGAN MEMILIH "Blueprint"!**
> Pilihlah **"Web Service"** biasa agar Render tidak meminta verifikasi kartu kredit.

1. Buka [https://dashboard.render.com](https://dashboard.render.com).
2. Klik tombol **"New +"** di kanan atas -> pilih **"Web Service"**.
3. Pilih opsi **"Build and deploy from a Git repository"** -> klik **"Next"**.
4. Hubungkan akun GitHub Anda dan pilih repositori `absence-event-system`.
5. Pada formulir konfigurasi, isi detail berikut:
   - **Name:** `absence-backend`
   - **Region:** Pilih region yang sama dengan Neon Anda (misalnya: `Singapore`).
   - **Branch:** `main`
   - **Root Directory:** Isi dengan `absence-backend` *(Wajib diisi)*.
   - **Runtime:** Pilih **Docker**.
   - **Instance Type / Plan:** Pastikan memilih **Free ($0/month)**.
6. Gulir ke bawah ke bagian **Environment Variables**, klik **"Add Environment Variable"** dan tambahkan baris berikut satu per satu:

| Key | Value | Keterangan |
|---|---|---|
| `APP_NAME` | `EduPass` | Nama aplikasi |
| `APP_ENV` | `production` | Mode production |
| `APP_KEY` | `base64:8i7uR5eAPqRkmx0h/2poX+qXQxlU2rezMGG8lleDcTY=` | Kunci enkripsi Laravel (salin dari `.env` lokal Anda) |
| `APP_DEBUG` | `false` | Matikan debug mode untuk keamanan |
| `DB_CONNECTION` | `pgsql` | Driver database PostgreSQL |
| `DATABASE_URL` | *Paste Connection String dari Neon.tech pada Langkah 2* | Contoh: `postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb?sslmode=require` |
| `LOG_CHANNEL` | `stderr` | Menyalurkan log aplikasi ke console Render |
| `FRONTEND_URL` | `*` | Izin CORS (nanti bisa diupdate dengan URL Vercel) |

7. Klik tombol **"Create Web Service"**.
8. Render akan langsung mem-build Docker container, menjalankan migrasi database ke Neon.tech, men-seed sekolah dan admin secara otomatis, lalu mengaktifkan server Nginx + PHP-FPM.
9. Setelah status berubah menjadi **"Live"**, salin URL publik backend Anda di bagian atas, contoh:
   ```
   https://absence-backend-xxxx.onrender.com
   ```

---

## 5. Langkah 4: Deploy Frontend di Vercel (30 Detik)

1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda (Tanpa Kartu Kredit).
2. Klik **"Add New..."** -> pilih **"Project"**.
3. Cari repositori Anda (`absence-event-system`) dan klik **"Import"**.
4. Konfigurasi proyek:
   - **Framework Preset:** `Vite` (Otomatis terdeteksi).
   - **Root Directory:** Klik tombol **Edit** -> pilih folder `absence-frontend` -> klik **Continue**.
5. Buka bagian **Environment Variables**, tambahkan:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://absence-backend-xxxx.onrender.com/api` *(Pastikan menggunakan URL Render Anda dan diakhiri `/api`)*.
6. Klik **"Deploy"**.
7. Dalam ~30 detik, website Anda telah online dengan domain publik, contoh:
   ```
   https://absence-frontend-xxxx.vercel.app
   ```

---

## 6. Langkah 5: Hubungkan CORS

1. Buka kembali dashboard [Render](https://dashboard.render.com) -> pilih service `absence-backend`.
2. Masuk ke menu **Environment**.
3. Ubah nilai variabel `FRONTEND_URL` menjadi URL Vercel Anda, contoh:
   ```
   FRONTEND_URL=https://absence-frontend-xxxx.vercel.app
   ```
4. Tambahkan atau update `APP_URL`:
   ```
   APP_URL=https://absence-backend-xxxx.onrender.com
   ```
5. Klik **"Save Changes"**. Render akan otomatis merestart service dalam beberapa detik.

---

## 7. Kredensial Login Admin & Uji Coba

- **Akses Dashboard Admin:** Buka web Vercel Anda, klik tombol **"Login Admin"** di pojok kanan atas.
- **Username:** `admin`
- **Password:** `admin123`

### Checklist Pengujian:
- [ ] Dropdown asal sekolah muncul otomatis saat membuka halaman pendaftaran (diambil langsung dari database Neon).
- [ ] Formulir pendaftaran berhasil menerbitkan tiket digital dengan kode kupon `ABSC-XXXX`.
- [ ] Login admin berhasil dengan token Sanctum dan membuka console scanner.
- [ ] Pemindaian kupon berhasil diverifikasi.
- [ ] Pemindaian ulang kupon yang sama menampilkan peringatan anti-double scan *"Kupon sudah di-scan sebelumnya"*.

---

## Keuntungan Menggunakan Setup Ini:
1. **0 Rupiah & Tanpa Kartu Kredit:** Baik Neon, Render Web Service, maupun Vercel tidak meminta kartu kredit.
2. **Database Permanen:** Neon PostgreSQL tidak memiliki batas kedaluwarsa 30 hari seperti Render Postgres.
3. **CI/CD Otomatis:** Setiap kali Anda melakukan `git push origin main`, Vercel dan Render akan langsung memperbarui website Anda secara otomatis.
