import { Head, router } from '@inertiajs/react'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Project, ApiResponse } from '@/types/api'
import { Plus, FolderKanban, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProjectsIndex() {
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const limit = 20

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filterStatus) params.set('status', filterStatus)
      const res = await api.get<ApiResponse<Record<string, unknown>>>(`/api/projects?${params}`)
      if (res.success && res.data) {
        setProjects(res.data.projects as Project[] || [])
        setTotal(res.data.total as number)
      }
    } catch {
      toast.error('Gagal memuat proyek')
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus])

  useEffect(() => {
    const t = setTimeout(() => { loadProjects() })
    return () => clearTimeout(t)
  }, [loadProjects])

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post<ApiResponse<Project>>('/api/projects', { name, description: description || undefined })
      setName('')
      setDescription('')
      setShowCreate(false)
      loadProjects()
    } catch {
      toast.error('Gagal membuat proyek')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete<ApiResponse<void>>(`/api/projects/${id}`)
      setDeletingId(null)
      loadProjects()
    } catch {
      toast.error('Gagal menghapus proyek')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <Head title="Projects" />
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Projects</h1>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Kelola proyek hosting Anda
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_16px_rgb(0,255,102,0.25)] transition-all duration-200"
          >
            {!showCreate && <Plus className="h-3.5 w-3.5" />}
            {showCreate ? 'Batal' : 'Baru'}
          </button>
        </div>

        {showCreate && (
          <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-lg border border-[rgba(255,255,255,0.06)] p-4">
            <form onSubmit={createProject} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Nama Proyek</label>
                <input
                  placeholder="My Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="block w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-1.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Deskripsi (opsional)</label>
                <input
                  placeholder="Deskripsi singkat"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-1.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_16px_rgb(0,255,102,0.25)] transition-all duration-200 disabled:opacity-50"
              >
                {creating && (
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Buat Proyek
              </button>
            </form>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'published', 'draft', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1) }}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-[var(--radius)] border transition-all duration-200 ${
                filterStatus === s
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] font-semibold'
                  : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] hover:border-[var(--color-outline)]'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Semua'}
            </button>
          ))}
        </div>

        <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-lg border border-[rgba(255,255,255,0.06)]">
          <div className="px-4 py-3">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-[var(--color-surface-container-high)] rounded-[var(--radius)] animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="h-8 w-8 text-[var(--color-outline)] mx-auto mb-2" />
                <p className="text-xs text-[var(--color-on-surface-variant)]">Belum ada proyek. Buat yang pertama!</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius)] border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-container-high)] transition-all duration-200 group"
                  >
                    <div
                      onClick={() => router.visit(`/dashboard/projects/${project.id}`)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="font-medium truncate text-sm text-[var(--color-on-surface)]">{project.name}</p>
                      <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate font-mono">
                        /{project.slug} &middot; {formatDate(project.created_at)}
                        {project.framework && <span className="ml-1.5 text-[10px] text-[var(--color-primary)]">({project.framework})</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      {project.container_status === 'running' && (
                        <a
                          href={project.custom_domain
                            ? `https://${project.domain ? project.domain + '.' : ''}${project.custom_domain}`
                            : `/p/${project.slug}`
                          }
                          target="_blank"
                          onClick={e => e.stopPropagation()}
                          className="p-1 text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors"
                          title="Lihat situs"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider font-medium rounded-full
                          ${project.status === 'published' ? 'bg-[var(--color-primary-dim)] text-[var(--color-success)]' : ''}
                          ${project.status === 'draft' ? 'bg-[var(--color-secondary-dim)] text-[var(--color-secondary)]' : ''}
                          ${project.status === 'archived' ? 'bg-[var(--color-surface-container-high)] text-[var(--color-outline)]' : ''}
                        `}
                      >
                        {project.status}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(project.id) }}
                        className="p-1 sm:opacity-0 sm:group-hover:opacity-100 text-[var(--color-outline)] hover:text-[var(--color-danger)] transition-all max-sm:opacity-100"
                        aria-label="Hapus proyek"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 rounded-[var(--radius)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {(() => {
                  const maxVisible = 5
                  const start = Math.max(1, Math.min(page - Math.floor(maxVisible / 2), totalPages - maxVisible + 1))
                  const end = Math.min(start + maxVisible - 1, totalPages)
                  const pages: number[] = []
                  for (let i = start; i <= end; i++) pages.push(i)
                  return pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 text-[9px] sm:text-[10px] font-medium rounded-[var(--radius)] transition-colors ${
                        page === p
                          ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                          : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                      }`}
                    >
                      {p}
                    </button>
                  ))
                })()}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1 rounded-[var(--radius)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeletingId(null)}>
            <div className="bg-[var(--color-surface-container)] backdrop-blur-xl rounded-lg shadow-2xl border border-[rgba(255,255,255,0.06)] p-4 max-w-xs w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold mb-1 text-[var(--color-on-surface)] font-[var(--font-display)]">Hapus Proyek</h3>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-3">
                Yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-[0_0_16px_rgb(255,180,171,0.2)] transition-all"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
