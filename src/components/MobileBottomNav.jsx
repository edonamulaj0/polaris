import { NavLink } from 'react-router-dom'
import {
  IoHomeOutline,
  IoCompassOutline,
  IoPersonOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5'

const base =
  'flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[9px] font-medium leading-tight text-[var(--muted)] transition-colors'

export function MobileBottomNav() {
  const items = [
    { to: '/', end: true, label: 'Home', icon: IoHomeOutline },
    { to: '/explore', label: 'Explore', icon: IoCompassOutline },
    { to: '/profile/me', label: 'Profile', icon: IoPersonOutline },
    { to: '/about', label: 'About', icon: IoInformationCircleOutline },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[55] flex min-h-[56px] bg-[var(--page)]/95 px-0.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"
      style={{ boxShadow: '0 -4px 24px -8px rgba(0,0,0,.35)' }}
    >
      {items.map(({ to, end, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `${base} ${isActive ? 'text-[var(--gold)]' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isActive ? 'bg-[var(--nav-pill-active)]' : ''
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
