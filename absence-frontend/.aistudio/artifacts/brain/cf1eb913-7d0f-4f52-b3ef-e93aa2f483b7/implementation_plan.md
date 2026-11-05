# Peningkatan Sistem Pas Acara & Open House (EduPass 2026)

Pembaruan menyeluruh pada alur peserta publik (**User Biasa**) dan konsol manajemen panitia (**EduPass Admin**) untuk menambahkan seksi sambutan penuh (*Welcome Hero*), matriks 2×2 *Trial Class* (`IT`, `DKV`, `KULINER`, `MOBILE LEGENDS`), pilihan *Sumber Informasi* bersyarat, penyederhanaan tiket menjadi khusus **QR Code**, serta perapian elemen antarmuka pada *sidebar*, *navbar*, dan kartu KPI Admin.

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan berikut telah dikonfirmasi bersama pengguna dan menjadi acuan langsung implementasi kode:

- **Seksi Sambutan Penuh (*Full-Viewport Welcome Hero*)**: Saat peserta membuka halaman, tampilan pertama adalah layar sambutan penuh dengan sorotan acara Open House 2026 dan tombol gulir halus (*smooth scroll*) menuju formulir registrasi di bawahnya.
- **Integrasi Trial Class & Sumber Informasi di Seluruh Alur**: Pilihan *Trial Class* (`IT`, `DKV`, `KULINER`, `MOBILE LEGENDS`) serta *Sumber Informasi* (+ *Detail Sumber* jika memilih `Medsos`, `Banner`, atau `Event`) ditampilkan pada Formulir Registrasi, Tiket QR Digital peserta, serta Tabel & Filter Admin.
- **Baris Ringkasan 3 Kartu KPI Admin**: Kartu ke-4 (*Kupon Walk-In* pada halaman Daftar Peserta dan kartu ke-4 pada halaman Riwayat Aktivitas) dihapus sehingga masing-masing halaman menampilkan baris ringkasan 3 kartu KPI yang proporsional (`lg:grid-cols-3`).
- **Tiket Digital Khusus QR Code**: Opsi pengalih `CODE128` dihapus setelah peserta mengklaim kupon; tiket digital dan fitur unduh PNG menampilkan **QR Code** secara eksklusif.

---

## 1. Overview & Core Concept

- **What It Does**: Memberikan pengalaman penyambutan yang hangat bagi calon siswa dan guru pendamping sebelum mengisi formulir kredensial lengkap (termasuk minat *Trial Class* dan *Sumber Informasi*), menerbitkan tiket QR berlubang siap pindai, dan menyediakan konsol Admin 3 halaman yang bersih dengan tombol *Logout* sederhana.
- **Target Audience / Persona**:
  - **User Biasa (Peserta & Guru Pendamping)**: Membuka halaman sambutan, menggulir ke formulir kredensial, dan mengunduh tiket QR miliknya.
  - **Admin Loket (`EduPass Admin`)**: Mengelola pemindaian QR/kupon, memantau riwayat aktivitas, dan memfilter daftar peserta berdasarkan status maupun *Trial Class*.
- **Key Value**: Alur registrasi yang lebih terarah dan tidak langsung membebani pengunjung dengan formulir di detik pertama, sekaligus antarmuka Admin yang lebih fokus tanpa tombol atau kartu status yang berlebihan.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Layar Sambutan Peserta (*Full-Viewport Welcome Hero*)**:
   - Menampilkan tajuk sambutan hangat Open House 2026 di atas kanvas krem hangat (`#FFF3E3`), ringkasan manfaat acara (eksplorasi 4 *Trial Class* unggulan, kupon kehadiran & merchandise), serta tombol utama **"Mulai Pendaftaran Sekarang"** yang menggulirkan layar secara halus ke kartu **Data Kredensial Peserta**.
2. **Formulir Kredensial Peserta (Di Bawah Seksi Sambutan)**:
   - Input **Pilih Peran Peserta** (*Siswa* / *Guru Pendamping*), **Nama Lengkap Peserta**, **NISN / NIP**, dan **Asal Sekolah / Institusi**.
   - **Matriks 2×2 Kartu Trial Class** tepat di bawah input *Asal Sekolah / Institusi*:
     - `IT` (ikon Laptop)
     - `DKV` (ikon Palette)
     - `KULINER` (ikon Topi Koki / *Chef Hat*)
     - `MOBILE LEGENDS` (ikon Gamepad)
     - Kartu yang aktif memiliki bingkai tebal *periwinkle* (`border-2 border-[#9FA0FF] bg-[#9FA0FF]/15`) dan ikon tanda centang (*check icon*).
   - **Dropdown "Sumber Informasi"**: Pilihan `Medsos`, `Banner`, `Event`, `Teman`, `Website`.
   - **Input Teks Bersyarat "Detail Sumber"**: Muncul secara dinamis tepat di bawah dropdown apabila pengguna memilih `Medsos`, `Banner`, atau `Event` (misal: nama akun Instagram/TikTok, lokasi banner, atau nama pameran sekolah).
3. **Tiket & Kupon QR Digital (Eksklusif QR Code)**:
   - Menampilkan identitas peserta, asal sekolah, lencana *Trial Class*, informasi sumber, kode monospasi `ABSC-XXXX`, serta **QR Code** tanpa tombol pengalih `CODE128`.
   - Mendukung unduhan gambar tiket PNG beresolusi tinggi (dengan QR Code) dan cetak PDF.
