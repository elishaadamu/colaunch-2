import React from 'react'
import { Sparkles, Save, Check, Loader2, Target, ArrowRight, Lock } from 'lucide-react'
import { updateValidationPlan, updateCoLaunchProject } from '../../../services/opsApi'
import { Phase1ValidateSkeleton } from '../Section2Skeletons'
import { C, PILL_TONES } from './phase1Constants'

const PLAN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.p1plan .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-0.01em}
.p1plan .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;white-space:nowrap;font-size:.8125rem;font-weight:600;border-radius:.625rem;cursor:pointer;border:1px solid transparent;transition:background-color .15s,border-color .15s,color .15s}
.p1plan .btn:disabled{opacity:.5;cursor:not-allowed}
.p1plan .btn-primary{background:${C.crimson};color:#fff}
.p1plan .btn-primary:hover:not(:disabled){background:${C.crimsonHover}}
.p1plan .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.p1plan .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.p1plan .btn:focus-visible,.p1plan textarea:focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
.p1plan .field{display:block;border-radius:.75rem;background:${C.row};border:1px solid ${C.line};padding:.875rem 1rem;transition:border-color .15s}
.p1plan .field:hover{border-color:${C.lineStrong}}
.p1plan .field:focus-within{border-color:${C.crimsonLine}}
.p1plan .field textarea{width:100%;display:block;margin-top:.375rem;resize:vertical;background:transparent;border:0;outline:none;color:${C.text};font-size:.875rem;line-height:1.55;padding:0}
.p1plan .field textarea::placeholder{color:${C.faint}}
@media (prefers-reduced-motion:reduce){.p1plan *{transition:none!important}}
`

// Fields grouped the way the plan reads: who, what you sell, how you prove it.
const GROUPS = [
  {
    title: 'The customer',
    hint: 'Who this is for and what hurts.',
    fields: [
      { key: 'customer', label: 'Target customer', rows: 2, ph: 'Retro gaming enthusiasts who own handheld consoles...' },
      { key: 'problem', label: 'Problem it solves', rows: 3, ph: 'Save states and shader presets are stuck on separate devices...' },
    ],
  },
  {
    title: 'The offer',
    hint: 'What founding members get and what it costs.',
    fields: [
      { key: 'offer', label: 'Founding co-builder offer', rows: 3, ph: 'Founding Member Pass ($49 deposit): instant private beta and cross-device sync...' },
      { key: 'pricing', label: 'Pricing and deposit model', rows: 2, ph: '$19/mo Player Pass, $49/mo Collector Suite (50/50 revenue split)...' },
    ],
  },
  {
    title: 'The test',
    hint: 'How you will know people want it.',
    fields: [
      { key: 'testMethod', label: 'Validation method', rows: 4, ph: '1) Video demo, 2) 48-hour founding member presale, 3) 50 beta slots...' },
      { key: 'period', label: 'Validation period', rows: 1, ph: '14-day validation sprint' },
      { key: 'threshold', label: 'Success threshold', rows: 2, ph: '$10,000 in presales or 200 co-builder pass reservations', goal: true },
    ],
  },
]

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
  const targetText = Number.isFinite(target) && target > 0 ? `$${target.toLocaleString()}` : null
  const hasVariant = Boolean(plan?.pricing?.includes('AI Experiment') || campaignKit?.pricingConfig?.activeExperimentTitle)

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
    <div className="p1plan p-5 sm:p-8 rounded-2xl space-y-6" style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.text }}>
      <style>{PLAN_CSS}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="serif m-0 text-4xl leading-none">Validation plan</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1.5" style={locked ? PILL_TONES.ok : hasPlanGenerated ? PILL_TONES.raised : PILL_TONES.neutral}>
              {locked && <Lock className="w-3 h-3" aria-hidden="true" />}
              {locked ? 'Approved and locked' : hasPlanGenerated ? 'Draft, ready to review' : 'Not generated yet'}
            </span>
          </div>
          <p className="m-0 mt-2.5 text-sm leading-relaxed max-w-2xl" style={{ color: C.muted }}>
            One page that says who {conceptName} is for, what founding members get, and what result proves people will pay.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {hasPlanGenerated && (
            <button
              type="button"
              onClick={saveAll}
              disabled={saveStatus === 'saving'}
              className="btn btn-quiet h-9 px-3.5"
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
          )}
          <button type="button" onClick={generatePlan} disabled={isGenerating} className={`btn h-9 px-4 ${hasPlanGenerated ? 'btn-quiet' : 'btn-primary'}`}>
            {isGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /><span>Writing plan...</span></>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /><span>{hasPlanGenerated ? 'Regenerate' : 'Generate plan'}</span></>
            )}
          </button>
        </div>
      </div>

      {isGenerating ? (
        <Phase1ValidateSkeleton />
      ) : !hasPlanGenerated ? (
        <div className="max-w-xl mx-auto py-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }}>
            <Target className="w-6 h-6" style={{ color: C.crimsonText }} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h4 className="serif m-0 text-3xl leading-tight">Let's write the plan for {conceptName}</h4>
            <p className="m-0 text-sm leading-relaxed" style={{ color: C.muted }}>
              The AI drafts the customer, problem, founding offer, pricing, test method, timeline and a revenue target for {creatorName}. You can edit every line before you approve it.
            </p>
          </div>
          <button type="button" onClick={generatePlan} disabled={isGenerating} className="btn btn-primary h-11 px-6">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Generate plan</span>
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Form */}
          <div className="lg:col-span-8 space-y-7">
            {GROUPS.map((group) => (
              <section key={group.title} aria-labelledby={`plan-${group.title}`}>
                <div className="mb-3 flex items-baseline justify-between gap-3 flex-wrap">
                  <h4 id={`plan-${group.title}`} className="serif m-0 text-2xl">{group.title}</h4>
                  <p className="m-0 text-xs" style={{ color: C.faint }}>{group.hint}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {group.fields.map((f) => {
                    const wide = f.key !== 'period' && f.key !== 'threshold'
                    const goal = Boolean(f.goal)
                    return (
                      <label
                        key={f.key}
                        className={`field ${wide ? 'sm:col-span-2' : ''}`}
                        style={goal ? { background: C.okSoft, borderColor: C.okLine } : undefined}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold" style={{ color: goal ? C.ok : C.body }}>{f.label}</span>
                          {f.key === 'pricing' && hasVariant && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border inline-flex items-center gap-1" style={PILL_TONES.violet}>
                              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                              AI price test active
                            </span>
                          )}
                        </span>
                        <textarea
                          value={plan[f.key] || ''}
                          onChange={(event) => updatePlan(f.key, event.target.value)}
                          rows={f.rows}
                          placeholder={f.ph}
                        />
                      </label>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
            <div className="p-5 rounded-2xl space-y-4" style={{ background: C.row, border: `1px solid ${C.line}` }}>
              <div>
                <p className="m-0 text-xs" style={{ color: C.faint }}>Goal to prove demand</p>
                <p className="serif m-0 mt-1 text-5xl leading-none" style={{ color: C.text }}>{targetText || 'Set a target'}</p>
                <p className="m-0 mt-1.5 text-xs" style={{ color: C.muted }}>in presales or reservations</p>
              </div>
              <dl className="m-0 space-y-2.5 text-sm pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
                {[
                  ['Product', conceptName],
                  ['Creator', creatorName],
                  ['Period', plan.period || 'Not set'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4">
                    <dt style={{ color: C.muted }}>{k}</dt>
                    <dd className="m-0 text-right min-w-0 break-words" style={{ color: C.text }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <button type="button" onClick={approveAndContinue} className="btn btn-primary w-full h-11">
              <span>Approve and build assets</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <p className="m-0 text-xs leading-relaxed" style={{ color: C.faint }}>
              Approving saves the plan and locks it, then opens the asset builder.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
