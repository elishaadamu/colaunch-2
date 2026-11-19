import React from 'react'
import {
  Sparkles, Save, Check, Loader2, Target, ArrowRight, Lock, Users, Gift, FlaskConical,
  Package, Megaphone, LineChart, ShieldCheck, TrendingUp, CalendarDays,
} from 'lucide-react'
import { updateValidationPlan, updateCoLaunchProject } from '../../../services/opsApi'
import { Phase1ValidateSkeleton } from '../Section2Skeletons'
import { C, PILL_TONES, P1_SHARED_CSS } from './phase1Constants'
import { derivePresalePrice, parseFollowerCount } from '../conceptSchema'
import StepRail from './StepRail'

const PLAN_CSS = `
.p1plan .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-0.01em}
.p1plan .btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;transition:background-color .15s,border-color .15s,color .15s,filter .15s,transform .15s}
.p1plan .btn:disabled{opacity:.5;cursor:not-allowed}
.p1plan .btn-primary{color:#fff}
.p1plan .btn-primary:active:not(:disabled){transform:translateY(1px)}
.p1plan .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.p1plan .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.p1plan .btn:focus-visible,.p1plan textarea:focus-visible{outline:2px solid #ff4d6d;outline-offset:2px}
.p1plan .sec{position:relative;background:linear-gradient(180deg,rgba(255,255,255,.02) 0%,rgba(255,255,255,0) 110px),${C.row};border:1px solid ${C.line};transition:border-color .18s}
.p1plan .sec:hover{border-color:${C.lineStrong}}
.p1plan .sec-edge{position:absolute;left:0;top:18px;bottom:18px;width:3px}
.p1plan .field{display:block;background:${C.bg};border:1px solid ${C.line};padding:.8rem .95rem;transition:border-color .15s,box-shadow .15s}
.p1plan .field:hover{border-color:${C.lineStrong}}
.p1plan .field:focus-within{border-color:rgba(200,30,60,.7);box-shadow:0 0 0 3px rgba(200,30,60,.15)}
.p1plan .field textarea{width:100%;display:block;margin-top:.4rem;resize:vertical;background:transparent!important;border:0!important;box-shadow:none!important;outline:none;color:${C.text}!important;font-size:.9rem!important;line-height:1.6;padding:0;field-sizing:content;min-height:2.6em}
.p1plan .field textarea::placeholder{color:${C.faint}}
.p1plan .goal{position:relative;overflow:hidden;background:linear-gradient(160deg,rgba(200,30,60,.22) 0%,rgba(200,30,60,.05) 55%,rgba(12,12,14,1) 100%);border:1px solid rgba(255,77,109,.45)}
.p1plan .goal::before{content:"";position:absolute;inset:-40% -20% auto auto;width:70%;height:120%;background:radial-gradient(closest-side,rgba(255,77,109,.25),transparent);pointer-events:none}
@media (prefers-reduced-motion:reduce){.p1plan *{transition:none!important}}
`

// Fields grouped the way the plan reads: who, what you sell, how you prove it.
const GROUPS = [
  {
    n: '01', title: 'The customer', hint: 'Who this is for and what hurts.', Icon: Users, accent: '#ff4d6d',
    fields: [
      { key: 'customer', label: 'Target customer', help: 'Be specific: who buys first and why now.', rows: 2, ph: 'Retro gaming enthusiasts who own handheld consoles...' },
      { key: 'problem', label: 'Problem it solves', help: 'The pain in their words.', rows: 3, ph: 'Save states and shader presets are stuck on separate devices...' },
    ],
  },
  {
    n: '02', title: 'The offer', hint: 'What founding members get and what it costs.', Icon: Gift, accent: '#ff4d6d',
    fields: [
      { key: 'offer', label: 'Founding co-builder offer', help: 'What a founding member receives today.', rows: 3, ph: 'Founding Member Pass ($49 deposit): instant private beta and cross-device sync...' },
      { key: 'pricing', label: 'Pricing and deposit model', help: 'Price, deposit, refund terms.', rows: 2, ph: '$19/mo Player Pass, $49/mo Collector Suite (50/50 revenue split)...' },
    ],
  },
  {
    n: '03', title: 'The test', hint: 'How you will know people want it.', Icon: FlaskConical, accent: '#ff4d6d',
    fields: [
      { key: 'testMethod', label: 'Validation method', help: 'The concrete steps you will run.', rows: 4, ph: '1) Video demo, 2) 48-hour founding member presale, 3) 50 beta slots...' },
      { key: 'period', label: 'Validation period', help: 'How long the test runs.', rows: 1, ph: '14-day validation sprint' },
      { key: 'threshold', label: 'Success threshold', help: 'The number that proves demand.', rows: 2, ph: '$10,000 in presales or 200 co-builder pass reservations', goal: true },
    ],
  },
]
const ALL_KEYS = GROUPS.flatMap((g) => g.fields.map((f) => f.key))

