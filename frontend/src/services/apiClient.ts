import { auth } from '../lib/firebase'

export async function getAuthToken(): Promise<string> {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken()
      if (token) return token
    } catch (e) {
      console.warn('Could not retrieve Firebase ID token, using local user state:', e)
    }
  }

  // Fallback for offline or demo testing
  const stored = localStorage.getItem('hl_user_profile')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed?.email) return `demo-${parsed.email.replace(/[^a-zA-Z0-9]/g, '_')}`
    } catch {}
  }

  return 'demo-patient-user'
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.error || `Request failed with status ${res.status}`)
  }

  return res.json()
}
