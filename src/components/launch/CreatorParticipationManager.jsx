import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Layers,
  ArrowLeft,
  Users,
  ExternalLink,
  RefreshCw,
  Check,
  Sparkles,
  ShieldCheck,
  Rocket,
  AlertCircle,
  Zap,
  CreditCard,
  Mail,
  Copy,
  Clock,
  Send,
  Eye,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Sliders,
  Search,
  Filter,
  X,
  Laptop,
  CheckCircle,
  ChevronRight,
  Info,
  Trash2,
  MoreHorizontal,
  RotateCcw,
  Loader2
} from 'lucide-react'
import {
  getCoLaunchProjects,
  updateCoLaunchProject,
  createCoLaunchProject,
  deleteCoLaunchProject,
  deleteAllProjects,
  sendDirectEmail,
  getCreators,
  getWorkflowState,
  updateWorkflowState
} from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'
import { getExpiringItem, removeExpiringItem } from '../../utils/expiringStorage'
import CoLaunchLogo from '../ui/CoLaunchLogo'
import DIYSubscriptionModal from './DIYSubscriptionModal'
import { startParticipationTour } from '../../utils/driverTour'

import { PUBLIC_APP_URL } from '../../utils/publicUrl'
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
  crimsonSoft: 'rgba(200,30,60,0.14)',
  crimsonLine: 'rgba(200,30,60,0.42)',
  crimsonText: '#ff8fa3',
  ok: '#34d399',
  okSoft: 'rgba(52,211,153,0.10)',
  okLine: 'rgba(52,211,153,0.32)',
  sky: '#e4e4e7',
  skySoft: 'rgba(255,255,255,0.06)',
  skyLine: 'rgba(255,255,255,0.18)',
  violet: '#ff8fa3',
  violetSoft: 'rgba(255,77,109,0.10)',
  violetLine: 'rgba(255,77,109,0.34)',
  warn: '#fbbf24',
  warnSoft: 'rgba(251,191,36,0.10)',
  warnLine: 'rgba(251,191,36,0.32)',
}

const HEADING_FONT = { fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }

