import { useEffect, useMemo, useRef, useState } from 'react'
import { Trophy, Lock, Check, ArrowRight, Flame, Sparkles, Target } from 'lucide-react'
import { C } from './phase1Constants'

// Gamified view of Phase 1 validation. Everything is earned from real numbers (visits, pre-orders,
// revenue, survey answers, experiments) — nothing is awarded for clicking around.

const LEVELS = [
  { at: 0, name: 'Getting started' },
  { at: 60, name: 'First signals' },
  { at: 160, name: 'Traction' },
  { at: 300, name: 'Momentum' },
  { at: 480, name: 'Validated' },
]

export function questMilestones(m) {
  const goalPct = m.goal > 0 ? m.revenue / m.goal : 0
  const list = [
    { id: 'visit', label: 'First visitor', pts: 10, have: m.visitors, need: 1, hint: 'Share your pre-order link once', go: 'campaign' },
    { id: 'signup', label: 'First sign-up', pts: 20, have: m.signups, need: 1, hint: 'Ask your audience to join the list', go: 'campaign' },
    { id: 'preorder', label: 'First pre-order', pts: 40, have: m.backers, need: 1, hint: 'Push the founding price in a story', go: 'campaign' },
    { id: 'visitors50', label: '50 visitors', pts: 30, have: m.visitors, need: 50, hint: 'Post on one more creator channel', go: 'campaign' },
    { id: 'survey5', label: '5 survey answers', pts: 30, have: m.surveys, need: 5, hint: 'Share the survey link with early fans', go: 'assets' },
    { id: 'channels3', label: '3 channels sending visits', pts: 40, have: m.activeChannels, need: 3, hint: 'Use a second and third channel from the campaign', go: 'campaign' },
    { id: 'goal25', label: '25% of the pre-sale goal', pts: 50, have: Math.round(goalPct * 100), need: 25, unit: '%', hint: 'Follow up with sign-ups who did not buy', go: 'campaign' },
    { id: 'conv2', label: '2% visitor → pre-order', pts: 60, have: m.visitors >= 20 ? Math.round(m.conv * 1000) / 10 : 0, need: 2, unit: '%', hint: m.visitors < 20 ? 'Needs 20+ visitors to count' : 'Apply an AI experiment below', go: 'experiments' },
    { id: 'experiment', label: 'An AI experiment applied', pts: 40, have: m.applied, need: 1, hint: 'Run the analysis and apply one variant', go: 'experiments' },
    { id: 'goal50', label: '50% of the pre-sale goal', pts: 70, have: Math.round(goalPct * 100), need: 50, unit: '%', hint: 'Run the next creator post', go: 'campaign' },
    { id: 'goal100', label: 'Pre-sale goal hit', pts: 120, have: Math.round(goalPct * 100), need: 100, unit: '%', hint: 'Last push: a deadline story', go: 'campaign' },
  ]
  return list.map((x) => ({ ...x, done: x.have >= x.need }))
}

export function questLevel(milestones, levels = LEVELS) {
  const xp = milestones.filter((x) => x.done).reduce((s, x) => s + x.pts, 0)
  const idx = levels.reduce((i, l, n) => (xp >= l.at ? n : i), 0)
  const cur = levels[idx], next = levels[idx + 1]
  return { xp, level: idx + 1, name: cur.name, next, toNext: next ? next.at - xp : 0, ratio: next ? (xp - cur.at) / (next.at - cur.at) : 1, max: levels.length }
}

// Mark milestones done from have/need.
export const withDone = (list) => list.map((x) => ({ ...x, done: x.have >= x.need }))

