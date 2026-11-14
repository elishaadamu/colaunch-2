import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Layers, ArrowLeft, Users, ExternalLink, RefreshCw, ChevronDown,
  Check, Sparkles, ShieldCheck, Rocket, AlertCircle, Plus, LayoutGrid, Zap, Loader2, Workflow
} from 'lucide-react'
import ProjectOS from './ProjectOS'
import { ProjectOSSkeleton } from './Section2Skeletons'
import DIYSubscriptionModal from './DIYSubscriptionModal'
import WorkflowWiringTutorial from './WorkflowWiringTutorial'
import { startSection2Tour } from '../../utils/driverTour'
import CoLaunchLogo from '../ui/CoLaunchLogo'
import {
  getCoLaunchProjects,
  getCoLaunchProject,
  updateCoLaunchProject,
  createCoLaunchProject,
  getCreators,
  getCreator,
  getWorkflowState
} from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'

// Section 2 Base Dark Palette (matches Section 1 Steps 5 & 6)
const C = {
  bg: '#08090c',
  sheet: '#10131a',
  row: '#0c0e13',
  raised: '#171b24',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#f3f4f6',
  body: '#cdd1da',
  muted: '#9ba1ae',
  faint: '#6c7280',
  crimson: '#c81e3c',
  crimsonHover: '#d92a49',
  crimsonSoft: 'rgba(200,30,60,0.15)',
  crimsonLine: 'rgba(200,30,60,0.45)',
  crimsonText: '#ff8fa3',
  ok: '#6fcf9b',
  okSoft: 'rgba(111,207,155,0.13)',
  okLine: 'rgba(111,207,155,0.38)',
  warn: '#f0b46a',
  warnSoft: 'rgba(240,180,106,0.13)',
  warnLine: 'rgba(240,180,106,0.40)',
  sky: '#38bdf8',
  skySoft: 'rgba(56,189,248,0.12)',
  skyLine: 'rgba(56,189,248,0.36)',
  skyText: '#7dd3fc',
  violet: '#a78bfa',
  violetSoft: 'rgba(167,139,250,0.14)',
  violetLine: 'rgba(167,139,250,0.40)',
  violetText: '#c4b5fd',
}

// Helper to check if string is raw UUID
const isUuid = (str) =>
  typeof str === 'string' &&
  (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()) ||
    /^[0-9a-f-]{24,}$/i.test(str.trim()))