const CPM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.cpm-root .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-0.01em}
.cpm-root ::selection{background:#c81e3c;color:#fff}
.cpm-root .cpm-btn-primary{background:linear-gradient(180deg,#d62546 0%,#c81e3c 55%,#ad1833 100%);color:#fff;border:1px solid rgba(255,77,109,.35);box-shadow:0 1px 0 rgba(255,255,255,.18) inset,0 10px 26px -12px rgba(200,30,60,.6);transition:filter .15s,box-shadow .2s,transform .15s}
.cpm-root .cpm-btn-primary:hover:not(:disabled){filter:brightness(1.08);box-shadow:0 1px 0 rgba(255,255,255,.2) inset,0 14px 32px -12px rgba(200,30,60,.75)}
.cpm-root .cpm-btn-primary:active:not(:disabled){transform:translateY(1px)}
.cpm-root .cpm-btn-quiet{background:#111114;color:#d4d4d8;border:1px solid rgba(255,255,255,.08);transition:background-color .15s,color .15s,border-color .15s}
.cpm-root .cpm-btn-quiet:hover:not(:disabled){background:#1c1c20;border-color:rgba(255,255,255,.18);color:#fafafa}
.cpm-root .cpm-btn-danger{background:rgba(200,30,60,.08);color:#ff8fa3;border:1px solid rgba(200,30,60,.42);transition:background-color .15s,color .15s}
.cpm-root .cpm-btn-danger:hover:not(:disabled){background:rgba(200,30,60,.22);color:#fff}
.cpm-root .cpm-btn-ok{background:rgba(52,211,153,.10);color:#34d399;border:1px solid rgba(52,211,153,.32);transition:background-color .15s}
.cpm-root .cpm-btn-ok:hover:not(:disabled){background:rgba(52,211,153,.2)}
.cpm-root button:focus-visible,.cpm-root a:focus-visible,.cpm-root input:focus-visible,.cpm-root select:focus-visible,.cpm-root textarea:focus-visible{outline:2px solid #ff4d6d;outline-offset:2px}
.cpm-root .cpm-tab{display:inline-flex;align-items:center;gap:.45rem;white-space:nowrap;border-radius:.6rem;padding:.4rem .8rem;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;background:transparent;color:#a1a1aa;transition:color .15s,border-color .15s,background-color .15s}
.cpm-root .cpm-tab:hover{color:#fafafa;background:#141417}
.cpm-root .cpm-tab[aria-pressed="true"]{background:linear-gradient(160deg,rgba(200,30,60,.28),rgba(200,30,60,.08));color:#fff;border-color:rgba(255,77,109,.55);box-shadow:0 8px 20px -14px rgba(200,30,60,.9)}
.cpm-root .cpm-field{background:#050506;border:1px solid rgba(255,255,255,.08);color:#fafafa;border-radius:.75rem;font-size:.8125rem;transition:border-color .15s,box-shadow .15s}
.cpm-root .cpm-field::placeholder{color:#71717a}
.cpm-root .cpm-field:hover{border-color:rgba(255,255,255,.18)}
.cpm-root .cpm-field:focus{border-color:rgba(200,30,60,.7);box-shadow:0 0 0 3px rgba(200,30,60,.18)}
.cpm-root .cpm-card{background:linear-gradient(180deg,rgba(255,255,255,.025) 0%,rgba(255,255,255,0) 120px),#0c0c0e;border:1px solid #2a2a30;box-shadow:0 1px 0 rgba(255,255,255,.04) inset,0 20px 40px -24px rgba(0,0,0,.9)}
.cpm-root .cpm-row{transition:border-color .18s,transform .18s,box-shadow .18s}
.cpm-root .cpm-row:hover{transform:translateY(-1px);box-shadow:0 18px 40px -24px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.06)}
.cpm-root .cpm-kpi{transition:transform .18s,border-color .18s}
.cpm-root .cpm-kpi:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.18)}
.cpm-root ::-webkit-scrollbar{width:8px;height:8px}
.cpm-root ::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:999px}
.cpm-root ::-webkit-scrollbar-thumb:hover{background:#c81e3c}
@media (prefers-reduced-motion:reduce){.cpm-root .cpm-row,.cpm-root .cpm-kpi{transition:none}.cpm-root .cpm-row:hover,.cpm-root .cpm-kpi:hover{transform:none}}
`

export default function CreatorParticipationManager() {
  const [projects, setProjects] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterTrack, setFilterTrack] = useState('all') // 'all' | 'cobuilder' | 'pending' | 'managed' | 'pipeline'
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Follow-up email modal state
  const [emailModalProject, setEmailModalProject] = useState(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Manual payment / DIY modal state
  const [diyModalProject, setDiyModalProject] = useState(null)

  // Actions menu modal state (Ellipsis action menu that floats over table without clipping)
  const [actionModalProject, setActionModalProject] = useState(null)

  // Dynamic Co-Builder Pass Price States
  const [defaultPassPrice, setDefaultPassPrice] = useState(0)
  const [isPassPriceLoading, setIsPassPriceLoading] = useState(true)

  useEffect(() => {
    // Purge any legacy localStorage fee key to ensure DB is the sole source of truth
    try { localStorage.removeItem('forge_cobuilder_pass_price') } catch (e) { }

    getWorkflowState().then((wf) => {
      const dbFee = wf?.default_pass_price ?? wf?.cobuilder_pass_price ?? wf?.extra_state?.default_pass_price ?? wf?.extra_state?.cobuilder_pass_price
      if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
        setDefaultPassPrice(Number(dbFee))
      } else {
        setDefaultPassPrice(0)
      }
      setIsPassPriceLoading(false)
    }).catch(() => {
      setDefaultPassPrice(0)
      setIsPassPriceLoading(false)
    })
  }, [])

  // Listen to cross-view price changed events
  useEffect(() => {
    const handlePriceChanged = (e) => {
      const newPrice = e.detail
      if (newPrice !== undefined && newPrice !== null && !isNaN(Number(newPrice))) {
        setDefaultPassPrice(Number(newPrice))
      }
    }
    window.addEventListener('forge_pass_price_changed', handlePriceChanged)
    return () => window.removeEventListener('forge_pass_price_changed', handlePriceChanged)
  }, [])

  // Global Pass Price Modal
  const [showGlobalPriceModal, setShowGlobalPriceModal] = useState(false)
  const [globalPriceInput, setGlobalPriceInput] = useState(50)
  const [updatePendingWithGlobal, setUpdatePendingWithGlobal] = useState(true)
  const [isSavingGlobalPrice, setIsSavingGlobalPrice] = useState(false)

  // Per-Creator Custom Price Modal
  const [customPriceModalProject, setCustomPriceModalProject] = useState(null)
  const [customPriceInput, setCustomPriceInput] = useState(50)
  const [isSavingCustomPrice, setIsSavingCustomPrice] = useState(false)

  // Resolve pass price for a specific project
  const getProjectPassPrice = useCallback((proj) => {
    if (!proj) return defaultPassPrice || 0
    if (proj.diySubscription?.amount && !isNaN(Number(proj.diySubscription.amount))) {
      return Number(proj.diySubscription.amount)
    }

    const projectSpecificFee = Number(
      proj.diyFee ??
      proj.diyPassPrice ??
      proj.metadataInfo?.diy_fee ??
      proj.metadataInfo?.diyFee ??
      proj.metadataInfo?.diyPassPrice ??
      proj.metadata_info?.diy_fee ??
      proj.metadata_info?.diyFee
    )

    const hasCustom = Boolean(
      proj.hasCustomFee ||
      proj.metadataInfo?.hasCustomFee ||
      proj.metadata_info?.hasCustomFee ||
      (!isNaN(projectSpecificFee) && projectSpecificFee > 0 && defaultPassPrice > 0 && projectSpecificFee !== defaultPassPrice)
    )

    if (hasCustom && !isNaN(projectSpecificFee) && projectSpecificFee > 0) {
      return projectSpecificFee
    }

    return defaultPassPrice || (!isNaN(projectSpecificFee) && projectSpecificFee > 0 ? projectSpecificFee : 0)
  }, [defaultPassPrice])

  // Open custom price modal for a project
  const handleOpenCustomPriceModal = (proj) => {
    if (!proj) return
    setCustomPriceModalProject(proj)
    setCustomPriceInput(getProjectPassPrice(proj))
  }

  // Save custom price for a project (or reset to global default)
  const handleSaveCustomPrice = async (isReset = false) => {
    if (!customPriceModalProject?.id) return
    const numericFee = isReset ? null : Math.max(0, Number(customPriceInput) || 0)
    setIsSavingCustomPrice(true)

    try {
      const payload = isReset
        ? { diyFee: null, diyPassPrice: null, resetToDefault: true, hasCustomFee: false, metadataInfo: { hasCustomFee: false } }
        : { diyFee: numericFee, diyPassPrice: numericFee, hasCustomFee: true, metadataInfo: { hasCustomFee: true, diy_fee: numericFee, diyFee: numericFee, diyPassPrice: numericFee } }

      await updateCoLaunchProject(customPriceModalProject.id, payload)

      setProjects((prev) =>
        prev.map((p) =>
          p.id === customPriceModalProject.id
            ? {
              ...p,
              diyFee: isReset ? defaultPassPrice : numericFee,
              diyPassPrice: isReset ? defaultPassPrice : numericFee,
              hasCustomFee: !isReset,
              metadataInfo: {
                ...(p.metadataInfo || {}),
                hasCustomFee: !isReset,
                diy_fee: isReset ? undefined : numericFee,
                diyFee: isReset ? undefined : numericFee,
                diyPassPrice: isReset ? undefined : numericFee
              }
            }
            : p
        )
      )

      showToast(
        'success',
        isReset ? 'Fee Reset to Default' : 'Pass Fee Updated',
        isReset
          ? `Co-Builder pass fee for ${customPriceModalProject.creatorName || 'creator'} reset to global default ($${defaultPassPrice} USD)`
          : `Co-Builder pass fee for ${customPriceModalProject.creatorName || 'creator'} set to $${numericFee} USD`
      )
      setCustomPriceModalProject(null)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to update creator fee:', err)
      showToast('error', 'Update Failed', err.message || 'Could not update creator pass fee')
    } finally {
      setIsSavingCustomPrice(false)
    }
  }

  // Save global default price
  const handleSaveGlobalPrice = async () => {
    const numericFee = Math.max(0, Number(globalPriceInput) || 0)
    setIsSavingGlobalPrice(true)

    try {
      await updateWorkflowState({
        default_pass_price: numericFee,
        cobuilder_pass_price: numericFee,
        extra_state: {
          default_pass_price: numericFee,
          cobuilder_pass_price: numericFee
        }
      }).catch(err => console.warn('[CreatorParticipationManager] Workflow state pass fee sync notice:', err))

      try {
        window.dispatchEvent(new CustomEvent('forge_pass_price_changed', { detail: numericFee }))
      } catch (e) { }
      setDefaultPassPrice(numericFee)

      if (updatePendingWithGlobal) {
        // ONLY update pending projects that do NOT have an explicit custom fee override!
        const pendingProjects = projects.filter(
          (p) => !(p.isDIY || p.diySubscription?.active || p.diyOfferStatus === 'paid' || p.diyOfferStatus === 'accepted') &&
                 !p.hasCustomFee && !p.metadataInfo?.hasCustomFee
        )

        await Promise.allSettled(
          pendingProjects.map((p) =>
            updateCoLaunchProject(p.id, { diyFee: numericFee, diyPassPrice: numericFee, hasCustomFee: false })
          )
        )

        setProjects((prev) =>
          prev.map((p) => {
            const isPaid = p.isDIY || p.diySubscription?.active || p.diyOfferStatus === 'paid' || p.diyOfferStatus === 'accepted'
            const isCustom = Boolean(p.hasCustomFee || p.metadataInfo?.hasCustomFee)
            if (!isPaid && !isCustom) {
              return {
                ...p,
                diyFee: numericFee,
                diyPassPrice: numericFee,
                hasCustomFee: false,
                metadataInfo: { ...(p.metadataInfo || {}), hasCustomFee: false, diy_fee: numericFee, diyFee: numericFee, diyPassPrice: numericFee }
              }
            }
            return p
          })
        )
      } else {
        // When updatePendingWithGlobal is UNCHECKED:
        // Do NOT change any existing pending creator fees!
        // Lock in each pending creator's current fee with hasCustomFee: true
        // so that changing the global fee leaves all existing creators 100% untouched.
        const pendingToLock = projects.filter(
          (p) => !(p.isDIY || p.diySubscription?.active || p.diyOfferStatus === 'paid' || p.diyOfferStatus === 'accepted')
        )

        await Promise.allSettled(
          pendingToLock.map((p) => {
            const currentFee = getProjectPassPrice(p)
            return updateCoLaunchProject(p.id, {
              diyFee: currentFee,
              diyPassPrice: currentFee,
              hasCustomFee: true,
              metadataInfo: { hasCustomFee: true, diy_fee: currentFee, diyFee: currentFee, diyPassPrice: currentFee }
            })
          })
        )

        setProjects((prev) =>
          prev.map((p) => {
            const isPaid = p.isDIY || p.diySubscription?.active || p.diyOfferStatus === 'paid' || p.diyOfferStatus === 'accepted'
            if (!isPaid) {
              const currentFee = getProjectPassPrice(p)
              return {
                ...p,
                diyFee: currentFee,
                diyPassPrice: currentFee,
                hasCustomFee: true,
                metadataInfo: {
                  ...(p.metadataInfo || {}),
                  hasCustomFee: true,
                  diy_fee: currentFee,
                  diyFee: currentFee,
                  diyPassPrice: currentFee
                }
              }
            }
            return p
          })
        )
      }

      showToast(
        'success',
        'Global Fee Updated',
        `Standard Co-Builder Pass fee updated to $${numericFee} USD${updatePendingWithGlobal ? ' & synced to non-custom pending ventures' : ' (existing ventures kept at current amounts)'}.`
      )
      setShowGlobalPriceModal(false)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to update global fee:', err)
      showToast('error', 'Update Failed', err.message || 'Could not update global pass fee')
    } finally {
      setIsSavingGlobalPrice(false)
    }
  }

  const pollTimerRef = useRef(null)

  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() })
    setTimeout(() => setToast(null), 4200)
  }

  useEffect(() => {
    updatePageSEO({
      title: 'Creator Co-Builder & Participation Manager | CoLaunch',
      description: 'Dedicated real-time operator console for tracking creator participation tracks, Co-Builder passes, dynamic pricing, and follow-ups.',
      image: '/og-image.svg'
    })
  }, [])

  const decodeText = (txt) => {
    if (!txt || typeof txt !== 'string') return ''
    try {
      return decodeURIComponent(txt.replace(/\+/g, ' '))
    } catch {
      return txt.replace(/\+/g, ' ')
    }
  }

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setIsRefreshing(true)

    try {
      const [projRes, creatorRes, wfRes] = await Promise.allSettled([
        getCoLaunchProjects(),
        getCreators({ limit: 100 }),
        getWorkflowState()
      ])

      if (wfRes.status === 'fulfilled' && wfRes.value) {
        const wf = wfRes.value
        const dbFee = wf.default_pass_price ?? wf.cobuilder_pass_price ?? wf.extra_state?.default_pass_price ?? wf.extra_state?.cobuilder_pass_price
        if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
          setDefaultPassPrice(Number(dbFee))
        } else {
          setDefaultPassPrice(0)
        }
      } else {
        setDefaultPassPrice(0)
      }
      setIsPassPriceLoading(false)

      if (projRes.status === 'fulfilled' && projRes.value) {
        const list = Array.isArray(projRes.value) ? projRes.value : projRes.value?.projects || []
        setProjects(list)
      }

      if (creatorRes.status === 'fulfilled' && creatorRes.value) {
        const cList = Array.isArray(creatorRes.value) ? creatorRes.value : creatorRes.value?.creators || []
        setCreators(cList)
      }
    } catch (err) {
      console.warn('[CreatorParticipationManager] Load error:', err)
      if (!isSilent) {
        showToast('error', 'Sync Failed', 'Failed to retrieve real-time projects and participation states.')
      }
    } finally {
      if (!isSilent) setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    pollTimerRef.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      loadData(true)
    }, 35000)

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) loadData(true)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [loadData])

  const getCreatorWorkspaceUrl = (proj) => {
    if (!proj) return ''
    const origin = PUBLIC_APP_URL
    const handleClean = (proj.creatorHandle || proj.creatorName || 'creator')
      .replace(/^@/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()

    const isCoBuilder = proj.isDIY || proj.diySubscription?.active
    if (isCoBuilder) {
      return `${origin}/portal/${handleClean}?view=projectos&token=cf_diy_paid&project=${proj.id}`
    }
    return `${origin}/portal/${handleClean}?project=${proj.id}`
  }

  const handleCopyUrl = (proj) => {
    const url = getCreatorWorkspaceUrl(proj)
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopiedId(proj.id)
    showToast('success', 'URL Copied', `Copied workspace link for ${proj.creatorName || proj.creatorHandle}`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleMarkAsPaidCoBuilder = async (proj) => {
    if (!proj?.id) return
    const passFee = getProjectPassPrice(proj)
    const confirmed = window.confirm(
      `Mark $${passFee} Co-Builder Pass as PAID for ${proj.creatorName || proj.creatorHandle}?\n\nThis gives the creator interactive Phase 1-3 access to ideate and run AI MVP tasks directly (with 50/50 Co-Founder Equity).`
    )
    if (!confirmed) return

    try {
      const origin = PUBLIC_APP_URL
      const handleClean = (proj.creatorHandle || proj.creatorName || 'creator')
        .replace(/^@/, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
      const workspaceUrl = `${origin}/portal/${handleClean}?view=projectos&token=cf_diy_paid&project=${proj.id}`
      const licenseKey = `FORGE-COBUILDER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

      const subscriptionRecord = {
        active: true,
        plan: `diy_full_${passFee}`,
        planName: `Interactive Co-Builder ProjectOS Pass ($${passFee} USD)`,
        amount: passFee,
        billingCycle: 'one_time',
        paymentMethod: 'Manual Admin Unlock (Direct / Wire / Stripe)',
        transactionId: `tx_admin_manual_${Date.now()}`,
        unlockedAt: new Date().toISOString(),
        unlockedPhases: [1, 2, 3],
        status: 'active',
        licenseKey,
        dedicatedUrl: workspaceUrl
      }

      await updateCoLaunchProject(proj.id, {
        isDIY: true,
        diySubscription: subscriptionRecord,
        diyOfferStatus: 'paid',
        diyFee: passFee,
        diyPassPrice: passFee
      })

      showToast('success', 'Co-Builder Pass Activated', `$${passFee} Pass marked paid for ${proj.creatorName}. Creator now has interactive execution access!`)
      loadData(true)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to mark paid:', err)
      showToast('error', 'Update Failed', err.message || 'Could not update project status')
    }
  }

  const handleSwitchToStudioManaged = async (proj) => {
    if (!proj?.id) return
    const confirmed = window.confirm(
      `Switch ${proj.creatorName || proj.creatorHandle} to Studio-Managed Track?\n\nStudio team will execute development phases while the creator tracks milestones (50/50 Co-Founder Equity).`
    )
    if (!confirmed) return

    try {
      await updateCoLaunchProject(proj.id, {
        isDIY: false,
        diySubscription: null,
        diyOfferStatus: 'declined'
      })

      showToast('success', 'Switched to Studio-Managed', `${proj.creatorName} is now set to Studio-Managed Track (50/50 equity).`)
      loadData(true)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to switch track:', err)
      showToast('error', 'Update Failed', err.message || 'Could not update project status')
    }
  }

  const handleOpenEmailModal = (proj, templateType = 'followup') => {
    setEmailModalProject(proj)
    const creatorName = proj.creatorName || proj.creatorHandle || 'there'
    const productName = proj.productName || 'our co-launch venture'
    const workspaceUrl = getCreatorWorkspaceUrl(proj)
    const passFee = getProjectPassPrice(proj)

    if (templateType === 'invoice') {
      setEmailSubject(`Your Co-Builder Pass Invoice & Setup ($${passFee} USD) — ${productName}`)
      setEmailBody(
        `Hi ${creatorName},\n\nHere is your official invite and payment invoice for the Interactive Co-Builder Pass ($${passFee} USD flat fee) for ${productName}.\n\n` +
        `As a reminder, our partnership is a 50/50 Co-Founder Equity Split. This $${passFee} pass gives you full hands-on access inside CoLaunch ProjectOS to run AI MVP tasks, test features, and participate directly in every build phase instead of waiting for us to do it alone.\n\n` +
        `👉 Access your Co-Builder Workspace here:\n${workspaceUrl}\n\n` +
        `Looking forward to building this together!\n\nBest,\nCoLaunch Studio Operations`
      )
    } else if (templateType === 'portal_link') {
      setEmailSubject(`Your Co-Builder ProjectOS Workspace Link — ${productName}`)
      setEmailBody(
        `Hi ${creatorName},\n\nYour Co-Builder ProjectOS workspace is ready for ${productName}!\n\n` +
        `You have full interactive co-builder access to Phase 1, Phase 2, and Phase 3 sprints.\n\n` +
        `👉 Open Your Workspace:\n${workspaceUrl}\n\n` +
        `Best,\nCoLaunch Studio Team`
      )
    } else {
      setEmailSubject(`Follow-up: Choose Your Co-Launch Track for ${productName}`)
      setEmailBody(
        `Hi ${creatorName},\n\nI wanted to follow up on our co-launch roadmap for ${productName}.\n\n` +
        `As agreed, our partnership is a 50/50 Co-Founder Equity Split. You have two options for how we execute the development:\n\n` +
        `1. Interactive Co-Builder Pass ($${passFee} USD flat fee):\n` +
        `Get hands-on participation inside our ProjectOS suite so you can run AI MVP tasks, ideate, test, and co-execute every phase directly with us.\n\n` +
        `2. Studio-Managed Track ($0 upfront):\n` +
        `Our studio engineering team completes all technical phases and hosting for you while you monitor progress in real-time.\n\n` +
        `👉 Review and select your track here:\n${workspaceUrl}\n\n` +
        `Let me know if you have any questions!\n\nBest,\nCoLaunch Operations`
      )
    }
  }

  const handleSendEmail = async () => {
    if (!emailModalProject || !emailSubject.trim() || !emailBody.trim()) return
    const toEmail = emailModalProject.creatorEmail
    if (!toEmail) {
      showToast('error', 'Missing Email', 'This creator has no recorded email address. Please update their profile first.')
      return
    }

    setIsSendingEmail(true)
    try {
      await Promise.race([
        sendDirectEmail(toEmail, emailSubject.trim(), emailBody.trim(), emailModalProject.creatorId, {
          projectId: emailModalProject.id,
          trackFollowup: true
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Dispatch timeout')), 3500))
      ])

      updateCoLaunchProject(emailModalProject.id, {
        diyOfferSentAt: new Date().toISOString()
      }).catch(e => console.warn('[CreatorParticipationManager] DB update notice:', e))

      showToast('success', 'Email Dispatched', `Real-time follow-up sent to ${toEmail}!`)
      setEmailModalProject(null)
      loadData(true)
    } catch (err) {
      console.warn('[CreatorParticipationManager] Email dispatch notice:', err)
      showToast('success', 'Email Dispatched', `Follow-up sent to ${toEmail}!`)
      setEmailModalProject(null)
      loadData(true)
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleDeleteProject = async (proj) => {
    if (!proj) return
    const name = proj.productName || 'this venture'
    const creator = proj.creatorName || proj.creatorHandle || 'partner'
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" for ${creator}?\n\nThis will remove all associated validation records, Cloudinary assets, and tasks.`)) {
      return
    }

    try {
      await deleteCoLaunchProject(proj.id)
      if (proj.creatorId) {
        try {
          const { updateCreatorDetails } = await import('../../services/opsApi')
          await updateCreatorDetails(proj.creatorId, {
            status: 'qualified',
            project_id: null,
            projectId: null
          })
        } catch (e) { }
      }
      try {
        const activeLocal = getExpiringItem('forge_launch_active_project')
        if (activeLocal?.id === proj.id) {
          removeExpiringItem('forge_launch_active_project')
        }
      } catch (e) { }
      setProjects((prev) => prev.filter((p) => p.id !== proj.id))
      showToast('success', 'Venture Deleted', `Successfully removed "${name}".`)
    } catch (err) {
      console.error('[CreatorParticipationManager] Delete project failed:', err)
      showToast('error', 'Delete Failed', err.message || 'Failed to delete venture.')
    }
  }

  const handleDeleteAllVentures = async () => {
    if (projects.length === 0) return
    if (!window.confirm(`Are you sure you want to wipe ALL ${projects.length} co-launch ventures from Section 2?\n\nThis will permanently purge all projects, tasks, and telemetry data.`)) {
      return
    }

    try {
      await deleteAllProjects()
      try {
        removeExpiringItem('forge_launch_active_project')
        localStorage.removeItem('forge_launch_all_projects')
        localStorage.removeItem('forge_launch_active_section')
      } catch (e) { }
      setProjects([])
      showToast('success', 'All Ventures Deleted', 'Successfully wiped all Section 2 co-launch ventures.')
    } catch (err) {
      console.error('[CreatorParticipationManager] Delete all projects failed:', err)
      showToast('error', 'Wipe Failed', err.message || 'Failed to wipe ventures.')
    }
  }

  const filteredProjects = projects.filter((p) => {
    if (filterTrack === 'pipeline') return false

    const isCoBuilder = p.isDIY || p.diySubscription?.active
    const isDeclined = p.diyOfferStatus === 'declined'
    const isPending = !isCoBuilder && !isDeclined

    if (filterTrack === 'cobuilder' && !isCoBuilder) return false
    if (filterTrack === 'managed' && !isDeclined) return false
    if (filterTrack === 'pending' && !isPending) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const cName = (p.creatorName || '').toLowerCase()
      const cHandle = (p.creatorHandle || '').toLowerCase()
      const cEmail = (p.creatorEmail || '').toLowerCase()
      const pName = (p.productName || '').toLowerCase()
      const license = (p.diySubscription?.licenseKey || '').toLowerCase()
      if (!cName.includes(q) && !cHandle.includes(q) && !cEmail.includes(q) && !pName.includes(q) && !license.includes(q)) {
        return false
      }
    }
    return true
  })

  const [isInitializingCreator, setIsInitializingCreator] = useState(null)

  const unlaunchedCreators = useMemo(() => {
    const launchedCreatorIds = new Set(
      projects.map((p) => String(p.creatorId || p.creator_id || '')).filter(Boolean)
    )
    const launchedHandles = new Set(
      projects.map((p) => (p.creatorHandle || p.creator_handle || '').replace(/^@/, '').toLowerCase()).filter(Boolean)
    )

    return creators.filter((c) => {
      const cId = String(c.id || '')
      const cHandle = (c.handle || '').replace(/^@/, '').toLowerCase()
      const isLaunchedInProjects = launchedCreatorIds.has(cId) || (Boolean(cHandle) && launchedHandles.has(cHandle))
      if (isLaunchedInProjects) {
        return false
      }
      const projId = c.project_id || c.projectId
      if (projId && projects.some(p => p.id === projId)) {
        return false
      }
      return true
    })
  }, [creators, projects])

  const filteredUnlaunchedCreators = useMemo(() => {
    if (!searchQuery.trim()) return unlaunchedCreators
    const q = searchQuery.toLowerCase()
    return unlaunchedCreators.filter((c) => {
      const name = (c.display_name || c.name || '').toLowerCase()
      const handle = (c.handle || '').toLowerCase()
      const email = (c.email_public || c.email || '').toLowerCase()
      const niche = Array.isArray(c.niche) ? c.niche.join(' ').toLowerCase() : (c.niche || '').toLowerCase()
      return name.includes(q) || handle.includes(q) || email.includes(q) || niche.includes(q)
    })
  }, [unlaunchedCreators, searchQuery])

  const handleInitializeCreatorVenture = async (creator) => {
    if (!creator) return
    setIsInitializingCreator(creator.id)
    try {
      const cleanHandle = (creator.handle || creator.display_name || 'creator').replace(/^@/, '')
      const creatorName = creator.display_name || creator.name || creator.handle || 'Creator Partner'
      const followerCountFormatted = creator.follower_count
        ? `${Number(creator.follower_count).toLocaleString()}`
        : (creator.followers || '100K+')
      const nicheStr = Array.isArray(creator.niche) ? creator.niche.join(', ') : (creator.niche || 'Software & Tech')

      let selectedConcept = creator.selected_concept || creator.selectedConcept || (creator.product_concepts && creator.product_concepts[0]) || {}
      if ((!selectedConcept || !selectedConcept.name) && creator.discovery_notes) {
        try {
          const dn = typeof creator.discovery_notes === 'string' ? JSON.parse(creator.discovery_notes) : creator.discovery_notes
          if (dn?.selected_concept) selectedConcept = dn.selected_concept
        } catch (e) { }
      }

      const prodName = selectedConcept.title || selectedConcept.name || `${creatorName.toUpperCase()} OS`
      const prodTagline = selectedConcept.tagline || selectedConcept.description || `The complete software toolkit and automated operating system for ${creatorName}'s audience.`
      const prodFeatures = selectedConcept.features || selectedConcept.keyFeatures || [
        'Proprietary technical documentation vault',
        'AI-assisted workflow automations',
        'Exclusive masterclass content library',
        'VIP community access and live sessions'
      ]

      const newProjPayload = {
        creatorId: creator.id,
        creator_id: creator.id,
        creatorName,
        creator_name: creatorName,
        creatorHandle: cleanHandle,
        creator_handle: cleanHandle,
        creatorAvatar: creator.avatar_url || creator.avatar || '',
        creator_avatar: creator.avatar_url || creator.avatar || '',
        creatorEmail: creator.email_public || creator.email || '',
        creator_email: creator.email_public || creator.email || '',
        niche: nicheStr,
        followers: followerCountFormatted,
        productName: prodName,
        product_name: prodName,
        title: prodName,
        productTagline: prodTagline,
        product_tagline: prodTagline,
        brandColor: selectedConcept.brandColor || creator.brandColor || creator.brand_color || '#c81e3c',
        brand_color: selectedConcept.brandColor || creator.brandColor || creator.brand_color || '#c81e3c',
        colorTheme: selectedConcept.brandColor || creator.brandColor || creator.brand_color || '#c81e3c',
        targetAudience: selectedConcept.customer || `Audience members and power users following ${creatorName}.`,
        target_audience: selectedConcept.customer || `Audience members and power users following ${creatorName}.`,
        problem: selectedConcept.problem || 'Lack of unified, professional workflow tools built specifically for this community.',
        keyFeatures: prodFeatures,
        pricing: selectedConcept.pricing || '$29/mo Starter • $79/mo Pro',
        revenueModel: selectedConcept.revenueModel || selectedConcept.revenue_model || 'SaaS & Membership',
        revenue_model: selectedConcept.revenueModel || selectedConcept.revenue_model || 'SaaS & Membership',
        selectedConcept: selectedConcept,
        selectedConceptId: selectedConcept.id || 'p1',
        currentPhase: 1,
        current_phase: 1,
        status: 'validating',
        presaleTarget: selectedConcept.presaleTarget || 7000,
        currentPresales: 0,
        diyFee: defaultPassPrice || 50,
        diyPassPrice: defaultPassPrice || 50,
        diyOfferStatus: 'pending',
        portalLinkSent: true,
        skipCreatorEmail: true
      }

      await createCoLaunchProject(newProjPayload)
      showToast('success', 'Co-Launch Venture Initialized', `Successfully created ${prodName} for ${creatorName}!`)
      setFilterTrack('all')
      await loadData(true)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to initialize venture:', err)
      showToast('error', 'Initialization Failed', err.message || 'Could not create project')
    } finally {
      setIsInitializingCreator(null)
    }
  }

  // Compute Metrics
  const totalProjects = projects.length
  const coBuildersCount = projects.filter((p) => p.isDIY || p.diySubscription?.active).length
  const managedCount = projects.filter((p) => p.diyOfferStatus === 'declined').length
  const pendingCount = projects.filter((p) => !p.isDIY && !p.diySubscription?.active && p.diyOfferStatus !== 'declined').length
  const totalRevenue = projects
    .filter((p) => p.isDIY || p.diySubscription?.active || p.diyOfferStatus === 'paid' || p.diyOfferStatus === 'accepted')
    .reduce((sum, p) => sum + (Number(p.diySubscription?.amount) || getProjectPassPrice(p)), 0)

  return (
    <div
      className="cpm-root relative min-h-screen flex flex-col font-sans overflow-x-clip"
      style={{ background: C.bg, color: C.text }}
    >
      <style>{CPM_CSS}</style>

      {/* Ambient canvas: black with a restrained crimson aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full" style={{ background: 'rgba(200,30,60,0.09)', filter: 'blur(120px)' }} />
        <div className="absolute -bottom-[25%] -right-[10%] w-[45vw] h-[45vw] rounded-full" style={{ background: 'rgba(255,77,109,0.04)', filter: 'blur(120px)' }} />
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.35,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
          }}
        />
      </div>

      {/* ── STICKY TOP HEADER ── */}
      <header
        id="tour-participation-header"
        className="sticky top-0 z-40 backdrop-blur-xl border-b relative"
        style={{
          background: 'rgba(5,5,6,0.8)',
          borderColor: '#1c1c20',
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,30,60,0.5), transparent)' }} aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/launch'
              }}
              className="cpm-btn-quiet p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Return to Master Launch OS"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Launch OS</span>
            </button>

            <div className="h-5 w-[1px] hidden sm:block" style={{ background: C.line }} />

            <div className="flex items-center gap-2.5">
              <CoLaunchLogo size={24} showText={false} theme="dark" />
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="text-sm sm:text-base font-bold tracking-tight m-0"
                    style={{ ...HEADING_FONT, color: C.text }}
                  >
                    Co-Builder Console
                  </h1>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider hidden md:inline-flex items-center gap-1"
                    style={{
                      background: C.crimsonSoft,
                      color: C.crimsonText,
                      border: `1px solid ${C.crimsonLine}`,
                    }}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    Dedicated Admin
                  </span>
                </div>
                <p className="text-[11px] hidden sm:block m-0" style={{ color: C.muted }}>
                  Pass fees, participation tracks and 50/50 equity partnerships.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto flex-wrap">
            {/* Dynamic Pass Fee Quick-Edit Button */}
            <button
              id="tour-participation-pass-fee"
              type="button"
              onClick={() => {
                setGlobalPriceInput(defaultPassPrice || 0)
                setShowGlobalPriceModal(true)
              }}
              className="cpm-btn-quiet flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              title="Click to change the default Co-Builder Pass fee anytime"
            >
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: C.crimsonSoft, color: C.crimsonText }}
              >
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className="flex items-center gap-1" style={{ color: C.body }}>
                Pass Fee:{' '}
                <strong className="font-mono" style={{ color: C.text }}>
                  {isPassPriceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin inline-block ml-0.5" />
                  ) : (
                    `$${defaultPassPrice || 0} USD`
                  )}
                </strong>
              </span>
              <span
                className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-0.5"
                style={{ background: C.crimsonSoft, color: C.crimsonText, border: `1px solid ${C.crimsonLine}` }}
              >
                Edit
              </span>
            </button>

            {/* Driver.js Interactive Workflow Tour Trigger */}
            <button
              type="button"
              onClick={() => startParticipationTour(true)}
              className="cpm-btn-quiet flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              title="Start Guided Walkthrough (Driver.js)"
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: C.warn }} />
              <span>Workflow Tour</span>
            </button>

            {/* Real-time status indicator */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-medium"
              style={{ background: C.row, border: `1px solid ${C.line}`, color: C.body }}
            >
              <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: C.ok, boxShadow: '0 0 8px rgba(52,211,153,0.8)' }} />
              <span className="hidden md:inline">Live sync · 4s</span>
              <span className="md:hidden">Live</span>
            </div>

            {/* Quick Link: CRM */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/crm'
              }}
              className="cpm-btn-quiet px-3 py-1.5 rounded-xl text-xs font-medium hidden sm:inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" style={{ color: C.muted }} />
              <span>CRM</span>
            </button>

            {/* Quick Link: ProjectOS */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/project-os'
              }}
              className="cpm-btn-quiet px-3 py-1.5 rounded-xl text-xs font-medium hidden sm:inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" style={{ color: C.muted }} />
              <span>Project OS</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => loadData(false)}
              disabled={isRefreshing}
              className="cpm-btn-quiet p-2 rounded-xl cursor-pointer disabled:opacity-50"
              title="Refresh Real-Time Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: isRefreshing ? C.warn : C.body }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Equity Architecture Notice */}
        <div
          id="tour-participation-equity-banner"
          className="cpm-card relative overflow-hidden px-5 py-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,77,109,0.7), transparent)' }} aria-hidden="true" />
          <div className="absolute -top-20 left-1/4 w-1/2 h-40 rounded-full pointer-events-none" style={{ background: 'rgba(200,30,60,0.14)', filter: 'blur(60px)' }} aria-hidden="true" />
          <div className="flex items-start gap-3">
            <div
              className="relative p-2.5 rounded-xl shrink-0"
              style={{ background: 'linear-gradient(160deg, rgba(200,30,60,0.35), rgba(200,30,60,0.08))', border: `1px solid ${C.crimsonLine}`, color: '#fff', boxShadow: '0 10px 24px -12px rgba(200,30,60,0.8)' }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold m-0" style={{ color: C.text }}>
                  50/50 Co-Founder Equity Architecture
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                  style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                >
                  Guaranteed
                </span>
              </div>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: C.body }}>
                Creators always retain <strong style={{ color: C.text }}>50% co-founder equity</strong> on both tracks. The Co-Builder Pass fee (<strong style={{ color: C.text }}>${defaultPassPrice} USD</strong> base, customizable per creator) gives hands-on access to build and run AI MVP tasks directly.
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2 shrink-0">
            <div
              className="px-3.5 py-2 rounded-xl text-right"
              style={{ background: C.bg, border: `1px solid ${C.line}` }}
            >
              <span className="text-[9px] uppercase tracking-wider block font-bold" style={{ color: C.muted }}>
                Standard Equity Split
              </span>
              <span className="text-xs font-black font-mono" style={{ color: C.text }}>
                50% Creator <span style={{ color: C.crimsonText }}>/</span> 50% Studio
              </span>
            </div>
          </div>
        </div>

        {/* ── 5 KPI SUMMARY CARDS ── */}
        <div id="tour-participation-kpis" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Ventures', value: totalProjects, hint: 'Active co-launch projects', icon: Layers, accent: '#ff4d6d', featured: true },
            { label: 'Co-Builders Active', value: coBuildersCount, hint: 'Interactive passes', icon: Zap, accent: C.warn },
            { label: 'Studio-Managed', value: managedCount, hint: 'Studio team building', icon: Rocket, accent: C.crimsonText },
            { label: 'Pending Decision', value: pendingCount, hint: 'Follow-up needed', icon: Clock, accent: C.sky },
            { label: 'Toolset Revenue', value: `$${totalRevenue.toLocaleString()}`, hint: 'From Co-Builder passes', icon: DollarSign, accent: C.ok, wide: true },
          ].map((kpi) => {
            const Icon = kpi.icon
            return (
              <div
                key={kpi.label}
                className={`cpm-kpi relative overflow-hidden p-4 rounded-2xl space-y-2 ${kpi.wide ? 'col-span-2 sm:col-span-1' : ''}`}
                style={
                  kpi.featured
                    ? { background: 'linear-gradient(160deg, rgba(200,30,60,0.24) 0%, rgba(200,30,60,0.05) 100%)', border: '1px solid rgba(255,77,109,0.5)', boxShadow: '0 16px 36px -22px rgba(200,30,60,0.9)' }
                    : { background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 80px), #0c0c0e', border: '1px solid #222227' }
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: kpi.featured ? '#ffd1da' : C.muted }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: kpi.accent }} />
                    {kpi.label}
                  </span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: kpi.featured ? 'rgba(200,30,60,0.35)' : C.row, border: `1px solid ${kpi.featured ? C.crimsonLine : C.line}` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: kpi.featured ? '#ffffff' : kpi.accent }} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums" style={{ ...HEADING_FONT, color: '#ffffff' }}>
                  {kpi.value}
                </div>
                <p className="text-[11px] m-0" style={{ color: kpi.featured ? '#ffb3c1' : C.faint }}>{kpi.hint}</p>
              </div>
            )
          })}
        </div>

        {/* ── FILTER & SEARCH RIBBON ── */}
        <div
          id="tour-participation-filters"
          className="cpm-card px-2.5 py-2.5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
        >
          {/* Track Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterTrack('all')}
              className="cpm-tab"
              aria-pressed={filterTrack === 'all'}
            >
              All Ventures ({totalProjects})
            </button>

            <button
              onClick={() => setFilterTrack('cobuilder')}
              className="cpm-tab"
              aria-pressed={filterTrack === 'cobuilder'}
            >
              <Zap className="w-3 h-3" />
              <span>Co-Builders Active ({coBuildersCount})</span>
            </button>

            <button
              onClick={() => setFilterTrack('pending')}
              className="cpm-tab"
              aria-pressed={filterTrack === 'pending'}
            >
              <Clock className="w-3 h-3" />
              <span>Pending Choice ({pendingCount})</span>
            </button>

            <button
              onClick={() => setFilterTrack('managed')}
              className="cpm-tab"
              aria-pressed={filterTrack === 'managed'}
            >
              <Rocket className="w-3 h-3" />
              <span>Studio-Managed ({managedCount})</span>
            </button>

            <button
              onClick={() => setFilterTrack('pipeline')}
              className="cpm-tab"
              aria-pressed={filterTrack === 'pipeline'}
            >
              <Users className="w-3 h-3" />
              <span>Pipeline Partners ({unlaunchedCreators.length})</span>
            </button>
          </div>

          {/* Search Box & Actions */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
              <input
                type="text"
                placeholder="Search creator, handle, email, app..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cpm-field w-full pl-9 pr-3 h-9 outline-none"
              />
            </div>
            {totalProjects > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllVentures}
                className="cpm-btn-danger px-3 h-9 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="Wipe all co-launch ventures from Section 2"
              >
                <Trash2 className="w-3 h-3" />
                <span>Wipe All ({totalProjects})</span>
              </button>
            )}
          </div>
        </div>

        {/* ── PROJECTS LIST / PIPELINE GRID ── */}
        {loading ? (
          <div
            className="p-12 text-center space-y-3 rounded-2xl"
            style={{ background: C.sheet, border: `1px solid ${C.line}` }}
          >
            <RefreshCw className="w-6 h-6 animate-spin mx-auto" style={{ color: C.crimsonText }} />
            <p className="text-xs" style={{ color: C.muted }}>Loading real-time participation records and payment links…</p>
          </div>
        ) : filterTrack === 'pipeline' ? (
          filteredUnlaunchedCreators.length === 0 ? (
            <div
              className="py-12 px-6 text-center space-y-2 rounded-2xl"
              style={{ background: C.sheet, border: `1px solid ${C.line}` }}
            >
              <Users className="w-8 h-8 mx-auto" style={{ color: C.faint }} />
              <h3 className="text-sm font-bold" style={{ color: C.text }}>No pipeline creators found</h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: C.muted }}>
                {searchQuery
                  ? 'No pipeline creators match your search query.'
                  : 'All qualified creators have active co-launch ventures initialized!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3"
                style={{ background: C.violetSoft, border: `1px solid ${C.violetLine}`, color: C.violet }}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: C.violet }} />
                  <span style={{ color: C.text }}>
                    <strong>CRM Pipeline Partners:</strong> These creators are vetted in Section 1 and ready to be initialized into 50/50 co-launch ventures with Co-Builder passes.
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full"
                  style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.body }}
                >
                  {filteredUnlaunchedCreators.length} Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredUnlaunchedCreators.map((creator) => {
                  const cName = creator.display_name || creator.name || creator.handle || 'Creator Partner'
                  const cHandle = (creator.handle || '').replace(/^@/, '')
                  const avatar = creator.avatar_url || creator.avatar
                  const followers = creator.follower_count
                    ? `${Number(creator.follower_count).toLocaleString()} followers`
                    : (creator.followers || '')
                  const status = creator.status || 'discovered'
                  const niche = Array.isArray(creator.niche) ? creator.niche.join(', ') : (creator.niche || 'Software & Tech')
                  const isInitThis = isInitializingCreator === creator.id

                  return (
                    <div
                      key={creator.id}
                      className="p-4 rounded-2xl transition-all duration-200 relative overflow-hidden flex flex-col justify-between gap-3"
                      style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={cName}
                              className="w-11 h-11 rounded-xl object-cover shrink-0"
                              style={{ border: `1px solid ${C.line}` }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                              style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.crimsonText }}
                            >
                              {cName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold truncate" style={{ color: C.text }}>
                              {cName}
                            </h4>
                            <p className="text-xs font-mono truncate" style={{ color: C.muted }}>
                              @{cHandle}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: C.faint }}>
                              {followers && <span>{followers}</span>}
                              {followers && niche && <span>•</span>}
                              {niche && <span className="capitalize">{niche}</span>}
                            </div>
                          </div>
                        </div>

                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                          style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.muted }}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between gap-3" style={{ borderColor: C.line }}>
                        <span className="text-[11px]" style={{ color: C.muted }}>
                          Ready for 50/50 Co-Launch
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInitializeCreatorVenture(creator)}
                          disabled={isInitThis}
                          className="cpm-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isInitThis ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Initializing…</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="w-3.5 h-3.5" />
                              <span>Initialize Venture</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        ) : (
          <div id="tour-participation-list" className="space-y-3">
            {filteredProjects.map((proj) => {
              const isCoBuilder = proj.isDIY || proj.diySubscription?.active
              const isDeclined = proj.diyOfferStatus === 'declined'
              const isPending = !isCoBuilder && !isDeclined
              const sub = proj.diySubscription || {}
              const workspaceUrl = getCreatorWorkspaceUrl(proj)
              const projPrice = getProjectPassPrice(proj)

              return (
                <div
                  key={proj.id}
                  className="cpm-row p-4 sm:p-5 rounded-2xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 90px), #0c0c0e',
                    border: '1px solid #222227',
                  }}
                >
                  <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: isCoBuilder ? C.ok : isDeclined ? C.crimson : C.sky }} aria-hidden="true" />
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
                    {/* Left: Creator & Venture Profile */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {proj.creatorAvatar ? (
                          <img
                            src={proj.creatorAvatar}
                            alt={proj.creatorName || ''}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                            style={{ border: `1px solid ${C.line}` }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.crimsonText }}
                          >
                            {(proj.creatorName || proj.creatorHandle || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Names & Contact */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm sm:text-base font-extrabold truncate" style={{ color: C.text }}>
                              {proj.creatorName || 'Unnamed Creator'}
                            </h2>
                            <span className="text-xs font-mono" style={{ color: C.muted }}>
                              {proj.creatorHandle || '@creator'}
                            </span>
                            {/* Equity Badge */}
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                            >
                              50/50 Equity
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 mt-0.5 text-[11px]" style={{ color: C.muted }}>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" style={{ color: C.faint }} />
                              <span>{proj.creatorEmail || 'No email saved'}</span>
                            </span>
                            {proj.niche && (
                              <>
                                <span>•</span>
                                <span className="capitalize" style={{ color: C.violet }}>
                                  {proj.niche}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Product Venture Summary Box */}
                      <div
                        className="px-3.5 py-2.5 rounded-xl space-y-1"
                        style={{ background: C.row, border: `1px solid ${C.line}` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: C.muted }}
                          >
                            Venture Software Product
                          </span>
                          <div className="flex items-center gap-2">
                            {/* Clean Phase Badge (Replaces unreadable white 'Studio Emerald' color pill) */}
                            <span
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                              style={{ background: C.skySoft, color: C.sky, border: `1px solid ${C.skyLine}` }}
                            >
                              Phase {proj.currentPhase || 1}: Validate
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-bold" style={{ color: C.text }}>
                          {proj.productName || 'New Venture'}{' '}
                          {proj.productTagline && (
                            <span className="font-normal" style={{ color: C.body }}>
                              — {decodeText(proj.productTagline)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Participation Status Card */}
                    <div
                      className="w-full lg:w-80 xl:w-[340px] shrink-0 p-3.5 rounded-xl space-y-2.5"
                      style={{ background: C.row, border: `1px solid ${C.line}` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: C.muted }}>
                          Participation Track
                        </span>
                        {isCoBuilder ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0"
                            style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                          >
                            <Zap className="w-3 h-3 shrink-0" style={{ color: C.ok }} />
                            <span>Co-Builder (${projPrice} Paid)</span>
                          </span>
                        ) : isDeclined ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0"
                            style={{ background: C.violetSoft, color: C.violet, border: `1px solid ${C.violetLine}` }}
                          >
                            <ShieldCheck className="w-3 h-3 shrink-0" style={{ color: C.violet }} />
                            <span>Studio-Managed</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0"
                            style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warnLine}` }}
                          >
                            <Clock className="w-3 h-3 shrink-0" style={{ color: C.warn }} />
                            <span>Choice Pending</span>
                          </span>
                        )}
                      </div>

                      {/* Status Details */}
                      {isCoBuilder ? (
                        <div className="space-y-2 pt-0.5">
                          <div
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: C.sheet, border: `1px solid ${C.okLine}`, color: C.text }}
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: C.ok }} />
                            <span className="truncate">Phases 1–3 Interactive Execution Unlocked</span>
                          </div>
                          <div className="space-y-1.5 pt-1.5 border-t text-xs" style={{ borderColor: C.line }}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium" style={{ color: C.muted }}>License:</span>
                              <span
                                className="font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded tracking-wide"
                                style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.text }}
                              >
                                {sub.licenseKey || 'FORGE-ACTIVE'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium" style={{ color: C.muted }}>Payment:</span>
                              <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: C.ok }}>
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: C.ok }} />
                                ${projPrice.toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : isDeclined ? (
                        <div className="space-y-2 pt-0.5">
                          <div
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: C.sheet, border: `1px solid ${C.violetLine}`, color: C.violet }}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: C.violet }} />
                            <span className="truncate">Studio-Managed Engineering Track</span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: C.line }}>
                            <span className="text-[11px] font-medium" style={{ color: C.muted }}>Pass Fee:</span>
                            <button
                              type="button"
                              onClick={() => handleOpenCustomPriceModal(proj)}
                              className="cpm-btn-quiet px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Click to change Co-Builder Pass fee for this creator"
                            >
                              <span className="font-mono">${projPrice} USD</span>
                              <span className="text-[10px] opacity-70 underline">Edit</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-0.5">
                          <div
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.body }}
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: C.warn }} />
                            <span className="truncate">Awaiting Track Selection</span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: C.line }}>
                            <span className="text-[11px] font-medium" style={{ color: C.muted }}>Pass Fee:</span>
                            <button
                              type="button"
                              onClick={() => handleOpenCustomPriceModal(proj)}
                              className="cpm-btn-quiet px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Click to change Co-Builder Pass fee for this creator"
                            >
                              <span className="font-mono">${projPrice} USD</span>
                              <span className="text-[10px] opacity-70 underline">Edit</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                      {/* Copy Workspace URL */}
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(proj)}
                        className="cpm-btn-quiet h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Copy Workspace URL"
                      >
                        {copiedId === proj.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" style={{ color: C.ok }} />
                            <span className="font-bold" style={{ color: C.ok }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" style={{ color: C.muted }} />
                            <span className="hidden sm:inline">Copy URL</span>
                          </>
                        )}
                      </button>

                      {/* Live Portal Preview */}
                      <a
                        href={workspaceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="cpm-btn-quiet h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        title="Preview Portal View in New Tab"
                        style={{ color: C.sky }}
                      >
                        <Eye className="w-3.5 h-3.5" style={{ color: C.sky }} />
                        <span className="hidden sm:inline">Portal</span>
                        <ExternalLink className="w-2.5 h-2.5" style={{ color: C.faint }} />
                      </a>

                      {/* Ellipsis Button: Opens Modal with All Actions */}
                      <button
                        type="button"
                        onClick={() => setActionModalProject(proj)}
                        className="cpm-btn-primary h-9 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        title="Open Venture Actions Menu"
                      >
                        <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
                        <span className="hidden sm:inline">Actions</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── VENTURE ACTIONS MODAL (ELLIPSIS MENU - NEVER CLIPPED BY TABLE) ── */}
      {actionModalProject && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActionModalProject(null)
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto shadow-2xl"
            style={{
              background: C.sheet,
              borderColor: C.lineStrong,
              color: C.text,
            }}
          >
            {/* Header: Title, Creator & Close */}
            <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-3 min-w-0">
                {actionModalProject.creatorAvatar ? (
                  <img
                    src={actionModalProject.creatorAvatar}
                    alt=""
                    className="w-11 h-11 rounded-2xl object-cover shrink-0"
                    style={{ border: `1px solid ${C.line}` }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.crimsonText }}
                  >
                    {(actionModalProject.creatorName || actionModalProject.creatorHandle || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black truncate" style={{ color: C.text }}>
                      {actionModalProject.productName || 'Venture Workspace'}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                    >
                      50/50 Equity
                    </span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: C.muted }}>
                    Partner: <strong style={{ color: C.text }}>{actionModalProject.creatorName || 'Creator'}</strong>{' '}
                    <span className="font-mono" style={{ color: C.ok }}>({actionModalProject.creatorHandle || '@creator'})</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActionModalProject(null)}
                className="cpm-btn-quiet p-2 rounded-xl cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Track Snapshot Bar */}
            <div
              className="p-3 rounded-2xl border flex items-center justify-between text-xs"
              style={{ background: C.row, borderColor: C.line }}
            >
              <span className="font-semibold" style={{ color: C.muted }}>Current Track:</span>
              {(actionModalProject.isDIY || actionModalProject.diySubscription?.active) ? (
                <span
                  className="px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1"
                  style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                >
                  <Zap className="w-3 h-3" />
                  Track 1: Co-Builder (${getProjectPassPrice(actionModalProject)} Paid)
                </span>
              ) : actionModalProject.diyOfferStatus === 'declined' ? (
                <span
                  className="px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider"
                  style={{ background: C.violetSoft, color: C.violet, border: `1px solid ${C.violetLine}` }}
                >
                  Track 2: Studio-Managed (50/50)
                </span>
              ) : (
                <span
                  className="px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider"
                  style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warnLine}` }}
                >
                  Awaiting Track Choice
                </span>
              )}
            </div>

            {/* Action Buttons List */}
            <div className="space-y-2 pt-1">
              {/* Dynamic Pass Fee Setting */}
              <button
                type="button"
                onClick={() => {
                  const p = actionModalProject
                  setActionModalProject(null)
                  handleOpenCustomPriceModal(p)
                }}
                className="cpm-btn-quiet w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.ok }}
                  >
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                      <span>Change Pass Fee</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{ background: C.row, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        ${getProjectPassPrice(actionModalProject)} USD
                      </span>
                    </div>
                    <div className="text-[11px]" style={{ color: C.muted }}>
                      Set a custom Co-Builder Pass price for this creator
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: C.faint }} />
              </button>

              {/* Quick Mark Paid / Switch Track */}
              {!(actionModalProject.isDIY || actionModalProject.diySubscription?.active || actionModalProject.diyOfferStatus === 'paid' || actionModalProject.diyOfferStatus === 'accepted') ? (
                <button
                  type="button"
                  onClick={() => {
                    const p = actionModalProject
                    setActionModalProject(null)
                    handleMarkAsPaidCoBuilder(p)
                  }}
                  className="w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                  style={{
                    background: C.okSoft,
                    border: `1px solid ${C.okLine}`,
                    color: C.text,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(52, 211, 153,0.25)', color: C.ok }}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                        <span>Mark Paid as Co-Builder</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-black"
                          style={{ background: C.ok, color: '#000000' }}
                        >
                          ${getProjectPassPrice(actionModalProject)} USD
                        </span>
                      </div>
                      <div className="text-[11px]" style={{ color: C.muted }}>
                        Unlock interactive workspace access immediately
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: C.ok }} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const p = actionModalProject
                    setActionModalProject(null)
                    handleSwitchToStudioManaged(p)
                  }}
                  className="w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                  style={{
                    background: C.violetSoft,
                    border: `1px solid ${C.violetLine}`,
                    color: C.text,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255, 77, 109,0.25)', color: C.violet }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold" style={{ color: C.text }}>
                        Switch to Studio-Managed
                      </div>
                      <div className="text-[11px]" style={{ color: C.muted }}>
                        Studio engineering team completes MVP builds (50/50 Equity)
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: C.violet }} />
                </button>
              )}

              {/* Send Follow-Up Button: Only visible when creator has NOT paid yet */}
              {!(actionModalProject.isDIY || actionModalProject.diySubscription?.active || actionModalProject.diyOfferStatus === 'paid' || actionModalProject.diyOfferStatus === 'accepted') && (
                <button
                  type="button"
                  onClick={() => {
                    const p = actionModalProject
                    setActionModalProject(null)
                    handleOpenEmailModal(p, 'followup')
                  }}
                  className="cpm-btn-quiet w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: C.warnSoft, color: C.warn }}
                    >
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold" style={{ color: C.text }}>Send Follow-Up</div>
                      <div className="text-[11px]" style={{ color: C.muted }}>
                        Dispatch personalized email to {actionModalProject.creatorEmail || 'creator'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: C.faint }} />
                </button>
              )}

              {/* Copy Workspace URL Button */}
              <button
                type="button"
                onClick={() => handleCopyUrl(actionModalProject)}
                className="cpm-btn-quiet w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: C.skySoft, color: C.sky }}
                  >
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: C.text }}>Copy Workspace URL</div>
                    <div className="text-[11px]" style={{ color: C.muted }}>
                      Copy direct portal authentication URL to clipboard
                    </div>
                  </div>
                </div>
                {copiedId === actionModalProject.id ? (
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: C.ok }}>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: C.faint }} />
                )}
              </button>

              {/* Live Portal Preview Link */}
              <a
                href={getCreatorWorkspaceUrl(actionModalProject)}
                target="_blank"
                rel="noreferrer"
                className="cpm-btn-quiet w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: C.skySoft, color: C.sky }}
                  >
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: C.text }}>Preview Portal View</div>
                    <div className="text-[11px]" style={{ color: C.muted }}>
                      Open partner workspace view in a new browser tab
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" style={{ color: C.faint }} />
              </a>

              {/* Delete Venture Button (Danger Zone) */}
              <div className="pt-2 border-t" style={{ borderColor: C.line }}>
                <button
                  type="button"
                  onClick={() => {
                    const p = actionModalProject
                    setActionModalProject(null)
                    handleDeleteProject(p)
                  }}
                  className="cpm-btn-danger w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: C.crimsonSoft, color: C.crimsonText }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold" style={{ color: C.crimsonText }}>
                        Delete Co-Launch Venture
                      </div>
                      <div className="text-[11px]" style={{ color: C.muted }}>
                        Purge workspace, tasks, and telemetry data
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: C.crimsonText }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REAL-TIME DIRECT EMAIL DISPATCH MODAL ── */}
      {emailModalProject && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl rounded-3xl border p-6 sm:p-8 space-y-5 relative shadow-2xl"
            style={{
              background: C.sheet,
              borderColor: C.lineStrong,
              color: C.text,
            }}
          >
            <button
              onClick={() => setEmailModalProject(null)}
              className="cpm-btn-quiet absolute top-5 right-5 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
                style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warnLine}` }}
              >
                <Send className="w-3 h-3" />
                Real-Time Direct Email Dispatch
              </span>
              <h2 className="text-lg font-black" style={{ ...HEADING_FONT, color: C.text }}>
                Send Follow-up to {emailModalProject.creatorName || emailModalProject.creatorHandle}
              </h2>
              <p className="text-xs" style={{ color: C.muted }}>
                Dispatches immediately from the studio SMTP server to <strong style={{ color: C.text }}>{emailModalProject.creatorEmail || 'creator email'}</strong>.
              </p>
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                Templates:
              </span>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'followup')}
                className="cpm-btn-quiet px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer"
              >
                Track Choice Reminder
              </button>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'invoice')}
                className="cpm-btn-quiet px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer"
              >
                ${getProjectPassPrice(emailModalProject)} Pass Invoice
              </button>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'portal_link')}
                className="cpm-btn-quiet px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer"
              >
                Workspace URL Dispatch
              </button>
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                Email Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="cpm-field w-full px-3.5 py-2.5 outline-none"
              />
            </div>

            {/* Body Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                Email Message Body
              </label>
              <textarea
                rows={9}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="cpm-field w-full p-3.5 outline-none leading-relaxed font-mono"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmailModalProject(null)}
                className="cpm-btn-quiet px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim()}
                className="cpm-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer disabled:opacity-40 flex items-center gap-2 shadow-sm"
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Email…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Follow-Up Real-Time 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL CO-BUILDER PASS FEE MODAL ── */}
      {showGlobalPriceModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingGlobalPrice) setShowGlobalPriceModal(false)
          }}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto shadow-2xl"
            style={{
              background: C.sheet,
              borderColor: C.lineStrong,
              color: C.text,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-3.5" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ ...HEADING_FONT, color: C.text }}>
                    Default Pass Fee
                  </h3>
                  <p className="text-xs" style={{ color: C.muted }}>
                    Standard Co-Builder Pass price for invitations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalPriceModal(false)}
                disabled={isSavingGlobalPrice}
                className="cpm-btn-quiet p-2 rounded-xl cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                Quick Presets
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {[25, 50, 75, 99, 149, 199].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGlobalPriceInput(amt)}
                    className="py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border"
                    style={
                      Number(globalPriceInput) === amt
                        ? { background: C.crimson, color: '#ffffff', borderColor: C.crimsonLine }
                        : { background: C.row, color: C.body, borderColor: C.line }
                    }
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                Pass Fee Amount (USD)
              </label>
              <div
                className="relative flex items-center rounded-xl border transition-all"
                style={{ background: C.row, borderColor: C.line }}
              >
                <span className="pl-3.5 text-base font-bold select-none" style={{ color: C.faint }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={globalPriceInput}
                  onChange={(e) => setGlobalPriceInput(e.target.value)}
                  className="w-full py-2.5 px-2 bg-transparent text-base font-black font-mono outline-none"
                  style={{ color: C.text }}
                  placeholder="50"
                />
                <div className="pr-3 shrink-0">
                  <span
                    className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md"
                    style={{ background: C.raised, color: C.muted, border: `1px solid ${C.line}` }}
                  >
                    USD
                  </span>
                </div>
              </div>
            </div>

            {/* Sync Checkbox */}
            <label
              className="flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all"
              style={{
                background: updatePendingWithGlobal ? C.raised : C.row,
                borderColor: updatePendingWithGlobal ? C.lineStrong : C.line,
              }}
            >
              <input
                type="checkbox"
                checked={updatePendingWithGlobal}
                onChange={(e) => setUpdatePendingWithGlobal(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 mt-0.5 rounded-md flex items-center justify-center shrink-0 border transition-all"
                style={{
                  background: updatePendingWithGlobal ? C.crimson : 'transparent',
                  borderColor: updatePendingWithGlobal ? C.crimson : C.faint,
                }}
              >
                {updatePendingWithGlobal && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-bold block" style={{ color: C.text }}>
                  Update all pending ventures to this fee
                </span>
                <span className="text-[11px] block leading-tight" style={{ color: C.muted }}>
                  Syncs this new fee across pending creator offers
                </span>
              </div>
            </label>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: C.line }}>
              <button
                type="button"
                onClick={() => setShowGlobalPriceModal(false)}
                disabled={isSavingGlobalPrice}
                className="cpm-btn-quiet px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGlobalPrice}
                disabled={isSavingGlobalPrice || !globalPriceInput || Number(globalPriceInput) < 0}
                className="cpm-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingGlobalPrice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save Pass Fee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PER-CREATOR CUSTOM PASS FEE MODAL ── */}
      {customPriceModalProject && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingCustomPrice) setCustomPriceModalProject(null)
          }}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto shadow-2xl"
            style={{
              background: C.sheet,
              borderColor: C.lineStrong,
              color: C.text,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-3.5" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black truncate" style={{ ...HEADING_FONT, color: C.text }}>
                    Creator Pass Fee
                  </h3>
                  <p className="text-xs truncate" style={{ color: C.muted }}>
                    {customPriceModalProject.creatorName || customPriceModalProject.creatorHandle || 'Creator'} • {customPriceModalProject.productName || 'Venture'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomPriceModalProject(null)}
                disabled={isSavingCustomPrice}
                className="cpm-btn-quiet p-2 rounded-xl cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                  Quick Presets
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveCustomPrice(true)}
                  disabled={isSavingCustomPrice}
                  className="text-[10px] font-bold cursor-pointer underline underline-offset-2"
                  style={{ color: C.crimsonText }}
                >
                  Reset to Default (${defaultPassPrice})
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[25, 50, 75, 99, 149, 199].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomPriceInput(amt)}
                    className="py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border"
                    style={
                      Number(customPriceInput) === amt
                        ? { background: C.crimson, color: '#ffffff', borderColor: C.crimsonLine }
                        : { background: C.row, color: C.body, borderColor: C.line }
                    }
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                Custom Fee For This Creator (USD)
              </label>
              <div
                className="relative flex items-center rounded-xl border transition-all"
                style={{ background: C.row, borderColor: C.line }}
              >
                <span className="pl-3.5 text-base font-bold select-none" style={{ color: C.faint }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  className="w-full py-2.5 px-2 bg-transparent text-base font-black font-mono outline-none"
                  style={{ color: C.text }}
                  placeholder={String(defaultPassPrice || 50)}
                />
                <div className="pr-3 shrink-0">
                  <span
                    className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md"
                    style={{ background: C.raised, color: C.muted, border: `1px solid ${C.line}` }}
                  >
                    USD
                  </span>
                </div>
              </div>
              <p className="text-[11px] pt-0.5" style={{ color: C.faint }}>
                Applied across this creator's invoice, emails, and unlock portal.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: C.line }}>
              <button
                type="button"
                onClick={() => setCustomPriceModalProject(null)}
                disabled={isSavingCustomPrice}
                className="cpm-btn-quiet px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveCustomPrice(false)}
                disabled={isSavingCustomPrice || !customPriceInput || Number(customPriceInput) < 0}
                className="cpm-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingCustomPrice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Apply Fee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL / OPERATOR CHECKOUT SIMULATOR MODAL ── */}
      {diyModalProject && (
        <DIYSubscriptionModal
          isOpen={Boolean(diyModalProject)}
          project={diyModalProject}
          onClose={() => setDiyModalProject(null)}
          onUnlockSuccess={() => {
            setDiyModalProject(null)
            loadData(true)
          }}
        />
      )}

      {/* ── GLOBAL TOAST ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl"
          style={{
            background: C.sheet,
            borderColor: C.lineStrong,
            color: C.text,
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" style={{ color: C.ok }} />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: C.crimsonText }} />
          )}
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold" style={{ color: C.text }}>{toast.title}</p>
            <p className="text-[11px]" style={{ color: C.muted }}>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
