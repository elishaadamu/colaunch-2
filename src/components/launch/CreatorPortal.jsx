import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Rocket, Check, Copy, Eye, Send, FileText, ExternalLink, Menu, X, Users,
  Zap, Share2, Sparkles, Plus,
} from 'lucide-react'
import { getFrontendUrl, updateCoLaunchProject, getCoLaunchProject, getThreads, getWorkflowState } from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'
import { CreatorPortalSkeleton } from './Section2Skeletons'
import { deduplicateAndSortMessages } from './CreatorWhatsAppChat'
import ProjectOS from './ProjectOS'
import DIYSubscriptionModal from './DIYSubscriptionModal'
import PostVisualMockup from './PostVisualMockup'
import { getPhase1StepGuards, getPhase2StepGuards, getPhase3StepGuards } from '../../utils/stepGuards'
import { parseMainPricingAmount, parseConceptPricing } from '../../utils/pricing'
import { startCreatorPortalPrePaymentTour, startCreatorPortalPostPaymentTour } from '../../utils/driverTour'
import { RETRO_GAMING_PROJECT } from './ProjectOSPage'

/**
 * CreatorPortal: the creator's Command Center.
 * Design: "Command Center" — one calm page, one number that matters (presales vs goal),
 * a single progress strip, four tabs, and a slim summary column.
 * Props, handlers and data loading are unchanged from the previous version.
 */

const C = {
  bg: '#08090c',
  sheet: '#10131a',
  row: '#0c0e13',
  raised: '#171b24',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#f3f4f6',
  body: '#d3d7e0',
  muted: '#a3a9b6',
  faint: '#7b8190',
  crimson: '#c81e3c',
  crimsonHover: '#d92a49',
  crimsonSoft: 'rgba(200,30,60,0.14)',
  crimsonLine: 'rgba(200,30,60,0.42)',
  crimsonText: '#ff8fa3',
  ok: '#6fcf9b',
  okSoft: 'rgba(111,207,155,0.12)',
  okLine: 'rgba(111,207,155,0.36)',
  warn: '#f0b46a',
  warnSoft: 'rgba(240,180,106,0.12)',
  warnLine: 'rgba(240,180,106,0.36)',
}

const HEADING_FONT = "'Instrument Serif', Georgia, serif"

const PORTAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
.cp-root{font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.cp-root .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-0.01em}
.cp-root .num{font-variant-numeric:tabular-nums}
.cp-root :focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
.cp-root .cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;border-radius:.625rem;font-weight:600;font-size:.875rem;padding:.55rem 1rem;min-height:2.5rem;cursor:pointer;white-space:nowrap;border:1px solid transparent;transition:background-color .15s,border-color .15s,color .15s}
.cp-root .cp-btn:disabled{opacity:.45;cursor:not-allowed}
.cp-root .cp-btn-primary{background:${C.crimson};color:#fff}
.cp-root .cp-btn-primary:hover:not(:disabled){background:${C.crimsonHover}}
.cp-root .cp-btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.cp-root .cp-btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.cp-root .cp-btn-sm{min-height:2.125rem;padding:.35rem .75rem;font-size:.8125rem}
.cp-root .cp-card{background:${C.sheet};border:1px solid ${C.line};border-radius:1rem}
.cp-root .cp-tab{padding:.7rem .25rem;margin-right:1.5rem;font-size:.9375rem;font-weight:500;color:${C.muted};border-bottom:2px solid transparent;cursor:pointer;background:none;transition:color .15s,border-color .15s;white-space:nowrap}
.cp-root .cp-tab:hover{color:${C.text}}
.cp-root .cp-tab[aria-selected="true"]{color:${C.text};border-bottom-color:${C.crimson}}
.cp-root .cp-chip{padding:.35rem .8rem;border-radius:999px;font-size:.8125rem;font-weight:500;color:${C.muted};background:${C.row};border:1px solid ${C.line};cursor:pointer;white-space:nowrap;transition:color .15s,border-color .15s}
.cp-root .cp-chip:hover{color:${C.text};border-color:${C.lineStrong}}
.cp-root .cp-chip[aria-pressed="true"]{background:${C.crimson};border-color:${C.crimson};color:#fff}
.cp-root .cp-track{transition:border-color .15s}
.cp-root .cp-track:hover{border-color:${C.lineStrong}}
.cp-root .cp-fade{animation:cp-fade .18s ease-out}
@keyframes cp-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.cp-root details>summary{list-style:none;cursor:pointer}
.cp-root details>summary::-webkit-details-marker{display:none}
.cp-root .no-scrollbar{scrollbar-width:none}
.cp-root .no-scrollbar::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.cp-root *{animation:none!important;transition:none!important}}
`

/* ── Small building blocks ───────────────────────────────────────────────── */
function Stat({ label, value, note, id }) {
  return (
    <div id={id} className="min-w-0">
      <dt className="text-sm" style={{ color: C.muted }}>{label}</dt>
      <dd className="m-0 mt-1 text-2xl font-semibold num truncate" style={{ color: C.text }}>{value}</dd>
      {note && <p className="m-0 mt-0.5 text-[13px]" style={{ color: C.faint }}>{note}</p>}
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
      <dt className="text-sm" style={{ color: C.muted }}>{label}</dt>
      <dd className="m-0 text-sm font-medium text-right num" style={{ color: C.text }}>{value}</dd>
    </div>
  )
}

function Empty({ icon: Icon, title, children }) {
  return (
    <div className="py-12 px-6 text-center rounded-xl" style={{ background: C.row, border: `1px dashed ${C.lineStrong}` }}>
      {Icon && <Icon className="w-6 h-6 mx-auto mb-3" style={{ color: C.faint }} aria-hidden="true" />}
      <p className="m-0 text-base font-medium" style={{ color: C.text }}>{title}</p>
      {children && <div className="mt-1 text-sm" style={{ color: C.muted }}>{children}</div>}
    </div>
  )
}

function ModalShell({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,9,12,0.82)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cp-modal-title"
        className={`cp-card cp-fade w-full ${wide ? 'max-w-xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}
        style={{ borderColor: C.lineStrong }}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="min-w-0">
            {subtitle && <p className="m-0 text-sm" style={{ color: C.muted }}>{subtitle}</p>}
            <h3 id="cp-modal-title" className="serif m-0 text-2xl leading-tight" style={{ color: C.text }}>{title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="cp-btn cp-btn-quiet cp-btn-sm" style={{ padding: '.35rem' }}>
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
        {footer && <div className="p-4 flex items-center justify-end gap-2" style={{ borderTop: `1px solid ${C.line}` }}>{footer}</div>}
      </div>
    </div>
  )
}

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
  }, [portalId, slug])

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
      if (v === 'projectos' || v === 'pipeline' || v === 'workspace') {
        return 'projectos'
      }
      if (v === 'launch_kit') return 'launch_kit'
    }
    return 'launch_kit'
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

  // Only switch view if explicitly requested in URL query
  const hasAutoSwitchedToProjectOS = useRef(false)
  useEffect(() => {
    if (!hasAutoSwitchedToProjectOS.current) {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search)
        const v = sp.get('view')
        if (v === 'projectos' || v === 'workspace') {
          setActiveMainView('projectos')
        }
      }
      hasAutoSwitchedToProjectOS.current = true
    }
  }, [])

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
    if (task.draftKey === 'storySequence') return ck.storySequence || ''
    if (task.draftKey === 'videoScript') return ck.videoScript || ''
    if (task.draftKey === 'newsletterDraft') return ck.newsletterDraft || ''
    if (task.draftKey === 'directMessageScript') return ck.directMessageScript || ''
    return ck.announcementPost || ''
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
  const presaleTarget = derivedPlanTarget > 0 ? derivedPlanTarget : Number(project?.presaleTarget || project?.targetRevenue || 0)
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
  // Only real, recorded reservations are listed. Nothing is invented from revenue totals.
  const displayReservations = reservations

  // Close dialogs with Escape (must stay above the early returns below)
  useEffect(() => {
    if (!viewDraftTask && !showAgreementModal) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setViewDraftTask(null)
        setShowAgreementModal(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewDraftTask, showAgreementModal])

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
    : (project?.checklist && project.checklist.length > 0 ? project.checklist : [])
  const completedTasksCount = schedule.filter(t => t.done || t.completed).length
  const totalTasksCount = schedule.length
  const planDays = parseInt(String(project?.validationPlan?.period || '').replace(/[^0-9]/g, ''), 10)
  const sprintTotalDays = planDays > 0 ? planDays : (schedule.length > 0 ? schedule.length : (Number(project?.sprintDuration) || null))
  const projectCreatedTime = project?.created_at ? new Date(project.created_at).getTime() : Date.now()
  const daysElapsed = Math.max(0, Math.floor((Date.now() - projectCreatedTime) / (1000 * 60 * 60 * 24)))
  const daysRemaining = sprintTotalDays ? Math.max(0, sprintTotalDays - daysElapsed) : null
  const preorderUrl = `${getFrontendUrl()}/preorder?ref=${project?.creatorHandle?.replace('@','') || 'creator'}`
  const targetPct = presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 0

  // Derived for the new layout
  const visitorsCount = Number(project?.visitors ?? project?.telemetry?.visitors ?? 0)
  const conversionLabel = visitorsCount > 0 ? `${Number(project?.conversionRate || 0).toFixed(1)}%` : '—'
  const isTaskDone = (t) => Boolean(t.done || t.completed)
  const todayTask = schedule.find((t) => !isTaskDone(t) && t.isToday) || schedule.find((t) => !isTaskDone(t)) || null
  const upNextTasks = schedule.filter((t) => !isTaskDone(t) && t !== todayTask)
  const doneTasks = schedule.filter(isTaskDone)
  const phaseName = currentPhase === 1 ? 'Validate' : currentPhase === 2 ? 'Build MVP' : 'Launch'
  const doneStepCount = activePhaseSteps.filter((s) => s.isDone).length
  const scriptText = {
    post: campaignKit.announcementPost || '',
    story: campaignKit.storySequence || '',
    video: campaignKit.videoScript || '',
    email: campaignKit.newsletterDraft || '',
    dm: campaignKit.directMessageScript || '',
  }
  // Test tools stay out of the creator's view unless explicitly enabled with ?simulate=1
  const hasPrice = Boolean(
    project?.selectedConcept?.pricing || project?.pricing || project?.validationPlan?.pricing ||
    project?.campaignKit?.pricingTiers?.[0]?.price || project?.campaignKit?.foundingPrice ||
    project?.presalePrice || project?.earlyBirdPrice
  )
  const showSimTools = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('simulate') === '1'

  const trackLabel = isDiyActive ? 'Co-Builder' : 'Studio-managed'
  const shareLabel = isDiyActive ? 'Revenue pool' : 'Your 50% share'
  const shareValue = isDiyActive ? presalesRevenue : creatorRevenueShare
  const hasTarget = presaleTarget > 0
  const stepsForStrip = activePhaseSteps.map((s, i) => ({
    ...s,
    state: isTrackChoicePending ? 'upcoming' : s.isDone ? 'done' : i === resolvedActiveStepIndex ? 'active' : 'upcoming',
  }))

  const TABS = [
    { id: 'tasks', label: 'Tasks', count: totalTasksCount > 0 ? `${completedTasksCount}/${totalTasksCount}` : null },
    { id: 'scripts', label: 'Content' },
    { id: 'presales', label: 'Pre-orders', count: totalBackersCount > 0 ? totalBackersCount : null },
    { id: 'messages', label: 'Messages', count: portalDisplayMessages.length > 0 ? portalDisplayMessages.length : null },
  ]
  const SCRIPTS = [
    { id: 'post', label: 'Announcement post' },
    { id: 'story', label: 'Stories' },
    { id: 'video', label: 'Video hook' },
    { id: 'email', label: 'Email' },
    { id: 'dm', label: 'Direct message' },
  ]
  const activeScriptText = scriptText[activeScriptTab] || ''

  const openCoBuilderWorkspace = () => {
    setTrackChoiceDismissed(true)
    setActiveMainView('projectos')
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.delete('offer')
      searchParams.delete('track')
      const newSearch = searchParams.toString()
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash)
    }
  }

  const upgradeRow = !isDiyActive && !isTrackChoicePending && (
    <div
      id="tour-portal-track-card"
      className="cp-card px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <p className="m-0 text-sm" style={{ color: C.body }}>
        <span className="font-semibold" style={{ color: C.text }}>Want to run the build yourself?</span>{' '}
        The Co-Builder pass gives you the AI build tools and workspace. The 50/50 split stays the same.
      </p>
      <button id="tour-portal-unlock-btn" type="button" onClick={() => setShowDiyModal(true)} className="cp-btn cp-btn-quiet cp-btn-sm shrink-0">
        <Zap className="w-3.5 h-3.5" style={{ color: C.warn }} aria-hidden="true" />
        <span>Get the pass (${cobuilderPrice})</span>
      </button>
    </div>
  )

  return (
    <div className="cp-root min-h-screen flex flex-col" style={{ backgroundColor: C.bg, color: C.text }}>
      <style>{PORTAL_CSS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header id="tour-portal-header" className="sticky top-0 z-40" style={{ background: C.sheet, borderBottom: `1px solid ${C.line}` }}>
        <div className="max-w-[1180px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: C.raised, border: `1px solid ${C.lineStrong}` }}>
              {resolvedAvatar && !avatarLoadError ? (
                <img src={resolvedAvatar} alt="" className="w-full h-full object-cover" onError={() => setAvatarLoadError(true)} />
              ) : (
                <span className="font-semibold text-sm" style={{ color: C.crimsonText }}>{(creatorName || 'C').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="serif m-0 text-xl truncate" style={{ color: C.text }}>{productName}</p>
              <p className="m-0 text-[13px] truncate hidden sm:block" style={{ color: C.muted }}>with {creatorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isTrackChoicePending && (
              <div role="group" aria-label="View" className="flex items-center p-1 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                {[{ id: 'launch_kit', label: 'Launch kit', short: 'Kit' }, { id: 'projectos', label: 'Project OS', short: 'OS' }].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={activeMainView === v.id}
                    onClick={() => setActiveMainView(v.id)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                    style={activeMainView === v.id ? { background: C.crimson, color: '#fff' } : { color: C.muted }}
                  >
                    <span className="sm:hidden">{v.short}</span>
                    <span className="hidden sm:inline">{v.label}</span>
                  </button>
                ))}
              </div>
            )}

            <span
              id="tour-portal-badge"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium"
              style={{ color: C.body, border: `1px solid ${C.line}`, background: C.row }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDiyActive ? C.ok : C.faint }} aria-hidden="true" />
              {isTrackChoicePending ? 'Choose a track' : trackLabel}
            </span>

            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isMobileNavOpen}
                aria-label="More"
                onClick={() => setIsMobileNavOpen((p) => !p)}
                className="cp-btn cp-btn-quiet cp-btn-sm"
                style={{ padding: '.35rem .6rem' }}
              >
                {isMobileNavOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
              </button>
              {isMobileNavOpen && (
                <>
                  <button type="button" aria-label="Close menu" tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setIsMobileNavOpen(false)} />
                  <div role="menu" className="cp-card cp-fade absolute right-0 top-full mt-2 w-64 z-50 p-1.5" style={{ borderColor: C.lineStrong }}>
                    <button role="menuitem" type="button" className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 cursor-pointer hover:bg-white/5"
                      style={{ color: C.body }}
                      onClick={() => { setIsMobileNavOpen(false); isDiyActive ? startCreatorPortalPostPaymentTour(true) : startCreatorPortalPrePaymentTour(true) }}>
                      <Sparkles className="w-4 h-4" aria-hidden="true" /> Take the tour
                    </button>
                    <button role="menuitem" type="button" className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 cursor-pointer hover:bg-white/5"
                      style={{ color: C.body }}
                      onClick={() => { setIsMobileNavOpen(false); copyToClipboard(window.location.href, 'portal-link') }}>
                      <Share2 className="w-4 h-4" aria-hidden="true" /> Copy portal link
                    </button>
                    <a role="menuitem" href={preorderUrl} target="_blank" rel="noreferrer" className="w-full px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 hover:bg-white/5"
                      style={{ color: C.body }} onClick={() => setIsMobileNavOpen(false)}>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" /> Open pre-order page
                    </a>
                    <button role="menuitem" type="button" className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 cursor-pointer hover:bg-white/5"
                      style={{ color: C.body }}
                      onClick={() => { setIsMobileNavOpen(false); setShowAgreementModal(true) }}>
                      <FileText className="w-4 h-4" aria-hidden="true" /> 50/50 agreement
                    </button>
                    {!isDiyActive && (
                      <button role="menuitem" type="button" className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 cursor-pointer hover:bg-white/5"
                        style={{ color: C.text }}
                        onClick={() => { setIsMobileNavOpen(false); setShowDiyModal(true) }}>
                        <Zap className="w-4 h-4" style={{ color: C.warn }} aria-hidden="true" /> Co-Builder pass (${cobuilderPrice})
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {toast && (
        <div role="status" className="cp-fade fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl flex items-center gap-2"
          style={{ background: C.raised, color: C.text, border: `1px solid ${C.okLine}` }}>
          <Check className="w-4 h-4" style={{ color: C.ok }} aria-hidden="true" />
          <span>{toast}</span>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Progress strip ───────────────────────────────────────────────── */}
        <section aria-label="Project progress" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="serif m-0 text-3xl" style={{ color: C.text }}>
              {isTrackChoicePending ? 'Choose how to build' : `Phase ${currentPhase} of 3: ${phaseName}`}
            </h1>
            <p className="m-0 text-sm" style={{ color: C.muted }}>
              {isTrackChoicePending ? 'Pick a track to start' : `${doneStepCount} of ${activePhaseSteps.length} steps done`}
            </p>
          </div>
          <ol className="m-0 p-0 list-none flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {stepsForStrip.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2 shrink-0" aria-current={s.state === 'active' ? 'step' : undefined}>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold num"
                  style={
                    s.state === 'done' ? { background: C.ok, color: '#08090c' }
                    : s.state === 'active' ? { background: C.crimson, color: '#fff' }
                    : { border: `1px solid ${C.lineStrong}`, color: C.muted }
                  }
                >
                  {s.state === 'done' ? <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" /> : i + 1}
                </span>
                <span className="text-sm" style={{ color: s.state === 'upcoming' ? C.muted : C.text, fontWeight: s.state === 'active' ? 600 : 500 }}>
                  {s.fullLabel || s.label}
                </span>
                {i < stepsForStrip.length - 1 && <span className="w-5 h-px" style={{ background: s.state === 'done' ? C.ok : C.lineStrong }} aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </section>

        {upgradeRow}

        {isTrackChoicePending ? (
          /* ── Track choice ─────────────────────────────────────────────── */
          <section aria-label="Choose a track" className="space-y-5">
            <p className="m-0 text-base max-w-2xl" style={{ color: C.body }}>
              Both tracks split revenue 50/50 with {creatorName}. The difference is who does the building.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                className="cp-card cp-track p-6 flex flex-col gap-5 cursor-pointer"
                onClick={() => setSelectedTrack('interactive')}
                style={{ borderColor: selectedTrack === 'interactive' ? C.crimsonLine : C.line }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="serif m-0 text-3xl leading-tight">Build it with us</h2>
                    <p className="m-0 mt-1 text-sm" style={{ color: C.muted }}>Co-Builder pass</p>
                  </div>
                  <p className="m-0 text-right">
                    <span className="serif text-4xl num">${cobuilderPrice}</span>
                    <span className="block text-[13px]" style={{ color: C.muted }}>one-time</span>
                  </p>
                </div>
                <ul className="m-0 p-0 list-none space-y-2.5 text-[15px]" style={{ color: C.body }}>
                  {['Run the build sprints yourself with the AI tools', 'Your own workspace and GitHub access', 'Direct control of Phases 1 to 3'].map((t) => (
                    <li key={t} className="flex gap-2.5"><Check className="w-4 h-4 mt-1 shrink-0" style={{ color: C.ok }} aria-hidden="true" /><span>{t}</span></li>
                  ))}
                </ul>
                <button
                  id="tour-portal-unlock-btn"
                  type="button"
                  className="cp-btn cp-btn-primary mt-auto w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isDiyActive) { openCoBuilderWorkspace() } else { setSelectedTrack('interactive'); setShowDiyModal(true) }
                  }}
                >
                  {isDiyActive ? 'Open your workspace' : `Get the Co-Builder pass ($${cobuilderPrice})`}
                </button>
              </div>

              <div
                className="cp-card cp-track p-6 flex flex-col gap-5 cursor-pointer"
                onClick={() => setSelectedTrack('managed')}
                style={{ borderColor: selectedTrack === 'managed' ? C.crimsonLine : C.line }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="serif m-0 text-3xl leading-tight">We build it for you</h2>
                    <p className="m-0 mt-1 text-sm" style={{ color: C.muted }}>Studio-managed</p>
                  </div>
                  <p className="m-0 text-right">
                    <span className="serif text-4xl num">$0</span>
                    <span className="block text-[13px]" style={{ color: C.muted }}>upfront</span>
                  </p>
                </div>
                <ul className="m-0 p-0 list-none space-y-2.5 text-[15px]" style={{ color: C.body }}>
                  {['Studio engineers handle the build, hosting and fixes', 'Follow progress and review milestones', 'Nothing to set up on your side'].map((t) => (
                    <li key={t} className="flex gap-2.5"><Check className="w-4 h-4 mt-1 shrink-0" style={{ color: C.ok }} aria-hidden="true" /><span>{t}</span></li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="cp-btn cp-btn-quiet mt-auto w-full"
                  onClick={(e) => { e.stopPropagation(); setSelectedTrack('managed'); handleDeclineDiyOffer() }}
                >
                  Continue with studio-managed
                </button>
              </div>
            </div>
            <p className="m-0 text-sm" style={{ color: C.muted }}>
              <button type="button" onClick={() => setShowAgreementModal(true)} className="underline underline-offset-2 cursor-pointer" style={{ color: C.body }}>
                Read the 50/50 agreement
              </button>
            </p>
          </section>
        ) : activeMainView === 'projectos' ? (
          /* ── Project OS ───────────────────────────────────────────────── */
          isDiyActive ? (
            <div id="tour-portal-workspace">
              <ProjectOS project={project} onUpdateProject={handleUpdateProject} userRole="creator" isDIY={isDiyActive} />
            </div>
          ) : (
            <section className="cp-card p-6 space-y-6" aria-label="Studio progress">
              <div>
                <h2 className="serif m-0 text-3xl">The studio is building {productName}</h2>
                <p className="m-0 mt-2 max-w-2xl" style={{ color: C.body }}>
                  You chose the studio-managed track, so the CoLaunch team handles development and deployment. Follow each phase below.
                </p>
              </div>
              <ul className="m-0 p-0 list-none">
                {[
                  { n: 1, name: 'Validate', text: 'Test whether people will pay before anything is built.', state: currentPhase > 1 ? 'Done' : 'In progress', on: currentPhase === 1 },
                  { n: 2, name: 'Build MVP', text: 'Engineers build the first working version.', state: currentPhase > 2 ? 'Done' : currentPhase === 2 ? 'In progress' : 'Up next', on: currentPhase === 2 },
                  { n: 3, name: 'Launch', text: 'Go live with checkout and subscriptions.', state: currentPhase === 3 ? 'In progress' : 'Up next', on: currentPhase === 3 },
                ].map((p) => (
                  <li key={p.n} className="py-4 flex items-start justify-between gap-4" style={{ borderTop: `1px solid ${C.line}` }}>
                    <div>
                      <p className="m-0 font-semibold" style={{ color: C.text }}>Phase {p.n}: {p.name}</p>
                      <p className="m-0 text-sm" style={{ color: C.muted }}>{p.text}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0" style={{ color: p.state === 'Done' ? C.ok : p.on ? C.crimsonText : C.muted }}>{p.state}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.line}` }}>
                <p className="m-0 text-sm" style={{ color: C.muted }}>Your daily posts and ready-to-copy content are in the launch kit.</p>
                <button type="button" onClick={() => setActiveMainView('launch_kit')} className="cp-btn cp-btn-primary">Open launch kit</button>
              </div>
            </section>
          )
        ) : (
          /* ── Launch kit ───────────────────────────────────────────────── */
          <>
            <section className="cp-card p-5 sm:p-6 space-y-5" aria-label="Validation goal">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="m-0 text-sm" style={{ color: C.muted }}>Pre-orders so far</p>
                  <p className="m-0 mt-1">
                    <span className="serif text-5xl num" style={{ color: C.text }}>${presalesRevenue.toLocaleString()}</span>
                    {hasTarget && <span className="text-lg ml-2" style={{ color: C.muted }}>of ${presaleTarget.toLocaleString()} goal</span>}
                  </p>
                </div>
                {hasTarget
                  ? <p className="m-0 text-base font-semibold num" style={{ color: targetPct >= 100 ? C.ok : C.text }}>{targetPct}% of goal</p>
                  : <p className="m-0 text-sm" style={{ color: C.warn }}>No goal set yet. Your studio contact will confirm it.</p>}
              </div>
              {hasTarget && (
                <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={targetPct} aria-label="Progress to presale goal"
                  className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: C.raised }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${targetPct}%`, background: targetPct >= 100 ? C.ok : C.crimson }} />
                </div>
              )}
              <dl className="m-0 pt-5 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5" style={{ borderTop: `1px solid ${C.line}` }}>
                <Stat id="tour-portal-equity" label={shareLabel} value={`$${shareValue.toLocaleString()}`} note={isDiyActive ? 'All presales' : 'Estimate, before fees'} />
                <Stat label="Pre-orders" value={totalBackersCount} note={hasPrice ? `$${dynamicPresalePrice} per pre-order` : 'Price not set'} />
                <Stat label="Conversion" value={conversionLabel} note={visitorsCount > 0 ? `${visitorsCount.toLocaleString()} visitors` : 'No visits recorded yet'} />
                <Stat label="Time left" value={daysRemaining === null ? '—' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`} note={sprintTotalDays ? `${sprintTotalDays}-day sprint` : 'Sprint length not set'} />
              </dl>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 min-w-0">
                <div role="tablist" aria-label="Launch kit sections" className="flex overflow-x-auto no-scrollbar mb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
                  {TABS.map((t) => (
                    <button key={t.id} role="tab" type="button" aria-selected={activeTab === t.id} onClick={() => setActiveTab(t.id)} className="cp-tab">
                      {t.label}
                      {t.count !== null && <span className="ml-2 text-[13px] num" style={{ color: C.faint }}>{t.count}</span>}
                    </button>
                  ))}
                </div>

                {/* Tasks */}
                {activeTab === 'tasks' && (
                  <div className="space-y-6 cp-fade">
                    {schedule.length === 0 ? (
                      <Empty icon={Check} title="No posting tasks yet">
                        Your daily posts appear here once the campaign has been approved.
                      </Empty>
                    ) : (
                      <>
                        {todayTask ? (
                          <div className="cp-card p-5 space-y-3" style={{ background: C.raised, borderColor: C.lineStrong }}>
                            <p className="m-0 text-sm font-semibold" style={{ color: C.crimsonText }}>
                              Do this next{todayTask.day ? `, day ${todayTask.day}` : ''}{todayTask.channel ? ` on ${todayTask.channel}` : ''}
                            </p>
                            <h2 className="serif m-0 text-2xl leading-snug" style={{ color: C.text }}>{todayTask.title}</h2>
                            {todayTask.description && <p className="m-0" style={{ color: C.body }}>{todayTask.description}</p>}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button type="button" onClick={() => setViewDraftTask(todayTask)} className="cp-btn cp-btn-quiet">
                                <Eye className="w-4 h-4" aria-hidden="true" /><span>View draft</span>
                              </button>
                              <button type="button" onClick={() => toggleChecklist(todayTask.id)} className="cp-btn cp-btn-primary">
                                <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" /><span>Mark as done</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="cp-card p-5 flex items-center gap-3" style={{ borderColor: C.okLine }}>
                            <Check className="w-5 h-5" style={{ color: C.ok }} aria-hidden="true" />
                            <p className="m-0 font-medium">All posting tasks are done.</p>
                          </div>
                        )}

                        {upNextTasks.length > 0 && (
                          <div>
                            <h3 className="m-0 mb-1 text-base font-semibold" style={{ color: C.text }}>Coming up</h3>
                            <ul className="m-0 p-0 list-none">
                              {upNextTasks.map((task) => (
                                <li key={task.id} className="py-3.5 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                                  <button type="button" onClick={() => toggleChecklist(task.id)} aria-label={`Mark "${task.title}" as done`}
                                    className="w-5 h-5 rounded-md shrink-0 cursor-pointer" style={{ background: C.raised, border: `1px solid ${C.lineStrong}` }} />
                                  <div className="min-w-0 flex-1">
                                    <p className="m-0 font-medium truncate" style={{ color: C.text }}>{task.title}</p>
                                    <p className="m-0 text-[13px]" style={{ color: C.muted }}>{[task.day ? `Day ${task.day}` : null, task.channel].filter(Boolean).join(' · ')}</p>
                                  </div>
                                  <button type="button" onClick={() => setViewDraftTask(task)} className="cp-btn cp-btn-quiet cp-btn-sm shrink-0">Draft</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {doneTasks.length > 0 && (
                          <details>
                            <summary className="text-sm font-medium" style={{ color: C.muted }}>Completed ({doneTasks.length})</summary>
                            <ul className="m-0 mt-2 p-0 list-none">
                              {doneTasks.map((task) => (
                                <li key={task.id} className="py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                                  <button type="button" onClick={() => toggleChecklist(task.id)} aria-label={`Mark "${task.title}" as not done`}
                                    className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center cursor-pointer" style={{ background: C.ok, color: '#08090c' }}>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                                  </button>
                                  <p className="m-0 flex-1 min-w-0 truncate line-through" style={{ color: C.muted }}>{task.title}</p>
                                  <button type="button" onClick={() => setViewDraftTask(task)} className="cp-btn cp-btn-quiet cp-btn-sm shrink-0">Draft</button>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Content */}
                {activeTab === 'scripts' && (
                  <div id="tour-portal-campaigns" className="space-y-4 cp-fade">
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Content type">
                      {SCRIPTS.map((s) => (
                        <button key={s.id} type="button" className="cp-chip" aria-pressed={activeScriptTab === s.id} onClick={() => setActiveScriptTab(s.id)}>{s.label}</button>
                      ))}
                    </div>

                    {!activeScriptText ? (
                      <Empty icon={FileText} title="No draft for this yet">
                        Your studio contact will add it once the campaign content is ready.
                      </Empty>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div role="group" aria-label="Preview style" className="flex items-center p-1 rounded-lg" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                            {[{ id: 'visual', label: 'Preview' }, { id: 'text', label: 'Plain text' }].map((m) => (
                              <button key={m.id} type="button" aria-pressed={portalDraftViewMode === m.id} onClick={() => setPortalDraftViewMode(m.id)}
                                className="px-3 py-1 rounded-md text-sm font-medium cursor-pointer"
                                style={portalDraftViewMode === m.id ? { background: C.raised, color: C.text } : { color: C.muted }}>
                                {m.label}
                              </button>
                            ))}
                          </div>
                          <button type="button" className="cp-btn cp-btn-primary" onClick={() => copyToClipboard(activeScriptText, activeScriptTab)}>
                            {copiedKey === activeScriptTab ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                            <span>{copiedKey === activeScriptTab ? 'Copied' : 'Copy text'}</span>
                          </button>
                        </div>

                        {portalDraftViewMode === 'visual' ? (
                          <div className="p-4 sm:p-5 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                            <PostVisualMockup
                              type={activeScriptTab === 'story' ? 'story' : activeScriptTab === 'video' ? 'video' : activeScriptTab === 'email' ? 'newsletter' : 'post'}
                              project={project}
                              brandColor={C.crimson}
                              copyText={activeScriptText}
                              preorderUrl={preorderUrl}
                            />
                          </div>
                        ) : (
                          <textarea readOnly rows={10} value={activeScriptText} aria-label="Draft text"
                            className="w-full p-4 rounded-xl text-[15px] leading-relaxed resize-none outline-none"
                            style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }} />
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Pre-orders */}
                {activeTab === 'presales' && (
                  <div className="space-y-4 cp-fade">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="serif m-0 text-2xl">{totalBackersCount} pre-order{totalBackersCount === 1 ? '' : 's'}</h2>
                      <p className="m-0 text-sm" style={{ color: C.muted }}>${presalesRevenue.toLocaleString()} collected</p>
                    </div>
                    {displayReservations.length === 0 ? (
                      <Empty icon={Users} title="No pre-orders yet">
                        Each pre-order shows up here as soon as it is paid.
                        {showSimTools && (
                          <div className="mt-4">
                            <button type="button" onClick={handleSimulatePreorder} className="cp-btn cp-btn-quiet cp-btn-sm">
                              <Plus className="w-4 h-4" aria-hidden="true" /><span>Add a test pre-order (simulated)</span>
                            </button>
                          </div>
                        )}
                      </Empty>
                    ) : (
                      <ul className="m-0 p-0 list-none">
                        {displayReservations.map((res) => (
                          <li key={res.id} className="py-3.5 flex items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.line}` }}>
                            <div className="min-w-0">
                              <p className="m-0 font-medium truncate" style={{ color: C.text }}>{res.name}</p>
                              <p className="m-0 text-[13px] truncate" style={{ color: C.muted }}>{res.email}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="m-0 font-semibold num" style={{ color: C.ok }}>+${res.amount}</p>
                              <p className="m-0 text-[13px]" style={{ color: C.muted }}>{res.tier || dynamicPresaleTierName}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Messages */}
                {activeTab === 'messages' && (
                  <div id="tour-portal-chat" className="space-y-4 cp-fade">
                    <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                      {portalDisplayMessages.length === 0 ? (
                        <Empty icon={Send} title="No messages yet">Write to the studio below.</Empty>
                      ) : (
                        portalDisplayMessages.map((msg) => {
                          const fromStudio = msg.sender === 'admin'
                          return (
                            <div key={msg.id} className={`p-4 rounded-xl ${fromStudio ? 'mr-6 sm:mr-12' : 'ml-6 sm:ml-12'}`}
                              style={fromStudio ? { background: C.row, border: `1px solid ${C.line}` } : { background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }}>
                              <div className="flex items-baseline justify-between gap-3 mb-1">
                                <span className="text-sm font-semibold" style={{ color: fromStudio ? C.text : C.crimsonText }}>{msg.senderName}</span>
                                <span className="text-[13px]" style={{ color: C.faint }}>{msg.time}</span>
                              </div>
                              <p className="m-0 whitespace-pre-wrap" style={{ color: C.body }}>{msg.text}</p>
                            </div>
                          )
                        })
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>
                    <form onSubmit={handleSendCreatorMessage} className="flex gap-2">
                      <input type="text" value={creatorReplyText} onChange={(e) => setCreatorReplyText(e.target.value)}
                        aria-label="Message to the studio" placeholder="Write to the studio"
                        className="flex-1 min-w-0 px-4 py-2.5 rounded-xl outline-none"
                        style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }} />
                      <button type="submit" disabled={isSendingReply || !creatorReplyText.trim()} className="cp-btn cp-btn-primary">
                        <Send className="w-4 h-4" aria-hidden="true" /><span>Send</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Summary */}
              <aside id="tour-portal-blueprint" className="lg:col-span-4 lg:sticky lg:top-24 cp-card p-5" aria-label="Sprint summary">
                <h2 className="serif m-0 text-2xl mb-1">Sprint summary</h2>
                <dl className="m-0">
                  <Fact label="Goal" value={hasTarget ? `$${presaleTarget.toLocaleString()}` : 'Not set'} />
                  <Fact label="Pre-order price" value={hasPrice ? `$${dynamicPresalePrice}` : 'Not set'} />
                  {hasTarget && hasPrice && <Fact label="Pre-orders needed" value={`about ${backersNeededForGate.toLocaleString()}`} />}
                  <Fact label="Sprint length" value={sprintTotalDays ? `${sprintTotalDays} days` : 'Not set'} />
                  <Fact label="Revenue split" value="50 / 50" />
                </dl>
                <div className="pt-4 space-y-2">
                  <a href={preorderUrl} target="_blank" rel="noreferrer" className="cp-btn cp-btn-primary w-full">
                    <ExternalLink className="w-4 h-4" aria-hidden="true" /><span>Open pre-order page</span>
                  </a>
                  <button type="button" onClick={() => copyToClipboard(preorderUrl, 'preorder-link')} className="cp-btn cp-btn-quiet w-full">
                    {copiedKey === 'preorder-link' ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                    <span>{copiedKey === 'preorder-link' ? 'Copied' : 'Copy link'}</span>
                  </button>
                  <button type="button" onClick={() => setShowAgreementModal(true)} className="w-full text-sm underline underline-offset-2 py-1 cursor-pointer" style={{ color: C.muted }}>
                    Read the 50/50 agreement
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      {/* ── Draft modal ────────────────────────────────────────────────────── */}
      {viewDraftTask && (
        <ModalShell
          title={viewDraftTask.title}
          subtitle={[viewDraftTask.day ? `Day ${viewDraftTask.day}` : null, viewDraftTask.channel].filter(Boolean).join(' · ')}
          onClose={() => setViewDraftTask(null)}
          footer={
            <>
              <button type="button" onClick={() => setViewDraftTask(null)} className="cp-btn cp-btn-quiet">Close</button>
              <button type="button" disabled={!getTaskDraftContent(viewDraftTask)} onClick={() => copyToClipboard(getTaskDraftContent(viewDraftTask), 'draft')} className="cp-btn cp-btn-primary">
                {copiedKey === 'draft' ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                <span>{copiedKey === 'draft' ? 'Copied' : 'Copy text'}</span>
              </button>
            </>
          }
        >
          {viewDraftTask.description && <p className="m-0" style={{ color: C.body }}>{viewDraftTask.description}</p>}
          {getTaskDraftContent(viewDraftTask) ? (
            <textarea readOnly rows={8} value={getTaskDraftContent(viewDraftTask)} aria-label="Draft text"
              className="w-full p-4 rounded-xl text-[15px] leading-relaxed resize-none outline-none"
              style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }} />
          ) : (
            <p className="m-0 text-sm" style={{ color: C.muted }}>No draft has been written for this task yet.</p>
          )}
        </ModalShell>
      )}

      {/* ── Agreement modal (clause text unchanged) ────────────────────────── */}
      {showAgreementModal && (
        <ModalShell
          wide
          title="Equal 50/50 co-founder agreement"
          subtitle="CF-5050"
          onClose={() => setShowAgreementModal(false)}
          footer={<button type="button" onClick={() => setShowAgreementModal(false)} className="cp-btn cp-btn-primary">Close</button>}
        >
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
            <div>
              <p className="m-0 text-sm" style={{ color: C.muted }}>Partner A</p>
              <p className="m-0 font-semibold">CoLaunch Studio</p>
              <p className="m-0 text-sm" style={{ color: C.muted }}>Engineering, hosting, AI architecture</p>
            </div>
            <div>
              <p className="m-0 text-sm" style={{ color: C.muted }}>Partner B</p>
              <p className="m-0 font-semibold">{creatorName}</p>
              <p className="m-0 text-sm" style={{ color: C.muted }}>Audience, co-marketing, feedback</p>
            </div>
          </div>
          <ol className="m-0 p-0 list-none space-y-4" style={{ color: C.body }}>
            {[
              ['Equal 50/50 gross net revenue division', `All gross revenue generated from founding presales, monthly/annual software subscriptions, and add-on modules is divided exactly 50% to CoLaunch Studio and 50% to ${creatorName}.`],
              ['Irrevocable automated settlement', "Payouts are handled through automated payment gateway webhooks (Stripe Connect). The creator's 50% share is routed directly to the verified partner ledger without artificial holding periods."],
              ['Full engineering and technical provisioning', 'The studio assumes 100% responsibility for infrastructure, code deployments, LLM token provisioning, database scaling, and technical bug fixes.'],
              ['Mutual commercial IP and transparency', 'Both parties maintain transparent visibility into real-time telemetry, transaction volumes, backer accounts, and sprint progress.'],
            ].map(([h, t], i) => (
              <li key={h}>
                <p className="m-0 font-semibold" style={{ color: C.text }}>{i + 1}. {h}</p>
                <p className="m-0 mt-1 text-sm leading-relaxed" style={{ color: C.muted }}>{t}</p>
              </li>
            ))}
          </ol>
        </ModalShell>
      )}

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
