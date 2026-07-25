import { Head, Link, router, usePage } from '@inertiajs/react'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Project, ApiResponse } from '@/types/api'
import { FolderKanban, Globe, FileEdit, Clock, ExternalLink, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

function TimeElapsed({ since }: { since: string }) {
  const [text, setText] = useState('')

  useEffect(() => {
    const start = new Date(since).getTime()

    const update = () => {
      const diff = Date.now() - start
      if (diff < 0) { setText('Belum dimulai'); return }
      const totalSec = Math.floor(diff / 1000)
      const d = Math.floor(totalSec / 86400)
      const h = Math.floor((totalSec % 86400) / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      setText(`${d}h ${h}j ${m}m ${s}d`)
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [since])

  return <span>{text}</span>
}

export default function DashboardIndex() {
  const props = usePage().props as unknown as { auth: { user: { id: number; username: string; email: string; role: string } } }
  const { auth } = props
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 2
  const totalPages = Math.ceil(stats.total / limit)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<ApiResponse<{ projects: Project[]; total: number; published: number; draft: number }>>(`/api/projects?page=${page}&limit=${limit}`)
      if (res.success && res.data) {
        setProjects(res.data.projects || [])
        const d = res.data
        setStats({
          total: d.total,
          published: d.published ?? 0,
          draft: d.draft ?? 0,
        })
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <>
      <Head title="Dashboard" />
      <div className="flex flex-col h-full gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)] truncate">Welcome, {auth?.user?.username}</h1>
            <p className="text-xs sm:text-sm text-[var(--color-on-surface-variant)] mt-1">
              Here&apos;s an overview of your projects
            </p>
          </div>
          <Link href="/dashboard/projects" className="shrink-0">
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] transition-all duration-200 cursor-pointer">
              <Plus className="h-4 w-4" />
              New Project
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
          <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-[var(--color-on-surface-variant)]">
              <FolderKanban className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--color-primary)] shrink-0" />
              <span className="truncate">Total</span>
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold mt-1 text-[var(--color-on-surface)] font-[var(--font-display)]">{stats.total}</p>
          </div>
          <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-[var(--color-on-surface-variant)]">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--color-success)] shrink-0" />
              <span className="truncate">Live</span>
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold mt-1 text-[var(--color-success)] font-[var(--font-display)]">{stats.published}</p>
          </div>
          <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-[var(--color-on-surface-variant)]">
              <FileEdit className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--color-secondary)] shrink-0" />
              <span className="truncate">Draft</span>
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold mt-1 text-[var(--color-secondary)] font-[var(--font-display)]">{stats.draft}</p>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-sm sm:text-base font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">Recent Projects</h2>
            <Link href="/dashboard/projects" className="text-xs sm:text-sm text-[var(--color-primary)] hover:underline font-medium shrink-0">
              View all
            </Link>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="p-4 sm:p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 sm:h-16 bg-[var(--color-surface-container-high)] rounded-[var(--radius)] animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 text-center">
                <FolderKanban className="h-10 w-10 sm:h-12 sm:w-12 text-[var(--color-outline)] mb-3" />
                <p className="text-sm sm:text-base text-[var(--color-on-surface-variant)] mb-4">
                  No projects yet
                </p>
                <Link href="/dashboard/projects">
                  <span className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] transition-all duration-200 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Create Project
                  </span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => router.visit(`/dashboard/projects/${project.id}`)}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
                      <FolderKanban className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--color-on-surface)] truncate">{project.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-[var(--color-outline)] shrink-0" />
                        <span className="text-[11px] sm:text-xs text-[var(--color-outline)] font-mono truncate">
                          <TimeElapsed since={project.created_at} />
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {project.container_status === 'running' && (
                        <a
                          href={project.custom_domain && project.domain_status === 'active'
                            ? `https://${project.domain ? project.domain + '.' : ''}${project.custom_domain}`
                            : `/p/${project.slug}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors"
                          title="View site"
                        >
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </a>
                      )}
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-medium rounded-full font-mono uppercase tracking-wider
                          ${project.status === 'published' ? 'bg-[var(--color-primary-dim)] text-[var(--color-success)]' : ''}
                          ${project.status === 'draft' ? 'bg-[var(--color-secondary-dim)] text-[var(--color-secondary)]' : ''}
                          ${project.status === 'archived' ? 'bg-[var(--color-surface-container-high)] text-[var(--color-outline)]' : ''}
                        `}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-[var(--radius)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[28px] h-7 text-xs font-medium rounded-[var(--radius)] transition-colors ${
                      page === p
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-[var(--radius)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
