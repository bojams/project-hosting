import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { formatBytes, formatDate } from '@/lib/utils'
import type { Project, MediaFile, Deployment, ApiResponse } from '@/types/api'
import {
  ImageIcon, FileText, Archive, File, ExternalLink, Upload, Rocket,
  Trash2, Pencil, Check, X, FolderKanban, Globe, FileEdit,
  Clock, HardDrive, Loader2, GitBranch, Package, Settings,
  Terminal, Cpu, Plus, Minus, Edit3, MessageSquare, Eye, EyeOff, Play
} from 'lucide-react'

function TimeElapsed({ since }: { since: string }) {
  const [text, setText] = useState('')
  useEffect(() => {
    const start = new Date(since).getTime()
    const update = () => {
      const diff = Date.now() - start
      if (diff < 0) { setText('Belum dimulai'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setText(`${d}d ${h}h ${m}m ${s}s`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [since])
  return <span>{text}</span>
}

const tabs = [
  { id: 'files', label: 'Files', icon: FolderKanban },
  { id: 'source', label: 'Source', icon: GitBranch },
  { id: 'config', label: 'Config', icon: Settings },
  { id: 'deploy', label: 'Deploy', icon: Rocket },
  { id: 'logs', label: 'Logs', icon: Terminal },
  { id: 'deployments', label: 'Deployments', icon: Clock },
]

export default function ProjectShow() {
  const props = usePage().props as unknown as { project: { id: number } }
  const { project: initialProject } = props
  const [id, setId] = useState<number>(initialProject?.id || 0)

  const [project, setProject] = useState<Project | null>(null)
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('files')

  const [deploying, setDeploying] = useState(false)
  const [confirmStop, setConfirmStop] = useState(false)
  const [logs, setLogs] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const [domain, setDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [cloudflareToken, setCloudflareToken] = useState('')
  const [cloudflareZone, setCloudflareZone] = useState('')
  const [cloudflareAccount, setCloudflareAccount] = useState('')
  const [port, setPort] = useState(3000)
  const [portAuto, setPortAuto] = useState(true)
  const [buildCommand, setBuildCommand] = useState('')
  const [outputDir, setOutputDir] = useState('')
  const [databaseType, setDatabaseType] = useState<string>('')
  const [databaseName, setDatabaseName] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)

  const [tunnelStatus, setTunnelStatus] = useState<{ status: string; status_label: string; healthy: boolean; connected: boolean } | null>(null)
  const [tunnelToken, setTunnelToken] = useState('')
  const [showTunnelRemove, setShowTunnelRemove] = useState(false)
  const [confirmTunnelMode, setConfirmTunnelMode] = useState<string | null>(null)
  const [removingTunnel, setRemovingTunnel] = useState(false)

  const [scannerResult, setScannerResult] = useState<{ framework: string; build_command: string | null; output_dir: string | null; internal_port: number } | null>(null)
  const [scanning, setScanning] = useState(false)

  const [githubUrl, setGithubUrl] = useState('')
  const [importingGithub, setImportingGithub] = useState(false)

  const [confirmDeleteFile, setConfirmDeleteFile] = useState<number | null>(null)
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState<number[] | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deletingFile, setDeletingFile] = useState(false)
  const [deletingBatch, setDeletingBatch] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [renamingFile, setRenamingFile] = useState<{ id: number; name: string } | null>(null)

  const [progress, setProgress] = useState({
    active: false, fileIndex: 0, totalFiles: 0,
    loadedBytes: 0, totalBytes: 0,
    currentFile: '', elapsed: '', speed: '',
  })
  const progressRef = useRef({ startTime: 0, loaded: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [deployments, setDeployments] = useState<Deployment[]>([])

  const loadProject = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Project & { media: MediaFile[]; deployments: Deployment[] }>>(`/projects/${id}`)
      if (res.success && res.data) {
        setProject(res.data)
        setMedia(res.data.media || [])
        setDeployments(res.data.deployments || [])
        setDomain(res.data.domain || '')
        setCustomDomain(res.data.custom_domain || '')
        setCloudflareToken(res.data.cloudflare_api_token || '')
        setCloudflareZone(res.data.cloudflare_zone_id || '')
        setCloudflareAccount(res.data.cloudflare_account_id || '')
        setPort(res.data.port || 3000)
        setPortAuto(res.data.port_auto ?? true)
        setBuildCommand(res.data.build_command || '')
        setOutputDir(res.data.output_dir || '')
        setDatabaseType(res.data.database_type || '')
        setDatabaseName(res.data.database_name || '')
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { if (id) loadProject() }, [id, loadProject])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleDeploy = async () => {
    setDeploying(true)
    try {
      const res = await api.post<ApiResponse<{ status: string }>>(`/projects/${id}/deploy`)
      if (res.success) {
        setTimeout(loadProject, 2000)
      }
    } catch {
    } finally {
      setDeploying(false)
    }
  }

  const handleStopContainer = async () => {
    try {
      await api.post<ApiResponse<void>>(`/projects/${id}/container/stop`)
      loadProject()
    } catch {
    }
  }

  const handleScan = async () => {
    setScanning(true)
    try {
      const res = await api.post<ApiResponse<{ framework: string; build_command: string | null; output_dir: string | null; internal_port: number }>>(`/projects/${id}/scan`)
      if (res.success && res.data) {
        setScannerResult(res.data)
        if (res.data.build_command) setBuildCommand(res.data.build_command)
        if (res.data.output_dir) setOutputDir(res.data.output_dir)
        if (res.data.internal_port) setPort(res.data.internal_port)
      }
    } catch {
    } finally {
      setScanning(false)
    }
  }

  const handleImportGithub = async () => {
    setImportingGithub(true)
    try {
      const res = await api.post<ApiResponse<unknown>>(`/projects/${id}/import/github`, { url: githubUrl })
      if (res.success) {
        setGithubUrl('')
        loadProject()
      }
    } catch {
    } finally {
      setImportingGithub(false)
    }
  }

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await api.put<ApiResponse<void>>(`/projects/${id}`, {
        domain: domain || null,
        custom_domain: customDomain || null,
        cloudflare_api_token: cloudflareToken || null,
        cloudflare_zone_id: cloudflareZone || null,
        cloudflare_account_id: cloudflareAccount || null,
        port: portAuto ? null : port,
        port_auto: portAuto,
        build_command: buildCommand || null,
        output_dir: outputDir || null,
        database_type: databaseType || null,
        database_name: databaseName || null,
      })
      loadProject()
    } catch {
    } finally {
      setSavingConfig(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files.length) return

    setProgress({
      active: true, fileIndex: 0, totalFiles: files.length,
      loadedBytes: 0, totalBytes: Array.from(files).reduce((a, f) => a + f.size, 0),
      currentFile: '', elapsed: '', speed: '',
    })
    progressRef.current = { startTime: Date.now(), loaded: 0 }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress(p => ({ ...p, fileIndex: i + 1, currentFile: file.name }))

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('relative_path', file.name)
        await api.post(`/projects/${id}/media`, formData)
      } catch {
      }
    }

    setProgress(p => ({ ...p, active: false }))
    loadProject()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confirmFileDelete = async () => {
    if (confirmDeleteFile === null) return
    setDeletingFile(true)
    try {
      await api.delete<ApiResponse<void>>(`/projects/${id}/media/${confirmDeleteFile}`)
      setConfirmDeleteFile(null)
      loadProject()
    } catch {
    } finally {
      setDeletingFile(false)
    }
  }

  const confirmDeleteSelectedFiles = async () => {
    if (!confirmDeleteSelected?.length) return
    setDeletingBatch(true)
    try {
      await Promise.all(confirmDeleteSelected.map(fid =>
        api.delete(`/projects/${id}/media/${fid}`)
      ))
      setConfirmDeleteSelected(null)
      setSelectedFiles([])
      loadProject()
    } catch {
    } finally {
      setDeletingBatch(false)
    }
  }

  const confirmDeleteAllFiles = async () => {
    setDeletingBatch(true)
    try {
      await api.delete<ApiResponse<void>>(`/projects/${id}/media`)
      setConfirmDeleteAll(false)
      loadProject()
    } catch {
    } finally {
      setDeletingBatch(false)
    }
  }

  const handleRename = async (mediaId: number, newName: string) => {
    try {
      await api.put(`/projects/${id}/media/${mediaId}`, { name: newName })
      setRenamingFile(null)
      loadProject()
    } catch {
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await api.get<ApiResponse<{ logs: string }>>(`/projects/${id}/container/logs`)
      if (res.success && res.data) setLogs(res.data.logs)
    } catch {
    }
  }

  function getFileIcon(mime: string) {
    if (mime.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-[var(--color-primary)]" />
    if (mime.includes('zip') || mime.includes('rar')) return <Archive className="h-4 w-4 text-amber-400" />
    if (mime.startsWith('text/') || mime.includes('json') || mime.includes('javascript')) return <FileText className="h-4 w-4 text-sky-400" />
    return <File className="h-4 w-4 text-[var(--color-outline)]" />
  }

  const pct = progress.totalBytes > 0 ? Math.round((progress.loadedBytes / progress.totalBytes) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-on-surface-variant)]">Project not found</p>
      </div>
    )
  }

  return (
    <>
      <Head title={project.name} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">{project.name}</h1>
              <span
                className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded-full font-medium
                  ${project.status === 'published' ? 'bg-[var(--color-primary-dim)] text-[var(--color-success)]' : ''}
                  ${project.status === 'draft' ? 'bg-[var(--color-secondary-dim)] text-[var(--color-secondary)]' : ''}
                  ${project.status === 'archived' ? 'bg-[var(--color-surface-container-high)] text-[var(--color-outline)]' : ''}
                `}
              >
                {project.status}
              </span>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)] font-mono mt-1">/{project.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            {project.container_status === 'running' && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
              >
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
            )}
          </div>
        </div>

        <div className="border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex overflow-x-auto -mb-px gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:border-[var(--color-outline)]'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className={`${activeTab === 'config' || activeTab === 'source' || activeTab === 'deploy' || activeTab === 'logs' || activeTab === 'deployments' ? 'xl:col-span-2' : 'xl:col-span-2'}`}>
            {activeTab === 'files' && (
              <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <h2 className="text-lg font-semibold font-[var(--font-display)]">Files</h2>
                  <div className="flex items-center gap-2">
                    {selectedFiles.length > 0 && (
                      <>
                        <span className="text-xs text-[var(--color-on-surface-variant)]">{selectedFiles.length} selected</span>
                        <button
                          onClick={() => setConfirmDeleteSelected(selectedFiles)}
                          className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-danger)] transition-colors"
                          title="Delete selected"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setConfirmDeleteAll(true)}
                      className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-danger)] transition-colors"
                      title="Delete all files"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <label className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors cursor-pointer" title="Upload files">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Upload className="h-4 w-4" />
                    </label>
                  </div>
                </div>
                <div className="px-6 py-4">
                  {media.length === 0 ? (
                    <div
                      className="border-2 border-dashed border-[var(--color-outline-variant)] rounded-xl p-12 text-center cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-10 w-10 text-[var(--color-outline)] mx-auto mb-3" />
                      <p className="text-sm text-[var(--color-on-surface-variant)]">Drop files here or click to upload</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {media.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center gap-3 p-3 rounded-[var(--radius)] border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-container-high)] transition-all duration-200 group ${
                            selectedFiles.includes(file.id) ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary-dim)]' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => {
                              setSelectedFiles(prev =>
                                prev.includes(file.id) ? prev.filter(f => f !== file.id) : [...prev, file.id]
                              )
                            }}
                            className="rounded border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-transparent"
                          />
                          {getFileIcon(file.mime_type)}
                          <div className="flex-1 min-w-0">
                            {renamingFile?.id === file.id ? (
                              <form
                                onSubmit={(e) => { e.preventDefault(); handleRename(file.id, renamingFile.name) }}
                                className="flex items-center gap-1"
                              >
                                <input
                                  value={renamingFile.name}
                                  onChange={(e) => setRenamingFile({ ...renamingFile, name: e.target.value })}
                                  className="flex-1 text-sm bg-[var(--color-bg-base)] border border-[var(--color-outline-variant)] rounded px-2 py-0.5 text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]"
                                  autoFocus
                                />
                                <button type="submit" className="p-1 text-[var(--color-success)]"><Check className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => setRenamingFile(null)} className="p-1 text-[var(--color-danger)]"><X className="h-3.5 w-3.5" /></button>
                              </form>
                            ) : (
                              <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{file.name}</p>
                            )}
                            <p className="text-xs text-[var(--color-on-surface-variant)]">
                              {formatBytes(file.size)} &middot; {formatDate(file.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setRenamingFile({ id: file.id, name: file.name })}
                              className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors"
                              title="Rename"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors"
                              title="Open"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => setConfirmDeleteFile(file.id)}
                              className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-danger)] transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'source' && (
              <div className="space-y-6">
                <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
                  <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                    <h2 className="text-lg font-semibold font-[var(--font-display)]">Import from GitHub</h2>
                  </div>
                  <div className="px-6 py-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleImportGithub() }} className="flex gap-2">
                      <input
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/user/repo"
                        className="flex-1 rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <button
                        type="submit"
                        disabled={importingGithub || !githubUrl}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] disabled:opacity-50 transition-all"
                      >
                        {importingGithub ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                        Import
                      </button>
                    </form>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">Supports public repositories. The project will be cloned and files extracted.</p>
                  </div>
                </div>

                <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
                  <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                    <h2 className="text-lg font-semibold font-[var(--font-display)]">Upload ZIP</h2>
                  </div>
                  <div className="px-6 py-4">
                    <div
                      className="border-2 border-dashed border-[var(--color-outline-variant)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Archive className="h-8 w-8 text-[var(--color-outline)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--color-on-surface-variant)]">Upload a ZIP file containing your project</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
                  <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                    <h2 className="text-lg font-semibold font-[var(--font-display)]">Auto-detect Framework</h2>
                  </div>
                  <div className="px-6 py-4">
                    <button
                      onClick={handleScan}
                      disabled={scanning}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] disabled:opacity-50 transition-all"
                    >
                      {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
                      {scanning ? 'Scanning...' : 'Scan Project'}
                    </button>
                    {scannerResult && (
                      <div className="mt-4 p-4 bg-[var(--color-primary-dim)] rounded-[var(--radius)] space-y-2">
                        <p className="text-sm"><span className="text-[var(--color-on-surface-variant)]">Framework:</span> <span className="text-[var(--color-on-surface)] font-medium">{scannerResult.framework}</span></p>
                        {scannerResult.build_command && <p className="text-sm"><span className="text-[var(--color-on-surface-variant)]">Build:</span> <span className="text-[var(--color-on-surface)] font-mono">{scannerResult.build_command}</span></p>}
                        {scannerResult.output_dir && <p className="text-sm"><span className="text-[var(--color-on-surface-variant)]">Output:</span> <span className="text-[var(--color-on-surface)] font-mono">{scannerResult.output_dir}</span></p>}
                        <p className="text-sm"><span className="text-[var(--color-on-surface-variant)]">Port:</span> <span className="text-[var(--color-on-surface)]">{scannerResult.internal_port}</span></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h2 className="text-lg font-semibold font-[var(--font-display)]">Configuration</h2>
                </div>
                <div className="px-6 py-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">Domain</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Subdomain</label>
                        <div className="flex rounded-[var(--radius)] border border-[var(--color-outline-variant)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
                          <input
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="my-project"
                            className="flex-1 bg-[var(--color-bg-base)] text-[var(--color-on-surface)] px-3 py-2 text-sm outline-none"
                          />
                          <span className="flex items-center px-3 text-xs text-[var(--color-outline)] bg-[var(--color-surface-container-high)]">.{project.slug}.hideo.app</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Custom Domain</label>
                        <input
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="example.com"
                          className="w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">Cloudflare</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">API Token</label>
                        <input
                          value={cloudflareToken}
                          onChange={(e) => setCloudflareToken(e.target.value)}
                          type="password"
                          placeholder="cf_token_..."
                          className="w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Zone ID</label>
                        <input
                          value={cloudflareZone}
                          onChange={(e) => setCloudflareZone(e.target.value)}
                          placeholder="zone_id"
                          className="w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Account ID</label>
                        <input
                          value={cloudflareAccount}
                          onChange={(e) => setCloudflareAccount(e.target.value)}
                          placeholder="account_id"
                          className="w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--color-on-surface)] font-[var(--font-display)]">Build & Deploy</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Build Command</label>
                        <input
                          value={buildCommand}
                          onChange={(e) => setBuildCommand(e.target.value)}
                          placeholder="npm run build"
                          className="w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Output Directory</label>
                        <input
                          value={outputDir}
                          onChange={(e) => setOutputDir(e.target.value)}
                          placeholder="dist"
                          className="w-full rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Port</label>
                        <div className="flex items-center gap-2">
                          <input
                            value={port}
                            onChange={(e) => setPort(Number(e.target.value))}
                            disabled={portAuto}
                            type="number"
                            className="w-24 rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={portAuto}
                              onChange={(e) => setPortAuto(e.target.checked)}
                              className="rounded border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-transparent"
                            />
                            Auto
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Database</label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={databaseType}
                            onChange={(e) => setDatabaseType(e.target.value)}
                            className="rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          >
                            <option value="">None</option>
                            <option value="mysql">MySQL</option>
                            <option value="sqlite">SQLite</option>
                            <option value="postgresql">PostgreSQL</option>
                          </select>
                          <input
                            value={databaseName}
                            onChange={(e) => setDatabaseName(e.target.value)}
                            placeholder="db name"
                            disabled={!databaseType}
                            className="rounded-[var(--radius)] border border-[var(--color-outline-variant)] bg-[var(--color-bg-base)] text-[var(--color-on-surface)] placeholder-[var(--color-text-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] disabled:opacity-50 transition-all"
                    >
                      {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deploy' && (
              <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h2 className="text-lg font-semibold font-[var(--font-display)]">Deploy</h2>
                </div>
                <div className="px-6 py-4 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[var(--color-surface-container-high)] rounded-[var(--radius)]">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${project.container_status === 'running' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-outline)]'}`} />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-on-surface)]">Container</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">{project.container_status || 'stopped'}{project.container_id ? ` (${project.container_id.slice(0, 12)})` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.container_status === 'running' ? (
                        <button
                          onClick={() => setConfirmStop(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-[0_0_20px_rgb(255,180,171,0.2)] transition-all"
                        >
                          Stop Container
                        </button>
                      ) : (
                        <button
                          onClick={handleDeploy}
                          disabled={deploying}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_20px_rgb(0,255,102,0.3)] disabled:opacity-50 transition-all"
                        >
                          {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                          {deploying ? 'Deploying...' : 'Deploy'}
                        </button>
                      )}
                    </div>
                  </div>

                  {project.framework && (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)]">
                      <Package className="h-4 w-4" />
                      Framework: <span className="text-[var(--color-on-surface)] font-medium">{project.framework}</span>
                      {project.framework_version && <span className="text-[var(--color-outline)]">v{project.framework_version}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <h2 className="text-lg font-semibold font-[var(--font-display)]">Container Logs</h2>
                  <button
                    onClick={fetchLogs}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
                  >
                    Refresh
                  </button>
                </div>
                <div className="px-6 py-4">
                  <pre className="bg-[var(--color-bg-base)] text-xs font-mono text-[var(--color-on-surface)] p-4 rounded-[var(--radius)] border border-[rgba(255,255,255,0.06)] overflow-auto max-h-96 whitespace-pre-wrap">
                    {logs || 'No logs available. Deploy the project first.'}
                    <div ref={logsEndRef} />
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'deployments' && (
              <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h2 className="text-lg font-semibold font-[var(--font-display)]">Deployment History</h2>
                </div>
                <div className="px-6 py-4">
                  {deployments.length === 0 ? (
                    <p className="text-sm text-[var(--color-on-surface-variant)] text-center py-8">No deployments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {deployments.map((dep) => (
                        <div
                          key={dep.id}
                          className="flex items-center justify-between p-4 rounded-[var(--radius)] border border-[rgba(255,255,255,0.06)] hover:bg-[var(--color-surface-container-high)] transition-all"
                        >
                          <div>
                            <p className="text-sm font-medium text-[var(--color-on-surface)]">
                              v{dep.version} {dep.description && `- ${dep.description}`}
                            </p>
                            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                              {dep.deployed_at ? formatDate(dep.deployed_at) : formatDate(dep.created_at)}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded-full font-medium ${
                              dep.status === 'deployed' ? 'bg-[var(--color-primary-dim)] text-[var(--color-success)]' : ''
                            } ${dep.status === 'building' ? 'bg-amber-500/15 text-amber-400' : ''} ${dep.status === 'failed' ? 'bg-red-500/15 text-red-400' : ''}`}
                          >
                            {dep.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {showPreview && project.container_status === 'running' && (
              <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="px-6 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <h3 className="text-sm font-semibold font-[var(--font-display)]">Preview</h3>
                  <a
                    href={project.custom_domain && project.domain_status === 'active'
                      ? `https://${project.domain ? project.domain + '.' : ''}${project.custom_domain}`
                      : `/p/${project.slug}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <iframe
                  src={`/p/${project.slug}`}
                  className="w-full h-96 border-0"
                  title="Preview"
                />
              </div>
            )}

            <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <h2 className="text-lg font-semibold font-[var(--font-display)]">Cloudflare Tunnel</h2>
                <Globe className="h-5 w-5 text-[var(--color-outline)]" />
              </div>
              <div className="px-6 py-4">
                {tunnelStatus ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`h-2 w-2 rounded-full ${tunnelStatus.connected ? 'bg-[var(--color-success)]' : 'bg-amber-400'}`} />
                      <span className="text-sm text-[var(--color-on-surface)]">{tunnelStatus.status_label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.get<ApiResponse<{ token: string }>>(`/projects/${id}/tunnel/token`)
                            if (res.success && res.data?.token) {
                              setTunnelToken(res.data.token)
                              await navigator.clipboard.writeText("cloudflared tunnel run --token '" + res.data.token + "'")
                            }
                          } catch {}
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
                      >
                        Copy Token
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.post<ApiResponse<{ pid: string }>>(`/projects/${id}/tunnel/run`)
                            if (res.success) {
                              setTimeout(() => {
                                api.get<ApiResponse<{ status: string; status_label: string; healthy: boolean; connected: boolean }>>(`/projects/${id}/tunnel/status`).then(r => {
                                  if (r.success && r.data) setTunnelStatus(r.data)
                                })
                              }, 3000)
                            }
                          } catch {}
                        }}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] transition-all"
                      >
                        <Play className="h-3.5 w-3.5" /> Run
                      </button>
                      <button
                        onClick={() => setShowTunnelRemove(true)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] transition-all col-start-2"
                      >
                        <X className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const res = await api.post<ApiResponse<{ token: string; command: string }>>(`/projects/${id}/tunnel`)
                        if (res.success && res.data) {
                          setTunnelToken(res.data.token)
                          await navigator.clipboard.writeText(res.data.command)
                        }
                        loadProject()
                      } catch {}
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
                  >
                    <Globe className="h-4 w-4" /> Setup Tunnel
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <h2 className="text-lg font-semibold font-[var(--font-display)]">Info</h2>
                <FileEdit className="h-5 w-5 text-[var(--color-outline)]" />
              </div>
              <div className="px-6 py-4">
                <div className="space-y-2.5 sm:space-y-3 text-sm">
                  <div className="flex justify-between gap-2"><span className="text-[var(--color-on-surface-variant)] shrink-0">Status</span><span className="font-medium capitalize truncate text-right">{project.status}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-[var(--color-on-surface-variant)] shrink-0">Source</span><span className="font-medium capitalize truncate text-right">{project.source_type}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-[var(--color-on-surface-variant)] shrink-0">Framework</span><span className="font-medium truncate text-right">{project.framework || '—'}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-[var(--color-on-surface-variant)] shrink-0">Files</span><span className="font-medium text-right">{media.length}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-[var(--color-on-surface-variant)] shrink-0">Deployments</span><span className="font-medium text-right">{deployments.length}</span></div>
                  {project.container_status && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--color-on-surface-variant)] shrink-0">Container</span>
                      <span className={`font-medium flex items-center gap-1 text-right ${project.container_status === 'running' ? 'text-[var(--color-success)]' : 'text-[var(--color-outline)]'}`}>
                        <span className={`h-2 w-2 rounded-full shrink-0 ${project.container_status === 'running' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-outline)]'}`} />
                        {project.container_status}
                      </span>
                    </div>
                  )}
                  {project.port && <div className="flex justify-between gap-2"><span className="text-[var(--color-on-surface-variant)] shrink-0">Port</span><span className="font-medium text-right">{project.port}</span></div>}
                  {project.description && (
                    <div><span className="text-[var(--color-on-surface-variant)] block mb-1">Description</span><p className="text-[var(--color-on-surface-variant)]">{project.description}</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {confirmStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmStop(false)}>
            <div className="bg-[var(--color-surface-container)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-1 font-[var(--font-display)]">Stop Container</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">Stop the running container?</p>
              <p className="text-xs text-[var(--color-danger)] mb-4">The project service will stop until redeployed.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmStop(false)} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all">Cancel</button>
                <button onClick={async () => { setConfirmStop(false); await handleStopContainer() }} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-[0_0_20px_rgb(255,180,171,0.2)] transition-all">Stop</button>
              </div>
            </div>
          </div>
        )}

        {showTunnelRemove && !confirmTunnelMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTunnelRemove(false)}>
            <div className="bg-[var(--color-surface-container)] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-1 font-[var(--font-display)]">Remove Tunnel</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">Select what to remove:</p>
              <div className="space-y-2">
                {([{ mode: 'all', label: 'Remove all', desc: 'Tunnel and DNS tunnel' },
                  { mode: 'dns', label: 'DNS tunnel', desc: 'Remove only DNS tunnel' },
                  { mode: 'tunnel', label: 'Tunnel', desc: 'Remove only tunnel' },
                ] as const).map(opt => (
                  <button
                    key={opt.mode}
                    className="w-full text-left p-3 rounded-lg border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-danger)]/50 transition-colors"
                    onClick={() => setConfirmTunnelMode(opt.mode)}
                  >
                    <p className="text-sm font-medium text-[var(--color-on-surface)]">{opt.label}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setShowTunnelRemove(false)} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {confirmTunnelMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setConfirmTunnelMode(null); setShowTunnelRemove(false) }}>
            <div className="bg-[var(--color-surface-container)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-1 font-[var(--font-display)]">Confirm</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
                {confirmTunnelMode === 'all' ? 'Remove tunnel and DNS tunnel?' :
                 confirmTunnelMode === 'dns' ? 'Remove DNS tunnel only?' :
                 'Remove tunnel only?'}
              </p>
              <p className="text-xs text-[var(--color-danger)] mb-4">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setConfirmTunnelMode(null); setShowTunnelRemove(false) }} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all">Cancel</button>
                <button
                  disabled={removingTunnel}
                  onClick={async () => {
                    setRemovingTunnel(true)
                    try {
                      const res = await api.post<ApiResponse<unknown>>(`/projects/${id}/tunnel/remove`, { mode: confirmTunnelMode })
                      if (res.success) loadProject()
                    } catch {}
                    finally { setRemovingTunnel(false); setConfirmTunnelMode(null); setShowTunnelRemove(false) }
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-[0_0_20px_rgb(255,180,171,0.2)] transition-all"
                >
                  {removingTunnel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteFile !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !deletingFile && setConfirmDeleteFile(null)}>
            <div className="bg-[var(--color-surface-container)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-[var(--color-error-container)]/20 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-[var(--color-danger)]" />
                </div>
                <div>
                  <h3 className="font-semibold font-[var(--font-display)]">Delete File</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">File will be permanently deleted</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-danger)] mb-4">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDeleteFile(null)} disabled={deletingFile} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-50 transition-all">Cancel</button>
                <button disabled={deletingFile} onClick={confirmFileDelete} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-[0_0_20px_rgb(255,180,171,0.2)] disabled:opacity-50 transition-all">
                  {deletingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteSelected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !deletingBatch && setConfirmDeleteSelected(null)}>
            <div className="bg-[var(--color-surface-container)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-[var(--color-error-container)]/20 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-[var(--color-danger)]" />
                </div>
                <div>
                  <h3 className="font-semibold font-[var(--font-display)]">Delete {confirmDeleteSelected.length} Files</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">Selected files will be permanently deleted</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-danger)] mb-4">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDeleteSelected(null)} disabled={deletingBatch} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-50 transition-all">Cancel</button>
                <button disabled={deletingBatch} onClick={confirmDeleteSelectedFiles} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-[0_0_20px_rgb(255,180,171,0.2)] disabled:opacity-50 transition-all">
                  {deletingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : `Delete ${confirmDeleteSelected.length} files`}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !deletingBatch && setConfirmDeleteAll(false)}>
            <div className="bg-[var(--color-surface-container)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-[var(--color-error-container)]/20 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-[var(--color-danger)]" />
                </div>
                <div>
                  <h3 className="font-semibold font-[var(--font-display)]">Delete All Files</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">All files will be permanently deleted</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-danger)] mb-4">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDeleteAll(false)} disabled={deletingBatch} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] disabled:opacity-50 transition-all">Cancel</button>
                <button disabled={deletingBatch} onClick={confirmDeleteAllFiles} className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-[0_0_20px_rgb(255,180,171,0.2)] disabled:opacity-50 transition-all">
                  {deletingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {progress.active && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-[var(--color-surface-container)] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-6 w-6 text-[var(--color-secondary)] animate-spin" />
                <div>
                  <h3 className="font-semibold">Uploading Files</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">{progress.fileIndex} of {progress.totalFiles} files</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-[var(--color-on-surface-variant)] mb-1">
                  <span>{formatBytes(progress.loadedBytes)} of {formatBytes(progress.totalBytes)}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))' }} />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--color-on-surface-variant)] mb-4">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {progress.elapsed}</span>
                <span className="flex items-center gap-1"><HardDrive className="h-3.5 w-3.5" /> {progress.speed || '---'}</span>
              </div>
              <p className="text-xs text-[var(--color-outline)] truncate">{progress.currentFile}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
