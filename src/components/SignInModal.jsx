import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { HiOutlineX } from 'react-icons/hi'
import { useUserStore } from '../stores/userStore'
import { useThemeStore } from '../stores/themeStore'
import { useScrollLock } from '../hooks/useScrollLock'

function toIsoLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function SignInModal() {
  const open = useUserStore((s) => s.signInPromptOpen)
  const closeSignInPrompt = useUserStore((s) => s.closeSignInPrompt)
  const googleSub = useUserStore((s) => s.googleSub)
  const googleIdToken = useUserStore((s) => s.googleIdToken)
  const birthLocked = useUserStore((s) => s.birthLocked)
  const birthDate = useUserStore((s) => s.birthDate)
  const setGoogleProfileFromJwt = useUserStore((s) => s.setGoogleProfileFromJwt)
  const setBirthDate = useUserStore((s) => s.setBirthDate)
  const resolved = useThemeStore((s) => s.resolved)

  const [dobDraft, setDobDraft] = useState('')
  const [birthdayError, setBirthdayError] = useState('')
  const [savingBirthday, setSavingBirthday] = useState(false)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const googleTheme = resolved === 'dark' ? 'filled_black' : 'outline'

  const { dobMin, dobMax } = useMemo(() => {
    const today = new Date()
    const max = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    const min = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    return { dobMin: toIsoLocalDate(min), dobMax: toIsoLocalDate(max) }
  }, [])

  const needsGoogle = !googleSub?.trim() || !googleIdToken?.trim()
  const needsDob = Boolean(googleSub?.trim() && googleIdToken?.trim() && !birthLocked)
  const showBirthdayStep = open && !needsGoogle && needsDob

  useScrollLock(open)

  useEffect(() => {
    if (birthDate) setDobDraft(birthDate)
  }, [birthDate])

  useEffect(() => {
    if (!open || needsGoogle || needsDob) return
    closeSignInPrompt()
  }, [open, needsGoogle, needsDob, closeSignInPrompt])

  const dobOk = dobDraft >= dobMin && dobDraft <= dobMax

  async function handleSaveBirthday() {
    if (!dobOk || savingBirthday || birthLocked) return
    setBirthdayError('')
    setSavingBirthday(true)
    const result = await setBirthDate(dobDraft)
    setSavingBirthday(false)
    if (result.ok || result.error === 'birthday_already_set') {
      closeSignInPrompt()
      return
    }
    setBirthdayError("Couldn't save — try again")
  }

  if (!clientId) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--overlay)] p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSignInPrompt}
        >
          <motion.div
            className="relative w-full max-w-md rounded-3xl bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-in-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeSignInPrompt}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--nav-pill-bg)] text-[var(--muted)] hover:text-[var(--text)]"
              aria-label="Close"
            >
              <HiOutlineX className="h-5 w-5" />
            </button>

            {needsGoogle ? (
              <>
                <h2 id="sign-in-modal-title" className="font-heading text-2xl font-semibold text-[var(--text)]">
                  Sign in to participate
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Sign in with Google to vote, comment, save debates, and submit topics. Browsing stays open without an
                  account.
                </p>
                <div className="mt-6 flex justify-center">
                  <GoogleLogin
                    onSuccess={(res) => {
                      if (!res.credential) return
                      try {
                        setGoogleProfileFromJwt(jwtDecode(res.credential), res.credential)
                      } catch {
                        /* invalid jwt */
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
              </>
            ) : showBirthdayStep ? (
              <>
                <h2 id="sign-in-modal-title" className="font-heading text-2xl font-semibold text-[var(--text)]">
                  Date of birth
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Required once before you can vote or comment. Must be 13 or older. This cannot be changed later.
                </p>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Birthday
                </label>
                <input
                  type="date"
                  min={dobMin}
                  max={dobMax}
                  value={dobDraft}
                  disabled={birthLocked || savingBirthday}
                  onChange={(e) => {
                    setDobDraft(e.target.value)
                    setBirthdayError('')
                  }}
                  className="mt-1 w-full rounded-2xl bg-[var(--surface-hi)] px-4 py-3 text-[var(--text)] shadow-[var(--shadow-pill)] outline-none focus:shadow-[0_0_0_3px_rgba(244,208,104,.25)] disabled:opacity-50"
                />
                {birthdayError && (
                  <p className="mt-2 text-sm text-[var(--signal)]" role="alert">
                    {birthdayError}
                  </p>
                )}
                <motion.button
                  type="button"
                  disabled={!dobOk || savingBirthday || birthLocked}
                  className="signal-glow-hover mt-5 w-full rounded-full bg-[var(--gold)] py-3 text-sm font-semibold text-[var(--signal-on)] shadow-[0_4px_16px_-4px_rgba(244,208,104,.45)] disabled:cursor-not-allowed disabled:opacity-40"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveBirthday}
                >
                  {savingBirthday ? 'Saving…' : 'Continue'}
                </motion.button>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
