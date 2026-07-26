import { useState, useEffect } from 'react'

const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`'

function MatrixColumn({ delay, x }: { delay: number; x: number }) {
  const [chars, setChars] = useState<string[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setChars(prev => {
        const newChars = [...prev]

        if (newChars.length > 15) {
          newChars.shift()
        }

        newChars.push(matrixChars[Math.floor(Math.random() * matrixChars.length)])

        return newChars
      })
    }, 80 + Math.random() * 60)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="absolute top-0 flex flex-col items-center pointer-events-none"
      style={{
        left: `${x}%`,
        animationDelay: `${delay}s`,
      }}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          className="font-mono text-xs leading-none transition-opacity duration-300"
          style={{
            color: i === chars.length - 1 ? 'var(--color-primary)' : 'var(--color-primary)',
            opacity: 0.05 + (i / chars.length) * 0.4,
            textShadow: i === chars.length - 1 ? '0 0 8px var(--color-primary)' : 'none',
          }}
        >
          {char}
        </span>
      ))}
    </div>
  )
}

export default function LoadingPage() {
  const [visible, setVisible] = useState(true)

  const [columnConfigs] = useState(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      delay: Math.random() * 2,
      x: (i / 30) * 100,
    })))

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--color-bg-base)] flex items-center justify-center overflow-hidden">
      {/* Matrix rain background */}
      <div className="absolute inset-0 overflow-hidden">
        {columnConfigs.map((cfg, i) => (
          <MatrixColumn key={i} delay={cfg.delay} x={cfg.x} />
        ))}
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center shadow-[0_0_40px_rgba(0,255,102,0.3)]">
          <span className="text-[var(--color-on-primary)] font-bold text-3xl sm:text-4xl font-[var(--font-display)]">H</span>
        </div>

        {/* Text */}
        <h1 className="mt-4 sm:mt-5 text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">
          Hideo Hosting
        </h1>

        {/* Loading dots */}
        <div className="mt-5 sm:mt-6 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--color-primary)]"
              style={{
                animation: `loadingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes loadingDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
