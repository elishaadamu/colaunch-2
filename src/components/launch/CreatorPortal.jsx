import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Rocket, CheckCircle2, DollarSign, Copy, Check, Video, MessageSquare,
  Users, ExternalLink, Globe, Sparkles, AlertCircle, ShieldCheck, ArrowRight,
  TrendingUp, Award, Calendar, CheckSquare, Eye, Smartphone, Send, FileText,
  CheckCheck, Loader2, MessageCircle, Zap, Lock, Layers, Cpu, Laptop, CreditCard,
  Plus, RotateCcw, Share2, HelpCircle, Menu, X, Star
} from 'lucide-react'
import { getFrontendUrl, updateCoLaunchProject, getCoLaunchProject, getThreads, getWorkflowState } from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'
import { CreatorPortalSkeleton } from './Section2Skeletons'
import { deduplicateAndSortMessages } from './CreatorWhatsAppChat'
import ProjectOS from './ProjectOS'
import DIYSubscriptionModal from './DIYSubscriptionModal'
import CoLaunchLogo from '../ui/CoLaunchLogo'
import PostVisualMockup from './PostVisualMockup'
import { getPhase1StepGuards, getPhase2StepGuards, getPhase3StepGuards } from '../../utils/stepGuards'
import { parseMainPricingAmount, parseConceptPricing } from '../../utils/pricing'
import { startCreatorPortalPrePaymentTour, startCreatorPortalPostPaymentTour } from '../../utils/driverTour'
import { RETRO_GAMING_PROJECT } from './ProjectOSPage'

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
  crimsonSoft: 'rgba(200,30,60,0.14)',
  crimsonLine: 'rgba(200,30,60,0.42)',
  crimsonText: '#ff8fa3',
  ok: '#6fcf9b',
  okSoft: 'rgba(111,207,155,0.12)',
  okLine: 'rgba(111,207,155,0.36)',
  sky: '#7dd3fc',
  skySoft: 'rgba(56,189,248,0.12)',
  skyLine: 'rgba(56,189,248,0.36)',
  violet: '#c4b5fd',
  violetSoft: 'rgba(167,139,250,0.12)',
  violetLine: 'rgba(167,139,250,0.36)',
  warn: '#f0b46a',
  warnSoft: 'rgba(240,180,106,0.12)',
  warnLine: 'rgba(240,180,106,0.36)',
}

const HEADING_FONT = "'Instrument Serif', Georgia, serif"

const PORTAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
.cp-root {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.cp-root .serif {
  font-family: 'Instrument Serif', Georgia, serif;
  font-weight: 400;
  letter-spacing: -0.015em;
}
.cp-root .font-mono {
  font-family: 'JetBrains Mono', monospace;
}
.cp-root .cp-btn-primary {
  background: ${C.crimson};
  color: #ffffff;
  border: 1px solid ${C.crimsonLine};
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 10px rgba(200, 30, 60, 0.25);
}
.cp-root .cp-btn-primary:hover:not(:disabled) {
  background: ${C.crimsonHover};
  box-shadow: 0 4px 20px rgba(200, 30, 60, 0.4);
  transform: translateY(-1px);
}
.cp-root .cp-btn-primary:active:not(:disabled) {
  transform: translateY(0);
}
.cp-root .cp-btn-quiet {
  background: ${C.raised};
  color: ${C.body};
  border: 1px solid ${C.lineStrong};
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.cp-root .cp-btn-quiet:hover:not(:disabled) {
  color: ${C.text};
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}
.cp-root .cp-btn-quiet:active:not(:disabled) {
  transform: translateY(0);
}
`

export default function CreatorPortal({ portalId, slug }) {
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState('interactive') // 'interactive' | 'managed'
  const [trackChoiceDismissed, setTrackChoiceDismissed] = useState(false)
  const [toast, setToast] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)
  const [showDiyModal, setShowDiyModal] = useState(false)
  const [viewDraftTask, setViewDraftTask] = useState(null)
  const [portalDraftViewMode, setPortalDraftViewMode] = useState('visual') // 'visual' | 'text'
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [creatorReplyText, setCreatorReplyText] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [section1Threads, setSection1Threads] = useState([])
  const [creatorAvatar, setCreatorAvatar] = useState(null)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const chatMessagesEndRef = useRef(null)

  const productName = project?.productName || project?.name || 'Software Co-Launch'
  const creatorName = project?.creatorName || 'Creator Partner'
  const ventureSlug = (productName || 'venture').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Resolve creator avatar from project or creator lookup
  useEffect(() => {
    let isMounted = true
    const resolveAvatar = async () => {
      const direct = project?.creatorAvatar || project?.creator_avatar || project?.avatar || project?.avatar_url
      if (direct) {
        setCreatorAvatar(direct)
        return
      }
      if (project?.creatorId || project?.creatorHandle) {
        try {
          const { getCreators } = await import('../../services/opsApi')
          const allCreators = await getCreators()
          if (isMounted && Array.isArray(allCreators)) {
            const cId = project?.creatorId
            const cHandle = (project?.creatorHandle || '').toLowerCase().replace(/^@/, '').trim()
            const match = allCreators.find(c =>
              (cId && String(c.id) === String(cId)) ||
              (cHandle && (c.handle || '').toLowerCase().replace(/^@/, '').trim() === cHandle)
            )
            if (match?.avatar_url || match?.avatar) {
              setCreatorAvatar(match.avatar_url || match.avatar)
            }
          }
        } catch (e) {
          console.warn('[CreatorPortal] Avatar resolution error:', e)
        }
      }
    }
    resolveAvatar()
    return () => { isMounted = false }
  }, [project?.creatorAvatar, project?.creator_avatar, project?.avatar, project?.avatar_url, project?.creatorId, project?.creatorHandle])

  useEffect(() => {
    updatePageSEO({
      title: project?.creatorName ? `${project.creatorName} — Partner Co-Founder Portal | CoLaunch` : "Partner Co-Founder Portal — CoLaunch",
      description: "Review your tailored software concepts, 50/50 revenue split dashboard, and launch roadmap with CoLaunch Studio.",
      image: "/og-image.svg"
    });
  }, [project?.creatorName]);

  // Fetch project from backend API on mount or when URL params/portalId changes
  useEffect(() => {
    let isMounted = true
    const fetchProject = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const targetId = portalId || slug || params.get('project') || params.get('id') || params.get('creator')
        const { getCoLaunchProject, getCoLaunchProjects } = await import('../../services/opsApi')

        let fetched = null
        if (targetId && (targetId === 'retrogaming' || targetId === 'retro' || targetId === 'proj_retrovault_gaming' || targetId === 'c_retro_gaming')) {
          fetched = RETRO_GAMING_PROJECT
        } else if (targetId && targetId !== 'portal') {
          try {
            fetched = await getCoLaunchProject(targetId)
          } catch (e) {
            console.warn('[CreatorPortal] Specific project fetch failed:', e)
          }
        }

        if (!fetched) {
          try {
            const all = await getCoLaunchProjects()
            if (Array.isArray(all) && all.length > 0) {
              fetched = all.find(p => p.id === targetId || p.creatorHandle === targetId || p.creatorId === targetId) || all[0]
            }
          } catch (e) {
            console.warn('[CreatorPortal] All projects fetch failed:', e)
          }
        }

        if (!fetched) {
          fetched = RETRO_GAMING_PROJECT
        }

        if (isMounted && fetched) {
          setProject(fetched)
        }
      } catch (err) {
        console.warn('[CreatorPortal] Failed to sync project from API:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProject()
    return () => {
      isMounted = false
    }
  }, [portalId])

  useEffect(() => {
    const handleSync = (e) => {
      try {
        const updated = (e?.detail && typeof e.detail === 'object') ? e.detail : null
        if (updated) {
          setProject(updated)
          if (updated.isDIY || updated.diySubscription?.active || updated.diyOfferStatus === 'accepted') {
            setTrackChoiceDismissed(true)
          }
        }
      } catch (e) {}
    }
    const handleViewChange = (e) => {
      try {
        if (e?.detail && typeof e.detail === 'string') {
          setActiveMainView(e.detail)
          setTrackChoiceDismissed(true)
        }
      } catch (e) {}
    }
    window.addEventListener('forge_project_updated', handleSync)
    window.addEventListener('forge_view_change', handleViewChange)
    return () => {
      window.removeEventListener('forge_project_updated', handleSync)
      window.removeEventListener('forge_view_change', handleViewChange)
    }
  }, [])

  const [activeMainView, setActiveMainView] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const v = sp.get('view')
      if (v === 'launch_kit') return 'launch_kit'
      if (v === 'projectos' || v === 'pipeline' || v === 'diy') {
        return 'projectos'
      }
      const isPaidParam = sp.get('token') === 'cf_diy_paid' || sp.get('paid') === 'true'
      if (isPaidParam) {
        return 'projectos'
      }
    }
    return 'projectos'
  })

  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'scripts' | 'presales' | 'messages' | 'strategy'
  const [activeScriptTab, setActiveScriptTab] = useState('post') // 'post' | 'video' | 'dm'

  // Single authoritative source of truth: Database project state
  const isDiyFromDb = Boolean(
    project?.isDIY ||
    project?.diySubscription?.active ||
    project?.diyOfferStatus === 'accepted' ||
    project?.diyOfferStatus === 'paid'
  )

  const urlToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null
  const urlPaidParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('paid') : null
  const isExplicitUrlPaid = urlToken === 'cf_diy_paid' || urlPaidParam === 'true'

  // The database is the ONLY source of truth for payment status. No localStorage mocking!
  const isDiyActive = Boolean(isDiyFromDb || isExplicitUrlPaid)



  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Purge all legacy localStorage test flags to ensure DB is the sole source of truth
      try {
        if (project?.id) localStorage.removeItem(`forge_diy_paid_${project.id}`)
        if (project?.creatorHandle) localStorage.removeItem(`forge_diy_paid_${project.creatorHandle.replace(/^@/, '').toLowerCase()}`)
        if (portalId) localStorage.removeItem(`forge_diy_paid_${portalId}`)
        localStorage.removeItem('forge_diy_paid')
      } catch (e) {}
    }
  }, [project?.id, project?.creatorHandle, portalId])

  const [defaultPassPrice, setDefaultPassPrice] = useState(0)

  useEffect(() => {
    try { localStorage.removeItem('forge_cobuilder_pass_price') } catch (e) {}

    getWorkflowState().then((wf) => {
      const dbFee = wf?.default_pass_price ?? wf?.cobuilder_pass_price ?? wf?.extra_state?.default_pass_price ?? wf?.extra_state?.cobuilder_pass_price
      if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
        setDefaultPassPrice(Number(dbFee))
      } else {
        setDefaultPassPrice(0)
      }
    }).catch(() => {
      setDefaultPassPrice(0)
    })

    const handlePriceEvent = (e) => {
      const p = e?.detail
      if (p !== undefined && p !== null && !isNaN(Number(p))) {
        setDefaultPassPrice(Number(p))
      } else {
        setDefaultPassPrice(0)
      }
    }
    window.addEventListener('forge_pass_price_changed', handlePriceEvent)
    return () => {
      window.removeEventListener('forge_pass_price_changed', handlePriceEvent)
    }
  }, [])

  const projectSpecificFee = Number(
    project?.diyFee ??
    project?.diyPassPrice ??
    project?.metadataInfo?.diy_fee ??
    project?.metadataInfo?.diyFee ??
    project?.metadataInfo?.diyPassPrice ??
    project?.metadata_info?.diy_fee ??
    project?.diySubscription?.amount
  )

  const hasCustomFee = Boolean(
    project?.hasCustomFee ||
    project?.metadataInfo?.hasCustomFee ||
    project?.metadata_info?.hasCustomFee ||
    (!isNaN(projectSpecificFee) && projectSpecificFee > 0 && defaultPassPrice > 0 && projectSpecificFee !== defaultPassPrice)
  )

  const cobuilderPrice = Number(
    !isNaN(projectSpecificFee) && projectSpecificFee > 0 && (hasCustomFee || !defaultPassPrice)
      ? projectSpecificFee
      : (defaultPassPrice || (!isNaN(projectSpecificFee) && projectSpecificFee > 0 ? projectSpecificFee : 50))
  )

  // When creator has paid, projectOS is the default view (unless explicitly overridden by URL)
  const hasAutoSwitchedToProjectOS = useRef(false)
  useEffect(() => {
    if (!hasAutoSwitchedToProjectOS.current && isDiyActive) {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search)
        if (sp.get('view') === 'launch_kit') return
      }
      setActiveMainView('projectos')
      hasAutoSwitchedToProjectOS.current = true
    }
  }, [isDiyActive])

  const isTrackChoiceUrl = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('offer') === 'track_choice' ||
    new URLSearchParams(window.location.search).get('track') === 'choice'
  )

  // Critical fix: If the user has already paid ($50 Co-Builder) or accepted/dismissed, track choice MUST NOT block them
  const isTrackChoicePending = !isDiyActive && !trackChoiceDismissed && project?.diyOfferStatus !== 'accepted' && project?.diyOfferStatus !== 'paid' && (
    isTrackChoiceUrl ||
    project?.diyOfferStatus !== 'declined'
  )

  // Automatically clean up offer/track URL params once paid/active on Track 1
  useEffect(() => {
    if (typeof window !== 'undefined' && isDiyActive) {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.has('offer') || searchParams.has('track')) {
        searchParams.delete('offer')
        searchParams.delete('track')
        const newSearch = searchParams.toString()
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [isDiyActive])

  const handleUpdateProject = (updatedProj) => {
    setProject(updatedProj)
    if (updatedProj?.id) {
      updateCoLaunchProject(updatedProj.id, updatedProj).catch(() => {})
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updatedProj }))
    }
  }

  const handleDeclineDiyOffer = async () => {
    if (!project) return
    const updated = {
      ...project,
      diyOfferStatus: 'declined',
      isDIY: false
    }
    handleUpdateProject(updated)
    setTrackChoiceDismissed(true)
    setActiveMainView('launch_kit')
    showToast('Standard Studio-Managed track active (50/50 Revenue Split).')
  }

  const handleUnlockDiySuccess = (subRecordOrProj) => {
    if (!project) return
    const subRecord = subRecordOrProj?.diySubscription || subRecordOrProj
    const updated = {
      ...project,
      isDIY: true,
      diyOfferStatus: 'accepted',
      diySubscription: subRecord
    }
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.delete('offer')
      searchParams.delete('track')
      const newSearch = searchParams.toString()
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
      window.history.replaceState({}, '', newUrl)
    }
    handleUpdateProject(updated)
    setTrackChoiceDismissed(true)
    setShowDiyModal(false)
    setActiveMainView('projectos')
    showToast(`Interactive Co-Builder Pass active ($${cobuilderPrice} USD)!`)
  }

  // Load Section 1 outreach and threads
  useEffect(() => {
    let isMounted = true
    const loadThreads = async () => {
      try {
        const allThreads = await getThreads()
        if (isMounted && Array.isArray(allThreads)) {
          const cId = project?.creatorId
          const cHandle = (project?.creatorHandle || '').toLowerCase().replace(/^@/, '').trim()
          const cEmail = (project?.creatorEmail || project?.email_public || '').toLowerCase().trim()
          const cName = (project?.creatorName || '').toLowerCase().trim()

          const matchingThreads = allThreads.filter(t => {
            if (!t) return false
            if (cId && t.creator_id === cId) return true
            if (cHandle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, '').trim() === cHandle) return true
            if (cEmail && t.creator_email && t.creator_email.toLowerCase().trim() === cEmail) return true
            if (cName && cName.length >= 3 && (t.subject || '').toLowerCase().includes(cName)) return true
            return false
          })

          const collected = []
          matchingThreads.forEach(t => {
            if (t.initial_body || t.body) {
              collected.push({
                id: `thread-outreach-${t.id}`,
                sender: 'admin',
                senderName: 'CoLaunch Studio',
                subject: t.subject || 'Partnership Proposal',
                text: t.initial_body || t.body,
                time: t.created_at ? new Date(t.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Section 1',
                rawTime: t.created_at ? new Date(t.created_at).getTime() : 0,
                status: 'read',
                isSection1: true
              })
            }
            const replies = t.replies || []
            replies.forEach(r => {
              const fromAddr = (r.from_address || '').toLowerCase().trim()
              const isFromStudio = fromAddr.includes('creatorforge.com') || fromAddr.includes('partnerships') || fromAddr.includes('studio')
              collected.push({
                id: `reply-${r.id || Math.random()}`,
                sender: isFromStudio ? 'admin' : 'creator',
                senderName: isFromStudio ? 'CoLaunch Studio' : (project?.creatorName || 'You'),
                subject: r.subject || '',
                text: r.body || '',
                time: r.received_at || r.created_at ? new Date(r.received_at || r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Section 1',
                rawTime: (r.received_at || r.created_at) ? new Date(r.received_at || r.created_at).getTime() : 0,
                status: 'read',
                isSection1: true
              })
            })
          })
          const dedupedThreads = deduplicateAndSortMessages(collected)
          setSection1Threads(dedupedThreads)
        }
      } catch (e) {
        console.warn('[CreatorPortal] Threads error:', e)
      }
    }
    loadThreads()
    return () => { isMounted = false }
  }, [project?.creatorId, project?.creatorHandle, project?.creatorEmail])

  // Real-time polling for messages from the Admin Studio (tab-aware)
  useEffect(() => {
    let isMounted = true
    if (!project?.id) return

    const pollProject = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        const fresh = await getCoLaunchProject(project.id)
        if (isMounted && fresh) {
          const curCount = Array.isArray(project?.messages) ? project.messages.length : 0
          const freshCount = Array.isArray(fresh.messages) ? fresh.messages.length : 0
          if (freshCount !== curCount || fresh.currentPresales !== project.currentPresales) {
            setProject(fresh)
          }
        }
      } catch (e) {}
    }

    const interval = setInterval(pollProject, 25000)
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) pollProject()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [project?.id, project?.messages?.length, project?.currentPresales])

  // Combine real Section 1 messages + Section 2 custom messages with deduplication and chronological ordering
  const customProjectMessages = Array.isArray(project?.messages) ? project.messages : []
  const portalDisplayMessages = useMemo(() => {
    return deduplicateAndSortMessages([...section1Threads, ...customProjectMessages])
  }, [section1Threads, customProjectMessages])

  // Auto-scroll on new messages
  useEffect(() => {
    if (activeTab === 'messages') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [portalDisplayMessages.length, activeTab])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    showToast('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSendCreatorMessage = async (e) => {
    e?.preventDefault?.()
    const trimmed = creatorReplyText.trim()
    if (!trimmed || !project) return

    setIsSendingReply(true)
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'creator',
      senderName: project.creatorName || 'Creator Partner',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    }

    const updatedMessages = [...customProjectMessages, newMsg]
    const updatedProject = {
      ...project,
      messages: updatedMessages
    }

    setProject(updatedProject)
    setCreatorReplyText('')
    setIsSendingReply(false)

    if (project.id) {
      updateCoLaunchProject(project.id, { messages: updatedMessages }).catch(() => {})
    }
    showToast('Message sent to Studio!')
  }

  const toggleChecklist = (id) => {
    if (!project) return
    const schedule = (project.campaignKit?.postingSchedule && project.campaignKit.postingSchedule.length > 0)
      ? project.campaignKit.postingSchedule
      : (project.checklist || [])
    const nextSchedule = schedule.map(item =>
      item.id === id ? { ...item, done: !item.done, completed: !item.completed } : item
    )
    const updated = {
      ...project,
      campaignKit: {
        ...(project.campaignKit || {}),
        postingSchedule: nextSchedule
      },
      checklist: nextSchedule
    }
    setProject(updated)
    if (project.id) {
      updateCoLaunchProject(project.id, {
        campaignKit: updated.campaignKit,
        checklist: nextSchedule
      }).catch(() => {})
    }
    showToast('Task status updated!')
  }

  const handleSimulatePreorder = () => {
    if (!project) return
    const currentRes = project.reservations || []
    const newReservation = {
      id: `res-${Date.now()}`,
      name: `Backer #${(currentRes.length + 1)}`,
      email: `member${currentRes.length + 1}@audience.com`,
      amount: dynamicPresalePrice,
      tier: dynamicPresaleTierName,
      created_at: new Date().toISOString()
    }
    const updatedReservations = [newReservation, ...currentRes]
    const updatedRevenue = Number(project.currentPresales || 0) + dynamicPresalePrice
    const updated = {
      ...project,
      currentPresales: updatedRevenue,
      reservations: updatedReservations
    }
    handleUpdateProject(updated)
    showToast(`Simulated backer pre-order recorded (+ $${dynamicPresalePrice} USD). Revenue share updated!`)
  }

  const getTaskDraftContent = (task) => {
    if (!task) return ''
    const ck = project?.campaignKit || {}
    if (task.draftKey === 'storySequence') return ck.storySequence || 'STORY 1 — Pain Point Poll\nSTORY 2 — Product Solution Reveal\nSTORY 3 — Pre-Order Link & Founding Member Callout'
    if (task.draftKey === 'videoScript') return ck.videoScript || '60s Short-Form Video Script with hook, demo, and CTA'
    if (task.draftKey === 'newsletterDraft') return ck.newsletterDraft || 'Email Newsletter Broadcast Draft detailing the launch'
    if (task.draftKey === 'directMessageScript') return ck.directMessageScript || '1-on-1 DM Script for VIP audience members'
    return ck.announcementPost || 'Social Announcement Post Copy tailored for your community'
  }

  // Dynamic Phase & Step Synchronization directly matched with the Operator / Admin Dashboard
  // MUST BE CALLED UNCONDITIONALLY BEFORE ANY EARLY RETURNS TO PREVENT REACT ERROR #310
  const currentPhase = Number(project?.currentPhase || project?.current_phase || 1)
  const p1Guards = useMemo(() => getPhase1StepGuards(project || {}), [project])
  const p2Guards = useMemo(() => getPhase2StepGuards(project || {}), [project])
  const p3Guards = useMemo(() => getPhase3StepGuards(project || {}), [project])

  const activePhaseSteps = useMemo(() => {
    if (currentPhase === 2) {
      return [
        { id: 'plan', num: '01', label: '1. Plan & Spec', fullLabel: 'Product & Build Plan', isDone: p2Guards.isStep1Done },
        { id: 'build', num: '02', label: '2. Build MVP', fullLabel: 'Engineering Build', isDone: p2Guards.isStep2Done },
        { id: 'beta', num: '03', label: '3. Beta Test', fullLabel: 'Beta Testing', isDone: p2Guards.isStep3Done },
        { id: 'gate', num: '04', label: '4. Launch Gate', fullLabel: 'Iterate & Launch Gate', isDone: p2Guards.isStep4Done },
      ]
    }
    if (currentPhase === 3) {
      return [
        { id: 'prep', num: '01', label: '1. Prepare', fullLabel: 'Launch Preparation', isDone: p3Guards.isStep1Done },
        { id: 'launch', num: '02', label: '2. Launch & Monitor', fullLabel: 'Live Telemetry', isDone: p3Guards.isStep2Done },
        { id: 'review', num: '03', label: '3. Optimization', fullLabel: 'Review & Retarget', isDone: p3Guards.isStep3Done },
        { id: 'scale', num: '04', label: '4. Retention', fullLabel: 'Scale & Community', isDone: p3Guards.isStep4Done },
      ]
    }
    // Default Phase 1 (Validation Execution Workspace - EXACT MATCH with Admin Dashboard!)
    return [
      { id: 'plan', num: '01', label: '1. Plan', fullLabel: 'Validation Plan', isDone: p1Guards.isStep1Done },
      { id: 'assets', num: '02', label: '2. Assets', fullLabel: 'Validation Assets', isDone: p1Guards.isStep2Done },
      { id: 'campaign', num: '03', label: '3. Campaign', fullLabel: 'Creator Campaign', isDone: p1Guards.isStep3Done },
      { id: 'optimize', num: '04', label: '4. Optimize', fullLabel: 'Run & Optimize', isDone: p1Guards.isStep4Done },
      { id: 'gate', num: '05', label: '5. Gate', fullLabel: 'Validation Gate', isDone: p1Guards.isGatePassed || p1Guards.isStep5Done },
    ]
  }, [currentPhase, p1Guards, p2Guards, p3Guards])

  const activeStepIdx = activePhaseSteps.findIndex(s => !s.isDone)
  const resolvedActiveStepIndex = activeStepIdx === -1 ? activePhaseSteps.length - 1 : activeStepIdx
  const resolvedAvatar = creatorAvatar || project?.creatorAvatar || project?.creator_avatar || project?.avatar || project?.avatar_url

  const presalesRevenue = Number(project?.currentPresales || 0)
  const parseThresholdAmount = (str) => {
    if (!str) return 0
    const match = String(str).replace(/,/g, '').match(/\$(\d+)/)
    return match ? Number(match[1]) : 0
  }
  const derivedPlanTarget = parseThresholdAmount(project?.validationPlan?.threshold)
  const presaleTarget = derivedPlanTarget > 0 ? derivedPlanTarget : Number(project?.presaleTarget || project?.targetRevenue || 7000)
  const creatorRevenueShare = Math.round(presalesRevenue * 0.5)

  // Dynamic presale price & tier resolution from DB project / concept / campaign kit
  const rawPricingSource =
    project?.selectedConcept?.pricing ||
    project?.pricing ||
    project?.validationPlan?.pricing ||
    project?.campaignKit?.pricingTiers?.[0]?.price ||
    project?.campaignKit?.foundingPrice ||
    project?.presalePrice ||
    project?.earlyBirdPrice ||
    cobuilderPrice ||
    49

  const dynamicPresalePrice = parseMainPricingAmount(rawPricingSource, cobuilderPrice || 49)
  const parsedConcept = parseConceptPricing(rawPricingSource, dynamicPresalePrice)
  const dynamicPresaleTierName =
    project?.campaignKit?.pricingTiers?.[0]?.name ||
    parsedConcept.tiers?.[0]?.name ||
    'Early Bird Pass'

  const backersNeededForGate = Math.max(1, Math.ceil(presaleTarget / (dynamicPresalePrice || 49)))

  const reservations = project?.reservations || []
  const displayReservations = useMemo(() => {
    if (reservations.length > 0) return reservations
    if (presalesRevenue > 0) {
      const count = Math.max(1, Math.round(presalesRevenue / (dynamicPresalePrice || 49)))
      const unitPrice = dynamicPresalePrice || 49
      return Array.from({ length: count }, (_, idx) => ({
        id: `recorded-${idx + 1}`,
        name: `Founding Backer #${idx + 1}`,
        email: `backer${idx + 1}@audience.com`,
        amount: unitPrice,
        tier: dynamicPresaleTierName,
        created_at: new Date().toISOString()
      }))
    }
    return []
  }, [reservations, presalesRevenue, dynamicPresalePrice, dynamicPresaleTierName])

  if (loading) {
    return <CreatorPortalSkeleton />
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: C.bg, color: C.text }}>
        <div
          className="max-w-md w-full p-8 rounded-2xl text-center space-y-4 shadow-xl"
          style={{ background: C.sheet, border: `1px solid ${C.lineStrong}` }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
            style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}
          >
            <Rocket className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold" style={{ color: C.text, fontFamily: HEADING_FONT }}>
            No Active Creator Project Loaded
          </h2>
          <p className="text-xs" style={{ color: C.muted }}>
            Please ask your co-founder operator to initialize your partnership project and share your link.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            style={{ background: C.crimson, color: '#ffffff' }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const totalBackersCount = displayReservations.length
  const campaignKit = project?.campaignKit || {}
  const schedule = (campaignKit.postingSchedule && campaignKit.postingSchedule.length > 0)
    ? campaignKit.postingSchedule
    : (project?.checklist && project.checklist.length > 0 ? project.checklist : [
        { id: 'day-1', day: 1, title: 'Problem Teaser & Discovery Poll', channel: 'X Post', isToday: false, done: true, draftKey: 'announcementPost', description: 'Post teaser and survey link to gather audience friction points.' },
        { id: 'day-2', day: 2, title: 'Post Instagram Story #2 — Pain Point Poll & Announcement', channel: 'Instagram Stories', isToday: true, done: false, draftKey: 'storySequence', description: 'Post 3-story sequence with interactive poll sticker to drive warm audience to the pre-order page.' },
        { id: 'day-3', day: 3, title: 'Publish 60-Second Video Demo & Launch Hook', channel: 'TikTok / Reels / Shorts', isToday: false, done: false, draftKey: 'videoScript', description: 'Post 60s short-form demo demonstrating the core solution in action.' },
        { id: 'day-4', day: 4, title: 'Send Deep-Dive Email Newsletter Broadcast', channel: 'Email Newsletter', isToday: false, done: false, draftKey: 'newsletterDraft', description: 'Send dedicated email broadcast detailing feature architecture and founding member bonuses.' },
        { id: 'day-5', day: 5, title: '1-on-1 VIP DM Outreach to 20 High-Intent Members', channel: 'Direct Messages', isToday: false, done: false, draftKey: 'directMessageScript', description: 'Reach out personally to 20 followers who engaged with earlier story polls.' },
        { id: 'day-6', day: 6, title: 'Share Live Pre-Order Milestones & Survey Insights', channel: 'Stories & Community', isToday: false, done: false, draftKey: 'storySequence', description: 'Share validation momentum and backer counts to generate social proof and urgency.' },
        { id: 'day-7', day: 7, title: 'Final 24-Hour Founding Tier Price Lock Push', channel: 'All Social Channels', isToday: false, done: false, draftKey: 'announcementPost', description: 'Final call before founding cohort closes and validation gate locks in.' }
      ])
  const completedTasksCount = schedule.filter(t => t.done || t.completed).length
  const totalTasksCount = schedule.length
  const sprintTotalDays = schedule.length > 0 ? schedule.length : (project?.sprintDuration || 7)
  const projectCreatedTime = project?.created_at ? new Date(project.created_at).getTime() : Date.now()
  const daysElapsed = Math.max(0, Math.floor((Date.now() - projectCreatedTime) / (1000 * 60 * 60 * 24)))
  const daysRemaining = Math.max(1, sprintTotalDays - daysElapsed)
  const preorderUrl = `${getFrontendUrl()}/preorder?ref=${project?.creatorHandle?.replace('@','') || 'creator'}`
  const targetPct = presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 0

  return (
    <div
      className="cp-root min-h-screen font-sans flex flex-col relative antialiased"
      style={{
        backgroundColor: C.bg,
        color: C.text,
      }}
    >
      <style>{PORTAL_CSS}</style>
      {/* Top Accent Gradient Bar — CoLaunch Crimson Base with Semantic Spectrum */}
      <div
        className="h-1 w-full shrink-0 z-50 sticky top-0"
        style={{ background: `linear-gradient(90deg, ${C.crimson}, #a78bfa, #38bdf8)` }}
      />

      {/* ── TOP NAV HEADER ──────────────────────────────────────────────────────── */}
      <header
        id="tour-portal-header"
        className="backdrop-blur-md sticky top-1 z-50 shadow-sm w-full max-w-full"
        style={{ background: C.sheet, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="h-14 flex items-center justify-between px-3 sm:px-6 gap-2 w-full">
          {/* Brand / Partner Identity */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
            <div
              className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, color: C.text }}
            >
              {resolvedAvatar && !avatarLoadError ? (
                <img
                  src={resolvedAvatar}
                  alt={creatorName || 'Creator'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs uppercase" style={{ background: C.crimsonSoft, color: C.crimsonText }}>
                  {(creatorName || 'C').charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="serif text-base sm:text-lg font-normal tracking-tight truncate max-w-[120px] sm:max-w-[220px] md:max-w-[280px]"
                  style={{ color: C.text }}
                >
                  {productName}
                </span>
                <span
                  className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: C.crimsonSoft,
                    color: C.crimsonText,
                    border: `1px solid ${C.crimsonLine}`
                  }}
                >
                  50/50
                </span>
              </div>
              <p className="text-[11px] font-medium truncate max-w-[170px] sm:max-w-[220px] hidden md:block" style={{ color: C.muted }}>
                Signed Partner: {creatorName}
              </p>
            </div>
          </div>

          {/* Center View Switcher (Desktop & Mobile Compact) */}
          {!isTrackChoicePending && (
            <div
              className="flex items-center gap-1 p-1 rounded-xl shrink-0"
              style={{ background: C.row, border: `1px solid ${C.line}` }}
            >
              <button
                type="button"
                onClick={() => setActiveMainView('launch_kit')}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                style={
                  activeMainView === 'launch_kit'
                    ? { background: C.crimson, color: '#ffffff' }
                    : { color: C.muted }
                }
                title="Open Daily Launch Kit & Marketing Assets"
              >
                <Rocket className="w-3 h-3 sm:hidden" style={{ color: activeMainView === 'launch_kit' ? '#ffffff' : C.ok }} />
                <span className="hidden sm:inline">Launch Kit</span>
                <span className="sm:hidden">Kit</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMainView('projectos')}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                style={
                  activeMainView === 'projectos'
                    ? { background: C.crimson, color: '#ffffff' }
                    : { color: C.muted }
                }
                title="Open ProjectOS Operational Center"
              >
                <Layers className="w-3 h-3 sm:hidden" style={{ color: activeMainView === 'projectos' ? '#ffffff' : C.sky }} />
                <span className="hidden sm:inline">ProjectOS</span>
                <span className="sm:hidden">OS</span>
              </button>
            </div>
          )}

          {/* Desktop Right Controls (hidden on mobile, available in toggle drawer) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Track Indicator & Upgrade Pass Action */}
            {isDiyActive ? (
              <div
                id="tour-portal-badge"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold"
                style={{ background: C.okSoft, border: `1px solid ${C.okLine}`, color: C.ok }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.ok }} />
                <span>Track 1: Co-Builder (${cobuilderPrice} Paid)</span>
              </div>
            ) : isTrackChoicePending ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold"
                  style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}`, color: C.warn }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.warn }} />
                  <span>Track Choice Pending</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiyModal(true)}
                  className="cp-btn-primary h-8 flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: C.warn, fill: C.warn }} />
                  <span>Co-Builder Pass (${cobuilderPrice})</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold"
                  style={{ background: C.violetSoft, border: `1px solid ${C.violetLine}`, color: C.violet }}
                >
                  <span>🤝</span>
                  <span>Track 2: Studio-Managed (50/50)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiyModal(true)}
                  className="cp-btn-primary h-8 flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: C.warn, fill: C.warn }} />
                  <span>Upgrade to Co-Builder (${cobuilderPrice})</span>
                </button>
              </div>
            )}

            {/* Driver.js Interactive Workflow Tour Trigger */}
            <button
              type="button"
              onClick={() => isDiyActive ? startCreatorPortalPostPaymentTour(true) : startCreatorPortalPrePaymentTour(true)}
              className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
              style={{ background: C.violetSoft, border: `1px solid ${C.violetLine}`, color: C.violet }}
              title="Start Guided Walkthrough (Driver.js)"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: C.violet }} />
              <span className="hidden sm:inline">Workflow Tour</span>
            </button>

            {/* Revenue Share Pill */}
            <div id="tour-portal-equity" className="h-8 flex items-center pl-2" style={{ borderLeft: `1px solid ${C.line}` }}>
              <div
                className="px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-mono font-bold"
                style={{
                  backgroundColor: C.okSoft,
                  border: `1px solid ${C.okLine}`,
                  color: C.ok
                }}
              >
                <DollarSign className="w-3 h-3 shrink-0" style={{ color: C.ok }} />
                <span className="text-[10px] font-sans font-semibold opacity-90" style={{ color: C.body }}>
                  {isDiyActive ? '100% Pool:' : '50%:'}
                </span>
                <span className="font-extrabold" style={{ color: C.ok }}>
                  ${(isDiyActive ? presalesRevenue : creatorRevenueShare).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Controls: Compact Revenue Badge + Toggle Menu Button */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            <div
              className="px-2 py-1 rounded-lg flex items-center gap-0.5 text-[10px] sm:text-xs font-mono font-bold"
              style={{
                backgroundColor: C.okSoft,
                border: `1px solid ${C.okLine}`,
                color: C.ok
              }}
            >
              <DollarSign className="w-3 h-3 shrink-0" style={{ color: C.ok }} />
              <span>${(isDiyActive ? presalesRevenue : creatorRevenueShare).toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileNavOpen(prev => !prev)}
              className="p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer"
              style={
                isMobileNavOpen
                  ? { background: C.crimson, color: '#ffffff', border: `1px solid ${C.crimsonLine}` }
                  : { background: C.raised, color: C.text, border: `1px solid ${C.lineStrong}` }
              }
              aria-label="Toggle Portal Navigation Menu"
              title="Toggle Menu"
            >
              {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Navbar Drawer */}
        {isMobileNavOpen && (
          <div
            className="lg:hidden px-3 sm:px-6 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-lg"
            style={{ background: C.sheet, borderTop: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
              <span className="text-[10px] uppercase font-mono font-bold" style={{ color: C.muted }}>Signed Creator Partner</span>
              <span className="text-xs font-bold" style={{ color: C.text }}>{creatorName}</span>
            </div>

            {/* View Switcher in Drawer */}
            {!isTrackChoicePending && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold" style={{ color: C.muted }}>Workspace View</span>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMainView('launch_kit')
                      setIsMobileNavOpen(false)
                    }}
                    className="py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    style={
                      activeMainView === 'launch_kit'
                        ? { background: C.crimson, color: '#ffffff' }
                        : { color: C.muted }
                    }
                  >
                    <Rocket className="w-3.5 h-3.5" style={{ color: activeMainView === 'launch_kit' ? '#ffffff' : C.ok }} />
                    <span>Launch Kit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMainView('projectos')
                      setIsMobileNavOpen(false)
                    }}
                    className="py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    style={
                      activeMainView === 'projectos'
                        ? { background: C.crimson, color: '#ffffff' }
                        : { color: C.muted }
                    }
                  >
                    <Layers className="w-3.5 h-3.5" style={{ color: activeMainView === 'projectos' ? '#ffffff' : C.sky }} />
                    <span>ProjectOS</span>
                  </button>
                </div>
              </div>
            )}

            <div
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl"
              style={{ background: C.row, border: `1px solid ${C.line}` }}
            >
              <div className="text-xs font-mono font-semibold flex items-center gap-1.5" style={{ color: C.body }}>
                <span className="w-2 h-2 rounded-full" style={{ background: isDiyActive ? C.ok : C.violet }} />
                <span>{isDiyActive ? `Track 1: Co-Builder ($${cobuilderPrice} Paid)` : 'Track 2: Studio-Managed (50/50)'}</span>
              </div>
              {!isDiyActive && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDiyModal(true)
                    setIsMobileNavOpen(false)
                  }}
                  className="cp-btn-primary px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Zap className="w-3 h-3" style={{ color: C.warn, fill: C.warn }} />
                  <span>${cobuilderPrice} Pass</span>
                </button>
              )}
            </div>

            {/* Quick Links & Share in Mobile Nav */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(window.location.href, 'portal-link')
                  setIsMobileNavOpen(false)
                }}
                className="cp-btn-quiet px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" style={{ color: C.sky }} />
                <span>Share Portal</span>
              </button>
              <a
                href={preorderUrl}
                target="_blank"
                rel="noreferrer"
                className="cp-btn-primary px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Pre-Order Link</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Floating Notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2.5 animate-bounce"
          style={{ background: C.raised, color: C.text, border: `1px solid ${C.okLine}` }}
        >
          <CheckCircle2 className="w-4 h-4" style={{ color: C.ok }} />
          <span>{toast}</span>
        </div>
      )}

      {/* ── MAIN BODY CONTAINER ─────────────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-full 2xl:max-w-[1720px] mx-auto px-2.5 sm:px-4 lg:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 overflow-x-hidden">

        {/* ── STEP / PHASE PROGRESS BAR ────────────────────────────────────────── */}
        {isTrackChoicePending ? (
          <div
            className="rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs w-full"
            style={{ background: C.sheet, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.crimson }} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider" style={{ color: C.crimsonText }}>
                Step 01 of 05
              </span>
              <span className="text-neutral-600">•</span>
              <span className="font-medium" style={{ color: C.text }}>
                Co-Launch Participation Track Choice
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: C.muted }}>
              <span>Phase 1: Validation</span>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-3.5 sm:p-5 space-y-3 w-full max-w-full overflow-hidden"
            style={{ background: C.sheet, border: `1px solid ${C.line}` }}
          >
            {/* LEVEL 1: PROJECT ROADMAP & THE 3 PHASES */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 w-full" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}
                >
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: C.faint }}>Roadmap:</span>
                  <span className="serif text-base sm:text-lg font-normal truncate" style={{ color: C.text }}>
                    Phase {currentPhase} of 3 — {currentPhase === 1 ? 'Market Validation' : currentPhase === 2 ? 'AI MVP Build' : 'Live Launch'}
                  </span>
                </div>
              </div>

              {/* The 3 Phases Macro Stepper */}
              <div className="w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth py-0.5">
                <div className="flex items-center gap-1.5 min-w-max">
                  {/* Phase 1 */}
                  <div
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0"
                    style={
                      currentPhase === 1
                        ? { background: C.crimson, color: '#ffffff' }
                        : currentPhase > 1
                        ? { background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }
                        : { background: C.row, color: C.muted, border: `1px solid ${C.line}` }
                    }
                  >
                    {currentPhase > 1 ? (
                      <Check className="w-3 h-3 stroke-[3]" style={{ color: C.ok }} />
                    ) : currentPhase === 1 ? (
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.ok }} />
                    ) : null}
                    <span>Phase 1: Validation</span>
                  </div>

                  <div className="w-2.5 h-[1px] shrink-0" style={{ background: C.lineStrong }} />

                  {/* Phase 2 */}
                  <div
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0"
                    style={
                      currentPhase === 2
                        ? { background: C.crimson, color: '#ffffff' }
                        : currentPhase > 2
                        ? { background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }
                        : { background: C.row, color: C.muted, border: `1px solid ${C.line}` }
                    }
                  >
                    {currentPhase > 2 ? (
                      <Check className="w-3 h-3 stroke-[3]" style={{ color: C.ok }} />
                    ) : currentPhase === 2 ? (
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.ok }} />
                    ) : null}
                    <span>Phase 2: Build MVP</span>
                  </div>

                  <div className="w-2.5 h-[1px] shrink-0" style={{ background: C.lineStrong }} />

                  {/* Phase 3 */}
                  <div
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0"
                    style={
                      currentPhase === 3
                        ? { background: C.crimson, color: '#ffffff' }
                        : { background: C.row, color: C.muted, border: `1px solid ${C.line}` }
                    }
                  >
                    {currentPhase === 3 ? (
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.ok }} />
                    ) : null}
                    <span>Phase 3: Live Launch</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LEVEL 2: DISTINCT EXECUTION STEPS */}
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: C.faint }}>
                    Execution Progress
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                  >
                    {activePhaseSteps.filter(s => s.isDone).length} of {activePhaseSteps.length} Done
                  </span>
                </div>
                <span className="text-[10px] font-mono hidden sm:inline" style={{ color: C.muted }}>
                  Active: Step {activePhaseSteps[resolvedActiveStepIndex]?.num || '01'}
                </span>
              </div>

              {/* Steps Container */}
              <div className="w-full overflow-x-auto no-scrollbar scroll-smooth py-1">
                <div className="flex items-center gap-2 min-w-max">
                  {activePhaseSteps.map((step, idx) => {
                    const isActive = idx === resolvedActiveStepIndex
                    const isDone = Boolean(step.isDone)
                    return (
                      <div key={step.id} className="flex items-center gap-2 shrink-0">
                        {isDone ? (
                          <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold"
                            style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                          >
                            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: C.ok, color: '#08090c' }}>
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="font-sans font-bold" style={{ color: C.text }}>{step.label}</span>
                          </div>
                        ) : isActive ? (
                          <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold"
                            style={{ background: C.crimsonSoft, color: C.text, border: `1px solid ${C.crimsonLine}`, borderLeft: `3px solid ${C.crimson}` }}
                          >
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: C.crimson, color: '#ffffff' }}>
                              STEP {step.num}
                            </span>
                            <span className="font-sans font-bold" style={{ color: C.text }}>{step.label}</span>
                            <span className="w-2 h-2 rounded-full animate-pulse ml-0.5" style={{ background: C.ok }} />
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono"
                            style={{ background: C.row, color: C.muted, border: `1px solid ${C.line}` }}
                          >
                            <span className="font-bold" style={{ color: C.faint }}>{step.num}</span>
                            <span className="font-sans font-medium" style={{ color: C.body }}>{step.label}</span>
                          </div>
                        )}
                        {idx < activePhaseSteps.length - 1 && (
                          <div
                            className="w-4 sm:w-5 h-[2px] rounded-full shrink-0"
                            style={{ background: isDone ? C.ok : C.line }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INTERACTIVE CO-BUILDER PASS UPGRADE BANNER ──────────────── */}
        {!isDiyActive && !isTrackChoicePending && (
          <div
            id="tour-portal-track-card"
            className="rounded-2xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
            style={{ background: C.sheet, border: `1px solid ${C.crimsonLine}` }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}` }}
              >
                <Zap className="w-5 h-5" style={{ color: C.warn, fill: C.warn }} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                    Interactive Co-Builder Pass (${cobuilderPrice} USD)
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold"
                    style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                  >
                    50/50 Equity Maintained
                  </span>
                </div>
                <p className="text-xs" style={{ color: C.muted }}>
                  Want full command control to trigger AI MVP sprints, modify prompt blueprints, and code alongside the studio?
                </p>
              </div>
            </div>
            <button
              id="tour-portal-unlock-btn"
              type="button"
              onClick={() => setShowDiyModal(true)}
              className="cp-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shrink-0 whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5 text-white" />
              <span>Unlock Interactive Pass (${cobuilderPrice} USD) →</span>
            </button>
          </div>
        )}

        {/* ── STATE 1: CO-LAUNCH PARTICIPATION TRACK CHOICE ───────────── */}
        {isTrackChoicePending ? (
          <div className="max-w-5xl mx-auto space-y-8 py-2 sm:py-6">
            {/* Clean Hero Header — Centered, Editorial & Legible */}
            <div className="text-center space-y-3.5 max-w-2xl mx-auto px-2">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium"
                style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, color: C.muted }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.crimson }} />
                <span>Venture Activation • <strong style={{ color: C.text }}>{creatorName}</strong></span>
              </div>

              <h1
                className="serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white leading-tight"
              >
                Select Your Participation Track
              </h1>

              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: C.body }}>
                Every venture operates on our verified <strong className="font-semibold text-white">50/50 Co-Founder Equity Partnership</strong>. Choose whether you want hands-on building tools or full delegation to our studio engineering group.
              </p>
            </div>

            {/* The 2 Main Choice Cards — Side-by-Side with Generous Spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">

              {/* TRACK 1: INTERACTIVE CO-BUILDER PASS */}
              <div
                id="tour-portal-track-card"
                onClick={() => setSelectedTrack('interactive')}
                className="rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer relative"
                style={{
                  background: selectedTrack === 'interactive'
                    ? 'linear-gradient(180deg, rgba(200, 30, 60, 0.14) 0%, rgba(16, 19, 26, 0.98) 100%)'
                    : 'linear-gradient(180deg, rgba(23, 27, 36, 0.5) 0%, rgba(12, 14, 19, 0.96) 100%)',
                  border: selectedTrack === 'interactive' ? `1px solid ${C.crimsonLine}` : `1px solid ${C.line}`,
                  borderTop: `3px solid ${C.crimson}`,
                  boxShadow: selectedTrack === 'interactive' ? '0 16px 40px rgba(200, 30, 60, 0.20)' : '0 4px 20px rgba(0,0,0,0.3)',
                  transform: selectedTrack === 'interactive' ? 'translateY(-2px)' : 'none'
                }}
              >
                {/* Recommended Badge */}
                <div
                  className="absolute -top-3 left-6 px-3.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{
                    background: C.crimson,
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 4px 14px rgba(200, 30, 60, 0.45)'
                  }}
                >
                  <Star className="w-3 h-3 fill-current text-white" />
                  <span className="text-white">RECOMMENDED</span>
                </div>

                <div className="space-y-5 pt-1">
                  {/* Card Header & Price */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider inline-block mb-1.5"
                        style={{ background: C.crimsonSoft, color: C.crimsonText, border: `1px solid ${C.crimsonLine}` }}
                      >
                        Track 1 • Interactive
                      </span>
                      <h2 className="serif text-2xl sm:text-3xl font-normal text-white">
                        Co-Builder Pass
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="serif text-3xl sm:text-4xl text-white font-normal leading-none">
                        ${cobuilderPrice}
                      </div>
                      <span className="text-[11px] font-mono block mt-1" style={{ color: C.muted }}>
                        one-time pass
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: C.body }}>
                    Take active command control to prompt AI feature sprints, review architecture blueprints, and build directly alongside our platform engine.
                  </p>

                  {/* Key Deliverables */}
                  <div className="space-y-3 text-xs sm:text-sm pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span style={{ color: C.body }}>
                        <strong className="font-semibold text-white">50/50 Founder Equity</strong> locked in charter
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span style={{ color: C.body }}>
                        <strong className="font-semibold text-white">Hands-on Workbench</strong> for all 3 phases
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span style={{ color: C.body }}>
                        <strong className="font-semibold text-white">Rapid AI Sprints</strong> to trigger MVP feature modules
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span style={{ color: C.body }}>
                        <strong className="font-semibold text-white">Dedicated Subdomain</strong> & GitHub repo access
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-8 space-y-2">
                  <button
                    id="tour-portal-unlock-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isDiyActive) {
                        setTrackChoiceDismissed(true)
                        setActiveMainView('projectos')
                      } else {
                        setSelectedTrack('interactive')
                        setShowDiyModal(true)
                      }
                    }}
                    className="cp-btn-primary w-full py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isDiyActive ? 'Open Co-Builder Workspace →' : `Choose Interactive Pass ($${cobuilderPrice})`}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <p className="text-[11px] text-center font-mono" style={{ color: C.faint }}>
                    Instant setup • Stripe & PayPal protected
                  </p>
                </div>
              </div>

              {/* TRACK 2: STUDIO-MANAGED TRACK */}
              <div
                onClick={() => setSelectedTrack('managed')}
                className="rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer relative"
                style={{
                  background: selectedTrack === 'managed'
                    ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.12) 0%, rgba(16, 19, 26, 0.98) 100%)'
                    : 'linear-gradient(180deg, rgba(23, 27, 36, 0.5) 0%, rgba(12, 14, 19, 0.96) 100%)',
                  border: selectedTrack === 'managed' ? `1px solid ${C.skyLine}` : `1px solid ${C.line}`,
                  borderTop: `3px solid ${C.sky}`,
                  boxShadow: selectedTrack === 'managed' ? '0 16px 40px rgba(56, 189, 248, 0.18)' : '0 4px 20px rgba(0,0,0,0.3)',
                  transform: selectedTrack === 'managed' ? 'translateY(-2px)' : 'none'
                }}
              >
                <div className="space-y-5 pt-1">
                  {/* Card Header & Price */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider inline-block mb-1.5"
                        style={{ background: C.skySoft, color: C.sky, border: `1px solid ${C.skyLine}` }}
                      >
                        Track 2 • Delegated
                      </span>
                      <h2 className="serif text-2xl sm:text-3xl font-normal text-white">
                        Studio-Managed Track
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="serif text-3xl sm:text-4xl text-white font-normal leading-none">
                        $0
                      </div>
                      <span className="text-[11px] font-mono block mt-1" style={{ color: C.muted }}>
                        upfront fee
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: C.body }}>
                    Studio engineers handle all development, architecture, and deployment while you monitor progress in real-time and coordinate your audience.
                  </p>

                  {/* Key Deliverables */}
                  <div className="space-y-3 text-xs sm:text-sm pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.skySoft, color: C.sky, border: `1px solid ${C.skyLine}` }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span style={{ color: C.body }}>
                        <strong className="font-semibold text-white">50/50 Founder Equity</strong> locked in charter
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.skySoft, color: C.sky, border: `1px solid ${C.skyLine}` }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span style={{ color: C.body }}>
                        <strong className="font-semibold text-white">Done-For-You Sprints</strong> executed by studio engineers
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.skySoft, color: C.sky, border: `1px solid ${C.skyLine}` }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span style={{ color: C.body }}>
                        <strong className="font-semibold text-white">Milestone Review Portal</strong> with live telemetry
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.skySoft, color: C.sky, border: `1px solid ${C.skyLine}` }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span style={{ color: C.body }}>
                        <strong className="font-semibold text-white">Zero Technical Setup</strong> required on your end
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-8 space-y-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTrack('managed')
                      handleDeclineDiyOffer()
                    }}
                    className="cp-btn-quiet w-full py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Choose Studio-Managed (50/50) →</span>
                  </button>
                  <p className="text-[11px] text-center font-mono" style={{ color: C.faint }}>
                    Standard tracking portal activated immediately
                  </p>
                </div>
              </div>

            </div>

            {/* Partnership Guarantee Footer Bar — Clean, Legible, Authoritative */}
            <div
              className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ background: C.sheet, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Guaranteed 50/50 Co-Founder Partnership
                  </span>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    Both tracks share equal commercial profit distributions and verified IP assignment under the venture charter.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAgreementModal(true)}
                className="text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer underline underline-offset-4 hover:opacity-80 transition-opacity shrink-0"
                style={{ color: C.sky }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Charter Agreement</span>
              </button>
            </div>
          </div>
        ) : activeMainView === 'projectos' ? (
          /* ── PROJECTOS WORKSPACE VIEW ────────────────────────────────────────── */
          <div className="space-y-6">
            {isDiyActive ? (
              <div id="tour-portal-workspace" className="space-y-4">
                <ProjectOS project={project} onUpdateProject={handleUpdateProject} userRole="creator" isDIY={isDiyActive} />
              </div>
            ) : (
              /* Studio Managed Status Dashboard */
              <div className="rounded-2xl p-6 sm:p-8 space-y-6" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{ background: C.violetSoft, color: C.violet, border: `1px solid ${C.violetLine}` }}
                      >
                        🤝 Studio-Managed Venture
                      </span>
                      <span className="text-xs" style={{ color: C.faint }}>•</span>
                      <span className="text-xs font-bold" style={{ color: C.ok }}>50/50 Revenue Split Active</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                      ProjectOS Progress Tracker: {productName}
                    </h2>
                    <p className="text-xs sm:text-sm leading-relaxed max-w-2xl" style={{ color: C.muted }}>
                      You chose the Studio-Managed Co-Launch track. The CoLaunch studio engineering team handles 100% of software development, architecture, and deployments for you. You can track all sprint progress, pre-orders, and telemetry below.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl text-center space-y-1 shrink-0" style={{ background: C.row, border: `1px solid ${C.lineStrong}` }}>
                    <span className="text-[10px] uppercase font-mono font-bold block" style={{ color: C.muted }}>Current Phase</span>
                    <div className="text-lg font-black font-mono" style={{ color: C.text }}>
                      Phase {project?.currentPhase || 1}: {project?.currentPhase === 3 ? 'Launch & Scale' : project?.currentPhase === 2 ? 'Build MVP' : 'Validate'}
                    </div>
                    <span className="text-[10px] font-bold block" style={{ color: C.ok }}>Managed by Studio Operators</span>
                  </div>
                </div>

                {/* Progress Milestones */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl space-y-2" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: C.text }}>Phase 1: Validation</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        {project?.currentPhase > 1 ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      Studio operators are managing pre-order telemetry and customer interest validation.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl space-y-2" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: C.text }}>Phase 2: Build MVP</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                        style={{ background: C.skySoft, color: C.sky, border: `1px solid ${C.skyLine}` }}
                      >
                        {project?.currentPhase === 2 ? 'Active Sprint' : project?.currentPhase > 2 ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      Engineers configure the full stack, database, and customer dashboard.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl space-y-2" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: C.text }}>Phase 3: Launch</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                        style={{ background: C.violetSoft, color: C.violet, border: `1px solid ${C.violetLine}` }}
                      >
                        {project?.currentPhase === 3 ? 'Active Launch' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      Production deployment and recurring subscription checkout management.
                    </p>
                  </div>
                </div>

                {/* Return to Launch Kit CTA */}
                <div
                  className="p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ background: C.row, border: `1px solid ${C.line}` }}
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold" style={{ color: C.text }}>Looking for your daily tasks & promotional scripts?</h4>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      Head over to your Daily Launch Kit to copy promotional copy, Instagram stories, and video scripts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMainView('launch_kit')}
                    className="cp-btn-quiet px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    Open Daily Launch Kit & Scripts →
                  </button>
                </div>

                {/* DIY Pass Upgrade Card */}
                {!isDiyActive && (
                  <div
                    className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    style={{ background: C.row, border: `1px solid ${C.crimsonLine}` }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: C.text }}>Want direct workbench & terminal access?</span>
                        <span
                          className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold"
                          style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                        >
                          ${cobuilderPrice} USD
                        </span>
                      </div>
                      <p className="text-[11px]" style={{ color: C.muted }}>
                        Unlock the Interactive Co-Builder Pass to trigger AI code generation, execute Phase 1–3 sprints yourself, and customize all specs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDiyModal(true)}
                      className="cp-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] flex items-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5" style={{ color: C.warn, fill: C.warn }} />
                      <span>Unlock Interactive Pass (${cobuilderPrice} USD) →</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── STATE 2: VALIDATION SPRINT & DAILY LAUNCH KIT (Image 3) ──────────── */
          <div className="space-y-6">

            {/* Validation Sprint Milestone Header Card */}
            <div
              className="rounded-2xl p-6 sm:p-7 space-y-5"
              style={{ background: C.sheet, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: C.crimsonText }}>
                    VALIDATION SPRINT MILESTONE
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                    ${presalesRevenue.toLocaleString()}{' '}
                    <span className="font-normal text-base sm:text-lg" style={{ color: C.muted }}>
                      of ${presaleTarget.toLocaleString()} Presale Goal
                    </span>
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: C.ok }} />
                    <span>{targetPct}% Target Reached</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar with Milestones */}
              <div className="space-y-2">
                <div className="w-full rounded-full h-3 overflow-hidden p-0.5" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, targetPct)}%`,
                      background: `linear-gradient(90deg, ${C.crimson}, ${C.violet}, ${C.sky})`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: C.faint }}>
                  <span>$0 Baseline</span>
                  <span className="font-semibold" style={{ color: C.warn }}>${Math.round(presaleTarget * 0.7).toLocaleString()} Gate Threshold</span>
                  <span className="font-semibold" style={{ color: C.ok }}>${presaleTarget.toLocaleString()} Stretch Target</span>
                </div>
              </div>

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3.5 rounded-xl" style={{ background: C.row, border: `1px solid ${C.okLine}` }}>
                  <span className="text-[10px] font-mono font-bold uppercase block" style={{ color: C.faint }}>Your 50% Profit Share</span>
                  <span className="text-base font-extrabold font-mono mt-0.5 block" style={{ color: C.ok }}>
                    ${creatorRevenueShare.toLocaleString()}
                  </span>
                  <span className="text-[10px] block mt-0.5" style={{ color: C.muted }}>Automated payout routing</span>
                </div>
                <div className="p-3.5 rounded-xl" style={{ background: C.row, border: `1px solid ${C.skyLine}` }}>
                  <span className="text-[10px] font-mono font-bold uppercase block" style={{ color: C.faint }}>Sprint Duration</span>
                  <span className="text-base font-extrabold font-mono mt-0.5 block" style={{ color: C.sky }}>
                    {sprintTotalDays} days
                  </span>
                  <span className="text-[10px] block mt-0.5" style={{ color: C.muted }}>{daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining</span>
                </div>
                <div className="p-3.5 rounded-xl" style={{ background: C.row, border: `1px solid ${C.violetLine}` }}>
                  <span className="text-[10px] font-mono font-bold uppercase block" style={{ color: C.faint }}>Pre-Orders / Backers</span>
                  <span className="text-base font-extrabold font-mono mt-0.5 block" style={{ color: C.violet }}>
                    {totalBackersCount}
                  </span>
                  <span className="text-[10px] block mt-0.5" style={{ color: C.muted }}>Tier: ${dynamicPresalePrice} {dynamicPresaleTierName}</span>
                </div>
                <div className="p-3.5 rounded-xl" style={{ background: C.row, border: `1px solid ${C.crimsonLine}` }}>
                  <span className="text-[10px] font-mono font-bold uppercase block" style={{ color: C.faint }}>Sprint Tasks</span>
                  <span className="text-base font-extrabold font-mono mt-0.5 block" style={{ color: C.text }}>
                    {completedTasksCount} / {totalTasksCount} done
                  </span>
                  <span className="text-[10px] font-bold block mt-0.5" style={{ color: C.crimsonText }}>
                    {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}% complete
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl" style={{ background: C.row, border: `1px solid ${C.warnLine}` }}>
                  <span className="text-[10px] font-mono font-bold uppercase block" style={{ color: C.faint }}>Conversion Funnel</span>
                  <span className="text-base font-extrabold font-mono mt-0.5 block" style={{ color: C.warn }}>
                    {Number(project.conversionRate || 0.0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] block mt-0.5" style={{ color: C.muted }}>Traffic to checkout</span>
                </div>
              </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div
              className="w-full overflow-x-auto no-scrollbar scroll-smooth p-1.5 rounded-xl"
              style={{ background: C.sheet, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center gap-1.5 min-w-max">
                {[
                  { id: 'tasks', label: 'Daily Launch Checklist', count: `${completedTasksCount}/${totalTasksCount}` },
                  { id: 'scripts', label: 'Copyable Launch Content', count: `${schedule.length} items` },
                  { id: 'presales', label: 'Verified Pre-Orders', count: `${totalBackersCount}` },
                  { id: 'messages', label: 'Studio Chat & Messages', count: `${portalDisplayMessages.length}` },
                  { id: 'strategy', label: 'Validation Specs' },
                ].map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer"
                      style={
                        isActive
                          ? { background: C.crimson, color: '#ffffff', border: `1px solid ${C.crimsonLine}` }
                          : { background: 'transparent', color: C.muted, border: '1px solid transparent' }
                      }
                    >
                      <span>{tab.label}</span>
                      {tab.count && (
                        <span
                          className="text-[10px] px-1.5 py-0.2 rounded font-mono"
                          style={
                            isActive
                              ? { background: 'rgba(255,255,255,0.18)', color: '#ffffff' }
                              : { background: C.raised, color: C.body }
                          }
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2-Column Sprint Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left Column: Tab Content (8 of 12 cols) */}
              <div className="lg:col-span-8 space-y-6">

                {/* TAB 1: DAILY LAUNCH CHECKLIST */}
                {activeTab === 'tasks' && (
                  <div className="space-y-6">
                    {/* Today's Action Card */}
                    <div
                      className="rounded-2xl p-5 space-y-3 relative overflow-hidden"
                      style={{ background: C.sheet, border: `1.5px solid ${C.warnLine}` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                              style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warnLine}` }}
                            >
                              🔥 TODAY'S ACTION (DAY 2)
                            </span>
                            <span className="text-xs font-medium" style={{ color: C.muted }}>Instagram Stories • Pain Point Poll</span>
                          </div>
                          <h4 className="text-base font-bold" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                            Today: Post Instagram Story #2 (Pain Point Poll & Pre-Order Link)
                          </h4>
                          <p className="text-xs leading-relaxed" style={{ color: C.body }}>
                            Post the 3-story sequence with interactive poll sticker to drive warm audience to the pre-order page.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewDraftTask(schedule.find(t => t.day === 2) || schedule[0])}
                            className="cp-btn-quiet px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                          >
                            <Eye className="w-3.5 h-3.5" style={{ color: C.sky }} />
                            <span>View Draft</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleChecklist(schedule.find(t => t.day === 2)?.id || 'day-2')}
                            className="cp-btn-primary px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Mark Done</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Creator Launch Action Checklist */}
                    <div
                      className="rounded-2xl p-6 space-y-4"
                      style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                    >
                      <div
                        className="flex items-center justify-between pb-3"
                        style={{ borderBottom: `1px solid ${C.line}` }}
                      >
                        <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: C.text }}>
                          CREATOR LAUNCH ACTION CHECKLIST
                        </span>
                        <span
                          className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold"
                          style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                        >
                          {completedTasksCount} of {totalTasksCount} Completed
                        </span>
                      </div>

                      <div className="space-y-3">
                        {schedule.map(task => {
                          const isDone = Boolean(task.done || task.completed)
                          return (
                            <div
                              key={task.id}
                              className="p-4 rounded-xl transition-all flex items-start justify-between gap-3"
                              style={{
                                background: C.row,
                                border: `1px solid ${isDone ? C.okLine : C.line}`,
                                opacity: isDone ? 0.78 : 1,
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleChecklist(task.id)}
                                  className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0"
                                  style={
                                    isDone
                                      ? { background: C.ok, color: '#08090c', border: `1px solid ${C.ok}` }
                                      : { background: C.raised, border: `1px solid ${C.lineStrong}` }
                                  }
                                >
                                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold uppercase" style={{ color: C.crimsonText }}>
                                      DAY {task.day}
                                    </span>
                                    <span
                                      className="text-[10px] px-2 py-0.5 rounded font-mono"
                                      style={{ background: C.raised, color: C.sky, border: `1px solid ${C.line}` }}
                                    >
                                      {task.channel}
                                    </span>
                                  </div>
                                  <div
                                    className={`text-xs font-bold ${isDone ? 'line-through' : ''}`}
                                    style={{ color: isDone ? C.muted : C.text }}
                                  >
                                    {task.title}
                                  </div>
                                  <p className="text-[11px] leading-normal" style={{ color: C.muted }}>
                                    {task.description}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setViewDraftTask(task)}
                                className="cp-btn-quiet px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all duration-150 flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
                              >
                                <Eye className="w-3 h-3" style={{ color: C.sky }} />
                                <span>View Draft</span>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: COPYABLE LAUNCH CONTENT */}
                {activeTab === 'scripts' && (
                  <div
                    id="tour-portal-campaigns"
                    className="rounded-2xl p-6 space-y-5"
                    style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                  >
                    <div
                      className="flex items-center justify-between pb-3"
                      style={{ borderBottom: `1px solid ${C.line}` }}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                            Copyable Promotional Assets
                          </h3>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                            style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                          >
                            Audience-Grounded · Authentic Voice
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                          Every draft is derived directly from your verified channel uploads, channel bio, and community comments.
                        </p>
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth py-0.5">
                      <div className="flex items-center gap-1.5 min-w-max">
                        {[
                          { id: 'post', label: 'Announcement Post' },
                          { id: 'story', label: 'Instagram Stories (3-Part)' },
                          { id: 'video', label: 'Video Demo Hook' },
                          { id: 'email', label: 'Email Newsletter' },
                          { id: 'dm', label: 'VIP DM Outreach' },
                        ].map(st => {
                          const isScriptActive = activeScriptTab === st.id
                          return (
                            <button
                              key={st.id}
                              onClick={() => setActiveScriptTab(st.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                              style={
                                isScriptActive
                                  ? { background: C.crimson, color: '#ffffff', border: `1px solid ${C.crimsonLine}` }
                                  : { background: C.row, color: C.muted, border: `1px solid ${C.line}` }
                              }
                            >
                              {st.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      {activeScriptTab === 'email' && (
                        <div
                          className="p-2.5 rounded-xl text-xs flex items-center justify-between gap-2"
                          style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}`, color: C.body }}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: C.warn }} />
                            <span className="text-[11px]">
                              <strong style={{ color: C.warn }}>Anti-Spam Deliverability Guard:</strong> Formatted as a personal 1:1 plain-text email from you. 0 spam triggers, Primary Inbox delivery guaranteed.
                            </span>
                          </div>
                        </div>
                      )}
                      {activeScriptTab === 'video' && (
                        <div
                          className="p-2.5 rounded-xl text-xs flex items-center justify-between gap-2"
                          style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.body }}
                        >
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 shrink-0" style={{ color: C.crimsonText }} />
                            <span className="text-[11px]">
                              <strong style={{ color: C.crimsonText }}>Native Video Segment:</strong> Seamless mid-roll hook directly connecting the workflow problems discussed in your uploads to this software.
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Visual / Text Toggle */}
                        <div
                          className="flex items-center gap-0.5 p-0.5 rounded-lg text-xs"
                          style={{ background: C.row, border: `1px solid ${C.line}` }}
                        >
                          <button
                            type="button"
                            onClick={() => setPortalDraftViewMode('visual')}
                            className="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer"
                            style={
                              portalDraftViewMode === 'visual'
                                ? { background: C.raised, color: C.text, border: `1px solid ${C.lineStrong}` }
                                : { background: 'transparent', color: C.muted, border: '1px solid transparent' }
                            }
                          >
                            👁️ Visual Mockup Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setPortalDraftViewMode('text')}
                            className="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer"
                            style={
                              portalDraftViewMode === 'text'
                                ? { background: C.raised, color: C.text, border: `1px solid ${C.lineStrong}` }
                                : { background: 'transparent', color: C.muted, border: '1px solid transparent' }
                            }
                          >
                            📝 Raw Text Script
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const map = {
                              post: campaignKit.announcementPost || `🚨 Sourced from our recent channel discussions, we're officially co-founding ${productName} — ${project?.productTagline || 'the new workspace'}. Reserve your early founding pass here: ${preorderUrl}`,
                              story: campaignKit.storySequence || `STORY 1:\n"Quick poll for everyone watching my channel..."\n\nSTORY 2:\n"We have been secretly engineering ${productName}..."\n\nSTORY 3:\n"Grab founding access here: ${preorderUrl}"`,
                              video: campaignKit.videoScript || `HOOK (0-8s): "If you saw our recent channel breakdown, you know how painful manual bottlenecks are..."\nDEMO (8-40s): "Here is how ${productName} handles it automatically..."\nCTA (40-60s): "Founding pass link in bio: ${preorderUrl}"`,
                              email: campaignKit.newsletterDraft || `Subject: Why I'm co-founding ${productName} (private invite)\n\nHey everyone,\n\nWe are officially partnering with CoLaunch Studio to engineer ${productName}...\n\nReserve your pass: ${preorderUrl}`,
                              dm: campaignKit.directMessageScript || `Hey! Saw your thoughts on our channel earlier — we just launched early founding access for ${productName}: ${preorderUrl}`
                            }
                            copyToClipboard(map[activeScriptTab], activeScriptTab)
                          }}
                          className="cp-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedKey === activeScriptTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === activeScriptTab ? 'Copied!' : 'Copy Script Text'}</span>
                        </button>
                      </div>

                      {portalDraftViewMode === 'visual' ? (
                        <div className="p-3 sm:p-5 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                          <PostVisualMockup
                            type={
                              activeScriptTab === 'story'
                                ? 'story'
                                : activeScriptTab === 'video'
                                ? 'video'
                                : activeScriptTab === 'email'
                                ? 'newsletter'
                                : 'post'
                            }
                            project={project}
                            brandColor={C.crimson}
                            copyText={
                              activeScriptTab === 'story' ? (campaignKit.storySequence || '') :
                              activeScriptTab === 'video' ? (campaignKit.videoScript || '') :
                              activeScriptTab === 'email' ? (campaignKit.newsletterDraft || '') :
                              activeScriptTab === 'dm' ? (campaignKit.directMessageScript || '') :
                              (campaignKit.announcementPost || '')
                            }
                            preorderUrl={preorderUrl}
                          />
                        </div>
                      ) : (
                        <textarea
                          readOnly
                          rows={8}
                          value={
                            activeScriptTab === 'story' ? (campaignKit.storySequence || `STORY 1:\n"Quick question for everyone..."\n\nSTORY 2:\n"We have been secretly engineering ${productName}..."\n\nSTORY 3:\n"Grab founding access here: ${preorderUrl}"`) :
                            activeScriptTab === 'video' ? (campaignKit.videoScript || `HOOK (0-8s): "If you saw our recent channel breakdown, you know how painful manual bottlenecks are..."\nDEMO (8-40s): "Here is how ${productName} handles it automatically..."\nCTA (40-60s): "Link in bio for pre-order access: ${preorderUrl}"`) :
                            activeScriptTab === 'email' ? (campaignKit.newsletterDraft || `Subject: Why I'm co-founding ${productName} (private invite)\n\nHey everyone,\n\nWe are officially partnering with CoLaunch Studio to engineer ${productName}...\n\nReserve: ${preorderUrl}`) :
                            activeScriptTab === 'dm' ? (campaignKit.directMessageScript || `Hey! Saw you were asking about this on our channel — we just launched early founding access for ${productName}: ${preorderUrl}`) :
                            (campaignKit.announcementPost || `🚨 Big announcement! After hearing so many comments across our channel about the nightmare of manual workflows, we're officially building ${productName}.\n\nReserve your early pass now: ${preorderUrl}`)
                          }
                          className="w-full p-4 rounded-xl text-xs outline-none font-mono leading-relaxed resize-none select-all"
                          style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: VERIFIED PRE-ORDERS */}
                {activeTab === 'presales' && (
                  <div
                    className="rounded-2xl p-6 space-y-4"
                    style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                  >
                    <div
                      className="flex items-center justify-between pb-3"
                      style={{ borderBottom: `1px solid ${C.line}` }}
                    >
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                          Verified Backer Reservations ({totalBackersCount})
                        </h3>
                        <p className="text-xs" style={{ color: C.muted }}>
                          Live feed of audience pre-orders directly tied to your revenue share.
                        </p>
                      </div>
                      <span
                        className="text-xs font-mono font-bold px-2.5 py-1 rounded-md"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        ${presalesRevenue.toLocaleString()} Total Collected
                      </span>
                    </div>

                    {displayReservations.length === 0 ? (
                      <div
                        className="py-12 text-center text-xs rounded-xl space-y-3"
                        style={{ background: C.row, border: `1px dashed ${C.lineStrong}`, color: C.muted }}
                      >
                        <Users className="w-8 h-8 mx-auto" style={{ color: C.faint }} />
                        <p>No customer pre-orders recorded yet. Pledges will populate here as backers join.</p>
                        <button
                          type="button"
                          onClick={handleSimulatePreorder}
                          className="cp-btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Simulate First Pre-Order (+${dynamicPresalePrice})</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {displayReservations.map(res => (
                          <div
                            key={res.id}
                            className="p-3.5 rounded-xl flex items-center justify-between text-xs"
                            style={{ background: C.row, border: `1px solid ${C.line}` }}
                          >
                            <div>
                              <div className="font-bold" style={{ color: C.text }}>{res.name}</div>
                              <span className="text-[10px] font-mono" style={{ color: C.faint }}>{res.email}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold" style={{ color: C.ok }}>+${res.amount}</div>
                              <span className="text-[10px] font-mono" style={{ color: C.sky }}>{res.tier || dynamicPresaleTierName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: STUDIO CHAT & MESSAGES */}
                {activeTab === 'messages' && (
                  <div
                    id="tour-portal-chat"
                    className="rounded-2xl p-6 space-y-4"
                    style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                  >
                    <div
                      className="flex items-center justify-between pb-3"
                      style={{ borderBottom: `1px solid ${C.line}` }}
                    >
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                          Studio Chat & Co-Founder Dispatch
                        </h3>
                        <p className="text-xs" style={{ color: C.muted }}>
                          Direct operational communication channel with CoLaunch Studio.
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        ● Studio Online
                      </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {portalDisplayMessages.length === 0 ? (
                        <div className="text-center py-8 text-xs" style={{ color: C.muted }}>
                          No messages yet. Send a note to CoLaunch Studio below.
                        </div>
                      ) : (
                        portalDisplayMessages.map(msg => {
                          const isStudio = msg.sender === 'admin'
                          return (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-xl text-xs space-y-1 ${isStudio ? 'mr-8' : 'ml-8'}`}
                              style={
                                isStudio
                                  ? { background: C.row, border: `1px solid ${C.lineStrong}` }
                                  : { background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold" style={{ color: isStudio ? C.sky : C.crimsonText }}>
                                  {msg.senderName}
                                </span>
                                <span className="text-[10px] font-mono" style={{ color: C.faint }}>{msg.time}</span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: C.body }}>{msg.text}</p>
                            </div>
                          )
                        })
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    <form onSubmit={handleSendCreatorMessage} className="pt-2 flex gap-2">
                      <input
                        type="text"
                        value={creatorReplyText}
                        onChange={(e) => setCreatorReplyText(e.target.value)}
                        placeholder="Reply to CoLaunch Studio..."
                        className="flex-1 px-4 py-2.5 rounded-xl text-xs outline-none transition-all font-sans"
                        style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }}
                      />
                      <button
                        type="submit"
                        disabled={isSendingReply || !creatorReplyText.trim()}
                        className="cp-btn-primary px-4 py-2.5 rounded-xl disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 5: VALIDATION SPECS & STRATEGY */}
                {activeTab === 'strategy' && (
                  <div
                    className="rounded-2xl p-6 space-y-4"
                    style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                  >
                    <div className="pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <h3 className="font-bold text-sm" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                        Validation Strategy & Economic Model
                      </h3>
                      <p className="text-xs" style={{ color: C.muted }}>
                        Commercial parameters and minimum gate thresholds required to proceed to Phase 2 Build.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl space-y-1.5" style={{ background: C.row, border: `1px solid ${C.okLine}` }}>
                        <span className="font-bold" style={{ color: C.ok }}>Commercial Split</span>
                        <p className="leading-relaxed" style={{ color: C.body }}>
                          Equal 50/50 profit share paid on all monthly recurring subscriptions and founding pre-orders.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl space-y-1.5" style={{ background: C.row, border: `1px solid ${C.skyLine}` }}>
                        <span className="font-bold" style={{ color: C.sky }}>Gate Threshold</span>
                        <p className="leading-relaxed" style={{ color: C.body }}>
                          ${presaleTarget.toLocaleString()} in verified pre-orders unlocks production engineering and beta hosting.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: PREVIEW DECK - SPRINT SUMMARY (4 of 12 cols) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
                <div
                  className="rounded-2xl p-6 space-y-6"
                  style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                >
                  <div
                    className="flex items-center justify-between pb-3"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: C.crimsonText }}>
                        PREVIEW DECK
                      </span>
                      <h3 className="text-sm font-bold tracking-tight" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                        SPRINT SUMMARY
                      </h3>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"
                      style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.ok }} />
                      <span>Live Spec</span>
                    </span>
                  </div>

                  {/* Spec Sheet Table */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span style={{ color: C.muted }}>Venture Partner</span>
                      <span className="font-bold" style={{ color: C.text }}>{creatorName}</span>
                    </div>
                    <div className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span style={{ color: C.muted }}>Validation Gate</span>
                      <span className="font-mono font-bold" style={{ color: C.warn }}>${presaleTarget.toLocaleString()} Target</span>
                    </div>
                    <div className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span style={{ color: C.muted }}>Presale Price Point</span>
                      <span className="font-mono font-bold" style={{ color: C.sky }}>${dynamicPresalePrice} {dynamicPresaleTierName}</span>
                    </div>
                    <div className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span style={{ color: C.muted }}>Backers Needed for Gate</span>
                      <span className="font-mono font-bold" style={{ color: C.ok }}>~{backersNeededForGate.toLocaleString()} Pre-Orders</span>
                    </div>
                    <div className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span style={{ color: C.muted }}>Co-Founder Split</span>
                      <span className="font-mono font-bold" style={{ color: C.violet }}>50% / 50% Irrevocable</span>
                    </div>
                    <div className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span style={{ color: C.muted }}>Launch Timeline</span>
                      <span className="font-bold" style={{ color: C.text }}>{sprintTotalDays} Days of Structured Posts</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span style={{ color: C.muted }}>Your Current 50% Pool</span>
                      <span className="font-mono font-black" style={{ color: C.ok }}>${creatorRevenueShare.toLocaleString()} USD</span>
                    </div>
                  </div>

                  {/* Better Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {!isDiyActive && (
                      <button
                        type="button"
                        onClick={() => setShowDiyModal(true)}
                        className="cp-btn-primary w-full py-3 px-4 rounded-xl font-bold text-xs tracking-tight transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <Zap className="w-4 h-4" style={{ color: C.warn }} />
                        <span>Unlock Interactive Pass (${cobuilderPrice} USD)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSimulatePreorder}
                      className="cp-btn-quiet w-full py-3.5 px-4 rounded-xl font-bold text-xs tracking-tight transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" style={{ color: C.ok }} />
                      <span>Simulate Backer Pre-Order (+${dynamicPresalePrice})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewDraftTask(schedule.find(t => t.day === 2) || schedule[0])}
                      className="cp-btn-quiet w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Eye className="w-4 h-4" style={{ color: C.sky }} />
                      <span>View Today's Story Assets</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-center leading-relaxed" style={{ color: C.faint }}>
                    Real-time telemetry connected to {creatorName} payment gateway webhook.
                  </p>

                  <div
                    className="pt-2 flex items-center justify-between text-[11px] font-mono"
                    style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
                  >
                    <span>Venture Spec:</span>
                    <button
                      type="button"
                      onClick={() => setShowAgreementModal(true)}
                      className="font-bold flex items-center gap-1 cursor-pointer hover:underline transition-colors"
                      style={{ color: C.sky }}
                    >
                      <FileText className="w-3 h-3" />
                      <span>CF-5050 Agreement (50/50)</span>
                    </button>
                  </div>

                  {/* Settlement Banner */}
                  <div
                    className="p-3.5 rounded-xl text-[11px] space-y-1"
                    style={{ background: C.row, border: `1px solid ${C.okLine}`, color: C.body }}
                  >
                    <div className="flex items-center gap-1.5 font-bold" style={{ color: C.text }}>
                      <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: C.ok }} />
                      <span>Automated 50/50 Settlement</span>
                    </div>
                    <p className="leading-relaxed text-[10.5px]" style={{ color: C.muted }}>
                      Presale revenues automatically deposit 50% directly into your verified partner bank ledger via Stripe Connect.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ── VIEW DRAFT MODAL ────────────────────────────────────────────────────── */}
      {viewDraftTask && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4"
          style={{ background: 'rgba(8,9,12,0.82)' }}
        >
          <div
            className="max-w-lg w-full rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: C.sheet, border: `1px solid ${C.lineStrong}` }}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase" style={{ color: C.crimsonText }}>
                  DAY {viewDraftTask.day} • {viewDraftTask.channel}
                </span>
                <h3 className="text-base font-bold mt-0.5" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                  {viewDraftTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDraftTask(null)}
                className="p-1.5 rounded-lg cursor-pointer transition-colors"
                style={{ color: C.muted, background: C.row, border: `1px solid ${C.line}` }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: C.body }}>{viewDraftTask.description}</p>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold block" style={{ color: C.faint }}>
                Copyable Copy
              </span>
              <textarea
                readOnly
                rows={6}
                value={getTaskDraftContent(viewDraftTask)}
                className="w-full p-3.5 rounded-xl text-xs outline-none font-mono leading-relaxed resize-none select-all"
                style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(getTaskDraftContent(viewDraftTask), 'draft')}
                className="cp-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all"
              >
                {copiedKey === 'draft' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'draft' ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewDraftTask(null)}
                className="cp-btn-quiet px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CF-5050 CO-FOUNDER AGREEMENT SPEC MODAL ─────────────────────────────── */}
      {showAgreementModal && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4"
          style={{ background: 'rgba(8,9,12,0.82)' }}
        >
          <div
            className="max-w-xl w-full rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5"
            style={{ background: C.sheet, border: `1px solid ${C.lineStrong}`, color: C.text }}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div>
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block"
                  style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                >
                  LEGAL CHARTER SPECIFICATION • VERIFIED
                </span>
                <h3 className="text-base sm:text-lg font-bold mt-1.5" style={{ color: C.text, fontFamily: HEADING_FONT }}>
                  Equal 50/50 Co-Founder Equity Agreement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="p-1.5 rounded-lg cursor-pointer transition-colors"
                style={{ color: C.muted, background: C.row, border: `1px solid ${C.line}` }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl"
              style={{ background: C.row, border: `1px solid ${C.line}` }}
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase block" style={{ color: C.crimsonText }}>
                  PARTNER A (STUDIO)
                </span>
                <span className="font-bold block mt-0.5" style={{ color: C.text }}>CoLaunch Studio</span>
                <span className="text-[11px] block" style={{ color: C.muted }}>Engineering, Hosting, AI Architecture</span>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase block" style={{ color: C.sky }}>
                  PARTNER B (CREATOR)
                </span>
                <span className="font-bold block mt-0.5" style={{ color: C.text }}>{creatorName}</span>
                <span className="text-[11px] block" style={{ color: C.muted }}>Audience, Co-Marketing, Feedback</span>
              </div>
            </div>

            <div className="space-y-3 text-xs max-h-64 overflow-y-auto pr-1" style={{ color: C.body }}>
              <div className="p-3 rounded-xl space-y-1" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                <span className="font-bold" style={{ color: C.ok }}>1. Equal 50/50 Gross Net Revenue Division</span>
                <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
                  All gross revenue generated from founding presales, monthly/annual software subscriptions, and add-on modules is divided exactly 50% to CoLaunch Studio and 50% to {creatorName}.
                </p>
              </div>
              <div className="p-3 rounded-xl space-y-1" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                <span className="font-bold" style={{ color: C.sky }}>2. Irrevocable Automated Settlement</span>
                <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
                  Payouts are handled through automated payment gateway webhooks (Stripe Connect). The creator's 50% share is routed directly to the verified partner ledger without artificial holding periods.
                </p>
              </div>
              <div className="p-3 rounded-xl space-y-1" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                <span className="font-bold" style={{ color: C.violet }}>3. Full Engineering & Technical Provisioning</span>
                <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
                  The studio assumes 100% responsibility for infrastructure, code deployments, LLM token provisioning, database scaling, and technical bug fixes.
                </p>
              </div>
              <div className="p-3 rounded-xl space-y-1" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                <span className="font-bold" style={{ color: C.warn }}>4. Mutual Commercial IP & Transparency</span>
                <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
                  Both parties maintain transparent visibility into real-time telemetry, transaction volumes, backer accounts, and sprint progress.
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: C.ok }}>
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Legal Charter v2.4</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="cp-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
              >
                Close Spec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIY SUBSCRIPTION MODAL ── */}
      <DIYSubscriptionModal
        isOpen={showDiyModal}
        onClose={() => setShowDiyModal(false)}
        project={project}
        passPrice={cobuilderPrice}
        onUnlockSuccess={handleUnlockDiySuccess}
      />
    </div>
  )
}
