import { Link } from 'react-router-dom'

export function LogoMark({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-none bg-[var(--signal)] shrink-0 text-[var(--signal-on)]"
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor"/>
        </svg>
      </span>
      <span
        className="font-display text-xl tracking-widest text-[var(--text-hi)] uppercase leading-none"
        style={{ letterSpacing: '0.18em' }}
      >
        POLARIS
      </span>
    </Link>
  )
}