4. **Konsol Admin (`EduPass Admin`) yang Dirampingkan**:
   - **Sidebar Kiri**: Menghapus kartu *"Status Scanner: Aktif"* di bagian bawah dan menggantinya dengan tombol **Logout** sederhana untuk keluar dari mode Admin kembali ke halaman publik.
   - **Navbar Atas Admin**: Menghapus status *"Sesi 1: 08:00 - 12:00 WIB"* dan menghapus tombol *"Mode User Biasa"* di kanan atas.
   - **Halaman Barcode Scanner**: Menghapus baris *"Preset Pilihan Cepat"* di dalam kartu *Input Manual Kupon*.
   - **Halaman Riwayat Aktivitas & Daftar Peserta**: Menghapus kartu KPI ke-4 (*Kupon Walk-In* / kartu ke-4) sehingga menjadi grid 3 kolom (`sm:grid-cols-3`), serta menampilkan kolom/lencana *Trial Class* (`IT`, `DKV`, `KULINER`, `MOBILE LEGENDS`) dan *Sumber Informasi* peserta.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Pemisahan Visual Antara Welcome Hero & Formulir Kredensial**
  - *Chosen Approach*: Menggunakan kontainer pembuka setinggi layar (`min-h-[calc(100vh-4rem)]`) dengan indikator gulir dan tombol aksi yang memicu `scrollIntoView({ behavior: 'smooth' })` ke elemen `#registration-form-section`.
  - *Why*: Memenuhi kebutuhan pengguna agar pengunjung disambut terlebih dahulu dengan konteks acara sebelum mulai mengisi formulir.
- **Decision 2: Input Bersyarat "Detail Sumber" yang Tervalidasi**
  - *Chosen Approach*: Menampilkan field *Detail Sumber* secara reaktif ketika nilai `infoSource` adalah `'Medsos' | 'Banner' | 'Event'`, dan mereset/menyembunyikannya saat memilih `'Teman'` atau `'Website'`.
  - *Why*: Menjaga formulir tetap ringkas namun mampu menangkap data atribusi pemasaran secara spesifik saat dibutuhkan.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram
```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Mode Pengguna Biasa (#FFF3E3)                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Full-Viewport Welcome Hero                                        │  │
│  │    - Sambutan Open House 2026 & Sorotan 4 Trial Class                │  │
│  │    - CTA "Mulai Isi Formulir" (Smooth Scroll ke bawah)               │  │
│  └───────────────────────────────────┬──────────────────────────────────┘  │
│                                      ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 2. Kartu Form Kredensial Peserta                                     │  │
│  │    - Peran (Siswa / Guru), Nama, NISN/NIP, Asal Sekolah              │  │
│  │    - 2x2 Grid Trial Class (IT, DKV, KULINER, MOBILE LEGENDS)         │  │
│  │    - Dropdown Sumber Informasi + Conditional Input "Detail Sumber"   │  │
│  └───────────────────────────────────┬──────────────────────────────────┘  │
│                                      ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 3. Kartu Tiket & Kupon QR Digital (QR Code Only + PNG Export)        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                         Mode EduPass Admin (#F8FAFC)                       │
│  ┌──────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ Sidebar Kiri         │  │ Top Header (Tanpa Sesi & Tanpa Mode User)  │  │
│  │ - Barcode Scanner    │  ├────────────────────────────────────────────┤  │
│  │ - Riwayat Aktivitas  │  │ - Scanner (Tanpa Preset Pilihan Cepat)     │  │
│  │ - Daftar Peserta     │  │ - Riwayat Aktivitas (3 KPI Cards + Tabel)  │  │
│  │ - [Tombol Logout]    │  │ - Daftar Peserta (3 KPI Cards + Tabel)     │  │
│  └──────────────────────┘  └────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model Updates (`AttendeePass` & `ScanLogEntry`)
- **`TrialClassType`**: `'IT' | 'DKV' | 'KULINER' | 'MOBILE_LEGENDS'`
- **`InfoSourceType`**: `'Medsos' | 'Banner' | 'Event' | 'Teman' | 'Website'`
- **`AttendeePass`**:
  - Menambahkan `trialClass: TrialClassType`
  - Menambahkan `infoSource: InfoSourceType`
  - Menambahkan `infoSourceDetail?: string` (terisi saat `Medsos`, `Banner`, atau `Event` dipilih)
- **`ScanLogEntry`**:
  - Menyertakan `trialClass: TrialClassType` untuk ditampilkan pada tabel *Riwayat Aktivitas & Log Pemindaian*.

### Interactive Component & State Mapping
- **`RegistrationView`**: Mengelola state `trialClass` (default `'IT'`), `infoSource` (default `'Medsos'`), dan `infoSourceDetail`; memvalidasi agar *Detail Sumber* diisi jika pengguna memilih `Medsos`, `Banner`, atau `Event`.
- **`DigitalPassCard` & `downloadPassAsPng`**: Menghapus state dan tombol `CODE128`, serta merender matriks **QR Code** secara langsung baik pada tampilan web maupun saat mengunduh PNG.
- **`AdminScannerDesk`**:
  - Menghapus elemen *Preset Pilihan Cepat* dari form manual kupon.
  - Mengganti kartu status pemindai di bagian bawah sidebar menjadi tombol **Logout** (`onSwitchToPublicUser`).
  - Menghapus teks sesi dan tombol *Mode User Biasa* dari `<header>`.
  - Mengubah grid kartu ringkasan KPI menjadi 3 kolom (`grid-cols-1 sm:grid-cols-3`) pada halaman *Daftar Peserta* dan *Riwayat Aktivitas*.
