import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex h-dvh h-screen flex-col items-center justify-center bg-background overflow-hidden">
            <div className="w-full max-w-sm px-6">
                <div className="flex flex-col items-center gap-6">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-2 font-medium"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] shadow-lg shadow-[var(--color-primary)]/20 ring-1 ring-[var(--color-primary)]/10">
                            <span className="text-[var(--color-on-primary)] font-bold text-2xl font-[var(--font-display)]">H</span>
                        </div>
                        <span className="sr-only">{title}</span>
                    </Link>

                    <div className="space-y-1.5 text-center">
                        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="w-full">{children}</div>
                </div>
            </div>
        </div>
    );
}
