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
  violet: '#f59e0b',
  violetSoft: 'rgba(245,158,11,0.12)',
  violetLine: 'rgba(245,158,11,0.40)',
  violetText: '#fcd34d',
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



// Shared Phase 1 look (applied by adding `p1-themed` to a step's root element).
export const P1_SHARED_CSS = `
.p1-themed { position: relative; background: linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 160px), ${C.sheet} !important; border-color: #2a2a30 !important; }
.p1-themed .btn-primary { background: linear-gradient(180deg,#d62546 0%,#c81e3c 55%,#ad1833 100%) !important; border-color: rgba(255,77,109,.35) !important; box-shadow: 0 1px 0 rgba(255,255,255,.18) inset, 0 10px 26px -12px rgba(200,30,60,.6); }
.p1-themed .btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
.p1-themed .card { background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 90px), ${C.row}; border: 1px solid ${C.line}; transition: border-color .18s, transform .18s; }
.p1-themed .card:hover { border-color: ${C.lineStrong}; }
.p1-themed .tab[aria-selected="true"] { background: linear-gradient(180deg, rgba(200,30,60,.28), rgba(200,30,60,.08)) !important; border-color: rgba(255,77,109,.55) !important; color: #fff !important; }
@keyframes p1Rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.p1-rise > * { animation: p1Rise .45s cubic-bezier(.16,1,.3,1) both; }
.p1-rise > *:nth-child(2) { animation-delay: .05s; } .p1-rise > *:nth-child(3) { animation-delay: .1s; }
.p1-rise > *:nth-child(4) { animation-delay: .15s; } .p1-rise > *:nth-child(n+5) { animation-delay: .2s; }
@media (prefers-reduced-motion: reduce) { .p1-rise > * { animation: none; } }
`
