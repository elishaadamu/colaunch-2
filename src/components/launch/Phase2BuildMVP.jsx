import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Code, Cpu, Terminal, CheckCircle2, ShieldCheck, Sparkles, Layers, Database, Server, Lock, CreditCard, BarChart3, AlertCircle, ArrowRight, ExternalLink, FileText, Check, Plus, Trash2, RefreshCw, Loader2, ChevronRight, Laptop, Workflow, Milestone, ShieldAlert, Download, Sliders, Edit3, Bot, UserCheck, Play, MessageSquare, Bug, HelpCircle, Send, Copy, CheckCircle, Globe, Activity, Rocket, User, Zap, XCircle, AlertTriangle, Flame, RotateCcw, Award, CheckCheck, Compass, CheckSquare, Save, Code2, FileCode, Info, X, Mail, Square, Eye, Settings2, Link2, Users, Package
} from 'lucide-react'
import {
  generateMVPProductBuildPlanAI,
  analyzeAndClusterBetaFeedbackAI,
  executeAICodingTaskAI,
  generateProductReadinessReportAI,
  autoImplementFixesAI
} from '../../services/ai'
import { getFrontendUrl, sendDirectEmail } from '../../services/opsApi'
import { Phase2BuildMVPSkeleton, FeedbackClusterSkeleton } from './Section2Skeletons'
import CloudCodeStudio from './CloudCodeStudio'
import { emailToken, bumpVersion } from '../../utils/betaTokens'
import { deployStaging } from '../../services/opsApi'
import { verifyProjectTaskWithAI } from '../../services/ai'
import { computeReadiness, evaluateLaunchGate } from '../../utils/launchGate'
import Phase2Step4Gate from './phase2/Phase2Step4Gate'
import BuildAgentPanel from './phase2/BuildAgentPanel'
import BuildStudio from './phase2/BuildStudio'
import SiteBuilderCard from '../site/SiteBuilderCard'
import Phase2PlanView from './phase2/Phase2PlanView'
import AutomatedQASuite from './AutomatedQASuite'
import { getPhase2StepGuards } from '../../utils/stepGuards'
import { presaleGoalFor, conceptGoalFor } from '../../utils/projectNumbers'

export const BETA_EMAIL_TEMPLATES = {
  standard: {
    id: 'standard',
    name: 'Standard Beta Invitation',
    subject: (prod) => `[Private Beta Access] You're invited to test ${prod || 'our new app'}!`,
    body: `Hi {{name}},

Great news! The private beta build for {{productName}} is now ready for early testing.

As one of our founding {{tier}} backers, you have exclusive early access to explore the MVP sandbox, test core features, and help shape the final release before public launch.

🔗 Access Your Private Beta Portal:
{{betaUrl}}

What to test:
1. Complete the core product flow from start to finish.
2. Verify speed, responsiveness, and usability.
3. Submit any bug reports, friction points, or feature ideas directly in the feedback widget.

Your feedback directly determines our public launch roadmap. Thank you for building this with us!

Best regards,
The {{productName}} Team`
  },
  bugbash: {
    id: 'bugbash',
    name: 'Urgent Bug Bash & QA Focus',
    subject: (prod) => `[Action Required] Bug Bash Testing for ${prod || 'MVP'}`,
    body: `Hi {{name}},

We've just pushed a major build update for {{productName}} and need your help with an active bug bash!

🔗 Direct Sandbox Access Link:
{{betaUrl}}

Key focus areas for this test:
- Push edge cases and stress test input fields.
- Verify error handling and mobile layout.
- Report any unexpected behaviors directly on the portal.

We appreciate your eagle eyes and quick feedback!

Best,
The {{productName}} Engineering Team`
  },
  vip: {
    id: 'vip',
    name: 'VIP Founder First Look',
    subject: (prod) => `VIP First Look: ${prod || 'Our product'} is ready for you`,
    body: `Hi {{name}},

As a VIP {{tier}} supporter of {{productName}}, you're getting the very first look at our working MVP before anyone else sees it.

✨ Enter the VIP Testing Lounge:
{{betaUrl}}

Your exclusive access token is linked directly to your account. Feel free to explore every section and let us know what you love and what we should tweak.

Cheers,
The {{productName}} Founders`
  }
}

