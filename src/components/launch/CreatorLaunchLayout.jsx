import { useEffect, useState } from 'react'
import { Rocket, Target, Layers, ExternalLink, LogOut, User, X, ShieldAlert, Lock, Users, ChevronDown, Check, Plus, Loader2, Menu, Search, Send, MessageSquare, Sparkles, Award, Zap } from 'lucide-react'
import CoLaunchLogo from '../ui/CoLaunchLogo'
import AcquisitionEngine from './AcquisitionEngine'
import ProjectOS from './ProjectOS'
import { ProjectOSSkeleton } from './Section2Skeletons'
import AdminPipelineLookup from './AdminPipelineLookup'
import CreatorFollowUpCRM from './CreatorFollowUpCRM'
import { createCoLaunchProject, getCoLaunchProject, getCoLaunchProjects } from '../../services/opsApi'
import { buildValidationSeed } from './conceptSchema'
import { updatePageSEO } from '../../utils/seo'
import { getExpiringItem, setExpiringItem, removeExpiringItem, ONE_HOUR_MS } from '../../utils/expiringStorage'
import FloatingPolygons, { HeroShallowPolygons } from '../ui/FloatingPolygons'

import { logoutLaunchAuth } from './LaunchAuth'
import { startSection1Tour } from '../../utils/driverTour'

