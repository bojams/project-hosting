<div align="center">

# 🔺 Hideo Hosting

**Platform hosting mandiri (self-hosted PaaS)** — deploy & kelola proyek web otomatis dengan Docker.

_Bahasa Indonesia · English_

</div>

---

**Hideo Hosting** adalah platform hosting mandiri (self-hosted PaaS) yang memungkinkan Anda men-deploy dan mengelola proyek web secara otomatis menggunakan Docker — lengkap dengan file manager, database otomatis, manajemen user, dan Cloudflare Tunnel.

**Hideo Hosting** is a self-hosted PaaS (Platform as a Service) that lets you deploy and manage web projects automatically using Docker — complete with a file manager, automatic databases, user management, and Cloudflare Tunnel.

> 🌐 **Bahasa Indonesia** adalah bahasa utama dokumen ini. Bagian penting juga disertakan dalam **English**.
> 🇬🇧 **English** is the primary language for code & commands; important sections include Indonesian translations.

---

## 📦 Fitur / Features

| Fitur / Feature | Deskripsi / Description |
| --- | --- |
| 🚀 **Deploy otomatis / Auto deploy** | Unggah source code, pilih framework, biarkan Docker bekerja. Upload your code, pick a framework, let Docker do the rest. |
| 🧩 **Multi-framework** | Laravel, Node.js, Python, Ruby, Go, dan static (HTML/CSS/JS). |
| 📁 **File manager** | Kelola file proyek langsung dari dashboard. Manage project files right from the dashboard. |
| 🗄️ **Database otomatis / Auto database** | MySQL, PostgreSQL, dan SQLite. |
| 👥 **Manajemen user / User management** | Role admin & user dengan persetujuan registrasi. |
| 🌐 **Cloudflare Tunnel** | Expose proyek ke internet tanpa domain atau port forwarding. |
| 🔗 **Domain kustom / Custom domain** | Hubungkan domain sendiri ke proyek yang sudah di-deploy. |
| 📱 **Responsive** | Dashboard dapat diakses dari desktop maupun mobile. |

---

## ✅ Persyaratan Sistem / System Requirements

| Komponen / Component | Versi | Keterangan / Notes |
| --- | --- | --- |
| **PHP** | 8.3+ | Ekstensi: `curl`, `zip`, `mbstring`, `openssl`, `pdo` |
| **Node.js** | 18+ | Untuk build frontend / for frontend build |
| **Composer** | 2.0+ | PHP dependency manager |
| **Docker** | 24.0+ | Untuk build & jalankan container / to build & run containers |
| **Nginx** | 1.18+ | Reverse proxy (opsional untuk development) |
| **SQLite** | — | Database default, sudah ada di PHP / bundled with PHP |
| **MySQL / MariaDB** | 8.0+ | Alternatif database (opsional / optional) |

---

## 🚀 Panduan Instalasi / Installation Guide

### 1️⃣ Clone & masuk folder

```bash
git clone https://github.com/bojams/project-hosting.git
cd project-hosting
```

### 2️⃣ Install dependency backend

```bash
composer install
```

### 3️⃣ Install dependency frontend

```bash
npm install
```

### 4️⃣ Buat file environment

```bash
# Salin file environment / copy the environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 5️⃣ Konfigurasi `.env`

Buka file `.env` dan sesuaikan bagian-bagian berikut — / edit the file and adjust the settings below:

```env
# Aplikasi / App
APP_NAME="Hideo Hosting"
APP_ENV=local
APP_URL=http://localhost:8000
APP_DEBUG=true

# Database (default SQLite — tidak perlu / no extra config needed)
DB_CONNECTION=sqlite

# Domain untuk proyek yang di-deploy / Domain for deployed projects
# APP_DOMAIN=example.com

# IP server (digunakan untuk DNS record / used for DNS records)
# APP_DOMAIN_IP=123.45.67.89

# Upload size limit (dalam KB / in KB, default 100MB)
MAX_UPLOAD_SIZE=102400
```

> 💡 **Tips:** Secara default aplikasi memakai SQLite sehingga tidak perlu menginstal MySQL untuk memulai.
> *(By default the app uses SQLite — you don't need MySQL to get started.)*
> Untuk MySQL, ubah ke `DB_CONNECTION=mysql` dan isi konfigurasi database di bawahnya.

### 6️⃣ Inisialisasi database & seed

```bash
# Jalankan migrasi / Run migrations
php artisan migrate

