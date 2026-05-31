import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useUserStore } from '../stores/userStore'
import { useThemeStore } from '../stores/themeStore'
import { useScrollLock } from '../hooks/useScrollLock'

function toIsoLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AuthGate() {
  const googleSub = useUserStore((s) => s.googleSub)
  const birthDate = useUserStore((s) => s.birthDate)
  const birthLocked = useUserStore((s) => s.birthLocked) // [FE-3]
  const setGoogleProfileFromJwt = useUserStore((s) => s.setGoogleProfileFromJwt)
  const setBirthDate = useUserStore((s) => s.setBirthDate)
  const resolved = useThemeStore((s) => s.resolved)
  const [dobDraft, setDobDraft] = useState('')
  const [hydrated, setHydrated] = useState(() => useUserStore.persist.hasHydrated())
  const [serverChecked, setServerChecked] = useState(false) // [FE-3]
  const [checkingServer, setCheckingServer] = useState(false) // [FE-3]
  const [birthdayError, setBirthdayError] = useState('') // [FE-3]
  const [savingBirthday, setSavingBirthday] = useState(false) // [FE-3]

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const isProd = import.meta.env.PROD

  const { dobMin, dobMax } = useMemo(() => {
    const today = new Date()
    const max = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    const min = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    return { dobMin: toIsoLocalDate(min), dobMax: toIsoLocalDate(max) }
  }, [])

  useEffect(() => {
    if (hydrated) return undefined
    return useUserStore.persist.onFinishHydration(() => setHydrated(true))
  }, [hydrated])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- prefill DOB draft after hydrate */
    if (birthDate) setDobDraft(birthDate)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [birthDate])

  useEffect(() => {
    if (!googleSub?.trim() || birthLocked) {
      setServerChecked(true) // [FE-3]
      return undefined
    }

    let cancelled = false
    setCheckingServer(true) // [FE-3]
    setServerChecked(false) // [FE-3]

    fetch(`/api/users/${encodeURIComponent(googleSub)}/birthday`) // [FE-3]
      .then((res) => (res.ok ? res.json() : { set: false }))
      .then((data) => {
        if (cancelled) return
        if (data.set) {
          useUserStore.setState({
            birthLocked: true, // [FE-3]
            birthDate: data.birthDate || useUserStore.getState().birthDate, // [FE-3]
          })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setServerChecked(true) // [FE-3]
          setCheckingServer(false) // [FE-3]
        }
      })

    return () => {
      cancelled = true
    }
  }, [googleSub, birthLocked])

  const needsGoogle = !googleSub?.trim()
  const needsDob =
    googleSub?.trim() && !birthLocked && serverChecked && !checkingServer // [FE-3]
  const open = hydrated && Boolean(clientId) && (needsGoogle || needsDob)
  const missingClient = hydrated && !clientId

  useScrollLock(open || missingClient)

  const dobOk = dobDraft >= dobMin && dobDraft <= dobMax
  const googleTheme = resolved === 'dark' ? 'filled_black' : 'outline'

  async function handleSaveBirthday() {
    if (!dobOk || savingBirthday || birthLocked) return // [FE-3]
    setBirthdayError('') // [FE-3]
    setSavingBirthday(true) // [FE-3]
    const result = await setBirthDate(dobDraft) // [FE-3]
    setSavingBirthday(false) // [FE-3]
    if (result.ok || result.error === 'birthday_already_set') return // [FE-3]
    setBirthdayError("Couldn't save — try again") // [FE-3]
  }

  return (
    <>
      <AnimatePresence>
        {!hydrated && (
          <motion.div
            className="fixed inset-0 z-[200] bg-[var(--page)]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {missingClient && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--overlay)] p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-none border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              role="alert"
            >
              <h2 className="font-heading text-xl font-semibold text-[var(--text)]">
                Google Sign-In not configured
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {isProd ? (
                  <>
                    Set <code className="rounded-none bg-[var(--surface-hi)] px-1.5 py-0.5 text-[var(--text)]">VITE_GOOGLE_CLIENT_ID</code> in{' '}
                    <strong className="font-medium text-[var(--text)]">Cloudflare Pages → Settings → Environment variables</strong> (Production and
                    Preview), then trigger a new deploy. In Google Cloud Console, add{' '}
                    <code className="rounded-none bg-[var(--surface-hi)] px-1.5 py-0.5">{typeof window !== 'undefined' ? window.location.origin : 'your site URL'}</code>{' '}
                    to the OAuth client <strong className="font-medium text-[var(--text)]">Authorized JavaScript origins</strong> (and use the same client ID).
                  </>
                ) : (
                  <>
                    Add <code className="rounded-none bg-[var(--surface-hi)] px-1.5 py-0.5 text-[var(--text)]">VITE_GOOGLE_CLIENT_ID</code> to{' '}
                    <code className="rounded-none bg-[var(--surface-hi)] px-1.5 py-0.5 text-[var(--text)]">.env</code> (OAuth 2.0 Web client from Google
                    Cloud Console) and restart the dev server. Authorized JavaScript origins should include{' '}
                    <code className="rounded-none bg-[var(--surface-hi)] px-1.5 py-0.5">http://localhost:5173</code>.
                  </>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && needsGoogle && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--overlay)] p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-none border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-gate-title"
            >
              <h2 id="auth-gate-title" className="font-heading text-2xl font-semibold text-[var(--text)]">
                Sign in to Polaris
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Use Google to continue. We read your name and email from the sign-in token. After sign-in you’ll enter
                your date of birth once — it is saved to your account and cannot be changed later.
              </p>
              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={(res) => {
                    if (!res.credential) return
                    try {
                      const payload = jwtDecode(res.credential)
                      setGoogleProfileFromJwt(payload) // [FE-3] triggers /api/users upsert
                    } catch {
                      // ignore malformed token
                    }
                  }}
                  onError={() => {}}
                  useOneTap={false}
                  theme={googleTheme}
                  size="large"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && needsDob && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--overlay)] p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-none border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dob-gate-title"
            >
              <h2 id="dob-gate-title" className="font-heading text-2xl font-semibold text-[var(--text)]">
                Date of birth
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Required once per account. We use it to verify you’re at least 13 and to show your age on your profile.
                This cannot be changed after you save it.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Birthday
              </label>
              <input
                type="date"
                min={dobMin}
                max={dobMax}
                value={dobDraft}
                disabled={birthLocked || savingBirthday} // [FE-3]
                onChange={(e) => {
                  setDobDraft(e.target.value)
                  setBirthdayError('')
                }}
                className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-3 text-[var(--text)] outline-none focus:border-[var(--signal)]/45 disabled:opacity-50"
              />
              {birthdayError && (
                <p className="mt-2 text-sm text-[var(--signal)]" role="alert">
                  {birthdayError}
                </p>
              )}
              <motion.button
                type="button"
                disabled={!dobOk || savingBirthday || birthLocked} // [FE-3]
                className="signal-glow-hover mt-5 w-full rounded-none bg-[var(--signal)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--signal-on)] disabled:cursor-not-allowed disabled:opacity-40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveBirthday}
              >
                {savingBirthday ? 'Saving…' : 'Continue'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
