# Hideo Hosting

Platform hosting mandiri (self-hosted PaaS) yang memungkinkan Anda mengdeploy dan mengelola proyek web secara otomatis menggunakan Docker. Dibangun dengan Laravel 13, React, Inertia.js, dan Tailwind CSS.

## Fitur Utama

- **Deploy otomatis** — Unggah source code, pilih framework, dan biarkan Docker yang bekerja
- **Multi-framework** — Mendukung Laravel, Node.js, Python, Ruby, Go, dan statis (HTML/CSS/JS)
- **File manager** — Kelola file proyek langsung dari dashboard
- **Database otomatis** — dukungan MySQL, PostgreSQL, dan SQLite
- **Manajemen user** — Sistem role admin & user dengan persetujuan registrasi
- **Cloudflare Tunnel** — Expose proyek ke internet tanpa perlu domain atau port forwarding
- **Domain kustom** — Hubungkan domain sendiri ke proyek yang sudah di-deploy
- **Responsive** — Dashboard bisa diakses dari desktop maupun mobile

## Persyaratan Sistem

| Komponen       | Versi Minimum  | Keterangan                      |
| -------------- | -------------- | ------------------------------- |
| PHP            | 8.3+           | Dengan ekstensi: curl, zip, mbstring, openssl, pdo |
| Node.js        | 18+            | Untuk build frontend            |
| Composer       | 2.0+           | Dependency manager PHP          |
| Docker         | 24.0+          | Untuk meng-build dan menjalankan container proyek |
| Nginx          | 1.18+          | Reverse proxy (opsional untuk development) |
| SQLite         | -              | Database default, sudah tersedia di PHP |
| MySQL/MariaDB  | 8.0+           | Alternatif database (opsional)  |

## Panduan Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/bojams/project-hosting.git
cd project-hosting
```

### 2. Instalasi Backend (Laravel)

```bash
# Install dependency PHP
composer instal
```

### 3. Instalasi Frontend (React)

```bash
# Install dependency Node.js
npm install
```

### 4. Konfigurasi Environment

```bash
# Salin file environment
cp .env.example .env

# Generate application key
php artisan key:generate
```

Buka file `.env` dan sesuaikan konfigurasi berikut:

```env
# App
APP_NAME="Hideo Hosting"
APP_ENV=local
APP_URL=http://localhost:8000
APP_DEBUG=true

# Database (default pakai SQLite, tidak perlu konfigurasi tambahan)
DB_CONNECTION=sqlite

# Domain untuk proyek yang di-deploy (ganti sesuai domain Anda)
# APP_DOMAIN=example.com

# IP server (digunakan untuk DNS record)
# APP_DOMAIN_IP=123.45.67.89

# Upload size limit (dalam KB, default 100MB)
MAX_UPLOAD_SIZE=102400
```

> **Catatan:** Secara default aplikasi menggunakan SQLite, jadi Anda tidak perlu menginstal MySQL untuk memulai. Jika ingin menggunakan MySQL, ubah `DB_CONNECTION=mysql` dan isi konfigurasi database di bawahnya.

### 5. Inisialisasi Database

```bash
# Jalankan migrasi database
php artisan migrate

# (Opsional) Seed data admin default
php artisan db:seed
```

Akun admin default setelah seed:
- **Email:** `admin@hideo.id`
- **Password:** `password`

### 6. Storage Link

```bash
php artisan storage:link
```

### 7. Build Frontend

```bash
npm run build
```

### 8. Jalankan Aplikasi

```bash
php artisan serve
```

Aplikasi bisa diakses di `http://localhost:8000`.

## Konfigurasi Docker

Docker diperlukan untuk mengdeploy proyek pengguna. Pastikan Docker sudah terinstal dan service Docker berjalan:

```bash
# Cek versi Docker
docker --version

# Cek status Docker service
sudo systemctl status docker
```

Buat Docker network untuk kontainer:

```bash
docker network create hideo_network
```

### Mengizinkan Docker tanpa sudo (opsional)

```bash
sudo usermod -aG docker $USER
# Logout dan login ulang agar efektif
```

## Konfigurasi Nginx (Production)

Untuk production, Nginx digunakan sebagai reverse proxy ke kontainer Docker proyek. Jalankan script deployment untuk generate config Nginx otomatis, atau konfigurasi manual:

```nginx
server {
    listen 80;
    server_name ~^(?<subdomain>[^.]+)\.example\.com$;

    location / {
        proxy_pass http://127.0.0.1:3000/p/$subdomain;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Konfigurasi Cloudflare Tunnel (Opsional)

Cloudflare Tunnel memungkinkan Anda mengekspos proyek ke internet tanpa domain atau SSL manual.

1. Daftar akun Cloudflare dan buat tunnel
2. Masukkan API Token, Zone ID, dan Account ID di halaman pengaturan proyek
3. Klik **Setup Tunnel** di dashboard proyek
4. Jalankan perintah tunnel yang diberikan di server Anda

## Struktur Aplikasi

```
project-hosting/
├── app/
│   ├── Actions/Fortify/     # Aksi autentikasi (register, login)
│   ├── Http/Controllers/    # API controllers
│   ├── Models/              # Eloquent models
│   └── Services/            # Layanan inti (Docker, Cloudflare, Scanner)
├── config/
├── database/
│   ├── migrations/          # Struktur database
│   └── seeders/             # Data awal
├── public/
├── resources/
│   ├── css/                 # Tailwind & theme CSS
│   └── js/
│       ├── components/      # Komponen UI reusable
│       └── pages/
│           ├── auth/        # Halaman login, register, dll
│           └── dashboard/   # Halaman dashboard utama
├── routes/
│   ├── api.php              # API routes
│   └── web.php              # Web routes
└── docker-compose.yml       # MySQL (opsional)
```

## Perintah Berguna

```bash
# Development (jalankan backend & frontend secara bersamaan)
php artisan serve
npm run dev

# Build frontend untuk production
npm run build

# Format kode PHP
vendor/bin/pint

# Jalankan test
php artisan test

# Seed ulang database
php artisan migrate:fresh --seed

# Lihat log aplikasi
php artisan pail
```

## Troubleshooting

| Masalah | Solusi |
| ------- | ------ |
| "Vite manifest not found" | Jalankan `npm run build` atau `npm run dev` |
| Docker build gagal | Pastikan Docker service berjalan: `sudo systemctl start docker` |
| Port sudah terpakai | Ubah port di `.env` (`APP_URL=http://localhost:8080`) atau gunakan port lain |
| File upload gagal | Cek batas upload di `.env` (`MAX_UPLOAD_SIZE`) dan `upload_max_filesize` di `php.ini` |
| Proyek tidak bisa diakses | Pastikan Nginx sudah di-reload setelah deploy: `sudo nginx -s reload` |

## Lisensi

MIT
