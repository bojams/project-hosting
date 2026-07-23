import { Head, Link } from '@inertiajs/react'
import type { User } from '@/types/api'

interface DirectoryProps {
  users: Pick<User, 'id' | 'username' | 'email' | 'avatar_url' | 'role' | 'created_at'>[]
}

export default function Directory({ users }: DirectoryProps) {
  return (
    <>
      <Head title="Directory" />
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Directory</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            {users.length} registered user{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-card)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/30 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-sm font-semibold shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-[var(--color-on-surface)] truncate">
                  {user.username}
                </p>
                <p className="text-xs text-[var(--color-on-surface-variant)] truncate">
                  {user.email}
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-outline)] shrink-0">
                {user.role}
              </span>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <p className="text-center text-sm text-[var(--color-on-surface-variant)] py-12">
            No users found.
          </p>
        )}
      </div>
    </>
  )
}
