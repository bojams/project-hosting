import { Head, Link } from '@inertiajs/react'
import { BookOpen, FileEdit } from 'lucide-react'

interface Guide {
  slug: string
  title: string
  excerpt: string
  body: string
}

interface Props {
  guides: Guide[]
}

export default function DocsIndex({ guides }: Props) {
  return (
    <>
      <Head title="Documentation" />
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Documentation</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Guides and references for using Hideo Hosting
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/dashboard/docs/${guide.slug}`}
              className="block p-5 rounded-xl bg-[var(--color-bg-card)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-container-high)] transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <h2 className="font-semibold text-sm text-[var(--color-on-surface)]">{guide.title}</h2>
              </div>
              {guide.excerpt && (
                <p className="text-xs text-[var(--color-on-surface-variant)] ml-12">{guide.excerpt}</p>
              )}
            </Link>
          ))}
        </div>

        <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <FileEdit className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="font-semibold text-sm text-[var(--color-on-surface)] font-[var(--font-display)]">Customize Documentation</h2>
          </div>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-2">
            Semua guide ini adalah file markdown (.md) yang bisa kamu edit sendiri.
          </p>
          <div className="text-sm text-[var(--color-on-surface-variant)] space-y-1">
            <p>📁 Lokasi file: <code className="text-xs font-mono bg-[var(--color-surface-container-high)] text-[var(--color-primary)] px-1.5 py-0.5 rounded">storage/app/docs/</code></p>
            <p>✏️ Edit file yang ada, atau buat file <code className="text-xs font-mono bg-[var(--color-surface-container-high)] text-[var(--color-primary)] px-1.5 py-0.5 rounded">nama-guide-baru.md</code></p>
            <p>📄 Guide baru akan otomatis muncul di halaman ini setelah di-refresh</p>
          </div>
        </div>
      </div>
    </>
  )
}
