import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi'
import { motion } from 'framer-motion'
import { useThemeStore } from '../stores/themeStore'

const icons = {
  light: HiOutlineSun,
  dark: HiOutlineMoon,
}

const labels = {
  light: 'Switch to dark theme',
  dark: 'Switch to light theme',
}

export function ThemeToggle({ className = '' }) {
  const theme = useThemeStore((s) => s.resolved)
  const toggle = useThemeStore((s) => s.toggle)
  const Icon = icons[theme] || HiOutlineMoon

  return (
    <motion.button
      type="button"
      onClick={toggle}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-[var(--nav-pill-bg)] text-[var(--text)] shadow-[var(--shadow-pill)] transition-colors hover:bg-[var(--nav-pill-hover)] ${className}`}
      aria-label="Toggle color theme"
      title={labels[theme]}
      whileTap={{ scale: 0.93 }}
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  )
}
