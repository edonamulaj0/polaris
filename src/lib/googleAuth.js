import { jwtDecode } from 'jwt-decode'

/** @returns {boolean} true when token is missing or past exp (with 60s skew). */
export function isGoogleIdTokenExpired(token) {
  if (!token?.trim()) return true
  try {
    const payload = jwtDecode(token)
    const exp = typeof payload.exp === 'number' ? payload.exp : 0
    if (!exp) return true
    return exp * 1000 <= Date.now() + 60_000
  } catch {
    return true
  }
}

/** @param {Response} res @param {Record<string, unknown>} data */
export function authErrorFromResponse(res, data) {
  const code = typeof data?.error === 'string' ? data.error : ''
  if (res.status === 401 || code === 'invalid_token' || code === 'unauthorized') {
    return 'Your session expired. Sign in again with Google.'
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message
  if (code) return code.replace(/_/g, ' ')
  return `Request failed (${res.status})`
}
