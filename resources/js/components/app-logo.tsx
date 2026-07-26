export default function AppLogo() {
    return (
        <>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] shadow-sm">
                <span className="text-[var(--color-on-primary)] font-bold text-sm font-[var(--font-display)]">H</span>
            </div>
            <span className="truncate leading-tight font-bold text-sm font-[var(--font-display)] text-[var(--color-on-surface)]">
                HIDEO HOSTING
            </span>
        </>
    );
}