const NEXT_STEPS = [
  { Icon: Package, label: 'Assets', text: 'Landing page, pricing tiers and visuals from this plan.' },
  { Icon: Megaphone, label: 'Campaign', text: 'Posts, emails and links for the creator to share.' },
  { Icon: LineChart, label: 'Optimize', text: 'Track visits and backers, tune the offer.' },
  { Icon: ShieldCheck, label: 'Gate', text: 'Go / no-go against the goal on the right.' },
]

const fmtMoney = (n) => `$${Math.round(n).toLocaleString()}`

export default function Phase1Step1Plan({
  project,
  plan,
  updatePlan,
  generatePlan,
  isGenerating,
  hasPlanGenerated,
  saveAll,
  saveStatus,
  presaleTarget,
  campaignKit,
  theme,
  showNotification,
  setActiveStep,
  onSelectStep,
  onUpdateProject,
}) {
  const conceptName = project?.selectedConcept?.name || project?.productName || 'the venture'
  const creatorName = project?.creatorName || 'the creator'
  const locked = Boolean(project?.planLocked || plan?.locked)
  const target = Number(presaleTarget)
  const hasTarget = Number.isFinite(target) && target > 0
  const hasVariant = Boolean(plan?.pricing?.includes('AI Experiment') || campaignKit?.pricingConfig?.activeExperimentTitle)

  // Goal breakdown: buyers needed at the founding price, daily pace, live progress.
  const foundingPrice = derivePresalePrice(plan?.pricing) || derivePresalePrice(project?.selectedConcept?.pricing || project?.pricing)
  const buyersNeeded = hasTarget && foundingPrice ? Math.ceil(target / foundingPrice) : null
  const periodDays = (() => {
    const m = String(plan?.period || '').match(/(\d+)\s*(day|week)/i)
    if (!m) return null
    return Number(m[1]) * (m[2].toLowerCase().startsWith('week') ? 7 : 1)
  })()
  const dailyPace = hasTarget && periodDays ? target / periodDays : null
  const raised = Number(project?.currentPresales || 0)
  const progressPct = hasTarget ? Math.min(100, Math.round((raised / target) * 100)) : 0
  const filled = ALL_KEYS.filter((k) => String(plan?.[k] || '').trim().length > 0).length
  const readyPct = Math.round((filled / ALL_KEYS.length) * 100)

  const prof = project?.creatorProfile || project?.metadataInfo?.creator_profile || {}
  const audience = parseFollowerCount(prof.followers) || parseFollowerCount(prof.followersLabel) || parseFollowerCount(project?.followers)

  const approveAndContinue = async () => {
    saveAll()
    const updatedPlan = { ...(plan || {}), status: 'approved', locked: true, generated: true }
    const updated = {
      ...(project || {}),
      planGenerated: true,
      validationPlan: updatedPlan,
      planLocked: true,
      phase1Step1Done: true,
    }
    if (onUpdateProject) onUpdateProject((prev) => ({ ...(prev || {}), ...updated }))
    if (project?.id) {
      updateValidationPlan(project.id, {
        customer: plan.customer || '',
        problem: plan.problem || '',
        offer: plan.offer || '',
        pricing: plan.pricing || '',
        test_method: plan.testMethod || '',
        period: plan.period || '',
        threshold: plan.threshold || '',
        target_revenue: presaleTarget,
        status: 'approved',
        locked: true,
        generated: true,
      }).catch((e) => console.warn(e))
      updateCoLaunchProject(project.id, {
        planGenerated: true,
        plan_generated: true,
        planLocked: true,
        phase1Step1Done: true,
        validationPlan: updatedPlan,
        validation_plan: updatedPlan,
      }).catch((e) => console.warn(e))
    }
    showNotification('Validation plan approved and locked. Advancing to Assets.')
    setActiveStep('assets')
    onSelectStep?.('assets')
  }

  return (
    <div className="p1plan p1-themed p-5 sm:p-8 space-y-7" style={{ border: `1px solid ${C.line}`, color: C.text }}>
      <style>{PLAN_CSS + P1_SHARED_CSS}</style>
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,77,109,.7),transparent)' }} aria-hidden="true" />

      <StepRail current="plan" caption={hasPlanGenerated ? `${filled}/${ALL_KEYS.length} fields ready` : undefined} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="serif m-0 text-4xl sm:text-5xl leading-none">Validation plan</h3>
            <span className="px-2.5 py-1 text-xs font-semibold border inline-flex items-center gap-1.5" style={locked ? PILL_TONES.ok : hasPlanGenerated ? PILL_TONES.raised : PILL_TONES.neutral}>
              {locked ? <Lock className="w-3 h-3" aria-hidden="true" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: hasPlanGenerated ? '#fbbf24' : C.faint }} />}
              {locked ? 'Approved and locked' : hasPlanGenerated ? 'Draft, ready to review' : 'Not generated yet'}
            </span>
          </div>
          <p className="m-0 mt-3 text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: C.muted }}>
            One page that says who <span style={{ color: C.text }}>{conceptName}</span> is for, what founding members get, and what result proves people will pay.
          </p>
        </div>

        {hasPlanGenerated && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={saveAll}
              disabled={saveStatus === 'saving'}
              className="btn btn-quiet h-10 px-4"
              style={saveStatus === 'saved' ? { background: C.okSoft, borderColor: C.okLine, color: C.ok } : undefined}
            >
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /><span>Saving...</span></>
              ) : saveStatus === 'saved' ? (
                <><Check className="w-3.5 h-3.5" aria-hidden="true" /><span>Saved</span></>
              ) : (
                <><Save className="w-3.5 h-3.5" aria-hidden="true" /><span>Save draft</span></>
              )}
            </button>
            <button type="button" onClick={generatePlan} disabled={isGenerating || locked} className="btn btn-quiet h-10 px-4" title={locked ? 'Plan is locked' : 'Write a new draft'}>
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{isGenerating ? 'Writing plan...' : 'Regenerate'}</span>
            </button>
          </div>
        )}
      </div>

      {isGenerating ? (
        <Phase1ValidateSkeleton />
      ) : !hasPlanGenerated ? (
        /* ── Intro: what the plan will contain, then one clear action ── */
        <div className="grid lg:grid-cols-12 gap-6 items-stretch p1-rise">
          <div className="lg:col-span-5 flex flex-col justify-center space-y-5 py-2">
            <div className="w-14 h-14 flex items-center justify-center acq-glow-pulse" style={{ background: 'linear-gradient(160deg,rgba(200,30,60,.4),rgba(200,30,60,.08))', border: `1px solid ${C.crimsonLine}` }}>
              <Target className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <h4 className="serif m-0 text-4xl leading-[1.05]">Write the plan for {conceptName}</h4>
              <p className="m-0 text-sm leading-relaxed" style={{ color: C.muted }}>
                The AI drafts a one-page validation plan grounded in {creatorName}'s audience and the concept they approved. Every line stays editable before you lock it.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-px m-0 text-xs" style={{ background: C.line, border: `1px solid ${C.line}` }}>
              {[
                ['Creator', creatorName],
                ['Audience', audience ? `${audience >= 1e6 ? (audience / 1e6).toFixed(1) + 'M' : Math.round(audience / 1e3) + 'K'}` : '—'],
                ['Concept', conceptName],
              ].map(([k, v]) => (
                <div key={k} className="px-3 py-2.5" style={{ background: C.row }}>
                  <dt style={{ color: C.faint }}>{k}</dt>
                  <dd className="m-0 mt-0.5 font-semibold truncate" style={{ color: C.text }}>{v}</dd>
                </div>
              ))}
            </dl>
            <button type="button" onClick={generatePlan} disabled={isGenerating} className="btn btn-primary h-12 px-7 text-sm self-start">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Generate plan</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <ol className="lg:col-span-7 list-none m-0 p-0 grid gap-3 p1-rise">
            {GROUPS.map((g) => (
              <li key={g.n} className="sec p-5 flex gap-4">
                <span className="sec-edge" style={{ background: g.accent }} aria-hidden="true" />
                <span className="w-10 h-10 shrink-0 flex items-center justify-center" style={{ background: `${g.accent}1a`, border: `1px solid ${g.accent}55`, color: g.accent }}>
                  <g.Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-[10px] font-mono" style={{ color: C.faint }}>{g.n}</p>
                  <p className="serif m-0 text-2xl leading-tight">{g.title}</p>
                  <p className="m-0 mt-1 text-xs" style={{ color: C.muted }}>{g.fields.map((f) => f.label).join(' · ')}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* ── Plan sections ── */}
          <div className="lg:col-span-8 space-y-5 p1-rise">
            {/* Readiness */}
            <div className="flex items-center gap-4 px-4 py-3" style={{ background: C.row, border: `1px solid ${C.line}` }}>
              <span className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: C.faint }}>Plan readiness</span>
              <div className="flex-1 h-1.5 overflow-hidden" style={{ background: '#1c1c20' }}>
                <div className="h-full transition-all duration-500" style={{ width: `${readyPct}%`, background: readyPct === 100 ? '#34d399' : 'linear-gradient(90deg,#c81e3c,#ff4d6d)' }} />
              </div>
              <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: readyPct === 100 ? '#34d399' : C.text }}>{readyPct}%</span>
            </div>

            {GROUPS.map((group) => (
              <section key={group.title} className="sec p-5 sm:p-6 space-y-4" aria-labelledby={`plan-${group.n}`}>
                <span className="sec-edge" style={{ background: group.accent }} aria-hidden="true" />
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 shrink-0 flex items-center justify-center" style={{ background: `${group.accent}1a`, border: `1px solid ${group.accent}55`, color: group.accent }}>
                      <group.Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="m-0 text-[10px] font-mono" style={{ color: C.faint }}>{group.n}</p>
                      <h4 id={`plan-${group.n}`} className="serif m-0 text-2xl sm:text-3xl leading-none">{group.title}</h4>
                    </div>
                  </div>
                  <p className="m-0 text-xs pt-1" style={{ color: C.faint }}>{group.hint}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {group.fields.map((f) => {
                    const wide = f.key !== 'period' && f.key !== 'threshold'
                    const value = plan[f.key] || ''
                    return (
                      <label
                        key={f.key}
                        className={`field ${wide ? 'sm:col-span-2' : ''}`}
                        style={f.goal ? { borderColor: 'rgba(52,211,153,.35)' } : undefined}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold" style={{ color: f.goal ? '#6ee7b7' : C.body }}>{f.label}</span>
                          <span className="flex items-center gap-2">
                            {f.key === 'pricing' && hasVariant && (
                              <span className="text-[11px] font-medium px-2 py-0.5 border inline-flex items-center gap-1" style={PILL_TONES.violet}>
                                <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                                AI price test
                              </span>
                            )}
                            <span className="text-[10px] tabular-nums" style={{ color: C.faint }}>{value.length}</span>
                          </span>
                        </span>
                        <span className="block text-[11px] mt-0.5" style={{ color: C.faint }}>{f.help}</span>
                        <textarea
                          value={value}
                          onChange={(event) => updatePlan(f.key, event.target.value)}
                          rows={f.rows}
                          placeholder={f.ph}
                          disabled={locked}
                        />
                      </label>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* ── Goal + next steps ── */}
          <aside className="lg:col-span-4 lg:sticky lg:top-4 space-y-3 p1-rise">
            <div className="goal p-5 sm:p-6 space-y-5">
              <div className="relative">
                <p className="m-0 text-xs font-semibold uppercase tracking-wider" style={{ color: '#ffb3c1' }}>Goal to prove demand</p>
                <p className="serif m-0 mt-2 text-6xl leading-none text-white">{hasTarget ? fmtMoney(target) : 'Set a target'}</p>
                <p className="m-0 mt-2 text-xs" style={{ color: C.body }}>in presales or reservations</p>
              </div>

              {hasTarget && (
                <div className="relative space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span style={{ color: C.muted }}>Raised so far</span>
                    <span className="font-semibold tabular-nums" style={{ color: C.text }}>{fmtMoney(raised)} · {progressPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden" style={{ background: 'rgba(0,0,0,.45)' }}>
                    <div className="h-full acq-shimmer" style={{ width: `${Math.max(2, progressPct)}%`, background: 'linear-gradient(90deg,#c81e3c,#ff4d6d)' }} />
                  </div>
                </div>
              )}

              <dl className="relative grid grid-cols-2 gap-px m-0 text-xs" style={{ background: 'rgba(255,255,255,.08)' }}>
                {[
                  { Icon: Users, k: 'Buyers needed', v: buyersNeeded ? buyersNeeded.toLocaleString() : '—', sub: foundingPrice ? `at ${fmtMoney(foundingPrice)} founding` : 'set pricing' },
                  { Icon: TrendingUp, k: 'Daily pace', v: dailyPace ? fmtMoney(dailyPace) : '—', sub: periodDays ? `over ${periodDays} days` : 'set a period' },
                ].map((m) => (
                  <div key={m.k} className="px-3 py-3" style={{ background: 'rgba(12,12,14,.85)' }}>
                    <dt className="flex items-center gap-1.5" style={{ color: C.faint }}>
                      <m.Icon className="w-3 h-3" aria-hidden="true" />{m.k}
                    </dt>
                    <dd className="m-0 mt-1 text-lg font-bold tabular-nums text-white">{m.v}</dd>
                    <dd className="m-0 text-[10px]" style={{ color: C.faint }}>{m.sub}</dd>
                  </div>
                ))}
              </dl>

              <dl className="relative m-0 space-y-2 text-sm pt-4" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
                {[
                  ['Product', conceptName],
                  ['Creator', creatorName],
                  ['Period', plan.period || 'Not set'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4">
                    <dt style={{ color: C.muted }}>{k}</dt>
                    <dd className="m-0 text-right min-w-0 break-words font-medium" style={{ color: C.text }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="p-4 space-y-3" style={{ background: C.row, border: `1px solid ${C.line}` }}>
              <p className="m-0 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: C.faint }}>
                <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" /> After you approve
              </p>
              <ol className="list-none m-0 p-0 space-y-2.5">
                {NEXT_STEPS.map((s, i) => (
                  <li key={s.label} className="flex items-start gap-3">
                    <span className="w-7 h-7 shrink-0 flex items-center justify-center text-[10px] font-mono" style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.body }}>
                      {i + 2}
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-xs font-semibold flex items-center gap-1.5" style={{ color: C.text }}>
                        <s.Icon className="w-3.5 h-3.5" style={{ color: '#ff4d6d' }} aria-hidden="true" />{s.label}
                      </p>
                      <p className="m-0 text-[11px] leading-snug" style={{ color: C.faint }}>{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {locked ? (
              <button type="button" onClick={() => { setActiveStep('assets'); onSelectStep?.('assets') }} className="btn btn-quiet w-full h-12">
                <span>Plan locked · go to Assets</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={approveAndContinue} className="btn btn-primary w-full h-12 text-sm acq-glow-pulse">
                <span>Approve and build assets</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <p className="m-0 text-xs leading-relaxed" style={{ color: C.faint }}>
              Approving saves the plan and locks it, then opens the asset builder.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