# (Opsional) Seed data admin default
php artisan db:seed
```

**Akun admin default / Default admin account:**

| Field | Value |
| --- | --- |
| 📧 **Email** | `admin@hideo.id` |
| 🔑 **Password** | `password` |

> ⚠️ **Harap ganti password** setelah masuk pertama kali / *Please change the password after first login.*

### 7️⃣ Storage link & build frontend

```bash
php artisan storage:link
npm run build
```

### 8️⃣ Jalankan aplikasi

```bash
php artisan serve
```

Aplikasi bisa diakses di **http://localhost:8000** / available at `http://localhost:8000`.

---

## 🐳 Konfigurasi Docker

Docker dibutuhkan untuk men-deploy proyek pengguna. / Docker is required to deploy user projects.

```bash
# Cek versi Docker / Check Docker version
docker --version

# Pilih satu / create a shared Docker network
docker network create hideo_network
```

### Mengizinkan Docker tanpa sudo (opsional)

```bash
sudo usermod -aG docker $USER
# Logout lalu login ulang agar berlaku / Log out and back in for it to take effect
```

---

## 🔧 Konfigurasi Nginx (Production)

Nginx bertindak sebagai reverse proxy ke container Docker proyek.

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

---

## 🌐 Cloudflare Tunnel (Opsional

Cloudflare Tunnel memungkinkan Anda expose proyek ke internet tanpa domain atau SSL manual.

1. Daftarkan akun Cloudflare dan buat tunnel / *Create a Cloudflare account and a tunnel*
2. Masukkan **API Token**, **Zone ID**, dan **Account ID** di halaman pengaturan proyek / *Enter them in the project settings page*
3. Klik **Setup Tunnel** di dashboard proyek
4. Jalankan perintah tunnel yang diberikan di server Anda

---

## 🗂️ Struktur Aplikasi / Application Structure

```
project-hosting/
├── app/
│   ├── Actions/Fortify/     # Autentikasi (register, login) / Authentication
│   ├── Http/Controllers/    # API controllers
│   ├── Models/              # Eloquent models
│   └── Services/            # Layanan inti (Docker, Cloudflare, Scanner)
├── config/                  # Konfigurasi aplikasi
├── database/
│   ├── migrations/          # Struktur database
│   └── seeders/             # Data awal
├── public/
├── resources/
│   ├── css/                 # Tailwind & theme CSS
│   └── js/
│       ├── components/      # UI components (reusable)
│       └── pages/
│           ├── auth/        # Login, register, dll.
│           └── dashboard/   # Dashboard utama
├── routes/
│   ├── api.php              # API routes
│   └── web.php              # Web routes
└── docker-compose.yml       # MySQL (opsional)
```

---

## 🛠️ Perintah Berguna / Useful Commands

```bash
# Development — jalankan backend & frontend / run backend & frontend together
php artisan serve
npm run dev

# Build frontend untuk production
npm run build

# Format kode / Format code (PHP)
vendor/bin/pint

# Jalankan test / Run tests
php artisan test

# Seed ulang database / Re-seed the database
php artisan migrate:fresh --seed

# Lihat log aplikasi / View app logs (live)
php artisan pail
```

---

## ❓ Troubleshooting

| Masalah / Problem | Solusi / Solution |
| --- | --- |
| **"Vite manifest not found"** | Jalankan `npm run build` atau `npm run dev` |
| **Docker build gagal / Docker build fails** | Cek Docker service: `sudo systemctl start docker` |
| **Port sudah terpakai / Port already in use** | Ubah port di `.env` (`APP_URL=http://localhost:8080`) |
| **File upload gagal / Upload fails** | Cek `MAX_UPLOAD_SIZE` dan `upload_max_filesize` di `php.ini` |
| **Proyek tidak bisa diakses / Can't access project** | Reload Nginx: `sudo nginx -s reload` |

---

## 💡 FAQ Singkat

**1. Apa itu self-hosted PaaS?**  
Continuous: Anda menjalankan seluruh platform di server Anda sendiri — data dan aplikasi Anda tetap di server milikmu, tidak "split" ke pihak ketiga.

**2. Mengapa memakai Docker?**  
Isolasi lingkungan proyek — setiap proyek berjalan dalam container terpisah, aman dan mudah dikelola.

**3. Bisa pakai database MySQL?**  
Ya — ubah `DB_CONNECTION=mysql` di `.env`, lalu isi kredensial di bawahnya.

---

<div align="center">

**Hideo Hosting** · Built with ❤️ using Laravel, React, Inertia.js & Tailwind CSS

</div>

## 📄 Lisensi / License

MIT License — silakan digunakan, dimodifikasi, dan disebarluaskan.
*MIT License — free to use, modify, and distribute.*