const CSS = `
.vq .card{background:${C.row};border:1px solid ${C.line}}
.vq .well{background:${C.sheet};border:1px solid ${C.line}}
.vq .eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.faint}}
.vq .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.vq .btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;padding:.55rem .9rem}
.vq .btn-primary{background:${C.crimson};color:#fff}
.vq .btn-primary:hover{filter:brightness(1.1)}
.vq .chip{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .5rem;font-size:.6875rem;font-weight:600;border:1px solid ${C.line};background:${C.sheet}}
.vq-burst{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.vq-burst i{position:absolute;top:50%;left:50%;width:6px;height:10px;opacity:0;animation:vqb 1.4s ease-out forwards}
@keyframes vqb{0%{opacity:1;transform:translate(-50%,-50%) rotate(0)}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) rotate(var(--r))}}
.vq-pop{animation:vqp .5s cubic-bezier(.2,1.4,.4,1)}
@keyframes vqp{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
.vq-bar{transition:width 1s cubic-bezier(.2,.8,.2,1)}
.vq-next{animation:vqn 1.8s ease-in-out infinite}
@keyframes vqn{0%,100%{box-shadow:0 0 0 0 rgba(200,30,60,.55)}50%{box-shadow:0 0 0 7px rgba(200,30,60,0)}}
@media (prefers-reduced-motion:reduce){.vq-burst{display:none}.vq-pop{animation:none}.vq-bar{transition:none}.vq-next{animation:none}}
`

function Burst() {
  const bits = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    x: `${Math.round((Math.random() - 0.5) * 520)}px`, y: `${Math.round((Math.random() - 0.7) * 260)}px`, r: `${Math.round(Math.random() * 540)}deg`,
    c: [C.crimson, '#f5c451', '#fff', C.ok][i % 4], d: `${(Math.random() * 0.25).toFixed(2)}s`,
  })), [])
  return <div className="vq-burst" aria-hidden="true">{bits.map((b, i) => <i key={i} style={{ '--x': b.x, '--y': b.y, '--r': b.r, background: b.c, animationDelay: b.d }} />)}</div>
}

/**
 * metrics: { visitors, signups, backers, revenue, goal, conv, surveys, activeChannels, applied, recent7 }
 * channels: [{ key, label, visits, backers }]
 */
