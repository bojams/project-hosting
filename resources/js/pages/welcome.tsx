import { Head, Link } from '@inertiajs/react'
import { Upload, Eye, FolderKanban, Globe, Container, Cpu } from 'lucide-react'

const features = [
  {
    icon: Upload,
    title: 'Upload Projects',
    desc: 'Upload via ZIP, drag-drop, or import directly from GitHub. Auto-extract and ready to deploy.',
  },
  {
    icon: Eye,
    title: 'Instant Preview',
    desc: 'Get a live preview URL immediately after upload. Share with anyone before going live.',
  },
  {
    icon: FolderKanban,
    title: 'File Management',
    desc: 'Browse, upload, delete, and organize files directly from the dashboard with ease.',
  },
  {
    icon: Container,
    title: 'Docker Deploy',
    desc: 'Each project runs in an isolated Docker container. Auto-detects framework and builds automatically.',
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    desc: 'Connect your own domain with automatic Cloudflare DNS setup and SSL via Cloudflare Tunnel.',
  },
  {
    icon: Cpu,
    title: 'Auto Framework Detection',
    desc: 'Supports Next.js, React, Vue, Laravel, Django, static HTML, and many more out of the box.',
  },
]

const frameworks = [
  'Next.js', 'React', 'Vue', 'Angular', 'Svelte', 'Nuxt',
  'Laravel', 'Django', 'Flask', 'Express', 'Rails', 'Static HTML',
]

export default function Welcome() {
  return (
    <>
      <Head title="Hideo Hosting" />
      <div className="min-h-screen bg-[var(--color-bg-base)]">
        <header className="border-b border-[rgba(255,255,255,0.06)]">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                  <span className="text-[var(--color-on-primary)] font-bold text-sm font-[var(--font-display)]">H</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Hideo Hosting</span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] px-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)]"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          <section className="relative py-20 sm:py-28 overflow-hidden">
            <div className="max-w-[1440px] mx-auto px-5 sm:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10">
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-[var(--color-on-surface)] font-[var(--font-display)]">
                    Deploy your web projects
                    <span className="text-[var(--color-primary)] block">in seconds.</span>
                  </h1>
                  <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[var(--color-on-surface-variant)] max-w-2xl mx-auto lg:mx-0">
                    Upload, preview, and manage your web projects with ease.
                    Auto-detect frameworks, deploy with Docker, and share instantly — no config needed.
                  </p>
                  <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4">
                    <Link
                      href="/register"
                      className="inline-flex items-center px-6 py-3 text-base font-semibold rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)]"
                    >
                      Start deploying
                    </Link>
                    <Link
                      href="#features"
                      className="inline-flex items-center px-5 py-3 text-base font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>

                <div className="hidden lg:flex items-center justify-center">
                  <div className="w-full max-w-md bg-[var(--color-surface-container)] rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--color-surface-container-high)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center">
                          <span className="text-xs font-bold text-[var(--color-primary)]">ZIP</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-24 rounded-full bg-[var(--color-primary)]/30" />
                          <div className="h-2 w-32 rounded-full bg-[var(--color-outline-variant)] mt-1.5" />
                        </div>
                        <span className="text-xs text-[var(--color-success)]">Deployed</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--color-surface-container-high)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-secondary-dim)] flex items-center justify-center">
                          <span className="text-xs font-bold text-[var(--color-secondary)]">GH</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-32 rounded-full bg-[var(--color-secondary)]/30" />
                          <div className="h-2 w-24 rounded-full bg-[var(--color-outline-variant)] mt-1.5" />
                        </div>
                        <span className="text-xs text-[var(--color-success)]">Live</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--color-surface-container-high)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center">
                          <span className="text-xs font-bold text-[var(--color-primary)]">N</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-40 rounded-full bg-[var(--color-primary)]/30" />
                          <div className="h-2 w-28 rounded-full bg-[var(--color-outline-variant)] mt-1.5" />
                        </div>
                        <span className="text-xs text-[var(--color-success)]">Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="py-16 sm:py-20 bg-[var(--color-surface-container)]">
            <div className="max-w-[1440px] mx-auto px-5 sm:px-8">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                  Everything you need to host
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[var(--color-on-surface-variant)] max-w-2xl mx-auto">
                  From upload to live — all the tools to manage your web projects in one place.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {features.map((f) => (
                  <div key={f.title} className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center mb-4">
                      <f.icon className="h-5 w-5 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">{f.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-on-surface-variant)] leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-20">
            <div className="max-w-[1440px] mx-auto px-5 sm:px-8">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                  Supported frameworks
                </h2>
                <p className="mt-3 text-sm text-[var(--color-on-surface-variant)]">
                  Auto-detected and deployed with the right configuration.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="px-4 py-2 text-sm font-mono rounded-[var(--radius)] bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[rgba(255,255,255,0.06)]"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-20 bg-[var(--color-surface-container)]">
            <div className="max-w-[1440px] mx-auto px-5 sm:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                Start hosting in 3 steps
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
                <div>
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-[var(--color-primary)] font-[var(--font-display)]">1</span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">Create account</h3>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">Sign up and get your personal dashboard ready.</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-[var(--color-primary)] font-[var(--font-display)]">2</span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">Upload project</h3>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">Drag-drop files, upload a ZIP, or import from GitHub.</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-[var(--color-primary)] font-[var(--font-display)]">3</span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">Deploy & share</h3>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">Deploy with one click and get a live URL instantly.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-20">
            <div className="max-w-[1440px] mx-auto px-5 sm:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
                Ready to deploy?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-on-surface-variant)] max-w-lg mx-auto">
                Create a free account and deploy your first project in minutes.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-3 mt-8 text-base font-semibold rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)]"
              >
                Get started free
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-[rgba(255,255,255,0.06)] py-8">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-outline)]">
              <div className="w-6 h-6 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                <span className="text-[var(--color-on-primary)] font-bold text-xs font-[var(--font-display)]">H</span>
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
