import { useEffect, useMemo, useRef, useState } from 'react'

// A live, coded product dashboard for the public site (not an image). Everything is driven by the
// section data and the site's brand colour; numbers are sample data and the page says so.

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function seeded(seed) {
  let s = seed % 2147483647 || 7
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function makeSeries(n, seed, base = 62) {
  const r = seeded(seed)
  const out = []
  let v = base
  for (let i = 0; i < n; i += 1) { v = Math.max(45, Math.min(97, v + (r() - 0.42) * 6)); out.push(Math.round(v * 10) / 10) }
  return out
}

function useCountUp(target, ms = 1200) {
  const [v, setV] = useState(reduced() ? target : 0)
  useEffect(() => {
    if (reduced()) { setV(target); return }
    let raf; const t0 = performance.now()
    const tick = (t) => { const k = Math.min(1, (t - t0) / ms); setV(target * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

function parseNum(raw) {
  const m = String(raw ?? '').match(/-?\d[\d,]*\.?\d*/)
  if (!m) return { n: null, pre: '', post: String(raw ?? '') }
  const i = String(raw).indexOf(m[0])
  return { n: Number(m[0].replace(/,/g, '')), pre: String(raw).slice(0, i), post: String(raw).slice(i + m[0].length), dec: (m[0].split('.')[1] || '').length }
}

function Spark({ data, color }) {
  const w = 90, h = 28
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`).join(' ')
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
}

function Kpi({ k, i }) {
  const p = parseNum(k.value)
  const v = useCountUp(p.n ?? 0, 1100 + i * 150)
  const down = String(k.delta || '').trim().startsWith('-')
  const spark = useMemo(() => makeSeries(14, 31 + i * 17, 55), [i])
  return (
    <div className="db-card db-kpi">
      <p className="db-mut db-sm">{k.label}</p>
      <div className="db-row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
        <div>
          <p className="db-big">{p.n == null ? k.value : `${p.pre}${v.toLocaleString(undefined, { maximumFractionDigits: p.dec || 0, minimumFractionDigits: p.dec || 0 })}${p.post}`}</p>
          {k.delta && <p className="db-sm" style={{ color: down ? '#f87171' : 'var(--acc)', fontWeight: 600, marginTop: 2 }}>{down ? '↓' : '↑'} {String(k.delta).replace(/^[-+]/, '')}</p>}
        </div>
        <Spark data={spark} color={down ? '#f59e0b' : 'var(--acc)'} />
      </div>
    </div>
  )
}

function AreaChart({ title }) {
  const [series, setSeries] = useState(() => makeSeries(30, 11))
  const [hover, setHover] = useState(null)
  const [drawn, setDrawn] = useState(reduced())
  const r = useRef(seeded(99))
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 50); return () => clearTimeout(t) }, [])
  useEffect(() => {
    if (reduced()) return
    const t = setInterval(() => setSeries((s) => [...s.slice(1), Math.max(48, Math.min(97, s[s.length - 1] + (r.current() - 0.45) * 5))]), 2200)
    return () => clearInterval(t)
  }, [])
  const box = useRef(null)
  const [W, setW] = useState(640)
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setW(Math.max(240, Math.round(el.clientWidth))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = W < 420 ? 180 : 220, pad = 34
  const lo = Math.floor((Math.min(...series) - 4) / 10) * 10, hiV = Math.ceil((Math.max(...series) + 4) / 10) * 10
  const ticks = []; for (let g = lo; g <= hiV; g += W < 420 ? 20 : 10) ticks.push(g)
  const x = (i) => pad + (i / (series.length - 1)) * (W - pad - 8)
  const y = (v) => 10 + (1 - (v - lo) / (hiV - lo || 1)) * (H - 34)
  const line = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(series.length - 1)},${H - 24} L${x(0)},${H - 24} Z`
  const hi = hover ?? series.length - 1
  const day = (i) => { const d = new Date(); d.setDate(d.getDate() - (series.length - 1 - i)); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
  return (
    <div className="db-card" style={{ position: 'relative' }}>
      <div className="db-row" style={{ justifyContent: 'space-between' }}>
        <p className="db-h">{title || 'Last 30 days'}</p>
        <span className="db-pill"><span className="db-dot" />Live</span>
      </div>
      <div ref={box} style={{ width: '100%' }}><svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ width: '100%', height: 'auto', marginTop: 8, display: 'block' }}
        onMouseMove={(e) => { const b = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - b.left) / b.width) * W; setHover(Math.max(0, Math.min(series.length - 1, Math.round(((px - pad) / (W - pad - 8)) * (series.length - 1))))) }}
        onMouseLeave={() => setHover(null)} role="img" aria-label={`${title || 'Engagement'} over the last 30 days, sample data`}>
        <defs><linearGradient id="dbfill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--acc)" stopOpacity=".35" /><stop offset="1" stopColor="var(--acc)" stopOpacity="0" /></linearGradient></defs>
        {ticks.map((g) => <g key={g}><line x1={pad} x2={W - 8} y1={y(g)} y2={y(g)} stroke="rgba(255,255,255,.07)" /><text x={pad - 6} y={y(g) + 3} textAnchor="end" fontSize="11" fill="#8b93a1">{g}%</text></g>)}
        {(W < 420 ? [0, 14, 29] : [0, 7, 14, 21, 29]).map((i, j, a) => <text key={i} x={x(i)} y={H - 6} textAnchor={j === 0 ? 'start' : j === a.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#8b93a1">{day(i)}</text>)}
        <path d={area} fill="url(#dbfill)" style={{ opacity: drawn ? 1 : 0, transition: 'opacity .9s ease .4s' }} />
        <path d={line} fill="none" stroke="var(--acc)" strokeWidth="2.2" strokeLinejoin="round" pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: 'stroke-dashoffset 1.4s ease, d .6s ease' }} />
        <line x1={x(hi)} x2={x(hi)} y1={10} y2={H - 24} stroke="rgba(255,255,255,.18)" strokeDasharray="3 3" />
        <circle cx={x(hi)} cy={y(series[hi])} r="4.5" fill="var(--acc)" stroke="#0b0d12" strokeWidth="2" />
      </svg></div>
      <div className="db-tip" style={{ left: Math.min(Math.max(8, x(hi) - 50), W - 110) + 14 }}>
        <p className="db-sm db-mut">{day(hi)}</p>
        <p className="db-sm" style={{ fontWeight: 700 }}>Score: {Math.round(series[hi])}%</p>
      </div>
    </div>
  )
}

function Donut({ title, segments }) {
  const segs = (segments || []).filter((s) => s.label).slice(0, 4)
  const total = segs.reduce((a, s) => a + (Number(s.value) || 0), 0) || 1
  const [on, setOn] = useState(reduced())
  useEffect(() => { const t = setTimeout(() => setOn(true), 80); return () => clearTimeout(t) }, [])
  const colors = ['var(--acc)', '#f5c451', '#94a3b8', '#60a5fa']
  const R = 52, C = 2 * Math.PI * R
  let off = 0
  const count = useCountUp(Number(String(segments?.total || '').replace(/\D/g, '')) || 1284)
  return (
    <div className="db-card">
      <p className="db-h">{title || 'Distribution'}</p>
      <div className="db-row" style={{ gap: 18, marginTop: 12, alignItems: 'center' }}>
        <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={segs.map((s) => `${s.label} ${s.value}%`).join(', ')}>
          <g transform="rotate(-90 70 70)">
            {segs.map((s, i) => {
              const len = ((Number(s.value) || 0) / total) * C
              const el = <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={colors[i]} strokeWidth="16" strokeDasharray={`${on ? Math.max(len - 2, 0) : 0} ${C}`} strokeDashoffset={-off} style={{ transition: `stroke-dasharray 1s ease ${i * 0.15}s` }} />
              off += len
              return el
            })}
          </g>
          <text x="70" y="68" textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">{Math.round(count).toLocaleString()}</text>
          <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#8b93a1">entries</text>
        </svg>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10, flex: 1 }}>
          {segs.map((s, i) => (
            <li key={i} className="db-row db-sm" style={{ justifyContent: 'space-between' }}>
              <span className="db-row" style={{ gap: 8 }}><span style={{ width: 10, height: 10, background: colors[i], borderRadius: 2 }} />{s.label}</span>
              <b>{s.value}%</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const CSS = `
.db{--panel:#0f1218;--panel2:#141821;--ln:rgba(255,255,255,.08);color:#e9edf3;font-family:var(--body)}
.db *{box-sizing:border-box}.db p{margin:0}
.db-frame{border:1px solid color-mix(in srgb,var(--acc) 35%,transparent);border-radius:18px;background:#0b0d12;padding:10px;box-shadow:0 30px 80px -30px color-mix(in srgb,var(--acc) 40%,transparent)}
.db-app{display:grid;grid-template-columns:200px 1fr;border-radius:12px;overflow:hidden;background:#0b0d12;border:1px solid var(--ln)}
.db-side{background:#0d1016;border-right:1px solid var(--ln);padding:14px 10px;display:flex;flex-direction:column;gap:4px}
.db-nav{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:8px;font-size:13px;color:#aeb5c2;background:transparent;border:0;cursor:pointer;text-align:left;width:100%}
.db-nav[aria-current="true"]{background:var(--acc);color:var(--acc-ink);font-weight:600}
.db-nav:hover:not([aria-current="true"]){background:rgba(255,255,255,.04);color:#fff}
.db-main{padding:14px;display:grid;gap:12px;min-width:0}
.db-top{display:flex;align-items:center;gap:12px}
.db-search{flex:1;background:var(--panel);border:1px solid var(--ln);border-radius:8px;padding:8px 12px;font-size:12px;color:#7d8594}
.db-av{width:30px;height:30px;border-radius:99px;background:var(--acc);color:var(--acc-ink);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
.db-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.db-grid2{display:grid;grid-template-columns:1.7fr 1fr;gap:12px}
.db-card{background:var(--panel);border:1px solid var(--ln);border-radius:10px;padding:14px;min-width:0}
.db-row{display:flex;align-items:center;gap:8px}
.db-h{font-weight:700;font-size:14px}.db-sm{font-size:12px}.db-mut{color:#8b93a1}
.db-big{font-size:24px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.db-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);color:var(--acc)}
.db-dot{width:6px;height:6px;border-radius:99px;background:var(--acc);animation:dbp 1.6s ease-in-out infinite}
@keyframes dbp{50%{opacity:.25}}
.db-tip{position:absolute;top:44px;background:#151a24;border:1px solid var(--ln);border-radius:8px;padding:6px 10px;pointer-events:none;transition:left .25s ease;white-space:nowrap}
.db-bubble{background:var(--panel2);border:1px solid var(--ln);border-radius:10px;padding:9px 12px;font-size:13px}
.db-li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 4px;border-bottom:1px solid var(--ln);font-size:13px}
.db-li:last-child{border-bottom:0}
.db-st{font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid}
.db-ask{display:flex;gap:8px;align-items:center;background:var(--panel);border:1px solid var(--ln);border-radius:10px;padding:8px}
.db-ask input{flex:1;background:transparent;border:0;outline:0;color:#e9edf3;font-size:13px;padding:6px}
.db-gen{background:var(--acc);color:var(--acc-ink);border:0;border-radius:8px;padding:8px 14px;font-weight:600;font-size:12px;cursor:pointer}
@container (max-width:900px){.db-app{grid-template-columns:1fr}.db-side{display:none}.db-kpis{grid-template-columns:repeat(2,1fr)}.db-grid2{grid-template-columns:1fr}}
`

export default function SiteDashboard({ d, site, editing }) {
  const nav = (d.nav && d.nav.length ? d.nav : ['Dashboard']).slice(0, 7)
  const [cur, setCur] = useState(0)
  const [typed, setTyped] = useState('')
  const [shown, setShown] = useState(reduced() ? 999 : 0)
  const answer = String(d.assistant?.answer || '')
  useEffect(() => {
    if (reduced() || editing) { setShown(999); return }
    setShown(0)
    const t = setInterval(() => setShown((n) => (n >= answer.length ? n : n + 3)), 18)
    return () => clearInterval(t)
  }, [answer, editing])
  const kpis = (d.kpis || []).slice(0, 4)
  const brand = site?.sections?.find((s) => s.type === 'nav')?.data?.brand || d.title || ''
  return (
    <div className="sec db"><style>{CSS}</style>
      <div className="wrap">
        {(d.title || d.subtitle) && (
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px' }}>
            {d.title && <h2 className="h2">{d.title}</h2>}
            {d.subtitle && <p className="mut" style={{ marginTop: 14, fontSize: 17 }}>{d.subtitle}</p>}
          </div>
        )}
        <div className="db-frame">
          <div className="db-app">
            <aside className="db-side">
              <div className="db-row" style={{ padding: '4px 8px 14px', fontWeight: 700, fontSize: 14 }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--acc)', display: 'inline-block' }} />{brand}
              </div>
              {['Dashboard', ...nav.filter((n) => n !== 'Dashboard')].slice(0, 7).map((n, i) => (
                <button key={n} type="button" className="db-nav" aria-current={cur === i} onClick={() => setCur(i)}>
                  <span style={{ width: 14, height: 14, border: '1.5px solid currentColor', borderRadius: 3, opacity: 0.8 }} />{n}
                </button>
              ))}
            </aside>
            <div className="db-main">
              <div className="db-top">
                <div className="db-search">Search…</div>
                <span className="db-pill"><span className="db-dot" />Sample data</span>
                <span className="db-av">JD</span>
              </div>
              <div className="db-kpis">{kpis.map((k, i) => <Kpi key={i} k={k} i={i} />)}</div>
              <div className="db-grid2">
                <AreaChart title={d.chartTitle} />
                <Donut title={d.donutTitle} segments={d.segments} />
              </div>
              <div className="db-grid2">
                <div className="db-card" style={{ display: 'grid', gap: 10 }}>
                  <p className="db-h">{d.assistant?.title || 'AI assistant'}</p>
                  {d.assistant?.question && <div className="db-row" style={{ alignItems: 'flex-start' }}><span className="db-av" style={{ width: 24, height: 24, fontSize: 9 }}>JD</span><p className="db-bubble">{d.assistant.question}</p></div>}
                  {answer && <p className="db-bubble" style={{ lineHeight: 1.6, borderColor: 'color-mix(in srgb,var(--acc) 30%,transparent)' }}>{answer.slice(0, shown)}{shown < answer.length && <span style={{ opacity: 0.6 }}>▍</span>}</p>}
                  <form className="db-ask" onSubmit={(e) => { e.preventDefault(); setTyped('') }}>
                    <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={`Ask ${brand || 'the assistant'} anything…`} aria-label="Ask the assistant (demo)" />
                    <button className="db-gen" type="submit">Generate</button>
                  </form>
                </div>
                <div className="db-card">
                  <p className="db-h">{d.listTitle || 'Saved'}</p>
                  <div style={{ marginTop: 6 }}>
                    {(d.items || []).slice(0, 6).map((it, i) => {
                      const active = /active|done|on/i.test(it.status || '')
                      return (
                        <div key={i} className="db-li">
                          <span>{it.title}</span>
                          {it.status && <span className="db-st" style={active ? { color: 'var(--acc)', borderColor: 'color-mix(in srgb,var(--acc) 45%,transparent)' } : { color: '#f5c451', borderColor: 'rgba(245,196,81,.4)' }}>{it.status}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="mut" style={{ textAlign: 'center', fontSize: 13, marginTop: 14 }}>{d.caption || 'Interactive preview with sample data. Your own data appears once you sign up.'}</p>
      </div>
    </div>
  )
}
