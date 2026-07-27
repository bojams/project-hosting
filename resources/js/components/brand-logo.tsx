export default function BrandLogo({ className = 'w-8 h-8 sm:w-9 sm:h-9' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00ff66" />
                    <stop offset="50%" stopColor="#d0bcff" />
                    <stop offset="100%" stopColor="#571bc1" />
                </linearGradient>
                <linearGradient id="logo-h" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f0f0f" />
                    <stop offset="100%" stopColor="#1a1a1a" />
                </linearGradient>
                <filter id="logo-glow">
                    <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00ff66" floodOpacity="0.4" />
                </filter>
            </defs>
            <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#logo-bg)" />
            <rect x="1" y="1" width="38" height="38" rx="10" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <g filter="url(#logo-glow)">
                <path
                    d="M12 12V28M12 20H28M28 12V28"
                    stroke="url(#logo-h)"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M20 12L28 20L20 28"
                    stroke="url(#logo-h)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                />
            </g>
        </svg>
    )
}
