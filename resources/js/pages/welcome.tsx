import { Head, Link, usePage } from '@inertiajs/react'
import { Upload, Eye, FolderKanban, Globe, Container, Cpu, Rocket, Settings, FileCode, Shield, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'
import { useState } from 'react'
import BrandLogo from '@/components/brand-logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useInitials } from '@/hooks/use-initials'
import { dashboard, logout } from '@/routes'
import { edit } from '@/routes/profile'

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
    icon: Settings,
    title: 'Buat Akun & Login',
    details: [
      'Klik "Masuk" dan masukkan email dan password',
      'Gunakan akun yang sudah terdaftar',
      'Akses dashboard setelah login sukses',
    ],
  },
  {
    icon: FolderKanban,
    title: 'Buat Proyek Baru',
    details: [
      'Buka halaman "Projects" di sidebar',
      'Klik tombol "+" untuk buat proyek baru',
      'Isi nama proyek dan deskripsi (opsional)',
    ],
  },
  {
    icon: Upload,
    title: 'Upload Source Code',
    details: [
      'Buka detail proyek dengan klik nama proyek',
      'Masuk ke tab "Files"',
      'Drag-drop file atau klik untuk pilih file',
      'Untuk project besar, upload dalam format .zip',
    ],
  },
  {
    icon: FileCode,
    title: 'Konfigurasi Build',
    details: [
      'Buka tab "Configuration" di detail proyek',
      'Klik "Scan" untuk deteksi framework otomatis',
      'Atau isi manual: Build Command, Output Directory, Port',
      'Pilih database jika diperlukan',
      'Klik "Save Configuration"',
    ],
  },
  {
    icon: Rocket,
    title: 'Deploy & Akses',
    details: [
      'Klik tombol "Deploy" di detail proyek',
      'Tunggu proses build dan deploy selesai (1-3 menit)',
      'Setelah "Running", proyek bisa diakses via URL preview',
    ],
  },
  {
    icon: Shield,
    title: 'Cloudflare Tunnel (Opsional)',
    details: [
      'Buka detail proyek, masuk ke tab "Configuration"',
      'Masukkan Cloudflare API Token',
      'Masukkan Zone ID (lihat di halaman domain di Cloudflare)',
      'Masukkan Account ID (lihat di Cloudflare Dashboard)',
      'Klik "Setup Tunnel" dan jalankan perintah di server',
    ],
  },
]

