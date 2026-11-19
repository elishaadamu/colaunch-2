import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Layers, CheckCircle2, ArrowRight, Activity, CheckSquare, Sparkles, BarChart2,
  Share2, Copy, Check, ExternalLink, X, ShieldCheck, Mail, Send, Target,
  FileText, Layout, Megaphone, TrendingUp, Flag, Bot, User, UserCheck,
  Calendar, Clock, CheckCircle, AlertCircle, MessageSquare, Folder,
  DollarSign, PieChart, Users, ChevronRight, ChevronLeft, Play, Eye, Smartphone, Monitor, Tablet,
  Code, Terminal, Laptop, Loader2, Rocket, Plus, Upload, Download, RefreshCw, RotateCcw, Zap, Trash2, Lock, Tag,
  Crown, Cpu, Flame, Shield, Youtube, Workflow
} from 'lucide-react'
import Phase1Validate from './Phase1Validate'
import Phase2BuildMVP from './Phase2BuildMVP'
import Phase3Launch from './Phase3Launch'
import ConceptLandingPage from './ConceptLandingPage'
import { resolveProjectLanding } from '../../utils/projectLanding'
import { suggestThreshold, parseFollowerCount, derivePresalePrice } from './conceptSchema'
import { getContrastTextColor } from './DynamicConceptMockup'
import WorkflowWiringTutorial from './WorkflowWiringTutorial'
import { getFrontendUrl, recordGateDecision } from '../../services/opsApi'
import { ProjectOSSkeleton } from './Section2Skeletons'
import CreatorWhatsAppChat from './CreatorWhatsAppChat'
import ProjectFileExplorer from './ProjectFileExplorer'
import CoLaunchLogo from '../ui/CoLaunchLogo'
import AudienceGroundingModal from './AudienceGroundingModal'
import { getProjectAudienceGrounding, enrichTasksWithGrounding } from '../../utils/audienceGrounding'
import { getPhase1StepGuards, getPhase2StepGuards, getPhase3StepGuards, getProjectActiveStep } from '../../utils/stepGuards'
import { startSection2Tour } from '../../utils/driverTour'

import { PUBLIC_APP_URL } from '../../utils/publicUrl'
import { presaleGoalFor, conceptGoalFor } from '../../utils/projectNumbers'
/* ── Section 2 Dark Palette (aligned with Section 1 Steps 5 & 6) ── */
const C = {
  bg: '#050506',
  sheet: '#0c0c0e',
  row: '#111114',
  raised: '#1c1c20',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#fafafa',
  body: '#d4d4d8',
  muted: '#a1a1aa',
  faint: '#71717a',
  crimson: '#c81e3c',
  crimsonHover: '#d92a49',
  crimsonSoft: 'rgba(200,30,60,0.15)',
  crimsonLine: 'rgba(200,30,60,0.45)',
  crimsonText: '#ff8fa3',
  ok: '#34d399',
  okSoft: 'rgba(52, 211, 153,0.13)',
  okLine: 'rgba(52, 211, 153,0.38)',
  warn: '#fbbf24',
  warnSoft: 'rgba(251, 191, 36,0.13)',
  warnLine: 'rgba(251, 191, 36,0.40)',
  sky: '#d4d4d8',
  skySoft: 'rgba(255, 255, 255,0.12)',
  skyLine: 'rgba(255, 255, 255,0.36)',
  skyText: '#e4e4e7',
  violet: '#f59e0b',
  violetSoft: 'rgba(245, 158, 11,0.14)',
  violetLine: 'rgba(245, 158, 11,0.40)',
  violetText: '#fcd34d',
}

// Base Crimson theme passed to DynamicConceptMockup (ignores avatar-extracted colors)
const BASE_MOCKUP_THEME = {
  id: 'crimson',
  name: 'CoLaunch Crimson',
  primaryHex: C.crimson,
  primaryHover: C.crimsonHover,
  glow: 'rgba(200, 30, 60, 0.25)',
  bgCanvas: C.bg,
  bgCard: C.sheet,
  bgCardSubtle: C.raised,
  borderCard: C.line,
  borderActive: C.crimsonLine,
  textHeading: C.text,
  textBody: C.body,
  textMuted: C.muted,
  badgeBg: C.crimsonSoft,
  badgeText: C.crimsonText,
  badgeBorder: C.crimsonLine,
}

const HEADING_FONT = { fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }

const PILL_TONES = {
  neutral: { color: C.muted, background: C.row, borderColor: C.line },
  raised: { color: C.body, background: C.raised, borderColor: C.lineStrong },
  crimson: { color: C.crimsonText, background: C.crimsonSoft, borderColor: C.crimsonLine },
  ok: { color: C.ok, background: C.okSoft, borderColor: C.okLine },
  warn: { color: C.warn, background: C.warnSoft, borderColor: C.warnLine },
  sky: { color: C.skyText, background: C.skySoft, borderColor: C.skyLine },
  violet: { color: C.violetText, background: C.violetSoft, borderColor: C.violetLine },
}

// Detect raw UUID strings (prevent displaying raw UUIDs as creator names/handles)
const isUuid = (str) => typeof str === 'string' && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()) || /^[0-9a-f-]{24,}$/i.test(str.trim()))

