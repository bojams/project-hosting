import { Head, Link } from '@inertiajs/react'
import { Upload, Eye, FolderKanban, Globe, Container, Cpu, Rocket, Settings, FileCode, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: Upload,
    title: 'Upload Proyek',
    desc: 'Unggah via ZIP, drag-drop, atau impor langsung dari GitHub. Diekstrak otomatis dan siap deploy.',
  },
  {
    icon: Eye,
    title: 'Preview Instan',
    desc: 'Dapatkan URL preview langsung setelah upload. Bagikan ke siapa saja sebelum go live.',
  },
  {
    icon: FolderKanban,
    title: 'Manajemen File',
    desc: 'Jelajahi, unggah, hapus, dan atur file langsung dari dashboard dengan mudah.',
  },
  {
    icon: Container,
    title: 'Deploy Docker',
    desc: 'Setiap proyek berjalan di container Docker terisolasi. Deteksi framework otomatis dan build otomatis.',
  },
  {
    icon: Globe,
    title: 'Domain Kustom',
    desc: 'Hubungkan domain sendiri dengan setup DNS Cloudflare otomatis dan SSL via Cloudflare Tunnel.',
  },
  {
    icon: Cpu,
    title: 'Auto Deteksi Framework',
    desc: 'Mendukung Next.js, React, Vue, Laravel, Django, HTML statis, dan banyak lagi secara out of the box.',
  },
]

const frameworks = [
  'Next.js', 'React', 'Vue', 'Angular', 'Svelte', 'Nuxt',
  'Laravel', 'Django', 'Flask', 'Express', 'Rails', 'Static HTML',
]

const setupSteps = [
  {
    num: 1,
    icon: Settings,
    title: 'Buat Akun & Login',
    desc: 'Daftar akun baru di Hideo Hosting. Setelah disetujui admin, Anda akan mendapatkan akses ke dashboard.',
    details: [
      'Klik "Get started" dan isi form registrasi',
      'Tunggu admin menyetujui akun Anda',
      'Login dengan email dan password',
    ],
  },
  {
    num: 2,
    icon: FolderKanban,
    title: 'Buat Proyek Baru',
    desc: 'Buat proyek baru dari dashboard untuk mulai mengelola source code Anda.',
    details: [
      'Buka halaman "Projects" di sidebar',
      'Klik tombol "+" untuk buat proyek baru',
      'Isi nama proyek dan deskripsi (opsional)',
      'Proyek akan muncul di daftar projects Anda',
    ],
  },
  {
    num: 3,
    icon: Upload,
    title: 'Upload Source Code',
    desc: 'Unggah file proyek Anda ke server. Bisa langsung drag-drop atau upload ZIP.',
    details: [
      'Buka detail proyek dengan klik nama proyek',
      'Masuk ke tab "Files"',
      'Drag-drop file atau klik untuk pilih file',
      'Untuk project besar, upload folder dalam format .zip',
      'File akan diekstrak otomatis ke server',
    ],
  },
  {
    num: 4,
    icon: FileCode,
    title: 'Konfigurasi Build',
    desc: 'Atur konfigurasi build dan deploy sesuai kebutuhan framework Anda.',
    details: [
      'Buka tab "Configuration" di detail proyek',
      'Klik "Scan" untuk deteksi framework otomatis',
      'Atau isi manual: Build Command, Output Directory, Port',
      'Pilih database jika diperlukan (MySQL/PostgreSQL/SQLite)',
      'Klik "Save Configuration" untuk menyimpan',
    ],
  },
  {
    num: 5,
    icon: Rocket,
    title: 'Deploy & Akses',
    desc: 'Deploy proyek Anda dan akses langsung dari browser.',
    details: [
      'Klik tombol "Deploy" di detail proyek',
      'Tunggu proses build dan deploy selesai (1-3 menit)',
      'Setelah "Running", proyek bisa diakses via URL preview',
      'Gunakan Cloudflare Tunnel untuk akses dari internet',
      'Atau hubungkan domain kustom Anda sendiri',
    ],
  },
]

