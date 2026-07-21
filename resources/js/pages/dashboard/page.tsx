import { Head, Link, router, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Project, ApiResponse } from '@/types/api'
import { FolderKanban, Globe, FileEdit, Clock, ExternalLink, Plus } from 'lucide-react'

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

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<ApiResponse<{ projects: Project[]; total: number; published: number; draft: number }>>('/projects?limit=5')
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
    }
    load()
  }, [])

  return (
    <>
      <Head title="Dashboard" />
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Welcome, {auth?.user?.username}</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              Here&apos;s an overview of your projects
            </p>
          </div>
          <Link href="/dashboard/projects">
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] transition-all duration-200 cursor-pointer">
              <Plus className="h-4 w-4" />
              New Project
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-on-surface-variant)]">
              <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--color-primary)]" />
              Total Projects
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 text-[var(--color-on-surface)] font-[var(--font-display)]">{stats.total}</p>
          </div>
          <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-on-surface-variant)]">
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--color-success)]" />
              Published
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 text-[var(--color-success)] font-[var(--font-display)]">{stats.published}</p>
          </div>
          <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-on-surface-variant)]">
              <FileEdit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--color-secondary)]" />
              Drafts
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 text-[var(--color-secondary)] font-[var(--font-display)]">{stats.draft}</p>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-lg font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">Recent Projects</h2>
          </div>
          <div className="px-6 py-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-[var(--color-surface-container-high)] rounded-[var(--radius)] animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--color-on-surface-variant)] mb-4">
                  No projects yet. Create your first project to get started.
                </p>
                <Link href="/dashboard/projects">
                  <span className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] transition-all duration-200 cursor-pointer">
                    Create Project
                  </span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => router.visit(`/dashboard/projects/${project.id}`)}
                    className="flex items-center justify-between p-4 rounded-[var(--radius)] border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:bg-[var(--color-surface-container-high)] cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-on-surface)]">{project.name}</p>
                      <p className="text-sm text-[var(--color-on-surface-variant)]">{project.slug}</p>
                      <p className="text-xs text-[var(--color-outline)] mt-1 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        Running: <TimeElapsed since={project.created_at} />
                      </p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full font-mono uppercase tracking-wider
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
          </div>
        </div>
      </div>
    </>
  )
}
