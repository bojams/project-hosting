import { Head, Link, usePage } from '@inertiajs/react'

export default function ServerError() {
  const props = usePage().props as unknown as { auth: { user: { id: number; username: string } | null } }
  const homeHref = props.auth?.user ? '/dashboard' : '/'

  return (
    <>
      <Head title="500 - Server Error" />
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
            <span className="text-[var(--color-on-primary)] font-bold text-2xl font-[var(--font-display)]">H</span>
          </div>
          <h1 className="text-6xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)] mb-2">500</h1>
          <p className="text-xl text-[var(--color-on-surface-variant)] mb-1">Something went wrong</p>
          <p className="text-sm text-[var(--color-outline)] mb-8">
            An unexpected error occurred. Please try again later.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_24px_rgb(102,255,153,0.25)] transition-all duration-200"
            >
              {props.auth?.user ? 'Back to dashboard' : 'Back to home'}
            </Link>
            <Link
              href="/dashboard/docs"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-[var(--radius)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] transition-all duration-200"
            >
              View documentation
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
