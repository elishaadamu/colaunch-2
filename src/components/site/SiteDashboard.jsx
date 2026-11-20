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

function AreaChart({ title, seed = 11 }) {
  const [series, setSeries] = useState(() => makeSeries(30, seed))
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
.db{--panel:#0f1218;--panel2:#141821;--ln:rgba(255,255,255,.08);color:#e9edf3;font-family:var(--body);background:var(--bg)}
.db *{box-sizing:border-box}.db p{margin:0}
.db-app{display:grid;grid-template-columns:248px 1fr;min-height:calc(100vh - 69px)}
.db-side{border-right:1px solid var(--ln);padding:22px 14px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;align-self:start;min-height:calc(100vh - 69px)}
.db-lab{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7d8594;padding:14px 10px 6px}
.db-nav{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;font-size:14px;color:#aeb5c2;background:transparent;border:0;cursor:pointer;text-align:left;width:100%;line-height:1.3}
.db-nav[aria-current="true"]{background:var(--acc-soft);color:#fff;font-weight:600;box-shadow:inset 3px 0 0 var(--acc)}
.db-nav:hover:not([aria-current="true"]){background:rgba(255,255,255,.04);color:#fff}
.db-ic{width:8px;height:8px;border-radius:2px;background:currentColor;opacity:.55;flex-shrink:0}
.db-nav[aria-current="true"] .db-ic{background:var(--acc);opacity:1}
.db-plan{margin-top:auto;border:1px solid color-mix(in srgb,var(--acc) 30%,transparent);background:var(--acc-soft);border-radius:10px;padding:14px}
.db-main{padding:26px 32px 48px;display:grid;gap:16px;min-width:0;align-content:start}
.db-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.db-title{font-family:var(--head);font-weight:var(--hw);font-size:clamp(24px,3cqi,32px);letter-spacing:-.02em;line-height:1.1}
.db-prompt{display:flex;gap:8px;align-items:center;background:var(--panel);border:1px solid color-mix(in srgb,var(--acc) 30%,transparent);border-radius:10px;padding:8px}
.db-prompt input{flex:1;background:transparent;border:0;outline:0;color:#e9edf3;font-size:14px;padding:6px 8px;min-width:0}
.db-kpis{display:grid;grid-template-columns:repeat(var(--n,4),1fr);gap:12px}
.db-grid2{display:grid;grid-template-columns:1.7fr 1fr;gap:16px}
.db-card{background:var(--panel);border:1px solid var(--ln);border-radius:10px;padding:16px;min-width:0}
.db-row{display:flex;align-items:center;gap:8px}
.db-h{font-weight:700;font-size:15px}.db-sm{font-size:12px}.db-mut{color:#8b93a1}
.db-big{white-space:nowrap;font-size:26px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.db-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);color:var(--acc);white-space:nowrap}
.db-dot{width:6px;height:6px;border-radius:99px;background:var(--acc);animation:dbp 1.6s ease-in-out infinite}
@keyframes dbp{50%{opacity:.25}}
.db-tip{position:absolute;top:44px;background:#151a24;border:1px solid var(--ln);border-radius:8px;padding:6px 10px;pointer-events:none;transition:left .25s ease;white-space:nowrap}
.db-bubble{background:var(--panel2);border:1px solid var(--ln);border-radius:10px;padding:10px 12px;font-size:14px}
.db-li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 2px;border-bottom:1px solid var(--ln);font-size:14px}
.db-li:last-child{border-bottom:0}
.db-st{font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid;white-space:nowrap}
.db-av{width:30px;height:30px;border-radius:99px;background:var(--acc);color:var(--acc-ink);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.db-gen{background:var(--acc);color:var(--acc-ink);border:0;border-radius:8px;padding:9px 16px;font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap}
.db-fade{animation:dbf .35s ease}
@keyframes dbf{from{opacity:0;transform:translateY(6px)}}
.db-tabs{display:none}
@container (max-width:900px){
 .db-app{grid-template-columns:1fr}.db-side{display:none}.db-main{padding:18px 16px 40px}
 .db-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}
 .db-tabs .db-nav{width:auto;white-space:nowrap;border:1px solid var(--ln)}
 .db-kpis{grid-template-columns:repeat(2,1fr)!important}.db-grid2{grid-template-columns:1fr}
}
`

function plansFrom(d) {
  if (Array.isArray(d.plans) && d.plans.length) return d.plans
  return String(d.pricing || '').split(/[·|,]/).map((x) => x.trim()).filter(Boolean)
}

function Assistant({ a, brand, editing }) {
  const answer = String(a?.answer || '')
  const [shown, setShown] = useState(reduced() ? 999 : 0)
  useEffect(() => {
    if (reduced() || editing) { setShown(999); return }
    setShown(0)
    const t = setInterval(() => setShown((n) => (n >= answer.length ? n : n + 3)), 18)
    return () => clearInterval(t)
  }, [answer, editing])
  if (!a?.question && !answer) return null
  return (
    <div className="db-card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
      <p className="db-h">{a.title || `${brand} assistant`}</p>
      {a.question && <div className="db-row" style={{ alignItems: 'flex-start' }}><span className="db-av" style={{ width: 26, height: 26, fontSize: 10 }}>You</span><p className="db-bubble">{a.question}</p></div>}
      {answer && <p className="db-bubble" style={{ lineHeight: 1.6, borderColor: 'color-mix(in srgb,var(--acc) 30%,transparent)' }}>{answer.slice(0, shown)}{shown < answer.length && <span style={{ opacity: 0.6 }}>▍</span>}</p>}
    </div>
  )
}

function List({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="db-card">
      <p className="db-h">{title || 'Saved'}</p>
      <div style={{ marginTop: 6 }}>
        {items.slice(0, 6).map((it, i) => {
          const active = /active|done|on|ready/i.test(it.status || '')
          return (
            <div key={i} className="db-li">
              <span>{it.title}</span>
              {it.status && <span className="db-st" style={active ? { color: 'var(--acc)', borderColor: 'color-mix(in srgb,var(--acc) 45%,transparent)' } : { color: '#f5c451', borderColor: 'rgba(245,196,81,.4)' }}>{it.status}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// The product's app, as a full page: Overview plus one view per Phase 1 feature.
export default function SiteDashboard({ d, site, editing }) {
  const brand = site?.sections?.find((s) => s.type === 'nav')?.data?.brand || ''
  const features = (Array.isArray(d.features) && d.features.length ? d.features : (d.nav || []).map((t) => ({ title: t, text: '' }))).slice(0, 6)
  const views = d.views || {}
  const [cur, setCur] = useState(-1) // -1 = overview, else feature index
  const [typed, setTyped] = useState('')
  const plans = plansFrom(d)
  const f = cur >= 0 ? features[cur] : null
  const v = f ? (views[f.title] || {}) : null

  const tabs = [{ t: 'Overview', i: -1 }, ...features.map((x, i) => ({ t: x.title, i }))]
  const navBtn = (x) => (
    <button key={x.i} type="button" className="db-nav" aria-current={cur === x.i} onClick={() => setCur(x.i)}>
      <span className="db-ic" />{x.t}
    </button>
  )

  return (
    <div className="db"><style>{CSS}</style>
      <div className="db-app">
        <aside className="db-side" aria-label={`${brand} navigation`}>
          {navBtn(tabs[0])}
          {features.length > 0 && <p className="db-lab">Features</p>}
          {tabs.slice(1).map(navBtn)}
          <div className="db-plan" style={{ marginTop: 24 }}>
            <p className="db-sm db-mut">Your plan</p>
            <p style={{ fontWeight: 700, marginTop: 4 }}>{plans[0] || 'Starter'}</p>
            {plans[1] && <p className="db-sm" style={{ marginTop: 6, color: 'var(--acc)', fontWeight: 600 }}>Upgrade: {plans[1]}</p>}
            {d.creator && <p className="db-sm db-mut" style={{ marginTop: 10 }}>Made with {d.creator}</p>}
          </div>
        </aside>

        <main className="db-main">
          <div className="db-tabs" role="tablist">{tabs.map(navBtn)}</div>

          <div className="db-head">
            <div>
              <p className="db-sm db-mut">{f ? 'Feature' : (d.greeting || 'Overview')}</p>
              <h1 className="db-title" style={{ marginTop: 4 }}>{f ? f.title : (d.title || `Welcome back`)}</h1>
              {(f ? f.text : d.customer) && <p className="db-mut" style={{ marginTop: 6, maxWidth: 640 }}>{f ? f.text : `Built for ${String(d.customer).charAt(0).toLowerCase()}${String(d.customer).slice(1)}.`}</p>}
            </div>
            <span className="db-pill"><span className="db-dot" />Sample data</span>
          </div>

          <form className="db-prompt" onSubmit={(e) => { e.preventDefault(); setTyped('') }}>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={d.prompt || `Ask ${brand || 'the assistant'} anything…`} aria-label="Ask the assistant (preview)" />
            <button className="db-gen" type="submit">Generate</button>
          </form>

          {!f ? (
            <div key="ov" className="db-fade" style={{ display: 'grid', gap: 16 }}>
              <div className="db-kpis">{(d.kpis || []).slice(0, 4).map((k, i) => <Kpi key={i} k={k} i={i} />)}</div>
              <div className="db-grid2">
                <AreaChart title={d.chartTitle} />
                <Donut title={d.donutTitle} segments={d.segments} />
              </div>
              <div className="db-grid2">
                <Assistant a={d.assistant} brand={brand} editing={editing} />
                <List title={d.listTitle} items={d.items} />
              </div>
            </div>
          ) : (
            <div key={cur} className="db-fade" style={{ display: 'grid', gap: 16 }}>
              <div className="db-kpis" style={{ '--n': Math.max(1, Math.min(4, (v.kpis || []).length)) }}>{(v.kpis || []).slice(0, 4).map((k, i) => <Kpi key={`${cur}-${i}`} k={k} i={i + cur + 1} />)}</div>
              <div className="db-grid2">
                <AreaChart key={`c${cur}`} seed={23 + cur * 7} title={v.chartTitle || `${f.title}, last 30 days`} />
                <List title={v.listTitle || 'Recent'} items={v.items} />
              </div>
              <Assistant a={v.assistant} brand={brand} editing={editing} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
