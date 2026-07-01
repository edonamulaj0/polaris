import { useUserStore } from '../stores/userStore'

const SESSION_KEY = 'polaris_editor_session'

export function getEditorSessionToken() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return ''
    const { token, expiresAt } = JSON.parse(raw)
    if (!token || !expiresAt || expiresAt * 1000 <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return ''
    }
    return token
  } catch {
    return ''
  }
}

export function setEditorSession(token, expiresAt) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt }))
}

export function clearEditorSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

function authHeaders(extra = {}) {
  const googleIdToken = useUserStore.getState().googleIdToken?.trim()
  const editorSession = getEditorSessionToken()
  const headers = { ...extra }
  if (googleIdToken) headers.Authorization = `Bearer ${googleIdToken}`
  if (editorSession) headers['X-Editor-Session'] = editorSession
  return headers
}

export async function editorFetch(url, init = {}) {
  const headers = authHeaders(init.headers || {})
  const res = await fetch(url, { ...init, headers })
  if (res.status === 401) {
    const data = await res.clone().json().catch(() => ({}))
    if (data.error === 'invalid_editor_session' || data.error === 'editor_session_required') {
      clearEditorSession()
    }
  }
  return res
}

export async function fetchEditorStatus(token) {
  const res = await fetch('/api/users/me/editor-status', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('editor_status_failed')
  return res.json()
}

export async function registerEditor(token, pin, confirmPin) {
  const res = await fetch('/api/users/me/editor/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin, confirmPin }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: data.error, message: data.message }
  }
  setEditorSession(data.sessionToken, data.expiresAt)
  return { ok: true, ...data }
}

export async function resetEditorPin(token, pin, confirmPin) {
  const res = await fetch('/api/users/me/editor/reset-pin', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin, confirmPin }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: data.error, message: data.message }
  }
  setEditorSession(data.sessionToken, data.expiresAt)
  return { ok: true, ...data }
}

export async function unlockEditor(token, pin) {
  const res = await fetch('/api/users/me/editor/unlock', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: data.error, message: data.message }
  }
  setEditorSession(data.sessionToken, data.expiresAt)
  return { ok: true, ...data }
}
