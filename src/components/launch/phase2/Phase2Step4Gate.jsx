import React, { useMemo, useState } from 'react'
import {
  ListOrdered, Wrench, RotateCcw, Rocket, Archive, Loader2, ArrowRight, CheckCircle2, AlertTriangle, XCircle,
  ShieldAlert, Sparkles, FlaskConical, CloudUpload, Bot, User, Scale, History, ClipboardList, ExternalLink,
} from 'lucide-react'
import { C } from '../phase1/phase1Constants'
import { computeReadiness, evaluateLaunchGate } from '../../../utils/launchGate'

const S = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.p2g .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.p2g .card{background:${C.row};border:1px solid ${C.line}}
.p2g .well{background:${C.sheet};border:1px solid ${C.line}}
.p2g .eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.faint}}
.p2g .btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;padding:.55rem .9rem}
.p2g .btn:disabled{opacity:.45;cursor:not-allowed}
.p2g .btn-primary{background:${C.crimson};color:#fff}
.p2g .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.p2g .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.p2g .on-accent,.p2g .on-accent *{color:#050506!important}
.p2g .in{width:100%;background:${C.sheet};border:1px solid ${C.line};color:${C.text};padding:.6rem .8rem;font-size:.875rem;outline:none;resize:vertical}
.p2g .in:focus{border-color:${C.crimsonLine}}
.p2g :focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
`
const SEV_W = { High: 3, Critical: 3, Medium: 2, Low: 1 }
const SEV_COLOR = { High: C.crimsonText, Critical: C.crimsonText, Medium: C.warn, Low: C.muted }
const VERDICT = {
  launch: { Icon: Rocket, color: C.ok, soft: C.okSoft, line: C.okLine },
  continue_beta: { Icon: RotateCcw, color: C.warn, soft: C.warnSoft, line: C.warnLine },
  kill: { Icon: Archive, color: C.crimsonText, soft: C.crimsonSoft, line: C.crimsonLine },
}
const STEP_LABEL = { plan: '1 · Plan', build: '2 · Build', beta: '3 · Beta', gate: '4 · This step' }

export default function Phase2Step4Gate({
  project, engineeringTasks = [], qaResults = {}, feedbackClusters = [], rawFeedback = [], betaCohort = [], appliedPatches = [],
  mvpVersion, readinessReport, isAuditing, onGenerateReport, isAutoFixing, onFixCycle, qaRunning, onRunQA,
  isDeployingStaging, onDeployStaging, executingTaskId, goToStep, onLaunch, onRecordDecision, origin, productSlug, showToast,
}) {
  const readiness = useMemo(
    () => computeReadiness({ project, tasks: engineeringTasks, qa: qaResults, clusters: feedbackClusters || [], feedback: rawFeedback, cohort: betaCohort }),
    [project, engineeringTasks, qaResults, feedbackClusters, rawFeedback, betaCohort]
  )
  const gate = useMemo(() => evaluateLaunchGate(readiness), [readiness])
  const v = VERDICT[gate.verdict]
  const clusters = feedbackClusters || []
  const ranked = [...clusters].sort((a, b) => ((SEV_W[b.severity] || 1) * (b.count || b.userCount || 1)) - ((SEV_W[a.severity] || 1) * (a.count || a.userCount || 1)))
  const openCount = clusters.filter((c) => c.status !== 'Resolved').length
  const fixTasks = engineeringTasks.filter((t) => t.fromClusterId)
  const fixVerified = fixTasks.filter((t) => t.verified).length
  const staging = project?.staging
  const history = project?.phase2Decisions || []
  const [override, setOverride] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const recommendedId = gate.verdict
  const needsReason = (id) => id !== recommendedId && id !== 'continue_beta'

  const decide = async (id) => {
    if (needsReason(id) && !(override === id && reason.trim().length >= 15)) { setOverride(id); return }
    if (id === 'kill' && !window.confirm('Kill this product?\n\nThe project is archived and pre-order backers are queued for refunds.')) return
    setBusy(true)
    const record = {
      id: `p2gate_${Date.now()}`, decision: id, recommended: recommendedId, followedRecommendation: id === recommendedId,
      overrideReason: id === recommendedId ? null : reason.trim() || null, readinessScore: readiness.score, reasons: gate.reasons,
      plan: gate.actions.map((a) => a.title), version: mvpVersion, decidedAt: new Date().toISOString(),
    }
    try {
      await onRecordDecision(record)
      if (id === 'launch') onLaunch?.()
      else if (id === 'continue_beta') { showToast?.(gate.actions[0] ? `Beta continues. Next: ${gate.actions[0].title}.` : 'Beta continues.', 'info'); goToStep(gate.actions[0]?.step === 'gate' ? 'beta' : (gate.actions[0]?.step || 'beta')) }
      else showToast?.('Product killed and archived. Backer refunds queued.', 'warning')
    } finally { setBusy(false); setOverride(null); setReason('') }
  }

  const runCta = (a) => {
    if (a.cta === 'fix') return onFixCycle()
    if (a.cta === 'qa') return onRunQA()
    if (a.cta === 'staging') return onDeployStaging({ part: 'minor' })
    return goToStep(a.step)
  }

  const options = [
    { id: 'launch', title: 'Launch', desc: 'Move to Phase 3 and open to the public.', Icon: Rocket, color: C.ok },
    { id: 'continue_beta', title: 'Continue beta', desc: gate.actions[0] ? `Next: ${gate.actions[0].title}.` : 'Keep testing with the cohort.', Icon: RotateCcw, color: C.warn },
    { id: 'kill', title: 'Kill', desc: 'Archive the product and refund backers.', Icon: Archive, color: C.crimsonText },
  ]

  return (
    <div className="p2g space-y-6">
      <style>{S}</style>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div>
          <p className="eyebrow m-0">Step 4 · Iterate + launch gate</p>
          <h3 className="serif m-0 mt-1 text-3xl sm:text-4xl leading-tight" style={{ color: C.text }}>Is the MVP ready to launch?</h3>
          <p className="m-0 mt-2 text-sm max-w-2xl" style={{ color: C.muted }}>AI ranks the beta issues, builds the fixes it can, retests them and ships a new staging version. The readiness score and recommendation come from the real build, QA and beta numbers.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2.5 py-1.5 font-semibold" style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.text }}>{staging?.version || mvpVersion || 'No release yet'}</span>
          {staging && <a className="btn btn-quiet" href={`${origin}/beta/${productSlug}?token=preview`} target="_blank" rel="noreferrer">Staging <ExternalLink className="w-3.5 h-3.5" /></a>}
        </div>
      </div>

      {/* Iterate loop */}
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="eyebrow m-0">Fix cycle</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-quiet" onClick={onRunQA} disabled={qaRunning}>{qaRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}Retest</button>
            <button type="button" className="btn btn-quiet" onClick={() => onDeployStaging({ part: 'patch' })} disabled={isDeployingStaging}>{isDeployingStaging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}Deploy update</button>
            <button type="button" className="btn btn-primary" onClick={onFixCycle} disabled={isAutoFixing || !openCount}>{isAutoFixing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Fixing…</> : <><Sparkles className="w-3.5 h-3.5" />Prioritise & fix {openCount ? `${openCount} issues` : ''}</>}</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { n: 1, Icon: ListOrdered, title: 'Prioritise', value: `${openCount} open`, sub: clusters.length ? `${clusters.length} issues from ${rawFeedback.length} reports` : 'Group beta feedback in Step 3 first' },
            { n: 2, Icon: Wrench, title: 'Create & implement fixes', value: `${fixTasks.length} fix tasks`, sub: `${fixTasks.filter((t) => t.assignedTo === 'AI Agent').length} AI · ${fixTasks.filter((t) => t.assignedTo !== 'AI Agent').length} human` },
            { n: 3, Icon: FlaskConical, title: 'Update MVP & retest', value: `${fixVerified}/${fixTasks.length} verified`, sub: `${appliedPatches.length} fixes shipped · ${staging?.version || 'not deployed'}` },
          ].map((s) => (
            <div key={s.n} className="well p-3.5 space-y-1">
              <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.muted }}><s.Icon className="w-3.5 h-3.5" />{s.n}. {s.title}</p>
              <p className="serif m-0 text-2xl" style={{ color: C.text }}>{s.value}</p>
              <p className="m-0 text-[11px]" style={{ color: C.faint }}>{s.sub}</p>
            </div>
          ))}
        </div>
        {ranked.length > 0 && (
          <ol className="list-none m-0 p-0 space-y-1.5">
            {ranked.slice(0, 8).map((c, i) => {
              const fix = fixTasks.find((t) => t.fromClusterId === (c.id || c.title))
              const Who = fix?.assignedTo === 'Human Engineer' ? User : Bot
              return (
                <li key={c.id || c.title} className="well px-3 py-2.5 flex flex-wrap items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0" style={{ background: C.raised, color: C.text }}>{i + 1}</span>
                  <span className="flex-1 min-w-[12rem] text-sm" style={{ color: C.text }}>
                    <strong>{c.count || c.userCount || 1} users</strong> {String(c.title || '').replace(/^\d+\s+users?\s+/i, '')}
                    <span className="ml-2 text-[11px] font-semibold" style={{ color: SEV_COLOR[c.severity] || C.muted }}>{c.severity || 'Low'}</span>
                  </span>
                  {fix && <span className="text-[11px] flex items-center gap-1" style={{ color: C.muted }}><Who className="w-3 h-3" />{fix.assignedTo}{executingTaskId === fix.id ? ' · building…' : ''}</span>}
                  <span className="text-[11px] font-semibold" style={{ color: c.status === 'Resolved' ? C.ok : c.status === 'Fix in progress' ? C.warn : C.faint }}>
                    {c.status === 'Resolved' ? '✓ Fixed & verified' : c.status || 'Open'}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* Readiness report */}
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="serif text-5xl leading-none" style={{ color: readiness.score >= 80 ? C.ok : readiness.score >= 50 ? C.warn : C.crimsonText }}>{readiness.score}</span>
            <div>
              <p className="eyebrow m-0">Product readiness</p>
              <p className="m-0 mt-1 text-sm max-w-xl" style={{ color: C.body }}>{readinessReport?.summary || readiness.summary}</p>
              {readinessReport?.generatedAt && <p className="m-0 mt-1 text-[11px]" style={{ color: C.faint }}>AI report {new Date(readinessReport.generatedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
            </div>
          </div>
          <button type="button" className="btn btn-quiet shrink-0" onClick={onGenerateReport} disabled={isAuditing}>{isAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}{readinessReport ? 'Refresh AI report' : 'Generate AI report'}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {readiness.pillars.map((p) => (
            <div key={p.key} className="well p-3 space-y-1.5">
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: C.muted }}>{p.name}</span><span className="text-sm font-semibold" style={{ color: C.text }}>{p.score}</span></div>
              <div className="h-1.5" style={{ background: C.raised }}><div className="h-full" style={{ width: `${p.score}%`, background: p.score >= 80 ? C.ok : p.score >= 50 ? C.warn : C.crimson }} /></div>
              <p className="m-0 text-[11px] leading-snug" style={{ color: C.faint }}>{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation + plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="p-5 space-y-3" style={{ background: `linear-gradient(160deg, ${v.soft}, transparent 55%), ${C.row}`, border: `1px solid ${v.line}` }}>
          <p className="eyebrow m-0 flex items-center gap-1.5"><Scale className="w-3 h-3" />Recommendation · {gate.confidence} confidence</p>
          <h4 className="serif m-0 text-3xl flex items-center gap-2" style={{ color: C.text }}><v.Icon className="w-6 h-6" style={{ color: v.color }} />{gate.headline}</h4>
          <ul className="list-none m-0 p-0 space-y-1.5">
            {gate.reasons.map((r) => <li key={r} className="flex items-start gap-2 text-sm" style={{ color: C.body }}><span className="mt-2 w-1.5 h-1.5 shrink-0" style={{ background: v.color }} />{r}</li>)}
          </ul>
        </section>
        <section className="card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" />{gate.verdict === 'launch' ? 'Before launch' : 'What to do next'}</p>
          {gate.actions.length === 0 ? <p className="well m-0 p-4 text-sm" style={{ color: C.faint }}>Every launch check passes.</p> : (
            <ol className="list-none m-0 p-0 space-y-2">
              {gate.actions.map((a, i) => (
                <li key={a.title} className="well p-3 flex items-start gap-3">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0" style={{ background: C.raised, color: C.text }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{a.title}</p>
                    <p className="m-0 mt-0.5 text-xs" style={{ color: C.muted }}>{a.detail}</p>
                  </div>
                  <button type="button" className="btn btn-quiet shrink-0" onClick={() => runCta(a)}>{a.cta ? 'Do it' : STEP_LABEL[a.step]} <ArrowRight className="w-3.5 h-3.5" /></button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Decision */}
      <section className="card p-4 sm:p-5 space-y-4">
        <p className="eyebrow m-0">Your decision</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {options.map((o) => {
            const isRec = o.id === recommendedId
            return (
              <button key={o.id} type="button" disabled={busy} onClick={() => decide(o.id)} className="p-4 text-left flex flex-col gap-2 cursor-pointer disabled:opacity-50"
                style={{ background: isRec ? `linear-gradient(160deg, ${o.color}22, transparent 60%), ${C.sheet}` : C.sheet, border: `1px solid ${isRec ? o.color : C.line}` }}>
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}><o.Icon className="w-4 h-4" style={{ color: o.color }} />{o.title}</span>
                  {isRec ? <span className="on-accent text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5" style={{ background: o.color }}>Recommended</span>
                    : needsReason(o.id) ? <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: C.faint }}><ShieldAlert className="w-3 h-3" />Needs a reason</span> : null}
                </span>
                <span className="text-xs" style={{ color: C.muted }}>{o.desc}</span>
              </button>
            )
          })}
        </div>
        {override && (
          <div className="p-4 space-y-3" style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}` }}>
            <p className="m-0 text-sm font-semibold flex items-center gap-2" style={{ color: C.warn }}><ShieldAlert className="w-4 h-4" />This goes against the recommendation</p>
            <p className="m-0 text-xs" style={{ color: C.body }}>The data says <strong>{gate.headline.toLowerCase()}</strong>. Say why you're choosing to {override === 'launch' ? 'launch' : 'kill'}; it's saved with the decision.</p>
            <textarea className="in" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="At least 15 characters" />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-quiet" onClick={() => { setOverride(null); setReason('') }}>Cancel</button>
              <button type="button" className="btn on-accent" style={{ background: C.warn }} disabled={reason.trim().length < 15 || busy} onClick={() => decide(override)}>Confirm {override === 'launch' ? 'launch' : 'kill'} anyway</button>
            </div>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="card p-4 sm:p-5 space-y-2">
          <p className="eyebrow m-0 flex items-center gap-1.5"><History className="w-3 h-3" />Past decisions</p>
          {history.slice(0, 6).map((d) => (
            <div key={d.id} className="well px-3 py-2 flex flex-wrap justify-between gap-2 text-sm">
              <span style={{ color: C.text }}>{{ launch: 'Launch', continue_beta: 'Continue beta', kill: 'Kill' }[d.decision]}{d.followedRecommendation === false && <span className="ml-2 text-[11px]" style={{ color: C.warn }}>override</span>}</span>
              <span className="text-xs" style={{ color: C.faint }}>Readiness {d.readinessScore} · {d.version || ''} · {new Date(d.decidedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
