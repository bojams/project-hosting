import { Head, router } from '@inertiajs/react'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Project, ApiResponse } from '@/types/api'
import { Plus, FolderKanban, Trash2, ExternalLink } from 'lucide-react'

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
      const res = await api.get<ApiResponse<Record<string, unknown>>>(`/projects?${params}`)
      if (res.success && res.data) {
        setProjects(res.data.projects as Project[] || [])
        setTotal(res.data.total as number)
      }
    } catch {
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
      await api.post<ApiResponse<Project>>('/projects', { name, description: description || undefined })
      setName('')
      setDescription('')
      setShowCreate(false)
      loadProjects()
    } catch {
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete<ApiResponse<void>>(`/projects/${id}`)
      setDeletingId(null)
      loadProjects()
    } catch {
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <Head title="Projects" />
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Projects</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              Manage your hosted projects
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] transition-all duration-200"
          >
            {!showCreate && <Plus className="h-4 w-4" />}
            {showCreate ? 'Cancel' : 'New Project'}
          </button>
        </div>

        {showCreate && (
          <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
            <form onSubmit={createProject} className="space-y-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-[var(--color-on-surface-variant)] mb-1.5">Project Name</label>
                <input
                  placeholder="My Awesome Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-[var(--color-on-surface-variant)] mb-1.5">Description (optional)</label>
                <input
                  placeholder="A short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] transition-all duration-200 disabled:opacity-50"
              >
                {creating && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Create Project
              </button>
            </form>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {['', 'published', 'draft', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[var(--radius)] border transition-all duration-200 ${
                filterStatus === s
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] font-semibold'
                  : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] hover:border-[var(--color-outline)]'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
          <div className="px-6 py-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-[var(--color-surface-container-high)] rounded-[var(--radius)] animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderKanban className="h-12 w-12 text-[var(--color-outline)] mx-auto mb-4" />
                <p className="text-[var(--color-on-surface-variant)]">No projects yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-[var(--radius)] border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-container-high)] transition-all duration-200 group"
                  >
                    <div
                      onClick={() => router.visit(`/dashboard/projects/${project.id}`)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="font-medium truncate text-sm sm:text-base text-[var(--color-on-surface)]">{project.name}</p>
                      <p className="text-xs sm:text-sm text-[var(--color-on-surface-variant)] truncate font-mono">
                        /{project.slug} &middot; {formatDate(project.created_at)}
                        {project.framework && <span className="ml-2 text-xs text-[var(--color-primary)]">({project.framework})</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4">
                      {project.container_status === 'running' && (
                        <a
                          href={project.custom_domain && project.domain_status === 'active'
                            ? `https://${project.domain ? project.domain + '.' : ''}${project.custom_domain}`
                            : `/p/${project.slug}`
                          }
                          target="_blank"
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors"
                          title="View site"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-mono uppercase tracking-wider font-medium rounded-full
                          ${project.status === 'published' ? 'bg-[var(--color-primary-dim)] text-[var(--color-success)]' : ''}
                          ${project.status === 'draft' ? 'bg-[var(--color-secondary-dim)] text-[var(--color-secondary)]' : ''}
                          ${project.status === 'archived' ? 'bg-[var(--color-surface-container-high)] text-[var(--color-outline)]' : ''}
                        `}
                      >
                        {project.status}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(project.id) }}
                        className="p-1.5 sm:opacity-0 sm:group-hover:opacity-100 text-[var(--color-outline)] hover:text-[var(--color-danger)] transition-all"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-50 transition-all"
                >
                  Previous
                </button>
                <span className="text-xs sm:text-sm text-[var(--color-on-surface-variant)] font-mono">Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-50 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeletingId(null)}>
            <div className="bg-[var(--color-surface-container)] backdrop-blur-xl rounded-xl shadow-2xl border border-[rgba(255,255,255,0.06)] p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-2 text-[var(--color-on-surface)] font-[var(--font-display)]">Delete Project</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
                Are you sure you want to delete this project? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-[0_0_20px_rgb(255,180,171,0.2)] transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
