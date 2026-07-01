import { useId } from 'react'
import { Link } from 'react-router-dom'

function CompassRoseStar({ className = '', uid }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="16" cy="16" r="15" fill={`url(#${uid}-compass-bg)`} opacity="0.15" />
      <path
        d="M16 2L18.2 12.8L29 16L18.2 19.2L16 30L13.8 19.2L3 16L13.8 12.8L16 2Z"
        fill={`url(#${uid}-star-gold)`}
      />
      <path
        d="M16 6L17 13L24 16L17 19L16 26L15 19L8 16L15 13L16 6Z"
        fill={`url(#${uid}-star-inner)`}
        opacity="0.85"
      />
      <circle cx="16" cy="16" r="2" fill="#F8FAFC" />
      <path d="M16 4V8M16 24V28M4 16H8M24 16H28" stroke="#E2E8F0" strokeWidth="0.75" strokeLinecap="round" opacity="0.5" />
      <defs>
        <linearGradient id={`${uid}-compass-bg`} x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#F4D068" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`${uid}-star-gold`} x1="16" y1="2" x2="16" y2="30">
          <stop stopColor="#F4D068" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`${uid}-star-inner`} x1="16" y1="6" x2="16" y2="26">
          <stop stopColor="#FFF8E7" />
          <stop offset="1" stopColor="#F4D068" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LogoMark({ className = '', showTagline = true, compact = false }) {
  const uid = useId().replace(/:/g, '')

  return (
    <Link to="/" className={`group inline-flex select-none ${compact ? 'items-center gap-2.5' : 'flex-col items-start gap-0.5'} ${className}`}>
      <span className="inline-flex items-center gap-2.5">
        <CompassRoseStar uid={uid} className="h-8 w-8 shrink-0 transition-transform duration-300 group-hover:scale-105" />
        <span
          className="font-heading text-xl font-semibold tracking-[0.12em] text-[var(--text-hi)] uppercase leading-none"
        >
          Polaris
        </span>
      </span>
      {showTagline && !compact && (
        <span className="font-heading ml-[2.625rem] text-[11px] italic text-[var(--muted)] leading-tight">
          Your Anchor in Polarized Seas
        </span>
      )}
    </Link>
  )
}