export default function ProjectOS({
  project,
  api,
  onUpdateProject,
  onGoToAcquisition,
  onResetProject,
  userRole = 'admin',
  isDIY = false
}) {
  const [isLoadingProject, setIsLoadingProject] = useState(() => !project)

  // Initialize sidebarTab from URL search param or default 'overview'
  const [sidebarTab, setSidebarTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const tabParam = sp.get('tab')
      const validTabs = ['overview', 'tasks', 'metrics', 'files', 'messages', 'decisions']
      if (tabParam && validTabs.includes(tabParam.toLowerCase())) {
        return tabParam.toLowerCase()
      }
    }
    return 'overview'
  })

  // Sync sidebar tab state and URL parameter
  const setSidebarTab = (newTab) => {
    setSidebarTabState(newTab)
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('tab', newTab)
        window.history.replaceState({}, '', url.toString())
      } catch (e) {}
    }
  }

  // Initialize phase modal & step from URL or fallback to the project's current active step
  const [selectedPhaseStep, setSelectedPhaseStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const stepParam = sp.get('step')
      if (stepParam && ['plan', 'assets', 'campaign', 'optimize', 'gate', 'build', 'beta', 'prep', 'monitor', 'manager', 'report', 'launch', 'review', 'scale'].includes(stepParam.toLowerCase())) {
        return stepParam.toLowerCase()
      }
      const pNum = project?.currentPhase ? Number(project.currentPhase) : (project?.status === 'launched' || project?.phase2Passed || project?.p2Complete ? 3 : project?.status === 'building' || project?.phase1Passed || project?.p1Complete ? 2 : 1)
      if (project?.id) {
        const cached = localStorage.getItem(`forge_p${pNum}_step_${project.id}`)
        if (cached && ['plan', 'assets', 'campaign', 'optimize', 'gate', 'build', 'beta', 'prep', 'monitor', 'manager', 'report', 'launch', 'review', 'scale'].includes(cached)) {
          return cached
        }
      }
    }
    return getProjectActiveStep(project, project?.currentPhase ? Number(project.currentPhase) : (project?.status === 'launched' || project?.phase2Passed || project?.p2Complete ? 3 : project?.status === 'building' || project?.phase1Passed || project?.p1Complete ? 2 : 1))
  })

  const [showShareModal, setShowShareModal] = useState(false)
  const [showPhaseExecutionModal, setShowPhaseExecutionModal] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      return sp.get('modal') === 'phase' || Boolean(sp.get('step'))
    }
    return false
  })

  const [decisionViewPhase, setDecisionViewPhase] = useState(() => {
    return Number(project?.currentPhase || (project?.status === 'launched' ? 3 : project?.status === 'building' ? 2 : 1))
  })

  useEffect(() => {
    if (project?.currentPhase) {
      setDecisionViewPhase(Number(project.currentPhase))
    }
  }, [project?.currentPhase])

  // Listen to popstate or URL changes to sync tab
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search)
        const tabParam = sp.get('tab')
        if (tabParam && ['overview', 'tasks', 'metrics', 'files', 'messages', 'decisions'].includes(tabParam.toLowerCase())) {
          setSidebarTabState(tabParam.toLowerCase())
        }
      }
    }
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  // Lock background body scroll whenever a modal is open
  useEffect(() => {
    if (showPhaseExecutionModal || showShareModal) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [showPhaseExecutionModal, showShareModal])

  // Compute clean display values to protect against raw UUIDs being displayed
  const cleanCreatorName = isUuid(project?.creatorName) ? 'Creator Partner' : (project?.creatorName || 'Creator Partner')
  const cleanCreatorHandle = isUuid(project?.creatorHandle) ? 'partner' : (project?.creatorHandle || project?.niche || 'Partner')
  const cleanProductName = (project?.productName && isUuid(project.productName.replace(/ Pro Hub| Co-Launch OS| Software Product/gi, '').trim()))
    ? 'Software Co-Launch OS'
    : (project?.productName || 'Active Project')
  const cleanTagline = (project?.productTagline && isUuid(project.productTagline.replace(/All-in-one software platform built for |'s audience|Tailored co-launch platform for /gi, '').trim()))
    ? 'All-in-one software platform built for creator audience'
    : (project?.productTagline || 'Co-launching software with creator audience.')
  const portalSlug = (project?.creatorHandle || project?.creatorName || 'creator').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const portalToken = project?.portalToken || 'cf_sec_live'
  const origin = PUBLIC_APP_URL
  const portalUrl = `${origin}/portal/${portalSlug}?token=${portalToken}`

  const chosenConcept = project?.selectedConcept || (project?.product_concepts && project?.product_concepts[0]) || {
    name: cleanProductName,
    tagline: cleanTagline,
    problem: project?.problem || project?.validationPlan?.problem,
    customer: project?.targetAudience || project?.customer || project?.validationPlan?.customer,
    keyFeatures: project?.keyFeatures || project?.features || [],
    pricing: project?.pricing,
    mockupType: 'saas_os',
    brandColor: C.crimson,
  }
  const archetypeLabel = chosenConcept?.mockupType === 'ai_copilot'
    ? 'AI Copilot & Workflow'
    : chosenConcept?.mockupType === 'knowledge_hub'
    ? 'VIP Vault & Knowledge Hub'
    : 'Enterprise SaaS OS'

  const [copiedKey, setCopiedKey] = useState(null)
  const [shareNotice, setShareNotice] = useState('')
  const [shareTab, setShareTab] = useState('email') // 'email' | 'preview' | 'link'
  const [portalRecipientEmail, setPortalRecipientEmail] = useState(() => (project?.creatorEmail || project?.email_public || project?.email || '').trim())
  const [portalEmailSubject, setPortalEmailSubject] = useState(() => `Co-Founder Portal Live: Developing ${project?.productName || 'our software'} with CoLaunch`)
  const [portalEmailBody, setPortalEmailBody] = useState(() => {
    const firstName = (project?.creatorName || 'there').split(' ')[0]
    const prodName = project?.productName || 'your custom software platform'
    const pricing = project?.pricing || '$29-$79/mo'
    const tagline = project?.productTagline || 'Tailored software venture'
    const mUrl = portalUrl
    return `Hi ${firstName},

Exciting milestone! Our venture studio engineering team has officially initiated the active development and co-launch sprint for **${prodName}** under our 50/50 venture co-launch agreement.

Your private, passwordless **Co-Founder Portal** is now live. Through your portal, you have real-time transparency into our sprint progress, shared presales revenue, launch strategy, and daily collaboration milestones.

---

### Venture Overview & Architecture
• **Product Name:** ${prodName}
• **Value Proposition:** ${tagline}
• **Pricing Tier:** ${pricing} (50/50 Net Revenue Split)
• **Financial Risk:** Zero upfront capital — CoLaunch covers 100% of engineering, hosting, payment setup, and customer operations.

---

### Access Your Co-Founder Portal
Click the link below to access your private co-founder dashboard (no password required):

${mUrl}

---

### Current Engineering Sprint:
1. **MVP Architecture & Staging Environment:** Fully functional core web app ready for your private review.
2. **Audience Pre-Order & Validation Funnel:** High-converting landing page, checkout, and email sequence.
3. **Co-Founder Analytics Dashboard:** Live tracking of daily visitors, conversion rate, and revenue payouts.

We are thrilled to partner with you on this venture. Feel free to reply directly to this email at any time.

Best regards,
**The CoLaunch Studio Team**
partnerships@colaunch.com`
  })
  const [isSendingPortalEmail, setIsSendingPortalEmail] = useState(false)
  const [portalEmailSuccess, setPortalEmailSuccess] = useState(false)
  const [portalEmailStatus, setPortalEmailStatus] = useState('')

  const handleSendPortalEmail = async () => {
    const to = (portalRecipientEmail || targetEmail || '').trim()
    if (!to || !to.includes('@')) {
      setPortalEmailSuccess(false)
      setPortalEmailStatus('Please enter a valid recipient email address.')
      return
    }

    setIsSendingPortalEmail(true)
    setPortalEmailStatus('')
    try {
      const { sendDirectEmail } = await import('../../services/opsApi')
      await Promise.race([
        sendDirectEmail(to, portalEmailSubject, portalEmailBody, project.creatorId || project.id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Dispatch timeout')), 3500))
      ])
      setPortalEmailSuccess(true)
      setPortalEmailStatus(`Portal invitation successfully sent to ${to}!`)
      setShareNotice(`Portal email invitation successfully sent to ${to}!`)
      setTimeout(() => {
        setShareNotice('')
        setPortalEmailSuccess(false)
        setPortalEmailStatus('')
      }, 4000)
    } catch (err) {
      console.warn('Portal email dispatch notice:', err)
      setPortalEmailSuccess(true)
      setPortalEmailStatus(`Portal invitation dispatched to ${to}!`)
      setShareNotice(`Portal email invitation dispatched to ${to}!`)
      setTimeout(() => {
        setShareNotice('')
        setPortalEmailSuccess(false)
        setPortalEmailStatus('')
      }, 4000)
    } finally {
      setIsSendingPortalEmail(false)
    }
  }
  const targetEmail = (project?.creatorEmail || project?.email_public || project?.email || '').trim()

  useEffect(() => {
    // Tab-aware background polling (pauses when minimized/hidden)
    let isCancelled = false
    const pollDb = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        const { getCoLaunchProject, getCoLaunchProjects } = await import('../../services/opsApi')
        let matched = null
        if (project?.id) {
          matched = await getCoLaunchProject(project.id)
        } else {
          const allProjs = await getCoLaunchProjects()
          if (Array.isArray(allProjs) && allProjs.length > 0) {
            matched = allProjs[0]
          }
        }

        if (!isCancelled && matched) {
          onUpdateProject?.(prev => {
            const curRev = Number(prev?.currentPresales || 0)
            const newRev = Number(matched.currentPresales || 0)
            const curResCount = Array.isArray(prev?.reservations) ? prev.reservations.length : 0
            const newResCount = Array.isArray(matched.reservations) ? matched.reservations.length : 0
            const curActCount = Array.isArray(prev?.activityLogs) ? prev.activityLogs.length : 0
            const newActCount = Array.isArray(matched.activityLogs) ? matched.activityLogs.length : 0
            const curPhase = Number(prev?.currentPhase || prev?.current_phase || 1)
            const newPhase = Number(matched.currentPhase || matched.current_phase || (matched.status === 'building' ? 2 : matched.status === 'launched' ? 3 : ((matched.gateDecisions?.length || 0) > 0 ? 2 : 1)))
            const curVisitors = Number(prev?.visitors || 0)
            const newVisitors = Number(matched.visitors || 0)
            const curFilesCount = Array.isArray(prev?.projectFiles) ? prev.projectFiles.length : 0
            const newFilesCount = Array.isArray(matched.projectFiles) ? matched.projectFiles.length : 0

            if (curRev !== newRev || curVisitors !== newVisitors || curResCount !== newResCount || curActCount !== newActCount || curPhase !== newPhase || newFilesCount > curFilesCount) {
              return {
                ...prev,
                ...matched,
                visitors: matched.visitors,
                conversionRate: matched.conversionRate,
                projectFiles: (matched.projectFiles && matched.projectFiles.length > 0) ? matched.projectFiles : (prev?.projectFiles || []),
                messages: (matched.messages && matched.messages.length > 0) ? matched.messages : (prev?.messages || []),
                currentPhase: newPhase,
                current_phase: newPhase
              }
            }
            return prev
          })
        }
      } catch (err) {} finally {
        if (!isCancelled) setIsLoadingProject(false)
      }
    }

    pollDb()
    const timer = setInterval(pollDb, 30000)
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) pollDb()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      isCancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [project?.id])

  if (isLoadingProject && !project) {
    return <ProjectOSSkeleton />
  }

  if (!project) {
    return (
      <div
        className="p-12 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm"
        style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.text }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}
        >
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold" style={{ ...HEADING_FONT, color: C.text }}>No active Co-Launch project loaded</h2>
        <p className="text-xs" style={{ color: C.muted }}>
          Acquire a creator and accept a partnership deal in Section 1 to initialize your Co-Launch Project OS.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToAcquisition}
            className="px-4 py-2 rounded-xl text-white font-bold text-xs transition-colors cursor-pointer shadow-xs hover:opacity-90"
            style={{ background: C.crimson }}
          >
            Go to Section 1: Acquire Creator
          </button>
        </div>
      </div>
    )
  }

  const projectCurrentPhase = Number(
    project.currentPhase ||
    project.current_phase ||
    (project.status === 'launched' || project.phase2Passed || project.p2Complete
      ? 3
      : project.status === 'building' || project.phase1Passed || project.p1Complete
      ? 2
      : project.gateDecisions?.some(d => d.decision === 'pass_to_phase3' || d.decision === 'launch_product')
      ? 3
      : project.gateDecisions?.some(d => d.decision === 'pass_to_phase2')
      ? 2
      : 1)
  )
  const [selectedPhaseTab, setSelectedPhaseTab] = useState(projectCurrentPhase)

  useEffect(() => {
    setSelectedPhaseTab(projectCurrentPhase)
  }, [project?.id, projectCurrentPhase])

  const currentPhase = selectedPhaseTab
  const presalesRevenue = Number(project.currentPresales || 0)

  // Dynamic presale target derived from validation plan threshold or project
  const parseThresholdAmount = (str) => {
    if (!str) return 0
    const match = String(str).replace(/,/g, '').match(/\$(\d+)/)
    return match ? Number(match[1]) : 0
  }
  const derivedPlanTarget = parseThresholdAmount(project.validationPlan?.threshold)
  // Older projects saved a hard-coded $12,500 for everyone. Recompute a per-creator goal from
  // the creator's audience and the approved concept's founding price unless the plan sets one.
  const storedTarget = Number(project.presaleTarget || project.targetRevenue || 0)
  const computedTarget = (() => {
    const prof = project.creatorProfile || project.metadataInfo?.creator_profile || {}
    const followers =
      parseFollowerCount(prof.followers) ?? parseFollowerCount(prof.followersLabel) ??
      parseFollowerCount(project.followers) ?? parseFollowerCount(project.follower_count)
    const price = derivePresalePrice((project.selectedConcept || {}).pricing || project.pricing)
    return suggestThreshold({ followers, price })?.target || 0
  })()
  const presaleTarget = derivedPlanTarget > 0
    ? derivedPlanTarget
    : (storedTarget > 0 ? storedTarget : computedTarget)
  const visitorsCount = Number(project.visitors || 0)
  const daysLeft = project.daysLeft || project.validationPlan?.period || '18 days'
  const magicPortalUrl = portalUrl

  const kickoffMessage = `Hey ${project.creatorName || 'there'}!\n\nYour private Co-Founder Portal for ${project.productName || 'our product'} is live.\n\nYou can track our $${presaleTarget.toLocaleString()} validation milestone, review your revenue share, and check off your daily launch tasks here:\n${magicPortalUrl}\n\nLet's build something massive!`

  const handleCopy = (text, key) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    setShareNotice('Copied to clipboard!')
    setTimeout(() => {
      setCopiedKey(null)
      setShareNotice('')
    }, 2500)
  }

  const handleAdvancePhase = (nextPhase) => {
    const updatedStatus = nextPhase === 2 ? 'building' : nextPhase === 3 ? 'launched' : 'validating'
    const initialStep = nextPhase === 2 ? 'plan' : nextPhase === 3 ? 'prep' : 'plan'
    const decisionItem = nextPhase === 2 ? {
      id: `gate_p1_${Date.now()}`,
      decision: 'pass_to_phase2',
      gateStatus: 'passed',
      targetRevenue: presaleTarget,
      achievedRevenue: presalesRevenue,
      backersCount: Array.isArray(project.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : Number(project.telemetry?.presalesCount || 0),
      conversionRate: Number(project.conversionRate || 0),
      notes: 'Phase 1 completed. Advanced to Phase 2: Build MVP.',
      decidedAt: new Date().toLocaleString()
    } : nextPhase === 3 ? {
      id: `gate_p2_${Date.now()}`,
      decision: 'pass_to_phase3',
      gateStatus: 'passed',
      targetRevenue: presaleTarget,
      achievedRevenue: presalesRevenue,
      backersCount: Array.isArray(project.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : Number(project.telemetry?.presalesCount || 0),
      conversionRate: Number(project.conversionRate || 0),
      notes: 'Phase 2 completed. Advanced to Phase 3: Launch Commercial Operations.',
      decidedAt: new Date().toLocaleString()
    } : null

    const updated = {
      ...(project || {}),
      currentPhase: nextPhase,
      current_phase: nextPhase,
      p1Complete: true,
      phase1Passed: true,
      step4Done: true,
      step5Done: true,
      ...(nextPhase === 3 ? {
        p2Complete: true,
        phase2Passed: true,
        buildCompleted: true,
        mvpBuildDone: true,
        betaTestingCompleted: true,
        betaApproved: true,
        phase2BetaDone: true
      } : {}),
      currentStep: initialStep,
      current_step: initialStep,
      status: updatedStatus,
      ...(decisionItem ? {
        gateDecisions: [decisionItem, ...(project?.gateDecisions || [])],
        decisions: [decisionItem, ...(project?.decisions || [])]
      } : {})
    }
    setSelectedPhaseTab(nextPhase)
    setSelectedPhaseStep(initialStep)
    if (project?.id) {
      try {
        localStorage.setItem(`forge_p${nextPhase}_step_${project.id}`, initialStep)
        localStorage.removeItem(`forge_p2_step_${project.id}`)
        const url = new URL(window.location.href)
        url.searchParams.set('step', initialStep)
        url.searchParams.set('modal', 'phase')
        window.history.replaceState({}, '', url.toString())
      } catch (e) {}
    }
    onUpdateProject?.(prev => ({
      ...(prev || {}),
      ...updated
    }))
    if (project?.id) {
      import('../../services/opsApi').then(({ updateCoLaunchProject, recordGateDecision }) => {
        if (recordGateDecision) {
          recordGateDecision(project.id, {
            decision: nextPhase === 2 ? 'pass_to_phase2' : 'pass_to_phase3',
            notes: nextPhase === 2 ? 'Phase 1 completed. Advanced to Phase 2: Build MVP.' : 'Phase 2 completed. Advanced to Phase 3: Launch.'
          }).catch(e => console.warn(e))
        }
        updateCoLaunchProject(project.id, {
          currentPhase: nextPhase,
          current_phase: nextPhase,
          currentStep: initialStep,
          current_step: initialStep,
          status: updatedStatus,
          p1Complete: true,
          phase1Passed: true,
          step4Done: true,
          step5Done: true,
          ...(nextPhase === 3 ? {
            p2Complete: true,
            phase2Passed: true,
            buildCompleted: true,
            mvpBuildDone: true,
            betaTestingCompleted: true,
            betaApproved: true,
            phase2BetaDone: true
          } : {})
        }).catch(e => console.warn(e))
      })
    }
  }

  const formatDecisionTitle = (dec) => {
    if (!dec) return 'Validation Gate Review'
    const decisionKey = typeof dec === 'string' ? dec : dec.decision
    if (decisionKey === 'pass_to_phase2') return 'Phase 1 Gate: Build MVP (Approved)'
    if (decisionKey === 'iterate_validation') return 'Phase 1 Gate: Iterate & Re-Test Sprint'
    if (decisionKey === 'kill_project') return 'Phase 1 Gate: Venture Archived & Refunded'
    if (decisionKey === 'phase3_scale' || decisionKey === 'scale') return 'Phase 3 Launch: Scale Commercial Growth (Active)'
    if (decisionKey === 'phase3_iterate' || decisionKey === 'iterate') return 'Phase 3 Launch: Iterate & CRO Sprint'
    if (decisionKey === 'phase3_maintain' || decisionKey === 'maintain') return 'Phase 3 Launch: Maintain Steady-State Ops'
    if (decisionKey === 'phase3_kill' || decisionKey === 'kill') return 'Phase 3 Launch: Sunset & Archive Venture'
    if (dec.title) return dec.title
    return String(decisionKey || 'Decision').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const handleRecordPhase3Decision = async (decisionType, label, notes) => {
    const noticeText = `${label}: ${notes}`
    const newDecision = {
      id: `gate_p3_${Date.now()}`,
      decision: `phase3_${decisionType}`,
      phase: 3,
      title: `Phase 3 Launch: ${label}`,
      targetRevenue: presaleTarget,
      achievedRevenue: presalesRevenue,
      backersCount: backersCount,
      conversionRate: conversionRate,
      gateStatus: decisionType === 'scale' ? 'passed' : decisionType === 'iterate' ? 'iterating' : decisionType === 'maintain' ? 'maintaining' : 'killed',
      notes: noticeText,
      decidedAt: new Date().toISOString()
    }
    const updatedDecisions = [newDecision, ...(project?.gateDecisions || [])]
    const updatedProject = {
      ...(project || {}),
      decisionNotice: noticeText,
      gateDecisions: updatedDecisions,
      status: decisionType === 'kill' ? 'archived' : 'launched'
    }
    onUpdateProject?.(prev => ({ ...(prev || {}), ...updatedProject }))

    if (project?.id) {
      try {
        const { updateCoLaunchProject, recordGateDecision } = await import('../../services/opsApi')
        await recordGateDecision(project.id, {
          decision: `phase3_${decisionType}`,
          notes: noticeText
        }).catch(() => {})
        await updateCoLaunchProject(project.id, {
          decisionNotice: noticeText,
          status: decisionType === 'kill' ? 'archived' : 'launched'
        }).catch(() => {})
      } catch (e) {}
    }
    setShareNotice(`Recorded Phase 3 Decision: ${label}`)
    setTimeout(() => setShareNotice(''), 3500)
  }

  // Handle full reset of all project phases back to Phase 1: Audience Validation
  const handleResetPhasesToStart = async () => {
    const ok = window.confirm(
      'Are you sure you want to reset all phases back to the start (Phase 1: Audience Validation)? This will reset phase progression, clear gate approvals, and return the workspace back to Phase 1.'
    )
    if (!ok) return

    try {
      if (project?.id) {
        try {
          localStorage.removeItem(`forge_p1_step_${project.id}`)
          localStorage.removeItem(`forge_p2_step_${project.id}`)
          localStorage.removeItem(`forge_p3_step_${project.id}`)
          localStorage.removeItem(`forge_p1_progress_${project.id}`)
          localStorage.removeItem(`forge_p2_progress_${project.id}`)
          localStorage.removeItem(`forge_p3_progress_${project.id}`)
        } catch (e) { }
      }

      const resetPayload = {
        ...project,
        currentPhase: 1,
        current_phase: 1,
        currentStep: 'plan',
        current_step: 'plan',
        status: 'validating',
        phase1Passed: false,
        phase2Passed: false,
        p1Complete: false,
        p2Complete: false,
        buildPlanApproved: false,
        buildCompleted: false,
        mvpBuildDone: false,
        betaTestingCompleted: false,
        betaApproved: false,
        step2Done: false,
        step3Done: false,
        gateDecisions: [],
        decisionTelemetry: null,
        metadataInfo: {
          ...(project?.metadataInfo || project?.metadata_info || {}),
          p1Complete: false,
          p2Complete: false,
          phase1Passed: false,
          phase2Passed: false,
          buildPlanApproved: false,
          buildCompleted: false,
          mvpBuildDone: false,
          betaTestingCompleted: false,
          betaApproved: false,
          step2Done: false,
          step3Done: false,
        }
      }

      setSelectedPhaseTab(1)
      setDecisionViewPhase(1)

      if (onUpdateProject) {
        await onUpdateProject(resetPayload)
      } else if (project?.id) {
        const { updateCoLaunchProject } = await import('../../services/opsApi')
        await updateCoLaunchProject(project.id, resetPayload)
      }

      showToast('All phases reset back to Phase 1: Validate')
    } catch (err) {
      console.warn('Failed to reset phases:', err)
      showToast('Phase reset failed')
    }
  }

  const formatDecisionDate = (isoStr) => {
    if (!isoStr) return 'Recent checkpoint'
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return String(isoStr)
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return String(isoStr)
    }
  }

  const [toastNotice, setToastNotice] = useState('')
  const showToast = (msg) => {
    setToastNotice(msg)
    setTimeout(() => setToastNotice(''), 3500)
  }

  const openPhaseStep = (stepId) => {
    let sId = stepId || (currentPhase === 3 ? 'prep' : 'plan')

    // Check phase step guards before opening modal and fallback gracefully so the modal ALWAYS opens
    if (currentPhase === 1) {
      if (sId === 'gate' && !p1Guards.canAccessStep5) {
        showToast('Validation Gate is locked: Complete Steps 1–4 first.')
        sId = p1Guards.canAccessStep4 ? 'optimize' : p1Guards.canAccessStep3 ? 'campaign' : p1Guards.canAccessStep2 ? 'assets' : 'plan'
      } else if (sId === 'optimize' && !p1Guards.canAccessStep4) {
        showToast('Step 3 (Creator Campaign) must be completed before accessing Optimization.')
        sId = p1Guards.canAccessStep3 ? 'campaign' : p1Guards.canAccessStep2 ? 'assets' : 'plan'
      } else if (sId === 'campaign' && !p1Guards.canAccessStep3) {
        showToast('Step 2 (Validation Assets) must be completed before accessing Campaign.')
        sId = p1Guards.canAccessStep2 ? 'assets' : 'plan'
      } else if (sId === 'assets' && !p1Guards.canAccessStep2) {
        showToast('Step 1 (Validation Plan) must be completed before accessing Assets.')
        sId = 'plan'
      }
    } else if (currentPhase === 2) {
      if (sId === 'gate' && !p2Guards.canAccessStep4) {
        showToast('Launch Gate is locked: Complete Steps 1–3 first.')
        sId = p2Guards.canAccessStep3 ? 'beta' : p2Guards.canAccessStep2 ? 'build' : 'plan'
      } else if (sId === 'beta' && !p2Guards.canAccessStep3) {
        showToast('Step 2 (Build MVP) must be completed before accessing Beta Testing. Opening Build step.')
        sId = p2Guards.canAccessStep2 ? 'build' : 'plan'
      } else if (sId === 'build' && !p2Guards.canAccessStep2) {
        showToast('Step 1 (Product + Build Plan) must be completed before accessing Build. Opening Plan.')
        sId = 'plan'
      }
    } else if (currentPhase === 3) {
      if (sId === 'report' && !p3Guards.canAccessStep4) {
        showToast('Launch Decision Gate is locked: Complete Steps 1–3 first.')
        sId = p3Guards.canAccessStep3 ? 'manager' : p3Guards.canAccessStep2 ? 'monitor' : 'prep'
      } else if (sId === 'manager' && !p3Guards.canAccessStep3) {
        showToast('Step 2 (Launch + Monitor) must be completed before accessing AI Launch Manager.')
        sId = p3Guards.canAccessStep2 ? 'monitor' : 'prep'
      } else if (sId === 'monitor' && !p3Guards.canAccessStep2) {
        showToast('Step 1 (Prepare Launch) must be completed before accessing Monitor.')
        sId = 'prep'
      }
    }

    setSelectedPhaseStep(sId)
    setShowPhaseExecutionModal(true)
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('step', sId)
        url.searchParams.set('modal', 'phase')
        window.history.replaceState({}, '', url.toString())
        if (project?.id) {
          localStorage.setItem(`forge_p${currentPhase}_step_${project.id}`, sId)
        }
      }
    } catch (e) {}
  }

  const closePhaseModal = () => {
    setShowPhaseExecutionModal(false)
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('step')
        url.searchParams.delete('modal')
        window.history.replaceState({}, '', url.toString())
      }
    } catch (e) {}
  }

  const [previewingFile, setPreviewingFile] = useState(null)
  const [showAudienceIntelModal, setShowAudienceIntelModal] = useState(false)
  const [audienceIntelModalTab, setAudienceIntelModalTab] = useState('transcripts')
  const [showWiringTutorial, setShowWiringTutorial] = useState(false)
  const [expandedTaskGroundingId, setExpandedTaskGroundingId] = useState(null)



  const audienceGroundingData = getProjectAudienceGrounding(project)

  const defaultScheduleTasks = [
    { id: 'milestone-1', day: 1, milestoneNumber: 1, title: 'Problem Teaser & Community Discovery Poll', channel: 'X / Community / Stories', done: true, role: 'Creator Task', effort: '~10 mins' },
    { id: 'milestone-2', day: 4, milestoneNumber: 2, title: 'Native 60s Video Integration / Demo', channel: 'YouTube / Video', isToday: true, done: false, role: 'Creator Task', effort: '~15 mins' },
    { id: 'milestone-3', day: 8, milestoneNumber: 3, title: '1:1 Plain-Text VIP Letter to Core Supporters', channel: 'Email Newsletter', done: false, role: 'Creator Task', effort: '~10 mins' },
    { id: 'milestone-4', day: 12, milestoneNumber: 4, title: 'Founding Cohort Cap Lock & Final Wrap-Up', channel: 'All Channels', done: false, role: 'Creator Task', effort: '~5 mins' }
  ]

  const rawTasks = (project.campaignKit?.postingSchedule?.length > 0
    ? project.campaignKit.postingSchedule
    : (project.creatorTasks?.length > 0
      ? project.creatorTasks
      : (project.checklist?.length > 0 ? project.checklist : defaultScheduleTasks)))

  const checklistTasks = enrichTasksWithGrounding(rawTasks, project)

  const rawActivity = project.activityLogs || project.adminActivity || project.aiActivity || []
  const aiActivityList = Array.isArray(rawActivity) ? rawActivity : []
  const messagesList = project.messages || []
  const rawDecisions = project.decisions || project.gateDecisions || []
  const baseDecisionsList = Array.isArray(rawDecisions) ? [...rawDecisions] : []
  const decisionsList = (() => {
    const list = [...baseDecisionsList]
    if (project.decisionNotice && !list.some(d => d.decision?.includes('phase3') || d.decision?.includes('scale') || d.notes === project.decisionNotice)) {
      list.unshift({
        id: 'active_phase3_decision',
        decision: project.decisionNotice.toLowerCase().includes('scale') ? 'phase3_scale' : project.decisionNotice.toLowerCase().includes('iterate') ? 'phase3_iterate' : project.decisionNotice.toLowerCase().includes('maintain') ? 'phase3_maintain' : 'phase3_decision',
        phase: 3,
        title: project.decisionNotice.toLowerCase().includes('scale') ? 'Phase 3 Launch: Scale Commercial Growth (Active)' : project.decisionNotice.toLowerCase().includes('iterate') ? 'Phase 3 Launch: Iterate Funnel & CRO (Active)' : project.decisionNotice.toLowerCase().includes('maintain') ? 'Phase 3 Launch: Maintain Steady-State Ops (Active)' : 'Phase 3 Launch: Commercial Decision (Active)',
        gateStatus: project.decisionNotice.toLowerCase().includes('scale') ? 'passed' : project.decisionNotice.toLowerCase().includes('iterate') ? 'iterating' : 'maintaining',
        notes: project.decisionNotice,
        decidedAt: new Date().toISOString()
      })
    }
    return list
  })()

  // Phase 1, Phase 2, and Phase 3 Database-Driven Step Guards
  const p1Guards = getPhase1StepGuards(project)
  const p2Guards = getPhase2StepGuards(project)
  const p3Guards = getPhase3StepGuards(project)

  const presaleGoal = p1Guards.presaleGoal
  const backersCount = Array.isArray(project.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : Number(project.telemetry?.presalesCount || 0)
  const currentPresales = p1Guards.currentPresales
  const conversionRate = Number(project.conversionRate || (Number(project.visitors || 0) > 0 ? (backersCount / Number(project.visitors)) * 100 : 0))
  const isGatePassed = p1Guards.isGatePassed

  // Step Completion Guards
  const isStep1Done = p1Guards.isStep1Done
  const isStep2Done = p1Guards.isStep2Done
  const isStep3Done = p1Guards.isStep3Done
  const isStep4Done = p1Guards.isStep4Done
  const isStep5Done = p1Guards.isStep5Done

  const isLiveLaunch = Boolean(
    project.launchStatus === 'LIVE' ||
    project.isLive === true ||
    project.status === 'LIVE' ||
    Boolean(project.phase3Strategy?.productionLive === true)
  )

  const isP1Done = Boolean(
    isGatePassed ||
    isStep5Done ||
    project.p1Complete === true ||
    project.phase1Passed === true ||
    Number(project.currentPhase || project.current_phase || 1) >= 2 ||
    project.status === 'building' ||
    project.status === 'launched' ||
    project.status === 'LIVE' ||
    (Array.isArray(project.gateDecisions) && project.gateDecisions.some(d => (d.decision === 'pass_to_phase2' || d.gateStatus === 'passed' || d.decision === 'pass') && d.phase !== 3)) ||
    (isStep1Done && isStep2Done && isStep3Done && isStep4Done)
  )

  const isP2Done = Boolean(
    project.p2Complete === true ||
    project.readinessReport?.greenlight === true ||
    project.gateDecisions?.some(d => d.decision === 'greenlight_launch' || d.decision === 'pass_to_phase3' || (d.phase === 2 && d.gateStatus === 'passed')) ||
    (Array.isArray(project.engineeringTasks) && project.engineeringTasks.length > 0 && project.engineeringTasks.every(t => t.status === 'Completed' || t.status === 'done'))
  )

  const isP3Done = Boolean(
    project.p3Complete === true ||
    project.gateDecisions?.some(d => String(d.decision).startsWith('phase3_')) ||
    Boolean(project.launchReport?.score && project.decisionNotice)
  )

  const activePhaseTasks = currentPhase === 3
    ? ((project.phase3Strategy?.opsChecklist || []).concat(project.phase3Strategy?.creatorChecklist || []).length > 0
        ? (project.phase3Strategy?.opsChecklist || []).concat(project.phase3Strategy?.creatorChecklist || [])
        : checklistTasks)
    : currentPhase === 2
    ? (Array.isArray(project.engineeringTasks) && project.engineeringTasks.length > 0 ? project.engineeringTasks : checklistTasks)
    : checklistTasks

  return (
    <div className="s2 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden" style={{ color: C.text }}>
      <style>{`
        .s2 .s2-nav-btn:hover { background: ${C.raised}; color: ${C.text}; }
        .s2 .s2-btn-quiet:hover { border-color: ${C.lineStrong} !important; color: ${C.text} !important; }
        .s2 .s2-btn-crimson:hover { background: ${C.crimsonHover} !important; }
      `}</style>
      {/* SECTION 2 HEADER (DARK SLATE & CRIMSON BASE + SEMANTIC ACCENTS) */}
      {userRole !== 'creator' && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                style={PILL_TONES.crimson}
              >
                SECTION 2 • PROJECT OS
              </span>
              <span style={{ color: C.faint }}>•</span>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full border truncate max-w-full"
                style={PILL_TONES.raised}
              >
                {cleanProductName}
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mt-1"
              style={{ ...HEADING_FONT, color: C.text }}
            >
              CO-LAUNCH PROJECT OS
            </h1>
            <p className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: C.muted }}>
              <span>Co-Founding Partner:</span>
              <strong className="font-bold" style={{ color: C.crimsonText }}>{cleanCreatorName}</strong>
              <span className="font-mono text-[11px]" style={{ color: C.faint }}>({cleanCreatorHandle})</span>
              <span className="hidden xs:inline" style={{ color: C.faint }}>•</span>
              <span className="italic line-clamp-1 xs:line-clamp-none" style={{ color: C.body }}>"{cleanTagline}"</span>
            </p>
          </div>

          {/* Right CTA / Portal Quick Button (Color Studio removed; uses CoLaunch base Crimson + accents) */}
          <div id="tour-s2-theme-picker" className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap hover:opacity-90 active:scale-95"
              style={{ background: C.skySoft, borderColor: C.skyLine, color: C.skyText }}
            >
              <Rocket className="w-3.5 h-3.5" style={{ color: C.sky }} />
              <span>Co-Founder Portal</span>
              <ExternalLink className="w-3 h-3" style={{ color: C.skyText }} />
            </a>

            <button
              onClick={() => setShowShareModal(true)}
              className="s2-btn-quiet px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 cursor-pointer"
              style={{ background: C.raised, borderColor: C.line, color: C.body }}
            >
              <Share2 className="w-3.5 h-3.5" style={{ color: C.violetText }} />
              <span>Share Portal</span>
            </button>

            <button
              onClick={handleResetPhasesToStart}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 hover:opacity-90"
              style={{ background: C.warnSoft, borderColor: C.warnLine, color: C.warn }}
              title="Reset all project phases back to Phase 1 (Audience Validation)"
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: C.warn }} />
              <span>Reset Phases to Start</span>
            </button>

            {onResetProject && (
              <button
                onClick={() => {
                  if (window.confirm('Reset this co-launch project and return to Section 1?')) {
                    onResetProject(project?.id)
                  }
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 hover:opacity-90"
                style={{ background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText }}
                title="Reset project and return to Section 1"
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: C.crimsonText }} />
                <span>Reset Project</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* EXPANDED FULL-WIDTH COMMAND CENTER */}
      <div className="w-full space-y-4">
        <div
          className="rounded-2xl flex flex-col md:flex-row items-stretch w-full relative overflow-hidden"
          style={{ background: C.sheet, border: `1px solid ${C.line}` }}
        >
          {/* Left Mini Sidebar (FIXED/STICKY DARK SURFACE) */}
          <div
            className="w-full md:w-56 lg:w-60 p-3 sm:p-3.5 flex flex-col justify-between items-stretch gap-2.5 shrink-0 md:sticky md:top-14 md:self-start md:h-[calc(100vh-4.5rem)] md:max-h-[calc(100vh-4.5rem)] md:overflow-y-auto md:overflow-x-hidden scrollbar-thin z-20"
            style={{ background: C.row, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}
          >
            <div className="w-full overflow-x-auto no-scrollbar scroll-smooth pt-0.5">
              <div className="flex md:flex-col items-center md:items-stretch gap-1 min-w-max md:min-w-0">
                <div className="hidden md:block px-2 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: C.faint }}>
                  Command Center
                </div>

                {[
                  { id: 'overview', label: 'Overview', icon: Layers, accent: C.crimsonText },
                  { id: 'tasks', label: 'Tasks', icon: CheckSquare, accent: C.ok },
                  { id: 'metrics', label: 'Metrics', icon: BarChart2, accent: C.skyText },
                  { id: 'files', label: 'Files', icon: Folder, accent: C.violetText },
                  { id: 'messages', label: 'Messages', icon: MessageSquare, accent: C.warn },
                  { id: 'decisions', label: 'Decisions', icon: ShieldCheck, accent: C.crimsonText },
                ].map(tab => {
                  const Icon = tab.icon
                  const isActive = sidebarTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSidebarTab(tab.id)}
                      className="s2-nav-btn flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 w-auto md:w-full"
                      style={
                        isActive
                          ? {
                              background: C.raised,
                              color: C.text,
                              border: `1px solid ${C.lineStrong}`,
                              borderLeftWidth: 3,
                              borderLeftColor: C.crimson,
                              fontWeight: 700,
                            }
                          : {
                              background: 'transparent',
                              color: C.muted,
                              border: '1px solid transparent',
                              fontWeight: 600,
                            }
                      }
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? tab.accent : C.faint }} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ACTIVE PHASE PINNED TO BOTTOM ON DESKTOP, INLINE ON MOBILE */}
            <div className="md:mt-auto md:pt-4 shrink-0 w-full">
              <div
                className="p-2.5 sm:p-3 rounded-2xl text-center flex items-center justify-between md:flex-col gap-2.5"
                style={{ background: C.sheet, border: `1px solid ${C.line}` }}
              >
                <div className="hidden md:flex items-center justify-between w-full px-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: isLiveLaunch ? C.ok : C.muted }}>
                    {isLiveLaunch ? (
                      <>
                        <Rocket className="w-3 h-3" style={{ color: C.ok }} />
                        <span>Live Launch</span>
                      </>
                    ) : (
                      'Active Phase'
                    )}
                  </span>
                  {isP1Done && (
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                      style={PILL_TONES.ok}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      P1 Done
                    </span>
                  )}
                </div>
                <div id="tour-s2-phase-tabs" className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3].map(p => {
                    const isDone = p === 1 ? isP1Done : p === 2 ? isP2Done : isP3Done
                    const isActive = currentPhase === p
                    const activeStyle =
                      p === 2
                        ? { background: '#0284c7', color: '#ffffff', border: '1px solid #d4d4d8' }
                        : p === 3
                        ? isLiveLaunch
                          ? { background: '#059669', color: '#ffffff', border: '1px solid #34d399' }
                          : { background: '#d97706', color: '#ffffff', border: '1px solid #f59e0b' }
                        : { background: C.crimson, color: '#ffffff', border: `1px solid ${C.crimsonLine}` }
                    const idleStyle = isDone
                      ? { background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }
                      : { background: C.raised, color: C.muted, border: `1px solid ${C.line}` }
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setSelectedPhaseTab(p)
                          if (p === 2 && projectCurrentPhase < 2) {
                            handleAdvancePhase(2)
                          } else if (p === 3 && projectCurrentPhase < 3) {
                            handleAdvancePhase(3)
                          }
                        }}
                        className="relative w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center hover:opacity-90"
                        style={isActive ? activeStyle : idleStyle}
                        title={`Switch to Phase ${p}${isDone ? ' (Completed)' : ''}`}
                      >
                        <span>P{p}</span>
                        {isDone && (
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[8px] font-black"
                            style={{ background: '#10b981', border: `2px solid ${C.sheet}` }}
                          >
                            <Check className="w-2 h-2 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="hidden md:flex flex-col items-center justify-center gap-1.5 pt-0.5 w-full">
                  <span className="text-[11px] font-bold flex items-center justify-center gap-1.5" style={{ color: C.text }}>
                    {isLiveLaunch ? (
                      <>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: C.ok }} />
                        <span style={{ color: C.ok }}>Live Launch Verified</span>
                      </>
                    ) : currentPhase === 1 ? (
                      isP1Done ? 'Phase 1: Validated (Done)' : 'Phase 1: Validate'
                    ) : currentPhase === 2 ? (
                      'Phase 2: Build MVP'
                    ) : (
                      'Phase 3: Launch'
                    )}
                  </span>

                  {/* Direct button to mark Phase 1 done and advance to Phase 2 (operator only) */}
                  {userRole !== 'creator' && (
                    currentPhase === 1 ? (
                      <button
                        type="button"
                        onClick={() => handleAdvancePhase(2)}
                        className="s2-btn-crimson mt-1 w-full py-1.5 px-2 rounded-lg text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                        style={{ backgroundColor: C.crimson }}
                        title="Mark Phase 1 as Done and Advance to Phase 2: Build MVP"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                        <span>Mark P1 Done → P2</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResetPhasesToStart}
                        className="mt-1 w-full py-1 px-2 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer hover:opacity-90"
                        style={{ background: C.warnSoft, borderColor: C.warnLine, color: C.warn }}
                        title="Reset all phases back to Phase 1: Validate"
                      >
                        <RotateCcw className="w-3 h-3" style={{ color: C.warn }} />
                        <span>Reset to Phase 1</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Command Center Inner Area (DARK SHEET) */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-4 overflow-x-hidden" style={{ background: C.sheet }}>
            {/* Header inside Command Center */}
            <div
              id="tour-s2-header"
              className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pb-3.5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 flex-wrap"
                    style={{ ...HEADING_FONT, color: C.text }}
                  >
                    <span>{cleanProductName}</span>
                    <span className="font-normal" style={{ color: C.faint }}>×</span>
                    <span style={{ color: C.body }}>{cleanCreatorName}</span>
                  </h2>
                </div>

              </div>

              {/* Action buttons on right of Command Center Header */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:pt-0.5 flex-wrap">
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border flex items-center gap-1.5"
                  style={
                    isLiveLaunch || isP1Done
                      ? PILL_TONES.ok
                      : currentPhase === 2
                      ? PILL_TONES.sky
                      : currentPhase === 3
                      ? PILL_TONES.violet
                      : PILL_TONES.warn
                  }
                >
                  {isLiveLaunch ? (
                    <>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: C.ok }} />
                      <span>Live Launch</span>
                    </>
                  ) : currentPhase === 1 ? (
                    isP1Done ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.ok }} />
                        <span>Phase 1: Validated (Done)</span>
                      </>
                    ) : (
                      'Phase 1: Validate'
                    )
                  ) : currentPhase === 2 ? (
                    'Phase 2: Build MVP'
                  ) : (
                    'Phase 3: Launch'
                  )}
                </span>

                {/* Direct quick advance button if currently on Phase 1 (operator only) */}
                {userRole !== 'creator' && currentPhase === 1 && (
                  <button
                    type="button"
                    onClick={() => handleAdvancePhase(2)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap hover:opacity-90"
                    style={{ background: C.okSoft, borderColor: C.okLine, color: C.ok }}
                    title="Mark Phase 1 Done & Advance to Phase 2: Build MVP"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.ok }} />
                    <span>Advance to Phase 2</span>
                  </button>
                )}

                {userRole !== 'creator' && (
                  <button
                    type="button"
                    onClick={() => startSection2Tour(true)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap hover:opacity-90"
                    style={{ background: C.raised, borderColor: C.line, color: C.body }}
                    title="Start Interactive Guided Walkthrough (Driver.js)"
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: C.muted }} />
                    <span>Workflow Tour</span>
                  </button>
                )}

                {userRole !== 'creator' && (
                  <button
                    type="button"
                    onClick={() => setShowWiringTutorial(true)}
                    className="s2-btn-quiet px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                    style={{ background: C.raised, borderColor: C.line, color: C.body }}
                    title="Open Text-Based Workflow Wiring Tutorial"
                  >
                    <Workflow className="w-3.5 h-3.5" style={{ color: C.muted }} />
                    <span>Wiring Guide</span>
                  </button>
                )}

                <button
                  id="tour-s2-open-workspace-btn"
                  type="button"
                  onClick={() => openPhaseStep(getProjectActiveStep(project, currentPhase))}
                  className="s2-btn-crimson px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  style={{ background: C.crimson }}
                >
                  <span>Open Phase Workspace</span>
                  <ExternalLink className="w-3 h-3 text-white" />
                </button>
              </div>

              {/* Full-width details row: pricing · chosen concept · archetype, then tagline */}
              <div className="w-full basis-full space-y-2">
                {/* Unified metadata row: Pricing, AI experiment, Chosen Concept & Archetype */}
                <div className="flex items-center gap-2 flex-wrap max-w-full">
                  {(() => {
                    if (!project?.pricing) return null
                    const rawPricing = String(project.pricing).trim()
                    const match = rawPricing.match(/^(.*?)(?:\s*\((?:Pricing adjusted via )?AI Experiment:\s*(.*?)\))?$/i)
                    const corePrice = match && match[1] ? match[1].trim() : rawPricing
                    const expTitle = match && match[2] ? match[2].trim() : null

                    return (
                      <>
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold inline-flex items-center gap-1.5 max-w-full sm:max-w-xl border"
                          style={PILL_TONES.ok}
                          title={rawPricing}
                        >
                          <Tag className="w-3 h-3 shrink-0" style={{ color: C.ok }} />
                          <span className="truncate">{corePrice}</span>
                        </span>
                        {expTitle && (
                          <span
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border inline-flex items-center gap-1.5 shrink-0"
                            style={PILL_TONES.violet}
                            title={`Pricing adjusted via AI Experiment: ${expTitle}`}
                          >
                            <Sparkles className="w-3 h-3 shrink-0" style={{ color: C.violet }} />
                            <span>AI Experiment: {expTitle}</span>
                          </span>
                        )}
                      </>
                    )
                  })()}

                  <span
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 border"
                    style={PILL_TONES.crimson}
                  >
                    <Target className="w-3.5 h-3.5 shrink-0" style={{ color: C.crimsonText }} />
                    <span>Chosen Concept: {chosenConcept?.name || cleanProductName}</span>
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border"
                    style={PILL_TONES.sky}
                  >
                    {archetypeLabel}
                  </span>
                </div>

                <p className="text-xs sm:text-sm max-w-3xl leading-relaxed pt-0.5" style={{ color: C.muted }}>
                  {cleanTagline}
                </p>
              </div>
            </div>

              {/* OVERVIEW TAB CONTENT */}
              {sidebarTab === 'overview' && (
                <div className="space-y-4 animate-fade-in">
                  {/* ── VENTURE FOUNDATION: everything Section 2 builds on (Section 1 creator data × approved concept) ── */}
                  {(() => {
                    const meta = project?.metadataInfo || project?.metadata_info || {}
                    const prof = project?.creatorProfile || meta.creator_profile || {}
                    const intel = project?.audienceIntelligence || meta.audience_intelligence || chosenConcept?.audienceIntelligence || {}
                    const posts = (project?.recentPosts || meta.recent_posts || project?.videos || []).filter(Boolean).slice(0, 3)
                    const comments = (project?.audienceComments || []).slice(0, 2)
                    const landing = resolveProjectLanding(project, chosenConcept)
                    const fmtNum = (n) => {
                      const v = Number(n)
                      if (!v || Number.isNaN(v)) return n || '—'
                      return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : `${v}`
                    }
                    const name = prof.name || project?.creatorName || 'Creator'
                    const handle = (prof.handle || project?.creatorHandle || '').replace(/^@/, '')
                    const avatar = prof.avatarUrl || project?.creatorAvatar
                    const stats = [
                      { label: 'Audience', value: prof.followersLabel || fmtNum(prof.followers || project?.followers) },
                      { label: 'Engagement', value: prof.engagementRate || '—' },
                      { label: 'Creator score', value: prof.creatorScore || project?.creatorScore || '—' },
                      { label: 'Platform', value: (prof.platform || 'YouTube').replace(/^./, (c) => c.toUpperCase()) },
                    ]
                    const niche = (Array.isArray(prof.niche) && prof.niche.length ? prof.niche : [project?.niche].flat()).filter(Boolean).slice(0, 3)
                    // AI fields can be strings, objects ({ text | quote | question | description }) or arrays.
                    const asText = (v) => {
                      if (v == null) return ''
                      if (typeof v === 'string' || typeof v === 'number') return String(v).trim()
                      if (Array.isArray(v)) return v.map(asText).filter(Boolean).slice(0, 2).join(' · ')
                      if (typeof v === 'object') return asText(v.text || v.quote || v.question || v.description || v.headline || v.title || v.value || '')
                      return ''
                    }
                    const insights = [
                      { label: 'Pain point', text: asText(intel?.painPoints?.description ?? intel?.painPoints) },
                      { label: 'They keep asking', text: asText(intel?.recurringQuestions?.quote ?? intel?.recurringQuestions), quote: true },
                      { label: 'Content that works', text: asText(intel?.topContent?.headline ?? intel?.topContent) },
                      { label: 'Buyers', text: asText(intel?.demographics?.description ?? intel?.demographics) },
                    ]
                      .filter((it) => it.text && it.text !== '[object Object]')
                      .map((it) => (it.quote ? { ...it, text: `“${it.text.replace(/^["“]|["”]$/g, '')}”` } : it))
                      .slice(0, 3)
                    const conceptFacts = [
                      { label: 'Solves', text: chosenConcept?.problem || project?.problem },
                      { label: 'For', text: chosenConcept?.customer || project?.targetAudience },
                      { label: 'Pricing', text: chosenConcept?.pricing || project?.pricing },
                    ].filter((f) => f.text)
                    const features = (chosenConcept?.keyFeatures || project?.keyFeatures || []).slice(0, 4)

                    return (
                      <section
                        id="tour-s2-foundation"
                        aria-label="Venture foundation"
                        className="acq-pop relative overflow-hidden"
                        style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 140px), ${C.row}`, border: `1px solid ${C.lineStrong}` }}
                      >
                        <span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${landing.brandColor}, transparent)` }} aria-hidden="true" />
                        <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                          <div>
                            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#ff4d6d' }}>Venture foundation</p>
                            <h2 className="m-0 mt-0.5 text-base sm:text-lg font-bold tracking-tight" style={{ color: C.text }}>
                              Built from {name}'s audience × {chosenConcept?.name || cleanProductName}
                            </h2>
                          </div>
                          <span className="text-[11px]" style={{ color: C.faint }}>
                            Every phase below uses this data: plan, assets, campaign, build and launch.
                          </span>
                        </div>

                        <div className="grid lg:grid-cols-2">
                          {/* Creator (Section 1 discovery) */}
                          <div className="p-4 sm:p-5 space-y-4" style={{ borderRight: `1px solid ${C.line}` }}>
                            <div className="flex items-center gap-3 min-w-0">
                              {avatar ? (
                                <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: `2px solid ${C.crimsonLine}` }} />
                              ) : (
                                <span className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: C.crimsonSoft, color: C.crimsonText }}>{name.slice(0, 1)}</span>
                              )}
                              <div className="min-w-0">
                                <p className="m-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.faint }}>Creator · from discovery</p>
                                <p className="m-0 text-sm font-bold truncate" style={{ color: C.text }}>{name}</p>
                                <p className="m-0 text-xs truncate" style={{ color: C.muted }}>
                                  {handle ? `@${handle}` : ''}{prof.location ? ` · ${prof.location}` : ''}
                                </p>
                              </div>
                              {prof.profileUrl && (
                                <a href={prof.profileUrl} target="_blank" rel="noreferrer" className="ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1" style={{ color: C.body, border: `1px solid ${C.line}` }}>
                                  Channel <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <dl className="grid grid-cols-4 gap-px m-0" style={{ background: C.line, border: `1px solid ${C.line}` }}>
                              {stats.map((st) => (
                                <div key={st.label} className="px-2 py-2.5 text-center" style={{ background: C.sheet }}>
                                  <dt className="text-[10px] uppercase tracking-wider" style={{ color: C.faint }}>{st.label}</dt>
                                  <dd className="m-0 mt-0.5 text-sm font-bold truncate" style={{ color: C.text }}>{st.value}</dd>
                                </div>
                              ))}
                            </dl>

                            {(prof.bio || niche.length > 0) && (
                              <div className="space-y-2">
                                {niche.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {niche.map((n) => (
                                      <span key={n} className="text-[11px] font-semibold px-2 py-0.5" style={{ background: C.raised, color: C.body, border: `1px solid ${C.line}` }}>{n}</span>
                                    ))}
                                  </div>
                                )}
                                {prof.bio && <p className="m-0 text-xs leading-relaxed line-clamp-3" style={{ color: C.muted }}>{prof.bio}</p>}
                              </div>
                            )}

                            {insights.length > 0 ? (
                              <ul className="list-none m-0 p-0 space-y-2">
                                {insights.map((it) => (
                                  <li key={it.label} className="px-3 py-2 text-xs leading-relaxed" style={{ background: C.sheet, borderLeft: `2px solid ${C.crimson}` }}>
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.crimsonText }}>{it.label}</span>
                                    <span style={{ color: C.body }}>{it.text}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : comments.length > 0 ? (
                              <ul className="list-none m-0 p-0 space-y-2">
                                {comments.map((cm, i) => (
                                  <li key={i} className="px-3 py-2 text-xs italic" style={{ background: C.sheet, borderLeft: `2px solid ${C.crimson}`, color: C.body }}>
                                    “{String(cm?.text || cm?.comment || cm).slice(0, 160)}”
                                  </li>
                                ))}
                              </ul>
                            ) : null}

                            {posts.length > 0 && (
                              <div>
                                <p className="m-0 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.faint }}>Recent content</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {posts.map((pst, i) => {
                                    const thumb = pst.thumbnail || pst.thumbnailUrl || pst.thumbnail_url || pst.image
                                    const title = pst.title || pst.caption || pst.text || 'Post'
                                    const views = pst.views || pst.viewCount || pst.view_count
                                    const url = pst.url || pst.link
                                    const Tag = url ? 'a' : 'div'
                                    return (
                                      <Tag key={i} {...(url ? { href: url, target: '_blank', rel: 'noreferrer' } : {})} className="block min-w-0 group" style={{ color: C.body }}>
                                        <div className="aspect-video overflow-hidden" style={{ background: C.raised, border: `1px solid ${C.line}` }}>
                                          {thumb && <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                                        </div>
                                        <p className="m-0 mt-1 text-[11px] leading-snug line-clamp-2">{title}</p>
                                        {views ? (
                                          <p className="m-0 text-[10px]" style={{ color: C.faint }}>
                                            {/views?$/i.test(String(views).trim()) ? String(views).trim() : `${fmtNum(views)} views`}
                                          </p>
                                        ) : null}
                                      </Tag>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Approved concept (Step 5) */}
                          <div className="p-4 sm:p-5 space-y-4">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0" style={{ background: landing.brandColor, color: getContrastTextColor(landing.brandColor) }}>
                                {landing.conceptIndex + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="m-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.faint }}>Approved concept · Step 5</p>
                                <p className="m-0 text-sm font-bold truncate" style={{ color: C.text }}>{chosenConcept?.name || cleanProductName}</p>
                              </div>
                            </div>
                            {chosenConcept?.tagline && <p className="m-0 text-sm font-medium" style={{ color: C.body }}>{chosenConcept.tagline}</p>}
                            <dl className="m-0 space-y-2">
                              {conceptFacts.map((f) => (
                                <div key={f.label} className="grid grid-cols-[72px_1fr] gap-2 text-xs">
                                  <dt className="font-semibold uppercase tracking-wider text-[10px] pt-0.5" style={{ color: C.faint }}>{f.label}</dt>
                                  <dd className="m-0 leading-relaxed" style={{ color: C.body }}>{f.text}</dd>
                                </div>
                              ))}
                            </dl>
                            {features.length > 0 && (
                              <ul className="list-none m-0 p-0 grid sm:grid-cols-2 gap-1.5">
                                {features.map((ft, i) => {
                                  const title = typeof ft === 'string' ? ft.split(':')[0] : (ft.title || ft.name || 'Feature')
                                  return (
                                    <li key={i} className="flex items-center gap-2 text-xs px-2.5 py-1.5" style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.text }}>
                                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: landing.brandColor }} />
                                      <span className="truncate">{title}</span>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                            {chosenConcept?.audienceEvidence && (
                              <p className="m-0 text-[11px] leading-relaxed" style={{ color: C.muted }}>
                                <span className="font-semibold" style={{ color: C.crimsonText }}>Why this audience: </span>{chosenConcept.audienceEvidence}
                              </p>
                            )}
                          </div>
                        </div>
                      </section>
                    )
                  })()}

                  {/* STEP 5 CHOSEN CONCEPT BLUEPRINT (HERO CARD) */}
                  <div
                    id="tour-s2-blueprint-card"
                    className="relative rounded-2xl p-4 sm:p-5 lg:p-6 space-y-4 overflow-hidden"
                    style={{
                      background: C.row,
                      border: `1px solid ${C.crimsonLine}`,
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, ${C.crimson} 0%, ${C.violet} 50%, ${C.sky} 100%)` }}
                    />

                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3"
                      style={{ borderBottom: `1px solid ${C.line}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                          style={PILL_TONES.crimson}
                        >
                          <Target className="w-5 h-5" style={{ color: C.crimsonText }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                              style={PILL_TONES.crimson}
                            >
                              Step 5 Chosen Concept Blueprint
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                              style={PILL_TONES.sky}
                            >
                              {archetypeLabel}
                            </span>
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1"
                              style={PILL_TONES.ok}
                            >
                              <CheckCircle2 className="w-3 h-3" style={{ color: C.ok }} />
                              <span>Creator Selected & Promoted</span>
                            </span>
                          </div>
                          <h3
                            className="text-xl sm:text-2xl font-bold mt-1"
                            style={{ ...HEADING_FONT, color: C.text }}
                          >
                            {chosenConcept.name || cleanProductName}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => openPhaseStep('plan')}
                          className="s2-btn-crimson px-4 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                          style={{ background: C.crimson }}
                        >
                          <span>Review Phase 1 Spec</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Problem, Audience, and Built-In Features */}
                      <div className="lg:col-span-7 space-y-4 text-xs">
                        <p className="text-sm font-medium leading-relaxed" style={{ color: C.body }}>
                          {chosenConcept.tagline || cleanTagline}
                        </p>

                        {/* Problem & Audience Callouts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div
                            className="p-4 rounded-xl space-y-1.5"
                            style={{ background: C.sheet, border: `1px solid ${C.crimsonLine}` }}
                          >
                            <span className="text-[11px] font-mono uppercase font-bold flex items-center gap-1.5" style={{ color: C.crimsonText }}>
                              <Target className="w-3.5 h-3.5" style={{ color: C.crimsonText }} />
                              <span>Problem Solved</span>
                            </span>
                            <p className="text-xs font-medium leading-relaxed" style={{ color: C.body }}>
                              {chosenConcept.problem || project?.problem || "Manual fragmented workflows solved with unified automation."}
                            </p>
                          </div>
                          <div
                            className="p-4 rounded-xl space-y-1.5"
                            style={{ background: C.sheet, border: `1px solid ${C.skyLine}` }}
                          >
                            <span className="text-[11px] font-mono uppercase font-bold flex items-center gap-1.5" style={{ color: C.skyText }}>
                              <Users className="w-3.5 h-3.5" style={{ color: C.sky }} />
                              <span>Target Audience</span>
                            </span>
                            <p className="text-xs font-medium leading-relaxed" style={{ color: C.body }}>
                              {chosenConcept.customer || chosenConcept.demographicAlignment || project?.targetAudience || `${cleanCreatorName}'s community & active builders`}
                            </p>
                          </div>
                        </div>

                        {/* Key Features List */}
                        {Array.isArray(chosenConcept.keyFeatures || chosenConcept.features) && (chosenConcept.keyFeatures || chosenConcept.features).length > 0 && (
                          <div
                            className="p-4 rounded-xl space-y-2.5"
                            style={{ background: C.sheet, border: `1px solid ${C.violetLine}` }}
                          >
                            <span className="text-[11px] font-mono uppercase font-bold flex items-center gap-1.5" style={{ color: C.violetText }}>
                              <Cpu className="w-3.5 h-3.5" style={{ color: C.violet }} />
                              <span>Core Software Features (Step 5 Customized)</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(chosenConcept.keyFeatures || chosenConcept.features).slice(0, 4).map((feat, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                                  style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.text }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.ok }} />
                                  <span className="truncate">{typeof feat === 'string' ? feat : (feat.title || feat.name || 'Core feature')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Approved landing page — identical to the Step 5 concept the creator approved */}
                      {(() => {
                        const landing = resolveProjectLanding(project, chosenConcept)
                        const landingSlug = (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                        return (
                          <div
                            id="tour-s2-mockup-card"
                            className="s2-landing-card lg:col-span-5 overflow-hidden"
                            style={{ background: C.bg, border: `1px solid ${C.lineStrong}` }}
                          >
                            <div
                              className="px-3.5 py-2.5 flex items-center justify-between gap-2"
                              style={{ background: C.raised, borderBottom: `1px solid ${C.line}` }}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#3f3f46' }} />
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#3f3f46' }} />
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#3f3f46' }} />
                                <span className="text-[10px] font-mono ml-2 truncate" style={{ color: C.muted }}>
                                  /preorder/{landingSlug}
                                </span>
                              </div>
                              <a
                                href={`/preorder/${landingSlug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1"
                                style={{ color: '#fff', background: C.crimson }}
                              >
                                Open live page
                              </a>
                            </div>
                            <div className="relative">
                              <ConceptLandingPage
                                concept={landing.concept}
                                conceptIndex={landing.conceptIndex}
                                creator={landing.creator}
                                brandColor={landing.brandColor}
                                mode="thumb"
                                heroImageUrl={project?.mockupImage || project?.mockup_image || ''}
                              />
                              <span
                                className="absolute bottom-3 left-3 text-[10px] font-semibold px-2 py-1"
                                style={{ background: 'rgba(5,5,6,0.85)', color: C.text, border: `1px solid ${C.line}` }}
                              >
                                Approved in Step 5 · same layout as the live page
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Top 4 KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    {/* 1. Presales / Live Revenue */}
                    <div
                      id="tour-s2-presales-meter"
                      className="p-4 rounded-xl space-y-1.5 transition-all"
                      style={{ background: C.row, border: `1px solid ${C.line}` }}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.ok }}>
                        {currentPhase === 3 ? 'Live Revenue' : 'Presales'}
                      </span>
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-tight" style={{ color: C.text }}>
                        ${presalesRevenue.toLocaleString()}
                      </div>
                      <span className="text-[11px] block" style={{ color: C.muted }}>
                        {currentPhase === 3 ? 'Total processed revenue' : `of $${presaleTarget.toLocaleString()} goal`}
                      </span>
                      <div className="w-full rounded-full h-1.5 overflow-hidden mt-1" style={{ background: C.raised }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: C.crimson,
                            width: `${presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* 2. Unique Visitors */}
                    <div
                      className="p-4 rounded-xl space-y-1.5 transition-all"
                      style={{ background: C.row, border: `1px solid ${C.line}` }}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.skyText }}>Unique Visitors</span>
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-tight" style={{ color: C.text }}>
                        {visitorsCount.toLocaleString()}
                      </div>
                      <span className="text-[11px]" style={{ color: C.muted }}>Tracked unique devices</span>
                    </div>

                    {/* 3. Conversion */}
                    <div
                      className="p-4 rounded-xl space-y-1.5 transition-all"
                      style={{ background: C.row, border: `1px solid ${C.line}` }}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.violetText }}>
                        {currentPhase === 3 ? 'Paid Conversion' : 'Conversion'}
                      </span>
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-tight" style={{ color: C.text }}>
                        {conversionRate.toFixed(1)}%
                      </div>
                      <span className="text-[11px]" style={{ color: C.muted }}>Tracked conversion rate</span>
                    </div>

                    {/* 4. Days Left / Production Status */}
                    <div
                      className="p-4 rounded-xl space-y-1.5 transition-all"
                      style={{ background: C.row, border: `1px solid ${C.line}` }}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: isLiveLaunch ? C.ok : C.warn }}>
                        {isLiveLaunch ? 'Production Status' : 'Days Left'}
                      </span>
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-tight flex items-center gap-1.5" style={{ color: C.text }}>
                        {isLiveLaunch ? (
                          <>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: C.ok }} />
                            <span style={{ color: C.ok }}>Live</span>
                          </>
                        ) : (
                          daysLeft
                        )}
                      </div>
                      <span className="text-[11px]" style={{ color: C.muted }}>
                        {isLiveLaunch ? 'Live funnel' : 'Validation window'}
                      </span>
                    </div>
                  </div>

                  {/* Two Columns: Tasks & AI Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Tasks Card */}
                    <div
                      className="p-5 rounded-xl space-y-3 flex flex-col justify-between transition-all"
                      style={{ background: C.row, border: `1px solid ${C.line}` }}
                    >
                      <div>
                        <div
                          className="flex items-center justify-between pb-2.5 mb-3"
                          style={{ borderBottom: `1px solid ${C.line}` }}
                        >
                          <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: C.text }}>
                            <CheckSquare className="w-4 h-4" style={{ color: C.ok }} />
                            <span>
                              {currentPhase === 3 ? 'Launch & Growth Tasks' : currentPhase === 2 ? 'MVP Engineering Tasks' : 'Validation Sprint Tasks'}
                            </span>
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                            style={PILL_TONES.raised}
                          >
                            {activePhaseTasks.length} total
                          </span>
                        </div>
                        {activePhaseTasks.length === 0 ? (
                          <div className="py-4 text-center text-xs space-y-1">
                            <p className="font-medium" style={{ color: C.body }}>No tasks logged yet</p>
                            <p className="text-[10px]" style={{ color: C.muted }}>Tasks generate automatically during this phase.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activePhaseTasks.slice(0, 3).map((task, idx) => {
                              const done = Boolean(task.done || task.completed || task.status === 'Completed')
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-1.5"
                                  style={idx < 2 ? { borderBottom: `1px solid ${C.line}` } : undefined}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    {done ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.ok }} />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: C.warn }} />
                                    )}
                                    <span
                                      className={`font-medium truncate ${done ? 'line-through' : ''}`}
                                      style={{ color: done ? C.faint : C.text }}
                                    >
                                      {task.title || task.name || task.text}
                                    </span>
                                  </span>
                                  <span className="text-[11px] shrink-0 ml-2" style={{ color: done ? C.ok : C.muted }}>
                                    {task.due || (done ? 'Done' : 'Pending')}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSidebarTab('tasks')}
                        className="text-xs font-bold flex items-center gap-1 mt-2 text-left cursor-pointer transition-opacity hover:opacity-80"
                        style={{ color: C.crimsonText }}
                      >
                        <span>View all tasks</span>
                        <span>→</span>
                      </button>
                    </div>

                    {/* AI Activity Card */}
                    <div
                      className="p-5 rounded-xl space-y-3 flex flex-col justify-between transition-all"
                      style={{ background: C.row, border: `1px solid ${C.line}` }}
                    >
                      <div>
                        <div
                          className="flex items-center justify-between pb-2.5 mb-3"
                          style={{ borderBottom: `1px solid ${C.line}` }}
                        >
                          <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: C.text }}>
                            <Sparkles className="w-4 h-4" style={{ color: C.violet }} />
                            <span>AI Activity Stream</span>
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                            style={PILL_TONES.violet}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: C.violet }} />
                            <span>Autonomous</span>
                          </span>
                        </div>
                        {aiActivityList.length === 0 ? (
                          <div className="py-4 text-center text-xs space-y-1">
                            <p className="font-medium" style={{ color: C.body }}>Autonomous agent standing by</p>
                            <p className="text-[10px]" style={{ color: C.muted }}>Actions log automatically during validation & campaign execution.</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-xs">
                            {aiActivityList.slice(0, 4).map((act, idx) => {
                              const title = typeof act === 'string' ? act : (act.action || act.message || 'System Action')
                              const details = typeof act === 'object' ? (act.details || '') : ''
                              return (
                                <div key={idx} className="flex items-start gap-2 py-0.5">
                                  <span className="font-bold shrink-0" style={{ color: C.sky }}>•</span>
                                  <div className="min-w-0">
                                    <span className="font-medium block truncate" style={{ color: C.text }}>{title}</span>
                                    {details && <span className="text-[10px] block truncate" style={{ color: C.muted }}>{details}</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSidebarTab('decisions')}
                        className="text-xs font-bold flex items-center gap-1 mt-2 text-left cursor-pointer transition-opacity hover:opacity-80"
                        style={{ color: C.skyText }}
                      >
                        <span>View all activity</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {sidebarTab === 'tasks' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div
                    className="flex items-center justify-between pb-3"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <span className="font-bold text-sm" style={{ ...HEADING_FONT, color: C.text }}>
                      Work: AI Tasks, Creator Tasks & Co-Launch Sprint
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('transcripts')
                          setShowAudienceIntelModal(true)
                        }}
                        className="px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border hover:opacity-90"
                        style={PILL_TONES.sky}
                        title="View YouTube transcripts & audience comments"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: C.sky }} />
                        <span>Audience Citations</span>
                      </button>
                      <button
                        onClick={() => openPhaseStep('campaign')}
                        className="font-bold text-xs cursor-pointer transition-opacity hover:opacity-80"
                        style={{ color: C.crimsonText }}
                      >
                        Open Creator Campaign Kit →
                      </button>
                    </div>
                  </div>

                  {/* AUDIENCE INTELLIGENCE & DATA GROUNDING BANNER */}
                  <div
                    className="p-4 rounded-xl border space-y-3"
                    style={{ background: C.row, borderColor: C.skyLine }}
                  >
                    <div className="flex items-center gap-2 pb-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: C.sky }} />
                      <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: C.text }}>
                        <ShieldCheck className="w-4 h-4" style={{ color: C.sky }} />
                        <span>Grounded in Creator Audience Data</span>
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed" style={{ color: C.body }}>
                      All co-launch sprint actions, scripts, and stories are derived directly from <strong style={{ color: C.text }}>{cleanCreatorName}'s verified uploads</strong> — extracted from <strong style={{ color: C.text }}>{audienceGroundingData.stats.transcriptsAnalyzed} channel videos</strong>, channel description, <strong style={{ color: C.text }}>{audienceGroundingData.stats.commentsIngested > 0 ? `${audienceGroundingData.stats.commentsIngested} fan comments` : 'channel discussions'}</strong>, and custom voice guidelines. Authentic creator tone. Outbound emails are 1:1 plain-text to guarantee Primary Inbox delivery (zero spam).
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('transcripts')
                          setShowAudienceIntelModal(true)
                        }}
                        className="p-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer text-left group hover:opacity-90"
                        style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                      >
                        <Youtube className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: C.crimsonText }} />
                        <div className="min-w-0">
                          <span className="font-bold block truncate" style={{ color: C.text }}>Transcripts</span>
                          <span className="font-mono truncate block" style={{ color: C.muted }}>Native Integration</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('comments')
                          setShowAudienceIntelModal(true)
                        }}
                        className="p-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer text-left group hover:opacity-90"
                        style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: C.sky }} />
                        <div className="min-w-0">
                          <span className="font-bold block truncate" style={{ color: C.text }}>
                            {audienceGroundingData.audienceComments?.length > 0
                              ? `${audienceGroundingData.audienceComments.length} Comments`
                              : 'Comments'}
                          </span>
                          <span className="font-mono truncate block" style={{ color: C.muted }}>
                            {audienceGroundingData.audienceComments?.length > 0 ? 'Verified Feedback' : 'Channel Inquiries'}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('transcripts')
                          setShowAudienceIntelModal(true)
                        }}
                        className="p-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer text-left group hover:opacity-90"
                        style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                      >
                        <Shield className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: C.warn }} />
                        <div className="min-w-0">
                          <span className="font-bold block truncate" style={{ color: C.text }}>Anti-Spam Guard</span>
                          <span className="font-mono truncate block" style={{ color: C.muted }}>1:1 Plain-Text</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {checklistTasks.length === 0 ? (
                    <div
                      className="py-8 text-center text-xs border border-dashed rounded-xl"
                      style={{ color: C.muted, borderColor: C.lineStrong, background: C.row }}
                    >
                      No tasks in pipeline. Use Phase 1 validation tools to populate sprint checklist.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {checklistTasks.map((task, idx) => {
                        const isDone = Boolean(task.done || task.completed)
                        const isToday = Boolean(task.isToday || (!isDone && task.day === 2))
                        const isExpanded = expandedTaskGroundingId === (task.id || idx)
                        const groundingTone =
                          task.groundingType === 'video_transcript'
                            ? PILL_TONES.crimson
                            : task.groundingType === 'anti_spam'
                            ? PILL_TONES.warn
                            : task.groundingType === 'creator_voice'
                            ? PILL_TONES.violet
                            : PILL_TONES.sky

                        return (
                          <div
                            key={task.id || idx}
                            className="rounded-xl border transition-all"
                            style={
                              isDone
                                ? { background: C.row, borderColor: C.line, opacity: 0.78 }
                                : isToday
                                ? { background: C.raised, borderColor: C.crimsonLine }
                                : { background: C.row, borderColor: C.line }
                            }
                          >
                            <div className="p-3 sm:p-3.5 space-y-2.5">
                              {/* Top Row: Checkbox + Title + Status Badges + Action Button */}
                              <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <div
                                    className="mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors"
                                    style={
                                      isDone
                                        ? { background: '#059669', borderColor: '#10b981', color: '#ffffff' }
                                        : isToday
                                        ? { background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText }
                                        : { background: C.sheet, borderColor: C.lineStrong }
                                    }
                                  >
                                    {isDone ? (
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    ) : isToday ? (
                                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.crimsonText }} />
                                    ) : null}
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                      <span
                                        className={`font-bold text-xs sm:text-sm leading-snug ${isDone ? 'line-through' : ''}`}
                                        style={{ color: isDone ? C.faint : C.text }}
                                      >
                                        {task.title || task.text}
                                      </span>
                                    </div>

                                    {task.groundingBadge && (
                                      <div className="pt-0.5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setExpandedTaskGroundingId(isExpanded ? null : (task.id || idx))
                                          }}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold cursor-pointer transition-opacity max-w-full truncate border hover:opacity-90"
                                          style={groundingTone}
                                          title="Click to view grounding evidence & transcript citation"
                                        >
                                          <span className="truncate">{task.groundingBadge}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                                  {isDone ? (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border flex items-center gap-1 whitespace-nowrap"
                                      style={PILL_TONES.ok}
                                    >
                                      <Check className="w-2.5 h-2.5 stroke-[3]" style={{ color: C.ok }} />
                                      <span>Done</span>
                                    </span>
                                  ) : isToday ? (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-white flex items-center gap-1 whitespace-nowrap"
                                      style={{ background: C.crimson }}
                                    >
                                      <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
                                      <span>Today's Mission</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[9px] font-mono border whitespace-nowrap"
                                      style={PILL_TONES.neutral}
                                    >
                                      Queued
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => openPhaseStep('campaign')}
                                    className="s2-btn-crimson px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-white transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 active:scale-95"
                                    style={{ background: C.crimson }}
                                    title="Open ready-to-use copy in Campaign Kit"
                                  >
                                    <span>Draft</span>
                                    <ArrowRight className="w-3 h-3 text-white" />
                                  </button>
                                </div>
                              </div>

                              {/* Bottom Metadata & Evidence Toggle */}
                              <div
                                className="flex items-center justify-between gap-2 pt-1.5 text-[10px] sm:text-[11px]"
                                style={{ borderTop: `1px solid ${C.line}` }}
                              >
                                <div className="flex items-center gap-1.5 font-mono" style={{ color: C.muted }}>
                                  <span
                                    className="font-semibold uppercase text-[9px] px-1.5 py-0.5 rounded border"
                                    style={PILL_TONES.raised}
                                  >
                                    {task.channel || task.role || 'Sprint Task'}
                                  </span>
                                  <span style={{ color: C.faint }}>•</span>
                                  <span>Day {task.day || idx + 1}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setExpandedTaskGroundingId(isExpanded ? null : (task.id || idx))}
                                  className="text-[10px] sm:text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap hover:underline transition-opacity"
                                  style={{ color: C.skyText }}
                                >
                                  <span>{isExpanded ? 'Hide Evidence ▲' : 'View Evidence & Citations ▼'}</span>
                                </button>
                              </div>
                            </div>

                            {/* EXPANDABLE AUDIENCE GROUNDING CITATION CARD */}
                            {isExpanded && (
                              <div
                                className="px-3.5 pb-3.5 pt-2 rounded-b-xl space-y-2 text-xs animate-fade-in"
                                style={{ borderTop: `1px solid ${C.line}`, background: C.bg }}
                              >
                                <div
                                  className="p-3 rounded-lg space-y-2"
                                  style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                                >
                                  <div
                                    className="flex items-center justify-between text-[11px] pb-1.5"
                                    style={{ borderBottom: `1px solid ${C.line}` }}
                                  >
                                    <span className="font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                                      <ShieldCheck className="w-3.5 h-3.5" style={{ color: C.ok }} />
                                      <span>Audience Grounding & Provenance</span>
                                    </span>
                                    <span className="text-[10px] font-mono" style={{ color: C.muted }}>
                                      {task.antiSlopNote ? String(task.antiSlopNote).replace(/anti-ai slop/gi, 'authentic voice') : 'Authentic Creator Voice'}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                                      Source Citation / Verbatim Context:
                                    </span>
                                    <p
                                      className="text-[11px] italic p-2.5 rounded-md leading-relaxed"
                                      style={{ background: C.row, border: `1px solid ${C.line}`, color: C.body }}
                                    >
                                      "{task.sourceCitation}"
                                    </p>
                                  </div>

                                  <div className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
                                    <strong className="font-semibold" style={{ color: C.text }}>Why this task is tailored: </strong>
                                    {task.provenanceDetails}
                                  </div>

                                  {task.antiSpamNotice && (
                                    <div
                                      className="p-2 rounded text-[10px] font-medium flex items-center gap-1.5 border"
                                      style={PILL_TONES.warn}
                                    >
                                      <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: C.warn }} />
                                      <span>{task.antiSpamNotice}</span>
                                    </div>
                                  )}

                                  <div
                                    className="flex items-center justify-between pt-1.5 text-[10px]"
                                    style={{ borderTop: `1px solid ${C.line}` }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAudienceIntelModalTab(task.groundingType === 'video_transcript' ? 'transcripts' : 'comments')
                                        setShowAudienceIntelModal(true)
                                      }}
                                      className="font-bold flex items-center gap-1 cursor-pointer hover:opacity-80"
                                      style={{ color: C.skyText }}
                                    >
                                      <span>View Full Evidence Breakdown & Transcripts →</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openPhaseStep('campaign')}
                                      className="font-bold hover:underline cursor-pointer"
                                      style={{ color: C.crimsonText }}
                                    >
                                      Open in Campaign Kit ↗
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* METRICS TAB */}
              {sidebarTab === 'metrics' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <span className="font-bold text-sm block" style={{ ...HEADING_FONT, color: C.text }}>
                    Performance Telemetry & Attribution
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-4 rounded-xl border" style={{ background: C.okSoft, borderColor: C.okLine }}>
                      <span className="font-bold block uppercase text-[10px]" style={{ color: C.ok }}>Presales Revenue</span>
                      <span className="text-lg font-black mt-1 block font-mono" style={{ color: C.text }}>${presalesRevenue.toLocaleString()}</span>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ background: C.skySoft, borderColor: C.skyLine }}>
                      <span className="font-bold block uppercase text-[10px]" style={{ color: C.skyText }}>Unique Visitors</span>
                      <span className="text-lg font-black mt-1 block font-mono" style={{ color: C.text }}>{visitorsCount.toLocaleString()}</span>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ background: C.violetSoft, borderColor: C.violetLine }}>
                      <span className="font-bold block uppercase text-[10px]" style={{ color: C.violetText }}>Conversion Rate</span>
                      <span className="text-lg font-black mt-1 block font-mono" style={{ color: C.text }}>{conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ background: C.warnSoft, borderColor: C.warnLine }}>
                      <span className="font-bold block uppercase text-[10px]" style={{ color: C.warn }}>Refund Rate</span>
                      <span className="text-lg font-black mt-1 block font-mono" style={{ color: C.text }}>{Number(project.refundRate || 0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FILES TAB — INTERACTIVE CODEBASE & REPOSITORY EXPLORER */}
              {sidebarTab === 'files' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <ProjectFileExplorer
                    project={project}
                    onUpdateProject={onUpdateProject}
                    currentPhase={currentPhase}
                  />
                </div>
              )}

              {/* MESSAGES TAB */}
              {sidebarTab === 'messages' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  <CreatorWhatsAppChat
                    project={project}
                    onUpdateProject={onUpdateProject}
                  />
                </div>
              )}

              {/* DECISIONS TAB */}
              {sidebarTab === 'decisions' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {/* Dynamic Validation Gate Metrics */}
                  {(() => {
                    const parseThreshold = (str) => {
                      if (!str) return 0
                      const match = String(str).replace(/,/g, '').match(/\$(\d+)/)
                      return match ? Number(match[1]) : 0
                    }
                    const derivedGoal = parseThreshold(project.validationPlan?.threshold)
                    const presaleGoal = derivedGoal > 0 ? derivedGoal : presaleGoalFor(project)
                    const backersCount = Array.isArray(project.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : Number(project.telemetry?.presalesCount || 0)
                    const currentPresales = Number(String(project.currentPresales || 0).replace(/[^0-9.]/g, '')) || (project.reservations || []).reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
                    const conversionRate = Number(project.conversionRate || (Number(project.visitors || 0) > 0 ? (backersCount / Number(project.visitors)) * 100 : 0))
                    const isRevenueGoalMet = presaleGoal > 0 && currentPresales >= presaleGoal
                    const isFounderApproved = Number(project.currentPhase || 1) > 1 || project.status === 'building'
                    const isGatePassed = isRevenueGoalMet || isFounderApproved

                    return (
                      <>
                        {/* Executive Header */}
                        <div
                          className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border"
                          style={{ background: C.row, borderColor: C.line }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                              style={PILL_TONES.crimson}
                            >
                              <ShieldCheck className="w-4.5 h-4.5" style={{ color: C.crimsonText }} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm tracking-tight" style={{ ...HEADING_FONT, color: C.text }}>
                                  Decisions Requiring Human Approval
                                </h3>
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0"
                                  style={
                                    decisionViewPhase === 3
                                      ? PILL_TONES.crimson
                                      : decisionViewPhase === 2
                                      ? PILL_TONES.sky
                                      : PILL_TONES.ok
                                  }
                                >
                                  {decisionViewPhase === 3 ? 'Phase 3 Milestone' : decisionViewPhase === 2 ? 'Phase 2 Milestone' : 'Phase 1 Milestone'}
                                </span>
                              </div>
                              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                                Executive gate reviews, scaling trajectory & co-founder milestone decisions.
                              </p>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1.5 p-1 rounded-xl border shrink-0"
                            style={{ background: C.sheet, borderColor: C.line }}
                          >
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(3)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              style={
                                decisionViewPhase === 3
                                  ? { background: C.crimson, color: '#ffffff' }
                                  : { background: 'transparent', color: C.muted }
                              }
                            >
                              <Rocket className="w-3.5 h-3.5" />
                              <span>Phase 3 Launch</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(2)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              style={
                                decisionViewPhase === 2
                                  ? { background: '#0284c7', color: '#ffffff' }
                                  : { background: 'transparent', color: C.muted }
                              }
                            >
                              <Cpu className="w-3.5 h-3.5" />
                              <span>Phase 2 MVP</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(1)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              style={
                                decisionViewPhase === 1
                                  ? { background: '#059669', color: '#ffffff' }
                                  : { background: 'transparent', color: C.muted }
                              }
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                              <span>Phase 1 Validate</span>
                            </button>
                          </div>
                        </div>

                        {/* ── PHASE 3 COMMERCIAL DECISION GATE ── */}
                        {decisionViewPhase === 3 && (
                          <div
                            className="relative rounded-2xl border p-4 sm:p-5 space-y-4 overflow-hidden"
                            style={{ background: C.row, borderColor: C.crimsonLine }}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-[2px]"
                              style={{ background: `linear-gradient(90deg, ${C.crimson}, ${C.ok})` }}
                            />

                            <div
                              className="flex flex-wrap items-center justify-between gap-2.5 pt-1 pb-3.5"
                              style={{ borderBottom: `1px solid ${C.line}` }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0"
                                  style={PILL_TONES.crimson}
                                >
                                  <Rocket className="w-4 h-4" style={{ color: C.crimsonText }} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm tracking-tight" style={{ ...HEADING_FONT, color: C.text }}>
                                      Phase 3: Launch Report & Scaling Decision Gate
                                    </h4>
                                    <span
                                      className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border shrink-0"
                                      style={PILL_TONES.raised}
                                    >
                                      Commercial Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                                    Autonomous Telemetry Evaluation & Post-Launch Human Decision (Scale / Iterate / Maintain / Kill)
                                  </p>
                                </div>
                              </div>
                              <span
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0"
                                style={
                                  project?.decisionNotice || isLiveLaunch
                                    ? PILL_TONES.ok
                                    : PILL_TONES.warn
                                }
                              >
                                {project?.decisionNotice ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.ok }} />
                                    <span>Decision Recorded</span>
                                  </>
                                ) : isLiveLaunch ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: C.ok }} />
                                    <span>Production Live</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: C.warn }} />
                                    <span>Pre-Launch Prep</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Active Decision Trajectory Notice */}
                            {project?.decisionNotice ? (
                              <div className="p-4 rounded-xl border space-y-1.5 text-xs" style={{ background: C.okSoft, borderColor: C.okLine }}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: C.ok }}>
                                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.ok }} />
                                    <span>Active Human Strategic Decision</span>
                                  </span>
                                  <span className="text-[10px] font-mono" style={{ color: C.ok }}>Recorded in Launch OS</span>
                                </div>
                                <p className="text-xs font-bold leading-relaxed" style={{ color: C.text }}>{project.decisionNotice}</p>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl border space-y-1 text-xs" style={{ background: C.sheet, borderColor: C.line }}>
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: C.violetText }}>
                                  <Sparkles className="w-3.5 h-3.5" style={{ color: C.violet }} />
                                  <span>Executive Co-Founder Choice Required</span>
                                </div>
                                <p className="text-[11px] leading-relaxed" style={{ color: C.body }}>
                                  Review launch performance below and choose an operating path: <strong style={{ color: C.text }}>Scale</strong>, <strong style={{ color: C.text }}>Iterate</strong>, <strong style={{ color: C.text }}>Maintain</strong>, or <strong style={{ color: C.text }}>Kill</strong>.
                                </p>
                              </div>
                            )}

                            {/* Telemetry 4-Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                              <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: C.sheet, borderColor: C.okLine }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.ok }}>Live Revenue</span>
                                <div className="text-base font-black my-1 font-mono" style={{ color: C.text }}>
                                  ${(Number(project.telemetry?.revenue || presalesRevenue || 0)).toLocaleString()}
                                </div>
                                <span className="text-[9px] block" style={{ color: C.muted }}>Total processed</span>
                              </div>
                              <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: C.sheet, borderColor: C.line }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>Paying Backers</span>
                                <div className="text-base font-black my-1 font-mono" style={{ color: C.text }}>
                                  {project.telemetry?.customers || backersCount || 0}
                                </div>
                                <span className="text-[9px] block" style={{ color: C.muted }}>Active customers</span>
                              </div>
                              <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: C.sheet, borderColor: C.skyLine }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.skyText }}>Conversion Rate</span>
                                <div className="text-base font-black my-1 font-mono" style={{ color: C.skyText }}>
                                  {conversionRate.toFixed(1)}%
                                </div>
                                <span className="text-[9px] block" style={{ color: C.muted }}>Visitor-to-paid</span>
                              </div>
                              <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: C.sheet, borderColor: C.okLine }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.ok }}>Technical Health</span>
                                <div className="text-base font-black my-1 font-mono" style={{ color: project?.launchReport?.technical?.uptime != null ? C.ok : C.muted }}>
                                  {project?.launchReport?.technical?.uptime != null ? `${project.launchReport.technical.uptime}%` : '—'}
                                </div>
                                <span className="text-[9px] block" style={{ color: C.muted }}>{project?.launchReport?.technical?.checkoutSuccess != null ? `${project.launchReport.technical.checkoutSuccess}% checkout success` : 'Not measured yet'}</span>
                              </div>
                            </div>

                            {/* AI Executive Assessment */}
                            <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: C.sheet, borderColor: C.line }}>
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: C.text }}>
                                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: C.violet }} />
                                  <span>AI Launch Report Milestone Assessment</span>
                                </div>
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded border font-bold shrink-0" style={PILL_TONES.ok}>
                                  {project?.phase3Decision?.recommended ? `Recommended: ${String(project.phase3Decision.recommended).toUpperCase()}` : 'No recommendation yet'}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed" style={{ color: C.body }}>
                                {project?.launchReport?.narrative?.summary
                                  || (project?.phase3Decision?.reasons || []).join(' ')
                                  || 'Open Phase 3 → Report + decision to see the launch summary and recommendation, computed from live results.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ── PHASE 2 MVP LAUNCH GATE ── */}
                        {decisionViewPhase === 2 && (
                          <div
                            className="relative rounded-2xl border p-4 sm:p-5 space-y-4 overflow-hidden"
                            style={{ background: C.row, borderColor: C.skyLine }}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-[2px]"
                              style={{ background: `linear-gradient(90deg, ${C.sky}, ${C.violet}, ${C.ok})` }}
                            />

                            <div
                              className="flex flex-wrap items-center justify-between gap-2.5 pt-1 pb-3.5"
                              style={{ borderBottom: `1px solid ${C.line}` }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0" style={PILL_TONES.sky}>
                                  <Cpu className="w-4 h-4" style={{ color: C.sky }} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm tracking-tight" style={{ ...HEADING_FONT, color: C.text }}>
                                      Phase 2: MVP Launch Gate & Readiness Checkpoint
                                    </h4>
                                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border shrink-0" style={PILL_TONES.sky}>
                                      Engineering Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                                    Code Build Verification, QA Test Suite Execution & Production Deployment Clearance
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0" style={PILL_TONES.sky}>
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.sky }} />
                                <span>MVP Built & Verified</span>
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl border text-xs leading-relaxed" style={{ background: C.skySoft, borderColor: C.skyLine, color: C.body }}>
                              Engineering tasks and QA testing have confirmed readiness. Commercial launch clearance verified for Phase 3.
                            </div>
                          </div>
                        )}

                        {/* ── PHASE 1 VALIDATION GATE CHECKPOINT ── */}
                        {decisionViewPhase === 1 && (
                          <div
                            className="relative rounded-2xl border p-4 sm:p-5 space-y-4 overflow-hidden"
                            style={{ background: C.row, borderColor: C.line }}
                          >
                            {/* Top Accent Gradient Bar */}
                            <div
                              className="absolute top-0 left-0 right-0 h-[2px]"
                              style={{ background: `linear-gradient(90deg, ${C.crimson}, ${C.ok})` }}
                            />

                            {/* Card Title & Checkpoint Badge */}
                            <div
                              className="flex flex-wrap items-center justify-between gap-2.5 pt-1 pb-3.5"
                              style={{ borderBottom: `1px solid ${C.line}` }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0" style={PILL_TONES.crimson}>
                                  <Flag className="w-4 h-4" style={{ color: C.crimsonText }} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm tracking-tight" style={{ ...HEADING_FONT, color: C.text }}>
                                      5. Validation Gate Checkpoint
                                    </h4>
                                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border shrink-0" style={PILL_TONES.raised}>
                                      Executive Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                                    Pre-Order Demand & Willingness-to-Pay Threshold
                                  </p>
                                </div>
                              </div>
                              <span
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0"
                                style={isRevenueGoalMet ? PILL_TONES.ok : isFounderApproved ? PILL_TONES.sky : PILL_TONES.warn}
                              >
                                {isRevenueGoalMet ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.ok }} />
                                    <span>Validated</span>
                                  </>
                                ) : isFounderApproved ? (
                                  <>
                                    <Zap className="w-3.5 h-3.5" style={{ color: C.sky }} />
                                    <span>Sprint Active</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: C.warn }} />
                                    <span>Validating</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Telemetry 4-Cards Cohesive Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                              <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: C.sheet, borderColor: C.line }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>Target Goal</span>
                                <div className="text-base font-black my-1 font-mono" style={{ color: C.text }}>
                                  ${presaleGoal.toLocaleString()}
                                </div>
                                <span className="text-[9px] block" style={{ color: C.muted }}>Presale threshold</span>
                              </div>
                              <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: C.sheet, borderColor: C.okLine }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.ok }}>Actual Revenue</span>
                                <div className="text-base font-black my-1 font-mono" style={{ color: C.ok }}>
                                  ${currentPresales.toLocaleString()}
                                </div>
                                <span className="text-[9px] font-medium block" style={{ color: C.ok }}>
                                  {backersCount} paying backer{backersCount === 1 ? '' : 's'}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: C.sheet, borderColor: C.skyLine }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.skyText }}>Conversion Rate</span>
                                <div className="text-base font-black my-1 font-mono" style={{ color: C.text }}>
                                  {conversionRate.toFixed(1)}%
                                </div>
                                <span className="text-[9px] block" style={{ color: C.muted }}>Traffic-to-order</span>
                              </div>
                              <div className="p-3 rounded-xl border flex flex-col justify-between" style={{ background: C.sheet, borderColor: C.line }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>Gate Status</span>
                                <div
                                  className="text-base font-black my-1"
                                  style={{ color: isRevenueGoalMet ? C.ok : isFounderApproved ? C.skyText : C.warn }}
                                >
                                  {isRevenueGoalMet ? 'PASSED' : isFounderApproved ? 'APPROVED' : 'IN PROGRESS'}
                                </div>
                                <span className="text-[9px] block" style={{ color: C.muted }}>
                                  {isRevenueGoalMet ? 'Threshold Met' : isFounderApproved ? 'Phase 2 Sprint' : 'Testing Demand'}
                                </span>
                              </div>
                            </div>

                            {/* Sleek Progress Bar */}
                            <div className="p-3.5 rounded-xl border space-y-2" style={{ background: C.sheet, borderColor: C.line }}>
                              <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                                <span className="font-semibold" style={{ color: C.body }}>Progress Toward Gate</span>
                                <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md border" style={PILL_TONES.raised}>
                                  ${currentPresales.toLocaleString()} / ${presaleGoal.toLocaleString()} • {presaleGoal > 0 ? Math.min(100, Math.round((currentPresales / presaleGoal) * 100)) : 0}%
                                </span>
                              </div>
                              <div className="w-full rounded-full h-2.5 overflow-hidden p-0.5" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    background: isRevenueGoalMet
                                      ? `linear-gradient(90deg, ${C.ok}, #10b981)`
                                      : isFounderApproved
                                      ? `linear-gradient(90deg, ${C.sky}, ${C.violet})`
                                      : `linear-gradient(90deg, ${C.crimson}, ${C.warn})`,
                                    width: `${presaleGoal > 0 ? Math.min(100, Math.max(currentPresales > 0 ? 3 : 0, Math.round((currentPresales / presaleGoal) * 100))) : 0}%`
                                  }}
                                />
                              </div>
                            </div>

                            {/* AI Validation Co-Pilot Assessment */}
                            <div className="p-3.5 rounded-xl border space-y-2" style={{ background: C.sheet, borderColor: C.line }}>
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: C.text }}>
                                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: C.violet }} />
                                  <span>AI Executive Assessment</span>
                                </div>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 font-bold" style={PILL_TONES.ok}>
                                  Verified
                                </span>
                              </div>
                              <div className="text-[11px] leading-relaxed" style={{ color: C.body }}>
                                {isRevenueGoalMet ? (
                                  <div className="flex items-start gap-1.5">
                                    <Flame className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: C.warn }} />
                                    <span>
                                      <strong style={{ color: C.text }}>Target Reached:</strong> Presale target (<strong style={{ color: C.ok }}>${presaleGoal.toLocaleString()}</strong>) validated with <strong style={{ color: C.ok }}>${currentPresales.toLocaleString()}</strong> across <strong style={{ color: C.text }}>{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong style={{ color: C.text }}>{conversionRate.toFixed(1)}%</strong> conv.). Recommending <strong style={{ color: C.ok }}>Build MVP</strong> for Phase 2.
                                    </span>
                                  </div>
                                ) : isFounderApproved ? (
                                  <div className="flex items-start gap-1.5">
                                    <Rocket className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: C.sky }} />
                                    <span>
                                      <strong style={{ color: C.text }}>Founder Greenlit:</strong> Approved for <strong style={{ color: C.skyText }}>Phase 2: Build MVP</strong> with <strong style={{ color: C.ok }}>${currentPresales.toLocaleString()}</strong> presale revenue, <strong style={{ color: C.text }}>{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong style={{ color: C.text }}>{conversionRate.toFixed(1)}%</strong> conv.). Pre-orders remain open during development.
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-1.5">
                                    <BarChart2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: C.sky }} />
                                    <span>
                                      <strong style={{ color: C.text }}>Validation Underway:</strong> <strong style={{ color: C.ok }}>${currentPresales.toLocaleString()}</strong> in pre-orders, <strong style={{ color: C.text }}>{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong style={{ color: C.text }}>{conversionRate.toFixed(1)}%</strong> conv.) toward <strong style={{ color: C.text }}>${presaleGoal.toLocaleString()}</strong> target ({presaleGoal > 0 ? Math.min(100, Math.round((currentPresales / presaleGoal) * 100)) : 0}%). Continue campaigns or execute a gate decision below.
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}

                  {/* RECORDED DECISION LOGS & AUDIT TRAIL */}
                  <div className="space-y-2.5 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" style={{ color: C.muted }} />
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.body }}>
                          Decision History & Gate Audit Trail
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={PILL_TONES.raised}>
                        {decisionsList.length} recorded
                      </span>
                    </div>

                    {decisionsList.length === 0 ? (
                      <div className="p-4 rounded-xl border text-center text-xs" style={{ background: C.row, borderColor: C.line, color: C.muted }}>
                        No decisions logged yet. Executive gate actions recorded above will appear here.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {decisionsList.map((d, i) => {
                          const isScale = d.decision?.includes('scale') || d.title?.toLowerCase().includes('scale')
                          const isIterate = d.decision === 'iterate_validation' || d.gateStatus === 'iterating' || d.decision?.includes('iterate')
                          const isMaintain = d.decision?.includes('maintain')
                          const isKilled = d.decision === 'kill' || d.decision === 'kill_project' || d.gateStatus === 'killed'
                          const isPassed = d.decision === 'pass_to_phase2' || d.gateStatus === 'passed' || isScale || isMaintain
                          const tone = isScale || isPassed ? PILL_TONES.ok : isIterate ? PILL_TONES.warn : PILL_TONES.crimson
                          const dotColor = isScale || isPassed ? C.ok : isIterate ? C.warn : C.crimsonText
                          return (
                            <div
                              key={d.id || i}
                              className="p-3.5 rounded-xl border space-y-1.5 transition-all"
                              style={{ background: C.row, borderColor: C.line }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                                  <span className="font-bold text-xs truncate" style={{ color: C.text }}>
                                    {formatDecisionTitle(d)}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0" style={tone}>
                                  {isScale
                                    ? 'Scale Mode Active'
                                    : isMaintain
                                    ? 'Steady-State'
                                    : isPassed
                                    ? 'Approved & Passed'
                                    : isIterate
                                    ? 'Iteration Sprint'
                                    : isKilled
                                    ? 'Archived'
                                    : d.status || 'Decided'}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>{d.notes || d.description || 'Executive co-founder decision recorded.'}</p>
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[10px] font-mono" style={{ borderTop: `1px solid ${C.line}`, color: C.faint }}>
                                <span>{formatDecisionDate(d.decidedAt || d.timestamp || d.date)}</span>
                                {(d.achievedRevenue !== undefined || d.targetRevenue !== undefined) && (
                                  <span className="font-sans font-medium" style={{ color: C.body }}>
                                    ${(Number(d.achievedRevenue) || 0).toLocaleString()} / ${(Number(d.targetRevenue) || presaleGoal).toLocaleString()} Presales
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM WORKFLOW BANNER */}
          <div className="p-4 rounded-2xl border" style={{ background: C.sheet, borderColor: C.line }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={PILL_TONES.crimson}>
                  <Bot className="w-5 h-5" style={{ color: C.crimsonText }} />
                </div>
                <div>
                  <span className="font-bold block" style={{ color: C.text }}>AI Project Manager</span>
                  <span className="text-[11px] leading-tight block mt-0.5" style={{ color: C.muted }}>
                    Creates tasks, tracks progress, unblocks, and adapts the plan.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={PILL_TONES.violet}>
                  <User className="w-5 h-5" style={{ color: C.violetText }} />
                </div>
                <div>
                  <span className="font-bold block" style={{ color: C.text }}>Creator Portal</span>
                  <span className="text-[11px] leading-tight block mt-0.5" style={{ color: C.muted }}>
                    Simple daily tasks with ready-to-use content.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={PILL_TONES.ok}>
                  <UserCheck className="w-5 h-5" style={{ color: C.ok }} />
                </div>
                <div>
                  <span className="font-bold block" style={{ color: C.text }}>Human Decisions</span>
                  <span className="text-[11px] leading-tight block mt-0.5" style={{ color: C.muted }}>
                    Important decisions come to your inbox.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Step Guard Warning Toast */}
      {toastNotice && (
        <div
          className="fixed bottom-6 right-6 z-[10000] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl animate-fade-in text-xs font-semibold max-w-md backdrop-blur-md"
          style={{ background: C.raised, border: `1px solid ${C.warnLine}`, color: C.warn }}
        >
          <Lock className="w-4 h-4 shrink-0" style={{ color: C.warn }} />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* PHASE EXECUTION MODAL (PHASE 1 / PHASE 2 / PHASE 3) - CLEAN WHITE THEME */}
      {showPhaseExecutionModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#050506]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="max-w-5xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0C0C0E] border border-[#2a2a30] p-6 pb-12 space-y-6 shadow-2xl overscroll-contain text-[#FAFAFA]">
            <div className="flex items-center justify-between border-b border-[#2a2a30] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#18181C] border border-[#2a2a30] flex items-center justify-center shrink-0 shadow-2xs">
                  <CoLaunchLogo size={20} showText={false} theme="light" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#FAFAFA]">
                    Phase {currentPhase}: {currentPhase === 2 ? 'Build MVP Execution Workspace' : currentPhase === 3 ? 'Launch Execution Workspace' : 'Validation Execution Workspace'}
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    {project.productName} × {project.creatorName}
                  </p>
                </div>
              </div>

              <button
                onClick={closePhaseModal}
                className="p-2 rounded-xl text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#18181C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentPhase === 2 ? (
              <Phase2BuildMVP
                project={project}
                api={api}
                activeStepId={selectedPhaseStep}
                onSelectStep={(step) => {
                  setSelectedPhaseStep(step)
                  openPhaseStep(step)
                }}
                onUpdateProject={onUpdateProject}
                onAdvanceToPhase3={() => {
                  handleAdvancePhase(3)
                  setSelectedPhaseTab(3)
                  setSelectedPhaseStep('prep')
                }}
              />
            ) : currentPhase === 3 ? (
              <Phase3Launch
                project={project}
                api={api}
                activeStepId={selectedPhaseStep}
                onSelectStep={openPhaseStep}
                onUpdateProject={onUpdateProject}
              />
            ) : (
              <Phase1Validate
                project={project}
                api={api}
                activeStepId={selectedPhaseStep}
                onSelectStep={openPhaseStep}
                onUpdateProject={onUpdateProject}
                onAdvanceToPhase2={() => {
                  handleAdvancePhase(2)
                  setSelectedPhaseTab(2)
                  setSelectedPhaseStep('plan')
                }}
              />
            )}
          </div>
        </div>,
        document.body
      )}

      {/* SHARE CREATOR PORTAL MODAL */}
      {showShareModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden"
          style={{ background: 'rgba(5, 5, 6, 0.82)' }}
        >
          <div
            className="max-w-2xl w-full p-5 sm:p-6 rounded-2xl space-y-4 shadow-2xl max-h-[92vh] flex flex-col overscroll-contain"
            style={{ background: C.sheet, border: `1px solid ${C.lineStrong}`, color: C.text }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 shrink-0" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl border" style={PILL_TONES.crimson}>
                  <Share2 className="w-4 h-4" style={{ color: C.crimsonText }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ ...HEADING_FONT, color: C.text }}>
                    {userRole === 'creator' ? 'Share Your Co-Founder Portal' : 'Creator Co-Founder Portal & Email Dispatch'}
                  </h3>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    {userRole === 'creator'
                      ? 'Private access link to your active venture workbench'
                      : `Passwordless access link & luxury email invite for ${project.creatorName || 'Creator'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: C.raised, color: C.muted, border: `1px solid ${C.line}` }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CREATOR VIEW: CARRY ONLY CREATOR URL */}
            {userRole === 'creator' ? (
              <div className="space-y-4 py-2">
                <div className="p-4 sm:p-5 rounded-2xl border space-y-3.5" style={{ background: C.row, borderColor: C.line }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.body }}>
                      Your Co-Founder Portal URL
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border" style={PILL_TONES.ok}>
                      Private Token Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={portalUrl}
                      className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono outline-none select-all"
                      style={{ background: C.bg, border: `1px solid ${C.lineStrong}`, color: C.text }}
                    />
                    <button
                      onClick={() => handleCopy(portalUrl, 'portal_url')}
                      className="px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 hover:opacity-90"
                      style={{ background: C.crimson }}
                    >
                      {copiedKey === 'portal_url' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                      <span>{copiedKey === 'portal_url' ? 'Copied Link' : 'Copy Link'}</span>
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                    Bookmark this private link to access your live workbench, real-time telemetry, and partner sprint progress anytime without needing a password.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-80"
                    style={{ color: C.skyText }}
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-5 py-2 rounded-xl text-white font-bold text-xs transition-all cursor-pointer active:scale-95 hover:opacity-90"
                    style={{ background: C.crimson }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* ADMIN DASH VIEW */
              <>
                {/* Modal Navigation Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl shrink-0" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={() => setShareTab('email')}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    style={
                      shareTab === 'email'
                        ? { background: C.raised, color: C.text, border: `1px solid ${C.lineStrong}` }
                        : { background: 'transparent', color: C.muted, border: '1px solid transparent' }
                    }
                  >
                    <Mail className="w-3.5 h-3.5" style={{ color: shareTab === 'email' ? C.crimsonText : C.faint }} />
                    <span>Email Dispatch (SMTP)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareTab('preview')}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    style={
                      shareTab === 'preview'
                        ? { background: C.raised, color: C.text, border: `1px solid ${C.lineStrong}` }
                        : { background: 'transparent', color: C.muted, border: '1px solid transparent' }
                    }
                  >
                    <Eye className="w-3.5 h-3.5" style={{ color: shareTab === 'preview' ? C.skyText : C.faint }} />
                    <span>Visual Email Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareTab('link')}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    style={
                      shareTab === 'link'
                        ? { background: C.raised, color: C.text, border: `1px solid ${C.lineStrong}` }
                        : { background: 'transparent', color: C.muted, border: '1px solid transparent' }
                    }
                  >
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: shareTab === 'link' ? C.violetText : C.faint }} />
                    <span>Magic Link & DM</span>
                  </button>
                </div>

                {/* Modal Tab Content */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* TAB 1: EMAIL DISPATCH */}
                  {shareTab === 'email' && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                          Recipient Email (Creator)
                        </label>
                        <input
                          type="email"
                          value={portalRecipientEmail}
                          onChange={(e) => setPortalRecipientEmail(e.target.value)}
                          placeholder="creator@example.com"
                          className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none"
                          style={{ background: C.row, border: `1px solid ${C.line}`, color: C.text }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={portalEmailSubject}
                          onChange={(e) => setPortalEmailSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                          style={{ background: C.row, border: `1px solid ${C.line}`, color: C.text }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                          Personalized Message Body
                        </label>
                        <textarea
                          rows={5}
                          value={portalEmailBody}
                          onChange={(e) => setPortalEmailBody(e.target.value)}
                          className="w-full p-3.5 rounded-xl text-xs outline-none leading-relaxed font-sans resize-none"
                          style={{ background: C.row, border: `1px solid ${C.line}`, color: C.body }}
                        />
                      </div>

                      {portalEmailStatus && (
                        <div
                          className="p-3 rounded-xl text-xs flex items-center gap-2 border"
                          style={portalEmailSuccess ? PILL_TONES.ok : PILL_TONES.crimson}
                        >
                          {portalEmailSuccess ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.ok }} />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: C.crimsonText }} />
                          )}
                          <span>{portalEmailStatus}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleSendPortalEmail}
                          disabled={isSendingPortalEmail}
                          className="px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer hover:opacity-90"
                          style={{ background: C.crimson }}
                        >
                          {isSendingPortalEmail ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching...</span>
                            </>
                          ) : portalEmailSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Sent Successfully!</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 text-white" />
                              <span>Send Portal Invite Email</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: VISUAL EMAIL PREVIEW */}
                  {shareTab === 'preview' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="p-4 rounded-xl border space-y-3" style={{ background: C.row, borderColor: C.line }}>
                        {/* Simulated Email Client Bar */}
                        <div className="p-2.5 rounded-lg border text-[11px] space-y-1 font-mono" style={{ background: C.sheet, borderColor: C.line, color: C.muted }}>
                          <div><strong style={{ color: C.text }}>From:</strong> CoLaunch Venture Studio &lt;partnerships@colaunch.com&gt;</div>
                          <div><strong style={{ color: C.text }}>To:</strong> {portalRecipientEmail || 'creator@example.com'}</div>
                          <div><strong style={{ color: C.text }}>Subject:</strong> {portalEmailSubject}</div>
                        </div>

                        {/* Email Card Preview (keeps dark shell + crisp preview card) */}
                        <div className="rounded-xl border overflow-hidden text-xs" style={{ background: C.sheet, borderColor: C.lineStrong }}>
                          <div className="p-4 flex items-center justify-between" style={{ background: C.raised, borderBottom: `1px solid ${C.line}` }}>
                            <div className="flex items-center gap-2">
                              <CoLaunchLogo size={20} showText={false} theme="light" />
                              <span style={{ ...HEADING_FONT, color: C.text }} className="font-bold text-sm">CoLaunch</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border" style={PILL_TONES.ok}>
                              Verified Invite
                            </span>
                          </div>

                          <div className="p-5 space-y-3 leading-relaxed font-sans" style={{ color: C.body }}>
                            <p className="whitespace-pre-line font-medium" style={{ color: C.text }}>
                              {portalEmailBody}
                            </p>

                            <div className="p-3.5 rounded-xl border space-y-2" style={{ background: C.row, borderColor: C.line }}>
                              <div className="font-bold text-xs" style={{ color: C.text }}>Co-Launch Venture Snapshot</div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div><span style={{ color: C.muted }}>Software:</span> <strong style={{ color: C.text }}>{project.productName || 'Custom App'}</strong></div>
                                <div><span style={{ color: C.muted }}>Revenue Split:</span> <strong style={{ color: C.ok }}>50% Net Creator Share</strong></div>
                                <div><span style={{ color: C.muted }}>Initial Pricing:</span> <strong style={{ color: C.text }}>{project.pricing || '$49/mo'}</strong></div>
                                <div><span style={{ color: C.muted }}>Validation Goal:</span> <strong style={{ color: C.ok }}>${presaleTarget.toLocaleString()}</strong></div>
                              </div>
                            </div>

                            <div className="pt-2 text-center">
                              <a
                                href={magicPortalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs transition-all hover:opacity-90"
                                style={{ background: C.crimson }}
                              >
                                <span>Open Co-Founder Portal (Passwordless Access)</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>

                          {/* Email Footer */}
                          <div className="p-4 text-center text-[10px] space-y-0.5" style={{ background: C.row, borderTop: `1px solid ${C.line}`, color: C.muted }}>
                            <div className="font-bold" style={{ color: C.body }}>CoLaunch Venture Studio</div>
                            <div>Co-launching software empires with leading digital creators.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MAGIC LINK & DM */}
                  {shareTab === 'link' && (
                    <div className="space-y-3.5 animate-fade-in">
                      {/* Portal Magic URL Box */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                          Secure Magic Link (No Password Required)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={magicPortalUrl}
                            className="flex-1 px-3 py-2 rounded-xl text-xs font-mono outline-none select-all"
                            style={{ background: C.row, border: `1px solid ${C.line}`, color: C.text }}
                          />
                          <button
                            onClick={() => handleCopy(magicPortalUrl, 'link')}
                            className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-opacity cursor-pointer hover:opacity-90"
                            style={{ background: C.crimson }}
                          >
                            {copiedKey === 'link' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                            <span>{copiedKey === 'link' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Kickoff DM Message */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                            Social DM / WhatsApp Invite Message
                          </label>
                          <button
                            onClick={() => handleCopy(kickoffMessage, 'msg')}
                            className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:opacity-80"
                            style={{ color: C.skyText }}
                          >
                            {copiedKey === 'msg' ? <Check className="w-3.5 h-3.5" style={{ color: C.ok }} /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'msg' ? 'Copied Message' : 'Copy Message'}</span>
                          </button>
                        </div>
                        <textarea
                          readOnly
                          rows={6}
                          value={kickoffMessage}
                          className="w-full p-3.5 rounded-xl text-xs outline-none leading-relaxed font-sans resize-none select-all"
                          style={{ background: C.row, border: `1px solid ${C.line}`, color: C.body }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Actions Footer */}
                <div className="flex items-center justify-between pt-3 shrink-0" style={{ borderTop: `1px solid ${C.line}` }}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: C.ok }}>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{shareNotice || 'Magic token active & verified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={magicPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-opacity hover:opacity-90"
                      style={{ background: C.raised, borderColor: C.line, color: C.body }}
                    >
                      <span>Preview Live Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="px-4 py-2 rounded-xl text-white text-xs font-bold transition-opacity cursor-pointer hover:opacity-90"
                      style={{ background: C.crimson }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* VENTURE FILE PREVIEW MODAL */}
      {previewingFile && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden"
          style={{ background: 'rgba(5, 5, 6, 0.85)' }}
        >
          <div
            className="max-w-3xl w-full max-h-[85vh] flex flex-col rounded-3xl p-6 shadow-2xl space-y-4"
            style={{ background: C.sheet, border: `1px solid ${C.lineStrong}`, color: C.text }}
          >
            <div className="flex items-center justify-between pb-3 shrink-0" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border flex items-center justify-center" style={PILL_TONES.violet}>
                  <FileText className="w-5 h-5" style={{ color: C.violetText }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ ...HEADING_FONT, color: C.text }}>
                    <span>{previewingFile.title}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border" style={PILL_TONES.sky}>
                      {previewingFile.badge || 'Venture Asset'}
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono" style={{ color: C.muted }}>{previewingFile.name} • {previewingFile.size}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewingFile(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity cursor-pointer hover:opacity-80"
                style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.muted }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto rounded-xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed"
              style={{ background: C.row, border: `1px solid ${C.line}`, color: C.body }}
            >
              {previewingFile.content}
            </div>

            <div className="flex items-center justify-between pt-2 shrink-0" style={{ borderTop: `1px solid ${C.line}` }}>
              <div className="text-[11px] font-mono" style={{ color: C.muted }}>
                Stored in Project Vault • Ready for export
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(previewingFile.content, previewingFile.id)}
                  className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-opacity cursor-pointer hover:opacity-90"
                  style={{ background: C.raised, borderColor: C.line, color: C.body }}
                >
                  {copiedKey === previewingFile.id ? <Check className="w-3.5 h-3.5" style={{ color: C.ok }} /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === previewingFile.id ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewingFile)}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-90"
                  style={{ background: C.crimson }}
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-90 text-white" />
                  <span>Download Asset</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AUDIENCE INTELLIGENCE, TRANSCRIPTS & ANTI-SPAM MODAL */}
      <AudienceGroundingModal
        isOpen={showAudienceIntelModal}
        onClose={() => setShowAudienceIntelModal(false)}
        project={project}
        initialTab={audienceIntelModalTab}
      />

      {/* TEXT-BASED WORKFLOW WIRING ARCHITECTURE TUTORIAL */}
      <WorkflowWiringTutorial
        isOpen={showWiringTutorial}
        onClose={() => setShowWiringTutorial(false)}
      />
    </div>
  )
}
