const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const BASE_URL = configuredBaseUrl
  ? configuredBaseUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '')
  : import.meta.env.DEV
    ? '/api'
    : ''

async function request(path, options = {}) {
  if (!BASE_URL) {
    throw new Error(
      'The RSVP service is not configured. Set VITE_API_BASE_URL to your deployed API URL in Netlify and redeploy.'
    )
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const responseBody = await res.text()
    let detail = responseBody
    try {
      const body = JSON.parse(responseBody)
      detail = body.detail || responseBody
    } catch {
      // Some hosting and proxy errors are plain text rather than JSON.
    }
    throw new Error(detail || `Request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  submitRsvp: (data) =>
    request('/rsvp', { method: 'POST', body: JSON.stringify(data) }),

  getRsvp: (rsvpId) => request(`/rsvp/${rsvpId}`),

  getEventSummary: () => request('/rsvp/summary'),

  checkIn: (ticketCode) =>
    request('/check-in', { method: 'POST', body: JSON.stringify({ ticket_code: ticketCode }) })
}
