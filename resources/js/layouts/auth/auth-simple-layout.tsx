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
            <div className="w-full max-w-sm px-4 sm:px-6">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-2 font-medium"
                    >
                        <div className="mb-1 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)]">
                            <span className="text-[var(--color-on-primary)] font-bold text-base sm:text-lg font-[var(--font-display)]">H</span>
                        </div>
                        <span className="sr-only">{title}</span>
                    </Link>

                    <div className="space-y-1 sm:space-y-2 text-center">
                        <h1 className="text-lg sm:text-xl font-medium">{title}</h1>
                        <p className="text-center text-xs sm:text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    <div className="w-full">{children}</div>
                </div>
            </div>
        </div>
    );
}
