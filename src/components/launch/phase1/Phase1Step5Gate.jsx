import React from 'react'
import {
  Lock, Flag, CheckCircle2, Clock, Target, DollarSign,
  TrendingUp, Award, Flame, Crown, RefreshCw, Trash2, Loader2
} from 'lucide-react'
import { recordGateDecision, updateCoLaunchProject } from '../../../services/opsApi'
import { C, HEADING_FONT, PILL_TONES, P1_SHARED_CSS } from './phase1Constants'
import StepRail from './StepRail'

export default function Phase1Step5Gate({
  project,
  allPriorStepsDone,
  isStep1Done,
  isStep2Done,
  isStep3Done,
  isStep4Done,
  canAccessStep2,
  canAccessStep3,
  canAccessStep4,
  isGatePassed,
  presalesRevenue,
  presaleTarget,
  reservations,
  dynamicConversionRate,
  isAdvancingPhase,
  setIsAdvancingPhase,
  onAdvanceToPhase2,
  isIteratingGate,
  setIsIteratingGate,
  isArchivingProject,
  setIsArchivingProject,
  handleStepChange,
  showNotification,
  onUpdateProject
}) {
  return (
    <div
      className="p1-themed p1-rise p-5 sm:p-6 rounded-2xl space-y-6"
      style={{ background: C.sheet, border: `1px solid ${C.line}` }}
    >
      <style>{P1_SHARED_CSS}</style>
      <StepRail current="gate" />
      {/* Prerequisite Check Banner if prior steps are incomplete */}
      {!allPriorStepsDone && (
        <div
          className="p-4 rounded-xl border space-y-2.5 animate-fade-in"
          style={{ background: C.warnSoft, borderColor: C.warnLine, color: C.text }}
        >
          <div className="flex items-center gap-2 font-bold" style={{ color: C.warn }}>
            <Lock className="w-4 h-4 shrink-0" style={{ color: C.warn }} />
            <span>Validation Gate is Locked: Prerequisite Steps Incomplete</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: C.body }}>
            The Gate Checkpoint evaluates data, audience feedback, and campaign telemetry from Steps 1–4. You can review each step below, or mark all prerequisites complete to proceed with your MVP decision.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => handleStepChange('plan')}
              className="p-2.5 rounded-xl text-left font-bold border flex items-center justify-between transition-all cursor-pointer"
              style={
                isStep1Done
                  ? { background: C.okSoft, borderColor: C.okLine, color: C.ok }
                  : { background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText }
              }
            >
              <span>1. Plan</span>
              <span className="font-mono text-[10px]">{isStep1Done ? 'Done' : 'Required'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleStepChange('assets')}
              disabled={!canAccessStep2}
              className="p-2.5 rounded-xl text-left font-bold border flex items-center justify-between transition-all"
              style={
                isStep2Done
                  ? { background: C.okSoft, borderColor: C.okLine, color: C.ok, cursor: 'pointer' }
                  : canAccessStep2
                  ? { background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText, cursor: 'pointer' }
                  : { background: C.row, borderColor: C.line, color: C.faint, cursor: 'not-allowed', opacity: 0.5 }
              }
            >
              <span>2. Assets</span>
              <span className="font-mono text-[10px]">{isStep2Done ? 'Done' : 'Required'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleStepChange('campaign')}
              disabled={!canAccessStep3}
              className="p-2.5 rounded-xl text-left font-bold border flex items-center justify-between transition-all"
              style={
                isStep3Done
                  ? { background: C.okSoft, borderColor: C.okLine, color: C.ok, cursor: 'pointer' }
                  : canAccessStep3
                  ? { background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText, cursor: 'pointer' }
                  : { background: C.row, borderColor: C.line, color: C.faint, cursor: 'not-allowed', opacity: 0.5 }
              }
            >
              <span>3. Campaign</span>
              <span className="font-mono text-[10px]">{isStep3Done ? 'Done' : 'Required'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleStepChange('optimize')}
              disabled={!canAccessStep4}
              className="p-2.5 rounded-xl text-left font-bold border flex items-center justify-between transition-all"
              style={
                isStep4Done
                  ? { background: C.okSoft, borderColor: C.okLine, color: C.ok, cursor: 'pointer' }
                  : canAccessStep4
                  ? { background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText, cursor: 'pointer' }
                  : { background: C.row, borderColor: C.line, color: C.faint, cursor: 'not-allowed', opacity: 0.5 }
              }
            >
              <span>4. Optimize</span>
              <span className="font-mono text-[10px]">{isStep4Done ? 'Done' : 'Required'}</span>
            </button>
          </div>
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                const updated = {
                  ...(project || {}),
                  planLocked: true,
                  phase1Step1Done: true,
                  assetsApproved: true,
                  landingPageApproved: true,
                  phase1Step2Done: true,
                  campaignApproved: true,
                  phase1Step3Done: true,
                  step3Done: true,
                  step4Done: true,
                  phase1Step4Done: true,
                  validationOptimized: true,
                  telemetryReviewed: true
                }
                if (onUpdateProject) onUpdateProject((prev) => ({ ...(prev || {}), ...updated }))
                if (project?.id) {
                  updateCoLaunchProject(project.id, {
                    planLocked: true,
                    phase1Step1Done: true,
                    assetsApproved: true,
                    landingPageApproved: true,
                    phase1Step2Done: true,
                    campaignApproved: true,
                    phase1Step3Done: true,
                    step3Done: true,
                    step4Done: true,
                    phase1Step4Done: true,
                    validationOptimized: true,
                    telemetryReviewed: true
                  }).catch((e) => console.warn(e))
                }
                showNotification('All prerequisite validation steps marked complete.')
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              style={{ background: C.warn, color: '#050506' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              <span>Mark All 1–4 Prerequisites Complete</span>
            </button>
          </div>
        </div>
      )}

      {/* Gate Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: C.line }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className="p-2 rounded-xl border flex items-center justify-center shadow-sm"
              style={PILL_TONES.crimson}
            >
              <Flag className="w-4 h-4" style={{ color: C.crimsonText }} />
            </div>
            <h3 className="text-base font-extrabold tracking-tight" style={{ ...HEADING_FONT, color: C.text }}>
              5. Validation Gate Checkpoint
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border"
              style={
                !allPriorStepsDone
                  ? PILL_TONES.neutral
                  : isGatePassed
                  ? PILL_TONES.ok
                  : PILL_TONES.warn
              }
            >
              Result: {!allPriorStepsDone ? 'LOCKED' : isGatePassed ? 'PASS' : 'TEST AGAIN'}
            </span>
          </div>
          <p className="text-xs" style={{ color: C.muted }}>
            Synthesize campaign telemetry, verify buyer pre-orders, and execute the co-founder venture trajectory decision.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span
            className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5"
            style={
              !allPriorStepsDone
                ? PILL_TONES.neutral
                : isGatePassed
                ? PILL_TONES.ok
                : PILL_TONES.warn
            }
          >
            {isGatePassed ? (
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.ok }} />
            ) : !allPriorStepsDone ? (
              <Lock className="w-3.5 h-3.5" style={{ color: C.muted }} />
            ) : (
              <Clock className="w-3.5 h-3.5" style={{ color: C.warn }} />
            )}
            <span>
              Gate Status:{' '}
              {!allPriorStepsDone
                ? 'LOCKED (Prerequisites Required)'
                : isGatePassed
                ? 'PASS (Ready for MVP Build)'
                : `${presaleTarget > 0 ? Math.round((presalesRevenue / presaleTarget) * 100) : 0}% of Goal`}
            </span>
          </span>
        </div>
      </div>

      {/* Milestone Target Progress Bar */}
      <div
        className="p-4 sm:p-5 rounded-2xl border space-y-2.5"
        style={{ background: C.row, borderColor: C.line }}
      >
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold flex items-center gap-1.5" style={{ color: C.body }}>
            <Target className="w-3.5 h-3.5" style={{ color: C.muted }} />
            <span>Validation Revenue Threshold</span>
          </span>
          <span className="font-extrabold" style={{ color: C.text }}>
            ${presalesRevenue.toLocaleString()}{' '}
            <span className="font-normal" style={{ color: C.muted }}>
              / ${presaleTarget.toLocaleString()} target ({presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 0}%)
            </span>
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden p-0.5 border" style={{ background: C.sheet, borderColor: C.line }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              background: isGatePassed ? C.ok : `linear-gradient(90deg, ${C.warn} 0%, ${C.ok} 100%)`,
              width: `${Math.max(2, Math.min(100, presaleTarget > 0 ? Math.round((presalesRevenue / presaleTarget) * 100) : 0))}%`
            }}
          />
        </div>
      </div>

      {/* Executive Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl border space-y-1.5" style={{ background: C.row, borderColor: C.line }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider" style={{ color: C.muted }}>Goal</span>
            <Target className="w-3.5 h-3.5" style={{ color: C.muted }} />
          </div>
          <span className="text-lg font-extrabold block font-display" style={{ color: C.text }}>${presaleTarget.toLocaleString()}</span>
          <span className="text-[11px]" style={{ color: C.muted }}>14-day sprint target</span>
        </div>

        <div className="p-4 rounded-xl border space-y-1.5" style={{ background: C.row, borderColor: C.line }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider" style={{ color: C.ok }}>Actual</span>
            <DollarSign className="w-3.5 h-3.5" style={{ color: C.ok }} />
          </div>
          <span className="text-lg font-extrabold block font-display" style={{ color: C.ok }}>
            ${presalesRevenue.toLocaleString()}
          </span>
          <span className="text-[11px]" style={{ color: C.muted }}>
            {reservations.length} paying backer{reservations.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="p-4 rounded-xl border space-y-1.5" style={{ background: C.row, borderColor: C.line }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider" style={{ color: C.skyText }}>Conversion</span>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: C.skyText }} />
          </div>
          <span className="text-lg font-extrabold block font-display" style={{ color: C.text }}>{Number(dynamicConversionRate || 0).toFixed(1)}%</span>
          <span className="text-[11px]" style={{ color: C.muted }}>Traffic-to-presale</span>
        </div>

        <div className="p-4 rounded-xl border space-y-1.5" style={{ background: C.row, borderColor: C.line }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider" style={{ color: C.violetText }}>Result</span>
            {isGatePassed ? (
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.ok }} />
            ) : !allPriorStepsDone ? (
              <Lock className="w-3.5 h-3.5" style={{ color: C.muted }} />
            ) : (
              <Award className="w-3.5 h-3.5" style={{ color: C.warn }} />
            )}
          </div>
          <span
            className="text-lg font-extrabold block font-display"
            style={{ color: isGatePassed ? C.ok : !allPriorStepsDone ? C.muted : C.warn }}
          >
            {!allPriorStepsDone ? 'LOCKED' : isGatePassed ? 'PASS' : 'IN PROGRESS'}
          </span>
          <span className="text-[11px]" style={{ color: C.muted }}>
            {!allPriorStepsDone ? 'Prerequisites required' : isGatePassed ? 'Demand verified' : 'Awaiting target'}
          </span>
        </div>
      </div>

      {/* Strategic Recommendation Panel */}
      <div
        className="p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed"
        style={
          isGatePassed
            ? { background: C.okSoft, borderColor: C.okLine, color: C.text }
            : !allPriorStepsDone
            ? { background: C.row, borderColor: C.line, color: C.body }
            : { background: C.warnSoft, borderColor: C.warnLine, color: C.text }
        }
      >
        <div
          className="p-2 rounded-lg shrink-0 mt-0.5 border"
          style={
            isGatePassed
              ? { background: C.ok, color: '#050506', borderColor: C.okLine }
              : !allPriorStepsDone
              ? { background: C.raised, color: C.muted, borderColor: C.line }
              : { background: C.warn, color: '#050506', borderColor: C.warnLine }
          }
        >
          {isGatePassed ? <CheckCircle2 className="w-4 h-4" /> : !allPriorStepsDone ? <Lock className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
        </div>
        <div className="space-y-1">
          <strong className="font-bold block" style={{ color: C.text }}>
            {!allPriorStepsDone
              ? 'Validation Prerequisites Incomplete'
              : isGatePassed
              ? 'Validation Target Achieved — Greenlight Ready'
              : 'Validation in Progress — Awaiting Target Revenue'}
          </strong>
          <p className="text-xs" style={{ color: C.body }}>
            {!allPriorStepsDone
              ? 'The Gate Checkpoint evaluates evidence gathered across the validation lifecycle. Please complete the plan, asset review, creator campaign sprint, and optimization steps before making a final gate decision.'
              : isGatePassed
              ? `The willingness-to-pay threshold of $${presaleTarget.toLocaleString()} was achieved with verified audience demand and a ${Number(dynamicConversionRate || 0).toFixed(1)}% conversion rate. You are ready to advance to Phase 2: Build MVP.`
              : `Collected $${presalesRevenue.toLocaleString()} across ${reservations.length} reservations toward the $${presaleTarget.toLocaleString()} goal. You can test additional messaging/pricing experiments in Step 4, or make an executive decision below.`}
          </p>
        </div>
      </div>

      {/* Co-Founder Decision Controls */}
      <div
        className="p-5 rounded-2xl border space-y-4"
        style={{ background: C.row, borderColor: C.line }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.line }}>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" style={{ color: C.ok }} />
            <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: C.text }}>
              Co-Founder Executive Decision
            </span>
          </div>
          <span className="text-[11px] font-mono" style={{ color: C.muted }}>Choose one path to progress</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Option 1: Build MVP */}
          <button
            type="button"
            disabled={isAdvancingPhase || isIteratingGate || isArchivingProject}
            onClick={async () => {
              if (isAdvancingPhase) return
              setIsAdvancingPhase(true)
              try {
                const notes = `Validation target passed with $${presalesRevenue.toLocaleString()} presales and ${reservations.length} backers.`
                const decisionItem = {
                  id: `gate_${Date.now()}`,
                  decision: 'pass_to_phase2',
                  targetRevenue: presaleTarget,
                  achievedRevenue: presalesRevenue,
                  backersCount: reservations.length,
                  conversionRate: Number(Number(dynamicConversionRate || 0).toFixed(1)),
                  gateStatus: 'passed',
                  notes: notes,
                  decidedAt: new Date().toLocaleString()
                }
                const updated = {
                  ...(project || {}),
                  currentPhase: 2,
                  current_phase: 2,
                  currentStep: 'plan',
                  current_step: 'plan',
                  p1Complete: true,
                  phase1Passed: true,
                  step4Done: true,
                  step5Done: true,
                  status: 'building',
                  gateDecisions: [decisionItem, ...(project?.gateDecisions || [])],
                  decisions: [decisionItem, ...(project?.decisions || [])]
                }
                if (onUpdateProject) onUpdateProject((prev) => ({ ...(prev || {}), ...updated }))

                if (project?.id) {
                  try {
                    await recordGateDecision(project.id, { decision: 'pass_to_phase2', notes })
                    await updateCoLaunchProject(project.id, {
                      currentPhase: 2,
                      current_phase: 2,
                      currentStep: 'plan',
                      current_step: 'plan',
                      p1Complete: true,
                      phase1Passed: true,
                      step4Done: true,
                      step5Done: true,
                      status: 'building'
                    })
                  } catch (e) {
                    console.warn('[Phase1] DB gate decision warning:', e)
                  }
                }
                showNotification('Validation Gate Passed! Advancing to Phase 2: Build MVP.')
                onAdvanceToPhase2?.()
              } finally {
                setIsAdvancingPhase(false)
              }
            }}
            className="py-3 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            style={{ background: C.ok, color: '#050506' }}
          >
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {isAdvancingPhase ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
              )}
              <span className="font-extrabold text-black text-xs whitespace-nowrap">
                {isAdvancingPhase ? 'Advancing to Phase 2...' : 'Build MVP (Advance to Phase 2)'}
              </span>
            </div>
            <span className="text-[10px] font-medium text-black/80 text-center leading-tight">
              Advance to Phase 2 Sprints & Mark Phase 1 Done
            </span>
          </button>

          {/* Option 2: Test Again */}
          <button
            type="button"
            disabled={isAdvancingPhase || isIteratingGate || isArchivingProject}
            onClick={async () => {
              if (isIteratingGate) return
              setIsIteratingGate(true)
              try {
                const notes = 'Resetting validation sprint for new optimization iteration.'
                const decisionItem = {
                  id: `gate_${Date.now()}`,
                  decision: 'iterate_validation',
                  targetRevenue: presaleTarget,
                  achievedRevenue: presalesRevenue,
                  backersCount: reservations.length,
                  conversionRate: Number(Number(dynamicConversionRate || 0).toFixed(1)),
                  gateStatus: 'iterating',
                  notes: notes,
                  decidedAt: new Date().toLocaleString()
                }
                const updated = {
                  ...(project || {}),
                  currentPhase: 1,
                  status: 'validating',
                  gateDecisions: [decisionItem, ...(project?.gateDecisions || [])],
                  decisions: [decisionItem, ...(project?.decisions || [])]
                }
                if (onUpdateProject) onUpdateProject((prev) => ({ ...(prev || {}), ...updated }))

                if (project?.id) {
                  await recordGateDecision(project.id, { decision: 'iterate_validation', notes }).catch((e) => console.warn(e))
                }
                showNotification('Validation sprint reset for new iteration with fresh experiments.')
                handleStepChange('optimize')
              } finally {
                setIsIteratingGate(false)
              }
            }}
            className="py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ background: C.warnSoft, borderColor: C.warnLine, color: C.warn }}
          >
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {isIteratingGate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: C.warn }} />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: C.warn }} />
              )}
              <span className="font-extrabold text-xs whitespace-nowrap" style={{ color: C.warn }}>
                {isIteratingGate ? 'Resetting Sprint...' : 'Test Again (Iterate)'}
              </span>
            </div>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: C.muted }}>
              Run fresh messaging & pricing experiments
            </span>
          </button>

          {/* Option 3: Kill Project */}
          <button
            type="button"
            disabled={isAdvancingPhase || isIteratingGate || isArchivingProject}
            onClick={async () => {
              if (isArchivingProject) return
              if (window.confirm('Are you sure you want to kill and archive this venture?\n\nThis will:\n1. Stop all validation and marketing outreach\n2. Mark venture status as "Killed" and archive it\n3. Initiate refund protocol for backers who reserved/pre-ordered')) {
                setIsArchivingProject(true)
                try {
                  const notes = 'Project failed validation gate threshold. Venture archived and backer refunds initiated.'
                  const decisionItem = {
                    id: `gate_${Date.now()}`,
                    decision: 'kill_project',
                    targetRevenue: presaleTarget,
                    achievedRevenue: presalesRevenue,
                    backersCount: reservations.length,
                    conversionRate: Number(Number(dynamicConversionRate || 0).toFixed(1)),
                    gateStatus: 'killed',
                    notes: notes,
                    decidedAt: new Date().toLocaleString()
                  }
                  const updated = {
                    ...(project || {}),
                    status: 'killed',
                    gateDecisions: [decisionItem, ...(project?.gateDecisions || [])],
                    decisions: [decisionItem, ...(project?.decisions || [])]
                  }
                  if (onUpdateProject) onUpdateProject((prev) => ({ ...(prev || {}), ...updated }))

                  if (project?.id) {
                    await recordGateDecision(project.id, { decision: 'kill_project', notes }).catch((e) => console.warn(e))
                    await updateCoLaunchProject(project.id, { status: 'killed' }).catch((e) => console.warn(e))
                  }
                  showNotification('Project archived and backer refund protocol logged.')
                } finally {
                  setIsArchivingProject(false)
                }
              }
            }}
            className="py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText }}
          >
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {isArchivingProject ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: C.crimsonText }} />
              ) : (
                <Trash2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.crimsonText }} />
              )}
              <span className="font-extrabold text-xs whitespace-nowrap" style={{ color: C.crimsonText }}>
                {isArchivingProject ? 'Archiving Venture...' : 'Kill (Archive)'}
              </span>
            </div>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: C.muted }}>
              Wind down and log backer refund protocol
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

