import BrandLogo from '@/components/brand-logo';

export default function AppLogo() {
    return (
        <>
            <BrandLogo className="size-8 shrink-0" />
            <span className="truncate leading-tight font-bold text-sm font-[var(--font-display)] text-[var(--color-on-surface)]">
                HIDEO HOSTING
            </span>
        </>
    );
}
