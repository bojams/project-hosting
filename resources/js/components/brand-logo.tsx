import { useState } from 'react'

export default function BrandLogo({ className = 'h-10 w-auto' }: { className?: string }) {
    const [error, setError] = useState(false)

    if (error) {
        return (
            <div
                className={`rounded-md bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center ${className}`}
                style={{ aspectRatio: '1/1', minWidth: '2rem' }}
            >
                <span className="text-[var(--color-on-primary)] font-bold text-sm font-[var(--font-display)]">
                    H
                </span>
            </div>
        )
    }

    return (
        <img
            src="/icons1.png"
            alt="Hideo Hosting"
            className={className}
            style={{ objectFit: 'contain' }}
            loading="lazy"
            onError={() => setError(true)}
        />
    )
}
