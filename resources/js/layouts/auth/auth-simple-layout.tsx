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
            <div className="w-full max-w-xs px-4">
                <div className="flex flex-col items-center gap-2">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-1.5 font-medium"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)]">
                            <span className="text-[var(--color-on-primary)] font-bold text-sm font-[var(--font-display)]">H</span>
                        </div>
                        <span className="sr-only">{title}</span>
                    </Link>

                    <div className="space-y-0.5 text-center">
                        <h1 className="text-base font-medium">{title}</h1>
                        <p className="text-center text-xs text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    <div className="w-full">{children}</div>
                </div>
            </div>
        </div>
    );
}
