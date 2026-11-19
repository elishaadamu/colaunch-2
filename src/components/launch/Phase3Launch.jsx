import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Rocket, Activity, Bot, FileBarChart, Sparkles, Loader2, Check, X, AlertTriangle, CheckCircle2, XCircle, ExternalLink,
  Copy, Send, Calendar, Megaphone, ListChecks, Server, CreditCard, Mail, BarChart3, Link2, Bug, LifeBuoy, Users, DollarSign,
  Percent, MousePointerClick, UserCheck, ShoppingBag, RefreshCw, Pause, Wrench, Instagram, Youtube, MessageSquare, TrendingUp,
  TrendingDown, Minus, Archive, Scale, ShieldAlert, ClipboardList, ArrowRight, Radio, Code2,
} from 'lucide-react'
import {
  updateCoLaunchProject, updateValidationCampaign, toggleAutonomousCampaignDelivery, sendCampaignPostEmail,
  getLaunchState, saveLaunchConfig, goLive, pauseLaunch, getLaunchMetrics, postLaunchDecision, listLaunchDecisions,
} from '../../services/opsApi'
import { streamSSE } from '../../services/opsApi'
import { XLogo } from './PostVisualMockup'
import { C, P1_SHARED_CSS } from './phase1/phase1Constants'
import { PUBLIC_APP_URL } from '../../utils/publicUrl'
import { buildLaunchEvidence, addCreatorTasks } from '../../utils/launchOps'
import { detectSignals, evaluateLaunchDecision, CHANNEL_LABEL } from '../../utils/launchSignals'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.p3 .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.p3 .card{background:${C.row};border:1px solid ${C.line}}
.p3 .well{background:${C.sheet};border:1px solid ${C.line}}
.p3 .eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.faint}}
.p3 .btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;padding:.55rem .9rem}
.p3 .btn:disabled{opacity:.45;cursor:not-allowed}
.p3 .btn-primary{background:${C.crimson};color:#fff}
.p3 .btn-primary:hover:not(:disabled){filter:brightness(1.1)}
.p3 .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.p3 .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.p3 .in{width:100%;background:${C.sheet};border:1px solid ${C.line};color:${C.text};padding:.55rem .75rem;font-size:.875rem;outline:none}
.p3 .in:focus{border-color:${C.crimsonLine}}
.p3 textarea.in{resize:vertical;line-height:1.5}
.p3 .lbl{display:block;font-size:.75rem;font-weight:600;color:${C.body};margin-bottom:.35rem}
.p3 .tab{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem .95rem;font-size:.8125rem;font-weight:600;color:${C.muted};border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap}
.p3 .tab[aria-selected="true"]{color:${C.text};border-color:${C.crimson}}
.p3 .on-accent,.p3 .on-accent *{color:#050506!important}
.p3 :focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
@keyframes p3pulse{0%,100%{opacity:1}50%{opacity:.35}}
.p3 .live{animation:p3pulse 1.8s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.p3 .live{animation:none}}
`
const STEPS = [
  { id: 'prep', label: '1. Prepare launch', Icon: ClipboardList },
  { id: 'monitor', label: '2. Launch + monitor', Icon: Activity },
  { id: 'manager', label: '3. AI launch manager', Icon: Bot },
  { id: 'report', label: '4. Report + decision', Icon: FileBarChart },
]
const CH_ICON = { instagram: Instagram, video: Youtube, x: XLogo, newsletter: Mail, dm: MessageSquare, direct: Link2 }
const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`
const BACKEND = (import.meta.env.VITE_BACKEND_URL || 'https://creator-forge-backend-jj1y.onrender.com').replace(/\/$/, '')
const STATUS_ICON = { pass: [CheckCircle2, C.ok], warn: [AlertTriangle, C.warn], fail: [XCircle, C.crimsonText] }

const WORK_LABEL = {
  step: 'Analysing', summary: 'Summarising', launchDate: 'Choosing the date', channel: 'Choosing channels', offer: 'Setting the offer',
  message: 'Writing the messaging', post: 'Writing post', task: 'Building the checklists', faq: 'Answering FAQs', welcome: 'Writing the welcome email',
  read: 'Reading the numbers', rec: 'Recommending', draft: 'Drafting', learning: 'Drawing lessons', creator: 'Reviewing creator posts',
  usage: 'Reviewing usage', theme: 'Grouping feedback', next: 'Choosing the next move',
}

function useAiStream() {
  const [run, setRun] = useState(null)
  const [, tick] = useState(0)
  const abortRef = useRef(null)
  useEffect(() => {
    if (!run) return undefined
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [run])
  const start = async (path, body) => {
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setRun({ text: '', model: null, startedAt: Date.now() })
    let result = null
    let error = null
    try {
      await streamSSE(path, body, (event, data) => {
        if (event === 'model') setRun((r) => r && { ...r, model: data.model })
        if (event === 'delta') setRun((r) => r && { ...r, text: r.text + data.t })
        if (event === 'done') { if (data?.error) error = data.error; else result = data }
        if (event === 'error') error = data?.message || 'The AI request failed.'
      }, ctrl.signal)
    } catch (e) { error = e.name === 'AbortError' ? 'Stopped.' : e.message } finally { setRun(null); abortRef.current = null }
    if (error) throw new Error(error)
    return result
  }
  return { run, start, stop: () => abortRef.current?.abort() }
}

function AiWorkLog({ run, onStop, title }) {
  if (!run) return null
  const text = run.text || ''
  const steps = [...text.matchAll(/<step>([\s\S]*?)<\/step>/g)].map((m) => m[1].trim())
  const opens = [...text.matchAll(/<(\w+)((?:\s+\w+="[^"]*")*)\s*>/g)]
  const last = opens[opens.length - 1]
  const lastTag = last?.[1]
  const lastTitle = last ? ((last[2].match(/title="([^"]*)"/) || [])[1] || '') : ''
  const isOpen = last && text.lastIndexOf(`</${lastTag}>`) < last.index
  const counts = ['post', 'rec', 'task', 'faq', 'learning'].map((t) => [t, (text.match(new RegExp(`</${t}>`, 'g')) || []).length]).filter(([, n]) => n)
  const elapsed = Math.round((Date.now() - run.startedAt) / 1000)
  return (
    <div className="p-4 space-y-2.5" style={{ background: C.sheet, border: `1px solid ${C.crimsonLine}` }} role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-sm" style={{ color: C.crimsonText }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="font-semibold">{title}</span>
        <span className="ml-auto text-xs" style={{ color: C.faint }}>{elapsed}s{run.model ? ` · ${run.model}` : ''}</span>
      </div>
      {!text && <p className="m-0 text-xs" style={{ color: C.muted }}>Thinking it through before writing…</p>}
      {steps.length > 0 && (
        <ul className="list-none m-0 p-0 space-y-1">
          {steps.map((st, i) => <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: C.body }}><Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: C.ok }} />{st}</li>)}
        </ul>
      )}
      {isOpen && lastTag !== 'step' && (
        <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.text }}>
          <span className="w-1.5 h-1.5 live" style={{ background: C.crimson }} />{WORK_LABEL[lastTag] || 'Writing'}{lastTitle ? `: ${lastTitle}` : ''}
        </p>
      )}
      {counts.length > 0 && <p className="m-0 text-[11px]" style={{ color: C.faint }}>{counts.map(([t, n]) => `${n} ${t === 'rec' ? 'recommendations' : t + 's'}`).join(' · ')} written</p>}
      <button type="button" className="btn btn-quiet" onClick={onStop}><X className="w-3.5 h-3.5" />Stop</button>
    </div>
  )
}

export default function Phase3Launch({ project, onUpdateProject, activeStepId, onSelectStep }) {
  const pid = project?.id
  const [step, setStep] = useState(() => (['prep', 'monitor', 'manager', 'report'].includes(activeStepId) ? activeStepId : (project?.launchStatus === 'LIVE' ? 'monitor' : 'prep')))
  useEffect(() => { if (['prep', 'monitor', 'manager', 'report'].includes(activeStepId)) setStep(activeStepId) }, [activeStepId])
  const go = (id) => { setStep(id); onSelectStep?.(id); if (pid) updateCoLaunchProject(pid, { currentStep: id }).catch(() => {}) }

  const [toast, setToast] = useState('')
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 4500) }
  const save = async (patch) => {
    onUpdateProject?.((prev) => ({ ...(prev || {}), ...patch }))
    if (pid) await updateCoLaunchProject(pid, patch).catch((e) => console.warn('[Phase3] save', e))
  }

  // ── Server state: config, readiness, live metrics ───────────────────────────────────────
  const [state, setState] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [refreshedAt, setRefreshedAt] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const refresh = async () => {
    if (!pid) return
    setRefreshing(true)
    try {
      const [s, m] = await Promise.all([getLaunchState(pid), getLaunchMetrics(pid)])
      setState(s); setMetrics(m); setRefreshedAt(Date.now())
    } catch (e) { console.warn('[Phase3] refresh', e) } finally { setRefreshing(false) }
  }
  useEffect(() => {
    refresh()
    const id = setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 60000)
    return () => clearInterval(id)
  }, [pid]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLive = (state?.launchStatus || project?.launchStatus) === 'LIVE'
  const slug = state?.slug || (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const kit = project?.campaignKit || {}
  const plan = project?.launchPlan || null
  const actions = project?.launchActions || []

  return (
    <div className="p3 p1-themed p1-rise p-5 sm:p-6 space-y-6" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
      <style>{P1_SHARED_CSS + CSS}</style>
      {toast && <div role="status" className="fixed bottom-5 right-5 z-[9999] px-4 py-3 text-sm max-w-sm" style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, color: C.text }}>{toast}</div>}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="eyebrow m-0">Phase 3 · Launch</p>
          <h2 className="serif m-0 mt-1 text-3xl sm:text-4xl leading-tight" style={{ color: C.text }}>Turn the MVP into a business</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold" style={isLive ? { background: C.okSoft, border: `1px solid ${C.okLine}`, color: C.ok } : { background: C.sheet, border: `1px solid ${C.line}`, color: C.muted }}>
            <Radio className={`w-3 h-3 ${isLive ? 'live' : ''}`} />{isLive ? 'Live' : (state?.launchStatus === 'PAUSED' ? 'Paused' : state?.launchStatus === 'CLOSED' ? 'Closed' : 'Not launched')}
          </span>
          <button type="button" className="btn btn-quiet" onClick={refresh} disabled={refreshing} aria-label="Refresh"><RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <div role="tablist" className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${C.line}` }}>
        {STEPS.map(({ id, label, Icon }) => (
          <button key={id} role="tab" aria-selected={step === id} type="button" className="tab" onClick={() => go(id)}><Icon className="w-3.5 h-3.5" />{label}</button>
        ))}
      </div>

      {step === 'prep' && <PrepareStep {...{ project, pid, state, refresh, plan, kit, save, say, slug, go }} />}
      {step === 'monitor' && <MonitorStep {...{ project, pid, state, metrics, refresh, refreshedAt, isLive, slug, save, say, go }} />}
      {step === 'manager' && <ManagerStep {...{ project, pid, state, metrics, isLive, kit, actions, save, say, slug }} />}
      {step === 'report' && <ReportStep {...{ project, pid, metrics, plan, actions, save, say, go }} />}
    </div>
  )
}

/* ─── Step 1: Prepare launch ─────────────────────────────────────────────────────────── */
function PrepareStep({ project, pid, state, refresh, plan, kit, save, say, slug, go }) {
  const cfg = state?.config || {}
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [draft, setDraft] = useState(null)
  const [savingCfg, setSavingCfg] = useState(false)
  const [queuing, setQueuing] = useState(false)
  const [openPost, setOpenPost] = useState(null)
  useEffect(() => {
    if (state) setDraft({
      mode: cfg.mode || 'hosted', productionUrl: cfg.productionUrl || '', price: cfg.price ?? '', priceLabel: cfg.priceLabel || '',
      supportEmail: cfg.supportEmail || '', faqs: cfg.faqs || plan?.faqs || [], onboarding: cfg.onboarding || plan?.onboarding || { subject: '', body: '', firstStep: '' },
      launchDate: cfg.launchDate || plan?.launchDate || '',
    })
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const ai = useAiStream()
  const generate = async () => {
    setGenerating(true); setGenError('')
    try {
      const evidence = buildLaunchEvidence(project, { config: cfg, publicUrl: PUBLIC_APP_URL, slug })
      const out = await ai.start(`/launch-ai/${pid}/plan`, { evidence })
      const res = out?.plan
      if (!res) throw new Error('The plan came back empty. Try again.')
      const next = { ...res, generatedAt: new Date().toISOString() }
      await save({ launchPlan: next, launchStrategy: { creatorChecklist: next.creatorChecklist, opsChecklist: next.opsChecklist } })
      // FAQs, onboarding and date feed the product readiness checks
      await saveLaunchConfig(pid, { faqs: cfg.faqs?.length ? cfg.faqs : res.faqs, onboarding: cfg.onboarding?.subject ? cfg.onboarding : res.onboarding, launchDate: cfg.launchDate || res.launchDate })
      await refresh()
      say('Launch plan written from your validation and beta evidence.')
    } catch (e) { setGenError(e.message || 'Could not generate the plan.') } finally { setGenerating(false) }
  }

  const toggleCheck = (key, id) => {
    const list = (plan?.[key] || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    const next = { ...plan, [key]: list }
    save({ launchPlan: next, launchStrategy: { creatorChecklist: next.creatorChecklist, opsChecklist: next.opsChecklist } })
  }

  const queued = (kit.postingSchedule || []).filter((t) => t.fromLaunchPlan)
  const queuePosts = async () => {
    if (!plan?.schedule?.length) return
    setQueuing(true)
    try {
      const fresh = (kit.postingSchedule || []).filter((t) => !t.fromLaunchPlan || t.emailed || t.done)
      const { kit: nextKit, created } = addCreatorTasks({ ...kit, postingSchedule: fresh }, [...plan.schedule].sort((a, b) => (a.day - b.day) || String(a.time).localeCompare(String(b.time))).map((s) => ({
        title: `Launch day ${s.day}: ${s.title}`, channel: s.channel, draftKey: s.draftKey, content: s.content, description: `${s.time ? `${s.time} · ` : ''}${CHANNEL_LABEL[s.channel] || s.channel}`,
      })), { prefix: 'launch', fields: { fromLaunchPlan: true } })
      await updateValidationCampaign(pid, { campaign_kit: nextKit, campaignKit: nextKit })
      await save({ campaignKit: nextKit })
      const email = kit.autonomousEmailDelivery?.recipientEmail || project?.creatorEmail
      if (email) {
        await toggleAutonomousCampaignDelivery(pid, { enabled: true, recipientEmail: email, timezone: kit.autonomousEmailDelivery?.timezone || kit.creatorTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone, sendHour: kit.autonomousEmailDelivery?.sendHour ?? 8 })
        say(`${created.length} launch posts queued. ${project?.creatorName || 'The creator'} gets one each morning at ${email}.`)
      } else say(`${created.length} launch posts queued. Add the creator's email in Phase 1 Step 3 to start daily delivery.`)
    } catch (e) { say(`Could not queue posts: ${e.message}`) } finally { setQueuing(false) }
  }

  const saveCfg = async () => {
    setSavingCfg(true)
    try {
      await saveLaunchConfig(pid, { ...draft, price: draft.price === '' ? null : Number(draft.price), faqs: (draft.faqs || []).filter((f) => f.q && f.a) })
      await refresh(); say('Launch settings saved.')
    } catch (e) { say(`Could not save: ${e.message}`) } finally { setSavingCfg(false) }
  }

  const checks = state?.readiness || []
  const criticalFails = checks.filter((c) => c.critical && c.status === 'fail').length

  return (
    <div className="space-y-6">
      {/* Strategy */}
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="eyebrow m-0 flex items-center gap-1.5"><Megaphone className="w-3 h-3" />Strategy & creator assets</p>
            <h3 className="serif m-0 mt-1 text-2xl" style={{ color: C.text }}>{plan ? (plan.summary || 'Launch plan') : 'Plan the launch from what you learned'}</h3>
            {!plan && <p className="m-0 mt-1 text-sm max-w-2xl" style={{ color: C.muted }}>The AI uses your validation channels and conversion, applied experiments, survey quotes, objections and beta issues to pick the date, channels, offer, messaging and every post.</p>}
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={generate} disabled={generating}>{generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Planning…</> : <><Sparkles className="w-3.5 h-3.5" />{plan ? 'Re-plan' : 'Generate launch plan'}</>}</button>
        </div>
        <AiWorkLog run={ai.run} onStop={ai.stop} title="Launch strategist is planning from your evidence" />
        {genError && <p className="m-0 text-sm" style={{ color: C.crimsonText }}>{genError}</p>}
        {plan && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="well p-3.5 space-y-2">
                <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.muted }}><Calendar className="w-3.5 h-3.5" />Launch date</p>
                <p className="serif m-0 text-2xl" style={{ color: C.text }}>{cfg.launchDate || plan.launchDate || '—'}</p>
                {(plan.offers || []).map((o) => <p key={o.name} className="m-0 text-xs" style={{ color: C.body }}><strong style={{ color: C.text }}>{o.name}</strong> · {money(o.price)} · {o.terms}{o.deadline ? ` · ${o.deadline}` : ''}</p>)}
              </div>
              <div className="well p-3.5 space-y-2">
                <p className="m-0 text-xs" style={{ color: C.muted }}>Channels</p>
                {(plan.channels || []).map((c) => { const I = CH_ICON[c.channel] || Link2; return <p key={c.channel} className="m-0 text-xs" style={{ color: C.body }}><span className="inline-flex items-center gap-1 font-semibold" style={{ color: C.text }}><I className="w-3 h-3" />{CHANNEL_LABEL[c.channel] || c.channel}</span> · {c.why}</p> })}
              </div>
              <div className="well p-3.5 space-y-2">
                <p className="m-0 text-xs" style={{ color: C.muted }}>Messaging</p>
                {(plan.messaging || []).map((m) => <p key={m.angle} className="m-0 text-xs" style={{ color: C.body }}><strong style={{ color: C.text }}>{m.angle}:</strong> “{m.hook}”{m.objection ? <span style={{ color: C.faint }}> · answers “{m.objection}”</span> : null}</p>)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>Launch schedule · {plan.schedule.length} posts</p>
                <button type="button" className="btn btn-quiet" onClick={queuePosts} disabled={queuing}>{queuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{queued.length ? `Re-queue (${queued.filter((t) => t.emailed).length}/${queued.length} sent)` : "Send to creator's daily email"}</button>
              </div>
              <ol className="list-none m-0 p-0 space-y-1.5">
                {[...plan.schedule].sort((a, b) => (a.day - b.day) || String(a.time).localeCompare(String(b.time))).map((s, i) => {
                  const I = CH_ICON[s.channel] || Link2
                  const q = queued.find((t) => t.title === `Launch day ${s.day}: ${s.title}`)
                  return (
                    <li key={i} className="well">
                      <button type="button" className="w-full p-3 flex items-center gap-3 text-left cursor-pointer" onClick={() => setOpenPost(openPost === i ? null : i)}>
                        <span className="w-14 shrink-0 text-xs font-semibold" style={{ color: C.muted }}>Day {s.day}{s.time ? <span className="block text-[10px]" style={{ color: C.faint }}>{s.time}</span> : null}</span>
                        <I className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} />
                        <span className="flex-1 text-sm" style={{ color: C.text }}>{s.title}</span>
                        {q && <span className="text-[11px] font-semibold" style={{ color: q.done ? C.ok : q.emailed ? C.ok : C.warn }}>{q.done ? 'Posted' : q.emailed ? 'Emailed' : 'Queued'}</span>}
                      </button>
                      {openPost === i && <pre className="m-0 px-3 pb-3 text-xs whitespace-pre-wrap" style={{ color: C.body, fontFamily: 'inherit' }}>{s.content}</pre>}
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[['creatorChecklist', `${project?.creatorName || 'Creator'} checklist`, Users], ['opsChecklist', 'Co-Launch checklist', Wrench]].map(([key, title, I]) => (
                <div key={key} className="well p-3.5 space-y-2">
                  <p className="m-0 text-sm font-semibold flex items-center gap-1.5" style={{ color: C.text }}><I className="w-3.5 h-3.5" />{title} · {(plan[key] || []).filter((t) => t.done).length}/{(plan[key] || []).length}</p>
                  {(plan[key] || []).map((t) => (
                    <label key={t.id} className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: t.done ? C.faint : C.body }}>
                      <input type="checkbox" checked={!!t.done} onChange={() => toggleCheck(key, t.id)} className="mt-1" style={{ accentColor: C.crimson }} />
                      <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}{t.when ? <span className="text-[11px] ml-1" style={{ color: C.faint }}>· {t.when}</span> : null}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Product readiness */}
      <section className="card p-4 sm:p-5 space-y-4">
        <div>
          <p className="eyebrow m-0 flex items-center gap-1.5"><Server className="w-3 h-3" />Product</p>
          <h3 className="serif m-0 mt-1 text-2xl" style={{ color: C.text }}>Readiness checks</h3>
          <p className="m-0 mt-1 text-sm" style={{ color: C.muted }}>Each check reads the real setup. Critical failures block going live.</p>
        </div>
        <ul className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-2">
          {checks.map((c) => { const [I, col] = STATUS_ICON[c.status]; return (
            <li key={c.key} className="well p-3 flex items-start gap-3">
              <I className="w-4 h-4 mt-0.5 shrink-0" style={{ color: col }} />
              <div className="min-w-0"><p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{c.label}{c.critical ? '' : <span className="ml-1.5 text-[10px] font-normal" style={{ color: C.faint }}>recommended</span>}</p><p className="m-0 text-xs" style={{ color: C.muted }}>{c.detail}</p></div>
            </li>
          ) })}
          {!checks.length && <li className="well p-3 text-sm" style={{ color: C.faint }}>Loading checks…</li>}
        </ul>

        {draft && (
          <div className="space-y-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="lbl">Where customers use the product</span>
                <div className="grid grid-cols-2 gap-2">
                  {[['hosted', 'Hosted by CoLaunch', 'Promote the Phase 2 staging build to production at /app/' + slug], ['external', 'Our own production app', 'Connect your deployed URL; uptime is checked every 5 min']].map(([id, t, d]) => (
                    <button key={id} type="button" onClick={() => setDraft({ ...draft, mode: id })} className="p-3 text-left cursor-pointer" style={{ background: draft.mode === id ? C.crimsonSoft : C.sheet, border: `1px solid ${draft.mode === id ? C.crimsonLine : C.line}` }}>
                      <span className="block text-sm font-semibold" style={{ color: C.text }}>{t}</span><span className="block text-[11px] mt-0.5" style={{ color: C.muted }}>{d}</span>
                    </button>
                  ))}
                </div>
              </div>
              {draft.mode === 'external' ? (
                <label className="block"><span className="lbl">Production URL</span><input className="in" value={draft.productionUrl} onChange={(e) => setDraft({ ...draft, productionUrl: e.target.value })} placeholder="https://app.yourproduct.com" /></label>
              ) : (
                <div className="well p-3 text-xs" style={{ color: C.muted }}>At launch, staging {project?.staging?.version || '(not deployed)'} becomes the production release. Customers get a personal link to /app/{slug} in their welcome email.</div>
              )}
            </div>
            {draft.mode === 'external' && (
              <div className="well p-3 space-y-2">
                <p className="m-0 text-xs font-semibold flex items-center gap-1.5" style={{ color: C.text }}><Code2 className="w-3.5 h-3.5" />Add to your product's HTML for analytics, activation and error tracking</p>
                <code className="block text-[11px] p-2 overflow-x-auto" style={{ background: C.row, color: C.body }}>{`<script src="${BACKEND}${state?.snippetPath || ''}" async></script>`}</code>
                <p className="m-0 text-[11px]" style={{ color: C.faint }}>Then call <code>colaunch.track('signup')</code> when someone creates an account and <code>colaunch.track('activated')</code> when they complete the first key action. Errors are reported automatically.</p>
                <button type="button" className="btn btn-quiet" onClick={() => { navigator.clipboard?.writeText(`<script src="${BACKEND}${state?.snippetPath || ''}" async></script>`); say('Snippet copied.') }}><Copy className="w-3.5 h-3.5" />Copy snippet</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="block"><span className="lbl">Launch price ($)</span><input className="in" type="number" min={1} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="e.g. 29" /></label>
              <label className="block"><span className="lbl">Price label</span><input className="in" value={draft.priceLabel} onChange={(e) => setDraft({ ...draft, priceLabel: e.target.value })} placeholder="per month" /></label>
              <label className="block"><span className="lbl">Launch date</span><input className="in" type="date" value={draft.launchDate || ''} onChange={(e) => setDraft({ ...draft, launchDate: e.target.value })} /></label>
              <label className="block"><span className="lbl">Support email</span><input className="in" type="email" value={draft.supportEmail} onChange={(e) => setDraft({ ...draft, supportEmail: e.target.value })} placeholder="help@product.com" /></label>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-2">
                <span className="lbl flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Welcome email (sent with each customer's access link)</span>
                <input className="in" value={draft.onboarding.subject || ''} onChange={(e) => setDraft({ ...draft, onboarding: { ...draft.onboarding, subject: e.target.value } })} placeholder="Subject" />
                <textarea className="in" rows={6} value={draft.onboarding.body || ''} onChange={(e) => setDraft({ ...draft, onboarding: { ...draft.onboarding, body: e.target.value } })} placeholder="Use {{first_name}}, {{product}}, {{link}}, {{first_step}}, {{creator}}" />
                <input className="in" value={draft.onboarding.firstStep || ''} onChange={(e) => setDraft({ ...draft, onboarding: { ...draft.onboarding, firstStep: e.target.value } })} placeholder="First step a new customer should take" />
              </div>
              <div className="space-y-2">
                <span className="lbl flex items-center gap-1.5"><LifeBuoy className="w-3.5 h-3.5" />FAQs ({(draft.faqs || []).length})</span>
                {(draft.faqs || []).map((f, i) => (
                  <div key={i} className="well p-2 space-y-1.5">
                    <div className="flex gap-2"><input className="in" value={f.q} onChange={(e) => { const faqs = [...draft.faqs]; faqs[i] = { ...f, q: e.target.value }; setDraft({ ...draft, faqs }) }} placeholder="Question" />
                      <button type="button" aria-label="Remove" className="btn btn-quiet" onClick={() => setDraft({ ...draft, faqs: draft.faqs.filter((_, j) => j !== i) })}><X className="w-3.5 h-3.5" /></button></div>
                    <textarea className="in" rows={2} value={f.a} onChange={(e) => { const faqs = [...draft.faqs]; faqs[i] = { ...f, a: e.target.value }; setDraft({ ...draft, faqs }) }} placeholder="Answer" />
                  </div>
                ))}
                <button type="button" className="btn btn-quiet" onClick={() => setDraft({ ...draft, faqs: [...(draft.faqs || []), { q: '', a: '' }] })}>Add FAQ</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-xs" style={{ color: criticalFails ? C.warn : C.ok }}>{criticalFails ? `${criticalFails} critical ${criticalFails === 1 ? 'check fails' : 'checks fail'}` : 'All critical checks pass'}</p>
              <div className="flex gap-2">
                <button type="button" className="btn btn-quiet" onClick={saveCfg} disabled={savingCfg}>{savingCfg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Save settings</button>
                <button type="button" className="btn btn-primary" onClick={async () => { await saveCfg(); await save({ phase3Prepared: true }); go('monitor') }}>Ready to launch <ArrowRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/* ─── Step 2: Launch + monitor ───────────────────────────────────────────────────────── */
function MonitorStep({ project, pid, state, metrics, refresh, refreshedAt, isLive, slug, save, say, go }) {
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState('')
  const [reason, setReason] = useState('')
  const t = metrics?.totals || {}
  const h = metrics?.health || {}

  const launch = async () => {
    setBusy(true)
    try {
      const res = await goLive(pid, { overrideReason: blocked ? reason : undefined, notifyCustomers: true })
      setBlocked(''); setReason('')
      await save({ launchStatus: 'LIVE', isLive: true, liveAt: res.liveAt, publicMode: 'live', phase3Monitored: true })
      await refresh()
      say(`You're live. ${res.onboardingSent} customers emailed their access link.`)
    } catch (e) {
      const msg = e?.message || ''
      if (/not ready/i.test(msg)) setBlocked(msg.replace(/^.*?Not ready:\s*/i, ''))
      else say(`Launch failed: ${msg}`)
    } finally { setBusy(false) }
  }
  const pause = async () => { setBusy(true); try { await pauseLaunch(pid); await save({ launchStatus: 'PAUSED', publicMode: 'preorder' }); await refresh(); say('Launch paused. The public page is back to pre-order mode.') } finally { setBusy(false) } }

  const kpis = [
    ['Visitors', MousePointerClick, (t.visitors ?? 0).toLocaleString(), 'unique, since launch'],
    ['Sign-ups', UserCheck, (t.signups ?? 0).toLocaleString(), 'from your product'],
    ['Activation', Activity, t.activationRate != null ? `${t.activationRate}%` : '—', `${t.activated ?? 0} of ${t.withAccess ?? 0} customers used it`],
    ['Customers', Users, (t.customers ?? 0).toLocaleString(), 'paid since launch'],
    ['Revenue', DollarSign, money(t.revenue), 'confirmed by Stripe', C.ok],
    ['Conversion', Percent, t.conversion != null ? `${t.conversion}%` : '—', 'visitor → paid'],
  ]
  const maxRev = Math.max(1, ...(metrics?.daily || []).map((d) => d.revenue))
  const maxVis = Math.max(1, ...(metrics?.daily || []).map((d) => d.visitors))
  const agoS = refreshedAt ? Math.round((Date.now() - refreshedAt) / 1000) : null

  return (
    <div className="space-y-6">
      <section className="p-5 space-y-3" style={{ background: isLive ? `linear-gradient(160deg, ${C.okSoft}, transparent 55%), ${C.row}` : C.row, border: `1px solid ${isLive ? C.okLine : C.line}` }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="eyebrow m-0 flex items-center gap-1.5"><Rocket className="w-3 h-3" />Launch</p>
            <h3 className="serif m-0 mt-1 text-3xl" style={{ color: C.text }}>{isLive ? `Live since ${new Date(metrics?.liveAt || project?.liveAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'Ready when you are'}</h3>
            <p className="m-0 mt-1 text-sm max-w-2xl" style={{ color: C.muted }}>
              Going live switches /preorder/{slug} to buy-now at the launch price{state?.config?.mode !== 'external' ? `, promotes staging to production at /app/${slug}` : ''}, and emails every backer their access link.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-quiet" href={`/preorder/${slug}`} target="_blank" rel="noreferrer">Public page <ExternalLink className="w-3.5 h-3.5" /></a>
            {isLive ? <button type="button" className="btn btn-quiet" onClick={pause} disabled={busy}><Pause className="w-3.5 h-3.5" />Pause</button>
              : <button type="button" className="btn btn-primary" onClick={launch} disabled={busy}>{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}Go live</button>}
          </div>
        </div>
        {blocked && (
          <div className="p-3 space-y-2" style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}` }}>
            <p className="m-0 text-sm font-semibold flex items-center gap-2" style={{ color: C.warn }}><ShieldAlert className="w-4 h-4" />Not ready: {blocked}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" className="btn btn-quiet" onClick={() => go('prep')}>Fix in Prepare</button>
              <input className="in" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or explain why you're launching anyway (15+ characters)" />
              <button type="button" className="btn on-accent" style={{ background: C.warn }} disabled={reason.trim().length < 15 || busy} onClick={launch}>Launch anyway</button>
            </div>
          </div>
        )}
        {(t.testOrders || 0) > 0 && <p className="m-0 text-xs" style={{ color: C.faint }}>{t.testOrders} test-mode orders excluded from revenue. Add a live Stripe key on the server to take real payments.</p>}
      </section>

      <div className="flex items-center justify-between">
        <p className="eyebrow m-0">Live dashboard</p>
        <span className="text-[11px]" style={{ color: C.faint }}>{agoS !== null ? `updated ${agoS < 10 ? 'just now' : `${agoS}s ago`} · refreshes every minute` : 'loading…'}</span>
      </div>
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {kpis.map(([label, I, value, sub, tone]) => (
          <div key={label} className="card p-4 space-y-1">
            <div className="flex items-center justify-between"><span className="text-xs" style={{ color: C.muted }}>{label}</span><I className="w-3.5 h-3.5" style={{ color: C.faint }} /></div>
            <p className="serif m-0 text-3xl leading-none" style={{ color: tone || C.text }}>{value}</p>
            <p className="m-0 text-[11px]" style={{ color: C.faint }}>{sub}</p>
          </div>
        ))}
      </section>

      <section className="card p-4 sm:p-5 space-y-3">
        <p className="eyebrow m-0 flex items-center gap-1.5"><BarChart3 className="w-3 h-3" />Last 14 days</p>
        <div className="flex items-end gap-1.5 h-36" role="img" aria-label="Daily revenue and visitors">
          {(metrics?.daily || []).map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${d.date}: ${money(d.revenue)}, ${d.visitors} visitors, ${d.customers} customers`}>
              <div className="w-full flex items-end gap-0.5 h-full">
                <div className="flex-1" style={{ height: `${(d.visitors / maxVis) * 100}%`, background: C.raised, minHeight: d.visitors ? 2 : 0 }} />
                <div className="flex-1" style={{ height: `${(d.revenue / maxRev) * 100}%`, background: C.ok, minHeight: d.revenue ? 2 : 0 }} />
              </div>
              <span className="text-[9px]" style={{ color: C.faint }}>{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="m-0 text-[11px] flex gap-3" style={{ color: C.faint }}><span><span className="inline-block w-2 h-2 mr-1" style={{ background: C.raised }} />Visitors</span><span><span className="inline-block w-2 h-2 mr-1" style={{ background: C.ok }} />Revenue</span></p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0">Attribution by creator channel</p>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead><tr className="text-xs text-left" style={{ color: C.faint }}><th className="py-2 font-semibold">Channel</th><th className="py-2 text-right font-semibold">Visitors</th><th className="py-2 text-right font-semibold">Customers</th><th className="py-2 text-right font-semibold">Revenue</th><th className="py-2 text-right font-semibold">Conversion</th></tr></thead>
            <tbody>
              {(metrics?.channels || []).map((c) => { const I = CH_ICON[c.channel] || Link2; return (
                <tr key={c.channel} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td className="py-2.5"><span className="flex items-center gap-2" style={{ color: C.text }}><I className="w-3.5 h-3.5" style={{ color: C.muted }} />{CHANNEL_LABEL[c.channel] || c.channel}</span></td>
                  <td className="py-2.5 text-right" style={{ color: C.body }}>{c.visitors}</td>
                  <td className="py-2.5 text-right" style={{ color: C.body }}>{c.customers}</td>
                  <td className="py-2.5 text-right" style={{ color: c.revenue ? C.ok : C.faint }}>{c.revenue ? money(c.revenue) : '—'}</td>
                  <td className="py-2.5 text-right" style={{ color: C.body }}>{c.conversion != null ? `${c.conversion}%` : '—'}</td>
                </tr>
              ) })}
              {!(metrics?.channels || []).length && <tr><td colSpan={5} className="py-4 text-sm" style={{ color: C.faint }}>No visits recorded since launch yet.</td></tr>}
            </tbody>
          </table>
          {(metrics?.content || []).length > 0 && (
            <>
              <p className="m-0 pt-2 text-xs font-semibold" style={{ color: C.body }}>By post (tracking link)</p>
              <ul className="list-none m-0 p-0 space-y-1">
                {metrics.content.map((r) => <li key={r.ref} className="well px-3 py-2 flex justify-between text-xs"><span className="font-mono" style={{ color: C.body }}>?ref={r.ref}</span><span style={{ color: C.muted }}>{r.visitors} visitors · <strong style={{ color: C.ok }}>{r.customers}</strong> customers</span></li>)}
              </ul>
            </>
          )}
        </section>

        <section className="lg:col-span-5 card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0 flex items-center gap-1.5"><Server className="w-3 h-3" />Technical health</p>
          {[
            ['Uptime (7 days)', h.uptime != null ? `${h.uptime}%` : 'Not tracked', h.uptime != null ? `${h.checks} checks · ${h.avgLatencyMs}ms avg` : 'Connect a production URL to monitor it', h.uptime != null && h.uptime < 99],
            ['Checkout success', h.checkoutSuccess != null ? `${h.checkoutSuccess}%` : '—', `${t.customers ?? 0} paid of ${t.checkoutOpens ?? 0} checkouts`, h.checkoutSuccess != null && h.checkoutSuccess < 50],
            ['Browser errors', String(h.jsErrors ?? 0), (h.topErrors || [])[0] ? `e.g. ${h.topErrors[0]}` : 'reported from the product', (h.jsErrors || 0) > 10],
            ['Checkout errors', String(h.checkoutErrors ?? 0), 'failed payment attempts', (h.checkoutErrors || 0) > 3],
          ].map(([label, value, sub, bad]) => (
            <div key={label} className="well p-3 flex items-center justify-between gap-3">
              <div className="min-w-0"><p className="m-0 text-sm" style={{ color: C.body }}>{label}</p><p className="m-0 text-[11px] truncate" style={{ color: C.faint }}>{sub}</p></div>
              <span className="text-sm font-semibold shrink-0" style={{ color: bad ? C.crimsonText : C.text }}>{value}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

/* ─── Step 3: AI launch manager (advises, you decide) ──────────────────────────────────── */
function ManagerStep({ project, pid, state, metrics, isLive, kit, actions, save, say, slug }) {
  const signals = useMemo(() => detectSignals(metrics, { liveAt: metrics?.liveAt }), [metrics])
  const ai = useAiStream()
  const advice = project?.launchAdvice || null
  const [drafts, setDrafts] = useState({})
  const [busyRec, setBusyRec] = useState(null)
  const [sending, setSending] = useState(null)
  const [err, setErr] = useState('')
  const quotes = (project?.surveyResponses || []).flatMap((r) => Object.values(r.answers || {})).filter((a) => String(a).length > 15)
  const offer = state?.config?.price ? `$${state.config.price}${state.config.priceLabel ? ` ${state.config.priceLabel}` : ''}` : 'the launch price'
  const links = Object.fromEntries(['instagram', 'video', 'x', 'newsletter', 'dm'].map((c) => [c, `${PUBLIC_APP_URL}/preorder/${slug}?ref=lm_${c}`]))

  const analyse = async () => {
    setErr('')
    try {
      const t = metrics?.totals || {}
      const out = await ai.start(`/launch-ai/${pid}/manager`, {
        metrics: { totals: t, channels: metrics?.channels, content: metrics?.content, health: metrics?.health, periods: metrics?.periods, liveAt: metrics?.liveAt },
        signals, links, offer, quotes: quotes.slice(0, 6),
      })
      await save({ launchAdvice: { ...out, decided: {} }, launchManagerDone: true })
      setDrafts({})
    } catch (e) { setErr(e.message) }
  }

  // Re-read automatically when new signals appear and the last read is more than 3 hours old
  const autoRef = useRef(false)
  useEffect(() => {
    if (autoRef.current || !isLive || !signals.length || ai.run) return
    const stale = !advice?.at || Date.now() - new Date(advice.at).getTime() > 3 * 36e5
    const newKeys = signals.some((sg) => !(advice?.recommendations || []).some((r) => r.signal === sg.key))
    if (stale && newKeys) { autoRef.current = true; analyse() }
  }, [signals, isLive]) // eslint-disable-line react-hooks/exhaustive-deps

  const decided = advice?.decided || {}
  const accept = async (rec) => {
    setBusyRec(rec.signal)
    try {
      const draft = drafts[rec.signal] ?? rec.draft
      const entry = { id: `la-${Date.now()}`, signalKey: rec.signal, kind: rec.kind, title: rec.title, evidence: rec.why, createdAt: new Date().toISOString() }
      if (rec.kind === 'creator') {
        const sig = signals.find((x) => x.key === rec.signal)
        const { kit: nextKit, created } = addCreatorTasks(kit, [{ title: rec.title, channel: sig?.channel || 'instagram', content: draft, description: rec.why }], { prefix: 'lm', fields: { fromLaunchManager: entry.id } })
        await updateValidationCampaign(pid, { campaign_kit: nextKit, campaignKit: nextKit })
        entry.taskId = created[0].id
        entry.content = draft
        await save({ campaignKit: nextKit, launchActions: [entry, ...actions], launchAdvice: { ...advice, decided: { ...decided, [rec.signal]: 'accepted' } } })
      } else {
        const criteria = String(draft || '').split('\n').filter((l) => /^\s*-\s+/.test(l)).map((l) => l.replace(/^\s*-\s+/, '').trim())
        const task = { id: `eng-lm-${Date.now()}`, title: rec.title, category: 'Bug fix', assignedTo: 'Human Engineer', status: 'Ready', estimate: '1 Day', priority: rec.priority === 'high' ? 1 : 2, fromLaunchManager: entry.id, acceptanceCriteria: criteria, notes: `${rec.why}\n\n${draft}` }
        entry.taskId = task.id
        await save({ engineeringTasks: [task, ...(project?.engineeringTasks || [])], launchActions: [entry, ...actions], launchAdvice: { ...advice, decided: { ...decided, [rec.signal]: 'accepted' } } })
      }
      say(rec.kind === 'creator' ? 'Added to the creator’s daily email queue.' : 'Engineering task created in Phase 2.')
    } catch (e) { say(`Couldn't create it: ${e.message}`) } finally { setBusyRec(null) }
  }
  const dismiss = (rec) => save({ launchAdvice: { ...advice, decided: { ...decided, [rec.signal]: 'dismissed' } } })

  const schedule = kit.postingSchedule || []
  const engTasks = project?.engineeringTasks || []
  const statusOf = (a) => {
    if (a.kind === 'creator') {
      const t = schedule.find((x) => x.id === a.taskId)
      return !t ? ['Removed', C.faint] : t.done ? ['Posted', C.ok] : t.emailed ? ['Sent to creator', C.ok] : ['Queued for daily email', C.warn]
    }
    const t = engTasks.find((x) => x.id === a.taskId)
    return !t ? ['Removed', C.faint] : t.verified ? ['Fixed & verified', C.ok] : ['Completed', 'done'].includes(t.status) ? ['Built, awaiting QA', C.warn] : [t.status || 'Ready', C.warn]
  }
  const sendNow = async (a) => {
    setSending(a.id)
    try { await sendCampaignPostEmail(pid, { taskId: a.taskId }); say('Emailed to the creator.') } catch (e) { say(`Email failed: ${e.message}`) } finally { setSending(null) }
  }
  const PRIORITY = { high: C.crimsonText, medium: C.warn, low: C.muted }

  return (
    <div className="space-y-6">
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="eyebrow m-0 flex items-center gap-1.5"><Bot className="w-3 h-3" />AI launch manager · advises, you decide</p>
            <h3 className="serif m-0 mt-1 text-2xl" style={{ color: C.text }}>{isLive ? 'What the live numbers say' : 'Starts once you go live'}</h3>
            <p className="m-0 mt-1 text-sm max-w-2xl" style={{ color: C.muted }}>
              It reads the live dashboard ({signals.length} {signals.length === 1 ? 'signal' : 'signals'} detected), explains what's happening and recommends what to do, with the post or task already drafted. Nothing happens until you accept it.
            </p>
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={analyse} disabled={!!ai.run || !isLive}>
            {ai.run ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}{advice ? 'Read the numbers again' : 'Ask the launch manager'}
          </button>
        </div>
        <AiWorkLog run={ai.run} onStop={ai.stop} title="Launch manager is reading the live numbers" />
        {err && <p className="m-0 text-sm" style={{ color: C.crimsonText }}>{err}</p>}
        {!ai.run && advice?.read && (
          <div className="well p-4 space-y-1">
            <p className="m-0 text-[11px]" style={{ color: C.faint }}>Read {new Date(advice.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
            <p className="m-0 text-[15px] leading-relaxed" style={{ color: C.body }}>{advice.read}</p>
          </div>
        )}
        {!ai.run && (advice?.recommendations || []).map((rec) => {
          const state2 = decided[rec.signal]
          const Icon = rec.kind === 'creator' ? TrendingUp : Bug
          return (
            <article key={rec.signal} className="well p-4 space-y-3" style={state2 ? { opacity: 0.6 } : { borderColor: C.lineStrong }}>
              <div className="flex flex-wrap items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: rec.kind === 'creator' ? C.ok : C.crimsonText }} />
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{rec.title}</p>
                  <p className="m-0 mt-1 text-xs leading-relaxed" style={{ color: C.body }}>{rec.why}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PRIORITY[rec.priority] || C.muted }}>{rec.priority} · {rec.kind === 'creator' ? 'creator post' : 'engineering'}</span>
              </div>
              {!state2 ? (
                <>
                  <label className="block">
                    <span className="lbl">{rec.kind === 'creator' ? 'Draft post (edit before accepting)' : 'Draft task (edit before accepting)'}</span>
                    <textarea className="in" rows={rec.kind === 'creator' ? 6 : 5} value={drafts[rec.signal] ?? rec.draft} onChange={(e) => setDrafts((d) => ({ ...d, [rec.signal]: e.target.value }))} />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" className="btn btn-quiet" onClick={() => dismiss(rec)}>Dismiss</button>
                    <button type="button" className="btn btn-primary" onClick={() => accept(rec)} disabled={busyRec === rec.signal}>{busyRec === rec.signal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}{rec.kind === 'creator' ? 'Accept: add to creator emails' : 'Accept: create engineering task'}</button>
                  </div>
                </>
              ) : <p className="m-0 text-xs" style={{ color: C.faint }}>{state2 === 'accepted' ? 'Accepted' : 'Dismissed'}</p>}
            </article>
          )
        })}
        {!ai.run && isLive && advice && !(advice.recommendations || []).length && <p className="well m-0 p-4 text-sm" style={{ color: C.faint }}>No action needed right now.</p>}
      </section>

      <section className="card p-4 sm:p-5 space-y-3">
        <p className="eyebrow m-0">Accepted actions · {actions.length}</p>
        {!actions.length ? <p className="well m-0 p-4 text-sm" style={{ color: C.faint }}>Nothing accepted yet.</p> : (
          <ol className="list-none m-0 p-0 space-y-2">
            {actions.map((a) => {
              const [label, col] = statusOf(a)
              return (
                <li key={a.id} className="well p-3 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold px-1.5 py-0.5" style={{ background: C.raised, color: C.body }}>{a.kind === 'creator' ? 'Creator task' : 'Engineering task'}</span>
                    <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{a.title}</span>
                    <span className="text-[11px] font-semibold" style={{ color: col }}>{label}</span>
                  </div>
                  <p className="m-0 text-xs" style={{ color: C.muted }}>{new Date(a.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                  {a.kind === 'creator' && label === 'Queued for daily email' && (
                    <button type="button" className="btn btn-quiet" onClick={() => sendNow(a)} disabled={sending === a.id}>{sending === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Email it now</button>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}

/* ─── Step 4: Report + decision ──────────────────────────────────────────────────────── */
function ReportStep({ project, pid, metrics, plan, actions, save, say, go }) {
  const t = metrics?.totals || {}
  const h = metrics?.health || {}
  const p = metrics?.periods || {}
  const decision = useMemo(() => evaluateLaunchDecision(metrics, { target: Number(project?.presaleTarget || 0) }), [metrics, project?.presaleTarget])
  const [writing, setWriting] = useState(false)
  const [history, setHistory] = useState([])
  const [override, setOverride] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (pid) listLaunchDecisions(pid).then((r) => setHistory(r.decisions || [])).catch(() => {}) }, [pid])

  const launchPosts = (project?.campaignKit?.postingSchedule || []).filter((x) => x.fromLaunchPlan || x.fromLaunchManager)
  const engFromLaunch = (project?.engineeringTasks || []).filter((x) => x.fromLaunchManager)
  const feedback = project?.betaFeedback || []
  const report = {
    daysLive: decision.daysLive,
    revenue: t.revenue, customers: t.customers, visitors: t.visitors, conversion: t.conversion, activationRate: t.activationRate,
    weekOverWeek: { revenue: [p.last7d?.revenue, p.prev7d?.revenue], visitors: [p.last7d?.visitors, p.prev7d?.visitors] },
    channels: metrics?.channels || [],
    creator: { launchPosts: launchPosts.length, sent: launchPosts.filter((x) => x.emailed).length, posted: launchPosts.filter((x) => x.done).length, topContent: (metrics?.content || []).slice(0, 3) },
    usage: { withAccess: t.withAccess, opened: t.opened, activated: t.activated, signups: t.signups },
    feedback: { reports: feedback.length, byType: feedback.reduce((a, f) => { const k = f.category || f.type || 'Other'; a[k] = (a[k] || 0) + 1; return a }, {}), openIssues: (project?.feedbackClusters || []).filter((c) => c.status !== 'Resolved').map((c) => c.title).slice(0, 5) },
    technical: { uptime: h.uptime, checkoutSuccess: h.checkoutSuccess, jsErrors: h.jsErrors, checkoutErrors: h.checkoutErrors, engineeringTasksFromLaunch: engFromLaunch.length, fixed: engFromLaunch.filter((x) => x.verified).length },
  }
  const narrative = project?.launchReport?.narrative

  const ai = useAiStream()
  const writeSummary = async () => {
    setWriting(true)
    try {
      const out = await ai.start(`/launch-ai/${pid}/report`, { report })
      const n = out?.narrative
      await save({ launchReport: { ...report, narrative: n, score: Math.round(Math.min(100, (t.conversion || 0) * 20 + (t.activationRate || 0) * 0.3)), generatedAt: new Date().toISOString() } })
      say('Launch report written.')
    } catch (e) { say(`Couldn't write the summary: ${e.message}`) } finally { setWriting(false) }
  }

  const decide = async (id) => {
    const needsReason = id !== decision.verdict && id !== 'iterate'
    if (needsReason && !(override === id && reason.trim().length >= 15)) { setOverride(id); return }
    if (id === 'kill' && !window.confirm('Kill the product? The public page closes, daily creator emails stop, and the project is archived.')) return
    setBusy(true)
    try {
      await postLaunchDecision(pid, { decision: id, recommended: decision.verdict, overrideReason: needsReason ? reason : null, reasons: decision.reasons, snapshot: report })
      const status = { scale: 'scaling', iterate: 'iterating', maintain: 'maintaining', kill: 'killed' }[id]
      await save({ status, phase3Complete: true, decisionNotice: `${id[0].toUpperCase()}${id.slice(1)} chosen on ${new Date().toLocaleDateString()}`, ...(id === 'kill' ? { launchStatus: 'CLOSED', publicMode: 'closed' } : {}) })
      const r = await listLaunchDecisions(pid); setHistory(r.decisions || [])
      say(`Decision saved: ${id}.`)
      if (id === 'iterate' && decision.actions[0]) go(decision.actions[0].step)
    } catch (e) { say(e.message) } finally { setBusy(false); setOverride(null); setReason('') }
  }

  const trend = (a, b) => (b ? ((a - b) / b) * 100 : null)
  const revTrend = trend(p.last7d?.revenue || 0, p.prev7d?.revenue || 0)
  const options = [
    ['scale', 'Scale', 'Put more behind what works: more creator content, more channels, bigger goal.', TrendingUp, C.ok],
    ['iterate', 'Iterate', decision.actions[0] ? `Next: ${decision.actions[0].title}.` : 'Fix the weakest part of the funnel.', RefreshCw, C.warn],
    ['maintain', 'Maintain', 'Keep it running steadily with light creator support.', Minus, C.body],
    ['kill', 'Kill', 'Close sales, stop campaigns and archive.', Archive, C.crimsonText],
  ]
  const V = { scale: C.ok, iterate: C.warn, maintain: C.body, kill: C.crimsonText }[decision.verdict]

  return (
    <div className="space-y-6">
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="eyebrow m-0">Launch report · {decision.daysLive} days live</p>
            <h3 className="serif m-0 mt-1 text-2xl" style={{ color: C.text }}>{money(t.revenue)} from {t.customers ?? 0} customers</h3>
            {narrative?.summary && <p className="m-0 mt-2 text-sm max-w-3xl" style={{ color: C.body }}>{narrative.summary}</p>}
            {narrative?.next && <p className="m-0 mt-2 text-sm max-w-3xl" style={{ color: C.text }}><strong>Next move:</strong> {narrative.next}</p>}
          </div>
          <button type="button" className="btn btn-quiet shrink-0" onClick={writeSummary} disabled={writing || !metrics}>{writing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}{narrative ? 'Rewrite summary' : 'Write AI summary'}</button>
        </div>
        <AiWorkLog run={ai.run} onStop={ai.stop} title="Launch analyst is reading the results" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            ['Revenue (7d)', money(p.last7d?.revenue), revTrend === null ? 'no prior week' : `${revTrend >= 0 ? '+' : ''}${Math.round(revTrend)}% vs last week`],
            ['Conversion', t.conversion != null ? `${t.conversion}%` : '—', `${t.visitors ?? 0} visitors`],
            ['Activation', t.activationRate != null ? `${t.activationRate}%` : '—', `${t.activated ?? 0} of ${t.withAccess ?? 0}`],
            ['Technical', h.uptime != null ? `${h.uptime}% up` : `${h.jsErrors ?? 0} errors`, h.checkoutSuccess != null ? `${h.checkoutSuccess}% checkout success` : 'checkout not measured yet'],
          ].map(([l, v, s]) => <div key={l} className="well p-3"><p className="m-0 text-xs" style={{ color: C.muted }}>{l}</p><p className="serif m-0 text-2xl" style={{ color: C.text }}>{v}</p><p className="m-0 text-[11px]" style={{ color: C.faint }}>{s}</p></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
          <div className="well p-3 space-y-1"><p className="m-0 text-xs font-semibold" style={{ color: C.text }}>Channels</p>{(metrics?.channels || []).slice(0, 4).map((c) => <p key={c.channel} className="m-0 text-xs" style={{ color: C.body }}>{CHANNEL_LABEL[c.channel] || c.channel}: {money(c.revenue)} · {c.conversion ?? '—'}%</p>)}</div>
          <div className="well p-3 space-y-1"><p className="m-0 text-xs font-semibold" style={{ color: C.text }}>Creator</p><p className="m-0 text-xs" style={{ color: C.body }}>{report.creator.sent} of {report.creator.launchPosts} launch posts sent, {report.creator.posted} marked posted.</p>{narrative?.creatorPerformance && <p className="m-0 text-xs" style={{ color: C.muted }}>{narrative.creatorPerformance}</p>}</div>
          <div className="well p-3 space-y-1"><p className="m-0 text-xs font-semibold" style={{ color: C.text }}>Product & feedback</p><p className="m-0 text-xs" style={{ color: C.body }}>{report.feedback.reports} reports · {report.feedback.openIssues.length} open issues · {report.technical.fixed}/{report.technical.engineeringTasksFromLaunch} launch fixes verified.</p>{narrative?.productUsage && <p className="m-0 text-xs" style={{ color: C.muted }}>{narrative.productUsage}</p>}</div>
        </div>
        {narrative?.learnings?.length > 0 && (
          <div className="well p-3 space-y-1"><p className="m-0 text-xs font-semibold" style={{ color: C.text }}>Learnings</p>{narrative.learnings.map((l) => <p key={l} className="m-0 text-xs" style={{ color: C.body }}>· {l}</p>)}</div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="p-5 space-y-3" style={{ background: C.row, border: `1px solid ${V}` }}>
          <p className="eyebrow m-0 flex items-center gap-1.5"><Scale className="w-3 h-3" />Recommendation · {decision.confidence} confidence</p>
          <h4 className="serif m-0 text-3xl" style={{ color: C.text }}>{decision.headline}</h4>
          {decision.reasons.map((r) => <p key={r} className="m-0 text-sm flex gap-2" style={{ color: C.body }}><span className="mt-2 w-1.5 h-1.5 shrink-0" style={{ background: V }} />{r}</p>)}
        </section>
        <section className="card p-4 sm:p-5 space-y-2">
          <p className="eyebrow m-0 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" />Next actions</p>
          {!decision.actions.length ? <p className="well m-0 p-3 text-sm" style={{ color: C.faint }}>Nothing blocking.</p> : decision.actions.map((a) => (
            <div key={a.title} className="well p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0"><p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{a.title}</p><p className="m-0 text-xs" style={{ color: C.muted }}>{a.detail}</p></div>
              <button type="button" className="btn btn-quiet shrink-0" onClick={() => go(a.step)}>Open <ArrowRight className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </section>
      </div>

      <section className="card p-4 sm:p-5 space-y-4">
        <p className="eyebrow m-0">Your decision</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {options.map(([id, title, desc, I, col]) => {
            const rec = id === decision.verdict
            return (
              <button key={id} type="button" disabled={busy} onClick={() => decide(id)} className="p-4 text-left flex flex-col gap-2 cursor-pointer disabled:opacity-50" style={{ background: rec ? `linear-gradient(160deg, ${col}22, transparent 60%), ${C.sheet}` : C.sheet, border: `1px solid ${rec ? col : C.line}` }}>
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}><I className="w-4 h-4" style={{ color: col }} />{title}</span>
                  {rec ? <span className="on-accent text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5" style={{ background: col }}>Recommended</span> : id !== 'iterate' ? <span className="text-[10px] flex items-center gap-1" style={{ color: C.faint }}><ShieldAlert className="w-3 h-3" />Needs a reason</span> : null}
                </span>
                <span className="text-xs" style={{ color: C.muted }}>{desc}</span>
              </button>
            )
          })}
        </div>
        {override && (
          <div className="p-4 space-y-3" style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}` }}>
            <p className="m-0 text-sm font-semibold flex items-center gap-2" style={{ color: C.warn }}><ShieldAlert className="w-4 h-4" />The data says {decision.headline.toLowerCase()}. Why {override}?</p>
            <textarea className="in" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="At least 15 characters; saved with the decision" />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-quiet" onClick={() => { setOverride(null); setReason('') }}>Cancel</button>
              <button type="button" className="btn on-accent" style={{ background: C.warn }} disabled={reason.trim().length < 15 || busy} onClick={() => decide(override)}>Confirm {override}</button>
            </div>
          </div>
        )}
        {history.length > 0 && (
          <ol className="list-none m-0 p-0 space-y-1.5">
            {history.slice(0, 6).map((d, i) => <li key={i} className="well px-3 py-2 flex justify-between text-xs"><span style={{ color: C.text }}>{d.decision}{d.decision !== d.recommended ? <span className="ml-2" style={{ color: C.warn }}>override</span> : null}</span><span style={{ color: C.faint }}>{new Date(d.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span></li>)}
          </ol>
        )}
      </section>
    </div>
  )
}