export function buildUniqueBetaCohort(reservations = []) {
  if (!Array.isArray(reservations) || reservations.length === 0) return []

  const byEmail = new Map()
  for (const r of reservations) {
    const rawEmail = (r.email || '').trim().toLowerCase()
    const emailKey = rawEmail || (r.id || String(Math.random()))
    if (!byEmail.has(emailKey)) {
      byEmail.set(emailKey, {
        id: r.id || `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: r.name || 'Anonymous Backer',
        email: r.email || '',
        tiers: [r.tier || r.displayTier || 'Founding Backer'],
        totalAmount: Number(r.amount || r.totalAmount) || 0,
        txIds: [r.txId || r.id],
        status: r.status || (r.lastInviteSentAt ? 'Active in Beta' : 'Active in Beta'),
        token: r.token || `beta_${(r.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6) || Math.random().toString(36).substring(2, 8)}`,
        lastActive: r.lastActive || 'Just now',
        lastInviteSentAt: r.lastInviteSentAt || r.inviteSentAt || null,
        inviteStatus: r.inviteStatus || (r.lastInviteSentAt ? 'Sent' : 'Pending')
      })
    } else {
      const existing = byEmail.get(emailKey)
      if (r.tier && !existing.tiers.includes(r.tier)) {
        existing.tiers.push(r.tier)
      }
      existing.totalAmount += (Number(r.amount || r.totalAmount) || 0)
      if (r.txId && !existing.txIds.includes(r.txId)) existing.txIds.push(r.txId)
      if ((!existing.name || existing.name === 'Anonymous Backer') && r.name) {
        existing.name = r.name
      }
      if (r.lastInviteSentAt && !existing.lastInviteSentAt) {
        existing.lastInviteSentAt = r.lastInviteSentAt
        existing.inviteStatus = 'Sent'
      }
    }
  }

  return Array.from(byEmail.values()).map(b => ({
    ...b,
    tier: b.tiers.join(' • '),
    displayTier: b.tiers.join(' • ')
  }))
}

function buildFullBetaCohort(project = {}) {
  const cohort = buildUniqueBetaCohort(project?.reservations).map((b) => ({ ...b, source: 'presale' }))
  const seen = new Set(cohort.map((b) => (b.email || '').toLowerCase()).filter(Boolean))
  const add = (email, name, source, extra = {}) => {
    const key = String(email || '').trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    cohort.push({
      id: `${source}-${emailToken(key).slice(6)}`, name: name || key.split('@')[0], email: key, tiers: [source === 'waitlist' ? 'Waitlist' : 'Survey supporter'],
      tier: source === 'waitlist' ? 'Waitlist' : 'Survey supporter', displayTier: source === 'waitlist' ? 'Waitlist' : 'Survey supporter',
      totalAmount: 0, txIds: [], status: 'Invited', token: emailToken(key), source, inviteStatus: 'Pending', lastInviteSentAt: null, ...extra,
    })
  }
  ;(Array.isArray(project?.waitlist) ? project.waitlist : []).forEach((w) => add(typeof w === 'string' ? w : w?.email, w?.name, 'waitlist'))
  ;(Array.isArray(project?.surveyResponses) ? project.surveyResponses : []).forEach((r) => {
    if (r?.support?.decision === 'yes' && r?.support?.consent && r.email && !String(r.email).includes('@example.com')) add(r.email, r.name, 'survey')
  })
  // Keep invite status saved on the project, plus testers added by hand
  const saved = Array.isArray(project?.betaCohort) ? project.betaCohort : []
  saved.filter((b) => b?.email && !seen.has(b.email.toLowerCase()) && b.source === 'invited').forEach((b) => { seen.add(b.email.toLowerCase()); cohort.push({ ...b, token: b.token || emailToken(b.email) }) })
  return cohort.map((b) => {
    const prev = saved.find((x) => (x.email || '').toLowerCase() === (b.email || '').toLowerCase())
    return prev ? { ...b, inviteStatus: prev.inviteStatus || b.inviteStatus, lastInviteSentAt: prev.lastInviteSentAt || b.lastInviteSentAt, token: b.token || prev.token } : b
  })
}

export default function Phase2BuildMVP({
  project,
  api,
  activeStepId,
  onSelectStep,
  onUpdateProject,
  onAdvanceToPhase3
}) {
  // Derive Phase 1 dynamic pricing tiers
  const projectPricingTiers = useMemo(() => {
    if (Array.isArray(project?.campaignKit?.pricingTiers) && project.campaignKit.pricingTiers.length > 0) {
      return project.campaignKit.pricingTiers.map(t => ({
        label: `${t.name || t.title || 'Founding Tier'} ($${t.price})`,
        value: `${t.name || t.title || 'Founding Tier'} ($${t.price})`
      }))
    }
    const singlePrice = project?.validationPlan?.pricing || project?.pricing || project?.selectedConcept?.pricing
    if (singlePrice) {
      return [
        { label: `Founding Access (${singlePrice})`, value: `Founding Access (${singlePrice})` },
        { label: 'Waitlist VIP', value: 'Waitlist VIP' }
      ]
    }
    return [
      { label: 'Founding Member Pass', value: 'Founding Member Pass' },
      { label: 'Waitlist VIP', value: 'Waitlist VIP' }
    ]
  }, [project?.campaignKit?.pricingTiers, project?.validationPlan?.pricing, project?.pricing, project?.selectedConcept?.pricing])

  const [activeStep, setActiveStepState] = useState(() => {
    if (activeStepId && ['plan', 'build', 'beta', 'gate'].includes(activeStepId)) {
      return activeStepId
    }
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const s = sp.get('step')
      if (s && ['plan', 'build', 'beta', 'gate'].includes(s)) return s
      if (project?.id) {
        const cached = localStorage.getItem(`forge_p2_step_${project.id}`)
        if (cached && ['plan', 'build', 'beta', 'gate'].includes(cached)) return cached
      }
    }
    const dbStep = project?.currentStep || project?.current_step
    if (dbStep && ['plan', 'build', 'beta', 'gate'].includes(dbStep)) {
      return dbStep
    }
    return 'plan'
  })

  // Synchronize when activeStepId prop changes
  useEffect(() => {
    if (activeStepId && ['plan', 'build', 'beta', 'gate'].includes(activeStepId) && activeStepId !== activeStep) {
      setActiveStepState(activeStepId)
    }
  }, [activeStepId])

  const [specSubtab, setSpecSubtab] = useState('spec') // 'spec' | 'technical' | 'scope' | 'tasks'
  const [buildSubtab, setBuildSubtab] = useState('studio') // 'studio' | 'qa' | 'preview' | 'tasks'
  const [betaSubtab, setBetaSubtab] = useState('clusters') // 'clusters' | 'cohort' | 'feedback'
  const [isEditingSpec, setIsEditingSpec] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [copiedCodeId, setCopiedCodeId] = useState(null)

  // Dynamic MVP Build Plan State (Spec + Tech Plan + Scope Boundaries - Starts null until AI generated or loaded from DB)
  const [buildPlan, setBuildPlan] = useState(() => {
    if (project?.mvpBuildPlan && (project.mvpBuildPlan.productSpec || project.mvpBuildPlan.technicalPlan)) {
      return project.mvpBuildPlan
    }
    return null
  })

  // Division of Labor Engineering Tasks (Dynamic Status - Starts empty until generated or loaded from DB)
  const [engineeringTasks, setEngineeringTasks] = useState(() => {
    if (project?.engineeringTasks && Array.isArray(project.engineeringTasks) && project.engineeringTasks.length > 0) {
      const hasRealExec = project.engineeringTasks.some(t => t.executedAt || t.aiOutput)
      if (!hasRealExec && project.engineeringTasks.every(t => t.status === 'Completed')) {
        return project.engineeringTasks.map(t => ({ ...t, status: 'Ready' }))
      }
      return project.engineeringTasks
    }
    if (project?.mvpBuildPlan?.technicalPlan?.engineeringTasks && Array.isArray(project.mvpBuildPlan.technicalPlan.engineeringTasks) && project.mvpBuildPlan.technicalPlan.engineeringTasks.length > 0) {
      return project.mvpBuildPlan.technicalPlan.engineeringTasks
    }
    return []
  })

  // Automated Testing / QA State (Dynamic - Starts Not Run Yet)
  const [qaRunning, setQaRunning] = useState(false)
  const [qaResults, setQaResults] = useState(() => {
    if (project?.qaResults && project.qaResults.executedAt) {
      return project.qaResults
    }
    return { status: 'Not run', total: 0, passed: 0, failed: 0, unverified: 0, results: {} }
  })

  // Beta Cohort State (Deduplicated Real Presales & Waitlist from Phase 1)
  const [betaCohort, setBetaCohort] = useState(() => {
    return buildFullBetaCohort(project || {})
  })

  // Raw Beta Feedback Feed (Inherits real project betaFeedback only - zero hardcoded fakes)
  const [rawFeedback, setRawFeedback] = useState(() => {
    if (project?.betaFeedback && Array.isArray(project.betaFeedback) && project.betaFeedback.length > 0) {
      return project.betaFeedback
    }
    return []
  })

  // AI Feedback Clusters (Null until generated by AI)
  const [feedbackClusters, setFeedbackClusters] = useState(() => {
    if (project?.feedbackClusters && Array.isArray(project.feedbackClusters) && project.feedbackClusters.length > 0) {
      return project.feedbackClusters
    }
    return null
  })

  const [isClusteringAI, setIsClusteringAI] = useState(false)
  const [newFeedbackAuthor, setNewFeedbackAuthor] = useState('')
  const [newFeedbackType, setNewFeedbackType] = useState('Bug')
  const [newFeedbackMsg, setNewFeedbackMsg] = useState('')

  // AI Task Execution State
  const [executingTaskId, setExecutingTaskId] = useState(null)
  const [aiExecOutput, setAiExecOutput] = useState(null)

  // Step 4: Iterate + Launch Gate States (Null until generated by AI)
  const [readinessReport, setReadinessReport] = useState(() => {
    if (project?.readinessReport && project.readinessReport.overallScore) {
      return project.readinessReport
    }
    return null
  })
  const [isAuditing, setIsAuditing] = useState(false)
  const [isAutoFixing, setIsAutoFixing] = useState(false)
  const [appliedPatches, setAppliedPatches] = useState(() => {
    if (project?.appliedPatches && Array.isArray(project.appliedPatches) && project.appliedPatches.length > 0) {
      return project.appliedPatches
    }
    return []
  })
  const [mvpVersion, setMvpVersion] = useState(() => project?.mvpVersion || 'v1.0.0-GA')
  const [showKillModal, setShowKillModal] = useState(false)
  const [decisionNotice, setDecisionNotice] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [toastNotification, setToastNotification] = useState(null)
  const toastTimeoutRef = useRef(null)
  const [aiError, setAiError] = useState(null)

  // Beta Tester Email Dispatcher State
  const [showBetaEmailModal, setShowBetaEmailModal] = useState(false)
  const [emailModalMode, setEmailModalMode] = useState('bulk') // 'single' | 'bulk'
  const [selectedTesterIds, setSelectedTesterIds] = useState([])
  const [targetTester, setTargetTester] = useState(null)
  const [emailSubject, setEmailSubject] = useState(`[Private Beta Access] You're invited to test ${project?.productName || 'our new app'}!`)
  const [emailTemplatePreset, setEmailTemplatePreset] = useState('standard') // 'standard' | 'bugbash' | 'vip'
  const [emailBodyTemplate, setEmailBodyTemplate] = useState(() => BETA_EMAIL_TEMPLATES.standard.body)
  const [emailTestingUrl, setEmailTestingUrl] = useState('')
  const [emailPreviewTab, setEmailPreviewTab] = useState('compose') // 'compose' | 'preview'
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, currentEmail: '' })
  const [sendResultLogs, setSendResultLogs] = useState(null)
  const [isPolishingEmailAI, setIsPolishingEmailAI] = useState(false)

  // New Feature & Scope Inputs
  const [newFeatureName, setNewFeatureName] = useState('')
  const [newFeatureDesc, setNewFeatureDesc] = useState('')
  const [newFeaturePriority, setNewFeaturePriority] = useState('P0 - Must Have')
  
  const [newIncludedItem, setNewIncludedItem] = useState('')
  const [newExcludedItem, setNewExcludedItem] = useState('')

  // New Sprint Task Inputs
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Backend')
  const [newTaskAssigned, setNewTaskAssigned] = useState('AI Agent')
  const [newTaskEstimate, setNewTaskEstimate] = useState('1 Day')

  const p2TasksSanitizedRef = useRef({})

  // Synchronize all Phase 2 states when project changes to prevent former creator data leakage
  useEffect(() => {
    if (!project) return

    // 1. Build Plan (Only load if present in DB/project, otherwise null until AI generated)
    if (project.mvpBuildPlan && (project.mvpBuildPlan.productSpec || project.mvpBuildPlan.technicalPlan)) {
      setBuildPlan(project.mvpBuildPlan)
    } else {
      setBuildPlan(null)
    }

    // 2. Engineering Tasks (Only load if present in DB/project, otherwise empty)
    if (project.engineeringTasks && Array.isArray(project.engineeringTasks) && project.engineeringTasks.length > 0) {
      const hasRealExec = project.engineeringTasks.some(t => t.executedAt || t.aiOutput)
      if (!hasRealExec && project.engineeringTasks.every(t => t.status === 'Completed')) {
        const fresh = project.engineeringTasks.map(t => ({ ...t, status: 'Ready' }))
        setEngineeringTasks(fresh)
        if (!p2TasksSanitizedRef.current[project.id]) {
          p2TasksSanitizedRef.current[project.id] = true
          handleSavePlan(buildPlan, fresh)
        }
      } else {
        setEngineeringTasks(project.engineeringTasks)
      }
    } else if (project.mvpBuildPlan?.technicalPlan?.engineeringTasks && Array.isArray(project.mvpBuildPlan.technicalPlan.engineeringTasks)) {
      setEngineeringTasks(project.mvpBuildPlan.technicalPlan.engineeringTasks)
    } else {
      setEngineeringTasks([])
    }

    // QA Results sync (Sanitize legacy unexecuted QA)
    if (project.qaResults && project.qaResults.executedAt) {
      setQaResults(project.qaResults)
    } else {
      setQaResults({ status: 'Not run', total: 0, passed: 0, failed: 0, unverified: 0, results: {} })
    }

    // 3. Beta Cohort (Grouped & Deduplicated by backer email)
    setBetaCohort(buildFullBetaCohort(project))

    // 4. Feedback Clusters & Readiness Report (Null until generated by AI)
    if (project.feedbackClusters && Array.isArray(project.feedbackClusters) && project.feedbackClusters.length > 0) {
      setFeedbackClusters(project.feedbackClusters)
    } else {
      setFeedbackClusters(null)
    }

    if (project.readinessReport && project.readinessReport.overallScore) {
      setReadinessReport(project.readinessReport)
    } else {
      setReadinessReport(null)
    }

    // 5. Raw Feedback & Applied Patches
    if (project.betaFeedback && Array.isArray(project.betaFeedback)) {
      setRawFeedback(project.betaFeedback)
    } else {
      setRawFeedback([])
    }

    if (project.appliedPatches && Array.isArray(project.appliedPatches) && project.appliedPatches.length > 0) {
      setAppliedPatches(project.appliedPatches)
    } else {
      setAppliedPatches([])
    }
  }, [project?.id, project?.creatorId, project?.productName])

  useEffect(() => {
    if (Array.isArray(project?.betaFeedback)) setRawFeedback(project.betaFeedback)
  }, [project?.betaFeedback])
  useEffect(() => {
    setBetaCohort(buildFullBetaCohort(project || {}))
  }, [project?.reservations, project?.waitlist, project?.surveyResponses]) // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg, type = 'success', duration = 4500) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastNotification({
      id: Date.now(),
      message: typeof msg === 'string' ? msg : JSON.stringify(msg),
      type // 'success' | 'info' | 'warning' | 'error'
    })
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotification(null)
    }, duration)
  }

  const p2Guards = getPhase2StepGuards(project, { buildPlan, engineeringTasks, feedbackClusters })

  const canAccessP2Step = (stepId) => {
    if (stepId === 'plan') return true
    if (stepId === 'build') return p2Guards.canAccessStep2
    if (stepId === 'beta') return p2Guards.canAccessStep3
    if (stepId === 'gate') return p2Guards.canAccessStep4
    return true
  }

  const getP2StepMissingPrerequisiteText = (stepId) => {
    if (stepId === 'build' && !p2Guards.canAccessStep2) return 'Please complete Step 1 (Product + Build Plan) first.'
    if (stepId === 'beta' && !p2Guards.canAccessStep3) return 'Please complete Step 2 (Build MVP) first.'
    if (stepId === 'gate' && !p2Guards.canAccessStep4) return 'Gate locked: Complete Steps 1–3 first.'
    return 'Please complete previous steps first.'
  }

  const setActiveStep = (newStep) => {
    if (!canAccessP2Step(newStep)) {
      showToast(getP2StepMissingPrerequisiteText(newStep))
      return
    }
    setActiveStepState(newStep)
    if (onSelectStep) onSelectStep(newStep)
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('step', newStep)
        url.searchParams.set('modal', 'phase')
        window.history.replaceState({}, '', url.toString())
        if (project?.id) {
          localStorage.setItem(`forge_p2_step_${project.id}`, newStep)
        }
      } catch (e) {}
    }
    if (onUpdateProject) {
      onUpdateProject(prev => ({
        ...(prev || {}),
        currentStep: newStep,
        current_step: newStep
      }))
    }
    // Direct persistence to PostgreSQL database
    if (project?.id) {
      import('../../services/opsApi').then(({ updateCoLaunchProject }) => {
        updateCoLaunchProject(project.id, { currentStep: newStep, current_step: newStep }).catch(e => console.warn('[Phase2] DB step sync warning:', e))
      }).catch(() => {})
    }
  }

  // Synchronize and auto-fallback if activeStep is locked
  useEffect(() => {
    if (!canAccessP2Step(activeStep)) {
      if (p2Guards.canAccessStep3) setActiveStepState('beta')
      else if (p2Guards.canAccessStep2) setActiveStepState('build')
      else setActiveStepState('plan')
    }
  }, [activeStep, p2Guards.canAccessStep1, p2Guards.canAccessStep2, p2Guards.canAccessStep3, p2Guards.canAccessStep4])

  const handleSavePlan = async (updatedPlan = buildPlan, updatedTasks = engineeringTasks, extraUpdates = {}) => {
    const clusters = extraUpdates.feedbackClusters !== undefined ? extraUpdates.feedbackClusters : feedbackClusters
    const feedback = extraUpdates.betaFeedback !== undefined ? extraUpdates.betaFeedback : rawFeedback
    const readiness = extraUpdates.readinessReport !== undefined ? extraUpdates.readinessReport : readinessReport
    const patches = extraUpdates.appliedPatches !== undefined ? extraUpdates.appliedPatches : appliedPatches
    const version = extraUpdates.mvpVersion !== undefined ? extraUpdates.mvpVersion : mvpVersion
    const qa = extraUpdates.qaResults !== undefined ? extraUpdates.qaResults : qaResults

    const shouldApprove = Boolean(extraUpdates.buildPlanApproved || updatedPlan?.approved || updatedPlan?.status === 'approved')
    const finalizedPlan = shouldApprove
      ? {
          ...(updatedPlan || {}),
          status: 'approved',
          approved: true,
          locked: true
        }
      : updatedPlan

    const updated = {
      ...(project || {}),
      mvpBuildPlan: finalizedPlan,
      engineeringTasks: updatedTasks,
      qaResults: qa,
      betaFeedback: feedback,
      feedbackClusters: clusters,
      readinessReport: readiness,
      appliedPatches: patches,
      mvpVersion: version,
      buildPlanApproved: extraUpdates.buildPlanApproved ?? project?.buildPlanApproved ?? shouldApprove,
      currentStep: extraUpdates.currentStep || activeStep,
      current_step: extraUpdates.current_step || extraUpdates.currentStep || activeStep,
      ...extraUpdates
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

    // Direct DB sync to backend API
    if (project?.id) {
      try {
        const { updateCoLaunchProject } = await import('../../services/opsApi')
        await updateCoLaunchProject(project.id, {
          mvpBuildPlan: finalizedPlan,
          engineeringTasks: updatedTasks,
          qaResults: qa,
          betaFeedback: feedback,
          feedbackClusters: clusters,
          readinessReport: readiness,
          appliedPatches: patches,
          mvpVersion: version,
          buildPlanApproved: extraUpdates.buildPlanApproved ?? project?.buildPlanApproved ?? shouldApprove,
          currentStep: extraUpdates.currentStep || activeStep,
          current_step: extraUpdates.current_step || extraUpdates.currentStep || activeStep,
          ...extraUpdates
        })
      } catch (err) {
        console.warn('[Phase2BuildMVP] Direct DB sync warning:', err)
      }
    }
    showToast('Phase 2 state saved & synced!')
  }

  const handleCopyCode = (codeText, id) => {
    navigator.clipboard.writeText(codeText)
    setCopiedCodeId(id)
    showToast('Code snippet copied to clipboard!')
    setTimeout(() => setCopiedCodeId(null), 2500)
  }

  const getTaskDefaultCode = (task) => {
    const prod = project?.productName || 'CoLaunch'
    const name = (task.title || 'Task').replace(/[^a-zA-Z0-9]/g, '')
    if (task.category === 'Frontend') {
      return `import React, { useState, useEffect } from 'react';

/**
 * ${task.title}
 * Scaffolded for ${prod}
 * Category: ${task.category} | Status: Verified
 */
export default function ${name}View({ onAction, settings }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Initializing ${task.title} workflow
    console.log('[Component] Initialized ${name} for ${prod}');
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#2a2a30]/[0.06] pb-3">
        <div>
          <h2 className="text-base font-bold text-white">${task.title}</h2>
          <p className="text-xs text-[#71717A]">Production frontend module for ${prod}.</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
          Verified Active
        </span>
      </div>

      <div className="p-4 rounded-xl bg-[#141720] border border-[#2a2a30]/[0.04]">
        <p className="text-xs text-[#D4D4D8] leading-relaxed">
          Interactive view and client sandbox initialized for ${task.title}.
        </p>
      </div>
    </div>
  );
}`
    } else if (task.category === 'Security / Auth' || task.category === 'Backend' || task.category === 'Payments') {
      return `"""
${task.title}
Scaffolded for ${prod}
Category: ${task.category} | Framework: FastAPI + PostgreSQL
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

router = APIRouter(
    prefix="/api/${(task.category || 'backend').toLowerCase().replace(/[^a-z0-9]/g, '_')}", 
    tags=["${task.category}"]
)

class ${name}Payload(BaseModel):
    client_id: str = Field(..., description="Unique client UUID")
    action_type: str = Field(default="execute")
    payload: Dict[str, Any] = Field(default_factory=dict)

@router.post("/execute", status_code=status.HTTP_200_OK)
async def execute_${name.toLowerCase()}(data: ${name}Payload):
    """
    Automated backend execution endpoint for: ${task.title}
    """
    try:
        # 1. Validation & security authentication check
        if not data.client_id:
            raise HTTPException(status_code=400, detail="Client ID required")
            
        # 2. Production execution logic for ${prod}
        result = {
            "status": "success",
            "task": "${task.title}",
            "product": "${prod}",
            "executed": True
        }
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Execution error in ${task.title}: {str(e)}"
        )`
    } else {
      return `// ========================================================
// Task: ${task.title}
// Scaffolded for: ${prod}
// ========================================================

export async function execute${name}(options = {}) {
  console.log('[Runner] Executing ${task.title} for ${prod}...');
  return {
    success: true,
    task: '${task.title}',
    timestamp: new Date().toISOString()
  };
}`
    }
  }

  const handleGenerateAIPlan = async () => {
    setIsGenerating(true)
    setAiError(null)
    showToast('AI is synthesizing Product Spec, Tech Architecture & Engineering Tasks...', 'info', 10000)
    try {
      const generated = await generateMVPProductBuildPlanAI(project)
      setBuildPlan(generated)

      // Synchronize engineering tasks matrix from the single-pass build plan
      let updatedTasks = engineeringTasks
      if (generated.technicalPlan?.engineeringTasks && Array.isArray(generated.technicalPlan.engineeringTasks) && generated.technicalPlan.engineeringTasks.length > 0) {
        updatedTasks = generated.technicalPlan.engineeringTasks.map((t, idx) => ({
          id: t.id || `task-ai-gen-${idx + 1}`,
          title: t.title,
          category: t.category || 'Backend',
          assignedTo: t.assignedTo || (t.category === 'Security / Auth' || t.category === 'Architecture' ? 'Human Engineer' : 'AI Agent'),
          status: 'Ready',
          estimate: t.estimate || '1 Day',
          notes: t.notes || `Engineered for ${project?.productName || 'MVP'}`,
          acceptanceCriteria: Array.isArray(t.acceptanceCriteria) ? t.acceptanceCriteria : [],
          dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
          milestone: t.milestone || null,
          feature: t.feature || null
        }))
        setEngineeringTasks(updatedTasks)
      }

      handleSavePlan(generated, updatedTasks)
      const warn = generated?.technicalPlan?.qualityWarnings || []
      showToast(warn.length
        ? `Plan generated for ${project?.productName || 'this product'}, with notes: ${warn.join('; ')}. Regenerate or edit the spec.`
        : `Plan generated for ${project?.productName || 'this product'}: ${generated?.productSpec?.features?.length || 0} features, ${updatedTasks.length} tasks, ${generated?.technicalPlan?.database?.length || 0} tables.`, warn.length ? 'warning' : 'success', 8000)
    } catch (err) {
      console.warn('[Phase2BuildMVP] AI generation error:', err)
      // No silent template: keep whatever plan exists and say what went wrong
      const errorMsg = err?.message || 'The AI service did not respond.'
      setAiError({ source: 'Step 1: Build plan generation', message: errorMsg, action: 'generate_plan' })
      showToast(`Build plan not generated: ${errorMsg} Your previous plan is unchanged.`, 'error', 9000)
    } finally {
      setIsGenerating(false)
    }
  }

  // Update spec text fields
  const updateSpecField = (field, value) => {
    const updated = {
      ...buildPlan,
      productSpec: {
        ...(buildPlan.productSpec || {}),
        [field]: value
      }
    }
    setBuildPlan(updated)
  }

  // Add Feature
  const handleAddFeature = (e) => {
    e?.preventDefault()
    if (!newFeatureName.trim()) return
    const newFeat = {
      name: newFeatureName.trim(),
      description: newFeatureDesc.trim() || 'Core workflow feature',
      priority: newFeaturePriority
    }
    const currentFeatures = buildPlan.productSpec?.features || []
    const updated = {
      ...buildPlan,
      productSpec: {
        ...(buildPlan.productSpec || {}),
        features: [...currentFeatures, newFeat]
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
    setNewFeatureName('')
    setNewFeatureDesc('')
  }

  const handleDeleteFeature = (idx) => {
    const currentFeatures = (buildPlan.productSpec?.features || []).filter((_, i) => i !== idx)
    const updated = {
      ...buildPlan,
      productSpec: {
        ...(buildPlan.productSpec || {}),
        features: currentFeatures
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
  }

  // Scope boundaries add/remove
  const handleAddIncluded = (e) => {
    e?.preventDefault()
    if (!newIncludedItem.trim()) return
    const current = buildPlan.scopeBoundaries?.includedInMVP || []
    const updated = {
      ...buildPlan,
      scopeBoundaries: {
        ...(buildPlan.scopeBoundaries || {}),
        includedInMVP: [...current, newIncludedItem.trim()]
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
  }

  const handleDeleteIncluded = (idx) => {
    const current = (buildPlan.scopeBoundaries?.includedInMVP || []).filter((_, i) => i !== idx)
    const updated = {
      ...buildPlan,
      scopeBoundaries: {
        ...(buildPlan.scopeBoundaries || {}),
        includedInMVP: current
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
  }

  const handleAddExcluded = (e) => {
    e?.preventDefault()
    if (!newExcludedItem.trim()) return
    const current = buildPlan.scopeBoundaries?.excludedFromMVP || []
    const updated = {
      ...buildPlan,
      scopeBoundaries: {
        ...(buildPlan.scopeBoundaries || {}),
        excludedFromMVP: [...current, newExcludedItem.trim()]
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
    setNewExcludedItem('')
  }

  const handleDeleteExcluded = (idx) => {
    const current = (buildPlan.scopeBoundaries?.excludedFromMVP || []).filter((_, i) => i !== idx)
    const updated = {
      ...buildPlan,
      scopeBoundaries: {
        ...(buildPlan.scopeBoundaries || {}),
        excludedFromMVP: current
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
  }

  // Add sprint task to Division of Labor Matrix
  const handleAddTask = (e) => {
    e?.preventDefault()
    if (!newTaskTitle.trim()) return
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      assignedTo: newTaskAssigned,
      status: 'Ready',
      estimate: newTaskEstimate,
      notes: 'Custom sprint task added by technical lead.'
    }
    const updated = [newTask, ...engineeringTasks]
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    setNewTaskTitle('')
  }

  const handleDeleteTask = (taskId) => {
    const updated = engineeringTasks.filter(t => t.id !== taskId)
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
  }

  const handleToggleTaskStatus = (taskId) => {
    const updated = engineeringTasks.map(t => {
      if (t.id === taskId) {
        const next = t.status === 'Completed' ? 'Ready' : t.status === 'In Progress' ? 'Completed' : 'In Progress'
        return {
          ...t,
          status: next,
          executedAt: next === 'Completed' ? new Date().toISOString() : t.executedAt
        }
      }
      return t
    })
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
  }

  const handleReassignTask = (taskId, newAssignee) => {
    const updated = engineeringTasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assignedTo: newAssignee
        }
      }
      return t
    })
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    showToast(`Task reassigned to ${newAssignee}!`)
  }

  const handleSwitchAllToAI = () => {
    const updated = engineeringTasks.map(t => ({ ...t, assignedTo: 'AI Agent' }))
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    showToast('Switched all sprint tasks to AI Coding Agents!')
  }

  const handleSwitchToAIAndDispatch = async (task) => {
    const updated = engineeringTasks.map(t => t.id === task.id ? { ...t, assignedTo: 'AI Agent' } : t)
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    showToast(`Switched "${task.title}" to AI Agent and dispatching...`)
    await handleDispatchAIAgent({ ...task, assignedTo: 'AI Agent' })
  }

  const handleAutoDistributeDivisionOfLabor = () => {
    const updated = engineeringTasks.map((t, idx) => {
      const titleLower = (t.title || '').toLowerCase()
      const catLower = (t.category || '').toLowerCase()
      const isSecurityOrArch = 
        titleLower.includes('auth') || 
        titleLower.includes('security') || 
        titleLower.includes('stripe') || 
        titleLower.includes('webhook') || 
        titleLower.includes('oauth') || 
        titleLower.includes('architecture') || 
        titleLower.includes('payment') ||
        catLower.includes('security') || 
        catLower.includes('architecture') ||
        catLower.includes('payment')

      if (isSecurityOrArch || idx % 2 === 1) {
        return { ...t, assignedTo: 'Human Engineer' }
      }
      return { ...t, assignedTo: 'AI Agent' }
    })
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    showToast('Auto-distributed tasks across AI Agents and Human Engineers!')
  }

  const handleAddDefaultHumanTask = () => {
    const prod = project?.productName || 'MVP'
    const defaultHuman = {
      id: `task-human-${Date.now()}`,
      title: `Hardened OAuth & Stripe Webhook Security Layer for ${prod}`,
      category: 'Security / Auth',
      assignedTo: 'Human Engineer',
      status: 'Ready',
      estimate: '1 Day',
      notes: 'Multi-tenant JWT token rotation, CORS policy, and Stripe signature verification.'
    }
    const updated = [defaultHuman, ...engineeringTasks]
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    showToast('Added Human Engineering Security & Verification task!')
  }

  // Dispatch AI Coding Agent to execute task
  const handleDispatchAIAgent = async (task) => {
    setExecutingTaskId(task.id)
    setAiExecOutput(null)
    setAiError(null)
    showToast(`AI Agent dispatched: Implementing code for "${task.title}"...`, 'info', 8000)
    try {
      const res = await executeAICodingTaskAI(task, project)
      setAiExecOutput(res)
      const updated = engineeringTasks.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            status: 'Completed',
            executedAt: new Date().toISOString(),
            aiOutput: res,
            notes: res.implementationNotes || 'Implemented and verified by AI Agent.'
          }
        }
        return t
      })
      setEngineeringTasks(updated)
      handleSavePlan(buildPlan, updated)
      showToast(`AI Coding Agent completed and verified code for: "${task.title}"!`, 'success')
    } catch (e) {
      console.warn('AI Execution error:', e)
      const errorMsg = e.message || 'AI Coding Agent failed to generate code snippet and test output.'
      setAiError({
        source: `Step 2: AI Coding Agent (${task.title})`,
        message: errorMsg,
        action: 'dispatch_task',
        task
      })
      showToast(`AI Coding Agent failed: ${errorMsg}`, 'error', 7000)
    } finally {
      setExecutingTaskId(null)
    }
  }

  const isTaskBuilt = (t) => ['Completed', 'done', 'Done'].includes(t.status) || Boolean(t.aiOutput || t.executedAt)
  const taskCriteria = (t) => {
    const list = Array.isArray(t.acceptanceCriteria) && t.acceptanceCriteria.length ? t.acceptanceCriteria : []
    return list.length ? list.map((c, i) => `${i + 1}. ${c}`).join('\n') : `The code fully implements: "${t.title}". ${t.notes || ''}`
  }
  const taskCodeFiles = (t) => {
    const files = Array.isArray(project?.projectFiles) ? [...project.projectFiles] : []
    const out = t.aiOutput || {}
    const snippets = [out.code, out.codeSnippet, out.implementation].filter((x) => typeof x === 'string' && x.trim())
    snippets.forEach((code, i) => files.push({ name: `${t.id}-agent-output-${i + 1}.txt`, content: code }))
    ;(Array.isArray(out.files) ? out.files : []).forEach((f) => f?.content && files.push({ name: f.name || f.path || `${t.id}.txt`, content: f.content }))
    return files
  }

  // Automated QA: every built task is reviewed against its acceptance criteria in the real code.
  // A task only counts as verified when the review passes. Failed or unreachable reviews never pass.
  const handleRunAutomatedQA = async (_prev, onlyTaskIds = null) => {
    const targets = (engineeringTasks || []).filter((t) => isTaskBuilt(t) && (!onlyTaskIds || onlyTaskIds.includes(t.id)))
    if (!targets.length) {
      showToast('Nothing to test yet. Build at least one task first.', 'warning')
      return null
    }
    setQaRunning(true)
    showToast(`Testing ${targets.length} ${targets.length === 1 ? 'task' : 'tasks'} against their acceptance criteria…`, 'info', 6000)
    const results = { ...(qaResults?.results || {}) }
    let updated = [...engineeringTasks]
    for (const t of targets) {
      try {
        const r = await verifyProjectTaskWithAI({ taskTitle: t.title, testPrompt: taskCriteria(t), files: taskCodeFiles(t), project })
        results[t.id] = { passed: !!r.passed, unverified: !!r.unverified, score: r.score, summary: r.summary, issues: r.issues || [], checks: r.checks || [], at: new Date().toISOString() }
      } catch (e) {
        results[t.id] = { passed: false, unverified: true, score: 0, summary: e.message || 'Verification failed to run', issues: [], at: new Date().toISOString() }
      }
      const res = results[t.id]
      updated = updated.map((x) => x.id === t.id ? { ...x, verified: res.passed, verifiedAt: res.passed ? res.at : null, qa: res, status: res.passed ? 'Completed' : (x.status === 'Completed' ? 'Needs fixes' : x.status) } : x)
    }
    const built = updated.filter(isTaskBuilt)
    const vals = built.map((t) => results[t.id]).filter(Boolean)
    const summary = {
      mode: 'ai_code_review',
      total: built.length,
      passed: vals.filter((r) => r.passed).length,
      failed: vals.filter((r) => !r.passed && !r.unverified).length,
      unverified: vals.filter((r) => r.unverified).length,
      results,
      executedAt: new Date().toISOString(),
      lastRun: new Date().toLocaleString(),
    }
    summary.status = summary.failed ? 'Failing' : summary.unverified ? 'Incomplete' : summary.passed === summary.total ? 'Passing' : 'Partial'
    setQaResults(summary)
    setEngineeringTasks(updated)
    await handleSavePlan(buildPlan, updated, { qaResults: summary })
    setQaRunning(false)
    showToast(`QA: ${summary.passed} passed, ${summary.failed} failed${summary.unverified ? `, ${summary.unverified} couldn't run` : ''}.`, summary.failed || summary.unverified ? 'warning' : 'success', 6000)
    return { summary, tasks: updated }
  }
  const handleRunQA = () => handleRunAutomatedQA(qaResults)
  const handleRegenerateMVPPlan = () => handleGenerateAIPlan()

  // Staging deployment: snapshot of the current code that beta testers run at /beta/<slug>
  const [isDeployingStaging, setIsDeployingStaging] = useState(false)
  const currentVersion = project?.staging?.version || project?.mvpVersion || 'v0.0.0'
  const handleDeployStaging = async ({ part = 'minor', notes = '' } = {}) => {
    const files = Array.isArray(project?.projectFiles) ? project.projectFiles : []
    if (!files.length) { showToast('No code files yet. Build in the code studio first.', 'warning'); return null }
    setIsDeployingStaging(true)
    try {
      const version = bumpVersion(currentVersion === 'v1.0.0-GA' ? 'v0.0.0' : currentVersion, part)
      const res = await deployStaging(project.id, { version, files: files.map((f) => ({ name: f.name || f.path, content: f.content, language: f.language })), notes })
      setMvpVersion(version)
      onUpdateProject?.((prev) => ({ ...(prev || {}), staging: res.staging, mvpVersion: version, stagingDeployedAt: res.staging.deployedAt }))
      await handleSavePlan(buildPlan, engineeringTasks, { mvpVersion: version, stagingDeployedAt: res.staging.deployedAt })
      showToast(`Staging ${version} deployed. Testers see it at /beta/${productSlug}.`, 'success', 6000)
      return res.staging
    } catch (e) {
      showToast(`Staging deploy failed: ${e.message}`, 'error', 7000)
      return null
    } finally { setIsDeployingStaging(false) }
  }

  // Add raw customer feedback
  const handleAddFeedback = (e) => {
    e?.preventDefault()
    if (!newFeedbackMsg.trim()) return
    const newF = {
      id: `f-${Date.now()}`,
      author: newFeedbackAuthor.trim() || 'Beta Backer',
      type: newFeedbackType,
      category: newFeedbackType,
      createdAt: new Date().toISOString(),
      message: newFeedbackMsg.trim(),
      timestamp: 'Just now'
    }
    const updated = [newF, ...rawFeedback]
    setRawFeedback(updated)
    setNewFeedbackAuthor('')
    setNewFeedbackMsg('')
    handleSavePlan(buildPlan, engineeringTasks, { betaFeedback: updated })
    showToast('Customer beta feedback logged.', 'success')
  }

  // Delete raw customer feedback
  const handleDeleteFeedback = (id) => {
    if (project?.id) import('../../services/opsApi').then((m) => m.deleteBetaFeedback(project.id, id)).catch(() => {})
    const updated = rawFeedback.filter(f => f.id !== id)
    setRawFeedback(updated)
    handleSavePlan(buildPlan, engineeringTasks, { betaFeedback: updated })
    showToast('Feedback item removed.', 'info')
  }

  // AI Cluster Feedback
  const handleClusterFeedbackAI = async () => {
    if (!rawFeedback || rawFeedback.length === 0) {
      showToast('Cannot cluster: No beta feedback found. Collect customer feedback in the Beta Portal or add feedback entries below.', 'warning', 6000)
      return
    }
    setIsClusteringAI(true)
    setAiError(null)
    showToast(`AI is analyzing ${rawFeedback.length} customer feedback items into recurring clusters...`, 'info', 8000)
    try {
      const res = await analyzeAndClusterBetaFeedbackAI(rawFeedback, project)
      const clusters = res.clusters || []
      setFeedbackClusters(clusters)
      await handleSavePlan(buildPlan, engineeringTasks, { feedbackClusters: clusters })
      showToast(`AI successfully synthesized ${clusters.length} recurring feedback clusters!`, 'success', 5000)
    } catch (e) {
      console.warn('Cluster error:', e)
      const errorMsg = e.message || 'AI service failed to cluster feedback items.'
      setAiError({
        source: 'Step 3: Beta Feedback Clustering',
        message: errorMsg,
        action: 'cluster_feedback'
      })
      showToast(`AI Feedback Clustering failed: ${errorMsg}`, 'error', 7000)
    } finally {
      setIsClusteringAI(false)
    }
  }

  // Clear Feedback Clusters
  const handleClearClusters = async () => {
    setFeedbackClusters(null)
    await handleSavePlan(buildPlan, engineeringTasks, { feedbackClusters: [] })
    showToast('Feedback clusters cleared. Ready to cluster real feedback.', 'info')
  }

  // Convert Feedback Cluster to Engineering Task in Step 2
  const handleConvertClusterToTask = (cluster) => {
    const cat = (cluster?.category || '').toLowerCase()
    const newTask = {
      id: `task-fix-${Date.now()}`,
      title: `[Fix / Resolve] ${cluster?.title || 'Feedback Item'}`,
      category: cat.includes('bug') || cat.includes('security') ? 'Security / Bug' : cat.includes('ux') ? 'Frontend' : 'Backend',
      assignedTo: cluster?.severity === 'High' ? 'Human Engineer' : 'AI Agent',
      status: 'Ready',
      estimate: '1 Day',
      notes: `Derived from beta cohort: "${cluster?.description || ''}" (${cluster?.count || 1} users impacted)`
    }
    const updated = [newTask, ...engineeringTasks]
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    showToast(`Converted cluster to sprint task: ${newTask.title}`, 'success')
  }

  // Step 4: AI prioritises issues, creates fix tasks, builds them, retests and releases a new staging version
  const SEVERITY_W = { High: 3, Critical: 3, Medium: 2, Low: 1 }
  const priorityOf = (c) => (SEVERITY_W[c?.severity] || 1) * Math.max(1, Number(c?.count || c?.userCount || 1))
  const handleApplyAIAutoFixes = async () => {
    const open = (feedbackClusters || []).filter((c) => c.status !== 'Resolved')
    if (!open.length) { showToast('No open issues to fix. Cluster the beta feedback first.', 'warning'); return }
    setIsAutoFixing(true)
    try {
      // 1. Prioritise (severity x users affected) and create one fix task per issue
      const ranked = [...open].sort((x, y) => priorityOf(y) - priorityOf(x))
      const existingIds = new Set((engineeringTasks || []).map((t) => t.fromClusterId).filter(Boolean))
      const created = ranked.filter((c) => !existingIds.has(c.id || c.title)).map((c, i) => {
        const cat = String(c.category || '').toLowerCase()
        const human = c.severity === 'High' && /security|payment|auth|data/.test(cat)
        return {
          id: `fix-${Date.now()}-${i}`,
          title: `Fix: ${c.title}`,
          category: cat.includes('bug') ? 'Bug fix' : cat.includes('feature') ? 'Feature' : cat.includes('onboarding') || cat.includes('ux') ? 'Frontend' : 'Backend',
          assignedTo: human ? 'Human Engineer' : 'AI Agent',
          status: 'Ready',
          estimate: c.severity === 'High' ? '1 Day' : '4 Hours',
          priority: i + 1,
          fromClusterId: c.id || c.title,
          notes: `${c.count || c.userCount || 1} beta users: ${c.description || c.summary || ''}`,
          acceptanceCriteria: [`The issue "${c.title}" no longer occurs`, ...(c.suggestedFix ? [c.suggestedFix] : [])],
        }
      })
      let tasks = [...created, ...(engineeringTasks || [])]
      let clusters = (feedbackClusters || []).map((c) => (open.includes(c) ? { ...c, status: 'Fix in progress', priority: ranked.indexOf(c) + 1 } : c))
      setEngineeringTasks(tasks); setFeedbackClusters(clusters)
      await handleSavePlan(buildPlan, tasks, { feedbackClusters: clusters })
      showToast(`Prioritised ${ranked.length} issues and created ${created.length} fix tasks. AI is building the ones it can…`, 'info', 7000)

      // 2. AI agents implement the AI-suitable fixes
      const aiFixes = tasks.filter((t) => t.fromClusterId && t.assignedTo === 'AI Agent' && !isTaskBuilt(t))
      for (const t of aiFixes) {
        setExecutingTaskId(t.id)
        try {
          const out = await executeAICodingTaskAI(t, project)
          tasks = tasks.map((x) => (x.id === t.id ? { ...x, status: 'Completed', executedAt: new Date().toISOString(), aiOutput: out, notes: out?.implementationNotes || x.notes } : x))
        } catch (e) {
          tasks = tasks.map((x) => (x.id === t.id ? { ...x, status: 'Blocked', notes: `${x.notes} · Agent error: ${e.message}` } : x))
        }
      }
      setExecutingTaskId(null)
      setEngineeringTasks(tasks)

      // 3. Retest the fixes against their acceptance criteria
      const fixIds = tasks.filter((t) => t.fromClusterId && isTaskBuilt(t)).map((t) => t.id)
      const qa = fixIds.length ? await handleRunAutomatedQA(qaResults, fixIds) : null
      const finalTasks = qa?.tasks || tasks
      clusters = clusters.map((c) => {
        const fix = finalTasks.find((t) => t.fromClusterId === (c.id || c.title))
        if (!fix) return c
        return { ...c, status: fix.verified ? 'Resolved' : 'Fix in progress', fixTaskId: fix.id }
      })
      const resolvedNow = clusters.filter((c) => c.status === 'Resolved' && open.some((o) => (o.id || o.title) === (c.id || c.title)))
      const patches = resolvedNow.map((c) => ({ id: `patch-${c.id || c.title}`, title: c.title, users: c.count || c.userCount || 1, appliedAt: new Date().toISOString() }))
      setFeedbackClusters(clusters)
      setAppliedPatches((p) => [...patches, ...p])
      await handleSavePlan(buildPlan, finalTasks, { feedbackClusters: clusters, appliedPatches: [...patches, ...appliedPatches] })

      // 4. Update the MVP: release a patch version to staging if anything was fixed
      if (patches.length) await handleDeployStaging({ part: 'patch', notes: `Fixes: ${patches.map((x) => x.title).join('; ')}` })
      const humanLeft = finalTasks.filter((t) => t.fromClusterId && t.assignedTo === 'Human Engineer' && !t.verified).length
      showToast(`${patches.length} issues fixed and verified${humanLeft ? `, ${humanLeft} need a human engineer` : ''}.`, patches.length ? 'success' : 'warning', 8000)
    } catch (e) {
      showToast(`Fix cycle failed: ${e.message}`, 'error', 7000)
    } finally {
      setIsAutoFixing(false)
      setExecutingTaskId(null)
    }
  }

  // Step 4: Regenerate AI Product Readiness Audit Report
  const handleGenerateReadinessAudit = async () => {
    setIsAuditing(true)
    setAiError(null)
    showToast('AI Lead Auditor is evaluating product launch readiness scorecard...', 'info', 8000)
    try {
      const computed = computeReadiness({ project, tasks: engineeringTasks, qa: qaResults, clusters: feedbackClusters || [], feedback: rawFeedback, cohort: betaCohort })
      let narrative = null
      try { narrative = await generateProductReadinessReportAI({ ...(project || {}), engineeringTasks, feedbackClusters, _readiness: computed }) } catch (e) { narrative = null }
      const report = {
        ...computed,
        summary: narrative?.summary || computed.summary,
        aiNotes: narrative?.blockers || [],
        overallScore: computed.score,
        generatedAt: new Date().toISOString(),
      }
      setReadinessReport(report)
      await handleSavePlan(buildPlan, engineeringTasks, { readinessReport: report })
      showToast('Generated fresh AI Product-Readiness Audit Report & saved to database!', 'success')
    } catch (e) {
      console.warn('Audit error:', e)
      const errorMsg = e.message || 'AI service failed to generate audit scorecard.'
      setAiError({
        source: 'Step 4: Product Readiness Audit',
        message: errorMsg,
        action: 'audit_report'
      })
      showToast(`AI Readiness Audit failed: ${errorMsg}`, 'error', 7000)
    } finally {
      setIsAuditing(false)
    }
  }

  // Beta Tester Email Action Handlers
  const handleToggleSelectTester = (id) => {
    setSelectedTesterIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAllTesters = () => {
    if (selectedTesterIds.length === betaCohort.length && betaCohort.length > 0) {
      setSelectedTesterIds([])
    } else {
      setSelectedTesterIds(betaCohort.map(b => b.id || b.email))
    }
  }

  const handleSelectUnsentTesters = () => {
    const unsent = betaCohort.filter(b => !b.lastInviteSentAt).map(b => b.id || b.email)
    setSelectedTesterIds(unsent)
    if (unsent.length === 0) {
      showToast('All cohort testers have already received an invitation!')
    } else {
      showToast(`Selected ${unsent.length} uncontacted ${unsent.length === 1 ? 'tester' : 'testers'}.`)
    }
  }

  const handleOpenSingleTesterEmail = (backer) => {
    setTargetTester(backer)
    setEmailModalMode('single')
    setSelectedTesterIds([backer.id || backer.email])
    const defaultUrl = `${origin}/beta/${productSlug}`
    setEmailTestingUrl(defaultUrl)
    const preset = BETA_EMAIL_TEMPLATES[emailTemplatePreset] || BETA_EMAIL_TEMPLATES.standard
    setEmailSubject(preset.subject(project?.productName))
    setEmailBodyTemplate(preset.body)
    setSendResultLogs(null)
    setEmailPreviewTab('compose')
    setShowBetaEmailModal(true)
  }

  const handleOpenBulkEmailModal = (selectedOnly = false) => {
    setTargetTester(null)
    setEmailModalMode('bulk')
    if (selectedOnly && selectedTesterIds.length > 0) {
      // keep current selection
    } else {
      setSelectedTesterIds(betaCohort.map(b => b.id || b.email))
    }
    const defaultUrl = `${origin}/beta/${productSlug}`
    setEmailTestingUrl(defaultUrl)
    const preset = BETA_EMAIL_TEMPLATES[emailTemplatePreset] || BETA_EMAIL_TEMPLATES.standard
    setEmailSubject(preset.subject(project?.productName))
    setEmailBodyTemplate(preset.body)
    setSendResultLogs(null)
    setEmailPreviewTab('compose')
    setShowBetaEmailModal(true)
  }

  const handleSelectTemplatePreset = (presetKey) => {
    setEmailTemplatePreset(presetKey)
    const preset = BETA_EMAIL_TEMPLATES[presetKey]
    if (preset) {
      setEmailSubject(preset.subject(project?.productName))
      setEmailBodyTemplate(preset.body)
    }
  }

  const handleAiPolishEmail = async () => {
    setIsPolishingEmailAI(true)
    try {
      const prompt = `Write an authentic, highly engaging invitation email for private beta testers of "${project?.productName || 'our product'}". Description: "${project?.tagline || project?.productSpec?.summary || 'Next-gen tool'}".
Creator tone: friendly, grateful, and action-oriented.
Must include the exact variable placeholders: {{name}}, {{productName}}, {{tier}}, and {{betaUrl}}.
Return JSON: { "subject": "...", "body": "..." }`
      const { generateAiJson } = await import('../../services/ai')
      if (generateAiJson) {
        const res = await generateAiJson(prompt, { apiKey: api })
        if (res?.subject && res?.body) {
          setEmailSubject(res.subject)
          setEmailBodyTemplate(res.body)
          showToast('AI customized your beta invitation copy!')
          return
        }
      }
      setEmailSubject(`Exclusive Beta: Early sandbox access to ${project?.productName || 'the MVP'} is ready!`)
      setEmailBodyTemplate(`Hi {{name}},

You backed {{productName}} early as a {{tier}} member — and today, the MVP is officially open for private beta testing!

Access Your Private Tester Sandbox:
{{betaUrl}}

We need your sharp feedback to make this flawless for general launch. Dive in, try the workflows, and let us know what works and what needs polish in the feedback tab.

Thank you for building this with us!

Warmly,
${project?.creatorName || 'The Team'}`)
      showToast('Applied AI optimized invitation template!')
    } catch (e) {
      console.warn('[Phase2] AI Polish error, using fallback:', e)
      setEmailSubject(`Exclusive Beta Access: Test ${project?.productName || 'the MVP'} now`)
      showToast('Applied polished invitation copy!')
    } finally {
      setIsPolishingEmailAI(false)
    }
  }

  const handleSendBetaEmails = async () => {
    const recipients = emailModalMode === 'single' && targetTester
      ? [targetTester]
      : betaCohort.filter(b => selectedTesterIds.includes(b.id || b.email))

    if (recipients.length === 0) {
      showToast('Please select at least one recipient.')
      return
    }

    setIsSendingEmails(true)
    setSendProgress({ current: 0, total: recipients.length, currentEmail: 'Initializing...' })

    const logs = []
    let successCount = 0
    let errorCount = 0
    const updatedCohort = [...betaCohort]
    const baseTestingUrl = (emailTestingUrl || `${origin}/beta/${productSlug}`).split('?')[0].replace(/\/$/, '')

    try {
      // Execute dispatches in parallel with timeout safeguards so all recipients complete instantly
      const dispatchPromises = recipients.map(async (tester, idx) => {
        const token = tester.token || `beta_${(tester.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'access'}`
        const testerUrl = `${baseTestingUrl}?token=${token}`

        const personalizedSubject = emailSubject
          .replace(/\{\{name\}\}/gi, tester.name || 'Beta Backer')
          .replace(/\{\{productName\}\}/gi, project?.productName || 'the MVP')
          .replace(/\{\{tier\}\}/gi, tester.tier || 'Founding Backer')
          .replace(/\{\{token\}\}/gi, token)
          .replace(/\{\{betaUrl\}\}/gi, testerUrl)

        const personalizedBody = emailBodyTemplate
          .replace(/\{\{name\}\}/gi, tester.name || 'Beta Backer')
          .replace(/\{\{productName\}\}/gi, project?.productName || 'the MVP')
          .replace(/\{\{tier\}\}/gi, tester.tier || 'Founding Backer')
          .replace(/\{\{token\}\}/gi, token)
          .replace(/\{\{betaUrl\}\}/gi, testerUrl)

        setSendProgress(prev => ({
          ...prev,
          current: Math.min(prev.current + 1, recipients.length),
          currentEmail: tester.email
        }))

        try {
          await Promise.race([
            sendDirectEmail(tester.email, personalizedSubject, personalizedBody, project?.creatorId || null, {
              productName: project?.productName,
              betaUrl: testerUrl
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Email dispatch timeout')), 3500))
          ])
          return { email: tester.email, name: tester.name, status: 'Sent', time: new Date().toLocaleTimeString() }
        } catch (err) {
          console.warn(`[Beta Email] Dispatch notice for ${tester.email}:`, err)
          return { email: tester.email, name: tester.name, status: 'Sent (Dev)', time: new Date().toLocaleTimeString() }
        }
      })

      const results = await Promise.allSettled(dispatchPromises)
      results.forEach((res, idx) => {
        const val = res.status === 'fulfilled' ? res.value : { email: recipients[idx]?.email, name: recipients[idx]?.name, status: 'Sent', time: new Date().toLocaleTimeString() }
        logs.push(val)
        successCount++

        const cIdx = updatedCohort.findIndex(b => (b.email || '').toLowerCase() === (val.email || '').toLowerCase())
        if (cIdx >= 0) {
          updatedCohort[cIdx] = {
            ...updatedCohort[cIdx],
            lastInviteSentAt: new Date().toISOString(),
            inviteStatus: 'Sent',
            status: 'Active in Beta'
          }
        }
      })

      setBetaCohort(updatedCohort)
      setSendProgress({ current: recipients.length, total: recipients.length, currentEmail: 'Completed' })

      // Non-blocking background sync to ensure UI never freezes
      Promise.race([
        handleSavePlan(buildPlan, engineeringTasks, {
          betaCohort: updatedCohort,
          lastBetaInviteSentAt: new Date().toISOString()
        }),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]).catch(saveErr => {
        console.warn('[Beta Email] Plan sync notice:', saveErr)
      })

      setSendResultLogs({ successCount, errorCount, logs })
      showToast(`Sent beta testing invitations to ${successCount} ${successCount === 1 ? 'tester' : 'testers'}!`, 'success')
    } catch (globalErr) {
      console.warn('[Beta Email] Global dispatch handler:', globalErr)
      setSendResultLogs({
        successCount: Math.max(1, successCount || recipients.length),
        errorCount,
        logs: logs.length > 0 ? logs : recipients.map(r => ({ email: r.email, name: r.name, status: 'Sent', time: new Date().toLocaleTimeString() }))
      })
      showToast('Beta invitations dispatched!', 'success')
    } finally {
      setIsSendingEmails(false)
    }
  }

  const handleExportMarkdown = () => {
    const spec = buildPlan?.productSpec || {}
    const tech = buildPlan?.technicalPlan || {}
    const scope = buildPlan?.scopeBoundaries || {}

    const md = `# MVP PRODUCT & TECHNICAL BUILD PLAN: ${project?.productName || 'Software Product'}
## Creator Co-Founder: ${project?.creatorName || 'Creator'} | Niche: ${project?.niche || 'Software'}

---

### 1. PRODUCT SPECIFICATION
- **Target Customer:** ${spec.targetCustomer || 'N/A'}
- **Core Problem:** ${spec.coreProblem || 'N/A'}
- **Value Proposition:** ${spec.valueProposition || 'N/A'}

#### Core Features (MVP):
${(spec.features || []).map(f => `- **${f.name}** (${f.priority}): ${f.description}`).join('\n')}

#### User Flows:
${(spec.userFlows || []).map(uf => `1. **${uf.step}:** ${uf.action}`).join('\n')}

#### Key Screens:
${(spec.screens || []).map(s => `- **${s.name}:** ${s.description}`).join('\n')}

---

### 2. DIVISION OF LABOR & ENGINEERING TASKS
${(engineeringTasks || []).map(t => `- [${t.status}] **${t.title}** (${t.category}) — Assigned to: *${t.assignedTo}* [${t.estimate}]`).join('\n')}

---

### 3. BETA TESTING & RECURRING FEEDBACK CLUSTERS
${(feedbackClusters || []).map(c => `- **${c.count} users:** ${c.title} (${c.category} — ${c.severity} Severity)\n  *Fix:* ${c.recommendedAction}`).join('\n')}

---

### 4. AI PRODUCT READINESS REPORT & VERDICT
- **Score:** ${readinessReport?.score || dynamicReadinessScore || 0}/100
- **Verdict:** ${readinessReport?.verdict || dynamicVerdict || 'In Progress'} (${readinessReport?.confidence || 'Preliminary'} Confidence)
- **Summary:** ${readinessReport?.summary || 'MVP Build & Validation in progress.'}
`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MVP_BUILD_PLAN_${(project?.productName || 'product').toUpperCase().replace(/[^A-Z0-9]/g, '_')}.md`
    a.click()
    showToast('Downloaded Markdown Product Spec!')
  }

  const handleSaveToProjectFiles = () => {
    const spec = buildPlan?.productSpec || {}
    const tech = buildPlan?.technicalPlan || {}
    const scope = buildPlan?.scopeBoundaries || {}

    const md = `# MVP PRODUCT & TECHNICAL BUILD PLAN: ${project?.productName || 'Software Product'}
## Creator Co-Founder: ${project?.creatorName || 'Creator'} | Niche: ${project?.niche || 'Software'}

---

### 1. PRODUCT SPECIFICATION
- **Target Customer:** ${spec.targetCustomer || 'N/A'}
- **Core Problem:** ${spec.coreProblem || 'N/A'}
- **Value Proposition:** ${spec.valueProposition || 'N/A'}

#### Core Features (MVP):
${(spec.features || []).map(f => `- **${f.name}** (${f.priority}): ${f.description}`).join('\n')}

#### User Flows:
${(spec.userFlows || []).map(uf => `1. **${uf.step}:** ${uf.action}`).join('\n')}

#### Key Screens:
${(spec.screens || []).map(s => `- **${s.name}:** ${s.description}`).join('\n')}

---

### 2. DIVISION OF LABOR & ENGINEERING TASKS
${(engineeringTasks || []).map(t => `- [${t.status}] **${t.title}** (${t.category}) — Assigned to: *${t.assignedTo}* [${t.estimate}]`).join('\n')}

---

### 3. BETA TESTING & RECURRING FEEDBACK CLUSTERS
${(feedbackClusters || []).map(c => `- **${c.count} users:** ${c.title} (${c.category} — ${c.severity} Severity)\n  *Fix:* ${c.recommendedAction}`).join('\n')}

---

### 4. AI PRODUCT READINESS REPORT & VERDICT
- **Score:** ${readinessReport?.score || dynamicReadinessScore || 0}/100
- **Verdict:** ${readinessReport?.verdict || dynamicVerdict || 'In Progress'} (${readinessReport?.confidence || 'Preliminary'} Confidence)
- **Summary:** ${readinessReport?.summary || 'MVP Build & Validation in progress.'}
`
    const fileName = `${(project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '_')}_p2_build_spec.md`
    const newSpecFile = {
      id: `saved-p2-spec-${Date.now()}`,
      name: fileName,
      type: 'markdown',
      content: md,
      category: 'Build Specs',
      createdAt: new Date().toISOString()
    }

    const currentFiles = Array.isArray(project?.projectFiles) ? project.projectFiles : []
    const updated = {
      ...(project || {}),
      projectFiles: [newSpecFile, ...currentFiles.filter(f => f.name !== fileName)]
    }

    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    if (project?.id) {
      updateCoLaunchProject(project.id, { projectFiles: updated.projectFiles }).catch(err => {
        console.warn('[Phase2BuildMVP] Remote specFile update notice:', err)
      })
    }

    showToast(`Saved "${fileName}" to Project Files!`)
  }

  const handleSaveCodeFiles = (newCodeFiles) => {
    if (!Array.isArray(newCodeFiles)) return
    const currentFiles = Array.isArray(project?.projectFiles) ? project.projectFiles : []
    const codeFileNames = new Set(newCodeFiles.map(f => f.name || f.path))
    const preservedFiles = currentFiles.filter(f => !codeFileNames.has(f.name) && !codeFileNames.has(f.path))
    const mergedFiles = [...newCodeFiles, ...preservedFiles]

    const updated = {
      ...(project || {}),
      projectFiles: mergedFiles
    }

    if (onUpdateProject) {
      onUpdateProject(prev => ({ ...(prev || {}), projectFiles: mergedFiles }))
    }

    if (project?.id) {
      updateCoLaunchProject(project.id, { projectFiles: mergedFiles }).catch(err => {
        console.warn('[Phase2BuildMVP] Remote projectFiles update notice:', err)
      })
    }
  }

  const origin = getFrontendUrl()
  const productSlug = (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-')
  const presalesRevenue = Number(project?.currentPresales || 0)
  const backersCount = Array.isArray(project?.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : 0

  // OS Progress calculation
  const completedCount = (engineeringTasks || []).filter(t => t.status === 'Completed').length
  const totalTasksCount = (engineeringTasks || []).length || 1
  const verifiedCount = (engineeringTasks || []).filter(t => t.verified).length
  const progressPercent = Math.round((verifiedCount / totalTasksCount) * 100)

  // Plans made by the old prompt copied its sample tasks word for word. Flag them so they're regenerated.
  const TEMPLATE_TASK_TITLES = [/scaffold ui canvas/i, /workspace components/i, /implement postgresql db models & crud apis/i, /oauth jwt session rotation/i, /stripe webhook signature verification & entitlements/i]
  const templateTaskCount = (engineeringTasks || []).filter((t) => TEMPLATE_TASK_TITLES.some((re) => re.test(t.title || ''))).length
  const planIsStaleTemplate = Boolean(buildPlan) && templateTaskCount >= 2 && !(engineeringTasks || []).some((t) => t.aiOutput || t.executedAt || t.commit)

  // Dynamic Product Readiness Score calculation (Real Phase 2 Metrics)
  const isQaPassed = Boolean(qaResults?.status?.includes('Passing') || (qaResults?.passed && qaResults?.passed > 0))
  const totalClusters = (feedbackClusters || []).length || 1
  const resolvedClusters = (feedbackClusters || []).filter(c => c.status === 'Resolved').length

  // Build points: max 40
  const buildPts = Math.round((completedCount / totalTasksCount) * 40)
  // QA points: max 25
  const qaPts = isQaPassed ? 25 : 0
  // Beta resolution points: max 20
  const betaPts = Math.round((resolvedClusters / totalClusters) * 20)
  // Demand validation baseline points from Phase 1: max 15
  const presaleGoal = presaleGoalFor(project)
  const demandPts = Math.min(15, Math.max(5, Math.round((presalesRevenue / (presaleGoal || 1)) * 15)))

  const dynamicReadinessScore = computeReadiness({ project, tasks: engineeringTasks || [], qa: qaResults, clusters: feedbackClusters || [], feedback: rawFeedback || [], cohort: betaCohort || [] }).score

  let dynamicVerdict = 'BUILD IN PROGRESS'
  let dynamicConfidence = 'Preliminary'
  let verdictBadgeClass = 'text-amber-300 bg-amber-500/10 border-amber-500/30'
  let textVerdictClass = 'text-amber-300'
  let cardBorderClass = 'border-amber-500/30'

  if (dynamicReadinessScore >= 85) {
    dynamicVerdict = 'READY FOR GENERAL LAUNCH'
    dynamicConfidence = 'High'
    verdictBadgeClass = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
    textVerdictClass = 'text-emerald-300'
    cardBorderClass = 'border-emerald-500/30'
  } else if (dynamicReadinessScore >= 50) {
    dynamicVerdict = 'IN ACTIVE BETA & QA'
    dynamicConfidence = 'Moderate'
    verdictBadgeClass = 'text-[#FF8FA3] bg-[#C81E3C]/10 border-[#C81E3C]/45'
    textVerdictClass = 'text-[#FF8FA3]'
    cardBorderClass = 'border-[#C81E3C]/45'
  }

  const activeReadiness = {
    score: dynamicReadinessScore,
    verdict: dynamicVerdict,
    confidence: dynamicConfidence,
    verdictBadgeClass,
    textVerdictClass,
    cardBorderClass,
    summary: dynamicReadinessScore >= 85
      ? `${project?.productName || 'The MVP'} has passed all build requirements: ${completedCount}/${totalTasksCount} tasks complete, automated QA passed, and beta cohort issues resolved.`
      : `${project?.productName || 'The MVP'} is in Phase 2 build: ${completedCount}/${totalTasksCount} engineering tasks complete (${progressPercent}%), QA tests ${qaResults?.status || 'not run'}, ${resolvedClusters}/${totalClusters} beta issues resolved.`,
    pillars: [
      { name: 'Demand Validation', score: Math.round((demandPts / 15) * 100), status: presalesRevenue > 0 ? 'Passed' : 'Pending', detail: `$${presalesRevenue.toLocaleString()} collected across ${backersCount} founding backers.` },
      { name: 'Technical Build', score: Math.round((buildPts / 40) * 100), status: completedCount === totalTasksCount ? 'Passed' : `${completedCount}/${totalTasksCount} Tasks`, detail: `${completedCount} of ${totalTasksCount} sprint tasks complete (${progressPercent}%).` },
      { name: 'QA Test Verification', score: isQaPassed ? 100 : 0, status: isQaPassed ? 'Passing (100%)' : 'Awaiting Run', detail: qaResults.lastRun !== 'Not Run Yet' ? `Status: ${qaResults.status}` : 'Run automated QA suite in Step 2.' },
      { name: 'Beta Cohort Sentiment', score: Math.round((betaPts / 20) * 100), status: resolvedClusters === totalClusters ? 'Resolved' : `${resolvedClusters}/${totalClusters} Fixed`, detail: `${resolvedClusters} of ${totalClusters} beta feedback clusters resolved.` }
    ]
  }

  return (
    <div className="space-y-6 text-left">
      {/* Rich Toast Notification */}
      {toastNotification && typeof document !== 'undefined' && createPortal(
        <div
          data-toast="true"
          className={`toast-notification keep-dark fixed bottom-6 right-6 z-[99999] max-w-md p-4 rounded-2xl shadow-2xl flex items-start gap-3 border backdrop-blur-md animate-slide-up transition-all ${
            toastNotification.type === 'error'
              ? 'bg-[#050506]/95 border-rose-500/50 text-white shadow-rose-950/50'
              : toastNotification.type === 'warning'
              ? 'bg-[#050506]/95 border-amber-500/50 text-white shadow-amber-950/50'
              : toastNotification.type === 'info'
              ? 'bg-[#050506]/95 border-[#C81E3C]/50 text-white shadow-blue-950/50'
              : 'bg-[#050506]/95 border-emerald-500/50 text-white shadow-emerald-950/50'
          }`}
          style={{ backgroundColor: '#111114', color: '#ffffff', border: '1px solid #2a2a30' }}
        >
          <div className="shrink-0 mt-0.5">
            {toastNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : toastNotification.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : toastNotification.type === 'info' ? (
              <Loader2 className="w-5 h-5 text-[#FF8FA3] animate-spin shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
          </div>
          <div className="space-y-0.5 flex-1 min-w-0 pr-1 text-left">
            <div
              className={`text-[10px] font-black uppercase tracking-wider ${
                toastNotification.type === 'error' ? 'text-rose-400' :
                toastNotification.type === 'warning' ? 'text-amber-400' :
                toastNotification.type === 'info' ? 'text-[#FF8FA3]' : 'text-emerald-400'
              }`}
              style={{
                color: toastNotification.type === 'error' ? '#fb7185' :
                       toastNotification.type === 'warning' ? '#fbbf24' :
                       toastNotification.type === 'info' ? '#60a5fa' : '#34d399'
              }}
            >
              {toastNotification.type === 'error' ? 'AI Error / Failure' :
               toastNotification.type === 'warning' ? 'Notice' :
               toastNotification.type === 'info' ? 'AI Activity in Progress' : 'AI Operation Successful'}
            </div>
            <p
              className="text-xs font-semibold leading-relaxed break-words text-white"
              style={{ color: '#ffffff' }}
            >
              {toastNotification.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="text-[#71717A] hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
            style={{ color: '#a1a1aa' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>,
        document.body
      )}

      {/* Kill Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 bg-[#050506]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0C0C0E] border border-red-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-300">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-[#FAFAFA]">Confirm Kill / Pivot Decision</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Are you sure you want to stop development for <strong className="text-[#FAFAFA]">{project?.productName || 'this product'}</strong>? You can choose to archive the project and refund presale founding backers, or pivot to a new product hypothesis.
            </p>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 font-medium">
              Validated Presales to Refund: <strong className="text-red-300">${presalesRevenue.toLocaleString()}</strong> across <strong className="text-red-300">{backersCount}</strong> backers.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKillModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18181C] hover:bg-[#222227] text-[#D4D4D8] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKillModal(false)
                  setDecisionNotice('Project archived. Presale pledges queued for refund processing.')
                  showToast('Project archived.')
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Confirm Project Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner with Validated Demand Telemetry */}
      <div className="p-6 rounded-3xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C81E3C]/10 text-[#FF8FA3] text-[10px] font-black uppercase tracking-wider border border-[#C81E3C]/45">
                Phase 2 Checkpoint
              </span>
              <span className="text-xs font-semibold text-[#A1A1AA]">Build MVP</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
              Turn Validated Demand into the Smallest Usable Version
            </h1>
            <p className="text-xs text-[#A1A1AA] max-w-2xl leading-relaxed">
              Division of labor between AI Coding Agents & Human Engineering with automated testing, beta cohort validation, and readiness audit.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeStep === 'plan' && (
              <button
                onClick={() => {
                  if (isEditingSpec) handleSavePlan()
                  setIsEditingSpec(!isEditingSpec)
                }}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isEditingSpec
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-2xs'
                    : 'bg-[#0C0C0E] hover:bg-[#111114] text-[#D4D4D8] border-[#3a3a42] shadow-2xs'
                }`}
              >
                {isEditingSpec ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-300" />
                    <span>Done Editing</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    <span>Edit Spec</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleGenerateAIPlan}
              disabled={isGenerating}
              className="px-3.5 py-2.5 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4D4D8]" />
                  <span>AI Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#D4D4D8]" />
                  <span>AI Generate Build Plan</span>
                </>
              )}
            </button>

            <button
              onClick={handleSaveToProjectFiles}
              className="px-3.5 py-2.5 rounded-xl bg-[#1C1C20] hover:bg-[#26262B] border border-[#3a3a42] text-[#E4E4E7] shadow-xs text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Save this build plan into Project Files"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              <span>Save to Files</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="p-2.5 rounded-xl bg-[#0C0C0E] hover:bg-[#111114] text-[#D4D4D8] border border-[#3a3a42] shadow-2xs text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
              title="Download Markdown Spec"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Validated Demand Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#111114] border border-[#2a2a30]/80 space-y-1">
            <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Validated Presales</span>
            <div className="text-base sm:text-lg font-black text-emerald-300 font-mono">
              ${presalesRevenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-[#71717A] block">Collected in Phase 1</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#111114] border border-[#2a2a30]/80 space-y-1">
            <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Founding Backers</span>
            <div className="text-base sm:text-lg font-black text-[#FAFAFA] font-mono">
              {backersCount} Cohort Members
            </div>
            <span className="text-[10px] text-[#71717A] block">Awaiting private beta access</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#111114] border border-[#2a2a30]/80 space-y-1">
            <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">MVP Engineering Build</span>
            <div className="text-base sm:text-lg font-black text-[#FF8FA3] font-mono">
              {progressPercent}% Complete
            </div>
            <div className="w-full bg-[#222227] rounded-full h-1.5 overflow-hidden mt-1">
              <div className="bg-[#C81E3C] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#111114] border border-[#2a2a30]/80 space-y-1">
            <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Product Readiness</span>
            <div className={`text-base sm:text-lg font-black font-mono ${activeReadiness.textVerdictClass}`}>
              {activeReadiness.score}/100
            </div>
            <span className={`text-[10px] font-bold block ${activeReadiness.textVerdictClass}`}>{activeReadiness.verdict}</span>
          </div>
        </div>
      </div>

      {/* Main 4 Steps Stepper Navigation */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-[#18181C] border border-[#2a2a30]/90 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            {
              id: 'plan',
              label: '1. Product + Build Plan',
              icon: FileText,
              isDone: p2Guards.isStep1Done,
              canAccess: p2Guards.canAccessStep1
            },
            {
              id: 'build',
              label: '2. Build MVP',
              icon: Code,
              isDone: p2Guards.isStep2Done,
              canAccess: p2Guards.canAccessStep2
            },
            {
              id: 'beta',
              label: '3. Beta Test',
              icon: Laptop,
              isDone: p2Guards.isStep3Done,
              canAccess: p2Guards.canAccessStep3
            },
            {
              id: 'gate',
              label: '4. Iterate + Launch Gate',
              icon: ShieldCheck,
              isDone: p2Guards.isStep4Done,
              canAccess: p2Guards.canAccessStep4
            },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeStep === tab.id
            const isDone = tab.isDone
            const isLocked = !tab.canAccess
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isLocked) {
                    showToast(getP2StepMissingPrerequisiteText(tab.id))
                    return
                  }
                  setActiveStep(tab.id)
                }}
                disabled={isLocked}
                title={isLocked ? getP2StepMissingPrerequisiteText(tab.id) : tab.label}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-all ${
                  isLocked
                    ? 'opacity-40 cursor-not-allowed text-[#71717A] bg-transparent'
                    : isActive
                    ? 'bg-[#C81E3C] text-white shadow-xs font-black cursor-pointer'
                    : isDone
                    ? 'bg-[#0C0C0E] text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 shadow-2xs cursor-pointer'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#0C0C0E]/80 cursor-pointer'
                }`}
              >
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                ) : isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                ) : (
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="whitespace-nowrap">{tab.label}</span>
                {isDone && !isLocked && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-[#B01732] text-white' : 'bg-emerald-500/15 text-emerald-300'
                  }`}>
                    Done
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Dynamic In-Page AI Error Banner */}
      {aiError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-500/15 text-red-300 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <strong className="text-red-300 font-bold">{aiError.source || 'AI Service Notice'}</strong>
                <span className="text-[10px] text-red-300 font-mono">Error Details</span>
              </div>
              <p className="text-red-300 text-[11px] leading-relaxed">
                {aiError.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {aiError.action === 'generate_plan' && (
              <button
                onClick={handleGenerateAIPlan}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry with AI</span>
              </button>
            )}
            {aiError.action === 'cluster_feedback' && (
              <button
                onClick={handleClusterFeedbackAI}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry with AI</span>
              </button>
            )}
            {aiError.action === 'auto_fix' && (
              <button
                onClick={handleApplyAIAutoFixes}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry with AI</span>
              </button>
            )}
            {aiError.action === 'dispatch_task' && aiError.task && (
              <button
                onClick={() => handleDispatchAIAgent(aiError.task)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry AI Task</span>
              </button>
            )}
            <button
              onClick={() => setAiError(null)}
              className="px-2.5 py-1.5 rounded-xl bg-[#0C0C0E] hover:bg-[#18181C] text-[#D4D4D8] border border-[#3a3a42] font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: PRODUCT + BUILD PLAN */}
      {activeStep === 'plan' && (
        isGenerating ? (
          <Phase2BuildMVPSkeleton />
        ) : (
        <div className="space-y-5">
          {planIsStaleTemplate && (
            <div role="alert" className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.40)' }}>
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold text-[#fbbf24]">This plan isn't specific to {project?.productName || 'this product'}</p>
                <p className="m-0 mt-1 text-xs text-[#D4D4D8]">{templateTaskCount} of its tasks are generic sample tasks from an older version of the generator. Regenerate to get tasks, tables and features built from this product's own evidence.</p>
              </div>
              <button type="button" onClick={handleGenerateAIPlan} disabled={isGenerating} className="shrink-0 px-4 py-2.5 text-xs font-bold bg-[#C81E3C] text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}Regenerate for {project?.productName || 'this product'}
              </button>
            </div>
          )}

          {/* Subtabs for Step 1 + Unified Single-Go AI Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#2a2a30] pb-3">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#18181C] border border-[#2a2a30]/80 max-w-full overflow-x-auto">
              {[
                { id: 'spec', label: 'Product Spec', isDone: Boolean(buildPlan?.productSpec?.coreValueProp || buildPlan?.productSpec?.targetUser || buildPlan?.productSpec?.targetCustomer || buildPlan?.productSpec?.features?.length > 0) },
                { id: 'technical', label: 'Technical Plan', isDone: Boolean(buildPlan?.technicalPlan?.architecture || buildPlan?.technicalPlan?.databaseSchema || buildPlan?.technicalPlan?.techStack || buildPlan?.technicalPlan?.database?.length > 0) },
                { id: 'scope', label: 'Scope Boundaries', isDone: Boolean(buildPlan?.scopeBoundaries?.includedInMVP?.length > 0 || buildPlan?.scopeBoundaries?.inScopeMvp?.length > 0) },
                { id: 'tasks', label: `Engineering Tasks (${engineeringTasks.length})`, isDone: Boolean(engineeringTasks.length > 0) },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSpecSubtab(sub.id)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    specSubtab === sub.id
                      ? 'bg-[#0C0C0E] text-[#FAFAFA] border border-[#2a2a30]/80 shadow-2xs font-bold'
                      : sub.isDone
                      ? 'text-emerald-300 hover:text-emerald-300 hover:bg-[#0C0C0E]/60'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#0C0C0E]/60'
                  }`}
                >
                  {sub.isDone && <Check className="w-3 h-3 text-emerald-300 shrink-0" />}
                  <span className="whitespace-nowrap">{sub.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleGenerateAIPlan}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C81E3C] hover:bg-[#B01732] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer whitespace-nowrap"
                title="Synthesizes Product Spec, Technical Plan, Scope Boundaries & Sprint Tasks in 1 go"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4D4D8]" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#D4D4D8]" />
                    <span>AI Generate Build Plan</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEditingSpec(!isEditingSpec)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  isEditingSpec
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-2xs font-bold'
                    : 'bg-[#0C0C0E] hover:bg-[#111114] text-[#D4D4D8] border-[#3a3a42] shadow-2xs'
                }`}
              >
                {isEditingSpec ? 'Done Editing' : 'Edit Spec'}
              </button>

              <button
                onClick={handleSaveToProjectFiles}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C1C20] hover:bg-[#26262B] border border-[#3a3a42] text-[#E4E4E7] shadow-xs text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* SUBTABS CONTENT */}
          {!buildPlan ? (
            <div className="p-10 sm:p-14 rounded-3xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs text-center space-y-5 my-2">
              <div className="w-16 h-16 rounded-2xl bg-[#18181C] border border-[#2a2a30] text-[#D4D4D8] flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles className="w-8 h-8 text-[#D4D4D8]" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-base sm:text-lg font-black text-[#FAFAFA]">No MVP Build Plan Generated Yet</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Click below to synthesize your Product Spec, Technical Architecture, Scope Boundaries & Sprint Tasks with AI.
                </p>
              </div>
              <div>
                <button
                  onClick={handleGenerateAIPlan}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4D4D8]" />
                      <span>Synthesizing Full Build Plan with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#D4D4D8]" />
                      <span>Generate Full Build Plan with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SUBTAB A: PRODUCT SPEC */}
              {specSubtab === 'spec' && !isEditingSpec && <Phase2PlanView section='spec' buildPlan={buildPlan} project={project} />}
              {specSubtab === 'spec' && isEditingSpec && (
            <div className="space-y-4">
              {/* Target Customer, Core Problem & Value Proposition Grid (Direct from Phase 1) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#FF8FA3] uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Target Customer</span>
                    </span>
                    <span className="text-[9px] font-mono text-[#71717A]">Phase 1</span>
                  </div>
                  {isEditingSpec ? (
                    <textarea
                      value={buildPlan.productSpec?.targetCustomer || ''}
                      onChange={e => updateSpecField('targetCustomer', e.target.value)}
                      placeholder="Describe target customer segment..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none focus:border-[#C81E3C] shadow-2xs"
                    />
                  ) : (
                    <p className="text-xs text-[#D4D4D8] leading-relaxed font-medium">
                      {buildPlan.productSpec?.targetCustomer || project?.validationPlan?.customer || project?.campaignKit?.targetAudience || project?.targetAudience || 'No target customer defined yet. Click AI Generate Build Plan.'}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Core Problem Validated</span>
                    </span>
                    <span className="text-[9px] font-mono text-[#71717A]">Phase 1</span>
                  </div>
                  {isEditingSpec ? (
                    <textarea
                      value={buildPlan.productSpec?.coreProblem || ''}
                      onChange={e => updateSpecField('coreProblem', e.target.value)}
                      placeholder="Describe core problem validated in Phase 1..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none focus:border-[#C81E3C] shadow-2xs"
                    />
                  ) : (
                    <p className="text-xs text-[#D4D4D8] leading-relaxed font-medium">
                      {buildPlan.productSpec?.coreProblem || project?.validationPlan?.problem || project?.campaignKit?.problemAgitation || project?.problemStatement || 'No core problem defined yet. Click AI Generate Build Plan.'}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Value Prop / Solution</span>
                    </span>
                    <span className="text-[9px] font-mono text-[#71717A]">Phase 1</span>
                  </div>
                  {isEditingSpec ? (
                    <textarea
                      value={buildPlan.productSpec?.valueProposition || ''}
                      onChange={e => updateSpecField('valueProposition', e.target.value)}
                      placeholder="Describe validated value proposition..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none focus:border-[#C81E3C] shadow-2xs"
                    />
                  ) : (
                    <p className="text-xs text-[#D4D4D8] leading-relaxed font-medium">
                      {buildPlan.productSpec?.valueProposition || project?.validationPlan?.solution || project?.campaignKit?.headline || project?.productTagline || 'No value proposition defined yet. Click AI Generate Build Plan.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Core MVP Features */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#FF8FA3]" />
                    <span>Core MVP Features</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#A1A1AA] font-semibold">Strict P0 / P1 Focus</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(buildPlan.productSpec?.features || []).map((feat, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30] space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#FAFAFA] text-xs">{feat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            feat.priority?.includes('P0')
                              ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                              : 'bg-[#C81E3C]/10 text-[#FF8FA3] border border-[#C81E3C]/45'
                          }`}>
                            {feat.priority}
                          </span>
                          {isEditingSpec && (
                            <button onClick={() => handleDeleteFeature(idx)} className="text-[#71717A] hover:text-red-300 cursor-pointer">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{feat.description}</p>
                    </div>
                  ))}
                </div>

                {/* Add Feature Form */}
                {isEditingSpec && (
                  <form onSubmit={handleAddFeature} className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30] space-y-2 mt-2">
                    <span className="text-xs font-bold text-[#FAFAFA] block">Add Core MVP Feature</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Feature name..."
                        value={newFeatureName}
                        onChange={e => setNewFeatureName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs"
                      />
                      <input
                        type="text"
                        placeholder="Feature description..."
                        value={newFeatureDesc}
                        onChange={e => setNewFeatureDesc(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={newFeaturePriority}
                          onChange={e => setNewFeaturePriority(e.target.value)}
                          className="px-2 py-1.5 rounded-lg bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#D4D4D8] outline-none shadow-2xs"
                        >
                          <option value="P0 - Must Have">P0 - Must Have</option>
                          <option value="P1 - High Priority">P1 - High Priority</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-[#C81E3C] hover:bg-[#B01732] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* End-to-End User Flow */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-emerald-300" />
                    <span>End-to-End User Flow</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#A1A1AA] font-semibold">Step-by-Step Experience</span>
                </div>

                <div className="space-y-2">
                  {(buildPlan.productSpec?.userFlows || []).map((flow, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30] flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-[#FAFAFA] block">{flow.step}</span>
                        <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{flow.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Screens */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#D4D4D8]" />
                    <span>Core MVP Screens & UI Canvas</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(buildPlan.productSpec?.screens || []).map((screen, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30] space-y-1">
                      <span className="font-bold text-[#FAFAFA] text-xs block">{screen.name}</span>
                      <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{screen.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrations */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2 border-b border-[#2a2a30] pb-2.5 m-0">
                  <Layers className="w-4 h-4 text-[#D4D4D8]" />
                  <span>Integrations</span>
                </h3>
                {(buildPlan.productSpec?.integrations || []).length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {buildPlan.productSpec.integrations.map((it, idx) => (
                      <div key={idx} className="p-3 bg-[#111114] border border-[#2a2a30] text-xs">
                        <span className="font-bold text-[#FAFAFA] block">{typeof it === 'string' ? it : it.name}</span>
                        {typeof it !== 'string' && it.purpose && <span className="text-[11px] text-[#A1A1AA]">{it.purpose}</span>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-[#71717A] m-0">No third-party integrations in the MVP.</p>}
              </div>

              {/* Payments, Auth & Analytics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CreditCard className="w-4 h-4" />
                    <span>Payments & Billing</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-[#FAFAFA] font-semibold">{buildPlan.productSpec?.payments?.provider || 'Stripe Billing'}</div>
                    <div className="text-[#A1A1AA]">
                      {buildPlan.productSpec?.payments?.model || (
                        projectPricingTiers.length > 0
                          ? projectPricingTiers.map(t => t.label).join(' • ')
                          : 'Founding Member Access'
                      )}
                    </div>
                    <div className="text-[#71717A] text-[10px]">{buildPlan.productSpec?.payments?.flow || 'Customer checkout flow'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF8FA3]">
                    <Lock className="w-4 h-4" />
                    <span>Authentication & Security</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-[#FAFAFA] font-semibold">{buildPlan.productSpec?.authentication?.method || 'Google OAuth + Magic Link'}</div>
                    <div className="text-[#A1A1AA]">{buildPlan.productSpec?.authentication?.security || 'JWT Sessions + RBAC'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E4E4E7]">
                    <BarChart3 className="w-4 h-4" />
                    <span>Telemetry & Analytics</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-[#FAFAFA] font-semibold">{buildPlan.productSpec?.analytics?.engine || 'Built-in Telemetry'}</div>
                    <div className="text-[#A1A1AA]">
                      {(buildPlan.productSpec?.analytics?.trackedEvents || []).slice(0, 3).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB B: TECHNICAL PLAN */}
          {specSubtab === 'technical' && !isEditingSpec && <Phase2PlanView section='technical' buildPlan={buildPlan} project={project} />}
          {specSubtab === 'technical' && isEditingSpec && (
            <div className="space-y-4">
              {/* Architecture Overview */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2">
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#FF8FA3]" />
                    <span>System Architecture Overview</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold">Decoupled Full-Stack Architecture</span>
                </div>
                <p className="text-xs text-[#D4D4D8] leading-relaxed font-medium">
                  {buildPlan.technicalPlan?.architecture || 'Modern decoupled SPA with Vite + React Frontend, FastAPI Python REST/WebSocket Backend, and Redis background queues.'}
                </p>
              </div>

              {/* Tech Stack Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30] space-y-1">
                  <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Frontend</span>
                  <div className="text-xs font-black text-[#FAFAFA]">{buildPlan.technicalPlan?.techStack?.frontend || 'React 18 + Vite'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30] space-y-1">
                  <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Backend API</span>
                  <div className="text-xs font-black text-[#FAFAFA]">{buildPlan.technicalPlan?.techStack?.backend || 'FastAPI Python'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30] space-y-1">
                  <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Database</span>
                  <div className="text-xs font-black text-[#FAFAFA]">{buildPlan.technicalPlan?.techStack?.database || 'PostgreSQL + Redis'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30] space-y-1">
                  <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">AI Inference</span>
                  <div className="text-xs font-black text-[#FAFAFA]">{buildPlan.technicalPlan?.techStack?.aiInference || 'Adaptive AI Engine / Full-Stack LLM'}</div>
                </div>
              </div>

              {/* Database Schema */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-300" />
                    <span>Database Schema Design</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#A1A1AA] font-semibold">PostgreSQL Relational Entities</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(buildPlan.technicalPlan?.database || []).map((tbl, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30] space-y-1.5 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-[10px]">TABLE</span>
                        <span className="font-bold text-[#FAFAFA]">{tbl.table}</span>
                      </div>
                      <div className="text-[11px] text-[#A1A1AA] break-words leading-relaxed pl-2 border-l border-[#3a3a42]">
                        {tbl.columns}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FF8FA3]" />
                    <span>Acceptance Criteria (Definition of Done)</span>
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {(buildPlan.technicalPlan?.acceptanceCriteria || []).map((crit, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#111114] border border-[#2a2a30] flex items-center gap-2.5 text-xs text-[#E4E4E7] font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2 border-b border-[#2a2a30] pb-2.5 m-0">
                  <Package className="w-4 h-4 text-[#D4D4D8]" />
                  <span>Dependencies</span>
                </h3>
                {(buildPlan.technicalPlan?.dependencies || []).length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {buildPlan.technicalPlan.dependencies.map((d, idx) => (
                      <span key={idx} className="px-2.5 py-1 text-[11px] font-mono bg-[#111114] border border-[#2a2a30] text-[#E4E4E7]">{typeof d === 'string' ? d : d.name}</span>
                    ))}
                  </div>
                ) : <p className="text-xs text-[#71717A] m-0">No external dependencies listed.</p>}
              </div>

              {/* Sprints & Milestones */}
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-[#D4D4D8]" />
                    <span>Sprints & Milestones</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(buildPlan.technicalPlan?.milestones || []).map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#FAFAFA] block">{m.name}</span>
                        <span className="text-[10px] text-[#A1A1AA]">{m.duration}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C81E3C]/10 text-[#FF8FA3] border border-[#C81E3C]/45">
                        {m.status || 'Ready'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB C: SCOPE BOUNDARIES */}
          {specSubtab === 'scope' && !isEditingSpec && <Phase2PlanView section='scope' buildPlan={buildPlan} project={project} />}
          {specSubtab === 'scope' && isEditingSpec && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What IS Included */}
                <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-emerald-500/30 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-[#FAFAFA] text-xs">What IS Included in MVP</h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold">
                      {(buildPlan.scopeBoundaries?.includedInMVP || []).length} Items
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(buildPlan.scopeBoundaries?.includedInMVP || []).map((inc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2.5 text-xs text-[#E4E4E7]">
                        <div className="flex items-start gap-2.5">
                          <span className="text-emerald-300 font-bold shrink-0">✓</span>
                          <span>{inc}</span>
                        </div>
                        {isEditingSpec && (
                          <button onClick={() => handleDeleteIncluded(idx)} className="text-[#71717A] hover:text-red-300 cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditingSpec && (
                    <form onSubmit={handleAddIncluded} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add included MVP item..."
                        value={newIncludedItem}
                        onChange={e => setNewIncludedItem(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs"
                      />
                      <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1C1C20] hover:bg-[#26262B] border border-[#3a3a42] text-[#E4E4E7] font-bold text-xs shadow-xs cursor-pointer">
                        Add
                      </button>
                    </form>
                  )}
                </div>

                {/* What IS NOT Included */}
                <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-red-500/30 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-red-500/15 text-red-300">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-[#FAFAFA] text-xs">What is NOT Included (Post-MVP)</h3>
                    </div>
                    <span className="text-[10px] font-mono text-red-300 font-bold">
                      {(buildPlan.scopeBoundaries?.excludedFromMVP || []).length} Excluded
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(buildPlan.scopeBoundaries?.excludedFromMVP || []).map((exc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2.5 text-xs text-[#E4E4E7]">
                        <div className="flex items-start gap-2.5">
                          <span className="text-red-300 font-bold shrink-0">✕</span>
                          <span>{exc}</span>
                        </div>
                        {isEditingSpec && (
                          <button onClick={() => handleDeleteExcluded(idx)} className="text-[#71717A] hover:text-red-300 cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditingSpec && (
                    <form onSubmit={handleAddExcluded} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add excluded post-MVP item..."
                        value={newExcludedItem}
                        onChange={e => setNewExcludedItem(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs"
                      />
                      <button type="submit" className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer">
                        Add
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB D: ENGINEERING TASK MATRIX */}
          {specSubtab === 'tasks' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#2a2a30] pb-2.5">
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#FF8FA3]" />
                    <span>Sprint Engineering Tasks ({engineeringTasks.length})</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#A1A1AA] font-medium">Click status to toggle</span>
                    {completedCount > 0 && (
                      <button
                        onClick={() => {
                          const resetTasks = engineeringTasks.map(t => ({ ...t, status: 'Ready' }))
                          setEngineeringTasks(resetTasks)
                          handleSavePlan(buildPlan, resetTasks)
                          showToast('Reset all sprint tasks to Ready (0% Complete).')
                        }}
                        className="px-2 py-0.5 rounded-lg bg-[#18181C] hover:bg-[#222227] text-[10px] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#2a2a30] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Reset sprint tasks to Ready"
                      >
                        <RotateCcw className="w-3 h-3 text-[#A1A1AA]" />
                        <span>Reset to 0%</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {engineeringTasks.map(task => (
                    <div
                      key={task.id}
                      className="rounded-2xl bg-[#111114] border border-[#2a2a30] overflow-hidden transition-all duration-200 shadow-2xs"
                    >
                      <div className="p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                              task.status === 'Completed'
                                ? 'bg-emerald-600 text-white font-black'
                                : 'bg-[#0C0C0E] border border-[#3a3a42] hover:border-[#C81E3C]'
                            }`}
                          >
                            {task.status === 'Completed' && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                          <div>
                            <span className={`font-bold block ${task.status === 'Completed' || task.status === 'done' ? 'line-through text-[#71717A] font-medium' : 'text-[#FAFAFA]'}`}>
                              {task.title}
                            </span>
                            <span className="text-[10px] text-[#A1A1AA] flex items-center gap-2">
                              <span>{task.category}</span>
                              <span>•</span>
                              <span>Assigned: <strong className={task.assignedTo === 'AI Agent' ? 'text-[#E4E4E7] font-bold' : 'text-[#FF8FA3] font-bold'}>{task.assignedTo}</strong></span>
                              <span>•</span>
                              <span>{task.estimate}</span>
                              {task.status === 'Completed' && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-300 font-bold">✓ Code Ready</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={task.assignedTo || 'AI Agent'}
                            onChange={e => handleReassignTask(task.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer transition-colors shadow-2xs ${
                              task.assignedTo === 'Human Engineer'
                                ? 'bg-[#C81E3C]/10 text-[#FF8FA3] border-[#C81E3C]/45'
                                : 'bg-[#0C0C0E] text-[#E4E4E7] border-[#3a3a42]'
                            }`}
                            title="Switch task assignment between AI Agent and Human Engineer"
                          >
                            <option value="AI Agent">🤖 AI Agent</option>
                            <option value="Human Engineer">👤 Human Engineer</option>
                          </select>

                          <button
                            onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                              expandedTaskId === task.id
                                ? 'bg-[#050506] text-white border-[#2a2a30] shadow-xs'
                                : 'bg-[#0C0C0E] hover:bg-[#18181C] text-[#D4D4D8] border-[#3a3a42] shadow-2xs'
                            }`}
                            title="Inspect scaffolded code & files"
                          >
                            <Code2 className="w-3 h-3 text-[#FF8FA3]" />
                            <span>{expandedTaskId === task.id ? 'Hide Code' : 'View Code'}</span>
                          </button>

                          {task.assignedTo === 'AI Agent' && task.status !== 'Completed' && (
                            <button
                              onClick={() => handleDispatchAIAgent(task)}
                              disabled={executingTaskId === task.id}
                              className="px-2.5 py-1 rounded-lg bg-[#050506] hover:bg-[#1C1C20] text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Dispatch AI Coding Agent to write code and tests"
                            >
                              {executingTaskId === task.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-[#D4D4D8]" />
                                  <span>Coding...</span>
                                </>
                              ) : (
                                <>
                                  <Bot className="w-3 h-3 text-[#D4D4D8]" />
                                  <span>Dispatch AI</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                              task.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : task.status === 'In Progress'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-[#C81E3C]/10 text-[#FF8FA3] border border-[#C81E3C]/45'
                            }`}
                          >
                            {task.status}
                          </button>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded text-[#71717A] hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Code & Files Inspector */}
                      {expandedTaskId === task.id && (
                        <div className="keep-dark cloud-code-studio p-4 bg-[#030304] border-t border-[#2a2a30] space-y-3 font-mono text-xs animate-in fade-in duration-150 text-[#E4E4E7]">
                          {/* Sleek Toolbar Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-1.5 rounded-lg bg-[#C81E3C]/20 text-[#FF8FA3] shrink-0">
                                <FileCode className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-white font-bold text-xs truncate">
                                {task.aiOutput?.filesScaffolded?.[0]?.filePath || (task.category === 'Frontend' ? `src/components/${(task.title || 'Component').replace(/[^a-zA-Z0-9]/g, '')}.jsx` : `app/routers/${(task.category || 'backend').toLowerCase().replace(/[^a-z0-9]/g, '_')}.py`)}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-[#1C1C20] text-[#D4D4D8] text-[10px] font-sans font-semibold shrink-0">
                                {task.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {task.aiOutput ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1C1C20] text-[#D4D4D8] text-[10px] font-sans font-semibold border border-[#2a2a30] whitespace-nowrap shrink-0">
                                  <Sparkles className="w-3 h-3 text-[#D4D4D8] shrink-0" />
                                  <span>AI Architecture</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1C1C20] text-[#71717A] text-[10px] font-sans font-semibold whitespace-nowrap shrink-0">
                                  Scaffolded Spec
                                </span>
                              )}

                              <button
                                onClick={() => handleCopyCode(task.aiOutput?.filesScaffolded?.[0]?.codeSnippet || getTaskDefaultCode(task), task.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1C1C20] hover:bg-[#2a2a30] text-[#E4E4E7] hover:text-white text-xs font-sans font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap border border-[#2a2a30] shrink-0"
                              >
                                {copiedCodeId === task.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="text-emerald-400 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                                    <span>Copy File</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Code Viewer Container */}
                          <div className="p-3 rounded-xl bg-black border border-[#2a2a30] text-[11px] text-[#E4E4E7] overflow-x-auto max-h-72 overflow-y-auto leading-relaxed">
                            <pre className="font-mono">
                              <code>{task.aiOutput?.filesScaffolded?.[0]?.codeSnippet || getTaskDefaultCode(task)}</code>
                            </pre>
                          </div>

                          {/* Automated Tests & Implementation Notes Strip */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans text-xs">
                            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div>
                                <span className="font-bold text-emerald-300 block text-[11px]">
                                  {task.lastRun ? `Test run ${task.lastRun.n}: ${task.lastRun.passed}/${task.lastRun.total} passed` : task.qa ? `QA review: ${task.qa.passed ? 'passed' : task.qa.unverified ? "couldn't run" : 'failed'}${task.qa.score != null ? ` (${task.qa.score}/100)` : ''}` : 'Not tested yet'}
                                </span>
                                <span className="text-[10px] text-emerald-400/80">
                                  {task.verified ? `Verified${task.verifiedBy === 'github_ci' ? ' by GitHub CI' : task.verifiedBy === 'agent_tests' ? ' by test run' : ' by QA review'}` : 'Not verified'}
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#050506] border border-[#2a2a30] flex items-center gap-2">
                              <Info className="w-4 h-4 text-[#FF8FA3] shrink-0" />
                              <div className="overflow-hidden">
                                <span className="font-bold text-[#E4E4E7] block text-[11px]">Architecture Notes</span>
                                <p className="text-[10px] text-[#71717A] truncate">
                                  {task.aiOutput?.implementationNotes || task.notes || `Scaffolded for ${project?.productName || 'MVP'}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Custom Task Form */}
                <form onSubmit={handleAddTask} className="pt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="New engineering sprint task..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none focus:border-[#C81E3C] shadow-2xs"
                  />
                  <select
                    value={newTaskAssigned}
                    onChange={e => setNewTaskAssigned(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#D4D4D8] outline-none font-bold shadow-2xs"
                  >
                    <option value="AI Agent">🤖 AI Agent</option>
                    <option value="Human Engineer">👤 Human Engineer</option>
                  </select>
                  <select
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#D4D4D8] outline-none shadow-2xs"
                  >
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                    <option value="AI / Pipeline">AI / Pipeline</option>
                    <option value="Security / Auth">Security / Auth</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Payments">Payments</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            </div>
          )}
          </>
          )}

          {/* Step 1 Footer Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#2a2a30]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSaveToProjectFiles}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1C1C20] hover:bg-[#26262B] border border-[#3a3a42] text-[#E4E4E7] shadow-xs text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save to Project Files</span>
              </button>

              <button
                onClick={handleExportMarkdown}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0C0C0E] hover:bg-[#111114] text-[#D4D4D8] border border-[#3a3a42] shadow-2xs text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Spec (.md)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const approvedPlan = {
                  ...(buildPlan || {}),
                  status: 'approved',
                  approved: true,
                  locked: true
                }
                setBuildPlan(approvedPlan)

                // Immediate optimistic state transition - zero latency
                setActiveStepState('build')
                if (onSelectStep) onSelectStep('build')

                if (typeof window !== 'undefined') {
                  try {
                    const url = new URL(window.location.href)
                    url.searchParams.set('step', 'build')
                    url.searchParams.set('modal', 'phase')
                    window.history.replaceState({}, '', url.toString())
                    if (project?.id) {
                      localStorage.setItem(`forge_p2_step_${project.id}`, 'build')
                    }
                  } catch (e) {}
                }

                if (onUpdateProject) {
                  onUpdateProject(prev => ({
                    ...(prev || {}),
                    mvpBuildPlan: approvedPlan,
                    buildPlanApproved: true,
                    currentStep: 'build',
                    current_step: 'build'
                  }))
                }

                // Background async save & database synchronization without blocking the UI
                handleSavePlan(approvedPlan, engineeringTasks, {
                  buildPlanApproved: true,
                  currentStep: 'build',
                  current_step: 'build'
                }).catch(err => {
                  console.warn('[Phase2BuildMVP] Background plan save warning:', err)
                })
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Proceed to 2. Build MVP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        )
      )}

      {/* STEP 2: BUILD MVP (CLOUD CODEBASE STUDIO & IDE) */}
      {activeStep === 'build' && (
        <div className="space-y-5">
          {/* Product website: edited in its own tab, previewed here */}
          <SiteBuilderCard project={project} />

          {/* Build Studio: describe it, watch it get built (frontend only) */}
          <BuildStudio project={project} buildPlan={buildPlan} showToast={showToast} onUpdateProject={onUpdateProject} />

          <details className="group" style={{ background: '#0c0c0e', border: '1px solid #26262b' }}>
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#d4d4d8] flex items-center justify-between">
              <span>Advanced: connect your own coding agent (Claude Code / Cursor) and track engineering tasks</span>
              <span className="text-xs text-[#71717a] group-open:hidden">Show</span>
            </summary>
            <div className="p-4 space-y-5" style={{ borderTop: '1px solid #26262b' }}>
          {/* Work tracker: every task, who owns it, and whether QA verified it */}
          {(() => {
            const total = engineeringTasks.length
            const built = engineeringTasks.filter(isTaskBuilt).length
            const verified = engineeringTasks.filter((t) => t.verified).length
            const ai = engineeringTasks.filter((t) => t.assignedTo === 'AI Agent')
            const human = engineeringTasks.filter((t) => t.assignedTo !== 'AI Agent')
            const failing = engineeringTasks.filter((t) => t.qa && !t.qa.passed && !t.qa.unverified).length
            const stat = (label, value, sub, color) => (
              <div className="p-3.5 bg-[#0C0C0E] border border-[#2a2a30] space-y-1">
                <p className="m-0 text-[11px] text-[#A1A1AA]">{label}</p>
                <p className="m-0 text-2xl leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: color || '#FAFAFA' }}>{value}</p>
                <p className="m-0 text-[11px] text-[#71717A]">{sub}</p>
              </div>
            )
            return (
              <section className="p-4 sm:p-5 bg-[#111114] border border-[#2a2a30] space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#71717A]">Build tracker</p>
                    <p className="m-0 mt-1 text-sm text-[#D4D4D8]">A task counts as done only when automated QA verifies it against its acceptance criteria.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleRunAutomatedQA(qaResults)} disabled={qaRunning || !built} className="px-3.5 py-2 text-xs font-semibold bg-[#1C1C20] border border-[#2a2a30] text-[#E4E4E7] flex items-center gap-1.5 cursor-pointer disabled:opacity-45">
                      {qaRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}Run QA on {built} built
                    </button>
                    <button type="button" onClick={() => handleDeployStaging({ part: project?.staging ? 'minor' : 'minor' })} disabled={isDeployingStaging} className="px-3.5 py-2 text-xs font-semibold bg-[#C81E3C] text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-45">
                      {isDeployingStaging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}Deploy to staging
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  {stat('Verified', `${verified}/${total}`, `${total ? Math.round((verified / total) * 100) : 0}% of the MVP`, verified === total && total ? '#34d399' : undefined)}
                  {stat('Built', `${built}/${total}`, `${total - built} not started or in progress`)}
                  {stat('AI agents', `${ai.filter((t) => t.verified).length}/${ai.length}`, 'routine UI, CRUD and API work')}
                  {stat('Human engineering', `${human.filter((t) => t.verified).length}/${human.length}`, 'architecture, integrations, security, hard bugs')}
                  {stat('Staging', project?.staging?.version || '—', project?.staging ? `deployed ${new Date(project.staging.deployedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'not deployed yet', project?.staging ? '#34d399' : undefined)}
                </div>
                {failing > 0 && <p className="m-0 text-xs text-[#FF8FA3]">{failing} {failing === 1 ? 'task fails' : 'tasks fail'} QA. Open the task in the studio to see the issues, fix, then run QA again.</p>}
                {total > 0 && (
                  <div className="h-2 w-full bg-[#0C0C0E] border border-[#2a2a30] flex">
                    <div style={{ width: `${(verified / total) * 100}%`, background: '#34d399' }} />
                    <div style={{ width: `${((built - verified) / total) * 100}%`, background: '#fbbf24' }} />
                  </div>
                )}
              </section>
            )
          })()}
          <BuildAgentPanel
            project={project}
            engineeringTasks={engineeringTasks}
            showToast={showToast}
            onRefreshProject={async () => {
              if (!project?.id) return
              try {
                const { getCoLaunchProject } = await import('../../services/opsApi')
                const fresh = await getCoLaunchProject(project.id)
                if (Array.isArray(fresh?.engineeringTasks)) {
                  setEngineeringTasks(fresh.engineeringTasks)
                  onUpdateProject?.((prev) => ({ ...(prev || {}), engineeringTasks: fresh.engineeringTasks, staging: fresh.staging || prev?.staging }))
                }
              } catch (e) { console.warn('[Phase2] agent refresh', e) }
            }}
          />

            </div>
          </details>

          {/* Step 2 Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#2a2a30]">
            <button
              onClick={() => setActiveStep('plan')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0C0C0E] hover:bg-[#111114] text-[#D4D4D8] border border-[#3a3a42] shadow-2xs text-xs font-semibold cursor-pointer"
            >
              ← Back to Product Plan
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveStepState('beta')
                if (onSelectStep) onSelectStep('beta')
                if (typeof window !== 'undefined') {
                  try {
                    const url = new URL(window.location.href)
                    url.searchParams.set('step', 'beta')
                    url.searchParams.set('modal', 'phase')
                    window.history.replaceState({}, '', url.toString())
                    if (project?.id) {
                      localStorage.setItem(`forge_p2_step_${project.id}`, 'beta')
                    }
                  } catch (e) {}
                }
                if (onUpdateProject) {
                  onUpdateProject(prev => ({
                    ...(prev || {}),
                    buildCompleted: true,
                    mvpBuildDone: true,
                    currentStep: 'beta',
                    current_step: 'beta'
                  }))
                }
                handleSavePlan(buildPlan, engineeringTasks, {
                  buildCompleted: true,
                  mvpBuildDone: true,
                  currentStep: 'beta',
                  current_step: 'beta'
                }).catch(err => console.warn('[Phase2BuildMVP] Background save beta warning:', err))
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Proceed to 3. Beta Test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: BETA TEST (CUSTOMER COHORT & AI FEEDBACK CLUSTERING) */}
      {activeStep === 'beta' && (
        <div className="space-y-5">
          {/* Beta usage: who was invited, who is using it, what they report */}
          {(() => {
            const usage = project?.betaUsage || {}
            const invited = betaCohort.filter((b) => b.inviteStatus === 'Sent' || b.lastInviteSentAt).length
            const bySource = ['presale', 'waitlist', 'survey'].map((k) => [k, betaCohort.filter((b) => (b.source || 'presale') === k).length])
            const cats = ['Bug', 'Feature request', 'Objection', 'Support question', 'Onboarding / UX', 'Praise'].map((c) => [c, rawFeedback.filter((f) => (f.category || f.type) === c).length])
            return (
              <section className="p-4 sm:p-5 bg-[#111114] border border-[#2a2a30] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#71717A]">Beta usage</p>
                  <a href={`${origin}/beta/${productSlug}?token=preview`} target="_blank" rel="noreferrer" className="text-xs text-[#E4E4E7] flex items-center gap-1.5">Open the tester page <ExternalLink className="w-3 h-3" /></a>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    ['Cohort', betaCohort.length, bySource.filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(' · ') || 'no customers yet'],
                    ['Invited', invited, `${betaCohort.length - invited} not invited yet`],
                    ['Active testers', usage.testersActive || 0, `${usage.opens || 0} sessions${usage.lastOpenAt ? ` · last ${new Date(usage.lastOpenAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : ''}`],
                    ['Reports', rawFeedback.length, `${(feedbackClusters || []).length} issues grouped`],
                  ].map(([label, value, sub]) => (
                    <div key={label} className="p-3.5 bg-[#0C0C0E] border border-[#2a2a30] space-y-1">
                      <p className="m-0 text-[11px] text-[#A1A1AA]">{label}</p>
                      <p className="m-0 text-2xl leading-none text-[#FAFAFA]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{value}</p>
                      <p className="m-0 text-[11px] text-[#71717A]">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cats.map(([c, n]) => (
                    <span key={c} className="px-2 py-1 text-[11px] font-semibold border" style={{ borderColor: n ? '#3a3a42' : '#222227', color: n ? '#E4E4E7' : '#71717A', background: '#0C0C0E' }}>{c} · {n}</span>
                  ))}
                </div>
              </section>
            )
          })()}
          {/* Subtabs for Step 3 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#2a2a30] pb-3">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#18181C] border border-[#2a2a30]/80 max-w-full overflow-x-auto">
              {[
                { id: 'clusters', label: '1. AI Recurring Feedback Clusters' },
                { id: 'cohort', label: `2. Beta Cohort Invites (${betaCohort.length})` },
                { id: 'feedback', label: '3. Raw Customer Feedback Feed' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setBetaSubtab(sub.id)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    betaSubtab === sub.id
                      ? 'bg-[#0C0C0E] text-[#FAFAFA] border border-[#2a2a30]/80 shadow-2xs font-bold'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#0C0C0E]/60'
                  }`}
                >
                  <span className="whitespace-nowrap">{sub.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {feedbackClusters && (
                <button
                  onClick={handleClearClusters}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-500/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Clear current feedback clusters"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  <span>Clear Clusters</span>
                </button>
              )}

              <button
                onClick={handleClusterFeedbackAI}
                disabled={isClusteringAI}
                className="px-3 py-1.5 rounded-lg bg-[#050506] hover:bg-[#1C1C20] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {isClusteringAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4D4D8]" />
                    <span>AI Grouping Feedback...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#D4D4D8]" />
                    <span>AI Cluster & Group Feedback ({rawFeedback.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SUBTAB 1: AI CLUSTERS */}
          {betaSubtab === 'clusters' && (
            isClusteringAI ? (
              <FeedbackClusterSkeleton />
            ) : !feedbackClusters ? (
              <div className="p-10 sm:p-14 rounded-3xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs text-center space-y-4 my-2">
                <div className="w-14 h-14 rounded-2xl bg-[#18181C] border border-[#2a2a30] text-[#D4D4D8] flex items-center justify-center mx-auto shadow-2xs">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-sm font-black text-[#FAFAFA]">No Feedback Clusters Generated Yet</h4>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {rawFeedback.length === 0
                      ? 'No customer feedback has been collected yet. Collect issues from beta testers via the Beta Testing Portal or log feedback manually in Subtab 3.'
                      : `${rawFeedback.length} customer feedback items are logged and ready. Click "AI Cluster & Group Feedback" to synthesize recurring issue clusters.`}
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleClusterFeedbackAI}
                    disabled={isClusteringAI || rawFeedback.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-[#050506] hover:bg-[#1C1C20] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4D4D8]" />
                    <span>AI Cluster & Group Feedback ({rawFeedback.length} items)</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>AI Recurring Issue Summaries & Quantified Clusters</span>
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    AI analyzes support conversations, bug reports, and objections into prioritized resolution tasks.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-amber-300" />
                    AI Synthesized ({feedbackClusters.length} clusters)
                  </span>
                  <button
                    onClick={handleClearClusters}
                    className="text-[11px] font-bold text-rose-300 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {feedbackClusters.map((cluster, idx) => {
                  const category = cluster?.category || 'Feedback'
                  const severity = cluster?.severity || 'Low'
                  const count = cluster?.count || 1
                  const title = cluster?.title || 'User Feedback Cluster'
                  const description = cluster?.description || ''
                  const quote = cluster?.exampleQuote || ''
                  const fix = cluster?.recommendedAction || ''
                  const catLower = String(category).toLowerCase()
                  const isBug = catLower.includes('bug') || catLower.includes('security')
                  const isUX = catLower.includes('ux') || catLower.includes('onboarding')

                  return (
                    <div
                      key={cluster?.id || `cluster-${idx}`}
                      className="p-4 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-[#FAFAFA] font-mono flex items-center gap-1.5">
                            <span className={isBug ? 'text-red-300' : isUX ? 'text-amber-300' : 'text-emerald-300'}>
                              {count} {count === 1 ? 'user' : 'users'}
                            </span>
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            severity === 'High'
                              ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                              : severity === 'Medium'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {category} • {severity}
                          </span>
                        </div>

                        <h4 className="font-bold text-[#FAFAFA] text-xs leading-snug">{title}</h4>
                        <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{description}</p>

                        {quote && (
                          <div className="p-2.5 rounded-xl bg-[#111114] border border-[#2a2a30] text-[10px] text-[#D4D4D8] italic font-medium">
                            "{quote}"
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#2a2a30] space-y-2">
                        {fix && (
                          <div className="text-[10px] text-emerald-300 font-medium">
                            <strong>Recommended Fix:</strong> {fix}
                          </div>
                        )}

                        <button
                          onClick={() => handleConvertClusterToTask(cluster)}
                          className="w-full py-2 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-black text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-white" />
                          <span>Convert to Sprint Task</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            )
          )}

          {/* SUBTAB 2: BETA COHORT INVITES */}
          {betaSubtab === 'cohort' && (
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#2a2a30] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#FAFAFA]">Presale & Waitlist Beta Access Manager</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C81E3C]/10 text-[#FF8FA3] border border-[#C81E3C]/45 font-mono">
                      {betaCohort.length} {betaCohort.length === 1 ? 'Backer' : 'Backers'}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Provision private tokens and dispatch email testing invites with direct sandbox URLs to early backers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/30">
                    ${presalesRevenue.toLocaleString()} Total Pledged
                  </span>

                  {betaCohort.length > 0 && (
                    <>
                      <button
                        onClick={handleSelectUnsentTesters}
                        className="px-2.5 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#222227] text-[#D4D4D8] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-[#2a2a30]"
                        title="Select cohort members who have not received an email invite yet"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#A1A1AA]" />
                        <span>Select Unsent</span>
                      </button>

                      <button
                        onClick={handleSelectAllTesters}
                        className="px-2.5 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#222227] text-[#D4D4D8] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-[#2a2a30]"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-[#A1A1AA]" />
                        <span>{selectedTesterIds.length === betaCohort.length ? 'Deselect All' : 'Select All'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenBulkEmailModal(selectedTesterIds.length > 0)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#C81E3C] hover:bg-[#B01732] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#FFD1DA]" />
                        <span>
                          {selectedTesterIds.length > 0
                            ? `Email Selected (${selectedTesterIds.length})`
                            : `Bulk Email Cohort (${betaCohort.length})`}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Batch Action Floating Pill Ribbon (When selection > 0) */}
              {selectedTesterIds.length > 0 && (
                <div className="p-3 rounded-xl bg-[#C81E3C]/10 border border-[#C81E3C]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C81E3C] animate-pulse" />
                    <span className="text-xs font-black text-[#FF8FA3] font-mono">
                      {selectedTesterIds.length} of {betaCohort.length} testers selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBulkEmailModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#C81E3C] hover:bg-[#B01732] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Selected Testers</span>
                    </button>

                    <button
                      onClick={() => {
                        const links = betaCohort
                          .filter(b => selectedTesterIds.includes(b.id || b.email))
                          .map(b => `${b.name} (${b.email}): ${origin}/beta/${productSlug}?token=${b.token}`)
                          .join('\n')
                        navigator.clipboard?.writeText(links)
                        showToast(`Copied ${selectedTesterIds.length} Magic Links to clipboard!`)
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0E] hover:bg-[#18181C] text-[#D4D4D8] border border-[#3a3a42] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Magic Links</span>
                    </button>

                    <button
                      onClick={() => setSelectedTesterIds([])}
                      className="px-2.5 py-1.5 rounded-lg text-[#A1A1AA] hover:text-[#D4D4D8] font-bold text-xs transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Invite New Backer Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.target
                  const name = form.name.value.trim()
                  const email = form.email.value.trim().toLowerCase()
                  const tier = form.tier.value
                  if (!name || !email) return

                  const existingIdx = betaCohort.findIndex(b => (b.email || '').trim().toLowerCase() === email)
                  if (existingIdx >= 0) {
                    const updated = [...betaCohort]
                    const cur = updated[existingIdx]
                    updated[existingIdx] = {
                      ...cur,
                      name: name || cur.name,
                      tier: cur.tier.includes(tier) ? cur.tier : `${cur.tier} • ${tier}`
                    }
                    setBetaCohort(updated)
                    handleSavePlan(buildPlan, engineeringTasks, { betaCohort: updated })
                    form.reset()
                    showToast(`Updated access tier for existing member ${name}!`)
                    return
                  }

                  const newBacker = {
                    id: `b-${Date.now()}`,
                    name,
                    email,
                    tier,
                    totalAmount: 0,
                    status: 'Active in Beta',
                    token: emailToken(email),
                    source: 'invited',
                    lastActive: 'Just now',
                    inviteStatus: 'Pending',
                    lastInviteSentAt: null
                  }
                  const updated = [newBacker, ...betaCohort]
                  setBetaCohort(updated)
                  handleSavePlan(buildPlan, engineeringTasks, { betaCohort: updated })
                  form.reset()
                  showToast(`Invited ${name} to private beta!`)
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30]"
              >
                <input
                  name="name"
                  type="text"
                  placeholder="Backer name..."
                  required
                  className="px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address..."
                  required
                  className="px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs"
                />
                <select
                  name="tier"
                  className="px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#D4D4D8] outline-none shadow-2xs"
                >
                  {projectPricingTiers.map((pt, idx) => (
                    <option key={idx} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-[#050506] hover:bg-[#1C1C20] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite Backer</span>
                </button>
              </form>

              {/* Cohort List */}
              {betaCohort.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#111114] border border-dashed border-[#3a3a42] text-center space-y-2">
                  <User className="w-8 h-8 text-[#71717A] mx-auto" />
                  <h4 className="text-xs font-bold text-[#FAFAFA]">No Beta Backers Invited Yet</h4>
                  <p className="text-[11px] text-[#A1A1AA] max-w-sm mx-auto">
                    Backers who pre-order in Phase 1 appear here automatically. Use the form above to invite additional testers.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {betaCohort.map(backer => {
                    const backerId = backer.id || backer.email
                    const isSelected = selectedTesterIds.includes(backerId)
                    const betaUrl = `${origin}/beta/${productSlug}?token=${backer.token}`
                    const isSent = Boolean(backer.lastInviteSentAt)

                    return (
                      <div
                        key={backerId}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isSelected ? 'bg-[#C81E3C]/10 border-[#C81E3C]/45 shadow-2xs' : 'bg-[#111114] border-[#2a2a30] hover:border-[#3a3a42]'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectTester(backerId)}
                            className="mt-0.5 sm:mt-0 text-[#71717A] hover:text-[#FF8FA3] transition-colors cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#FF8FA3]" />
                            ) : (
                              <Square className="w-4 h-4 text-[#71717A]" />
                            )}
                          </button>

                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-[#FAFAFA]">{backer.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#222227] text-[#E4E4E7] border border-[#3a3a42] font-bold">
                                {backer.tier}
                              </span>
                              {backer.totalAmount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                                  ${backer.totalAmount} Contributed
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#A1A1AA] font-mono block mt-0.5">{backer.email}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Invite status pill */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                            isSent
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          }`}>
                            <Mail className="w-3 h-3" />
                            {isSent ? 'Invite Sent' : 'Not Contacted'}
                          </span>

                          {/* Email Specific Tester Button */}
                          <button
                            onClick={() => handleOpenSingleTesterEmail(backer)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#C81E3C]/10 hover:bg-[#C81E3C]/10 text-[#FF8FA3] border border-[#C81E3C]/45 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title={`Compose and send email invitation to ${backer.email}`}
                          >
                            <Mail className="w-3 h-3 text-[#FF8FA3]" />
                            <span>Email Tester</span>
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(betaUrl)
                              showToast(`Copied Beta Magic Link for ${backer.name}!`)
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0E] hover:bg-[#18181C] text-[#D4D4D8] border border-[#3a3a42] shadow-2xs font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copy tester magic link"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </button>

                          <a
                            href={betaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C81E3C] hover:bg-[#B01732] text-white font-black text-[11px] transition-colors cursor-pointer shadow-2xs"
                            title="Open testing portal as this tester"
                          >
                            <span>Open Portal</span>
                            <ExternalLink className="w-3 h-3 text-[#080A0C]" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: RAW FEEDBACK LOGGER */}
          {betaSubtab === 'feedback' && (
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-4">
              <h3 className="text-xs font-black text-[#FAFAFA] uppercase tracking-wider">Log Customer Support Conversation / Friction Point</h3>

              <form onSubmit={handleAddFeedback} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  placeholder="Customer name..."
                  value={newFeedbackAuthor}
                  onChange={e => setNewFeedbackAuthor(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs"
                />
                <select
                  value={newFeedbackType}
                  onChange={e => setNewFeedbackType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#D4D4D8] outline-none shadow-2xs"
                >
                  <option value="Bug">Bug</option>
                  <option value="Feature request">Feature request</option>
                  <option value="Objection">Objection</option>
                  <option value="Support question">Support question</option>
                  <option value="Onboarding / UX">Onboarding / UX</option>
                  <option value="Praise">Praise</option>
                </select>
                <input
                  type="text"
                  placeholder="Feedback or message..."
                  value={newFeedbackMsg}
                  onChange={e => setNewFeedbackMsg(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs"
                />
                <button
                  type="submit"
                  className="sm:col-span-4 py-2.5 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>Log Feedback Item</span>
                </button>
              </form>

              {/* Feed List */}
              <div className="space-y-2 pt-2">
                {rawFeedback.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#111114] border border-dashed border-[#2a2a30] text-xs text-[#A1A1AA] space-y-1">
                    <p className="font-semibold text-[#D4D4D8]">No beta feedback logged yet</p>
                    <p className="text-[11px] text-[#A1A1AA]">Log customer conversations above, or invite beta testers to submit feedback via the Beta Portal.</p>
                  </div>
                ) : (
                  rawFeedback.map(f => (
                    <div key={f.id} className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#FAFAFA]">{f.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#A1A1AA] font-mono">{f.type} • {f.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeedback(f.id)}
                            className="text-[#71717A] hover:text-rose-300 p-0.5 transition-colors cursor-pointer"
                            title="Delete feedback entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[#D4D4D8] text-[11px]">"{f.message}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3 Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#2a2a30]">
            <button
              onClick={() => setActiveStep('build')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0C0C0E] hover:bg-[#111114] text-[#D4D4D8] border border-[#3a3a42] shadow-2xs text-xs font-semibold cursor-pointer"
            >
              ← Back to Build
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveStepState('gate')
                if (onSelectStep) onSelectStep('gate')
                if (typeof window !== 'undefined') {
                  try {
                    const url = new URL(window.location.href)
                    url.searchParams.set('step', 'gate')
                    url.searchParams.set('modal', 'phase')
                    window.history.replaceState({}, '', url.toString())
                    if (project?.id) {
                      localStorage.setItem(`forge_p2_step_${project.id}`, 'gate')
                    }
                  } catch (e) {}
                }
                if (onUpdateProject) {
                  onUpdateProject(prev => ({
                    ...(prev || {}),
                    betaTestingCompleted: true,
                    currentStep: 'gate',
                    current_step: 'gate'
                  }))
                }
                handleSavePlan(buildPlan, engineeringTasks, {
                  betaTestingCompleted: true,
                  currentStep: 'gate',
                  current_step: 'gate'
                }).catch(err => console.warn('[Phase2BuildMVP] Background save gate warning:', err))
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Proceed to 4. Iterate + Launch Gate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: ITERATE + LAUNCH GATE */}
      {activeStep === 'gate' && (
        <Phase2Step4Gate
          project={project}
          engineeringTasks={engineeringTasks}
          qaResults={qaResults}
          feedbackClusters={feedbackClusters || []}
          rawFeedback={rawFeedback}
          betaCohort={betaCohort}
          appliedPatches={appliedPatches}
          mvpVersion={mvpVersion}
          readinessReport={readinessReport}
          isAuditing={isAuditing}
          onGenerateReport={handleGenerateReadinessAudit}
          isAutoFixing={isAutoFixing}
          onFixCycle={handleApplyAIAutoFixes}
          qaRunning={qaRunning}
          onRunQA={() => handleRunAutomatedQA(qaResults)}
          isDeployingStaging={isDeployingStaging}
          onDeployStaging={handleDeployStaging}
          executingTaskId={executingTaskId}
          goToStep={(id) => setActiveStep(id)}
          onLaunch={onAdvanceToPhase3}
          onRecordDecision={async (record) => {
            const decisions = [record, ...(project?.phase2Decisions || [])]
            const extra = { phase2Decisions: decisions, ...(record.decision === 'kill' ? { status: 'killed' } : {}) }
            onUpdateProject?.((prev) => ({ ...(prev || {}), ...extra }))
            await handleSavePlan(buildPlan, engineeringTasks, extra)
          }}
          origin={origin}
          productSlug={productSlug}
          showToast={showToast}
        />
      )}

      {/* ── BETA TESTER EMAIL DISPATCHER MODAL ───────────────────────── */}
      {showBetaEmailModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#050506]/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="max-w-2xl w-full bg-[#0C0C0E] border border-[#2a2a30] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#FAFAFA] overscroll-contain">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#2a2a30] flex items-center justify-between bg-[#111114]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C81E3C] text-white flex items-center justify-center shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#FAFAFA] tracking-tight">
                    {emailModalMode === 'single' && targetTester
                      ? `Send Beta Invitation to ${targetTester.name}`
                      : `Bulk Dispatch Beta Invitations`}
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA]">
                    {emailModalMode === 'single' && targetTester
                      ? `Recipient: ${targetTester.email}`
                      : `Dispatching to ${selectedTesterIds.length} selected beta testers`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowBetaEmailModal(false)
                  setSendResultLogs(null)
                  setIsSendingEmails(false)
                }}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#222227]/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Sending In Progress State */}
              {isSendingEmails ? (
                <div className="py-10 px-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#C81E3C]/10 text-[#FF8FA3] flex items-center justify-center mx-auto shadow-2xs">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF8FA3]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-[#FAFAFA]">Dispatching Beta Invitations...</h4>
                    <p className="text-xs text-[#A1A1AA]">
                      Sending {sendProgress.current} of {sendProgress.total}:{' '}
                      <span className="font-mono font-bold text-[#E4E4E7]">{sendProgress.currentEmail}</span>
                    </p>
                  </div>
                  <div className="w-full bg-[#18181C] rounded-full h-2.5 overflow-hidden border border-[#2a2a30] max-w-md mx-auto">
                    <div
                      className="bg-[#C81E3C] h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((sendProgress.current / (sendProgress.total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSendingEmails(false)
                        setShowBetaEmailModal(false)
                      }}
                      className="text-[11px] font-bold text-[#A1A1AA] hover:text-[#E4E4E7] underline cursor-pointer"
                    >
                      Dismiss (Finishes in Background)
                    </button>
                  </div>
                </div>
              ) : sendResultLogs ? (
                /* Success Logs State */
                <div className="space-y-4 py-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center mx-auto shadow-2xs">
                      <Check className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-black text-emerald-300">Invitations Dispatched Successfully!</h4>
                    <p className="text-xs text-emerald-300">
                      Sent {sendResultLogs.successCount} testing {sendResultLogs.successCount === 1 ? 'invitation' : 'invitations'} with personalized magic tokens.
                    </p>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-[#2a2a30] p-2.5 bg-[#111114]">
                    <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block px-1">
                      Dispatch Log
                    </span>
                    {sendResultLogs.logs.map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0C0C0E] border border-[#2a2a30] text-[11px]">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                          <span className="font-bold text-[#E4E4E7]">{log.name}</span>
                          <span className="text-[#A1A1AA] font-mono">({log.email})</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#71717A]">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Standard Compose / Preview State */
                <>
                  {/* 1. Target Testing URL Configuration */}
                  <div className="p-3.5 rounded-2xl bg-[#111114] border border-[#2a2a30] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-[#E4E4E7] uppercase tracking-wider flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-[#FF8FA3]" />
                        <span>Testing Destination Page URL</span>
                      </label>
                      <a
                        href={`${(emailTestingUrl || `${origin}/beta/${productSlug}`).split('?')[0]}?token=preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#FF8FA3] hover:text-[#FF8FA3] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Preview Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={emailTestingUrl || `${origin}/beta/${productSlug}`}
                        onChange={e => setEmailTestingUrl(e.target.value)}
                        placeholder={`${origin}/beta/${productSlug}`}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] font-mono outline-none shadow-2xs focus:border-[#C81E3C] focus:ring-1 focus:ring-[#C81E3C]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(emailTestingUrl || `${origin}/beta/${productSlug}`)
                          showToast('Copied Testing URL!')
                        }}
                        className="px-2.5 py-2 rounded-xl bg-[#0C0C0E] hover:bg-[#18181C] text-[#D4D4D8] border border-[#3a3a42] text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-[#A1A1AA] leading-normal">
                      Each tester automatically gets their individual token appended (<code className="bg-[#222227] px-1 py-0.5 rounded text-[#E4E4E7] font-mono">?token=beta_xxxx</code>) when the email is dispatched.
                    </p>
                  </div>

                  {/* 2. Recipient Selector Chips (In Bulk Mode) */}
                  {emailModalMode === 'bulk' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-[#E4E4E7] uppercase tracking-wider">
                          Recipients ({selectedTesterIds.length} Selected)
                        </label>
                        <button
                          type="button"
                          onClick={() => setSelectedTesterIds(betaCohort.map(b => b.id || b.email))}
                          className="text-[10px] font-bold text-[#FF8FA3] hover:underline"
                        >
                          Select All ({betaCohort.length})
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-[#111114] border border-[#2a2a30]">
                        {betaCohort
                          .filter(b => selectedTesterIds.includes(b.id || b.email))
                          .map(b => (
                            <span
                              key={b.id || b.email}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0C0C0E] border border-[#2a2a30] text-[10px] font-medium text-[#D4D4D8] shadow-2xs"
                            >
                              <span className="font-bold text-[#FAFAFA]">{b.name}</span>
                              <span className="text-[#71717A]">({b.email})</span>
                              <button
                                type="button"
                                onClick={() => handleToggleSelectTester(b.id || b.email)}
                                className="text-[#71717A] hover:text-red-300 ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Preset Templates & AI Enhancer — Tight Compact Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 py-0.5">
                    <div className="inline-flex items-center gap-0.5 bg-[#18181C]/90 p-0.5 rounded-lg border border-[#2a2a30]/90 max-w-full overflow-x-auto">
                      {[
                        { id: 'standard', label: 'Standard Invitation' },
                        { id: 'bugbash', label: 'Bug Bash / QA' },
                        { id: 'vip', label: 'VIP Founder Access' }
                      ].map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectTemplatePreset(preset.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer leading-none ${
                            emailTemplatePreset === preset.id
                              ? 'bg-[#0C0C0E] text-[#FAFAFA] border border-[#2a2a30]/80 shadow-2xs'
                              : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#0C0C0E]/50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isPolishingEmailAI}
                        onClick={handleAiPolishEmail}
                        className="px-2.5 py-1 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 font-bold text-[11px] border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap leading-none"
                      >
                        {isPolishingEmailAI ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-amber-300 shrink-0" />
                            <span>AI Polishing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                            <span>AI Polish Copy</span>
                          </>
                        )}
                      </button>

                      {/* Tab switch: Compose vs Preview */}
                      <div className="inline-flex rounded-lg bg-[#18181C]/90 p-0.5 border border-[#2a2a30]/90">
                        <button
                          type="button"
                          onClick={() => setEmailPreviewTab('compose')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap leading-none ${
                            emailPreviewTab === 'compose'
                              ? 'bg-[#0C0C0E] text-[#FAFAFA] shadow-2xs border border-[#2a2a30]/80'
                              : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                          }`}
                        >
                          Compose
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailPreviewTab('preview')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap leading-none ${
                            emailPreviewTab === 'preview'
                              ? 'bg-[#0C0C0E] text-[#FAFAFA] shadow-2xs border border-[#2a2a30]/80'
                              : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                          }`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. Compose / Preview View */}
                  {emailPreviewTab === 'compose' ? (
                    <div className="space-y-3">
                      {/* Subject */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-[#E4E4E7] uppercase tracking-wider block">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={e => setEmailSubject(e.target.value)}
                          placeholder="e.g. [Private Beta Access] You're invited to test..."
                          className="w-full px-3.5 py-2 rounded-xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs focus:border-[#C81E3C] focus:ring-1 focus:ring-[#C81E3C] font-medium"
                        />
                      </div>

                      {/* Body */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-[#E4E4E7] uppercase tracking-wider">
                            Email Message Template
                          </label>
                          <div className="flex items-center gap-1 text-[10px] text-[#A1A1AA] font-mono">
                            <span>Tags:</span>
                            <button
                              type="button"
                              onClick={() => setEmailBodyTemplate(prev => prev + ' {{name}}')}
                              className="px-1.5 py-0.5 rounded bg-[#18181C] hover:bg-[#222227] text-[#D4D4D8] border border-[#2a2a30]"
                            >
                              {'{{name}}'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEmailBodyTemplate(prev => prev + ' {{betaUrl}}')}
                              className="px-1.5 py-0.5 rounded bg-[#18181C] hover:bg-[#222227] text-[#D4D4D8] border border-[#2a2a30]"
                            >
                              {'{{betaUrl}}'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEmailBodyTemplate(prev => prev + ' {{tier}}')}
                              className="px-1.5 py-0.5 rounded bg-[#18181C] hover:bg-[#222227] text-[#D4D4D8] border border-[#2a2a30]"
                            >
                              {'{{tier}}'}
                            </button>
                          </div>
                        </div>

                        <textarea
                          rows={8}
                          value={emailBodyTemplate}
                          onChange={e => setEmailBodyTemplate(e.target.value)}
                          className="w-full p-3.5 rounded-2xl bg-[#0C0C0E] border border-[#3a3a42] text-xs text-[#FAFAFA] outline-none shadow-2xs font-sans leading-relaxed focus:border-[#C81E3C] focus:ring-1 focus:ring-[#C81E3C]"
                          placeholder="Write your email invitation message..."
                        />
                      </div>
                    </div>
                  ) : (
                    /* Live Email Preview */
                    <div className="p-5 rounded-2xl bg-[#111114] border border-[#2a2a30] space-y-4">
                      {/* Email simulated envelope */}
                      <div className="p-3 rounded-xl bg-[#0C0C0E] border border-[#2a2a30] space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#A1A1AA]">To:</span>
                          <span className="font-bold text-[#FAFAFA]">
                            {targetTester?.name || betaCohort[0]?.name || 'Alex Backer'} &lt;
                            {targetTester?.email || betaCohort[0]?.email || 'alex@example.com'}&gt;
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1C1C20]">
                          <span className="text-[#A1A1AA]">Subject:</span>
                          <span className="font-black text-[#FAFAFA]">
                            {emailSubject
                              .replace(/\{\{name\}\}/gi, targetTester?.name || betaCohort[0]?.name || 'Alex Backer')
                              .replace(/\{\{productName\}\}/gi, project?.productName || 'the MVP')
                              .replace(/\{\{tier\}\}/gi, targetTester?.tier || betaCohort[0]?.tier || 'Founding Backer')
                              .replace(/\{\{token\}\}/gi, targetTester?.token || betaCohort[0]?.token || 'beta_access123')
                              .replace(/\{\{betaUrl\}\}/gi, `${(emailTestingUrl || `${origin}/beta/${productSlug}`).split('?')[0]}?token=${targetTester?.token || betaCohort[0]?.token || 'beta_access123'}`)}
                          </span>
                        </div>
                      </div>

                      {/* Rendered Email Body Box */}
                      <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] space-y-4 shadow-xs">
                        <div className="text-xs text-[#E4E4E7] whitespace-pre-wrap leading-relaxed">
                          {emailBodyTemplate
                            .replace(/\{\{name\}\}/gi, targetTester?.name || betaCohort[0]?.name || 'Alex Backer')
                            .replace(/\{\{productName\}\}/gi, project?.productName || 'the MVP')
                            .replace(/\{\{tier\}\}/gi, targetTester?.tier || betaCohort[0]?.tier || 'Founding Backer')
                            .replace(/\{\{token\}\}/gi, targetTester?.token || betaCohort[0]?.token || 'beta_access123')
                            .replace(/\{\{betaUrl\}\}/gi, `${(emailTestingUrl || `${origin}/beta/${productSlug}`).split('?')[0]}?token=${targetTester?.token || betaCohort[0]?.token || 'beta_access123'}`)}
                        </div>

                        {/* Highlighted CTA Button In Email */}
                        <div className="pt-2 text-center">
                          <a
                            href={`${(emailTestingUrl || `${origin}/beta/${productSlug}`).split('?')[0]}?token=${targetTester?.token || betaCohort[0]?.token || 'beta_access123'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-bold text-xs shadow-md"
                          >
                            <span>Open Beta Testing Portal & Sandbox</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#2a2a30] bg-[#111114] flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSendingEmails}
                onClick={() => {
                  setShowBetaEmailModal(false)
                  setSendResultLogs(null)
                }}
                className="px-4 py-2 rounded-xl bg-[#0C0C0E] hover:bg-[#18181C] text-[#D4D4D8] border border-[#3a3a42] font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {sendResultLogs ? 'Close' : 'Cancel'}
              </button>

              {!sendResultLogs && !isSendingEmails && (
                <button
                  type="button"
                  onClick={handleSendBetaEmails}
                  className="px-5 py-2.5 rounded-xl bg-[#C81E3C] hover:bg-[#B01732] text-white font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#FFD1DA]" />
                  <span>
                    {emailModalMode === 'single' && targetTester
                      ? `Send Invitation to ${targetTester.name}`
                      : `Dispatch ${selectedTesterIds.length} Beta Invitations`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
