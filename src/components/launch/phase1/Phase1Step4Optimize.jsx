import React, { useEffect, useMemo, useState } from 'react'
import {
  Users, MousePointerClick, UserPlus, ShoppingBag, DollarSign, Percent, Radio, RefreshCw, Sparkles, Loader2,
  MessageSquare, Tag, LayoutTemplate, Clapperboard, Undo2, ArrowRight, Check, Plus, Activity, TrendingUp,
  TrendingDown, HeartHandshake, Gauge, Instagram, Youtube, Mail, MessagesSquare, Info,
} from 'lucide-react'
import { updateCoLaunchProject } from '../../../services/opsApi'
import { XLogo } from '../PostVisualMockup'
import { C, P1_SHARED_CSS } from './phase1Constants'
import StepRail from './StepRail'
import { channelStats, channelKeyOf } from '../../../utils/launchMoves'

const S4_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.s4 .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.s4 .card{background:${C.row};border:1px solid ${C.line}}
.s4 .well{background:${C.sheet};border:1px solid ${C.line}}
.s4 .eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.faint}}
.s4 .btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;padding:.55rem .9rem;transition:filter .15s,border-color .15s,color .15s}
.s4 .btn:disabled{opacity:.45;cursor:not-allowed}
.s4 .btn-primary{background:${C.crimson};color:#fff}
.s4 .btn-primary:hover:not(:disabled){filter:brightness(1.1)}
.s4 .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.s4 .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.s4 .chip{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .5rem;font-size:.6875rem;font-weight:600;border:1px solid ${C.line};color:${C.muted};background:${C.sheet}}
.s4 :focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
.s4 th{font-weight:600;text-align:left}
@keyframes s4pulse{0%,100%{opacity:1}50%{opacity:.35}}
.s4 .live{animation:s4pulse 1.8s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.s4 .live{animation:none}}
`

const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`
const pctOf = (a, b) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '—')

const CHANNEL_ICONS = { instagram: Instagram, video: Youtube, x: XLogo, newsletter: Mail, dm: MessagesSquare }

// What each AI experiment changes when applied (the handler writes into these earlier steps)
const EXPERIMENT_KINDS = {
  messaging: { label: 'Messaging', Icon: MessageSquare, changes: 'Step 3 · Announcement post' },
  pricing: { label: 'Pricing', Icon: Tag, changes: 'Step 1 · Plan pricing · Step 2 · Checkout' },
  landing_page: { label: 'Landing page', Icon: LayoutTemplate, changes: 'Step 2 · Live page headline' },
  creator_content: { label: 'Creator content', Icon: Clapperboard, changes: 'Step 3 · Stories & schedule' },
}
const kindOf = (exp) => {
  if (EXPERIMENT_KINDS[exp.category]) return exp.category
  if (exp.targetField === 'pricingTier') return 'pricing'
  if (exp.targetField === 'landingPageHero') return 'landing_page'
  if (exp.targetField === 'storySequence') return 'creator_content'
  return 'messaging'
}

