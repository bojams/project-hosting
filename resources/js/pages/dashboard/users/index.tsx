import { Head, router, usePage } from '@inertiajs/react'
import { Trash2, Check, X, Pencil, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { User, ApiResponse } from '@/types/api'

interface PaginatedUsers {
  current_page: number
  data: User[]
  total: number
  last_page: number
}

export default function UsersIndex() {
  const props = usePage().props as unknown as { auth: { user: User } }
  const { auth } = props
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!auth?.user) {
      return
    }

    if (auth.user.role !== 'admin') {
      router.visit('/dashboard')

      return
    }

    let cancelled = false

    async function run() {
      setLoading(true)

      try {
        const params = new URLSearchParams({ page: String(page) })

        if (filterStatus) {
          params.set('status', filterStatus)
        }

        const res = await api.get<ApiResponse<PaginatedUsers>>(`/api/users?${params}`)

        if (!cancelled && res.success && res.data) {
          setUsers(res.data.data || [])
          setTotal(res.data.total)
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load users')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [auth, page, filterStatus, refreshKey])

  const changeRole = async (user: User, newRole: string) => {
    try {
      await api.patch(`/api/users/${user.id}/role`, { role: newRole })
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to change role')
    }
  }

  const handleApprove = async (user: User) => {
    try {
      await api.post(`/api/users/${user.id}/approve`)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to approve user')
    }
  }

  const handleReject = async (user: User) => {
    try {
      await api.post(`/api/users/${user.id}/reject`)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to reject user')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/users/${id}`)
      setDeletingId(null)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditPassword('')
    setShowPassword(false)
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      const payload: Record<string, string> = { role: editRole }
      if (editEmail !== editingUser.email) {
        payload.email = editEmail
      }
      if (editPassword) {
        payload.password = editPassword
      }
      await api.patch(`/api/users/${editingUser.id}`, payload)
      toast.success('User updated successfully')
      setEditingUser(null)
      setEditPassword('')
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  if (!auth?.user || auth.user.role !== 'admin') {
    return null
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      <Head title="Users" />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Users</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              Manage registered users, approve requests, and assign roles
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {users.filter(u => u.status === 'pending').length} pending
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['', 'pending', 'active', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => {
 setFilterStatus(s); setPage(1) 
}}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[var(--radius)] border transition-all duration-200 ${
                filterStatus === s
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] font-semibold'
                  : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[var(--color-border)]">
          <div className="px-4 sm:px-6 py-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-[var(--color-surface-container-high)] rounded-[var(--radius)] animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-on-surface-variant)] py-8">
                No users found{filterStatus ? ` with status "${filterStatus}"` : ''}.
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-[var(--radius)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-container-high)] transition-all duration-200 gap-2 sm:gap-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-xs sm:text-sm font-semibold shrink-0">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--color-on-surface)] truncate">{user.username}</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)] truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider font-medium rounded-full ${
                          user.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400'
                            : user.status === 'rejected'
                            ? 'bg-red-500/15 text-red-400'
                            : user.role === 'admin'
                            ? 'bg-[var(--color-primary-dim)] text-[var(--color-primary)]'
                            : user.role === 'membership'
                            ? 'bg-[var(--color-secondary-dim)] text-[var(--color-secondary)]'
                            : 'bg-[var(--color-surface-container-high)] text-[var(--color-outline)]'
                        }`}
                      >
                        {user.status === 'pending' ? 'Pending' : user.role}
                      </span>

                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(user)}
                            className="p-1.5 text-green-500 hover:text-green-300 transition-colors"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(user)}
                            className="p-1.5 text-red-500 hover:text-red-300 transition-colors"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {user.id !== auth?.user?.id && user.status === 'active' && (
                        <>
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(user.id)}
                            className="p-1.5 text-[var(--color-outline)] hover:text-[var(--color-danger)] transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
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
                <span className="text-sm text-[var(--color-on-surface-variant)] font-mono">Page {page} of {totalPages}</span>
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
            <div className="bg-[var(--color-surface-container)] backdrop-blur-xl rounded-xl shadow-2xl border border-[var(--color-border)] p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-2 text-[var(--color-on-surface)] font-[var(--font-display)]">Delete User</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
                Are you sure you want to delete this user? This cannot be undone.
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

        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setEditingUser(null); setEditPassword(''); setShowPassword(false) }}>
            <div className="bg-[var(--color-surface-container)] backdrop-blur-xl rounded-xl shadow-2xl border border-[var(--color-border)] p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-1 text-[var(--color-on-surface)] font-[var(--font-display)]">Edit User</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-5">
                {editingUser.username}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg-card)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] rounded-[var(--radius)] outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg-card)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] rounded-[var(--radius)] outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer"
                  >
                    <option value="user" className="bg-[var(--color-surface-container)]">user</option>
                    <option value="membership" className="bg-[var(--color-surface-container)]">membership</option>
                    <option value="admin" className="bg-[var(--color-surface-container)]">admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3 py-2 text-sm bg-[var(--color-bg-card)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] rounded-[var(--radius)] outline-none focus:border-[var(--color-primary)] transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => { setEditingUser(null); setEditPassword('') }}
                  className="px-4 py-2 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_16px_rgb(0,255,102,0.25)] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
