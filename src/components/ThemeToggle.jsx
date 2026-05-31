import { HiOutlineMoon, HiOutlineSun, HiOutlineDesktopComputer } from 'react-icons/hi'
import { motion } from 'framer-motion'
import { useThemeStore } from '../stores/themeStore'

const icons = {
  light: HiOutlineSun,
  dark: HiOutlineMoon,
  system: HiOutlineDesktopComputer,
}

const labels = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
}

export function ThemeToggle({ className = '' }) {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const Icon = icons[theme] || HiOutlineMoon

  return (
    <motion.button
      type="button"
      onClick={toggle}
      className={`flex h-9 w-9 items-center justify-center rounded-none text-[var(--text)] transition-colors hover:bg-[var(--surface-hi)] ${className}`}
      aria-label="Toggle color theme"
      title={labels[theme]}
      whileTap={{ scale: 0.93 }}
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  )
}
