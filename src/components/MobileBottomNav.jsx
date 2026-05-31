import { NavLink } from 'react-router-dom'
import { IoHomeOutline, IoCompassOutline, IoPersonOutline, IoInformationCircleOutline } from 'react-icons/io5'

const base =
  'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]'

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[55] flex border-t border-[var(--border)] bg-[var(--page)]/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `${base} ${isActive ? 'text-[var(--signal)]' : ''}`}
      >
        <IoHomeOutline className="h-6 w-6 text-[var(--text)]" />
        Home
      </NavLink>
      <NavLink
        to="/explore"
        className={({ isActive }) => `${base} ${isActive ? 'text-[var(--signal)]' : ''}`}
      >
        <IoCompassOutline className="h-6 w-6 text-[var(--text)]" />
        Explore
      </NavLink>
      <NavLink
        to="/profile/me"
        className={({ isActive }) => `${base} ${isActive ? 'text-[var(--signal)]' : ''}`}
      >
        <IoPersonOutline className="h-6 w-6 text-[var(--text)]" />
        Profile
      </NavLink>
      <NavLink
        to="/about"
        className={({ isActive }) => `${base} ${isActive ? 'text-[var(--signal)]' : ''}`}
      >
        <IoInformationCircleOutline className="h-6 w-6 text-[var(--text)]" />
        About
      </NavLink>
    </nav>
  )
}
