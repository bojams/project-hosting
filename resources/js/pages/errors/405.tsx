import { Head, Link, router, usePage } from '@inertiajs/react'
import BrandLogo from '@/components/brand-logo'

export default function MethodNotAllowed() {
  const props = usePage().props as unknown as { auth: { user: { id: number; username: string } | null } }
  const homeHref = props.auth?.user ? '/dashboard' : '/'

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      router.visit(homeHref)
    }
  }

  return (
    <>
      <Head title="405 - Method Not Allowed" />
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <BrandLogo className="h-20 sm:h-24 w-auto" />
          </div>
          <h1 className="text-6xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)] mb-2">405</h1>
          <p className="text-xl text-[var(--color-on-surface-variant)] mb-1">Method not allowed</p>
          <p className="text-sm text-[var(--color-outline)] mb-8">
            The request method is not supported for this resource.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_24px_rgb(102,255,153,0.25)] transition-all duration-200"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </>
  )
}