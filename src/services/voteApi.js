/** @returns {Promise<{ distribution: { for: number, against: number, neutral: number }, total: number, userStance?: string | null }>} */
export async function fetchVoteState(articleId, token) {
  const headers = {}
  if (token?.trim()) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`/api/articles/${encodeURIComponent(articleId)}/votes`, { headers })
  if (!res.ok) throw new Error('vote_fetch_failed')
  return res.json()
}