export default function ValidationQuest({ projectId, metrics = {}, channels = [], onGo, compact = false, title = 'Validation quest', storeKey = 'p1quest', milestones, levels, streak }) {
  const ms = milestones || questMilestones(metrics)
  const lv = questLevel(ms, levels || LEVELS)
  const earned = ms.filter((x) => x.done)
  const next = ms.find((x) => !x.done)

  // Celebrate milestones earned since this browser last looked.
  const key = `${storeKey}:${projectId || 'x'}`
  const [fresh, setFresh] = useState([])
  useEffect(() => {
    if (compact || !projectId) return
    let seen = null
    try { seen = JSON.parse(localStorage.getItem(key) || 'null') } catch { seen = null }
    const ids = earned.map((x) => x.id)
    if (Array.isArray(seen)) {
      const nw = ids.filter((id) => !seen.includes(id))
      if (nw.length) setFresh(nw)
    }
    try { localStorage.setItem(key, JSON.stringify(ids)) } catch { /* private mode */ }
  }, [projectId, earned.map((x) => x.id).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  if (compact) {
    return (
      <div className="vq flex items-center gap-3 p-3" style={{ background: C.row, border: `1px solid ${C.line}` }}>
        <span className="w-9 h-9 shrink-0 flex items-center justify-center font-black text-sm" style={{ background: C.crimson, color: '#fff' }}>L{lv.level}</span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{lv.name} · {earned.length} of {ms.length} milestones</p>
          <div className="h-1 mt-1.5" style={{ background: C.sheet }}><div className="h-full vq-bar" style={{ width: `${(earned.length / ms.length) * 100}%`, background: C.crimson }} /></div>
        </div>
        <style>{CSS}</style>
      </div>
    )
  }

  const race = [...channels].filter((c) => c.visits || c.backers).sort((a, b) => (b.backers - a.backers) || (b.visits - a.visits)).slice(0, 4)
  const lead = race[0]
  const freshItems = ms.filter((x) => fresh.includes(x.id))

  return (
    <section className="vq card p-4 sm:p-6 space-y-5 relative overflow-hidden" aria-label={title}
      style={{ background: `radial-gradient(120% 140% at 0% 0%, rgba(200,30,60,.12), transparent 55%), ${C.row}` }}>
      <style>{CSS}</style>
      {freshItems.length > 0 && <Burst key={fresh.join()} />}

      {/* Header: level ring + title + XP */}
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <LevelRing level={lv.level} ratio={lv.ratio} max={lv.max} />
          <div className="min-w-0">
            <p className="eyebrow m-0 flex items-center gap-1.5"><Trophy className="w-3 h-3" style={{ color: '#f5c451' }} />{title}</p>
            <h4 className="serif m-0 mt-0.5 text-3xl leading-tight" style={{ color: C.text }}>{lv.name}</h4>
            <p className="m-0 mt-0.5 text-xs" style={{ color: C.muted }}>
              <b style={{ color: '#f5c451' }}>{lv.xp} XP</b> · {earned.length} of {ms.length} milestones{lv.next ? ` · ${lv.toNext} XP to ${lv.next.name}` : ' · top level reached'}
            </p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-2 md:justify-end">
          {(streak || (metrics.recent7 > 0 ? `${metrics.recent7} pre-order${metrics.recent7 === 1 ? '' : 's'} this week` : '')) && (
            <span className="chip" style={{ color: '#f5c451', borderColor: 'rgba(245,196,81,.4)' }}><Flame className="w-3 h-3" />{streak || `${metrics.recent7} pre-order${metrics.recent7 === 1 ? '' : 's'} this week`}</span>
          )}
          <span className="chip" style={{ color: C.muted }}>{Math.round((earned.length / ms.length) * 100)}% complete</span>
        </div>
      </div>

      {freshItems.length > 0 && (
        <div className="vq-pop p-3 flex items-center gap-2" style={{ background: 'rgba(245,196,81,.08)', border: '1px solid rgba(245,196,81,.35)' }} role="status">
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#f5c451' }} />
          <p className="m-0 text-sm" style={{ color: C.text }}>
            Unlocked since your last visit: <b>{freshItems.map((x) => x.label).join(', ')}</b> (+{freshItems.reduce((s, x) => s + x.pts, 0)} XP)
          </p>
        </div>
      )}

      {/* Milestone trail */}
      <Trail ms={ms} next={next} />

      {/* Current mission */}
      {next && (
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: C.sheet, border: `1px solid ${C.crimsonLine || C.line}`, boxShadow: 'inset 3px 0 0 ' + C.crimson }}>
          <span className="w-11 h-11 shrink-0 flex items-center justify-center" style={{ background: 'rgba(200,30,60,.14)', color: C.crimson }}><Target className="w-5 h-5" /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: C.faint }}>Current mission</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5" style={{ color: '#f5c451', border: '1px solid rgba(245,196,81,.4)' }}>Reward +{next.pts} XP</span>
            </div>
            <p className="m-0 mt-1 text-base font-semibold" style={{ color: C.text }}>{next.label}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 flex-1" style={{ background: C.raised }}><div className="h-full vq-bar" style={{ width: `${Math.max(2, Math.min(1, next.have / next.need) * 100)}%`, background: `linear-gradient(90deg, ${C.crimson}, #f5c451)` }} /></div>
              <span className="text-xs tabular-nums font-semibold" style={{ color: C.text }}>{next.have}{next.unit || ''} / {next.need}{next.unit || ''}</span>
            </div>
            <p className="m-0 mt-1.5 text-xs" style={{ color: C.muted }}>{next.hint}</p>
          </div>
          {onGo && next.go && <button type="button" className="btn btn-primary shrink-0" onClick={() => onGo(next.go)}>Do it <ArrowRight className="w-3.5 h-3.5" /></button>}
        </div>
      )}

      {race.length > 1 && (
        <div className="space-y-2">
          <p className="eyebrow m-0">Channel race{lead ? ` · ${lead.label} leads` : ''}</p>
          {race.map((c, i) => {
            const top = Math.max(1, race[0].backers * 10 + race[0].visits)
            const score = c.backers * 10 + c.visits
            return (
              <div key={c.key} className="flex items-center gap-2 text-xs">
                <span className="w-6 h-6 flex items-center justify-center font-black" style={i === 0 ? { background: '#f5c451', color: '#1a1205' } : { background: C.raised, color: C.muted }}>{i + 1}</span>
                <span className="w-32 truncate" style={{ color: C.text }}>{c.label}</span>
                <div className="flex-1 h-2" style={{ background: C.sheet }}><div className="h-full vq-bar" style={{ width: `${(score / top) * 100}%`, background: i === 0 ? '#f5c451' : C.crimson }} /></div>
                <span className="w-36 text-right tabular-nums" style={{ color: C.muted }}>{c.backers} pre-order{c.backers === 1 ? '' : 's'} · {c.visits} visits</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function LevelRing({ level, ratio, max }) {
  const R = 33, Cc = 2 * Math.PI * R
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), 60); return () => clearTimeout(t) }, [])
  return (
    <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
        <defs><linearGradient id="vqring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.crimson} /><stop offset="1" stopColor="#f5c451" /></linearGradient></defs>
        <circle cx="42" cy="42" r={R} fill="none" stroke={C.raised} strokeWidth="7" />
        <circle cx="42" cy="42" r={R} fill="none" stroke="url(#vqring)" strokeWidth="7" strokeLinecap="butt"
          strokeDasharray={`${on ? Math.max(0.02, ratio) * Cc : 0} ${Cc}`} transform="rotate(-90 42 42)" style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.faint }}>Level</span>
        <span className="text-3xl font-black leading-none" style={{ color: C.text }}>{level}</span>
        <span className="text-[9px] font-semibold" style={{ color: C.faint }}>of {max}</span>
      </div>
    </div>
  )
}