export const RETRO_GAMING_PROJECT = {
  id: 'proj_retrovault_gaming',
  creatorId: 'c_retro_gaming',
  creatorName: 'Retro Game Corps',
  creatorHandle: 'retrogaming',
  creatorAvatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=80',
  creatorEmail: 'partner@retrovault.io',
  niche: 'Retro Gaming & Emulation',
  followers: '340K subscribers',
  productName: 'RetroVault OS',
  productTagline: 'Cloud-save synchronizer, custom CRT shader pipeline, and ROM metadata archiver for retro handhelds & emulation.',
  pricing: '$19/mo Player Pass • $49/mo Collector Suite',
  presaleTarget: 10000,
  currentPhase: 1,
  status: 'validating',
  selectedConcept: {
    id: 'c_retro_1',
    name: 'RetroVault OS',
    tagline: 'Cloud-save synchronizer, custom CRT shader pipeline, and ROM metadata archiver for retro handhelds & emulation.',
    pricing: '$19/mo Player Pass • $49/mo Collector Suite',
    mockupType: 'saas_os',
    brandColor: '#c81e3c',
    problem: 'Retro handheld owners (Steam Deck, Miyoo, Anbernic, Retroid) constantly lose save progress between devices, wrestle with broken shader configs, and lack unified ROM metadata backup.',
    customer: 'Retro gaming enthusiasts, handheld console modders, classic game collectors, and retro streaming communities.',
    keyFeatures: [
      'Cross-Device Instant Cloud Save Sync',
      'Studio-Grade CRT Scanline & Trinitron Shader Engine',
      'Unified Box Art, Manual & Metadata Scraper',
      'Community High-Score & Speedrun Leaderboards'
    ],
    opportunityScore: 98,
    presaleTarget: 10000
  },
  validationPlan: {
    customer: 'Retro handheld owners (Steam Deck, Miyoo, Anbernic, PC) and classic game preservationists who struggle with fragmented save files.',
    problem: 'Save state files, memory card backups, and custom CRT shader configurations are isolated per device with zero automated cloud synchronization.',
    offer: 'Early Co-Builder Lifetime Pass ($49 deposit): Instant access to private beta, cross-device cloud save sync across 5 devices, and 40+ curated CRT shader presets.',
    pricing: '$19/mo Player Pass • $49/mo Collector Suite (50/50 Creator Revenue Split)',
    testMethod: '1) YouTube video demonstration & community poll, 2) 48-hour founding member presale sprint, 3) 50 beta test slots for Steam Deck & Miyoo users.',
    period: '14 Days Validation Sprint',
    threshold: '$10,000 in presales or 200 Co-Builder pass reservations',
    status: 'approved',
    locked: true,
    generated: true
  },
  validationCampaign: {
    reviewStatus: 'approved',
    productAssets: {
      announcementPost: "🎮 We're solving retro gaming's biggest headache: losing your save files between your Steam Deck, Miyoo, and PC. Introducing RetroVault OS — automated cloud saves + studio-grade CRT shaders. Claim your early Co-Builder pass now: https://retrovault.io/pass",
      storySequence: "Slide 1: Ever spent 30 hours in a classic JRPG only to realize your save is stuck on an SD card at home?\nSlide 2: Meet RetroVault OS — zero-friction cloud saves across all your devices.\nSlide 3: 50 Founding Member beta slots open today. Link in bio!",
      videoScript: "Hook: 'Why are we still manually copying retro game save files in 2026?'\nProblem: You have a Steam Deck, a Miyoo Mini+, and a PC emulator, but your saves never talk to each other.\nSolution: RetroVault OS automatically syncs every save state and ROM config seamlessly.\nCTA: 'We're opening 50 Co-Builder passes today at a 50% discount — link in description.'",
      newsletterDraft: "Subject: Finally, cloud saves for your retro handhelds.\n\nHey everyone,\n\nIf you've ever lost a 40-hour Chrono Trigger or Pokemon save because you swapped devices, you know the pain. Today, our studio is launching the private beta for RetroVault OS..."
    }
  },
  campaignKit: {
    announcementPost: "🎮 We're solving retro gaming's biggest headache: losing your save files between your Steam Deck, Miyoo, and PC. Introducing RetroVault OS — automated cloud saves + studio-grade CRT shaders. Claim your early Co-Builder pass now: https://retrovault.io/pass",
    storySequence: "Slide 1: Ever spent 30 hours in a classic JRPG only to realize your save is stuck on an SD card at home?\nSlide 2: Meet RetroVault OS — zero-friction cloud saves across all your devices.\nSlide 3: 50 Founding Member beta slots open today. Link in bio!",
    videoScript: "Hook: 'Why are we still manually copying retro game save files in 2026?'\nProblem: You have a Steam Deck, a Miyoo Mini+, and a PC emulator, but your saves never talk to each other.\nSolution: RetroVault OS automatically syncs every save state and ROM config seamlessly.\nCTA: 'We're opening 50 Co-Builder passes today at a 50% discount — link in description.'",
    newsletterDraft: "Subject: Finally, cloud saves for your retro handhelds.\n\nHey everyone,\n\nIf you've ever lost a 40-hour Chrono Trigger or Pokemon save because you swapped devices, you know the pain. Today, our studio is launching the private beta for RetroVault OS..."
  },
  presalesRevenue: 4850,
  currentPresales: 4850,
  reservations: [
    { id: 'res_1', amount: 49, customerName: 'Alex R. (Steam Deck)', email: 'alex.deck@gmail.com', date: '2 hours ago', passType: 'Co-Builder Pass' },
    { id: 'res_2', amount: 49, customerName: 'Marcus K. (Miyoo Mini+)', email: 'marcus.k@retrofan.io', date: '5 hours ago', passType: 'Co-Builder Pass' },
    { id: 'res_3', amount: 49, customerName: 'Sarah L. (Anbernic RG35XX)', email: 'sarah.rg@gmail.com', date: '1 day ago', passType: 'Co-Builder Pass' },
    { id: 'res_4', amount: 49, customerName: 'Devon M. (RetroArch PC)', email: 'devon@emudev.com', date: '1 day ago', passType: 'Co-Builder Pass' }
  ],
  telemetry: {
    totalVisitors: 3420,
    uniqueClicks: 1280,
    conversionRate: 2.89,
    surveySubmissions: 142
  },
  experimentsData: {
    experiments: [
      {
        id: 'exp_1',
        name: 'Value Proposition Headline Test',
        hypothesis: "Focusing on 'Cross-Device Save Sync' will drive 25% higher CTR than 'CRT Shaders'.",
        variantA: 'The Ultimate CRT Shader & Filter Studio for Retro Gamers',
        variantB: 'Never Lose a Retro Game Save Again — Instant Cloud Sync',
        trafficSplit: '50 / 50',
        conversionsA: 34,
        conversionsB: 58,
        status: 'active'
      },
      {
        id: 'exp_2',
        name: 'Pricing Model: One-Time Pass vs Recurring',
        hypothesis: 'A $49 Lifetime Co-Builder pass will convert 2x faster than a $19/mo recurring plan during Phase 1 validation.',
        variantA: '$19/mo Player Pass',
        variantB: '$49 Founding Member Lifetime Pass',
        trafficSplit: '50 / 50',
        conversionsA: 22,
        conversionsB: 48,
        status: 'completed'
      }
    ]
  }
}

