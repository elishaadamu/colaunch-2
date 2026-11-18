// Shared Phase 1 Design System Tokens & Base Dark Palette
// Aligned with Section 1 Step 5 & 6, Project OS and Follow-Up CRM

export const C = {
  bg: '#050506',
  sheet: '#0c0c0e',
  row: '#111114',
  raised: '#1c1c20',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#fafafa',
  body: '#d4d4d8',
  muted: '#a1a1aa',
  faint: '#71717a',
  crimson: '#c81e3c',
  crimsonHover: '#d92a49',
  crimsonSoft: 'rgba(200,30,60,0.15)',
  crimsonLine: 'rgba(200,30,60,0.45)',
  crimsonText: '#ff8fa3',
  ok: '#34d399',
  okSoft: 'rgba(52, 211, 153,0.13)',
  okLine: 'rgba(52, 211, 153,0.38)',
  warn: '#fbbf24',
  warnSoft: 'rgba(251, 191, 36,0.13)',
  warnLine: 'rgba(251, 191, 36,0.40)',
  sky: '#d4d4d8',
  skySoft: 'rgba(255, 255, 255,0.12)',
  skyLine: 'rgba(255, 255, 255,0.36)',
  skyText: '#e4e4e7',
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