export default function CreatorLaunchLayout({
  initialProject = null,
  initialCreators = [],
  api = null
}) {
  useEffect(() => {
    updatePageSEO({
      title: "Operator Master Studio — Acquisition Engine & Launch OS | CoLaunch",
      description: "End-to-end creator discovery, audience intelligence, autonomous outreach, and 50/50 venture launch pipeline.",
      image: "/og-image.svg"
    });
  }, []);
  // If someone lands on /launch?section=section2 or with a ?project= param, redirect smoothly to dedicated /project-os route
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search)
        const secParam = searchParams.get('section')
        const projParam = searchParams.get('project')
        if (secParam === 'section2' || (!secParam && projParam)) {
          const nextUrl = new URL('/project-os', window.location.origin)
          if (projParam) nextUrl.searchParams.set('project', projParam)
          const creatorParam = searchParams.get('creator') || searchParams.get('creatorId')
          if (creatorParam) nextUrl.searchParams.set('creator', creatorParam)
          window.location.replace(nextUrl.toString())
        }
      }
    } catch (e) { }
  }, [])



  const [activeSection, setActiveSection] = useState('section1')

  // Detect raw UUID strings (prevent phantom projects from using UUIDs as names)
  const isUuid = (str) => typeof str === 'string' && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()) || /^[0-9a-f-]{24,}$/i.test(str.trim()))

  // Detect corrupted or phantom project fabricated for deleted/non-existent creator
  const isCorruptedPhantomProject = (p) => {
    if (!p) return false
    if (isUuid(p.creatorName) || isUuid(p.creatorHandle)) return true
    if (p.productName && isUuid(p.productName.replace(/ Pro Hub| Co-Launch OS| Software Product/gi, '').trim())) return true
    return false
  }

  const [activeProject, setActiveProject] = useState(null)
  const [allProjects, setAllProjects] = useState([])
  const [showPartnerMenu, setShowPartnerMenu] = useState(false)
  const [isSwitchingCreator, setIsSwitchingCreator] = useState(false)
  const [switchingTarget, setSwitchingTarget] = useState(null)
  const [showAdminLookup, setShowAdminLookup] = useState(false)
  const [showFollowUpCRM, setShowFollowUpCRM] = useState(false)
  const [crmCreators, setCrmCreators] = useState([])
  const [crmThreads, setCrmThreads] = useState([])
  const [isSyncingCrmImap, setIsSyncingCrmImap] = useState(false)
  const [acquisitionNavState, setAcquisitionNavState] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const secParam = searchParams?.get('section')
      const stepParam = Number(searchParams?.get('step'))
      const creatorParam = searchParams?.get('creator') || searchParams?.get('creatorId')
      if (secParam === 'section1' || (stepParam >= 1 && stepParam <= 6)) {
        return {
          step: (stepParam >= 1 && stepParam <= 6) ? stepParam : 5,
          creatorId: creatorParam || null,
          nonce: Date.now()
        }
      }
      return null
    } catch {
      return null
    }
  })
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [section1ActiveStep, setSection1ActiveStep] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const stepParam = Number(searchParams?.get('step'))
      return (stepParam >= 1 && stepParam <= 6) ? stepParam : 1
    } catch {
      return 1
    }
  })
  const [showSection1Menu, setShowSection1Menu] = useState(false)
  const [showSection1Sidebar, setShowSection1Sidebar] = useState(false)

  const [cobuilderPassPrice, setCobuilderPassPrice] = useState(0)
  const [isPassPriceLoading, setIsPassPriceLoading] = useState(true)

  useEffect(() => {
    try { localStorage.removeItem('forge_cobuilder_pass_price') } catch (e) { }

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

  const SECTION1_STEPS = [
    { step: 1, label: '1. Campaign Setup', desc: 'Target Niches & Autonomous Engine', icon: Target, color: 'text-white', bg: 'bg-[#141417]' },
    { step: 2, label: '2. Find & Qualify', desc: 'Discover & Score Creator Candidates', icon: Search, color: 'text-white', bg: 'bg-[#141417]' },
    { step: 3, label: '3. Autonomous Outreach', desc: 'Personalized Inquiries & SMTP Delivery', icon: Send, color: 'text-white', bg: 'bg-[#141417]' },
    { step: 4, label: '4. Interested Review', desc: 'Live Creator Inquiries & Replies CRM', icon: MessageSquare, color: 'text-white', bg: 'bg-[#141417]' },
    { step: 5, label: '5. Audience & Ideas', desc: 'Audience Analysis & 3 Engineered Concepts', icon: Sparkles, color: 'text-white', bg: 'bg-[#141417]' },
    { step: 6, label: '6. Pitch & Select', desc: '50/50 Co-Founder Launch Agreement', icon: Award, color: 'text-white', bg: 'bg-[#141417]' },
  ]

  const fetchCrmData = async () => {
    try {
      const { getCreators, getThreads } = await import('../../services/opsApi')
      const [creatorsRes, threadsRes] = await Promise.allSettled([
        getCreators({ limit: 100 }),
        getThreads(),
      ])
      if (creatorsRes.status === 'fulfilled' && creatorsRes.value) {
        const rawList = Array.isArray(creatorsRes.value) ? creatorsRes.value : creatorsRes.value?.creators || []
        setCrmCreators(rawList)
      }
      if (threadsRes.status === 'fulfilled' && threadsRes.value) {
        setCrmThreads(Array.isArray(threadsRes.value) ? threadsRes.value : [])
      }
    } catch (err) {
      console.warn('[CreatorLaunchLayout] CRM sync error:', err)
    }
  }

  const syncCrmImap = async () => {
    setIsSyncingCrmImap(true)
    try {
      const { pollInboxReplies, getThreads } = await import('../../services/opsApi')
      const res = await pollInboxReplies()
      const threads = res?.threads || (await getThreads())
      if (threads && Array.isArray(threads)) {
        setCrmThreads(threads)
      }
    } catch (e) {
      console.warn('[CreatorLaunchLayout] CRM IMAP sync error:', e)
    } finally {
      setIsSyncingCrmImap(false)
    }
  }

  const handleApproveCrmCreator = async (creatorId) => {
    setCrmCreators((prev) =>
      prev.map((c) => (c.id === creatorId || c.handle === creatorId ? { ...c, status: 'approved' } : c))
    )
    try {
      const { updateCreatorDetails } = await import('../../services/opsApi')
      await updateCreatorDetails(creatorId, { status: 'approved' })
    } catch (e) {
      console.warn('Approve CRM creator failed:', e)
    }
  }

  const handleRejectCrmCreator = async (creatorId) => {
    setCrmCreators((prev) =>
      prev.map((c) => (c.id === creatorId || c.handle === creatorId ? { ...c, status: 'rejected' } : c))
    )
    try {
      const { updateCreatorDetails } = await import('../../services/opsApi')
      await updateCreatorDetails(creatorId, { status: 'rejected' })
    } catch (e) {
      console.warn('Reject CRM creator failed:', e)
    }
  }

  const handleDeleteCrmCreator = (creatorId) => {
    setCrmCreators((prev) => prev.filter((c) => c.id !== creatorId && c.handle !== creatorId))
    fetchCrmData()
  }

  useEffect(() => {
    fetchCrmData()
    const handleCreatorsUpdated = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setCrmCreators(e.detail)
      } else {
        fetchCrmData()
      }
    }
    window.addEventListener('forge:creators_updated', handleCreatorsUpdated)
    return () => {
      window.removeEventListener('forge:creators_updated', handleCreatorsUpdated)
    }
  }, [activeSection])

  // Read active individual user / admin profile
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('forge_user_profile')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const userDisplayName = userProfile?.name || userProfile?.username || userProfile?.email || 'Admin'
  const userInitial = userDisplayName.replace('@', '').charAt(0).toUpperCase() || 'A'

  // Logout handler: resets pipeline to Section 1, Step 1, locks Section 2, and cleans caches
  const handleLogout = () => {
    try {
      logoutLaunchAuth()
      localStorage.removeItem('forge_active_session')
      localStorage.removeItem('forge_user_profile')
      localStorage.removeItem('forge_login_timestamp')
      localStorage.removeItem('ops_admin_auth')
      localStorage.removeItem('ops_authenticated')

      // Clear Section 2 project and lock it completely
      removeExpiringItem('forge_launch_active_project')
      localStorage.removeItem('forge_launch_active_section')
      setExpiringItem('forge_launch_active_step', '1', ONE_HOUR_MS)
      setExpiringItem('forge_launch_acquisition_step', '1', ONE_HOUR_MS)

      // Clear pipeline state so Step 1 starts fresh
      localStorage.removeItem('forge_launch_discovered_creators')
      localStorage.removeItem('forge_launch_real_threads')
      localStorage.removeItem('forge_launch_pitch_sent_map')
      localStorage.removeItem('forge_launch_answer_sent_map')
      localStorage.removeItem('forge_launch_persuasion_sent_map')
      localStorage.removeItem('forge_launch_ai_choice_map')
      localStorage.removeItem('forge_creator_data')
    } catch (e) {
      console.warn('Logout cleanup error:', e)
    }

    setActiveProject(null)
    setActiveSection('section1')

    // Navigate to Section 1 Step 1 and do full reload to guarantee clean state
    window.location.href = '/launch?section=section1&step=1'
  }

  // Dedicated multi-creator switcher: loads or creates a Co-Launch project for any selected creator
  const handleSwitchToCreatorProject = async (creatorOrId) => {
    if (!creatorOrId) return null

    const isObj = typeof creatorOrId === 'object' && creatorOrId !== null
    const targetId = isObj ? (creatorOrId.id || creatorOrId.creatorId || creatorOrId.handle) : String(creatorOrId).trim()
    const targetHandle = isObj ? (creatorOrId.handle || creatorOrId.creatorHandle) : (!targetId.startsWith('proj_') ? targetId : null)
    const targetEmail = isObj ? (creatorOrId.email || creatorOrId.email_public || creatorOrId.creatorEmail) : null
    const cleanTarget = String(targetHandle || targetId).replace(/^@/, '').toLowerCase().trim()

    // Immediate loader & target feedback
    const knownMatch = allProjects.find(p => p.id === targetId || p.creatorId === targetId || (p.creatorHandle && p.creatorHandle.replace(/^@/, '').toLowerCase() === cleanTarget)) ||
      crmCreators.find(c => c.id === targetId || (c.handle && c.handle.replace(/^@/, '').toLowerCase() === cleanTarget))

    const targetHintName = isObj
      ? (creatorOrId.name || creatorOrId.creatorName || creatorOrId.display_name || creatorOrId.handle)
      : (knownMatch?.creatorName || knownMatch?.name || cleanTarget)
    const targetHintAvatar = isObj
      ? (creatorOrId.avatar || creatorOrId.creatorAvatar || creatorOrId.avatar_url)
      : (knownMatch?.creatorAvatar || knownMatch?.avatar)
    const targetHintProduct = isObj
      ? (creatorOrId.productName || creatorOrId.name)
      : (knownMatch?.productName || `${targetHintName} Co-Launch OS`)

    setIsSwitchingCreator(true)
    setSwitchingTarget({
      id: targetId,
      name: targetHintName,
      avatar: targetHintAvatar,
      productName: targetHintProduct
    })
    const switchStart = Date.now()

    try {
      const { getCoLaunchProjects, getCreators, getCreator, createCoLaunchProject, updateWorkflowState, updateCreatorDetails } = await import('../../services/opsApi')

      let projs = []
      try {
        projs = (await getCoLaunchProjects()) || []
        if (Array.isArray(projs) && projs.length > 0) {
          setAllProjects(projs)
        }
      } catch (e) {
        projs = allProjects || []
      }

      // 1. Check if a project already exists for this creator across remote DB & local state
      const candidateProjects = [
        ...(Array.isArray(projs) ? projs : []),
        ...(Array.isArray(allProjects) ? allProjects : [])
      ]

      let matched = candidateProjects.find(p => {
        if (!p) return false
        if (p.id === targetId) return true
        if (p.creatorId && String(p.creatorId).toLowerCase() === targetId.toLowerCase()) return true
        if (p.creatorHandle && cleanTarget && p.creatorHandle.replace(/^@/, '').toLowerCase() === cleanTarget) return true
        if (p.creatorName && cleanTarget && p.creatorName.toLowerCase().trim() === cleanTarget && cleanTarget.length > 3 && !['creator', 'partner', 'lead'].includes(cleanTarget)) return true
        return false
      })

      if (matched) {
        // If an explicit concept choice or updated product was passed, update matched project
        const passedConcept = isObj ? (creatorOrId.selectedConcept || (creatorOrId.productName ? creatorOrId : null)) : null
        const passedConceptId = isObj ? (creatorOrId.selectedConceptId || creatorOrId.selected_concept_id || passedConcept?.id) : null
        const passedName = isObj ? (creatorOrId.productName || passedConcept?.name) : null
        const passedPricing = isObj ? (creatorOrId.pricing || passedConcept?.pricing) : null

        if (passedName && (passedName !== matched.productName || (passedPricing && passedPricing !== matched.pricing))) {
          matched = {
            ...matched,
            productName: passedName,
            productTagline: creatorOrId.productTagline || passedConcept?.tagline || matched.productTagline,
            pricing: passedPricing || matched.pricing,
            selectedConcept: passedConcept || matched.selectedConcept,
            selectedConceptId: passedConceptId || matched.selectedConceptId,
          }
          import('../../services/opsApi').then(({ updateCoLaunchProject }) => {
            updateCoLaunchProject(matched.id, {
              productName: matched.productName,
              productTagline: matched.productTagline,
              pricing: matched.pricing,
              selectedConcept: matched.selectedConcept
            }).catch(() => { })
          })
        }
        const handleClean = (matched.creatorHandle || '').replace(/^@/, '').trim().toLowerCase()
        let cachedVideos = []
        if (handleClean) {
          try {
            const raw = localStorage.getItem(`forge_creator_videos_${handleClean}`) || sessionStorage.getItem(`forge_creator_videos_${handleClean}`)
            if (raw) cachedVideos = JSON.parse(raw)
          } catch (e) { }
        }
        if ((!matched.recentPosts || matched.recentPosts.length === 0) && cachedVideos.length > 0) {
          matched.recentPosts = cachedVideos
          matched.videos = cachedVideos
        }
        if (!matched.channelUrl && handleClean) {
          matched.channelUrl = `https://www.youtube.com/@${handleClean}`
        }

        setActiveProject(matched)
        try {
          localStorage.removeItem('forge_launch_active_section')
          const nextUrl = new URL('/project-os', window.location.origin)
          nextUrl.searchParams.set('project', matched.id)
          if (matched.creatorId) nextUrl.searchParams.set('creator', matched.creatorId)
          window.location.href = nextUrl.toString()
          return matched
        } catch (e) {
          window.location.href = `/project-os?project=${matched.id}`
          return matched
        }
      }

      // 2. Project does not exist yet -> resolve full creator record to initialize fresh project
      let creatorProfile = isObj ? creatorOrId : null
      if (!creatorProfile || !creatorProfile.name) {
        try {
          const res = await getCreators({ limit: 100 })
          const list = Array.isArray(res) ? res : res?.creators || []
          creatorProfile = list.find(c =>
            c.id === targetId ||
            (c.handle && c.handle.replace(/^@/, '').toLowerCase() === cleanTarget) ||
            (targetEmail && (c.email || c.email_public)?.toLowerCase() === targetEmail.toLowerCase())
          )
        } catch (e) { }
      }

      // If still not found, try fetching individual creator by ID
      if (!creatorProfile && targetId && !targetId.startsWith('proj_')) {
        try {
          creatorProfile = await getCreator(targetId)
        } catch (e) { }
      }

      // CRITICAL SAFEGUARD: If creator does NOT exist in database, NEVER fabricate a phantom project with raw UUID!
      if (!creatorProfile || (!creatorProfile.name && !creatorProfile.display_name && !creatorProfile.handle)) {
        console.warn(`[CreatorLaunchLayout] Creator "${targetId}" not found in database. Aborting project creation.`)
        try {
          const url = new URL(window.location.href)
          url.searchParams.delete('creator')
          url.searchParams.delete('creatorId')
          url.searchParams.delete('project')
          window.history.replaceState({}, '', url.toString())
        } catch (e) { }
        setIsSwitchingCreator(false)
        setSwitchingTarget(null)
        if (!activeProject) {
          setActiveSection('section1')
        }
        return null
      }

      const rawName = creatorProfile?.name || creatorProfile?.display_name || creatorProfile?.handle || ''
      const creatorName = rawName && !isUuid(rawName) ? rawName : 'Creator Partner'
      const creatorHandle = (creatorProfile?.handle && !isUuid(creatorProfile.handle)) ? creatorProfile.handle : 'partner'
      const creatorEmail = creatorProfile?.email || creatorProfile?.email_public || targetEmail || 'partner@colaunch.com'
      const creatorAvatar = creatorProfile?.avatar || creatorProfile?.avatar_url || ''
      const creatorFollowers = creatorProfile?.followerStr || creatorProfile?.follower_count || '50k+'
      const creatorNiche = creatorProfile?.niche || 'Software & Tech'

      // Prioritize explicitly selected concept (e.g. Concept 2 or Concept 3) over default Concept 1
      const allConcepts = creatorProfile?.productConcepts || creatorProfile?.product_concepts || creatorProfile?.concepts || []
      const savedLocalConceptId = creatorProfile?.id ? getExpiringItem('forge_creator_concept_selection_map', {})[creatorProfile.id] : null
      const effectiveConceptId = (isObj ? (creatorOrId.selectedConceptId || creatorOrId.selected_concept_id) : null) ||
        creatorProfile?.selectedConceptId ||
        creatorProfile?.selected_concept_id ||
        savedLocalConceptId

      const chosenConceptFromList = effectiveConceptId
        ? allConcepts.find(c => c.id === effectiveConceptId)
        : null
      const primaryConcept = (isObj && creatorOrId.selectedConcept) ||
        creatorProfile?.selectedConcept ||
        creatorProfile?.selected_concept ||
        chosenConceptFromList ||
        allConcepts[0] || {
        name: `${creatorName} Pro Hub`,
        tagline: `All-in-one software platform built for ${creatorName}'s audience`,
        pricing: '$29/mo Starter • $79/mo Pro',
        revenueModel: 'Monthly SaaS Subscription',
        presaleTarget: 12500,
      }

      const cleanHandle = String(creatorHandle || '').replace(/^@/, '').trim().toLowerCase()
      let cachedVideos = []
      if (cleanHandle) {
        try {
          const raw = localStorage.getItem(`forge_creator_videos_${cleanHandle}`) || sessionStorage.getItem(`forge_creator_videos_${cleanHandle}`)
          if (raw) cachedVideos = JSON.parse(raw)
        } catch (e) { }
      }

      const rawPosts = (
        (Array.isArray(creatorProfile?.recentPosts) && creatorProfile.recentPosts.length > 0 ? creatorProfile.recentPosts : null) ||
        (Array.isArray(creatorProfile?.recent_posts) && creatorProfile.recent_posts.length > 0 ? creatorProfile.recent_posts : null) ||
        (Array.isArray(creatorProfile?.videos) && creatorProfile.videos.length > 0 ? creatorProfile.videos : null) ||
        (Array.isArray(cachedVideos) && cachedVideos.length > 0 ? cachedVideos : null) ||
        []
      )
      const channelUrl = creatorProfile?.profile_url || creatorProfile?.channelUrl || creatorProfile?.channel_url || (cleanHandle ? `https://www.youtube.com/@${cleanHandle}` : '')
      const channelBio = creatorProfile?.bio || creatorProfile?.channelDescription || creatorProfile?.creatorBio || ''

      const newProjPayload = {
        id: `proj_${Date.now()}`,
        creatorId: creatorProfile?.id || targetId,
        creatorName,
        creatorHandle,
        creatorAvatar,
        creatorEmail,
        niche: creatorNiche,
        followers: creatorFollowers,
        productName: primaryConcept.name || `${creatorName} Pro Hub`,
        productTagline: primaryConcept.tagline || `Tailored co-launch platform for ${creatorName}`,
        brandColor: primaryConcept.brandColor || creatorProfile?.brandColor || creatorProfile?.brand_color || '#c81e3c',
        brand_color: primaryConcept.brandColor || creatorProfile?.brandColor || creatorProfile?.brand_color || '#c81e3c',
        colorTheme: primaryConcept.brandColor || creatorProfile?.brandColor || creatorProfile?.brand_color || '#c81e3c',
        pricing: primaryConcept.pricing || '$29/mo',
        presaleTarget: primaryConcept.presaleTarget || 12500,
        currentPhase: 1,
        status: 'validating',
        selectedConcept: primaryConcept,
        selectedConceptId: primaryConcept.id,
        diyFee: cobuilderPassPrice,
        diyPassPrice: cobuilderPassPrice,
        hasCustomFee: true,
        channelUrl,
        channelDescription: channelBio,
        creatorBio: channelBio,
        recentPosts: rawPosts,
        videos: rawPosts,
      }

      let created = null
      try {
        created = await createCoLaunchProject({
          ...newProjPayload,
          portalLinkSent: true,
          skipCreatorEmail: true
        })
      } catch (err) {
        console.warn('[CreatorLaunchLayout] createCoLaunchProject API error, using local payload:', err)
      }
      const finalProject = created && created.id ? created : newProjPayload

      setActiveProject(finalProject)
      setAllProjects(prev => {
        const cleanHandle = (finalProject.creatorHandle || '').replace(/^@/, '').toLowerCase()
        const cleanName = (finalProject.creatorName || '').toLowerCase().trim()
        const cleanId = String(finalProject.creatorId || '').toLowerCase().trim()
        const filtered = (prev || []).filter(p => {
          if (!p) return false
          if (p.id === finalProject.id) return false
          if (cleanId && p.creatorId && String(p.creatorId).toLowerCase() === cleanId) return false
          const pHandle = (p.creatorHandle || '').replace(/^@/, '').toLowerCase()
          if (cleanHandle && pHandle && cleanHandle === pHandle) return false
          const pName = (p.creatorName || '').toLowerCase().trim()
          if (cleanName && pName && cleanName === pName) return false
          return true
        })
        return [finalProject, ...filtered]
      })
      try {
        localStorage.removeItem('forge_launch_active_section')
        const url = new URL(window.location.href)
        url.searchParams.set('section', 'section2')
        url.searchParams.set('project', finalProject.id)
        if (finalProject.creatorId) url.searchParams.set('creator', finalProject.creatorId)
        window.history.replaceState({}, '', url.toString())

        // Mark creator as Section 2 partnered in local stage map and DB
        const map = getExpiringItem('forge_creator_stage_map', {})
        map[finalProject.creatorId] = {
          step: 'section2',
          stepNumber: 7,
          actionName: 'Section 2 Project OS',
          updatedAt: new Date().toISOString()
        }
        if (finalProject.creatorHandle) {
          map[finalProject.creatorHandle.replace(/^@/, '').toLowerCase()] = map[finalProject.creatorId]
        }
        setExpiringItem('forge_creator_stage_map', map, ONE_HOUR_MS)
        updateWorkflowState({ creator_stage_map: map }).catch(() => { })
        if (creatorProfile?.id) {
          updateCreatorDetails(creatorProfile.id, { status: 'partnered' }).catch(() => { })
        }
        const nextUrl = new URL('/project-os', window.location.origin)
        nextUrl.searchParams.set('project', finalProject.id)
        if (finalProject.creatorId) nextUrl.searchParams.set('creator', finalProject.creatorId)
        window.location.href = nextUrl.toString()
        return finalProject
      } catch (e) {
        window.location.href = `/project-os?project=${finalProject.id}`
        return finalProject
      }
    } catch (err) {
      console.warn('[CreatorLaunchLayout] handleSwitchToCreatorProject failed:', err)
      window.location.href = '/project-os'
      return null
    } finally {
      setIsSwitchingCreator(false)
      setSwitchingTarget(null)
    }
  }

  // Deep-link handler: Load specific creator or project from URL query params (?section=section1&step=5&creator=xxx / ?section=section2&creator=xxx / ?project=proj_xxx)
  useEffect(() => {
    const handleUrlSync = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const secParam = searchParams.get('section')
        const projIdParam = searchParams.get('project')
        const creatorParam = searchParams.get('creator') || searchParams.get('creatorId')
        const stepParam = searchParams.get('step')

        if (secParam === 'section1') {
          setActiveSection('section1')
          const stepNum = Number(stepParam) || 5
          setAcquisitionNavState({
            step: stepNum,
            creatorId: creatorParam || null,
            nonce: Date.now(),
          })
          return
        }

        if (secParam === 'section2') {
          setActiveSection('section2')
          if (creatorParam || projIdParam) {
            handleSwitchToCreatorProject(creatorParam || projIdParam)
          }
          return
        }

        // If no section param in URL, determine from project or creator & step
        if (projIdParam) {
          setActiveSection('section2')
          handleSwitchToCreatorProject(projIdParam)
        } else if (creatorParam) {
          const stepNum = Number(stepParam) || 5
          setActiveSection('section1')
          setAcquisitionNavState({
            step: stepNum,
            creatorId: creatorParam,
            nonce: Date.now(),
          })
        }
      } catch (e) {
        console.warn('[CreatorLaunchLayout] URL parameter parse error:', e)
      }
    }

    handleUrlSync()
    window.addEventListener('popstate', handleUrlSync)
    return () => window.removeEventListener('popstate', handleUrlSync)
  }, [])



  // Synchronize with backend DB: Sync workflow state and active projects across all devices
  useEffect(() => {
    let isMounted = true
    const syncDbState = async () => {
      try {
        const { getWorkflowState, getCoLaunchProjects } = await import('../../services/opsApi')
        const [workflowRes, projectsRes] = await Promise.allSettled([
          getWorkflowState(),
          getCoLaunchProjects(),
        ])

        if (isMounted && workflowRes.status === 'fulfilled' && workflowRes.value) {
          const ws = workflowRes.value
          const dbFee = ws?.default_pass_price ?? ws?.cobuilder_pass_price ?? ws?.extra_state?.default_pass_price ?? ws?.extra_state?.cobuilder_pass_price
          if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
            setCobuilderPassPrice(Number(dbFee))
          } else {
            setCobuilderPassPrice(0)
          }
          setIsPassPriceLoading(false)
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
          const urlSec = searchParams?.get('section')
          // Do NOT auto-switch clean /launch to section2 just because of backend DB state.
          // Clean /launch must remain on Section 1 unless an explicit ?section=section2 query param was opened.
          if (urlSec === 'section2' && ws.active_section === 'section2') {
            setActiveSection('section2')
          }
        } else if (isMounted) {
          setCobuilderPassPrice(0)
          setIsPassPriceLoading(false)
        }

        if (isMounted && projectsRes.status === 'fulfilled' && projectsRes.value) {
          const projs = projectsRes.value
          if (Array.isArray(projs) && projs.length > 0) {
            // Deduplicate incoming projects by creator handle / name / id, filtering out any corrupted phantom UUID projects
            const seen = new Set()
            const deduped = projs.filter(p => {
              if (isCorruptedPhantomProject(p)) return false
              const key = (p.creatorHandle || p.creatorName || p.creatorId || p.id || '').replace(/^@/, '').toLowerCase().trim()
              if (seen.has(key)) return false
              seen.add(key)
              return true
            })
            setAllProjects(deduped)
            const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
            const projIdParam = searchParams?.get('project')
            const creatorParam = searchParams?.get('creator') || searchParams?.get('creatorId')
            const cleanCreator = creatorParam ? creatorParam.replace(/^@/, '').toLowerCase().trim() : null

            setActiveProject(prev => {
              let matched = null
              // 1. Explicit project ID from URL
              if (projIdParam) {
                matched = projs.find(p => p.id === projIdParam)
              }
              // 2. Explicit creator from URL
              if (!matched && cleanCreator) {
                matched = projs.find(p =>
                  p.creatorId === creatorParam ||
                  (p.creatorHandle && p.creatorHandle.replace(/^@/, '').toLowerCase() === cleanCreator) ||
                  (p.creatorEmail && p.creatorEmail.toLowerCase() === cleanCreator)
                )
              }
              // 3. Fallback to active project in React state if already set
              if (!matched && prev) {
                matched = projs.find(p => p.id === prev.id || (p.creatorId && p.creatorId === prev.creatorId))
              }
              // 4. Default to most recently updated project
              if (!matched) {
                matched = projs[0]
              }

              if (!matched) return null

              // Safeguard against ghost UUID
              if (isCorruptedPhantomProject(matched)) return null
              // Deep merge DB project record with any transient in-memory state
              const resolvedKit = matched.campaignKit ||
                (matched.validationCampaign?.productAssets?.announcementPost ? matched.validationCampaign.productAssets : null) ||
                (prev?.id === matched.id ? prev.campaignKit : null) ||
                null

              const merged = {
                ...matched,
                campaignKit: resolvedKit,
                campaignLaunched: Boolean(matched.campaignLaunched || (prev?.id === matched.id && prev?.campaignLaunched) || resolvedKit),
                campaignAssetsGenerated: Boolean(matched.campaignAssetsGenerated || (prev?.id === matched.id && prev?.campaignAssetsGenerated) || resolvedKit),
                creatorTasks: (matched.creatorTasks?.length > 0)
                  ? matched.creatorTasks
                  : (prev?.id === matched.id && prev?.creatorTasks?.length > 0 ? prev.creatorTasks : []),
                surveyData: matched.surveyData || (prev?.id === matched.id ? prev?.surveyData : null) || null,
                validationPlan: matched.validationPlan || (prev?.id === matched.id ? prev?.validationPlan : null) || null,
                gateDecisions: (prev?.id === matched.id && (prev?.gateDecisions?.length || 0) > (matched.gateDecisions?.length || 0))
                  ? prev.gateDecisions
                  : (matched.gateDecisions || prev?.gateDecisions || []),
                projectFiles: (prev?.id === matched.id && (prev?.projectFiles?.length || 0) > 0) ? prev.projectFiles : (matched.projectFiles || []),
                messages: (prev?.id === matched.id && (prev?.messages?.length || 0) > 0) ? prev.messages : (matched.messages || []),
                mvpBuildPlan: (prev?.id === matched.id ? prev?.mvpBuildPlan : null) || matched.mvpBuildPlan,
                engineeringTasks: (matched.engineeringTasks?.length > 0) ? matched.engineeringTasks : (prev?.id === matched.id ? (prev?.engineeringTasks || []) : []),
                qaResults: (prev?.id === matched.id ? prev?.qaResults : null) || matched.qaResults,
                betaFeedback: (matched.betaFeedback?.length > 0) ? matched.betaFeedback : (prev?.id === matched.id ? (prev?.betaFeedback || []) : []),
                feedbackClusters: (matched.feedbackClusters?.length > 0) ? matched.feedbackClusters : (prev?.id === matched.id ? (prev?.feedbackClusters || []) : []),
                readinessReport: (prev?.id === matched.id ? prev?.readinessReport : null) || matched.readinessReport,
                appliedPatches: (matched.appliedPatches?.length > 0) ? matched.appliedPatches : (prev?.id === matched.id ? (prev?.appliedPatches || []) : []),
                mvpVersion: (prev?.id === matched.id ? prev?.mvpVersion : null) || matched.mvpVersion || 'v1.0.0-MVP'
              }
              return merged
            })
          } else {
            // DB returned 0 projects: Clear project state
            setAllProjects([])
            setActiveProject(null)
          }
        }
      } catch (err) {
        console.warn('Backend database sync error in CreatorLaunchLayout:', err)
      }
    }

    syncDbState()
    return () => {
      isMounted = false
    }
  }, [])

  // Provide a safe wrapper to update the active project state & sync to storage
  const handleUpdateProject = (updater) => {
    setActiveProject(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (!next) return next

      // Persist directly to MongoDB Atlas co_launch_projects via backend API
      if (next.id) {
        import('../../services/opsApi').then(({ updateCoLaunchProject }) => {
          updateCoLaunchProject(next.id, {
            currentPhase: next.currentPhase,
            currentStep: next.currentStep,
            status: next.status,
            productName: next.productName,
            productTagline: next.productTagline,
            pricing: next.pricing,
            presaleTarget: next.presaleTarget,
            campaignKit: next.campaignKit,
            campaign_kit: next.campaignKit,
            campaignLaunched: next.campaignLaunched,
            projectFiles: next.projectFiles || [],
            messages: next.messages || [],
            metadataInfo: {
              ...(next.metadataInfo || {}),
              campaign_kit: next.campaignKit || next.metadataInfo?.campaign_kit,
              campaign_launched: next.campaignLaunched,
              activity_logs: next.activityLogs || next.adminActivity || [],
              gate_decisions: next.gateDecisions || [],
              mvpBuildPlan: next.mvpBuildPlan,
              engineeringTasks: next.engineeringTasks,
              project_files: next.projectFiles || [],
              messages: next.messages || []
            }
          }).catch(err => console.warn('[CreatorLaunchLayout] updateCoLaunchProject error:', err))
        })
      }
      return next
    })
  }

  const handleUpdateActiveProject = handleUpdateProject

  const handleCreateProjectFromConcept = async (newProjData) => {
    const projId = `proj_${Date.now()}`
    const cleanHandle = String(newProjData.creatorHandle || newProjData.handle || '').replace(/^@/, '').trim().toLowerCase()
    let cachedVideos = []
    if (cleanHandle) {
      try {
        const raw = localStorage.getItem(`forge_creator_videos_${cleanHandle}`) || sessionStorage.getItem(`forge_creator_videos_${cleanHandle}`)
        if (raw) cachedVideos = JSON.parse(raw)
      } catch (e) { }
    }
    const resolvedPosts = (Array.isArray(newProjData.recentPosts) && newProjData.recentPosts.length > 0 ? newProjData.recentPosts : null) ||
      (Array.isArray(newProjData.videos) && newProjData.videos.length > 0 ? newProjData.videos : null) ||
      (Array.isArray(cachedVideos) && cachedVideos.length > 0 ? cachedVideos : null) ||
      []

    const feeToSet = (newProjData.diyFee !== undefined && newProjData.diyFee !== null)
      ? newProjData.diyFee
      : (newProjData.diyPassPrice !== undefined && newProjData.diyPassPrice !== null)
        ? newProjData.diyPassPrice
        : cobuilderPassPrice

    let seed = null
    if (newProjData.selectedConcept) {
      try {
        seed = buildValidationSeed(newProjData.selectedConcept, {
          followers: newProjData.followers || newProjData.followerCount || newProjData.follower_count,
        })
      } catch (err) {
        console.warn('[CreatorLaunchLayout] Error building validation seed:', err)
      }
    }

    const targetVal = newProjData.presaleTarget || seed?.suggestedThreshold?.target || 5000
    const targetOrders = seed?.suggestedThreshold?.buyers || Math.max(20, Math.round(targetVal / 100))
    const thresholdText = seed?.suggestedThreshold
      ? `$${targetVal.toLocaleString()} in presales (${targetOrders} founding orders) within 14 days`
      : `$${targetVal.toLocaleString()} in presales within 14 days`

    const cleanProject = {
      id: projId,
      createdAt: new Date().toISOString(),
      currentPhase: newProjData.currentPhase || 1,
      currentStep: 'plan',
      status: 'validating',
      diyFee: feeToSet,
      diyPassPrice: feeToSet,
      hasCustomFee: true,
      ...newProjData,
      recentPosts: resolvedPosts,
      videos: resolvedPosts,
      channelUrl: newProjData.channelUrl || (cleanHandle ? `https://www.youtube.com/@${cleanHandle}` : ''),
      channelDescription: newProjData.channelDescription || newProjData.creatorBio || '',
      // Frozen concept snapshot
      selectedConcept: newProjData.selectedConcept || null,
      conceptFrozen: Boolean(newProjData.selectedConcept),
      selectedConceptFrozenAt: seed?.frozenAt || new Date().toISOString(),
      audienceEvidence: seed?.evidence || newProjData.audienceEvidence || '',
      mvpDifficulty: seed?.estimatedBuild || newProjData.mvpDifficulty || '2 weeks',
      revenueModel: seed?.offer?.revenueModel || newProjData.revenueModel || 'Subscription · 50/50 revenue share',
      // Fresh metrics
      currentPresales: 0,
      presaleTarget: targetVal,
      visitors: 0,
      conversionRate: 0,
      reservations: [],
      experiments: [],
      validationPlan: {
        id: `plan_${projId}`,
        customer: seed?.customer || newProjData.customer || newProjData.targetAudience || '',
        problem: seed?.problem || newProjData.problem || '',
        offer: `${newProjData.productName || seed?.product?.name || 'Venture'} Founding Co-Launch Access: ${newProjData.productTagline || seed?.product?.tagline || ''}`,
        pricing: seed?.offer?.pricing || newProjData.pricing || '$29/mo Starter • $79/mo Pro',
        testMethod: '1) Co-founder video announcement, 2) 10 user interviews, 3) 48-hour Founding Pre-Order sprint',
        period: '14 days',
        threshold: thresholdText,
        targetRevenue: targetVal,
        targetOrders: targetOrders,
        status: 'ready',
        generated: true,
        locked: false,
      },
      // Clear all legacy specs from former creators so the new creator starts fresh
      mvpBuildPlan: null,
      engineeringTasks: null,
      betaFeedback: null,
      feedbackClusters: null,
      readinessReport: null,
      campaignKit: null,
      surveyData: null,
      surveyResponses: [],
      launchStrategy: null,
      creatorAssets: null,
      launchTelemetry: null,
    }
    setActiveProject(cleanProject)
    setAllProjects(prev => [cleanProject, ...prev.filter(p => p.id !== cleanProject.id)])
    try {
      setExpiringItem('forge_launch_active_project', cleanProject, ONE_HOUR_MS)
      localStorage.removeItem('forge_launch_active_section')
      const url = new URL(window.location.href)
      url.searchParams.set('section', 'section2')
      url.searchParams.set('project', cleanProject.id)
      if (cleanProject.creatorId) url.searchParams.set('creator', cleanProject.creatorId)
      window.history.replaceState({}, '', url.toString())
    } catch (e) { }
    setActiveSection('section2')

    // Persist to backend database tables in SQLite
    try {
      const dbProj = await createCoLaunchProject({
        diyFee: feeToSet,
        diyPassPrice: feeToSet,
        hasCustomFee: true,
        ...newProjData,
        id: projId,
        portalLinkSent: true,
        skipCreatorEmail: true
      })
      if (dbProj && dbProj.id) {
        setActiveProject(prev => {
          const merged = { ...(prev || {}), ...dbProj }
          return merged
        })
        setAllProjects(prev => [dbProj, ...prev.filter(p => p.id !== dbProj.id)])
      }
    } catch (err) {
      console.warn('[CreatorLaunchLayout] Project DB sync warning:', err)
    }
  }

  const handleCreateDemoProject = () => {
    handleCreateProjectFromConcept({
      creatorId: 'demo_creator_1',
      creatorName: 'TechLead Co-Launch',
      creatorHandle: '@TechLead',
      creatorEmail: 'creator@example.com',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      niche: 'Software & SaaS',
      productName: 'FlowForge DevOS',
      productTagline: 'AI-assisted developer workflow orchestrator and release pipeline.',
      targetAudience: 'Software engineers, founders, indie hackers',
      customer: 'Senior Developers & Technical Founders',
      problem: 'Managing fragmented CI/CD, deployment keys, and pull request testing wastes 10+ hours per sprint.',
      pricing: '$49/mo per seat',
      presaleTarget: 12500,
      currentPhase: 1,
    })
  }

  const handleResetProject = async () => {
    try {
      localStorage.removeItem('forge_launch_active_project')
      localStorage.removeItem('forge_launch_discovered_creators')
      localStorage.removeItem('forge_launch_real_threads')
      localStorage.removeItem('forge_launch_pitch_sent_map')
      localStorage.removeItem('forge_launch_answer_sent_map')
      localStorage.removeItem('forge_launch_persuasion_sent_map')
      localStorage.removeItem('forge_launch_ai_choice_map')
      localStorage.removeItem('forge_creator_data')
      localStorage.removeItem('forge_step2_timer_target')
      localStorage.removeItem('forge_launch_active_section')
      removeExpiringItem('forge_launch_active_project')
      removeExpiringItem('forge_launch_active_step')
      removeExpiringItem('forge_launch_acquisition_step')

      const { deleteAllCreators, deleteCoLaunchProject } = await import('../../services/opsApi')
      if (activeProject?.id) {
        await deleteCoLaunchProject(activeProject.id).catch(() => { })
      }
      await deleteAllCreators().catch(() => { })
    } catch (e) {
      console.warn('Reset project and acquisition error:', e)
    }

    setActiveProject(null)
    setActiveSection('section1')
    window.location.href = '/launch'
  }

  const getSafeDiscoveredCreators = () => {
    return Array.isArray(crmCreators) ? crmCreators : [];
  };

  const getSafeRealThreads = () => {
    try {
      const list = getExpiringItem('forge_launch_real_threads');
      if (Array.isArray(list) && list.length > 0) return list;
      const raw = localStorage.getItem('forge_launch_real_threads');
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) return p;
        if (p && Array.isArray(p.data)) return p.data;
        if (p && Array.isArray(p.threads)) return p.threads;
      }
      return Array.isArray(crmThreads) ? crmThreads : [];
    } catch {
      return Array.isArray(crmThreads) ? crmThreads : [];
    }
  };

  const getSafeSentMap = (storageKey) => {
    try {
      const raw = localStorage.getItem(storageKey) || '{}';
      const parsed = JSON.parse(raw);
      if (parsed && parsed.__expiring && parsed.data) return parsed.data;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#FAFAFA] font-sans flex flex-col overflow-x-clip w-full max-w-[100vw] relative">
      {/* Canvas: true black with a restrained crimson aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full bg-[#C81E3C]/[0.09] blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-[#FF4D6D]/[0.04] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
          }}
        />
      </div>

      {/* Shallow Asymmetrical Polygons (Strictly BEHIND the cards - z-0, pointer-events-none) */}
      {activeSection !== 'section1' && (
        <div className="absolute top-14 inset-x-0 h-[920px] pointer-events-none overflow-hidden select-none z-0 opacity-20" aria-hidden="true">
          <HeroShallowPolygons className="z-0" />
        </div>
      )}

      {/* 30% Secondary Header Navbar */}
      <header className="h-14 border-b border-[#1C1C20] bg-[#050506]/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C81E3C]/50 to-transparent pointer-events-none" aria-hidden="true" />
        {/* Workspace Switching Progress Bar */}
        {isSwitchingCreator && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] z-50 overflow-hidden bg-[#222227]">
            <div className="h-full bg-gradient-to-r from-transparent via-[#C81E3C] to-transparent animate-pulse w-full" />
          </div>
        )}

        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => (window.location.href = '/')}
          >
            <CoLaunchLogo size={28} showWordmark={true} theme="dark" />
            <div className="hidden xl:flex items-center">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg bg-[#141417] text-[#A1A1AA] border border-[#222227]">
                OPERATOR STUDIO
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-[#222227] hidden md:block" />

          {/* Clean Suite Navigation Tabs (Tablet & Desktop) */}
          <div id="tour-header-nav" className="hidden md:flex items-center gap-0.5 p-1 rounded-xl bg-[#0C0C0E] border border-[#222227]">
            <button
              id="tour-nav-acquisition"
              onClick={() => {
                setActiveSection('section1')
                try {
                  const url = new URL(window.location.href)
                  url.searchParams.set('section', 'section1')
                  window.history.replaceState({}, '', url.toString())
                  import('../../services/opsApi').then(({ updateWorkflowState }) => {
                    updateWorkflowState({ active_section: 'section1' }).catch(() => { })
                  })
                } catch { }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeSection === 'section1'
                  ? 'acq-btn-primary text-white'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#141417] border-transparent'
                }`}
            >
              <Target className={`w-3.5 h-3.5 ${activeSection === 'section1' ? 'text-white' : 'text-[#A1A1AA]'}`} />
              <span className={activeSection === 'section1' ? 'text-white font-bold' : ''}>Acquisition OS</span>
            </button>
            <a
              id="tour-nav-project-os"
              href={activeProject?.id ? `/project-os?project=${activeProject.id}` : '/project-os'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-[#A1A1AA] hover:text-white hover:bg-[#141417] border border-transparent"
              title="Open Dedicated Co-Launch Operations Center"
            >
              <Layers className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Project OS</span>
              <ExternalLink className="w-3 h-3 text-[#71717A]" />
            </a>
            <a
              id="tour-nav-participation"
              href="/participation-manager"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-[#A1A1AA] hover:text-white hover:bg-[#141417] border border-transparent"
              title="Dedicated Creator Participation & Co-Builder Console"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="flex items-center gap-1">
                Co-Builders (
                {isPassPriceLoading ? (
                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin inline-block" />
                ) : (
                  `$${cobuilderPassPrice || 0}`
                )}
                )
              </span>
              <ExternalLink className="w-3 h-3 text-[#71717A]" />
            </a>
          </div>

          {/* Active Partner Switcher Dropdown (When in Section 2, Tablet & Desktop) */}
          {activeSection === 'section2' && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setShowPartnerMenu(!showPartnerMenu)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0C0C0E] hover:bg-[#141417] border border-[#222227] text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                title="Switch Co-Launch Partner"
              >
                <div className="w-5 h-5 rounded-lg overflow-hidden bg-[#141417] border border-[#222227] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {isSwitchingCreator ? (
                    <Loader2 className="w-3 h-3 text-[#C81E3C] animate-spin" />
                  ) : activeProject?.creatorAvatar ? (
                    <img src={activeProject.creatorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (activeProject?.creatorName || activeProject?.creatorHandle || 'P').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-bold text-white truncate max-w-[130px]">
                    {isSwitchingCreator ? `Switching...` : (activeProject?.creatorName || activeProject?.creatorHandle || 'Select Partner')}
                  </span>
                  <span className="text-[9px] text-[#C81E3C] font-mono truncate max-w-[130px]">
                    {isSwitchingCreator ? (switchingTarget?.name || 'Loading') : `${activeProject?.productName || 'Project'} • P${activeProject?.currentPhase || 1}`}
                  </span>
                </div>
                {isSwitchingCreator ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C81E3C] animate-spin shrink-0" />
                ) : (
                  <ChevronDown className={`w-3.5 h-3.5 text-[#A1A1AA] shrink-0 transition-transform ${showPartnerMenu ? 'rotate-180' : ''}`} />
                )}
              </button>

              {showPartnerMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPartnerMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 rounded-lg bg-[#0C0C0E] border border-[#222227] shadow-2xl p-2 z-50 space-y-1 animate-in fade-in">
                    <div className="px-3 py-2 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between border-b border-[#222227]">
                      <span>Co-Launch Partners ({(() => {
                        const seen = new Set()
                        return (allProjects || []).filter(p => {
                          const k = (p.creatorHandle || p.creatorName || p.creatorId || p.id || '').replace(/^@/, '').toLowerCase().trim()
                          if (seen.has(k)) return false
                          seen.add(k)
                          return true
                        }).length
                      })()})</span>
                      <span className="text-[#C81E3C] font-mono font-bold">Section 2</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {(() => {
                        const seen = new Set()
                        const uniqueProjects = (allProjects || []).filter(p => {
                          const k = (p.creatorHandle || p.creatorName || p.creatorId || p.id || '').replace(/^@/, '').toLowerCase().trim()
                          if (seen.has(k)) return false
                          seen.add(k)
                          return true
                        })
                        return uniqueProjects.map((p) => {
                          const isCur = p.id === activeProject?.id;
                          const isThisSwitching = isSwitchingCreator && (switchingTarget?.id === p.id || switchingTarget?.id === p.creatorId);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                handleSwitchToCreatorProject(p);
                                setShowPartnerMenu(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${isCur
                                ? 'bg-[#141417] border border-[#C81E3C] text-white font-semibold'
                                : 'hover:bg-[#141417] text-[#A1A1AA] hover:text-white border border-transparent'
                                }`}
                            >
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#1C1C20] shrink-0 flex items-center justify-center text-xs font-bold text-white">
                                {p.creatorAvatar ? (
                                  <img src={p.creatorAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  (p.creatorName || p.creatorHandle || 'P').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate text-white">
                                  {p.creatorName || p.creatorHandle}
                                </div>
                                <div className="text-[10px] text-[#A1A1AA] truncate">
                                  {p.productName} • <span className="text-[#C81E3C] font-mono">Phase {p.currentPhase || 1}</span>
                                </div>
                              </div>
                              {isThisSwitching ? (
                                <Loader2 className="w-3.5 h-3.5 text-[#C81E3C] animate-spin shrink-0" />
                              ) : isCur ? (
                                <Check className="w-3.5 h-3.5 text-[#C81E3C] shrink-0" />
                              ) : null}
                            </button>
                          );
                        })
                      })()}
                    </div>
                    <div className="pt-1 border-t border-[#222227]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPartnerMenu(false);
                          setActiveSection('section1');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#FF4D6D] hover:bg-[#141417] transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Launch Another Creator (Section 1)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions & User Profile (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {/* Driver.js Interactive Workflow Tour Trigger — 10% Accent CTA Button */}
          <button
            type="button"
            onClick={() => startSection1Tour(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap bg-[#C81E3C] hover:bg-[#B01732] active:bg-[#99142B] text-white transition-all cursor-pointer shadow-md"
            title="Start Interactive Guided Walkthrough (Driver.js)"
          >
            <Sparkles className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <span className="text-white font-bold">Workflow Tour</span>
          </button>

          {/* Creator Follow-Up CRM Button */}
          <button
            id="tour-nav-crm"
            type="button"
            onClick={() => window.open('/follow-up-crm', '_blank')}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#0C0C0E] hover:bg-[#141417] text-[#E4E4E7] hover:text-white border border-[#222227] transition-all cursor-pointer shadow-2xs"
            title="Open Creator Outreach & Follow-Up CRM in a new tab (/follow-up-crm)"
          >
            <Users className="w-3.5 h-3.5 text-[#A1A1AA] flex-shrink-0" />
            <span>Follow-Up CRM</span>
            <ExternalLink className="w-3 h-3 text-[#71717A]" />
          </button>

          {/* Admin Pipeline & Exception Lookup Button */}
          <button
            id="tour-nav-admin"
            type="button"
            onClick={() => window.open('/admin-error-log', '_blank')}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#0C0C0E] hover:bg-[#141417] text-[#FF4D6D] border border-[#222227] hover:border-[#C81E3C]/40 transition-all cursor-pointer shadow-2xs"
            title="Open Admin Pipeline Oversight & Error Log in a new tab (/admin-error-log)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#C81E3C] flex-shrink-0" />
            <span>Admin Error Log</span>
            <ExternalLink className="w-3 h-3 text-[#FF4D6D]/70" />
          </button>

          {/* Individual User Logout Button */}
          <button
            onClick={handleLogout}
            title={`Logout ${userDisplayName}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#A1A1AA] hover:text-white px-2.5 h-8 rounded-lg bg-[#0C0C0E] hover:bg-[#141417] border border-[#222227] transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 text-[#71717A] hover:text-white" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile & Small Screen Header Controls (< md) */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
          {activeSection === 'section1' && (
            <button
              type="button"
              onClick={() => setShowSection1Sidebar(!showSection1Sidebar)}
              className="flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0C0C0E] border border-[#2a2a30] text-xs font-semibold text-[#FAFAFA] shadow-2xs"
              title="Open Section 1 Steps Sidebar"
            >
              <Target className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-[11px] font-bold">Step {section1ActiveStep}</span>
              <ChevronDown className="w-3 h-3 text-[#71717A]" />
            </button>
          )}

          {activeSection === 'section2' && (
            <button
              type="button"
              onClick={() => setShowPartnerMenu(!showPartnerMenu)}
              className="flex sm:hidden items-center gap-1 px-2 py-1 rounded-lg bg-[#0C0C0E] border border-[#2a2a30] text-xs font-semibold text-[#FAFAFA] shadow-2xs"
              title="Switch Partner"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-[#18181C] border border-[#2a2a30] flex items-center justify-center text-[10px] font-bold text-[#E4E4E7]">
                {(activeProject?.creatorName || activeProject?.creatorHandle || 'P').charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-3 h-3 text-[#71717A]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 rounded-lg bg-[#0C0C0E] hover:bg-[#141417] border border-[#222227] text-white transition-colors cursor-pointer shadow-sm"
            aria-label="Toggle Mobile Menu"
          >
            {mobileDrawerOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-[#A1A1AA]" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Slide-Down Menu (< md) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-[#050506]/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0C0C0E] border-b border-[#222227] p-4 space-y-4 max-h-[calc(100dvh-3.5rem)] overflow-y-auto shadow-2xl">
            {/* Mobile Section Switcher */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">Studio Pipeline Sections</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setActiveSection('section1')
                    setMobileDrawerOpen(false)
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${activeSection === 'section1'
                    ? 'bg-[#C81E3C] text-white shadow-sm'
                    : 'bg-[#141417] text-[#A1A1AA] border border-[#222227]'
                    }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Section 1: Acquisition</span>
                </button>
                <a
                  href={activeProject?.id ? `/project-os?project=${activeProject.id}` : '/project-os'}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all bg-[#141417] hover:bg-[#1C1C20] text-[#A1A1AA] hover:text-white border border-[#222227]"
                  title="Open Dedicated Co-Launch Operations Center"
                >
                  <Layers className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Project OS</span>
                  <ExternalLink className="w-3 h-3 text-[#71717A]" />
                </a>
              </div>
            </div>

            {/* Quick Access Tools */}
            <div className="space-y-1.5 pt-2 border-t border-[#222227]">
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">Studio Tools & Portals</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.open('/participation-manager', '_blank')
                    setMobileDrawerOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#141417] hover:bg-[#1C1C20] text-amber-400 border border-[#222227] text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="flex items-center gap-1">
                      Co-Builder Passes (
                      {isPassPriceLoading ? (
                        <Loader2 className="w-3 h-3 text-amber-400 animate-spin inline-block" />
                      ) : (
                        `$${cobuilderPassPrice || 0}`
                      )}
                      )
                    </span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-amber-500/70" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.open('/follow-up-crm', '_blank')
                    setMobileDrawerOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#141417] hover:bg-[#1C1C20] text-white border border-[#222227] text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C81E3C]" />
                    <span>Creator Follow-Up CRM</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#71717A]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.open('/admin-error-log', '_blank')
                    setMobileDrawerOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#141417] hover:bg-[#1C1C20] text-[#FF4D6D] border border-[#222227] text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#C81E3C]" />
                    <span>Admin Pipeline Error Log</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#FF4D6D]/70" />
                </button>
              </div>
            </div>

            {/* Session Footer */}
            <div className="pt-2 border-t border-[#222227] flex items-center justify-end">
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-lg bg-[#141417] text-[#FF4D6D] hover:bg-[#1C1C20] text-xs font-semibold border border-[#222227] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Section 1 Sidebar Drawer */}
      {showSection1Sidebar && (
        <div className="fixed inset-0 z-50 bg-[#050506]/80 backdrop-blur-md animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowSection1Sidebar(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0C0C0E] border-r border-[#222227] shadow-2xl z-50 flex flex-col justify-between p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222227]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#141417] border border-[#222227] flex items-center justify-center text-white">
                    <Target className="w-4 h-4 text-[#C81E3C]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Section 1 Engine</h3>
                    <p className="text-[10px] text-[#C81E3C] font-mono">6-Step Funnel Pipeline</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSection1Sidebar(false)}
                  className="p-1.5 rounded-lg bg-[#141417] hover:bg-[#1C1C20] text-[#A1A1AA] hover:text-white border border-[#222227] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A1A1AA] block px-1">
                  Pipeline Steps
                </span>
                {SECTION1_STEPS.map((s) => {
                  const Icon = s.icon
                  const isCur = section1ActiveStep === s.step
                  let isDone = s.step < section1ActiveStep
                  try {
                    const saved = JSON.parse(localStorage.getItem('forge_acquisition_completed_steps') || '[]')
                    if (saved.includes(s.step)) isDone = true
                  } catch (e) { }
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        setSection1ActiveStep(s.step)
                        setAcquisitionNavState({ step: s.step, nonce: Date.now() })
                        setShowSection1Sidebar(false)
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all cursor-pointer ${isCur
                          ? 'bg-[#C81E3C] text-white shadow-sm border border-transparent font-semibold'
                          : isDone
                            ? 'bg-[#141417] hover:bg-[#1C1C20] text-white border border-[#222227]'
                            : 'bg-[#0C0C0E] hover:bg-[#141417] text-[#A1A1AA] hover:text-white border border-[#222227]'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${isCur ? 'bg-white/20 text-white' : isDone ? 'bg-[#141417] text-[#C81E3C]' : 'bg-[#141417] text-[#A1A1AA]'
                        }`}>
                        {isDone && !isCur ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5">
                          <span className={isCur ? 'text-white' : 'text-[#FAFAFA]'}>{s.label}</span>
                          {isDone && !isCur && (
                            <span className="text-[9px] font-semibold text-[#FF4D6D] bg-[#C81E3C]/20 border border-[#C81E3C]/30 px-1 py-0.5 rounded-lg leading-none">
                              Done
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] leading-tight mt-0.5 ${isCur ? 'text-white/80 font-medium' : 'text-[#A1A1AA]'}`}>
                          {s.desc}
                        </div>
                      </div>
                      {isCur ? (
                        <span className="w-2 h-2 rounded-full bg-[#0C0C0E] mt-1.5 shrink-0" />
                      ) : isDone ? (
                        <span className="w-4 h-4 rounded-lg bg-[#C81E3C] text-white flex items-center justify-center mt-1 shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#222227] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowSection1Sidebar(false)
                  setActiveSection('section2')
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-[#C81E3C] hover:bg-[#B01732] active:bg-[#99142B] text-white border border-transparent text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold">Switch to Section 2: Project OS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-2.5 sm:px-5 py-4 space-y-5 overflow-x-clip min-w-0 relative z-10">
        {/* Mobile Section Switcher */}
        <div className="flex md:hidden items-center p-1 rounded-lg bg-[#050506] border border-[#222227] gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('section1')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${activeSection === 'section1' ? 'bg-[#C81E3C] text-white border-transparent shadow-xs font-bold' : 'text-[#A1A1AA]'
              }`}
          >
            <Target className={`w-3.5 h-3.5 ${activeSection === 'section1' ? 'text-white' : 'text-[#A1A1AA]'}`} />
            <span className={activeSection === 'section1' ? 'text-white' : ''}>Acquisition</span>
          </button>
          <a
            href={activeProject?.id ? `/project-os?project=${activeProject.id}` : '/project-os'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold whitespace-nowrap text-[#A1A1AA] hover:text-white transition-all"
            title="Open Dedicated Co-Launch Operations Center"
          >
            <Layers className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Project OS</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#71717A]" />
          </a>
          <a
            href="/participation-manager"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold whitespace-nowrap text-[#A1A1AA] hover:text-white transition-all"
            title="Dedicated Creator Participation & Co-Builder Console"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Co-Builders</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#71717A]" />
          </a>
        </div>


        {/* Section 1 or Section 2 Container */}
        {activeSection === 'section1' ? (
          <AcquisitionEngine
            initialCreators={Array.isArray(crmCreators) ? crmCreators : initialCreators}
            allProjects={allProjects}
            api={api}
            onCreateProject={handleCreateProjectFromConcept}
            onGoToProjectOS={(creatorOrId) => handleSwitchToCreatorProject(creatorOrId)}
            onResetAll={() => {
              setActiveProject(null)
              setAllProjects([])
              setActiveSection('section1')
              try {
                removeExpiringItem('forge_launch_active_project')
                localStorage.removeItem('forge_launch_active_section')
                window.history.replaceState({}, '', '/launch')
              } catch (e) { }
            }}
            initialActiveStep={acquisitionNavState?.step}
            initialSelectedCreatorId={acquisitionNavState?.creatorId}
            initialNavNonce={acquisitionNavState?.nonce}
            onActiveStepChange={(step) => setSection1ActiveStep(step)}
          />
        ) : isSwitchingCreator ? (
          <div className="space-y-6 w-full max-w-full animate-fade-in">
            {/* Minimalist Linear-style workspace switching indicator */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0C0C0E] border border-[#2a2a30] text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-3.5 h-3.5 text-emerald-300 animate-spin flex-shrink-0" />
                <span className="text-[#A1A1AA]">
                  Switching workspace to <span className="text-[#FAFAFA] font-semibold">{switchingTarget?.name || 'Partner'}</span>
                </span>
                <span className="text-[#D4D4D8]">•</span>
                <span className="text-[#A1A1AA] font-mono text-[11px] truncate max-w-[240px]">
                  {switchingTarget?.productName || 'Project OS'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#A1A1AA]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Syncing Workspace</span>
              </div>
            </div>

            {/* Native Project OS Skeleton */}
            <ProjectOSSkeleton />
          </div>
        ) : activeProject ? (
          <ProjectOS
            key={activeProject.id}
            project={activeProject}
            api={api}
            onUpdateProject={handleUpdateActiveProject}
            onGoToAcquisition={() => setActiveSection('section1')}
            onResetProject={handleResetProject}
            userRole="admin"
            isDIY={Boolean(activeProject?.isDIY || activeProject?.diySubscription?.active)}
          />
        ) : (
          <div className="p-10 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 text-center space-y-5 max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#18181C] border border-[#2a2a30] flex items-center justify-center mx-auto text-[#FAFAFA]">
              <Layers className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-[#FAFAFA] font-display">No Active Co-Launch Project</h2>
              <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-md mx-auto">
                You haven't partnered with a creator yet. Qualify and pitch a lead in Section 1 to launch a live project, or initialize a demo venture below.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('section1')}
                className="px-4 py-2 rounded-xl bg-[#0C0C0E] hover:bg-[#111114] text-[#D4D4D8] font-semibold text-xs border border-[#2a2a30] transition-colors cursor-pointer shadow-2xs"
              >
                Go to Section 1: Acquisition
              </button>
              <button
                type="button"
                onClick={handleCreateDemoProject}
                className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F0F12] hover:bg-[#222227] text-white font-medium text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                <span>Initialize Demo Venture</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a30]/80 py-4 text-center text-xs text-[#A1A1AA] bg-[#0C0C0E]">
        <p>CoLaunch Launch Engine OS &copy; {new Date().getFullYear()}</p>
      </footer>

      {/* Admin Pipeline Oversight & Error Lookup Modal */}
      <AdminPipelineLookup
        isOpen={showAdminLookup}
        onClose={() => setShowAdminLookup(false)}
        creators={getSafeDiscoveredCreators()}
        realThreads={getSafeRealThreads()}
        pitchSentMap={getSafeSentMap('forge_launch_pitch_sent_map')}
        answerSentMap={getSafeSentMap('forge_launch_answer_sent_map')}
        persuasionSentMap={getSafeSentMap('forge_launch_persuasion_sent_map')}
        onSelectCreator={(cid) => {
          setShowAdminLookup(false)
          setActiveSection('section1')
        }}
        onForceLaunchProject={handleCreateProjectFromConcept}
      />

      {/* Creator Follow-Up & Reply Status CRM Directory Modal */}
      {showFollowUpCRM && (
        <CreatorFollowUpCRM
          isOpen={showFollowUpCRM}
          onClose={() => setShowFollowUpCRM(false)}
          creators={getSafeDiscoveredCreators()}
          realThreads={getSafeRealThreads()}
          projects={allProjects}
          pitchSentMap={getSafeSentMap('forge_launch_pitch_sent_map')}
          onSelectCreator={(cid, targetStep) => {
            setShowFollowUpCRM(false)
            if (targetStep === 'section2' || targetStep === 7) {
              handleSwitchToCreatorProject(cid)
            } else {
              setActiveSection('section1')
              const stepNum = Number(targetStep) || 5
              setAcquisitionNavState({ step: stepNum, creatorId: cid, nonce: Date.now() })
              try {
                const url = new URL(window.location.href)
                url.searchParams.set('section', 'section1')
                url.searchParams.set('step', String(stepNum))
                if (cid) url.searchParams.set('creator', cid)
                window.history.replaceState({}, '', url.toString())
              } catch (e) { }
            }
          }}
          onDeleteCreator={() => {
            fetchCrmData()
          }}
        />
      )}
    </div>
  )
}
