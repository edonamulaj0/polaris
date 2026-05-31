import {
  IoHomeOutline, IoCompassOutline, IoPersonOutline,
  IoInformationCircleOutline, IoLockClosedOutline, IoAddOutline
} from 'react-icons/io5'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogoMark } from './LogoMark'
import { ThemeToggle } from './ThemeToggle'
import { useUserStore } from '../stores/userStore'

const linkBase =
  'flex items-center gap-2.5 py-2 px-3 text-[11px] font-semibold uppercase tracking-[.1em] text-[var(--muted)] transition-colors hover:text-[var(--text-hi)] border-l-2 border-transparent xl:px-3 md:justify-center md:px-0 xl:justify-start'

function navActive({ isActive }) {
  return `${linkBase} ${isActive ? 'border-l-[var(--signal)] text-[var(--text-hi)] bg-[var(--surface-hi)]' : ''}`
}

export function DesktopSidebar({ onNewDiscussion }) {
  const navigate = useNavigate()
  const googleSub = useUserStore((s) => s.googleSub)
  const signOut = useUserStore((s) => s.signOut)

  return (
    <aside
      className="fixed bottom-0 left-0 top-0 z-[55] hidden w-[60px] flex-col border-r border-[var(--border)] bg-[var(--page)] md:flex xl:w-[220px]"
      aria-label="Main navigation"
    >
      <div className="hidden border-b border-[var(--border)] px-4 py-5 xl:block">
        <LogoMark />
        <hr className="signal mt-3 mb-2" />
        <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[var(--muted)]">
          Know Both Sides
        </p>
      </div>
      <div className="flex items-center justify-center border-b border-[var(--border)] py-4 xl:hidden">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-none bg-[var(--signal)] shrink-0 text-[var(--signal-on)]"
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor"/>
          </svg>
        </span>
      </div>

      <p className="hidden px-4 pt-5 pb-1 font-mono text-[9px] uppercase tracking-[.15em] text-[var(--muted)] xl:block">
        Navigate
      </p>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-0 pb-4 pt-2 xl:pt-0">
        <NavLink to="/" end className={navActive} title="Home">
          <IoHomeOutline className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden xl:inline">Home</span>
        </NavLink>
        <NavLink to="/explore" className={navActive} title="Explore">
          <IoCompassOutline className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden xl:inline">Explore</span>
        </NavLink>
        <NavLink to="/profile/me" className={navActive} title="Profile">
          <IoPersonOutline className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden xl:inline">Profile</span>
        </NavLink>
        <NavLink to="/about" className={navActive} title="About">
          <IoInformationCircleOutline className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden xl:inline">About</span>
        </NavLink>
      </nav>

      <div className="border-t border-[var(--border)] p-3 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => navigate('/manager')}
          className="flex w-full items-center justify-center gap-2 rounded-none border border-[var(--signal)] px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal)] transition-colors hover:bg-[var(--signal-muted)] xl:justify-start"
          title="Editor Panel"
        >
          <IoLockClosedOutline className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden xl:inline">Editor Panel</span>
        </button>

        <button
          type="button"
          onClick={onNewDiscussion}
          className="signal-glow-hover flex w-full items-center justify-center gap-2 rounded-none border border-[var(--signal)] bg-[var(--signal)] py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)] transition-colors hover:bg-[var(--signal-dim)] xl:justify-start"
          title="Submit Topic"
        >
          <IoAddOutline className="h-4 w-4 shrink-0 xl:hidden" aria-hidden />
          <span className="hidden xl:inline">Submit Topic</span>
        </button>

        <div className="hidden justify-center xl:flex">
          <ThemeToggle />
        </div>

        {googleSub ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="hidden w-full py-1.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)] transition-colors hover:text-[var(--signal)] xl:block"
          >
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  )
}
