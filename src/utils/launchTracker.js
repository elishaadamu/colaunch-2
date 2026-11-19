// Sends launch telemetry (page views, checkout, activation, errors) to /api/launch/event.
import { postLaunchEvent } from '../services/opsApi'

export function anonId() {
  try {
    let a = localStorage.getItem('cl_anon')
    if (!a) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('cl_anon', a) }
    return a
  } catch { return 'anon' }
}

export function currentRef() {
  try {
    const q = new URLSearchParams(window.location.search)
    const r = q.get('ref') || q.get('utm_source') || ''
    if (r) localStorage.setItem('cl_ref', r)
    return r || localStorage.getItem('cl_ref') || ''
  } catch { return '' }
}

export function trackLaunch(type, { projectId, slug, source = 'page', meta } = {}) {
  if (typeof window === 'undefined' || (!projectId && !slug)) return
  postLaunchEvent({ projectId, slug, type, anon: anonId(), ref: currentRef(), path: window.location.pathname, source, meta: meta || null }).catch(() => {})
}