export default function Welcome() {
  return (
    <>
      <Head title="Hideo Hosting" />
      <div className="min-h-screen bg-[var(--color-bg-base)] overflow-y-auto">
        <header className="border-b border-[rgba(255,255,255,0.06)]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                  <span className="text-[var(--color-on-primary)] font-bold text-xs sm:text-sm font-[var(--font-display)]">H</span>
                </div>
                <span className="text-base sm:text-xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Hideo Hosting</span>
              </Link>
              <div className="flex items-center gap-1.5 sm:gap-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] px-2 sm:px-3 py-2"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-3 sm:px-5 py-2 sm:py-2.5 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] transition-all"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:grid lg:grid-cols-2 items-center gap-8 lg:gap-10">
                <div className="text-center lg:text-left w-full">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-[var(--color-on-surface)] font-[var(--font-display)] leading-tight">
                    Deploy proyek web Anda
                    <span className="text-[var(--color-primary)] block">dalam hitungan detik.</span>
                  </h1>
                  <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-[var(--color-on-surface-variant)] max-w-2xl mx-auto lg:mx-0">
                    Unggah, preview, dan kelola proyek web Anda dengan mudah.
                    Deteksi framework otomatis, deploy dengan Docker, dan bagikan secara instan — tanpa perlu konfigurasi rumit.
                  </p>
                  <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4">
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-6 py-3 text-sm sm:text-base font-semibold rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] w-full sm:w-auto"
                    >
                      Mulai deploy sekarang
                    </Link>
                    <Link
                      href="#cara-kerja"
                      className="inline-flex items-center justify-center px-5 py-3 text-sm sm:text-base font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] w-full sm:w-auto"
                    >
                      Pelajari selengkapnya
                    </Link>
                  </div>
                </div>

                <div className="hidden lg:flex items-center justify-center w-full">
                  <div className="w-full max-w-md bg-[var(--color-surface-container)] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 sm:p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--color-surface-container-high)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[var(--color-primary)]">ZIP</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-24 rounded-full bg-[var(--color-primary)]/30" />
                          <div className="h-2 w-32 rounded-full bg-[var(--color-outline-variant)] mt-1.5" />
                        </div>
                        <span className="text-xs text-[var(--color-success)] shrink-0">Deployed</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--color-surface-container-high)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-secondary-dim)] flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[var(--color-secondary)]">GH</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-32 rounded-full bg-[var(--color-secondary)]/30" />
                          <div className="h-2 w-24 rounded-full bg-[var(--color-outline-variant)] mt-1.5" />
                        </div>
                        <span className="text-xs text-[var(--color-success)] shrink-0">Live</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--color-surface-container-high)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[var(--color-primary)]">N</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-40 rounded-full bg-[var(--color-primary)]/30" />
                          <div className="h-2 w-28 rounded-full bg-[var(--color-outline-variant)] mt-1.5" />
                        </div>
                        <span className="text-xs text-[var(--color-success)] shrink-0">Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-12 sm:py-16 lg:py-20 bg-[var(--color-surface-container)]">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                  Yang Anda butuhkan untuk hosting
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[var(--color-on-surface-variant)] max-w-2xl mx-auto px-4">
                  Dari upload hingga live — semua alat untuk mengelola proyek web Anda dalam satu tempat.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {features.map((f) => (
                  <div key={f.title} className="p-5 sm:p-6 rounded-xl bg-[var(--color-bg-card)] border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 transition-all duration-300">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center mb-3 sm:mb-4">
                      <f.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">{f.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-[var(--color-on-surface-variant)] leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="cara-kerja" className="py-12 sm:py-16 lg:py-20">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                  Cara Setup Project
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[var(--color-on-surface-variant)] max-w-2xl mx-auto px-4">
                  Ikuti langkah-langkah berikut untuk mulai deploy proyek Anda di Hideo Hosting.
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
                {setupSteps.map((step) => (
                  <div key={step.num} className="relative pl-12 sm:pl-16">
                    {/* Step number circle */}
                    <div className="absolute left-0 top-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                      <span className="text-sm sm:text-base font-bold text-[var(--color-primary)] font-[var(--font-display)]">{step.num}</span>
                    </div>

                    {/* Connector line */}
                    {step.num < setupSteps.length && (
                      <div className="absolute left-[18px] sm:left-[20px] top-10 sm:top-11 w-px h-[calc(100%+24px)] bg-[var(--color-outline-variant)] opacity-30" />
                    )}

                    {/* Content */}
                    <div className="pb-2">
                      <div className="flex items-center gap-2.5 mb-2">
                        <step.icon className="h-5 w-5 text-[var(--color-primary)] shrink-0" />
                        <h3 className="text-base sm:text-lg font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm text-[var(--color-on-surface-variant)] mb-3 leading-relaxed">
                        {step.desc}
                      </p>
                      <ul className="space-y-1.5">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[var(--color-on-surface-variant)]">
                            <CheckCircle className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Supported Frameworks */}
          <section className="py-12 sm:py-16 lg:py-20 bg-[var(--color-surface-container)]">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                  Framework yang Didukung
                </h2>
                <p className="mt-3 text-sm text-[var(--color-on-surface-variant)]">
                  Deteksi otomatis dan deploy dengan konfigurasi yang tepat.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-mono rounded-[var(--radius)] bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[rgba(255,255,255,0.06)]"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 sm:py-16 lg:py-20">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                Siap untuk deploy?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-on-surface-variant)] max-w-lg mx-auto">
                Buat akun gratis dan deploy proyek pertama Anda dalam hitungan menit.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 mt-6 sm:mt-8 text-sm sm:text-base font-semibold rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] w-full sm:w-auto"
              >
                Daftar gratis
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-[rgba(255,255,255,0.06)] py-6 sm:py-8">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-outline)]">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                <span className="text-[var(--color-on-primary)] font-bold text-[10px] sm:text-xs font-[var(--font-display)]">H</span>
              </div>
              Hideo Hosting
            </div>
            <p className="text-xs text-[var(--color-outline)]">
              &copy; {new Date().getFullYear()} Hideo Hosting. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