function Trail({ ms, next }) {
  const box = useRef(null)
  useEffect(() => {
    const el = box.current, cur = el?.querySelector('[data-next="true"]')
    if (el && cur) el.scrollLeft = Math.max(0, cur.offsetLeft - el.clientWidth / 2 + cur.clientWidth / 2)
  }, [next?.id])
  return (
    <div ref={box} className="overflow-x-auto pb-2 -mx-1" style={{ scrollbarWidth: 'thin' }}>
      <ol className="list-none m-0 p-0 flex items-start min-w-max px-1">
        {ms.map((x, i) => {
          const isNext = next && x.id === next.id
          const prevDone = i > 0 && ms[i - 1].done
          return (
            <li key={x.id} data-next={isNext ? 'true' : undefined} className="relative flex flex-col items-center text-center" style={{ width: 104 }} title={x.done ? 'Earned' : x.hint}>
              {i > 0 && <span className="absolute" style={{ top: 18, right: '50%', width: '100%', height: 3, background: prevDone && x.done ? '#f5c451' : prevDone ? `linear-gradient(90deg, #f5c451, ${C.crimson})` : C.line }} />}
              <span className={`relative z-10 w-9 h-9 flex items-center justify-center ${isNext ? 'vq-next' : ''}`}
                style={x.done ? { background: '#f5c451', color: '#1a1205', boxShadow: '0 0 18px rgba(245,196,81,.45)' }
                  : isNext ? { background: C.sheet, color: C.crimson, border: `2px solid ${C.crimson}` }
                    : { background: C.sheet, color: C.faint, border: `1px solid ${C.line}` }}>
                {x.done ? <Check className="w-4 h-4 clp-icon-svg" stroke="#000" strokeWidth={3} style={{ color: "#000", stroke: "#000" }} /> : isNext ? <Target className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
              </span>
              <span className="mt-2 text-[11px] font-semibold leading-tight px-1" style={{ color: x.done ? C.text : isNext ? C.text : C.faint, minHeight: 28 }}>{x.label}</span>
              <span className="text-[10px] font-bold mt-0.5" style={{ color: x.done ? '#f5c451' : isNext ? C.crimson : C.faint }}>+{x.pts} XP</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
