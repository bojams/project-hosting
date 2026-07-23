import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { User, ApiResponse } from '@/types/api'
import { Trash2, Check, X } from 'lucide-react'

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

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (filterStatus) params.set('status', filterStatus)
      const res = await api.get<ApiResponse<PaginatedUsers>>(`/api/users?${params}`)
      if (res.success && res.data) {
        setUsers(res.data.data || [])
        setTotal(res.data.total)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus])

  useEffect(() => {
    if (!auth?.user) return
    if (auth.user.role !== 'admin') {
      router.visit('/dashboard')
      return
    }
    loadUsers()
  }, [auth, loadUsers])

  const changeRole = async (user: User, newRole: string) => {
    try {
      await api.patch(`/api/users/${user.id}/role`, { role: newRole })
      loadUsers()
    } catch {
    }
  }

  const handleApprove = async (user: User) => {
    try {
      await api.post(`/api/users/${user.id}/approve`)
      loadUsers()
    } catch {
    }
  }

  const handleReject = async (user: User) => {
    try {
      await api.post(`/api/users/${user.id}/reject`)
      loadUsers()
    } catch {
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/users/${id}`)
      setDeletingId(null)
      loadUsers()
    } catch {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Users</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              Manage registered users, approve requests, and assign roles
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs">
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
              onClick={() => { setFilterStatus(s); setPage(1) }}
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

        <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)]">
          <div className="px-6 py-4">
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
                    className="flex items-center justify-between p-4 rounded-[var(--radius)] border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-container-high)] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-sm font-semibold shrink-0">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--color-on-surface)] truncate">{user.username}</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)] truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                          <select
                            value={user.role}
                            onChange={(e) => changeRole(user, e.target.value)}
                            className="px-2 py-1 text-xs font-mono bg-[var(--color-bg-card)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] rounded-[var(--radius)] cursor-pointer hover:border-[var(--color-primary)] outline-none"
                          >
                            <option value="user" className="bg-[var(--color-bg-elevated)]">user</option>
                            <option value="membership" className="bg-[var(--color-bg-elevated)]">membership</option>
                            <option value="admin" className="bg-[var(--color-bg-elevated)]">admin</option>
                          </select>
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
            <div className="bg-[var(--color-surface-container)] backdrop-blur-xl rounded-xl shadow-2xl border border-[rgba(255,255,255,0.06)] p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
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
      </div>
    </>
  )
}
