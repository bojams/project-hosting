export default function BrandLogo({ className = 'h-10 w-auto' }: { className?: string }) {
    return (
        <img
            src="/icons1.png"
            alt="Hideo Hosting"
            className={className}
            style={{ objectFit: 'contain' }}
        />
    )
}
