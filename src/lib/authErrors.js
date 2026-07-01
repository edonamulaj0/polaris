/** Map API auth failures to user-facing copy (no store imports — avoids circular deps). */
export function authErrorFromResponse(res, data) {
  const code = typeof data?.error === 'string' ? data.error : ''
  if (res.status === 401 || code === 'invalid_token' || code === 'unauthorized') {
    return 'Your session expired. Sign in again with Google.'
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message
  if (code) return code.replace(/_/g, ' ')
  return `Request failed (${res.status})`
}