export default function Phase1Step4Optimize(props) {
  const {
    project, reservations = [], presalesRevenue, presaleTarget, totalTraffic, totalSignups, surveyResponses = [],
    campaignKit, experimentsData, isAnalyzingExperiments, handleRunExperimentsAI, handleApplyExperimentVariant,
    handleRevertExperiment, handleAddSimulatedReservation, showNotification, setActiveStep, onSelectStep, onUpdateProject,
    refreshLiveData, lastRefreshedAt, activeFoundingPrice = 49,
  } = props

  // ── Live refresh: the dashboard pulls fresh numbers every 30 seconds ──────────────────
  const [refreshing, setRefreshing] = useState(false)
  const [, tick] = useState(0)
  const doRefresh = async () => {
    if (!refreshLiveData) return
    setRefreshing(true)
    try { await refreshLiveData() } finally { setRefreshing(false) }
  }
  useEffect(() => {
    if (!refreshLiveData) return undefined
    doRefresh()
    const id = setInterval(() => { if (document.visibilityState === 'visible') doRefresh() }, 30000)
    const clock = setInterval(() => tick((n) => n + 1), 5000)
    return () => { clearInterval(id); clearInterval(clock) }
  }, [project?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const agoSec = lastRefreshedAt ? Math.max(0, Math.round((Date.now() - lastRefreshedAt) / 1000)) : null

  // ── Metrics ────────────────────────────────────────────────────────────────────────────
  const visitors = Number(totalTraffic) || 0
  const signups = Number(totalSignups) || 0
  const backers = reservations.length
  const revenue = Number(presalesRevenue) || 0
  const goal = Number(presaleTarget) || 0
  const supporters = surveyResponses.filter((r) => r?.support?.decision === 'yes').length
  const actions = signups + supporters + backers
  const ctr = project?.telemetry?.ctr != null ? Number(project.telemetry.ctr) / 100 : (visitors ? actions / visitors : 0)
  const conv = visitors ? backers / visitors : 0
  const channels = useMemo(() => {
    const stats = channelStats(project || {}, reservations)
    return stats.map((c) => ({
      ...c,
      revenue: reservations.filter((r) => channelKeyOf(r.channel || r.ref || r.source) === c.key).reduce((s, r) => s + (Number(r.amount) || 0), 0),
    }))
  }, [project, reservations])
  const untracked = Math.max(0, visitors - channels.reduce((s, c) => s + c.visits, 0))

  const kpis = [
    { label: 'Traffic', Icon: Users, value: visitors.toLocaleString(), note: 'unique visitors' },
    { label: 'CTR', Icon: MousePointerClick, value: visitors ? `${(ctr * 100).toFixed(1)}%` : '—', note: 'visitors who took an action' },
    { label: 'Sign-ups', Icon: UserPlus, value: (signups + supporters).toLocaleString(), note: `${signups} waitlist · ${supporters} survey pledges` },
    { label: 'Pre-sales', Icon: ShoppingBag, value: backers.toLocaleString(), note: `goal ≈ ${Math.ceil(goal / Math.max(1, activeFoundingPrice))}` },
    { label: 'Revenue', Icon: DollarSign, value: money(revenue), note: goal ? `${Math.round((revenue / goal) * 100)}% of ${money(goal)}` : 'collected', tone: C.ok, ratio: goal ? revenue / goal : 0 },
    { label: 'Conversion', Icon: Percent, value: visitors ? `${(conv * 100).toFixed(1)}%` : '—', note: 'visitor → pre-order (2% is healthy)', tone: visitors ? (conv >= 0.02 ? C.ok : C.warn) : undefined },
  ]

  const funnel = [
    { label: 'Visited the page', n: visitors },
    { label: 'Took an action', n: actions },
    { label: 'Pre-ordered', n: backers },
  ]

  // ── Audience feedback ─────────────────────────────────────────────────────────────────
  const decided = surveyResponses.filter((r) => r?.support?.decision)
  const split = ['yes', 'maybe', 'no'].map((k) => ({ k, n: decided.filter((r) => r.support.decision === k).length }))
  const ratings = surveyResponses.map((r) => Number(r.rating)).filter((n) => n > 0)
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null
  const priceCounts = surveyResponses.reduce((acc, r) => { const p = r?.support?.pricePoint; if (p) acc[p] = (acc[p] || 0) + 1; return acc }, {})
  const topPrice = Object.entries(priceCounts).sort((a, b) => b[1] - a[1])[0]
  const quotes = surveyResponses.flatMap((r) => Object.values(r.answers || {}).filter((a) => String(a || '').trim().length > 20).slice(0, 1).map((a) => ({ name: r.name, text: String(a) }))).slice(0, 3)

  // ── AI analysis ───────────────────────────────────────────────────────────────────────
  const audit = experimentsData?.performanceAudit || project?.metadataInfo?.performanceAudit || null
  const experiments = experimentsData?.experiments || project?.experiments || []
  const analysedAt = experimentsData?.generatedAt || experimentsData?.analyzedAt || null
  const showSimTools = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('simulate') === '1'

  return (
    <div className="s4 p1-themed p1-rise p-5 sm:p-6 space-y-6" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
      <style>{P1_SHARED_CSS + S4_CSS}</style>
      <StepRail current="optimize" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="min-w-0">
          <p className="eyebrow m-0">Step 4 · Run & optimise validation</p>
          <h3 className="serif m-0 mt-1 text-3xl sm:text-4xl leading-tight" style={{ color: C.text }}>How the test is performing</h3>
          <p className="m-0 mt-2 text-sm max-w-2xl" style={{ color: C.muted }}>
            Traffic, sign-ups, pre-sales, revenue, conversion, where visitors come from and what the audience says. AI reads the numbers and prepares experiments that update your earlier steps when applied.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="chip" style={{ color: C.ok, borderColor: C.okLine }}>
            <Radio className="w-3 h-3 live" />Live{agoSec !== null ? ` · updated ${agoSec < 10 ? 'just now' : `${agoSec}s ago`}` : ''}
          </span>
          <button type="button" className="btn btn-quiet" onClick={doRefresh} disabled={refreshing} aria-label="Refresh numbers">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {kpis.map(({ label, Icon, value, note, tone, ratio }) => (
          <div key={label} className="card p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: C.muted }}>{label}</span>
              <Icon className="w-3.5 h-3.5" style={{ color: C.faint }} />
            </div>
            <p className="serif m-0 text-3xl leading-none" style={{ color: tone || C.text }}>{value}</p>
            {ratio !== undefined && (
              <div className="h-1" style={{ background: C.sheet }}><div className="h-full" style={{ width: `${Math.min(1, ratio) * 100}%`, background: C.ok }} /></div>
            )}
            <p className="m-0 text-[11px]" style={{ color: C.faint }}>{note}</p>
          </div>
        ))}
      </section>

      {/* Funnel + attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-4 card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0 flex items-center gap-1.5"><Activity className="w-3 h-3" />Funnel</p>
          <ol className="list-none m-0 p-0 space-y-2">
            {funnel.map((f, i) => {
              const prev = i ? funnel[i - 1].n : null
              return (
                <li key={f.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span style={{ color: C.body }}>{f.label}</span>
                    <span className="font-semibold" style={{ color: C.text }}>{f.n.toLocaleString()}{prev !== null && <span className="ml-1.5 text-xs font-normal" style={{ color: C.faint }}>{pctOf(f.n, prev)}</span>}</span>
                  </div>
                  <div className="h-2 mt-1" style={{ background: C.sheet }}>
                    <div className="h-full" style={{ width: `${visitors ? Math.max(f.n ? 2 : 0, (f.n / visitors) * 100) : 0}%`, background: i === 2 ? C.ok : C.crimson }} />
                  </div>
                </li>
              )
            })}
          </ol>
          {visitors > 0 && (
            <p className="m-0 text-xs" style={{ color: C.muted }}>
              Biggest drop: <strong style={{ color: C.text }}>{actions / visitors < 0.1 ? 'visitors leave without acting' : backers / Math.max(1, actions) < 0.2 ? 'interested people don\'t pay' : 'none, the funnel is healthy'}</strong>.
            </p>
          )}
        </section>

        <section className="lg:col-span-8 card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0">Attribution</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="text-xs" style={{ color: C.faint }}>
                  <th className="py-2 pr-3">Channel</th><th className="py-2 px-3 text-right">Visits</th><th className="py-2 px-3 text-right">Pre-sales</th><th className="py-2 px-3 text-right">Revenue</th><th className="py-2 pl-3 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c, i) => {
                  const Icon = CHANNEL_ICONS[c.key] || Activity
                  const top = i === 0 && (c.visits || c.backers)
                  return (
                    <tr key={c.key} style={{ borderTop: `1px solid ${C.line}` }}>
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2" style={{ color: C.text }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: C.muted }} />{c.label}
                          {top ? <span className="chip" style={{ color: C.ok, borderColor: C.okLine }}>Top</span> : null}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right" style={{ color: C.body }}>{c.visits}</td>
                      <td className="py-2.5 px-3 text-right" style={{ color: C.body }}>{c.backers}</td>
                      <td className="py-2.5 px-3 text-right" style={{ color: c.revenue ? C.ok : C.faint }}>{c.revenue ? money(c.revenue) : '—'}</td>
                      <td className="py-2.5 pl-3 text-right" style={{ color: C.body }}>{pctOf(c.backers, c.visits)}</td>
                    </tr>
                  )
                })}
                {untracked > 0 && (
                  <tr style={{ borderTop: `1px solid ${C.line}` }}>
                    <td className="py-2.5 pr-3" style={{ color: C.muted }}>Direct / untagged</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: C.body }}>{untracked}</td>
                    <td colSpan={3} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-[11px] flex items-center gap-1.5" style={{ color: C.faint }}><Info className="w-3 h-3" />Counted from the ?ref= tag on each Step 3 tracking link.</p>
        </section>
      </div>

      {/* Audience feedback */}
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="eyebrow m-0 flex items-center gap-1.5"><HeartHandshake className="w-3 h-3" />Audience feedback · {surveyResponses.length} {surveyResponses.length === 1 ? 'response' : 'responses'}</p>
          <button type="button" className="btn btn-quiet" onClick={() => { setActiveStep('assets'); onSelectStep?.('assets') }}>Open survey <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
        {surveyResponses.length === 0 ? (
          <p className="well m-0 p-4 text-sm" style={{ color: C.faint }}>No survey answers yet. Share the survey link from Step 2: it tells you why people buy or don't.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="well p-3.5 space-y-2">
              <p className="m-0 text-xs" style={{ color: C.muted }}>Would they support it?</p>
              <div className="flex h-2.5" style={{ background: C.raised }}>
                {split.map(({ k, n }) => decided.length ? <span key={k} style={{ width: `${(n / decided.length) * 100}%`, background: k === 'yes' ? C.ok : k === 'maybe' ? C.warn : '#3f3f46' }} /> : null)}
              </div>
              <p className="m-0 text-xs" style={{ color: C.body }}>{split.map(({ k, n }) => `${k[0].toUpperCase() + k.slice(1)} ${n}`).join(' · ')}</p>
            </div>
            <div className="well p-3.5 space-y-1">
              <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.muted }}><Gauge className="w-3 h-3" />Excitement and price</p>
              <p className="serif m-0 text-3xl leading-none" style={{ color: C.text }}>{avgRating || '—'}<span className="text-base" style={{ color: C.faint }}> / 10</span></p>
              <p className="m-0 text-xs" style={{ color: C.body }}>{topPrice ? `Most say they'd pay ${topPrice[0]} (${topPrice[1]})` : 'No price answers yet'}</p>
            </div>
            <div className="well p-3.5 space-y-2">
              <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.muted }}><MessageSquare className="w-3 h-3" />In their words</p>
              {quotes.length ? quotes.map((q, i) => (
                <p key={i} className="m-0 text-xs leading-relaxed line-clamp-2" style={{ color: C.body }}>“{q.text}” <span style={{ color: C.faint }}>— {q.name?.split(' ')[0] || 'respondent'}</span></p>
              )) : <p className="m-0 text-xs" style={{ color: C.faint }}>No written answers yet.</p>}
            </div>
          </div>
        )}
      </section>

      {/* AI analysis + experiments */}
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}><Sparkles className="w-4 h-4" /></span>
            <div className="min-w-0">
              <p className="eyebrow m-0">AI performance analysis</p>
              <h4 className="serif m-0 mt-0.5 text-2xl leading-tight" style={{ color: C.text }}>{audit?.primaryBottleneck || (experiments.length ? 'Experiments ready' : 'Not analysed yet')}</h4>
              {audit?.summary && <p className="m-0 mt-1 text-sm max-w-3xl" style={{ color: C.body }}>{audit.summary}</p>}
              {analysedAt && <p className="m-0 mt-1 text-[11px]" style={{ color: C.faint }}>Analysed {new Date(analysedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
            </div>
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={handleRunExperimentsAI} disabled={isAnalyzingExperiments}>
            {isAnalyzingExperiments ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analysing…</> : <><Sparkles className="w-3.5 h-3.5" />{experiments.length ? 'Re-analyse' : 'Analyse performance'}</>}
          </button>
        </div>

        {experiments.length === 0 ? (
          <p className="well m-0 p-4 text-sm" style={{ color: C.faint }}>
            AI looks at the numbers above, the survey answers and your current copy, then prepares four experiments: messaging, pricing, landing page and creator content.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {experiments.map((exp, idx) => {
              const kind = EXPERIMENT_KINDS[kindOf(exp)]
              const applied = exp.status === 'applied'
              const up = !String(exp.expectedUplift || '').trim().startsWith('-')
              return (
                <article key={exp.id || idx} className="well p-4 space-y-3" style={applied ? { borderColor: C.okLine } : undefined}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="m-0 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: C.crimsonText }}><kind.Icon className="w-3.5 h-3.5" />{kind.label}</p>
                      <p className="m-0 mt-0.5 text-sm font-semibold" style={{ color: C.text }}>{exp.title || exp.name}</p>
                    </div>
                    {exp.expectedUplift && (
                      <span className="chip shrink-0" style={{ color: up ? C.ok : C.warn, borderColor: up ? C.okLine : C.warnLine }}>
                        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{exp.expectedUplift}
                      </span>
                    )}
                  </div>
                  {exp.hypothesis && <p className="m-0 text-xs leading-relaxed" style={{ color: C.muted }}>{exp.hypothesis}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                      <span className="block font-semibold mb-0.5" style={{ color: C.faint }}>Now</span>
                      <span className="line-clamp-4" style={{ color: C.body }}>{exp.control || exp.variantA || '—'}</span>
                    </div>
                    <div className="p-2.5" style={{ background: C.okSoft, border: `1px solid ${C.okLine}` }}>
                      <span className="block font-semibold mb-0.5" style={{ color: C.ok }}>Test</span>
                      <span className="line-clamp-4" style={{ color: C.text }}>{exp.variant || exp.variantB}</span>
                    </div>
                  </div>
                  <p className="m-0 text-[11px]" style={{ color: C.faint }}>Applying updates: {kind.changes}</p>
                  {applied ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs flex items-center gap-1.5" style={{ color: C.ok }}><Check className="w-3.5 h-3.5" />Live since {exp.appliedAt ? new Date(exp.appliedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'now'}</span>
                      <button type="button" className="btn btn-quiet" onClick={() => handleRevertExperiment?.(exp)}><Undo2 className="w-3.5 h-3.5" />Revert</button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-primary w-full" onClick={() => handleApplyExperimentVariant?.(exp)}>Apply experiment <ArrowRight className="w-3.5 h-3.5" /></button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Pre-orders */}
      <section className="card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow m-0 flex items-center gap-1.5"><ShoppingBag className="w-3 h-3" />Pre-orders · {backers}</p>
          {showSimTools && handleAddSimulatedReservation && (
            <button type="button" className="btn btn-quiet" onClick={handleAddSimulatedReservation}><Plus className="w-3 h-3" />Test pre-order</button>
          )}
        </div>
        {reservations.length === 0 ? (
          <p className="well m-0 p-5 text-center text-sm" style={{ color: C.faint }}>No pre-orders yet. Each paid pre-order appears here as it arrives.</p>
        ) : (
          <ul className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {reservations.map((r, idx) => (
              <li key={r.id || idx} className="well p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-sm font-semibold truncate" style={{ color: C.text }}>{r.customerName || r.name || 'Pre-order'}</p>
                  <p className="m-0 text-[11px] truncate" style={{ color: C.faint }}>{[r.tier || r.passType, r.channel, r.date].filter(Boolean).join(' · ')}</p>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: C.ok }}>{Number(r.amount) > 0 ? money(r.amount) : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Next */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.line}` }}>
        <p className="m-0 text-xs" style={{ color: C.muted }}>The gate uses these exact numbers to recommend build, fix and retest, or stop.</p>
        <button
          type="button"
          className="btn btn-primary px-5 py-2.5"
          onClick={() => {
            const updated = { step4Done: true, phase1Step4Done: true, validationOptimized: true, telemetryReviewed: true }
            onUpdateProject?.((prev) => ({ ...(prev || {}), ...updated }))
            if (project?.id) updateCoLaunchProject(project.id, updated).catch((e) => console.warn(e))
            showNotification?.('Numbers reviewed. On to the gate.')
            setActiveStep('gate')
            onSelectStep?.('gate')
          }}
        >
          Go to the gate <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
