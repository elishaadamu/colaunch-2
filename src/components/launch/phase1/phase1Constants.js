// Shared Phase 1 Design System Tokens & Base Dark Palette
// Aligned with Section 1 Step 5 & 6, Project OS and Follow-Up CRM

export const C = {
  bg: '#08090c',
  sheet: '#10131a',
  row: '#0c0e13',
  raised: '#171b24',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#f3f4f6',
  body: '#cdd1da',
  muted: '#9ba1ae',
  faint: '#6c7280',
  crimson: '#c81e3c',
  crimsonHover: '#d92a49',
  crimsonSoft: 'rgba(200,30,60,0.15)',
  crimsonLine: 'rgba(200,30,60,0.45)',
  crimsonText: '#ff8fa3',
  ok: '#6fcf9b',
  okSoft: 'rgba(111,207,155,0.13)',
  okLine: 'rgba(111,207,155,0.38)',
  warn: '#f0b46a',
  warnSoft: 'rgba(240,180,106,0.13)',
  warnLine: 'rgba(240,180,106,0.40)',
  sky: '#38bdf8',
  skySoft: 'rgba(56,189,248,0.12)',
  skyLine: 'rgba(56,189,248,0.36)',
  skyText: '#7dd3fc',
  violet: '#a78bfa',
  violetSoft: 'rgba(167,139,250,0.14)',
  violetLine: 'rgba(167,139,250,0.40)',
  violetText: '#c4b5fd',
}

export const HEADING_FONT = { fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }

export const PILL_TONES = {
  neutral: { color: C.muted, background: C.row, borderColor: C.line },
  raised: { color: C.body, background: C.raised, borderColor: C.lineStrong },
  crimson: { color: C.crimsonText, background: C.crimsonSoft, borderColor: C.crimsonLine },
  ok: { color: C.ok, background: C.okSoft, borderColor: C.okLine },
  warn: { color: C.warn, background: C.warnSoft, borderColor: C.warnLine },
  sky: { color: C.skyText, background: C.skySoft, borderColor: C.skyLine },
  violet: { color: C.violetText, background: C.violetSoft, borderColor: C.violetLine },
}