export default function ProjectOSPage() {
  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showDiyModal, setShowDiyModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [showWorkflowTutorial, setShowWorkflowTutorial] = useState(false)

  const [cobuilderPassPrice, setCobuilderPassPrice] = useState(0)
  const [isPassPriceLoading, setIsPassPriceLoading] = useState(true)

  useEffect(() => {
    try { localStorage.removeItem('forge_cobuilder_pass_price') } catch (e) { }

    getWorkflowState().then((wf) => {
      const dbFee = wf?.default_pass_price ?? wf?.cobuilder_pass_price ?? wf?.extra_state?.default_pass_price ?? wf?.extra_state?.cobuilder_pass_price
      if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
        setCobuilderPassPrice(Number(dbFee))
      } else {
        setCobuilderPassPrice(0)
      }
      setIsPassPriceLoading(false)
    }).catch(() => {
      setCobuilderPassPrice(0)
      setIsPassPriceLoading(false)
    })

    const handlePriceEvent = (e) => {
      const p = e?.detail
      if (p !== undefined && p !== null && !isNaN(Number(p))) {
        setCobuilderPassPrice(Number(p))
      } else {
        setCobuilderPassPrice(0)
      }
      setIsPassPriceLoading(false)
    }
    window.addEventListener('forge_pass_price_changed', handlePriceEvent)
    return () => {
      window.removeEventListener('forge_pass_price_changed', handlePriceEvent)
    }
  }, [])

  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  // Update SEO on mount
  useEffect(() => {
    updatePageSEO({
      title: 'Project OS — Co-Launch Operations Center | CoLaunch',
      description: 'Dedicated operator command center for validating, building, and launching partner software ventures.',
      image: '/og-image.svg'
    })
  }, [])

  // Resolve target project ID or creator ID from URL
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return { projectId: null, creatorId: null }
    const sp = new URLSearchParams(window.location.search)
    let projectId = sp.get('project') || sp.get('id') || sp.get('projectId')
    let creatorId = sp.get('creator') || sp.get('creatorId')

    // Also check pathname: e.g. /project-os/proj_123 or /projects/proj_123
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    if (pathParts.length > 1 && (pathParts[0] === 'project-os' || pathParts[0] === 'projects')) {
      projectId = pathParts[1]
    }
    return { projectId, creatorId }
  }, [])

  // Load projects and resolve active project
  const loadProjects = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setIsRefreshing(true)

    try {
      const { projectId, creatorId } = getUrlParams()
      const remoteProjects = await getCoLaunchProjects()
      const list = Array.isArray(remoteProjects) ? remoteProjects : remoteProjects?.projects || []
      
      const allProjects = [
        RETRO_GAMING_PROJECT,
        ...list.filter((p) => p.id !== RETRO_GAMING_PROJECT.id && p.id !== 'proj_retrovault_gaming')
      ]
      setProjects(allProjects)

      let target = null

      // 1. Try to find by projectId from URL
      if (projectId) {
        if (projectId === 'retro' || projectId === 'retrogaming' || projectId === RETRO_GAMING_PROJECT.id) {
          target = RETRO_GAMING_PROJECT
        } else {
          target = allProjects.find((p) => p.id === projectId)
          if (!target) {
            try {
              target = await getCoLaunchProject(projectId)
            } catch (e) {
              console.warn('[ProjectOSPage] Direct project fetch failed:', e)
            }
          }
        }
      }

      // 2. Try to find by creatorId from URL
      if (!target && creatorId) {
        if (creatorId === 'retrogaming' || creatorId === 'c_retro_gaming') {
          target = RETRO_GAMING_PROJECT
        } else {
          target = allProjects.find(
            (p) =>
              p.creatorId === creatorId ||
              (p.creatorHandle && p.creatorHandle.replace(/^@/, '').toLowerCase() === creatorId.replace(/^@/, '').toLowerCase())
          )
        }

        // If no project exists yet for this creator, initialize one
        if (!target) {
          try {
            let creator = null
            try {
              creator = await getCreator(creatorId)
            } catch (e) {
              const allCreators = await getCreators({ limit: 100 })
              const clist = Array.isArray(allCreators) ? allCreators : allCreators?.creators || []
              creator = clist.find(
                (c) =>
                  c.id === creatorId ||
                  (c.handle && c.handle.replace(/^@/, '').toLowerCase() === creatorId.replace(/^@/, '').toLowerCase())
              )
            }

            if (creator) {
              const creatorName = creator.name || creator.display_name || creator.handle || 'Partner Creator'
              const allConcepts = creator.productConcepts || creator.concepts || []
              const primaryConcept = creator.selectedConcept || allConcepts[0] || {
                name: `${creatorName} Pro Hub`,
                tagline: `Software platform built for ${creatorName}'s audience`,
                pricing: '$29/mo Starter • $79/mo Pro',
                revenueModel: 'Monthly SaaS Subscription',
                presaleTarget: 12500
              }

              const cleanH = String(creator.handle || 'partner').replace(/^@/, '').trim().toLowerCase()
              let cachedVideos = []
              if (cleanH) {
                try {
                  const raw = sessionStorage.getItem(`forge_creator_videos_${cleanH}`)
                  if (raw) cachedVideos = JSON.parse(raw)
                } catch (e) { }
              }
              const creatorPosts = (Array.isArray(creator.recentPosts) && creator.recentPosts.length > 0 ? creator.recentPosts : null) ||
                (Array.isArray(creator.recent_posts) && creator.recent_posts.length > 0 ? creator.recent_posts : null) ||
                (Array.isArray(creator.videos) && creator.videos.length > 0 ? creator.videos : null) ||
                (Array.isArray(cachedVideos) && cachedVideos.length > 0 ? cachedVideos : null) ||
                []

              const newPayload = {
                id: `proj_${Date.now()}`,
                creatorId: creator.id || creatorId,
                creatorName,
                creatorHandle: creator.handle || 'partner',
                creatorAvatar: creator.avatar || creator.avatar_url || '',
                creatorEmail: creator.email || creator.email_public || '',
                niche: creator.niche || 'Software & Tech',
                followers: creator.followerStr || creator.follower_count || '50k+',
                productName: primaryConcept.name,
                productTagline: primaryConcept.tagline,
                pricing: primaryConcept.pricing || '$29/mo',
                presaleTarget: primaryConcept.presaleTarget || 12500,
                currentPhase: 1,
                status: 'validating',
                selectedConcept: primaryConcept,
                selectedConceptId: primaryConcept.id,
                channelUrl: creator.profile_url || (cleanH ? `https://www.youtube.com/@${cleanH}` : ''),
                channelDescription: creator.bio || '',
                recentPosts: creatorPosts,
                videos: creatorPosts,
              }

              const created = await createCoLaunchProject(newPayload)
              target = created || newPayload
              setProjects((prev) => [target, ...prev])
            }
          } catch (err) {
            console.warn('[ProjectOSPage] Auto-create project for creator failed:', err)
          }
        }
      }

      // 3. Fallback to Retro Gaming venture if no target resolved
      if (!target) {
        target = RETRO_GAMING_PROJECT
      }
      if (target) {
        const handleClean = String(target.creatorHandle || '').replace(/^@/, '').trim().toLowerCase()
        let cachedVideos = []
        if (handleClean) {
          try {
            const raw = sessionStorage.getItem(`forge_creator_videos_${handleClean}`)
            if (raw) cachedVideos = JSON.parse(raw)
          } catch (e) { }
        }
        const resolvedPosts = (Array.isArray(target.recentPosts) && target.recentPosts.length > 0 ? target.recentPosts : null) ||
          (Array.isArray(target.videos) && target.videos.length > 0 ? target.videos : null) ||
          (Array.isArray(cachedVideos) && cachedVideos.length > 0 ? cachedVideos : null) ||
          []

        const resolvedKit = target.campaignKit ||
          target.validationCampaign?.campaignKit ||
          target.validationCampaign?.campaign_kit ||
          (target.validationCampaign?.productAssets?.announcementPost ? target.validationCampaign.productAssets : null) ||
          null
        const hasKit = Boolean(
          resolvedKit && (
            Boolean(resolvedKit.announcementPost?.trim()) ||
            Boolean(resolvedKit.storySequence?.trim()) ||
            Boolean(resolvedKit.videoScript?.trim()) ||
            Boolean(resolvedKit.newsletterDraft?.trim())
          )
        )
        const enhancedTarget = {
          ...target,
          recentPosts: resolvedPosts,
          videos: resolvedPosts,
          channelUrl: target.channelUrl || (handleClean ? `https://www.youtube.com/@${handleClean}` : ''),
          channelDescription: target.channelDescription || '',
          campaignKit: resolvedKit,
          campaignLaunched: hasKit,
          campaignAssetsGenerated: hasKit,
          creatorTasks: Array.isArray(target.creatorTasks) ? target.creatorTasks : []
        }
        setActiveProject(enhancedTarget)

        // If target has no posts yet, fetch live from YouTube
        if (resolvedPosts.length === 0 && handleClean && !/^[0-9a-f-]{15,}$/i.test(handleClean)) {
          import('../../services/scraper').then(({ fetchCreatorYouTubeVideos }) => {
            fetchCreatorYouTubeVideos(handleClean).then((vids) => {
              if (vids && vids.length > 0) {
                setActiveProject((prev) => (prev && prev.id === target.id ? { ...prev, recentPosts: vids, videos: vids } : prev))
              }
            }).catch(() => { })
          })
        }

        try {
          // Reflect project ID in URL without reload
          const url = new URL(window.location.href)
          url.searchParams.set('project', target.id)
          if (target.creatorId) url.searchParams.set('creator', target.creatorId)
          window.history.replaceState({}, '', url.toString())
        } catch (e) { }
      }
    } catch (err) {
      console.error('[ProjectOSPage] Failed to load projects:', err)
      showToast('error', 'Sync Failed', 'Could not load projects from database.')
    } finally {
      if (!isSilent) setLoading(false)
      setIsRefreshing(false)
    }
  }, [getUrlParams])

  // Initial load
  useEffect(() => {
    loadProjects(false)
  }, [loadProjects])

  // Handle switching active project from dropdown
  const handleSelectProject = (project) => {
    setActiveProject(project)
    setShowProjectDropdown(false)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('project', project.id)
      if (project.creatorId) url.searchParams.set('creator', project.creatorId)
      window.history.replaceState({}, '', url.toString())
    } catch (e) { }
  }

  // Handle live updates from Phase 1-4 components
  const updateDbTimerRef = useRef(null)
  const handleUpdateActiveProject = useCallback((updater) => {
    let resolved
    setActiveProject(prev => {
      resolved = typeof updater === 'function' ? updater(prev) : updater
      return resolved
    })
    if (!resolved || !resolved.id) return
    setProjects((prev) => prev.map((p) => (p.id === resolved.id ? resolved : p)))

    if (updateDbTimerRef.current) clearTimeout(updateDbTimerRef.current)
    updateDbTimerRef.current = setTimeout(async () => {
      try {
        await updateCoLaunchProject(resolved.id, {
          ...resolved,
          currentPhase: resolved.currentPhase,
          current_phase: resolved.currentPhase,
          status: resolved.status,
          campaignKit: resolved.campaignKit,
          campaign_kit: resolved.campaignKit,
          metadataInfo: {
            ...(resolved.metadataInfo || {}),
            campaign_kit: resolved.campaignKit || resolved.metadataInfo?.campaign_kit
          }
        })
      } catch (err) {
        console.warn('[ProjectOSPage] Error saving project update:', err)
      }
    }, 600)
  }, [])

  // Handle resetting project state back to Phase 1
  const handleResetProject = async (projectId) => {
    const targetId = projectId || activeProject?.id
    if (!targetId || !activeProject) return

    try {
      localStorage.removeItem(`forge_p1_step_${targetId}`)
      localStorage.removeItem(`forge_p2_step_${targetId}`)
      localStorage.removeItem(`forge_p3_step_${targetId}`)
      localStorage.removeItem(`forge_p1_progress_${targetId}`)
      localStorage.removeItem(`forge_p2_progress_${targetId}`)
      localStorage.removeItem(`forge_p3_progress_${targetId}`)
    } catch (e) { }

    const resetPayload = {
      ...activeProject,
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
      presaleOrders: [],
      engineeringTasks: [],
      betaFeedback: [],
      qaResults: null,
      decisionTelemetry: null,
      metadataInfo: {
        ...(activeProject?.metadataInfo || activeProject?.metadata_info || {}),
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

    await handleUpdateActiveProject(resetPayload)
    showToast('success', 'Project Reset', 'Project reset cleanly to Phase 1 (Validate).')
  }

  // Handle successful DIY Creator subscription unlock (Stripe/PayPal)
  const handleDiySubscribeSuccess = (subDetails) => {
    if (!activeProject) return
    const updated = {
      ...activeProject,
      isDIY: true,
      diySubscription: subDetails
    }
    handleUpdateActiveProject(updated)
    showToast('success', 'DIY License Activated', 'Full autonomous ProjectOS pipeline unlocked with 100% revenue retention.')
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: C.bg, color: C.text }}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2"
          style={{ background: C.raised, border: `1px solid ${toast.type === 'error' ? C.crimsonLine : C.okLine}`, color: C.text }}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" style={{ color: C.crimsonText }} />
          ) : (
            <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: C.ok }} />
          )}
          <div className="text-xs">
            <div className="font-semibold" style={{ color: C.text }}>{toast.title}</div>
            <div style={{ color: C.muted }}>{toast.message}</div>
          </div>
        </div>
      )}

      {/* Top Universal Operator Command Bar */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 w-full max-w-full"
        style={{ background: 'rgba(16, 19, 26, 0.94)', borderBottom: `1px solid ${C.line}` }}
      >
        {/* Left: Branding & Back Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="/launch"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-xs font-semibold group shrink-0"
            style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.body }}
            title="Return to Creator Acquisition Engine (Steps 1–6)"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" style={{ color: C.muted }} />
            <span className="hidden md:inline">Creator Acquisition</span>
            <span className="md:hidden">Back</span>
          </a>

          <div className="h-4 w-px hidden sm:block shrink-0" style={{ background: C.line }} />

          {/* Studio Brand & Section Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }}
            >
              <CoLaunchLogo size={16} showText={false} theme="light" />
            </div>
            <div className="hidden xs:block">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span
                  style={{ fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text }}
                  className="text-xs font-bold tracking-tight hidden sm:inline"
                >
                  CoLaunch
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                  style={{ background: C.crimsonSoft, color: C.crimsonText, border: `1px solid ${C.crimsonLine}` }}
                >
                  PROJECT OS
                </span>
              </div>
              <p className="text-[10px] hidden lg:block" style={{ color: C.muted }}>Co-Launch Operations & Engineering Command</p>
            </div>
          </div>
        </div>

        {/* Center: Project Switcher Dropdown */}
        {activeProject && (
          <div className="relative min-w-0 flex-1 max-w-[150px] xs:max-w-[200px] sm:max-w-[320px]">
            <button
              type="button"
              onClick={() => setShowProjectDropdown((prev) => !prev)}
              className="w-full flex items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer"
              style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                {activeProject.creatorAvatar ? (
                  <img
                    src={activeProject.creatorAvatar}
                    alt={activeProject.creatorName}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                    style={{ border: `1px solid ${C.lineStrong}` }}
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0"
                    style={{ background: C.crimsonSoft, color: C.crimsonText }}
                  >
                    {(activeProject.creatorName || 'P')[0]}
                  </div>
                )}
                <div className="text-left min-w-0 flex-1 truncate">
                  <div className="font-bold truncate text-[11px] sm:text-xs" style={{ color: C.text }}>
                    {activeProject.productName || 'Active Venture'}
                  </div>
                  <div className="text-[10px] truncate hidden xs:block" style={{ color: C.muted }}>
                    {activeProject.creatorName ? `w/ ${activeProject.creatorName}` : 'Partner Project'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-0.5" style={{ color: C.muted }} />
            </button>

            {/* Dropdown Menu */}
            {showProjectDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProjectDropdown(false)}
                />
                <div
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
                  style={{ background: C.sheet, border: `1px solid ${C.lineStrong}`, color: C.text }}
                >
                  <div
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between"
                    style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
                  >
                    <span>Co-Launch Projects ({projects.length})</span>
                    <a
                      href="/launch?step=1"
                      className="flex items-center gap-1 font-bold hover:opacity-80"
                      style={{ color: C.crimsonText }}
                    >
                      <Plus className="w-3 h-3" /> New Lead
                    </a>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                    {projects.map((p) => {
                      const isCurrent = p.id === activeProject.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProject(p)}
                          className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-all cursor-pointer"
                          style={
                            isCurrent
                              ? { background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.text, fontWeight: 700 }
                              : { background: 'transparent', border: '1px solid transparent', color: C.body }
                          }
                        >
                          {p.creatorAvatar ? (
                            <img
                              src={p.creatorAvatar}
                              alt={p.creatorName}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                              style={{ background: C.raised, color: C.text }}
                            >
                              {(p.creatorName || 'P')[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate flex items-center gap-1.5" style={{ color: C.text }}>
                              <span>{p.productName || 'Co-Launch Venture'}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: C.crimsonText }} />}
                            </div>
                            <div className="text-[10px] truncate" style={{ color: C.muted }}>
                              {p.creatorName || p.creatorHandle || 'Partner'} • Phase {p.currentPhase || 1}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: CRM Link & Refresh Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dedicated Co-Builder Passes & Participation Console Link */}
          <a
            href="/participation-manager"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold hover:opacity-90"
            style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}`, color: C.warn }}
            title="Open Dedicated Creator Participation & Co-Builder Console"
          >
            <Zap className="w-3.5 h-3.5" style={{ color: C.warn }} />
            <span className="flex items-center gap-1">
              Co-Builder Passes (
              {isPassPriceLoading ? (
                <Loader2 className="w-3 h-3 animate-spin inline-block" style={{ color: C.warn }} />
              ) : (
                `$${cobuilderPassPrice || 0}`
              )}
              )
            </span>
            <ExternalLink className="w-3 h-3" style={{ color: C.warn }} />
          </a>

          <a
            href="/follow-up-crm"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold hover:opacity-90"
            style={{ background: C.skySoft, border: `1px solid ${C.skyLine}`, color: C.skyText }}
            title="Open Standalone Creator Follow-Up CRM"
          >
            <Users className="w-3.5 h-3.5" style={{ color: C.sky }} />
            <span>CRM & Replies</span>
            <ExternalLink className="w-3 h-3" style={{ color: C.skyText }} />
          </a>

          {/* Driver.js Interactive Tour Trigger */}
          <button
            type="button"
            onClick={() => startSection2Tour(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer hover:opacity-90"
            style={{ background: C.violetSoft, border: `1px solid ${C.violetLine}`, color: C.violetText }}
            title="Start Interactive Guided Walkthrough (Driver.js)"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: C.violet }} />
            <span className="hidden sm:inline">Workflow Tour</span>
          </button>

          {/* Text-Based Workflow Wiring Tutorial Trigger */}
          <button
            type="button"
            onClick={() => setShowWorkflowTutorial(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer hover:opacity-90"
            style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, color: C.body }}
            title="Open Interactive Workflow Wiring Architecture Guide"
          >
            <Workflow className="w-3.5 h-3.5" style={{ color: C.muted }} />
            <span className="hidden sm:inline">Wiring Guide</span>
          </button>

          <button
            type="button"
            onClick={() => loadProjects(true)}
            disabled={isRefreshing}
            className="p-1.5 sm:p-2 rounded-lg transition-all text-xs cursor-pointer hover:opacity-90"
            style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.body }}
            title="Refresh Project Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} style={isRefreshing ? { color: C.sky } : undefined} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        {loading ? (
          <div className="px-2.5 sm:px-5 lg:px-6 py-3 sm:py-4 max-w-full 2xl:max-w-[1720px] mx-auto w-full">
            <ProjectOSSkeleton />
          </div>
        ) : activeProject ? (
          <div className="px-2.5 sm:px-5 lg:px-6 py-3 sm:py-4 max-w-full 2xl:max-w-[1720px] mx-auto w-full">
            <ProjectOS
              key={activeProject.id}
              project={activeProject}
              onUpdateProject={handleUpdateActiveProject}
              onGoToAcquisition={() => {
                window.location.href = '/launch'
              }}
              onResetProject={handleResetProject}
              userRole={activeProject.isDIY || activeProject.diySubscription?.active ? 'creator' : 'admin'}
              isDIY={Boolean(activeProject.isDIY || activeProject.diySubscription?.active)}
            />
          </div>
        ) : (
          /* Empty State: No Projects Created Yet */
          <div className="flex-1 flex items-center justify-center p-6">
            <div
              className="max-w-md w-full p-8 rounded-3xl text-center space-y-5 shadow-xl"
              style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.text }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
                style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}
              >
                <Rocket className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text }}
                >
                  No Active Co-Launch Project
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                  You have not initialized a software co-launch project yet. Scout, qualify, and pitch a creator in Section 1 to launch a live project.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/launch?step=1"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all hover:opacity-90"
                  style={{ background: C.crimson }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Start Creator Acquisition</span>
                </a>
                <a
                  href="/follow-up-crm"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.body }}
                >
                  <Users className="w-3.5 h-3.5" style={{ color: C.sky }} />
                  <span>View CRM Leads</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DIY Subscription Modal (Stripe / PayPal / Demo Unlock) */}
      {showDiyModal && activeProject && (
        <DIYSubscriptionModal
          project={activeProject}
          isOpen={showDiyModal}
          onClose={() => setShowDiyModal(false)}
          onSuccess={handleDiySubscribeSuccess}
        />
      )}

      {/* Interactive Text-Based Workflow Wiring Tutorial Modal */}
      <WorkflowWiringTutorial
        isOpen={showWorkflowTutorial}
        onClose={() => setShowWorkflowTutorial(false)}
      />
    </div>
  )
}
