import { Head, Link, usePage } from '@inertiajs/react'
import BrandLogo from '@/components/brand-logo'

interface Props {
  status: number
}

const messages: Record<number, { title: string; desc: string }> = {
  400: { title: 'Bad request', desc: 'The request could not be processed.' },
  401: { title: 'Unauthorized', desc: 'Please log in to access this page.' },
  402: { title: 'Payment required', desc: 'Payment is required to access this resource.' },
  404: { title: 'Page not found', desc: "The page you're looking for doesn't exist or has been moved." },
  405: { title: 'Method not allowed', desc: 'This request method is not supported.' },
  419: { title: 'Session expired', desc: 'Your session has expired. Please refresh and try again.' },
  429: { title: 'Too many requests', desc: 'You have made too many requests. Please slow down.' },
  500: { title: 'Something went wrong', desc: 'An unexpected error occurred. Please try again later.' },
  503: { title: 'Service unavailable', desc: 'The service is temporarily unavailable. Please try again later.' },
}

export default function HttpError({ status }: Props) {
  const pageProps = usePage().props as unknown as { auth: { user: { id: number; username: string } | null } }
  const homeHref = pageProps.auth?.user ? '/dashboard' : '/'
  const info = messages[status] ?? { title: 'Unknown error', desc: 'An unexpected error occurred.' }

  return (
    <>
      <Head title={`${status} - ${info.title}`} />
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <BrandLogo className="h-20 sm:h-24 w-auto" />
          </div>
          <h1 className="text-6xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)] mb-2">{status}</h1>
          <p className="text-xl text-[var(--color-on-surface-variant)] mb-1">{info.title}</p>
          <p className="text-sm text-[var(--color-outline)] mb-8">{info.desc}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-[0_0_24px_rgb(102,255,153,0.25)] transition-all duration-200"
            >
              {pageProps.auth?.user ? 'Back to dashboard' : 'Back to home'}
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