export default function Welcome() {
  const [openStep, setOpenStep] = useState<number | null>(null)
  const { auth } = usePage<{ auth: { user: { id: number; username: string; email: string; avatar?: string } | null } }>().props
  const user = auth?.user
  const getInitials = useInitials()

  return (
    <>
      <Head title="" />
      <div className="min-h-screen bg-[var(--color-bg-base)] overflow-y-auto">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.06)]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center shrink-0">
                <Link href="/" className="block">
                  <BrandLogo className="h-16 sm:h-20 w-auto" />
                </Link>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-full focus:outline-none">
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                          <AvatarImage src={user.avatar} alt={user.username} />
                          <AvatarFallback className="text-sm">{getInitials(user.username)}</AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href={dashboard()} prefetch className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={edit()} prefetch className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={logout()} method="post" as="button" className="cursor-pointer w-full">
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login" className="inline-flex items-center px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_16px_rgb(0,255,102,0.3)] transition-all">
                    Masuk
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="relative py-10 sm:py-14 lg:py-20 overflow-hidden">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:grid lg:grid-cols-2 items-center gap-6 lg:gap-8">
                <div className="text-center lg:text-left w-full">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-[var(--color-on-surface)] font-[var(--font-display)] leading-tight">
                    Deploy proyek web Anda
                    <span className="text-[var(--color-primary)] block">dalam hitungan detik.</span>
                  </h1>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--color-on-surface-variant)] max-w-xl mx-auto lg:mx-0">
                    Unggah, preview, dan kelola proyek web Anda dengan mudah.
                    Deteksi framework otomatis, deploy dengan Docker, dan bagikan secara instan.
                  </p>
                  <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                    <Link href="/login" className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] w-full sm:w-auto">
                      Mulai deploy sekarang
                    </Link>
                    <Link href="#cara-kerja" className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] w-full sm:w-auto">
                      Pelajari selengkapnya
                    </Link>
                  </div>
                </div>
                <div className="hidden lg:flex items-center justify-center w-full">
                  <div className="w-full max-w-sm bg-[var(--color-surface-container)] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
                    <div className="space-y-2">
                      {[
                        { badge: 'ZIP', color: 'primary', label: 'Deployed' },
                        { badge: 'GH', color: 'secondary', label: 'Live' },
                        { badge: 'N', color: 'primary', label: 'Ready' },
                      ].map((item) => (
                        <div key={item.badge} className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--color-surface-container-high)]">
                          <div className={`w-8 h-8 rounded-full bg-[var(--color-${item.color}-dim)] flex items-center justify-center shrink-0`}>
                            <span className={`text-xs font-bold text-[var(--color-${item.color})]`}>{item.badge}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`h-2 w-24 rounded-full bg-[var(--color-${item.color})]/30`} />
                            <div className="h-2 w-32 rounded-full bg-[var(--color-outline-variant)] mt-1.5" />
                          </div>
                          <span className="text-xs text-[var(--color-success)] shrink-0">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="py-8 sm:py-12 lg:py-16 bg-[var(--color-surface-container)]">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                  Yang Anda butuhkan untuk hosting
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[var(--color-on-surface-variant)] max-w-xl mx-auto px-4">
                  Dari upload hingga live — semua alat untuk mengelola proyek web Anda dalam satu tempat.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {features.map((f) => (
                  <div key={f.title} className="p-3 sm:p-4 rounded-xl bg-[var(--color-bg-card)] border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 transition-all duration-300">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center mb-2 sm:mb-3">
                      <f.icon className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">{f.title}</h3>
                    <p className="mt-1 text-[10px] sm:text-xs text-[var(--color-on-surface-variant)] leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Setup Cards */}
          <section id="cara-kerja" className="py-8 sm:py-12 lg:py-16">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                  Cara Setup Project
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[var(--color-on-surface-variant)] max-w-xl mx-auto px-4">
                  Klik setiap langkah untuk melihat panduan lengkapnya.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {setupSteps.map((step, i) => {
                  const isOpen = openStep === i
                  const StepIcon = step.icon

                  return (
                    <div
                      key={i}
                      className={`rounded-xl border transition-all duration-200 ${
                        isOpen
                          ? 'bg-[var(--color-surface-container-high)] border-[var(--color-primary)]/30 shadow-[0_0_20px_rgba(0,255,102,0.05)]'
                          : 'bg-[var(--color-bg-card)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                      }`}
                    >
                      <button
                        onClick={() => setOpenStep(isOpen ? null : i)}
                        className="w-full flex items-center gap-3 p-4 text-left"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isOpen ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-primary-dim)]'
                        }`}>
                          <StepIcon className={`h-4 w-4 ${isOpen ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-primary)]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">
                            {step.title}
                          </h3>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-[var(--color-outline)] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="border-t border-[rgba(255,255,255,0.06)] pt-3">
                            <ul className="space-y-1.5">
                              {step.details.map((detail, j) => (
                                <li key={j} className="flex items-start gap-2 text-xs text-[var(--color-on-surface-variant)]">
                                  <span className="w-4 h-4 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[9px] font-bold text-[var(--color-primary)]">{j + 1}</span>
                                  </span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Frameworks */}
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
                  <span key={fw} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-mono rounded-[var(--radius)] bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[rgba(255,255,255,0.06)]">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-8 sm:py-10 lg:py-12">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                Siap untuk deploy?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[var(--color-on-surface-variant)] max-w-md mx-auto">
                Buat akun gratis dan deploy proyek pertama Anda dalam hitungan menit.
              </p>
              <Link href="/login" className="inline-flex items-center justify-center px-5 py-2 mt-4 text-sm font-semibold rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] w-full sm:w-auto">
                Mulai deploy sekarang
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[rgba(255,255,255,0.06)] py-6">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <p className="text-xs text-[var(--color-outline)]">
              &copy; {new Date().getFullYear()} Hideo Hosting. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
