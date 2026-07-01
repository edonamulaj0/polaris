import { motion } from 'framer-motion'

/**
 * Floating light-mode preview inset — demonstrates theme responsiveness
 * alongside the primary dark-mode main view.
 */
export function ThemeShowcaseInset() {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="showcase-inset pointer-events-none fixed bottom-8 right-8 z-40 hidden w-[280px] xl:block 2xl:w-[300px]"
      aria-hidden
    >
      <div className="px-4 py-3" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' }}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#F4D068] to-[#E2E8F0] text-[8px] font-bold text-[#0F172A]">★</span>
          <span className="font-heading text-sm font-semibold tracking-wide text-[#0F172A]">Polaris</span>
          <span className="ml-auto rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[9px] font-medium text-[#64748B]">Light</span>
        </div>
        <p className="font-heading mt-0.5 text-[9px] italic text-[#64748B]">Your Anchor in Polarized Seas</p>
      </div>

      <div className="flex gap-1 px-3 pb-2">
        {['Home', 'Explore', 'Profile'].map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${
              i === 0 ? 'bg-[rgba(244,208,104,.22)] text-[#0F172A]' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mx-3 mb-3 rounded-2xl bg-white p-3 shadow-[0_10px_30px_-10px_rgba(15,23,42,.08)]">
        <p className="font-heading text-[10px] font-medium uppercase tracking-wider text-[#0D7377]">Daily Brief</p>
        <h3 className="font-heading mt-1 text-sm font-semibold leading-snug text-[#0F172A]">
          Today&apos;s Debates
        </h3>
        <div className="mt-3 space-y-2">
          <div className="rounded-xl bg-[#F8FAFC] p-2.5 shadow-[0_4px_12px_-4px_rgba(15,23,42,.06)]">
            <div className="h-1.5 w-12 rounded-full bg-[#E2E8F0]" />
            <div className="mt-2 h-2 w-full rounded-full bg-[#E2E8F0]" />
            <div className="mt-1 h-2 w-4/5 rounded-full bg-[#E2E8F0]" />
            <div className="spectrum-track mt-2.5 h-2 w-full">
              <div className="flex h-full">
                <div className="h-full w-[38%] bg-black/10" />
                <div className="h-full w-[34%] bg-black/5" />
                <div className="h-full w-[28%] bg-white/10" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] p-2.5 shadow-[0_4px_12px_-4px_rgba(15,23,42,.06)]">
            <div className="h-1.5 w-16 rounded-full bg-[#E2E8F0]" />
            <div className="mt-2 h-2 w-full rounded-full bg-[#E2E8F0]" />
            <div className="spectrum-track mt-2.5 h-2 w-full" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        <span className="text-[8px] font-medium uppercase tracking-wider text-[#94A3B8]">Theme Preview</span>
        <div className="flex gap-1">
          <span className="h-3 w-3 rounded-full bg-[#0A1128]" />
          <span className="h-3 w-3 rounded-full bg-[#F8FAFC] ring-2 ring-[#F4D068]" />
        </div>
      </div>
    </motion.aside>
  )
}
