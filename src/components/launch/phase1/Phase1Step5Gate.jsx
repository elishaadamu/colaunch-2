import React, { useMemo, useState } from 'react'
import {
  Lock, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Hammer, RefreshCw, Archive, Loader2, ArrowRight,
  Hourglass, Scale, ShieldAlert, History, Target, ClipboardList,
} from 'lucide-react'
import { recordGateDecision, updateCoLaunchProject } from '../../../services/opsApi'
import { C, P1_SHARED_CSS } from './phase1Constants'
import StepRail from './StepRail'
import { evaluateGate } from '../../../utils/gateDecision'

const S5_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.s5 .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.s5 .card{background:${C.row};border:1px solid ${C.line}}
.s5 .well{background:${C.sheet};border:1px solid ${C.line}}
.s5 .eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.faint}}
.s5 .btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;padding:.55rem .9rem}
.s5 .btn:disabled{opacity:.45;cursor:not-allowed}
.s5 .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.s5 .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.s5 .in{width:100%;background:${C.sheet};border:1px solid ${C.line};color:${C.text};padding:.6rem .8rem;font-size:.875rem;outline:none;resize:vertical}
.s5 .in:focus{border-color:${C.crimsonLine}}
.s5 .on-accent,.s5 .on-accent *{color:#050506!important}
.s5 :focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
`

const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`

const VERDICT_STYLE = {
  build: { Icon: CheckCircle2, color: C.crimsonText, soft: C.crimsonSoft, line: C.crimsonLine },
  iterate: { Icon: RefreshCw, color: C.crimsonText, soft: C.crimsonSoft, line: C.crimsonLine },
  keep_running: { Icon: Hourglass, color: C.crimsonText, soft: C.crimsonSoft, line: C.crimsonLine },
  kill: { Icon: Archive, color: C.crimsonText, soft: C.crimsonSoft, line: C.crimsonLine },
}
const SIGNAL_ICON = {
  pass: [CheckCircle2, C.ok], warn: [AlertTriangle, C.warn], fail: [XCircle, C.crimsonText], unknown: [HelpCircle, C.faint],
}
const STEP_LABEL = { plan: 'Step 1 · Plan', assets: 'Step 2 · Assets', campaign: 'Step 3 · Campaign', optimize: 'Step 4 · Optimise' }
const DECISION_LABEL = { pass_to_phase2: 'Build MVP', iterate_validation: 'Fix and test again', kill_project: 'Stopped' }

export default function Phase1Step5Gate(props) {
  const {
    project, allPriorStepsDone, isStep1Done, isStep2Done, isStep3Done, isStep4Done, canAccessStep2, canAccessStep3, canAccessStep4,
    presalesRevenue, presaleTarget, reservations = [], isAdvancingPhase, setIsAdvancingPhase, onAdvanceToPhase2,
    isIteratingGate, setIsIteratingGate, isArchivingProject, setIsArchivingProject, handleStepChange, showNotification, onUpdateProject,
    surveyResponses = [], campaignKit, plan, totalTraffic, activeFoundingPrice, handleSetGoal,
  } = props

  const result = useMemo(() => evaluateGate({
    revenue: presalesRevenue,
    target: presaleTarget,
    backers: reservations.length,
    visitors: totalTraffic,
    foundingPrice: activeFoundingPrice,
    surveyResponses,
    schedule: campaignKit?.postingSchedule || [],
    period: plan?.period || project?.validationPlan?.period,
    followers: project?.followers || project?.creatorProfile?.followers || project?.subscriberCount,
  }), [presalesRevenue, presaleTarget, reservations.length, totalTraffic, activeFoundingPrice, surveyResponses, campaignKit?.postingSchedule, plan?.period, project?.followers]) // eslint-disable-line react-hooks/exhaustive-deps

  const v = VERDICT_STYLE[result.verdict]
  const m = result.metrics
  const [overrideFor, setOverrideFor] = useState(null) // 'pass_to_phase2' | 'kill_project'
  const [overrideReason, setOverrideReason] = useState('')
  const busy = isAdvancingPhase || isIteratingGate || isArchivingProject
  const history = project?.gateDecisions || []

  const recommended = { build: 'pass_to_phase2', iterate: 'iterate_validation', keep_running: 'iterate_validation', kill: 'kill_project' }[result.verdict]

  const buildRecord = (decision, extra = {}) => ({
    id: `gate_${Date.now()}`,
    decision,
    recommended,
    verdict: result.verdict,
    confidence: result.confidence,
    followedRecommendation: decision === recommended,
    overrideReason: decision === recommended ? null : overrideReason.trim() || null,
    reasons: result.reasons,
    correctivePlan: result.actions.map((a) => ({ step: a.step, title: a.title })),
    targetRevenue: presaleTarget,
    achievedRevenue: presalesRevenue,
    backersCount: reservations.length,
    visitors: m.visitors,
    conversionRate: Number((m.conv * 100).toFixed(2)),
    decidedAt: new Date().toISOString(),
    ...extra,
  })

  const commit = async (record, projectPatch, apiDecision) => {
    const notes = [
      `${DECISION_LABEL[record.decision]} (recommended: ${result.headline}, ${result.confidence} confidence).`,
      ...result.reasons,
      record.overrideReason ? `Override reason: ${record.overrideReason}` : '',
      record.correctivePlan.length ? `Plan: ${record.correctivePlan.map((a) => a.title).join('; ')}` : '',
    ].filter(Boolean).join(' ')
    const next = { ...projectPatch, gateDecisions: [record, ...history], decisions: [record, ...(project?.decisions || [])] }
    onUpdateProject?.((prev) => ({ ...(prev || {}), ...next }))
    if (project?.id) {
      await recordGateDecision(project.id, { decision: apiDecision, notes }).catch((e) => console.warn(e))
      await updateCoLaunchProject(project.id, { ...projectPatch, gateDecisions: next.gateDecisions }).catch((e) => console.warn(e))
    }
  }

  const needsOverride = (decision) => decision !== recommended && decision !== 'iterate_validation'
  const overrideOk = overrideReason.trim().length >= 15

  const decideBuild = async () => {
    if (needsOverride('pass_to_phase2') && !(overrideFor === 'pass_to_phase2' && overrideOk)) { setOverrideFor('pass_to_phase2'); return }
    setIsAdvancingPhase(true)
    try {
      const patch = { currentPhase: 2, current_phase: 2, currentStep: 'plan', current_step: 'plan', p1Complete: true, phase1Passed: true, step4Done: true, step5Done: true, status: 'building' }
      await commit(buildRecord('pass_to_phase2', { gateStatus: 'passed' }), patch, 'pass_to_phase2')
      showNotification('Gate passed. Moving to Phase 2: Build MVP.')
      onAdvanceToPhase2?.()
    } finally { setIsAdvancingPhase(false); setOverrideFor(null); setOverrideReason('') }
  }

  const decideIterate = async () => {
    setIsIteratingGate(true)
    try {
      await commit(buildRecord('iterate_validation', { gateStatus: 'iterating' }), { currentPhase: 1, status: 'validating' }, 'iterate_validation')
      const first = result.actions[0]
      showNotification(first ? `Corrective plan saved. Start with: ${first.title}.` : 'Saved. Keep the test running.')
      handleStepChange(first?.step || 'optimize')
    } finally { setIsIteratingGate(false) }
  }

  const decideKill = async () => {
    if (needsOverride('kill_project') && !(overrideFor === 'kill_project' && overrideOk)) { setOverrideFor('kill_project'); return }
    if (!window.confirm('Stop this venture?\n\nAll campaign activity stops, the project is archived, and any backers are marked for refund.')) return
    setIsArchivingProject(true)
    try {
      await commit(buildRecord('kill_project', { gateStatus: 'killed' }), { status: 'killed' }, 'kill_project')
      showNotification('Venture stopped and archived. Backer refunds logged.')
    } finally { setIsArchivingProject(false); setOverrideFor(null); setOverrideReason('') }
  }

  const options = [
    { id: 'pass_to_phase2', title: 'Build the MVP', desc: 'Move to Phase 2 and start building.', Icon: Hammer, color: C.ok, onClick: decideBuild, loading: isAdvancingPhase },
    { id: 'iterate_validation', title: 'Fix and test again', desc: result.actions[0] ? `Starts with: ${result.actions[0].title}.` : 'Keep the campaign running.', Icon: RefreshCw, color: C.warn, onClick: decideIterate, loading: isIteratingGate },
    { id: 'kill_project', title: 'Stop the venture', desc: 'Archive it and refund backers.', Icon: Archive, color: C.crimsonText, onClick: decideKill, loading: isArchivingProject },
  ]

  return (
    <div className="s5 p1-themed p1-rise p-5 sm:p-6 space-y-6" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
      <style>{P1_SHARED_CSS + S5_CSS}</style>
      <StepRail current="gate" />

      {!allPriorStepsDone && (
        <div className="p-4 space-y-3" style={{ background: C.sheet, border: `1px solid ${C.crimsonLine}` }}>
          <p className="m-0 text-sm font-semibold flex items-center gap-2" style={{ color: C.text }}><Lock className="w-4 h-4" style={{ color: C.crimsonText }} />Some earlier steps aren't finished</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[['plan', '1. Plan', isStep1Done, true], ['assets', '2. Assets', isStep2Done, canAccessStep2], ['campaign', '3. Campaign', isStep3Done, canAccessStep3], ['optimize', '4. Optimise', isStep4Done, canAccessStep4]].map(([id, label, done, can]) => (
              <button key={id} type="button" disabled={!can} onClick={() => handleStepChange(id)} className="p-2.5 text-left text-xs font-semibold flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: done ? C.okSoft : C.sheet, border: `1px solid ${done ? C.okLine : C.line}`, color: done ? C.ok : C.body }}>
                {label}<span>{done ? '✓' : 'Open'}</span>
              </button>
            ))}
          </div>
          <p className="m-0 text-xs" style={{ color: C.body }}>The recommendation below still uses whatever data exists, but it's weaker with steps missing.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div>
          <p className="eyebrow m-0">Step 5 · Validation gate</p>
          <h3 className="serif m-0 mt-1 text-3xl sm:text-4xl leading-tight" style={{ color: C.text }}>Should this get built?</h3>
          <p className="m-0 mt-2 text-sm max-w-2xl" style={{ color: C.muted }}>The recommendation comes from the real numbers: pre-sales, traffic, conversion, campaign delivery and survey answers. It changes as the data changes.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold shrink-0" style={{ background: v.soft, border: `1px solid ${v.line}`, color: v.color }}>
          <v.Icon className="w-3.5 h-3.5" />{result.headline}
        </span>
      </div>

      {/* Recommendation */}
      <section className="p-5 sm:p-6 space-y-4" style={{ background: `linear-gradient(160deg, ${v.soft}, transparent 55%), ${C.row}`, border: `1px solid ${v.line}` }}>
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 flex items-center justify-center shrink-0" style={{ background: C.sheet, border: `1px solid ${v.line}`, color: v.color }}><v.Icon className="w-5 h-5" /></span>
          <div className="min-w-0">
            <p className="eyebrow m-0 flex items-center gap-1.5"><Scale className="w-3 h-3" />Recommendation · {result.confidence} confidence</p>
            <h4 className="serif m-0 mt-1 text-3xl leading-tight" style={{ color: C.text }}>{result.headline}</h4>
            <ul className="list-none m-0 mt-3 p-0 space-y-1.5">
              {result.reasons.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm" style={{ color: C.body }}><span className="mt-2 w-1.5 h-1.5 shrink-0" style={{ background: v.color }} />{r}</li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: C.muted }}>
            <span className="flex items-center gap-1.5"><Target className="w-3 h-3" />Pre-sales</span>
            <span><strong style={{ color: C.text }}>{money(presalesRevenue)}</strong> of {money(presaleTarget)} · {reservations.length} backers</span>
          </div>
          <div className="h-2.5 w-full" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
            <div className="h-full" style={{ width: `${Math.min(100, m.progress * 100)}%`, minWidth: m.progress > 0 ? 4 : 0, background: m.progress >= 1 ? C.ok : C.warn }} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evidence */}
        <section className="card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0">Evidence</p>
          <ul className="list-none m-0 p-0 space-y-1.5">
            {result.signals.map((s) => {
              const [Icon, col] = SIGNAL_ICON[s.status]
              return (
                <li key={s.key} className="well px-3 py-2.5 flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: col }} />
                  <span className="flex-1 text-sm" style={{ color: C.body }}>{s.label}{s.note && <span className="block text-[11px]" style={{ color: C.faint }}>{s.note}</span>}</span>
                  <span className="text-sm font-semibold text-right" style={{ color: C.text }}>{s.value}</span>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Corrective plan */}
        <section className="card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" />{result.verdict === 'build' ? 'Before you build' : 'Corrective plan'}</p>
          {result.actions.length === 0 ? (
            <p className="well m-0 p-4 text-sm" style={{ color: C.faint }}>Nothing to fix. The evidence supports the recommendation.</p>
          ) : (
            <ol className="list-none m-0 p-0 space-y-2">
              {result.actions.map((a, i) => (
                <li key={a.title} className="well p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0" style={{ background: C.raised, color: C.text }}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{a.title}</p>
                      <p className="m-0 mt-0.5 text-xs leading-relaxed" style={{ color: C.muted }}>{a.detail}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-9">
                    <button type="button" className="btn btn-quiet" onClick={() => handleStepChange(a.step)}>{STEP_LABEL[a.step]} <ArrowRight className="w-3.5 h-3.5" /></button>
                    {a.targetSuggestion && handleSetGoal && (
                      <button type="button" className="btn btn-quiet" onClick={() => handleSetGoal(a.targetSuggestion)}><Target className="w-3.5 h-3.5" />Set goal to {money(a.targetSuggestion)}</button>
                    )}
                  </div>
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
            const isRec = o.id === recommended
            const gated = needsOverride(o.id)
            return (
              <button key={o.id} type="button" disabled={busy} onClick={o.onClick}
                className="p-4 text-left flex flex-col gap-2 cursor-pointer transition-colors disabled:opacity-50"
                style={{ background: isRec ? `linear-gradient(160deg, ${C.crimsonSoft}, transparent 60%), ${C.sheet}` : C.sheet, border: `1px solid ${isRec ? C.crimsonLine : C.line}` }}>
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>
                    {o.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <o.Icon className="w-4 h-4" style={{ color: C.body }} />}{o.title}
                  </span>
                  {isRec ? <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5" style={{ background: C.crimson, color: "#fff" }}>Recommended</span>
                    : gated ? <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: C.faint }}><ShieldAlert className="w-3 h-3" />Needs a reason</span> : null}
                </span>
                <span className="text-xs" style={{ color: C.muted }}>{o.desc}</span>
              </button>
            )
          })}
        </div>

        {overrideFor && (
          <div className="p-4 space-y-3" style={{ background: C.sheet, border: `1px solid ${C.crimsonLine}` }}>
            <p className="m-0 text-sm font-semibold flex items-center gap-2" style={{ color: C.text }}><ShieldAlert className="w-4 h-4" style={{ color: C.crimsonText }} />This goes against the recommendation</p>
            <p className="m-0 text-xs" style={{ color: C.body }}>
              The data says <strong>{result.headline.toLowerCase()}</strong>. Explain why you're choosing to {overrideFor === 'pass_to_phase2' ? 'build anyway' : 'stop'}; it's saved with the decision.
            </p>
            <textarea className="in" rows={3} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)}
              placeholder={overrideFor === 'pass_to_phase2' ? 'e.g. A brand partner pre-committed $20k offline, which isn’t in these numbers.' : 'e.g. The creator has stepped away from the project.'} />
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-quiet" onClick={() => { setOverrideFor(null); setOverrideReason('') }}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={!overrideOk || busy} onClick={overrideFor === 'pass_to_phase2' ? decideBuild : decideKill}>
                Confirm {overrideFor === 'pass_to_phase2' ? 'build' : 'stop'} anyway
              </button>
            </div>
            {!overrideOk && <p className="m-0 text-[11px]" style={{ color: C.faint }}>At least 15 characters.</p>}
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section className="card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0 flex items-center gap-1.5"><History className="w-3 h-3" />Past decisions</p>
          <ol className="list-none m-0 p-0 space-y-1.5">
            {history.slice(0, 6).map((d) => (
              <li key={d.id} className="well px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span style={{ color: C.text }}>
                  {DECISION_LABEL[d.decision] || d.decision}
                  {d.followedRecommendation === false && <span className="ml-2 text-[11px]" style={{ color: C.warn }}>override</span>}
                </span>
                <span className="text-xs" style={{ color: C.faint }}>
                  {money(d.achievedRevenue)} · {d.backersCount ?? 0} backers · {d.decidedAt ? new Date(d.decidedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
