import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2, DollarSign, Layout, Sparkles, Save, Check, Plus, Trash2,
  Loader2, AlertCircle, Copy, Video, MessageSquare, ExternalLink, Globe,
  CreditCard, Users, TrendingUp, RefreshCw, FileText, Megaphone, Target,
  Flag, ArrowRight, Layers, HelpCircle, BarChart3, Radio, ShieldCheck,
  Palette, Smartphone, Send, Mail, Image, Monitor, Zap, Compass, PieChart, Activity, Tablet, Calendar, Eye, X, Bell, Lock, RotateCcw,
  Youtube, Shield, Sliders, Trophy, Flame, Coins, Award, Crown, Radar, MousePointerClick, Camera, ShoppingBag, Gauge, Rocket, Clock, ShieldAlert,
  Download, Play, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  generateValidationPlanAI,
  generateValidationCampaignKitAI,
  generateDiscoverySurveyAI,
  analyzeSurveyResponsesAI,
  analyzeAndGenerateExperimentsAI
} from '../../services/ai'
import { simulateUniqueDeviceVisit } from '../../services/tracker'
import {
  updateValidationPlan,
  updateValidationCampaign,
  addProjectReservation,
  addProjectSurveyResponse,
  deleteSurveyResponse,
  clearAllSurveyResponses,
  logProjectActivity,
  recordGateDecision,
  updateCoLaunchProject,
  getFrontendUrl,
  sendTaskReminder,
  generateCampaignSocialImage,
  generateCampaignVideo,
  sendCampaignPostEmail,
  toggleAutonomousCampaignDelivery
} from '../../services/opsApi'
import {
  parseMainPricingAmount,
  parseDepositPricingAmount,
  sanitizePricingConfig
} from '../../utils/pricing'
import { getAiRecommendedTheme } from '../../utils/creatorTheme'
import {
  Phase1ValidateSkeleton,
  Phase1CampaignGenSkeleton,
  Phase1ExperimentsGenSkeleton
} from './Section2Skeletons'
import ProductMockupCanvas from './ProductMockupCanvas'
import AudienceGroundingModal from './AudienceGroundingModal'
import PostVisualMockup, { XLogo } from './PostVisualMockup'
import { getProjectAudienceGrounding } from '../../utils/audienceGrounding'
import { getPhase1StepGuards, getProjectActiveStep } from '../../utils/stepGuards'
import { fetchCreatorYouTubeVideos } from '../../services/scraper'
import Phase1Step1Plan from './phase1/Phase1Step1Plan'
import Phase1Step2Assets from './phase1/Phase1Step2Assets'
import Phase1Step3Campaign from './phase1/Phase1Step3Campaign'
import Phase1Step4Optimize from './phase1/Phase1Step4Optimize'
import Phase1Step5Gate from './phase1/Phase1Step5Gate'

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

const HEADING_FONT = { fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }

export default function Phase1Validate({
  project,
  api,
  activeStepId,
  onSelectStep,
  onUpdateProject,
  onAdvanceToPhase2
}) {
  const resolveInitialStep = () => {
    if (activeStepId) return activeStepId
    return getProjectActiveStep(project, 1)
  }
  const [activeStep, setActiveStep] = useState(resolveInitialStep)
  const [assetSubTab, setAssetSubTab] = useState('product_assets')
  const [campaignSubTab, setCampaignSubTab] = useState('schedule')
  const [viewDraftTask, setViewDraftTask] = useState(null)
  const [draftModalView, setDraftModalView] = useState('visual') // 'visual' | 'text'
  const [isAnalyzingExperiments, setIsAnalyzingExperiments] = useState(false)
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false)
  const [isIteratingGate, setIsIteratingGate] = useState(false)
  const [isArchivingProject, setIsArchivingProject] = useState(false)

  // Robust resolver to ensure experiments are NEVER lost across navigation, rerender, or polling
  const resolveExperimentsData = (proj) => {
    if (proj?.experimentsData?.experiments?.length > 0) return proj.experimentsData
    if (proj?.metadataInfo?.experimentsData?.experiments?.length > 0) return proj.metadataInfo.experimentsData
    if (proj?.metadata_info?.experiments_data?.experiments?.length > 0) return proj.metadata_info.experiments_data
    if (proj?.metadataInfo?.experiments_data?.experiments?.length > 0) return proj.metadataInfo.experiments_data
    if (Array.isArray(proj?.experiments) && proj.experiments.length > 0) {
      return {
        experiments: proj.experiments,
        performanceAudit: proj?.metadataInfo?.performanceAudit || proj?.metadata_info?.performanceAudit || null
      }
    }
    if (Array.isArray(proj?.telemetry?.experiments) && proj.telemetry.experiments.length > 0) {
      return {
        experiments: proj.telemetry.experiments,
        performanceAudit: proj?.metadataInfo?.performanceAudit || proj?.metadata_info?.performanceAudit || null
      }
    }
    return null
  }

  const [experimentsData, setExperimentsData] = useState(() => resolveExperimentsData(project))
  const [mockupImage, setMockupImage] = useState(() => project?.mockupImage || null)
  const [showAudienceIntelModal, setShowAudienceIntelModal] = useState(false)
  const [audienceIntelModalTab, setAudienceIntelModalTab] = useState('transcripts')
  const audienceGroundingData = getProjectAudienceGrounding(project)

  const creatorChannelUrl = (() => {
    if (project?.channelUrl && String(project.channelUrl).startsWith('http')) return project.channelUrl
    if (project?.youtubeUrl && String(project.youtubeUrl).startsWith('http')) return project.youtubeUrl
    if (project?.creatorChannel && String(project.creatorChannel).startsWith('http')) return project.creatorChannel
    if (project?.socialUrl && String(project.socialUrl).startsWith('http')) return project.socialUrl
    if (project?.channel_url && String(project.channel_url).startsWith('http')) return project.channel_url
    if (project?.youtube_url && String(project.youtube_url).startsWith('http')) return project.youtube_url

    const handle = String(project?.creatorHandle || project?.creator_handle || project?.handle || '').replace(/^@/, '').trim()
    if (handle && !/^[0-9a-f-]{10,}$/i.test(handle)) {
      return `https://www.youtube.com/@${handle}`
    }

    const name = String(project?.creatorName || project?.creator_name || '').trim()
    if (name && !/^[0-9a-f-]{10,}$/i.test(name)) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`
    }

    return 'https://www.youtube.com'
  })()

  const [isStep2Approved, setIsStep2Approved] = useState(() => Boolean(
    project?.assetsApproved ||
    project?.landingPageApproved ||
    project?.validationCampaign?.review_status === 'approved' ||
    project?.validationCampaign?.reviewStatus === 'approved'
  ))

  const theme = useMemo(() => {
    return getAiRecommendedTheme(project?.niche, project?.creatorHandle || project?.creator_handle || project?.creatorName)
  }, [project?.niche, project?.creatorHandle, project?.creator_handle, project?.creatorName])

  useEffect(() => {
    if (activeStepId) setActiveStep(activeStepId)
  }, [activeStepId])

  useEffect(() => {
    if (
      project?.assetsApproved ||
      project?.landingPageApproved ||
      project?.validationCampaign?.review_status === 'approved' ||
      project?.validationCampaign?.reviewStatus === 'approved'
    ) {
      setIsStep2Approved(true)
    }
  }, [
    project?.assetsApproved,
    project?.landingPageApproved,
    project?.validationCampaign?.review_status,
    project?.validationCampaign?.reviewStatus
  ])

  // Synchronize experimentsData whenever project prop updates or polling refreshes
  useEffect(() => {
    const incoming = resolveExperimentsData(project)
    if (incoming) {
      setExperimentsData(incoming)
      setExperiments(incoming.experiments || [])
    }
  }, [
    project?.id,
    project?.experimentsData,
    project?.metadataInfo?.experimentsData,
    project?.metadata_info?.experiments_data,
    project?.experiments,
    project?.telemetry?.experiments
  ])

  // Live YouTube Creator Uploads Synchronization (Guarded to run at most once per project ID)
  const ytFetchAttemptedRef = useRef({})
  useEffect(() => {
    const pId = project?.id
    if (!pId || ytFetchAttemptedRef.current[pId]) return
    const hasPosts = (Array.isArray(project?.recentPosts) && project.recentPosts.length > 0) ||
      (Array.isArray(project?.videos) && project.videos.length > 0)
    if (!hasPosts) {
      const cleanH = String(project?.creatorHandle || project?.creator_handle || project?.handle || project?.creatorName || '').replace(/^@/, '').trim()
      if (cleanH && !/^[0-9a-f-]{15,}$/i.test(cleanH)) {
        ytFetchAttemptedRef.current[pId] = true
        fetchCreatorYouTubeVideos(cleanH).then(vids => {
          if (vids && vids.length > 0 && onUpdateProject) {
            onUpdateProject(prev => {
              if (!prev) return prev
              return {
                ...prev,
                recentPosts: vids,
                videos: vids
              }
            })
          }
        }).catch(() => {})
      }
    }
  }, [project?.id, project?.creatorHandle, project?.recentPosts, onUpdateProject])

  // Real Project Presales State
  const [presalesRevenue, setPresalesRevenue] = useState(() => {
    if (project?.currentPresales !== undefined) {
      return Number(String(project.currentPresales).replace(/[^0-9.]/g, '')) || 0
    }
    return 0
  })
  // Real Project Reservations / Backers state
  const [reservations, setReservations] = useState(() => project?.reservations || [])

  // Real Project Validation Plan State
  const [plan, setPlan] = useState(() => project?.validationPlan || {
    customer: '',
    problem: '',
    offer: '',
    pricing: '',
    testMethod: '',
    period: '',
    threshold: ''
  })

  // Synchronize plan from project prop when database updates
  useEffect(() => {
    if (project?.validationPlan) {
      setPlan(project.validationPlan)
    }
  }, [project?.id, project?.validationPlan])

  // Check if Validation Plan has been explicitly generated
  const [hasPlanGenerated, setHasPlanGenerated] = useState(() => {
    if (project?.planGenerated !== undefined) return Boolean(project.planGenerated)
    if (project?.validationPlan?.generated !== undefined) return Boolean(project.validationPlan.generated)
    if (project?.planLocked || project?.validationPlan?.status === 'approved') return true
    return false
  })

  // Synchronize hasPlanGenerated from project prop when database updates
  useEffect(() => {
    if (project?.planGenerated !== undefined) {
      setHasPlanGenerated(Boolean(project.planGenerated))
    } else if (project?.validationPlan?.generated !== undefined) {
      setHasPlanGenerated(Boolean(project.validationPlan.generated))
    } else if (project?.planLocked || project?.validationPlan?.status === 'approved') {
      setHasPlanGenerated(true)
    }
  }, [project?.planGenerated, project?.validationPlan?.generated, project?.planLocked, project?.validationPlan?.status])

  // Reset generated state if Section 1 chosen concept changed
  useEffect(() => {
    const chosenName = project?.selectedConcept?.name
    if (chosenName && plan?.offer && !plan.offer.toLowerCase().includes(chosenName.toLowerCase())) {
      setHasPlanGenerated(false)
    }
  }, [project?.selectedConcept?.name, plan?.offer])

  // Dynamic pricing resolution
  const dynamicPricingSource =
    project?.selectedConcept?.pricing ||
    project?.pricing ||
    plan?.pricing ||
    project?.validationPlan?.pricing ||
    49
  const dynamicMainPrice = parseMainPricingAmount(dynamicPricingSource, 49)
  const dynamicDepositPrice = parseDepositPricingAmount(dynamicPricingSource, dynamicMainPrice)
  const dynamicVipPrice = Math.round(dynamicMainPrice * 2)

  // Dynamic presale target derived from validation plan threshold or project
  const parseThresholdAmount = (str) => {
    if (!str) return 0
    const match = String(str).replace(/,/g, '').match(/\$(\d+)/)
    return match ? Number(match[1]) : 0
  }
  const derivedPlanTarget = parseThresholdAmount(plan?.threshold || project?.validationPlan?.threshold)
  const presaleTarget = derivedPlanTarget > 0 ? derivedPlanTarget : Number(project?.presaleTarget || project?.targetRevenue || 5000)

  // Real Project Campaign Kit State (Database Sourced)
  const [campaignKit, setCampaignKit] = useState(() => {
    const fromProject = project?.campaignKit ||
      project?.validationCampaign?.campaignKit ||
      project?.validationCampaign?.campaign_kit ||
      (project?.validationCampaign?.productAssets?.announcementPost ? project?.validationCampaign?.productAssets : null) ||
      (project?.validationCampaign?.product_assets?.announcementPost ? project?.validationCampaign?.product_assets : null)
    if (fromProject && (fromProject.announcementPost || fromProject.storySequence || fromProject.videoScript || fromProject.newsletterDraft || fromProject.postingSchedule?.length > 0)) {
      return fromProject
    }
    return {
      announcementPost: '',
      storySequence: '',
      videoScript: '',
      newsletterDraft: '',
      directMessageScript: '',
      postingSchedule: [],
      landingPageCopy: null
    }
  })

  // Synchronize campaignKit from project prop when database updates
  useEffect(() => {
    const fromProject = project?.campaignKit ||
      project?.validationCampaign?.campaignKit ||
      project?.validationCampaign?.campaign_kit ||
      (project?.validationCampaign?.productAssets?.announcementPost ? project?.validationCampaign?.productAssets : null) ||
      (project?.validationCampaign?.product_assets?.announcementPost ? project?.validationCampaign?.product_assets : null)
    if (fromProject && (fromProject.announcementPost || fromProject.storySequence || fromProject.videoScript || fromProject.newsletterDraft || fromProject.postingSchedule?.length > 0)) {
      setCampaignKit(fromProject)
      if (fromProject.pacingMode) setCampaignPacing(fromProject.pacingMode)
      if (fromProject.postingFrequency) setPostingFrequency(fromProject.postingFrequency)
      if (fromProject.customPrompt !== undefined) setCampaignStrategyPrompt(fromProject.customPrompt)
    }
  }, [project?.id, project?.campaignKit, project?.validationCampaign?.campaignKit, project?.validationCampaign?.campaign_kit])

  // Sanitized dynamic pricing configuration
  const sanitizedPricingConfig = sanitizePricingConfig(
    campaignKit?.pricingConfig,
    project?.selectedConcept?.pricing ||
    project?.pricing ||
    project?.validationPlan?.pricing ||
    plan?.pricing ||
    project?.concepts?.find(c => c.selected)?.pricing
  )
  const activeFoundingPrice = sanitizedPricingConfig.foundingPrice
  const activeDepositPrice = sanitizedPricingConfig.depositPrice
  const activeVipPrice = Math.round(activeFoundingPrice * 2)

  // Simulated buyer form in Run & Optimize
  const [simBuyerName, setSimBuyerName] = useState('')
  const [simBuyerEmail, setSimBuyerEmail] = useState('')
  const [simBuyerTier, setSimBuyerTier] = useState(() => activeFoundingPrice)
  const [showRecordForm, setShowRecordForm] = useState(false)

  useEffect(() => {
    setSimBuyerTier(activeFoundingPrice)
  }, [activeFoundingPrice])

  // Creator Launch Pacing & Customizable Strategy Guidance Prompt
  const [campaignPacing, setCampaignPacing] = useState(() => project?.campaignKit?.pacingMode || 'low_burden')
  const [postingFrequency, setPostingFrequency] = useState(() => project?.campaignKit?.postingFrequency || '1 video per week (Standard YouTube)')
  const [campaignStrategyPrompt, setCampaignStrategyPrompt] = useState(() => project?.campaignKit?.customPrompt || '')

  // Check if Campaign Kit has been generated or populated
  const hasCampaignGenerated = Boolean(
    campaignKit && (
      (Array.isArray(campaignKit.postingSchedule) && campaignKit.postingSchedule.length > 0) ||
      Boolean(String(campaignKit.announcementPost || '').trim()) ||
      Boolean(String(campaignKit.storySequence || '').trim()) ||
      Boolean(String(campaignKit.videoScript || '').trim()) ||
      Boolean(String(campaignKit.newsletterDraft || '').trim())
    )
  )

  const todayTask = (campaignKit?.postingSchedule || []).find(t => t.isToday) ||
    (campaignKit?.postingSchedule || []).find(t => !t.done) ||
    (campaignKit?.postingSchedule || [])[0]

  // Real Project Survey & Research State (Database Sourced)
  const [surveyData, setSurveyData] = useState(() => {
    const fromProject = project?.surveyData || project?.validationCampaign?.researchSurvey || project?.validationCampaign?.research_survey
    if (fromProject && (fromProject.summary || fromProject.questions?.length > 0)) {
      return fromProject
    }
    return {
      summary: '',
      keyTakeaways: [],
      questions: []
    }
  })

  // Synchronize surveyData from project prop when database updates
  useEffect(() => {
    const fromProject = project?.surveyData || project?.validationCampaign?.researchSurvey || project?.validationCampaign?.research_survey
    if (fromProject && (fromProject.summary || fromProject.questions?.length > 0)) {
      setSurveyData(fromProject)
    }
  }, [project?.id, project?.surveyData, project?.validationCampaign?.researchSurvey, project?.validationCampaign?.research_survey])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionCategory, setNewQuestionCategory] = useState('Pain Point')

  // Real Survey & Research Responses
  const [surveyResponses, setSurveyResponses] = useState(() => {
    const raw = project?.surveyResponses ||
      project?.validationCampaign?.researchSurvey?.responses ||
      project?.validationCampaign?.research_survey?.responses ||
      project?.surveyData?.responses ||
      (project?.metadataInfo || project?.metadata_info)?.survey_responses
    return Array.isArray(raw) ? raw : []
  })
  const [surveyAnalysis, setSurveyAnalysis] = useState(() => {
    return project?.surveyAnalysis ||
      project?.validationCampaign?.researchSurvey?.analysis ||
      project?.validationCampaign?.research_survey?.analysis ||
      project?.surveyData?.analysis ||
      (project?.metadataInfo || project?.metadata_info)?.survey_analysis ||
      null
  })
  const [isAnalyzingResponses, setIsAnalyzingResponses] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageGenError, setImageGenError] = useState(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoGenError, setVideoGenError] = useState(null)
  const [isGeneratingSurvey, setIsGeneratingSurvey] = useState(false)

  // Real Project Optimization Experiments
  const [experiments, setExperiments] = useState(() => project?.experiments || [])

  // Loading & Action States
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [feedbackNotice, setFeedbackNotice] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)

  // Synchronize all Phase 1 states when project changes to prevent former creator data leakage
  useEffect(() => {
    if (!project) return
    setPresalesRevenue(Number(project.currentPresales || 0))
    setReservations(Array.isArray(project.reservations) ? project.reservations : [])
    if (project.validationPlan && (project.validationPlan.customer || project.validationPlan.status === 'approved')) {
      setPlan(project.validationPlan)
    } else {
      const seed = project.validationSeed
      setPlan({
        customer: seed?.customer || project.customer || project.targetAudience || '',
        problem: seed?.problem || project.problem || '',
        offer: seed?.offer ? `${seed.offer.pricing ? seed.offer.pricing + ' · ' : ''}${seed.offer.revenueModel || ''}` : '',
        pricing: seed?.offer?.pricing || project.pricing || '',
        testMethod: '',
        period: seed?.estimatedBuild || '',
        threshold: seed?.suggestedThreshold ? `$${seed.suggestedThreshold.target.toLocaleString()} in presales or ${seed.suggestedThreshold.buyers} pre-orders` : '',
        status: 'draft',
        locked: false
      })
    }

    const incomingKit = project.campaignKit ||
      project.validationCampaign?.campaignKit ||
      project.validationCampaign?.campaign_kit ||
      (project.validationCampaign?.productAssets?.announcementPost ? project.validationCampaign?.productAssets : null) ||
      (project.validationCampaign?.product_assets?.announcementPost ? project.validationCampaign?.product_assets : null)
    if (incomingKit && (incomingKit.announcementPost || incomingKit.videoScript || incomingKit.storySequence || incomingKit.newsletterDraft || incomingKit.postingSchedule?.length > 0)) {
      setCampaignKit(incomingKit)
      if (incomingKit.pacingMode) setCampaignPacing(incomingKit.pacingMode)
      if (incomingKit.postingFrequency) setPostingFrequency(incomingKit.postingFrequency)
      if (incomingKit.customPrompt !== undefined) setCampaignStrategyPrompt(incomingKit.customPrompt)
    } else {
      setCampaignKit(null)
    }

    const incomingSurvey = project.surveyData || project.validationCampaign?.researchSurvey || project.validationCampaign?.research_survey
    if (incomingSurvey && (incomingSurvey.summary || incomingSurvey.questions?.length > 0)) {
      setSurveyData(incomingSurvey)
    } else {
      setSurveyData(null)
    }

    const resolvedResponses = (Array.isArray(project.surveyResponses) && project.surveyResponses.length > 0)
      ? project.surveyResponses
      : (Array.isArray(incomingSurvey?.responses) ? incomingSurvey.responses : (Array.isArray((project.metadataInfo || project.metadata_info)?.survey_responses) ? (project.metadataInfo || project.metadata_info).survey_responses : []))

    const resolvedAnalysis = project.surveyAnalysis ||
      incomingSurvey?.analysis ||
      (project.metadataInfo || project.metadata_info)?.survey_analysis ||
      null

    setSurveyResponses(resolvedResponses)
    setSurveyAnalysis(resolvedAnalysis)
    const incomingExperiments = resolveExperimentsData(project)
    if (incomingExperiments) {
      setExperimentsData(incomingExperiments)
      setExperiments(incomingExperiments.experiments || [])
    } else {
      setExperiments(Array.isArray(project.experiments) ? project.experiments : [])
    }
  }, [project?.id, project?.creatorId, project?.productName])

  useEffect(() => {
    if (Array.isArray(project?.surveyResponses)) {
      setSurveyResponses(project.surveyResponses)
    }
  }, [project?.surveyResponses])

  useEffect(() => {
    if (project?.surveyAnalysis) {
      setSurveyAnalysis(project.surveyAnalysis)
    }
  }, [project?.surveyAnalysis])

  useEffect(() => {
    if (project?.reservations) setReservations(project.reservations)
  }, [project?.reservations])

  useEffect(() => {
    if (project?.currentPresales !== undefined) {
      setPresalesRevenue(Number(String(project.currentPresales).replace(/[^0-9.]/g, '')) || 0)
    }
  }, [project?.currentPresales])

  useEffect(() => {
    const handleSync = (e) => {
      try {
        const cur = (e?.detail && typeof e.detail === 'object') ? e.detail : null
        if (cur) {
          if (cur.reservations) setReservations(cur.reservations)
          if (cur.currentPresales !== undefined) setPresalesRevenue(Number(cur.currentPresales) || 0)
          if (onUpdateProject) {
            onUpdateProject(prev => ({ ...(prev || {}), ...cur }))
          }
        }
      } catch (err) {}
    }

    window.addEventListener('forge_project_updated', handleSync)
    return () => {
      window.removeEventListener('forge_project_updated', handleSync)
    }
  }, [onUpdateProject])

  const origin = getFrontendUrl()
  const productSlug = (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const normalizeUrlText = (text) => {
    if (typeof text !== 'string') return text
    const realPreorderUrl = `${origin}/preorder/${productSlug}`
    return text
      .replace(/https?:\/\/[a-zA-Z0-9\-_.]+\.creatorforge\.app\/preorder/gi, realPreorderUrl)
      .replace(/https?:\/\/[a-zA-Z0-9\-_.]+\.creatorforge\.app\/launch/gi, `${origin}/p/${productSlug}`)
      .replace(/https?:\/\/flutterflowflowai\.creatorforge\.app\/preorder/gi, realPreorderUrl)
      .replace(/https?:\/\/localhost:\d+\/preorder\/[a-zA-Z0-9\-_]+/gi, realPreorderUrl)
      .replace(/https?:\/\/localhost:\d+\/preorder/gi, realPreorderUrl)
      .replace(/https?:\/\/localhost:\d+\/p\/[a-zA-Z0-9\-_]+/gi, `${origin}/p/${productSlug}`)
      .replace(/https?:\/\/localhost:\d+\/p/gi, `${origin}/p`)
      .replace(/https?:\/\/localhost:\d+/gi, origin)
  }

  const showNotification = (msg) => {
    setFeedbackNotice(msg)
    setTimeout(() => setFeedbackNotice(''), 3500)
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    const sanitized = normalizeUrlText(text)
    navigator.clipboard?.writeText(sanitized)
    setCopiedKey(key)
    showNotification('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const updatePlan = (field, value) => {
    setPlan(prev => ({ ...prev, [field]: value }))
  }

  const campaignSyncTimerRef = useRef(null)
  const campaignParentTimerRef = useRef(null)
  const autoGenPlanTriggered = useRef(false)

  const updateCampaignKit = (field, value) => {
    setCampaignKit(prev => {
      const next = { ...prev, [field]: value }

      if (campaignParentTimerRef.current) clearTimeout(campaignParentTimerRef.current)
      campaignParentTimerRef.current = setTimeout(() => {
        if (onUpdateProject) {
          onUpdateProject(curr => ({
            ...(curr || {}),
            campaignKit: next,
            metadataInfo: { ...(curr?.metadataInfo || {}), campaign_kit: next }
          }))
        }
      }, 400)

      if (project?.id) {
        if (campaignSyncTimerRef.current) clearTimeout(campaignSyncTimerRef.current)
        campaignSyncTimerRef.current = setTimeout(() => {
          const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
            productName: project?.productName,
            productTagline: project?.productTagline,
            pricingConfig: sanitizedPricingConfig
          }
          updateValidationCampaign(project.id, {
            product_assets: step2Assets,
            campaign_kit: next,
            campaignKit: next,
            creator_tasks: next.postingSchedule || [],
            campaign_launched: true,
            infrastructure: {
              landingPageUrl: `/p/${productSlug}`,
              checkoutUrl: `/p/${productSlug}/checkout`,
              waitlistCount: 240,
              attributionTracking: true
            },
            research_survey: surveyData,
            review_status: 'approved'
          }).catch(e => console.warn('[Phase1] DB campaign auto-sync warning:', e))
        }, 800)
      }
      return next
    })
  }

  const assetFieldDebounceRef = useRef(null)
  const [assetName, setAssetName] = useState(() => project?.productName || '')
  const [assetTagline, setAssetTagline] = useState(() => project?.productTagline || '')
  const [assetTone, setAssetTone] = useState(() => project?.brandTone || 'Modern, Minimal, Dark SaaS')
  const [assetAudience, setAssetAudience] = useState(() => project?.targetAudience || project?.niche || 'Software Developers & Tech Pros')

  useEffect(() => {
    if (project?.productName !== undefined) setAssetName(project.productName || '')
    if (project?.productTagline !== undefined) setAssetTagline(project.productTagline || '')
    if (project?.brandTone !== undefined) setAssetTone(project.brandTone || 'Modern, Minimal, Dark SaaS')
    if (project?.targetAudience || project?.niche) setAssetAudience(project.targetAudience || project.niche || '')
  }, [project?.id, project?.selectedConcept?.name])

  const updateAssetField = (field, val) => {
    if (assetFieldDebounceRef.current) clearTimeout(assetFieldDebounceRef.current)
    assetFieldDebounceRef.current = setTimeout(() => {
      if (onUpdateProject) {
        onUpdateProject(p => {
          if (!p) return p
          if (field === 'targetAudience') {
            return { ...p, targetAudience: val, niche: val }
          }
          return { ...p, [field]: val }
        })
      }
    }, 400)
  }

  const saveAll = () => {
    setSaveStatus('saving')
    const kitToSave = campaignKit ? {
      ...campaignKit,
      pacingMode: campaignPacing,
      postingFrequency,
      customPrompt: campaignStrategyPrompt
    } : null

    const updated = {
      ...(project || {}),
      validationPlan: plan,
      presaleTarget: presaleTarget,
      targetRevenue: presaleTarget,
      campaignKit: kitToSave,
      surveyData: surveyData,
      reservations: reservations,
      experiments: experimentsData?.experiments || experiments || [],
      experimentsData: experimentsData,
      currentPresales: presalesRevenue,
      ...(isStep2Approved ? { assetsApproved: true, landingPageApproved: true } : {})
    }

    if (onUpdateProject) {
      onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    }

    // Persist to backend database tables in SQLite / PostgreSQL
    if (project?.id) {
      logProjectActivity(project.id, {
        action: 'Validation Plan & Assets Configured',
        details: `Saved pricing (${plan.pricing || '$49/mo'}), presale target ($${presaleTarget.toLocaleString()}), and validation campaign assets.`,
        step: 'plan',
        phase: 1
      }).catch(e => console.warn('[Phase1] Activity logging warning:', e))

      updateValidationPlan(project.id, {
        customer: plan.customer,
        problem: plan.problem,
        offer: plan.offer,
        pricing: plan.pricing,
        test_method: plan.testMethod,
        period: plan.period,
        threshold: plan.threshold,
        target_revenue: presaleTarget
      }).catch(e => console.warn('[Phase1] DB plan sync warning:', e))

      const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
        productName: project?.productName,
        productTagline: project?.productTagline,
        pricingConfig: sanitizedPricingConfig
      }
      updateValidationCampaign(project.id, {
        product_assets: step2Assets,
        campaign_kit: kitToSave,
        campaignKit: kitToSave,
        creator_tasks: kitToSave?.postingSchedule || project?.creatorTasks || [],
        campaign_launched: Boolean(project?.campaignLaunched || hasCampaignGenerated),
        infrastructure: {
          landingPageUrl: `/p/${productSlug}`,
          checkoutUrl: `/p/${productSlug}/checkout`,
          waitlistCount: 240,
          attributionTracking: true
        },
        research_survey: surveyData,
        review_status: 'approved'
      }).catch(e => console.warn('[Phase1] DB campaign sync warning:', e))

      updateCoLaunchProject(project.id, {
        campaignKit: kitToSave,
        campaign_kit: kitToSave,
        campaignLaunched: Boolean(project?.campaignLaunched || hasCampaignGenerated),
        experimentsData: experimentsData,
        experiments: experimentsData?.experiments || experiments || [],
        metadataInfo: {
          ...(project?.metadataInfo || {}),
          campaign_kit: kitToSave,
          campaign_launched: Boolean(project?.campaignLaunched || hasCampaignGenerated),
          experimentsData: experimentsData
        }
      }).catch(() => {})
    }

    setTimeout(() => {
      setSaveStatus('saved')
      showNotification('Validation plan & assets saved!')
      setTimeout(() => setSaveStatus('idle'), 2500)
    }, 250)
  }

  const generatePlan = async () => {
    setIsGenerating(true)
    setSaveStatus('saving')
    showNotification('Architecting AI Validation Plan from Section 1 concept...')
    try {
      let generated = null
      if (api?.generateValidationPlan) {
        generated = await api.generateValidationPlan(project)
      } else {
        generated = await generateValidationPlanAI(project)
      }

      if (generated) {
        const generatedDraft = {
          ...generated,
          status: 'draft',
          locked: false
        }
        setPlan(generatedDraft)
        setHasPlanGenerated(true)
        const newTarget = parseThresholdAmount(generated.threshold) || 12500
        const updated = {
          ...(project || {}),
          planGenerated: true,
          validationPlan: { ...generatedDraft, generated: true },
          presaleTarget: newTarget,
          targetRevenue: newTarget,
          campaignKit,
          surveyData,
          reservations,
          currentPresales: presalesRevenue
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

        // Directly persist and sync to MongoDB Atlas
        if (project?.id) {
          updateValidationPlan(project.id, {
            customer: generatedDraft.customer,
            problem: generatedDraft.problem,
            offer: generatedDraft.offer,
            pricing: generatedDraft.pricing,
            test_method: generatedDraft.testMethod,
            period: generatedDraft.period,
            threshold: generatedDraft.threshold,
            target_revenue: newTarget,
            generated: true,
            status: 'draft'
          }).catch(e => console.warn('[Phase1] DB plan sync warning:', e))

          updateCoLaunchProject(project.id, {
            planGenerated: true,
            plan_generated: true,
            validationPlan: { ...generatedDraft, generated: true },
            validation_plan: { ...generatedDraft, generated: true },
            presaleTarget: newTarget,
            presale_target: newTarget,
            targetRevenue: newTarget,
            target_revenue: newTarget
          }).catch(e => console.warn('[Phase1] DB project sync warning:', e))
        }

        setSaveStatus('saved')
        showNotification('AI Validation Plan generated and synced with database.')
        setTimeout(() => setSaveStatus('idle'), 2500)
      }
    } catch (err) {
      console.error('Validation plan error:', err)
      showNotification(`Failed to generate validation plan: ${err.message || 'Please verify AI keys.'}`)
      setSaveStatus('idle')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCampaign = async () => {
    setIsGeneratingCampaign(true)
    showNotification('Generating AI Campaign Kit: tailored roadmap, video scripts & posts...')
    try {
      let projectForGen = project
      const hasPosts = (Array.isArray(project?.recentPosts) && project.recentPosts.length > 0) ||
        (Array.isArray(project?.videos) && project.videos.length > 0)
      if (!hasPosts) {
        const cleanH = String(project?.creatorHandle || project?.creator_handle || project?.handle || project?.creatorName || '').replace(/^@/, '').trim()
        if (cleanH && !/^[0-9a-f-]{15,}$/i.test(cleanH)) {
          try {
            const fetched = await fetchCreatorYouTubeVideos(cleanH)
            if (fetched && fetched.length > 0) {
              projectForGen = {
                ...(project || {}),
                recentPosts: fetched,
                videos: fetched
              }
              if (onUpdateProject) {
                onUpdateProject(prev => ({
                  ...(prev || {}),
                  recentPosts: fetched,
                  videos: fetched
                }))
              }
            }
          } catch (e) {
            console.warn('Could not pre-fetch videos for campaign generation:', e)
          }
        }
      }

      const generated = await generateValidationCampaignKitAI(projectForGen, {
        pacing: campaignPacing,
        postingFrequency,
        customPrompt: campaignStrategyPrompt?.trim() || "based on creator's normal posting frequency, what you think will hit the next phase goal, what will be enough but not burden the creator..."
      })
      if (generated) {
        generated.pacingMode = campaignPacing
        generated.postingFrequency = postingFrequency
        generated.customPrompt = campaignStrategyPrompt
        setCampaignKit(generated)
        const updated = {
          ...(project || {}),
          validationPlan: plan,
          campaignKit: generated,
          campaignLaunched: true,
          campaignAssetsGenerated: true,
          creatorTasks: generated.postingSchedule || project?.creatorTasks || [],
          surveyData,
          reservations,
          currentPresales: presalesRevenue
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

        // Persist immediately to backend database
        if (project?.id) {
          const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
            productName: project?.productName,
            productTagline: project?.productTagline,
            pricingConfig: sanitizedPricingConfig
          }
          try {
            await updateValidationCampaign(project.id, {
              product_assets: step2Assets,
              campaign_kit: generated,
              campaignKit: generated,
              creator_tasks: generated.postingSchedule || [],
              campaign_launched: true,
              infrastructure: {
                landingPageUrl: `/p/${productSlug}`,
                checkoutUrl: `/p/${productSlug}/checkout`,
                waitlistCount: 240,
                attributionTracking: true
              },
              research_survey: surveyData,
              review_status: 'approved'
            })

            await updateCoLaunchProject(project.id, {
              campaignKit: generated,
              campaign_kit: generated,
              campaignLaunched: true,
              metadataInfo: {
                ...(project?.metadataInfo || {}),
                campaign_kit: generated,
                campaign_launched: true
              }
            }).catch(() => {})
          } catch (e) {
            console.warn('[Phase1] DB campaign auto-sync warning:', e)
          }

          logProjectActivity(project.id, {
            action: 'AI Campaign Content Generated & Locked',
            details: `Generated tailored creator launch roadmap (${campaignPacing === 'low_burden' ? '4 non-burdensome milestones' : 'paced sprint'}) with video scripts, newsletter, and social assets.`,
            step: 'campaign',
            phase: 1
          }).catch(e => console.warn(e))
        }

        showNotification('Creator campaign assets generated with AI and saved to database.')

        // Auto-generate post graphic (OpenAI) and video teaser (Veo 3.1) in parallel
        showNotification('Generating AI Campaign: image & video teaser...')
        handleGeneratePostImage(null, generated).catch(e => console.warn('Auto image gen warning:', e))
        handleGenerateCampaignVideo(null, generated).catch(e => console.warn('Auto video gen warning:', e))
      }
    } catch (err) {
      console.error('Campaign generation error:', err)
      showNotification(`Failed to generate campaign assets: ${err.message || 'Please retry.'}`)
    } finally {
      setIsGeneratingCampaign(false)
    }
  }

  const handleGeneratePostImage = async (customPrompt = null, targetKit = null) => {
    if (!project?.id) {
      showNotification('Please save or select a valid project first.')
      return
    }
    const baseKit = targetKit || campaignKit || {}
    setImageGenError(null)
    setIsGeneratingImage(true)
    showNotification('Generating image (OpenAI Astra)...')
    try {
      const promptToUse = typeof customPrompt === 'string' && customPrompt.trim()
        ? customPrompt.trim()
        : undefined
      const isCreator = window.location.pathname.includes('/portal') || window.location.search.includes('role=creator')
      const res = await generateCampaignSocialImage(project.id, {
        prompt: promptToUse,
        caller: isCreator ? 'creator' : 'admin'
      })
      if (res?.success && res?.media) {
        const newImgUrl = res.media.url
        const existingSchedule = baseKit?.postingSchedule || campaignKit?.postingSchedule || []
        const updatedSchedule = existingSchedule.map(t => {
          const ch = (t.channel || '').toLowerCase()
          const ti = (t.title || '').toLowerCase()
          const dk = t.draftKey || ''
          const isPost = dk === 'announcementPost' || (dk !== 'videoScript' && dk !== 'newsletterDraft' && dk !== 'storySequence' && (ti.includes('announcement') || ti.includes('launch') || (!ch.includes('video') && !ch.includes('story') && !ch.includes('email') && !ch.includes('newsletter'))))
          if (isPost) {
            return {
              ...t,
              imageUrl: newImgUrl,
              postImageUrl: newImgUrl,
              imageGeneratedAt: new Date().toISOString()
            }
          }
          return t
        })

        const nextKit = {
          ...baseKit,
          postImageUrl: res.media.url,
          postImageDataUrl: res.media.data_url,
          postImagePrompt: res.media.prompt,
          postImageModel: res.media.model,
          postImageProvider: res.media.provider,
          cloudinaryPublicId: res.media.cloudinary_public_id,
          cloudinaryUrl: res.media.cloudinary_url,
          creatorFolder: res.media.creator_folder,
          creatorSlug: res.media.creator_slug,
          isCloudinary: res.media.is_cloudinary,
          postingSchedule: updatedSchedule
        }
        setCampaignKit(prev => ({ ...(prev || {}), ...nextKit }))
        setImageGenError(null)
        if (onUpdateProject) {
          onUpdateProject(curr => ({
            ...(curr || {}),
            campaignKit: { ...(curr?.campaignKit || {}), ...nextKit },
            metadataInfo: { ...(curr?.metadataInfo || {}), campaign_kit: { ...(curr?.metadataInfo?.campaign_kit || {}), ...nextKit } }
          }))
        }
        showNotification('Image generated and saved.')
      } else {
        throw new Error(res?.detail || 'Failed to generate image')
      }
    } catch (err) {
      console.error('Image generation error:', err)
      const cleanMsg = err?.message || 'Image generation failed. Please try again.'
      setImageGenError(cleanMsg)
      showNotification(`Image generation failed: ${cleanMsg}`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleGenerateCampaignVideo = async (customPrompt = null, targetKit = null) => {
    if (!project?.id) {
      showNotification('Please save or select a valid project first.')
      return
    }
    const baseKit = targetKit || campaignKit || {}
    setVideoGenError(null)
    setIsGeneratingVideo(true)
    showNotification('Generating video (Veo 3.1)...')
    try {
      const promptToUse = typeof customPrompt === 'string' && customPrompt.trim()
        ? customPrompt.trim()
        : undefined
      const isCreator = window.location.pathname.includes('/portal') || window.location.search.includes('role=creator')
      const res = await generateCampaignVideo(project.id, {
        prompt: promptToUse,
        postImageUrl: baseKit?.postImageUrl || campaignKit?.postImageUrl,
        caller: isCreator ? 'creator' : 'admin'
      })
      if (res?.success && res?.media) {
        const newVidUrl = res.media.url
        const existingSchedule = baseKit?.postingSchedule || campaignKit?.postingSchedule || []
        const updatedSchedule = existingSchedule.map(t => {
          const ch = (t.channel || '').toLowerCase()
          const ti = (t.title || '').toLowerCase()
          const dk = t.draftKey || ''
          const isVideo = dk === 'videoScript' || (dk !== 'announcementPost' && dk !== 'newsletterDraft' && dk !== 'storySequence' && (ch.includes('video') || ch.includes('reel') || ch.includes('short') || (ch.includes('youtube') && !ch.includes('community')) || ti.includes('video')))
          if (isVideo) {
            return {
              ...t,
              videoUrl: newVidUrl,
              thumbnailUrl: res.media.thumbnail_url || newVidUrl,
              videoGeneratedAt: new Date().toISOString()
            }
          } else if (dk === 'announcementPost' && t.videoUrl) {
            const copy = { ...t }
            delete copy.videoUrl
            delete copy.thumbnailUrl
            delete copy.videoGeneratedAt
            return copy
          }
          return t
        })

        const nextKit = {
          ...baseKit,
          videoUrl: res.media.url,
          videoPrompt: res.media.prompt,
          videoModel: res.media.model,
          videoProvider: res.media.provider,
          cloudinaryVideoPublicId: res.media.cloudinary_public_id,
          cloudinaryVideoUrl: res.media.cloudinary_url,
          videoThumbnailUrl: res.media.thumbnail_url,
          videoOptimizeUrl: res.media.optimize_url,
          creatorFolder: res.media.creator_folder,
          creatorSlug: res.media.creator_slug,
          isVideoCloudinary: res.media.is_cloudinary,
          postingSchedule: updatedSchedule
        }
        setCampaignKit(prev => ({ ...(prev || {}), ...nextKit }))
        setVideoGenError(null)
        if (onUpdateProject) {
          onUpdateProject(curr => ({
            ...(curr || {}),
            campaignKit: { ...(curr?.campaignKit || {}), ...nextKit },
            metadataInfo: { ...(curr?.metadataInfo || {}), campaign_kit: { ...(curr?.metadataInfo?.campaign_kit || {}), ...nextKit } }
          }))
        }
        showNotification('Video generated and saved.')
      } else {
        throw new Error(res?.detail || 'Failed to generate video')
      }
    } catch (err) {
      console.error('Video generation error:', err)
      const cleanMsg = err?.message || 'Video generation failed. Please try again.'
      setVideoGenError(cleanMsg)
      showNotification(`Video generation failed: ${cleanMsg}`)
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  const handleToggleScheduleTask = (taskId) => {
    const schedule = campaignKit?.postingSchedule || []
    const updatedSchedule = schedule.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    updateCampaignKit('postingSchedule', updatedSchedule)
    showNotification('Daily task status updated!')
  }

  const detectedTimezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
    } catch {
      return 'America/New_York'
    }
  })()

  const [sendingEmailTaskId, setSendingEmailTaskId] = useState(null)
  const [isSendingTodayEmail, setIsSendingTodayEmail] = useState(false)
  const [autonomousEmail, setAutonomousEmail] = useState(
    campaignKit?.autonomousEmailDelivery?.recipientEmail || project?.creatorEmail || project?.creator_email || ''
  )
  const [isAutonomousEnabled, setIsAutonomousEnabled] = useState(
    Boolean(campaignKit?.autonomousEmailDelivery?.enabled)
  )
  const [creatorTimezone, setCreatorTimezone] = useState(
    campaignKit?.autonomousEmailDelivery?.timezone ||
    campaignKit?.creatorTimezone ||
    project?.creatorTimezone ||
    project?.timezone ||
    detectedTimezone
  )
  const [creatorCountry, setCreatorCountry] = useState(
    campaignKit?.autonomousEmailDelivery?.country ||
    campaignKit?.creatorCountry ||
    project?.creatorCountry ||
    project?.country ||
    'United States'
  )
  const [isSavingAutonomousConfig, setIsSavingAutonomousConfig] = useState(false)
  const [copiedTaskId, setCopiedTaskId] = useState(null)

  useEffect(() => {
    if (campaignKit?.autonomousEmailDelivery?.recipientEmail) {
      setAutonomousEmail(campaignKit.autonomousEmailDelivery.recipientEmail)
    } else if (project?.creatorEmail || project?.creator_email) {
      setAutonomousEmail(project.creatorEmail || project.creator_email)
    }
    if (campaignKit?.autonomousEmailDelivery?.enabled !== undefined) {
      setIsAutonomousEnabled(campaignKit.autonomousEmailDelivery.enabled)
    }
    if (campaignKit?.autonomousEmailDelivery?.timezone || campaignKit?.creatorTimezone) {
      setCreatorTimezone(campaignKit.autonomousEmailDelivery?.timezone || campaignKit.creatorTimezone)
    }
    if (campaignKit?.autonomousEmailDelivery?.country || campaignKit?.creatorCountry) {
      setCreatorCountry(campaignKit.autonomousEmailDelivery?.country || campaignKit.creatorCountry)
    }
  }, [campaignKit?.autonomousEmailDelivery, campaignKit?.creatorTimezone, campaignKit?.creatorCountry, project?.creatorEmail, project?.creator_email])

  const handleSendPostKitEmail = async (task = null) => {
    if (!project?.id) return
    const tId = task?.id || null
    const day = task?.day || null
    if (tId) setSendingEmailTaskId(tId)
    else setIsSendingTodayEmail(true)

    try {
      const res = await sendCampaignPostEmail(project.id, {
        taskId: tId,
        day: day,
        recipientEmail: autonomousEmail || undefined
      })
      if (res?.success) {
        showNotification(`Post Kit sent to ${res.recipient}. Check inbox.`)
        if (res?.project?.validationCampaign?.campaignKit) {
          setCampaignKit(res.project.validationCampaign.campaignKit)
        } else {
          setCampaignKit(prev => {
            const schedule = [...(prev?.postingSchedule || [])].map(t =>
              (tId && t.id === tId) || (day && t.day === day)
                ? { ...t, emailed: true, lastEmailedAt: new Date().toISOString() }
                : t
            )
            return { ...prev, postingSchedule: schedule }
          })
        }
      } else {
        throw new Error(res?.detail || res?.message || 'Failed to dispatch email')
      }
    } catch (err) {
      console.error('Email dispatch error:', err)
      showNotification(`Could not send post kit: ${err.message || 'Check email configuration'}`)
    } finally {
      setSendingEmailTaskId(null)
      setIsSendingTodayEmail(false)
    }
  }

  const handleToggleAutonomousEmail = async (enabled, customTz = null, customCountry = null) => {
    if (!project?.id) return
    setIsSavingAutonomousConfig(true)
    const tzToUse = customTz || creatorTimezone || detectedTimezone
    const countryToUse = customCountry || creatorCountry || 'United States'
    try {
      const res = await toggleAutonomousCampaignDelivery(project.id, {
        enabled,
        recipientEmail: autonomousEmail,
        preferredHour: 0,
        timezone: tzToUse,
        country: countryToUse
      })
      if (res?.success) {
        setIsAutonomousEnabled(enabled)
        setCampaignKit(prev => ({
          ...(prev || {}),
          creatorTimezone: tzToUse,
          creatorCountry: countryToUse,
          autonomousEmailDelivery: {
            ...(prev?.autonomousEmailDelivery || {}),
            enabled,
            recipientEmail: autonomousEmail,
            preferredHour: 0,
            intervalHours: 24,
            intervalSeconds: 86400,
            cadence: '24_hours',
            timezone: tzToUse,
            country: countryToUse,
            dispatchTime: 'Every 24 Hours',
            dispatchSchedule: `Every 24 Hours (${tzToUse})`
          }
        }))
        showNotification(enabled ? 'Autonomous post delivery active: Every 24 hours.' : '24-Hour delivery paused.')
      }
    } catch (err) {
      showNotification(`Failed to update delivery settings: ${err.message}`)
    } finally {
      setIsSavingAutonomousConfig(false)
    }
  }

  const handleToggleAutonomous = (enabled) => {
    const nextState = typeof enabled === 'boolean' ? enabled : !isAutonomousEnabled
    return handleToggleAutonomousEmail(nextState)
  }

  const handleDownloadAsset = (url, defaultName) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = defaultName || 'campaign-asset'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showNotification('Asset download started.')
  }

  const handleCopyTextWithFeedback = (text, taskId) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedTaskId(taskId)
    showNotification('Caption copied to clipboard.')
    setTimeout(() => setCopiedTaskId(null), 2500)
  }

  const [remindingTaskId, setRemindingTaskId] = useState(null)

  const handleSendTaskReminder = async (task) => {
    if (!task || !project?.id) return
    setRemindingTaskId(task.id)
    try {
      const res = await sendTaskReminder(project.id, task.id)
      if (res && res.status === 'sent') {
        showNotification(`Reminder email sent to ${project.creatorName || 'creator'} (${res.sentTo?.join(', ') || project.creatorEmail || 'creator'})!`)
      } else {
        showNotification(`Reminder logged for ${project.creatorName || 'creator'}!`)
      }
    } catch (err) {
      console.warn('[Phase1] Failed to dispatch task reminder:', err)
      showNotification(`Reminder notification logged for ${project.creatorName || 'creator'}.`)
    } finally {
      setRemindingTaskId(null)
    }
  }

  const handleWhatsAppNudge = (task) => {
    const creatorName = project?.creatorName || 'Hey'
    const portalSlug = (project?.creatorHandle || project?.creatorName || 'creator').replace(/[@ ]/g, '').toLowerCase()
    const portalUrl = `${window.location.origin}/portal/${portalSlug}`
    const text = `Hey ${creatorName}! Quick heads-up: our Day ${task.day || task.dayNumber || 1} co-launch mission for ${project?.productName || 'our product'} (${task.channel}) is ready to post. Here is your draft & link: ${portalUrl}. Let me know once it's live!`
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      showNotification('WhatsApp nudge message copied to clipboard.')
    }
    const phone = (project?.creatorPhone || '').replace(/[^0-9]/g, '')
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  const getTaskDraftContent = (task, overrideType = null) => {
    if (!task) return ''
    const effectiveType = overrideType || task.viewType
    if (effectiveType === 'video') return normalizeUrlText(campaignKit?.videoScript || '60s Short-Form Video Script')
    if (effectiveType === 'story') return normalizeUrlText(campaignKit?.storySequence || 'STORY 1 — Poll\nSTORY 2 — Product Reveal\nSTORY 3 — Pre-Order Link CTA')
    if (effectiveType === 'newsletter') return normalizeUrlText(campaignKit?.newsletterDraft || 'Email Newsletter Broadcast Draft')
    if (effectiveType === 'dm') return normalizeUrlText(campaignKit?.directMessageScript || '1-on-1 DM Script')
    if (effectiveType === 'post') return normalizeUrlText(campaignKit?.announcementPost || 'Social Announcement Post Copy')

    let content = ''
    if (task.draftKey === 'storySequence') content = campaignKit?.storySequence || 'STORY 1 — Poll\nSTORY 2 — Product Reveal\nSTORY 3 — Pre-Order Link CTA'
    else if (task.draftKey === 'videoScript') content = campaignKit?.videoScript || '60s Short-Form Video Script'
    else if (task.draftKey === 'newsletterDraft') content = campaignKit?.newsletterDraft || 'Email Newsletter Broadcast Draft'
    else if (task.draftKey === 'directMessageScript') content = campaignKit?.directMessageScript || '1-on-1 DM Script'
    else content = campaignKit?.announcementPost || 'Social Announcement Post Copy'
    return normalizeUrlText(content)
  }

  const handleGenerateSurvey = async () => {
    setIsGeneratingSurvey(true)
    showNotification('Generating dynamic AI discovery survey questions...')
    try {
      const generated = await generateDiscoverySurveyAI(project)
      if (generated) {
        setSurveyData(generated)
        const updated = {
          ...(project || {}),
          surveyData: generated
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        if (project?.id) {
          updateValidationCampaign(project.id, {
            research_survey: generated
          }).catch(e => console.warn('[Phase1] DB survey sync warning:', e))
        }
        showNotification('Dynamic AI discovery survey generated and saved.')
      }
    } catch (err) {
      console.error('Survey generation error:', err)
      showNotification(`Failed to generate survey questions: ${err.message || 'Please retry.'}`)
    } finally {
      setIsGeneratingSurvey(false)
    }
  }

  const handleAddQuestion = (e) => {
    e.preventDefault()
    if (!newQuestionText.trim()) return
    const newQ = {
      id: `q-${Date.now()}`,
      category: newQuestionCategory,
      question: newQuestionText.trim(),
      responseCount: 0,
      topInsight: 'Awaiting responses.'
    }
    const updated = {
      ...surveyData,
      questions: [...(surveyData.questions || []), newQ]
    }
    setSurveyData(updated)
    setNewQuestionText('')
    if (onUpdateProject) onUpdateProject(p => ({ ...(p || {}), surveyData: updated }))
    if (project?.id) {
      updateValidationCampaign(project.id, {
        research_survey: updated
      }).catch(e => console.warn('[Phase1] DB survey sync warning:', e))
    }
    showNotification('Question added to discovery survey.')
  }

  const handleAnalyzeResponses = async () => {
    if (!surveyResponses || surveyResponses.length === 0) {
      showNotification('Please collect at least 1 audience survey response.')
      return
    }
    setIsAnalyzingResponses(true)
    try {
      const result = await analyzeSurveyResponsesAI(project, surveyResponses)
      if (result) {
        setSurveyAnalysis(result)
        const updated = { ...(project || {}), surveyAnalysis: result }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        if (project?.id) {
          updateCoLaunchProject(project.id, {
            metadataInfo: {
              ...(project?.metadataInfo || {}),
              survey_analysis: result
            }
          }).catch(e => console.warn('[Phase1] DB survey analysis sync warning:', e))
        }
        showNotification(`AI analysis complete! Score: ${result.overallScore}/100`)
      }
    } catch (err) {
      console.error('Survey analysis error:', err)
      showNotification('Failed to analyze responses with AI.')
    } finally {
      setIsAnalyzingResponses(false)
    }
  }

  const handleDeleteSurveyResponse = async (responseId) => {
    try {
      const nextResponses = surveyResponses.filter(r => r.id !== responseId)
      setSurveyResponses(nextResponses)

      const updatedQuestions = (surveyData?.questions || []).map(q => {
        const remainingCount = nextResponses.filter(r => {
          const ans = r.answers || {}
          return ans[q.id] && String(ans[q.id]).trim().length > 0
        }).length
        return { ...q, responseCount: remainingCount }
      })
      const updatedSurveyData = {
        ...surveyData,
        questions: updatedQuestions,
        responses: nextResponses
      }
      setSurveyData(updatedSurveyData)

      if (project?.id) {
        const updatedProj = await deleteSurveyResponse(project.id, responseId)
        if (updatedProj && onUpdateProject) {
          onUpdateProject(updatedProj)
        }
      }
      showNotification('Survey response removed.')
    } catch (err) {
      console.error('Delete survey response error:', err)
      showNotification('Failed to delete response.')
    }
  }

  const handleClearAllSurveyResponses = async () => {
    if (!window.confirm('Clear all audience survey responses?')) return
    try {
      setSurveyResponses([])
      setSurveyAnalysis(null)
      const updatedQuestions = (surveyData?.questions || []).map(q => ({
        ...q,
        responseCount: 0
      }))
      const updatedSurveyData = {
        ...surveyData,
        questions: updatedQuestions,
        responses: [],
        analysis: null
      }
      setSurveyData(updatedSurveyData)

      if (project?.id) {
        const updatedProj = await clearAllSurveyResponses(project.id)
        if (updatedProj && onUpdateProject) {
          onUpdateProject(updatedProj)
        }
      }
      showNotification('All survey responses cleared.')
    } catch (err) {
      console.error('Clear survey responses error:', err)
      showNotification('Failed to clear responses.')
    }
  }

  const handleSimulateSurveyResponse = async () => {
    const sampleNames = ['Marcus Vance', 'Sarah Jenkins', 'Elena Rostova', 'David Chen', 'Amara Okafor']
    const sampleProblems = [
      'Current tools take 3+ hours daily. Need direct automation for creators.',
      'Manual multi-step workflow is broken. Would gladly pay for an integrated suite.',
      'Excited for this co-founder collaboration. Ready to test early beta and pre-order.'
    ]
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const randomEmail = `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`
    const sampleResp = {
      id: `resp-${Date.now()}`,
      name: randomName,
      email: randomEmail,
      rating: Math.floor(Math.random() * 3) + 8, // 8, 9, 10
      answers: {
        'Workflow Bottleneck': sampleProblems[Math.floor(Math.random() * sampleProblems.length)],
        'Pricing Viability': `$${activeFoundingPrice}/year is fair for this value.`
      },
      submittedAt: 'Just now',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    const nextResponses = [sampleResp, ...surveyResponses]
    setSurveyResponses(nextResponses)
    if (onUpdateProject) onUpdateProject(p => ({ ...(p || {}), surveyResponses: nextResponses }))
    if (project?.id) {
      addProjectSurveyResponse(project.id, sampleResp).catch(e => console.warn(e))
    }
    showNotification(`Discovery feedback recorded from ${randomName}!`)
  }

  const handleRunExperimentsAI = async () => {
    setIsAnalyzingExperiments(true)
    try {
      const results = await analyzeAndGenerateExperimentsAI(project)
      if (results && Array.isArray(results.experiments) && results.experiments.length > 0) {
        setExperimentsData(results)
        setExperiments(results.experiments)
        const updated = {
          ...(project || {}),
          experimentsData: results,
          experiments: results.experiments,
          metadataInfo: {
            ...(project?.metadataInfo || {}),
            experimentsData: results,
            experiments_data: results,
            performanceAudit: results.performanceAudit
          }
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        if (project?.id) {
          updateCoLaunchProject(project.id, {
            experimentsData: results,
            experiments: results.experiments,
            metadataInfo: {
              ...(project.metadataInfo || {}),
              experimentsData: results,
              experiments_data: results,
              performanceAudit: results.performanceAudit
            }
          }).catch(e => console.warn('[Phase1Validate] updateCoLaunchProject err:', e))
        }
        showNotification('AI growth & optimization experiments generated!')
      }
    } catch (err) {
      console.error('Optimization error:', err)
      showNotification('Failed to generate experiments.')
    } finally {
      setIsAnalyzingExperiments(false)
    }
  }

  const handleApplyExperiment = (exp) => {
    if (!exp) return
    let updatedCampaign = { ...campaignKit }
    let appliedMessage = `Experiment "${exp.title}" applied!`
    let updatedPlanPricing = null

    // 1. Messaging Variant -> Step 2 Campaign Kit & Step 3 Social Post Draft
    if (exp.category === 'messaging' || exp.targetField === 'announcementPost') {
      updatedCampaign.announcementPost = exp.variant
      updatedCampaign.activeMessagingExperiment = { id: exp.id, title: exp.title, variant: exp.variant, expectedUplift: exp.expectedUplift }
      if (Array.isArray(updatedCampaign.postingSchedule)) {
        updatedCampaign.postingSchedule = updatedCampaign.postingSchedule.map(t => {
          if (t.day === 1 || t.title?.toLowerCase().includes('announcement')) {
            return { ...t, description: `[AI Experiment Variant Active: ${exp.title}] ${exp.variant}` }
          }
          return t
        })
      }
      appliedMessage = `Messaging variant applied to Step 2 Campaign Kit & Step 3 Social Announcement!`
    }
    // 2. Creator Content Variant -> Step 3 Creator Story Sprints & Tasks
    else if (exp.category === 'creator_content' || exp.targetField === 'storySequence') {
      updatedCampaign.storySequence = exp.variant
      updatedCampaign.activeStoryExperiment = { id: exp.id, title: exp.title, variant: exp.variant, expectedUplift: exp.expectedUplift }
      if (Array.isArray(updatedCampaign.postingSchedule)) {
        updatedCampaign.postingSchedule = updatedCampaign.postingSchedule.map(t => {
          if (t.day === 2 || t.day === 3 || t.title?.toLowerCase().includes('story')) {
            return { ...t, description: `[AI Experiment Variant Active: ${exp.title}] ${exp.variant}` }
          }
          return t
        })
      }
      appliedMessage = `Creator story sequence & sprint tasks updated with AI variant in Step 3!`
    }
    // 3. Landing Page Variant -> Step 2 Live Landing Page Hero & Headline
    else if (exp.category === 'landing_page' || exp.targetField === 'landingPageHero') {
      const existingLP = updatedCampaign.landingPageCopy || {}
      const isMockupVariant = exp.variant?.toLowerCase().includes('mockup') || exp.variant?.toLowerCase().includes('frame') || exp.title?.toLowerCase().includes('mockup')
      updatedCampaign.landingPageCopy = {
        ...existingLP,
        headline: !isMockupVariant ? exp.variant : existingLP.headline || `The ${project?.productName || 'Product'} Workspace Built with ${project?.creatorName || 'Co-Founder'}`,
        heroStyle: isMockupVariant ? 'mockup_first' : 'standard',
        activeExperimentTitle: exp.title,
        activeExperimentVariant: exp.variant
      }
      appliedMessage = `Landing page hero variant applied to Step 2 Funnel & Public Pre-Order Page!`
    }
    // 4. Pricing Variant -> Step 1 Validation Plan & Step 2 Pre-Order Checkout
    else if (exp.category === 'pricing' || exp.targetField === 'pricingTier') {
      const priceMatches = exp.variant.match(/\$(\d+)/g)
      let parsedDeposit = null
      let parsedFounding = null
      if (priceMatches && priceMatches.length > 0) {
        const nums = priceMatches.map(m => Number(m.replace('$', ''))).filter(n => !isNaN(n) && n > 0)
        if (nums.length === 1) {
          if (nums[0] < activeFoundingPrice) {
            parsedDeposit = nums[0]
          } else {
            parsedFounding = nums[0]
          }
        } else if (nums.length >= 2) {
          nums.sort((a, b) => a - b)
          parsedDeposit = nums[0]
          parsedFounding = nums[nums.length - 1]
        }
      }

      const nextFounding = parsedFounding || activeFoundingPrice
      const nextDeposit = parsedDeposit || (Math.round(nextFounding * 0.2) || activeDepositPrice)

      updatedCampaign.pricingConfig = {
        ...(updatedCampaign.pricingConfig || {}),
        foundingPrice: nextFounding,
        depositPrice: nextDeposit,
        activeExperimentVariant: exp.variant,
        activeExperimentTitle: exp.title
      }

      updatedPlanPricing = `${exp.variant} (Pricing adjusted via AI Experiment: ${exp.title})`
      setPlan(prev => ({ ...prev, pricing: updatedPlanPricing }))
      appliedMessage = `Pricing adjusted: Founding Pass $${nextFounding}, Deposit Pass $${nextDeposit}! Updated in Step 1 Plan & Step 2 Checkout.`
    }

    setCampaignKit(updatedCampaign)

    let nextExpData = experimentsData
    if (experimentsData?.experiments) {
      const updatedExps = experimentsData.experiments.map(e => e.id === exp.id ? {
        ...e,
        status: 'applied',
        appliedAt: new Date().toISOString()
      } : e)
      nextExpData = { ...experimentsData, experiments: updatedExps }
      setExperimentsData(nextExpData)
      setExperiments(updatedExps)
    }

    const updatedProject = {
      ...(project || {}),
      campaignKit: updatedCampaign,
      experimentsData: nextExpData,
      experiments: nextExpData?.experiments || [],
      ...(updatedPlanPricing ? { pricing: updatedPlanPricing } : {})
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updatedProject }))

    if (project?.id) {
      updateCoLaunchProject(project.id, {
        campaignKit: updatedCampaign,
        experimentsData: nextExpData,
        experiments: nextExpData?.experiments || [],
        ...(updatedPlanPricing ? { pricing: updatedPlanPricing } : {}),
        metadataInfo: {
          ...(project.metadataInfo || {}),
          campaign_kit: updatedCampaign,
          experimentsData: nextExpData
        }
      }).catch(e => console.warn(e))

      updateValidationCampaign(project.id, {
        campaign_kit: updatedCampaign,
        campaignKit: updatedCampaign
      }).catch(e => console.warn(e))

      if (updatedPlanPricing) {
        updateValidationPlan(project.id, {
          pricing: updatedPlanPricing
        }).catch(e => console.warn(e))
      }

      logProjectActivity(project.id, {
        action: `AI Experiment Implemented: ${exp.title}`,
        details: `Variant activated: "${exp.variant.slice(0, 100)}"`,
        step: 'optimize',
        phase: 1
      }).catch(() => {})
    }

    showNotification(appliedMessage)
  }

  const handleRevertExperiment = (exp) => {
    if (!exp) return
    let updatedCampaign = { ...campaignKit }

    if (exp.category === 'messaging' || exp.targetField === 'announcementPost') {
      updatedCampaign.announcementPost = exp.control || ''
      updatedCampaign.activeMessagingExperiment = null
      if (Array.isArray(updatedCampaign.postingSchedule)) {
        updatedCampaign.postingSchedule = updatedCampaign.postingSchedule.map(t => {
          if (t.day === 1 || t.title?.toLowerCase().includes('announcement')) {
            return { ...t, description: exp.control || t.description?.replace(/\[AI Experiment Variant Active:.*?\]\s*/, '') }
          }
          return t
        })
      }
    } else if (exp.category === 'creator_content' || exp.targetField === 'storySequence') {
      updatedCampaign.storySequence = exp.control || ''
      updatedCampaign.activeStoryExperiment = null
      if (Array.isArray(updatedCampaign.postingSchedule)) {
        updatedCampaign.postingSchedule = updatedCampaign.postingSchedule.map(t => {
          if (t.day === 2 || t.day === 3 || t.title?.toLowerCase().includes('story')) {
            return { ...t, description: exp.control || t.description?.replace(/\[AI Experiment Variant Active:.*?\]\s*/, '') }
          }
          return t
        })
      }
    } else if (exp.category === 'landing_page' || exp.targetField === 'landingPageHero') {
      const existingLP = updatedCampaign.landingPageCopy || {}
      updatedCampaign.landingPageCopy = {
        ...existingLP,
        headline: exp.control || `The ${project?.productName || 'Product'} System`,
        heroStyle: 'standard',
        activeExperimentTitle: null,
        activeExperimentVariant: null
      }
    } else if (exp.category === 'pricing' || exp.targetField === 'pricingTier') {
      const origFounding = parseMainPricingAmount(project?.pricing || 49)
      const origDeposit = parseDepositPricingAmount(project?.pricing, origFounding)
      updatedCampaign.pricingConfig = {
        ...(updatedCampaign.pricingConfig || {}),
        foundingPrice: origFounding,
        depositPrice: origDeposit,
        activeExperimentVariant: null,
        activeExperimentTitle: null
      }
      setPlan(prev => ({ ...prev, pricing: project?.pricing || `$${origFounding} founding member pass` }))
      if (project?.id) {
        updateValidationPlan(project.id, { pricing: project?.pricing || `$${origFounding}` }).catch(() => {})
      }
    }

    setCampaignKit(updatedCampaign)

    let nextExpData = experimentsData
    if (experimentsData?.experiments) {
      const updatedExps = experimentsData.experiments.map(e => e.id === exp.id ? {
        ...e,
        status: 'ready',
        appliedAt: null
      } : e)
      nextExpData = { ...experimentsData, experiments: updatedExps }
      setExperimentsData(nextExpData)
      setExperiments(updatedExps)
    }

    const updatedProject = {
      ...(project || {}),
      campaignKit: updatedCampaign,
      experimentsData: nextExpData,
      experiments: nextExpData?.experiments || []
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updatedProject }))

    if (project?.id) {
      updateCoLaunchProject(project.id, {
        campaignKit: updatedCampaign,
        experimentsData: nextExpData,
        experiments: nextExpData?.experiments || []
      }).catch(e => console.warn(e))

      updateValidationCampaign(project.id, {
        campaign_kit: updatedCampaign,
        campaignKit: updatedCampaign
      }).catch(e => console.warn(e))
    }

    showNotification(`Reverted experiment "${exp.title}" back to control.`)
  }

  const handleAddSimulatedReservation = (customData = {}) => {
    const randomNames = ['Alex Rivera', 'Jordan Chen', 'Taylor Swift', 'Morgan Lee', 'Chris Pratt', 'Samira Khan', 'Elena Rostova', 'Marcus Brody']
    const randomPick = randomNames[Math.floor(Math.random() * randomNames.length)]
    const name = (typeof customData?.name === 'string' && customData.name.trim()) ? customData.name.trim() : randomPick
    const email = (typeof customData?.email === 'string' && customData.email.trim()) ? customData.email.trim() : `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@example.com`
    const amount = Number(customData?.amount) || activeFoundingPrice || dynamicMainPrice || 49

    const newReservation = {
      id: `r-${Date.now()}`,
      name,
      email,
      amount,
      tier: amount === dynamicDepositPrice ? `Refundable Deposit ($${amount})` : amount === dynamicVipPrice ? `VIP Founder Pass ($${amount})` : `Founding Annual Pass ($${amount})`,
      date: 'Just now',
      status: 'Paid'
    }

    const nextReservations = [newReservation, ...reservations]
    const nextRevenue = presalesRevenue + amount

    setReservations(nextReservations)
    setPresalesRevenue(nextRevenue)

    const updated = {
      ...(project || {}),
      validationPlan: plan,
      campaignKit,
      surveyData,
      reservations: nextReservations,
      currentPresales: nextRevenue
    }

    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

    if (project?.id) {
      addProjectReservation(project.id, {
        name,
        email,
        amount,
        tier: amount === activeFoundingPrice ? `Founding Annual ($${activeFoundingPrice})` : amount === activeDepositPrice ? `Refundable Deposit ($${activeDepositPrice})` : `Pledge ($${amount})`,
        channel: 'creator_campaign'
      }).catch(e => console.warn('[Phase1] DB reservation sync warning:', e))
    }

    showNotification(`Recorded $${amount} presale pledge from ${name}!`)
  }

  const handleSimulatePresale = (e) => {
    e?.preventDefault()
    if (!simBuyerName.trim() || !simBuyerEmail.trim()) {
      showNotification('Please enter a backer name and email.')
      return
    }
    handleAddSimulatedReservation({
      name: simBuyerName.trim(),
      email: simBuyerEmail.trim(),
      amount: Number(simBuyerTier) || dynamicMainPrice
    })
    setSimBuyerName('')
    setSimBuyerEmail('')
  }

  const handleClearAllReservations = () => {
    setReservations([])
    setPresalesRevenue(0)
    const updated = {
      ...(project || {}),
      reservations: [],
      currentPresales: 0,
      conversionRate: 0
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    if (project?.id) {
      updateCoLaunchProject(project.id, {
        reservations: [],
        currentPresales: 0
      }).catch(e => console.warn(e))
    }
    showNotification('Pre-orders cleared.')
  }

  // Dynamic Telemetry Calculations
  const totalTraffic = Number(project?.visitors || project?.uniqueVisitors?.length || 0)
  const totalSignups = Number(project?.telemetry?.signups || (project?.waitlist || []).length || 0)
  const dynamicConversionRate = totalTraffic > 0
    ? (reservations.length / totalTraffic) * 100
    : Number(project?.conversionRate || 0)
  const dynamicCTR = project?.telemetry?.ctr !== undefined && project?.telemetry?.ctr !== null
    ? Number(project.telemetry.ctr)
    : (totalTraffic > 0 && (totalSignups + reservations.length > 0))
    ? ((totalSignups + reservations.length) / totalTraffic) * 100
    : 0

  const {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    step1Status,
    step2Status,
    step3Status,
    step4Status,
    step5Status,
    hasKitContent,
    isGatePassed: dbGatePassed,
    allPriorStepsDone,
    canAccessStep1,
    canAccessStep2,
    canAccessStep3,
    canAccessStep4,
    canAccessStep5
  } = getPhase1StepGuards({
    ...project,
    validationPlan: { ...(project?.validationPlan || {}), ...(plan || {}) },
    validationCampaign: {
      ...(project?.validationCampaign || {}),
      ...(isStep2Approved ? { review_status: 'approved', reviewStatus: 'approved' } : {})
    },
    assetsApproved: Boolean(isStep2Approved || project?.assetsApproved || project?.landingPageApproved),
    landingPageApproved: Boolean(isStep2Approved || project?.landingPageApproved),
    campaignKit,
    surveyData,
    reservations,
    currentPresales: presalesRevenue
  })

  // Gate can be passed when threshold is met, DB gate passed, or manual advance
  const isGatePassed = Boolean(
    dbGatePassed ||
    project?.p1Complete === true ||
    project?.phase1Passed === true ||
    Number(project?.currentPhase || project?.current_phase || 1) >= 2 ||
    project?.status === 'building' ||
    (presaleTarget > 0 && presalesRevenue >= presaleTarget && reservations.length > 0) ||
    (allPriorStepsDone && (
      dbGatePassed ||
      (presaleTarget > 0 && presalesRevenue >= presaleTarget)
    ))
  )

  const canAccessStep = (stepId) => {
    if (stepId === 'plan') return true
    if (stepId === 'assets') return canAccessStep2
    if (stepId === 'campaign') return canAccessStep3
    if (stepId === 'optimize') return canAccessStep4
    if (stepId === 'gate') return canAccessStep5
    return true
  }

  const getStepMissingPrerequisiteText = (stepId) => {
    if (stepId === 'assets' && !canAccessStep2) return 'Please complete Step 1 (Validation Plan) first.'
    if (stepId === 'campaign' && !canAccessStep3) return 'Please complete Step 2 (Validation Assets) first.'
    if (stepId === 'optimize' && !canAccessStep4) return 'Please complete Step 3 (Creator Campaign) first.'
    if (stepId === 'gate' && !canAccessStep5) return 'Validation Gate locked: Complete Steps 1–4 first.'
    return 'Please complete previous steps first.'
  }

  const handleStepChange = (id) => {
    if (!canAccessStep(id)) {
      showNotification(getStepMissingPrerequisiteText(id))
      return
    }
    setActiveStep(id)
    onSelectStep?.(id)
  }

  // If currently active step is locked, automatically drop down to highest unlocked step
  useEffect(() => {
    if (!canAccessStep(activeStep)) {
      if (canAccessStep4) setActiveStep('optimize')
      else if (canAccessStep3) setActiveStep('campaign')
      else if (canAccessStep2) setActiveStep('assets')
      else setActiveStep('plan')
    }
  }, [activeStep, canAccessStep1, canAccessStep2, canAccessStep3, canAccessStep4, canAccessStep5])

  return (
    <div className="p1-validate-dark space-y-5 w-full max-w-full overflow-hidden" style={{ color: C.text }}>
      <style>{`
        .p1-validate-dark .bg-white { background-color: ${C.sheet} !important; color: ${C.text} !important; border-color: ${C.line} !important; }
        .p1-validate-dark .bg-slate-50, .p1-validate-dark .bg-slate-50\/70 { background-color: ${C.row} !important; color: ${C.body} !important; border-color: ${C.line} !important; }
        .p1-validate-dark .bg-slate-100, .p1-validate-dark .bg-slate-100\/90 { background-color: ${C.sheet} !important; border-color: ${C.line} !important; }
        .p1-validate-dark .bg-slate-200, .p1-validate-dark .bg-slate-200\/50, .p1-validate-dark .bg-slate-200\/80 { background-color: ${C.raised} !important; border-color: ${C.line} !important; }
        .p1-validate-dark .border-slate-200, .p1-validate-dark .border-slate-200\/70, .p1-validate-dark .border-slate-200\/80, .p1-validate-dark .border-slate-200\/90, .p1-validate-dark .border-slate-300 { border-color: ${C.line} !important; }
        .p1-validate-dark .border-slate-700 { border-color: ${C.lineStrong} !important; }
        .p1-validate-dark .text-slate-900, .p1-validate-dark .text-slate-950, .p1-validate-dark .text-slate-800 { color: ${C.text} !important; }
        .p1-validate-dark .text-slate-700, .p1-validate-dark .text-slate-600 { color: ${C.body} !important; }
        .p1-validate-dark .text-slate-500, .p1-validate-dark .text-slate-400 { color: ${C.muted} !important; }
        .p1-validate-dark input, .p1-validate-dark textarea, .p1-validate-dark select { background-color: ${C.row} !important; color: ${C.text} !important; border-color: ${C.lineStrong} !important; }
        .p1-validate-dark input::placeholder, .p1-validate-dark textarea::placeholder { color: ${C.faint} !important; }
        .p1-validate-dark .bg-emerald-50 { background-color: ${C.okSoft} !important; color: ${C.ok} !important; border-color: ${C.okLine} !important; }
        .p1-validate-dark .text-emerald-800, .p1-validate-dark .text-emerald-700 { color: ${C.ok} !important; }
        .p1-validate-dark .border-emerald-300, .p1-validate-dark .border-emerald-200 { border-color: ${C.okLine} !important; }
        .p1-validate-dark .bg-amber-50 { background-color: ${C.warnSoft} !important; color: ${C.warn} !important; border-color: ${C.warnLine} !important; }
        .p1-validate-dark .text-amber-800, .p1-validate-dark .text-amber-700 { color: ${C.warn} !important; }
        .p1-validate-dark .border-amber-300, .p1-validate-dark .border-amber-200 { border-color: ${C.warnLine} !important; }
        .p1-validate-dark .bg-sky-50 { background-color: ${C.skySoft} !important; color: ${C.skyText} !important; border-color: ${C.skyLine} !important; }
        .p1-validate-dark .text-sky-800, .p1-validate-dark .text-sky-700 { color: ${C.skyText} !important; }
        .p1-validate-dark .border-sky-300, .p1-validate-dark .border-sky-200 { border-color: ${C.skyLine} !important; }
        .p1-validate-dark .bg-violet-50 { background-color: ${C.violetSoft} !important; color: ${C.violetText} !important; border-color: ${C.violetLine} !important; }
        .p1-validate-dark .text-violet-800, .p1-validate-dark .text-violet-700 { color: ${C.violetText} !important; }
        .p1-validate-dark .border-violet-300, .p1-validate-dark .border-violet-200 { border-color: ${C.violetLine} !important; }
      `}</style>
      {/* 5-Step Phase 1 Progress Nav */}
      <div className="p-3.5 rounded-2xl border shadow-sm space-y-2.5" style={{ background: C.sheet, borderColor: C.line }}>
        {/* Top Row: Pipeline Title & Telemetry Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.ok }} />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: C.text }}>
              Phase 1 • Market Validation Sprint
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-xs select-none"
              style={{ background: C.row, borderColor: C.lineStrong, color: C.text }}
            >
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                Execution Progress:
              </span>
              <span className="font-extrabold text-xs" style={{ color: C.ok }}>
                {[isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done].filter(Boolean).length} of 5 Done
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 shadow-2xs"
              style={{ background: C.row, borderColor: C.okLine, color: C.text }}
            >
              <span className="text-[10px] uppercase font-mono" style={{ color: C.muted }}>Target Goal:</span>
              <span className="flex items-center gap-1 font-mono font-extrabold" style={{ color: C.ok }}>
                <DollarSign className="w-3.5 h-3.5" style={{ color: C.ok }} /> ${presalesRevenue.toLocaleString()} / ${presaleTarget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: 5-Step Pipeline Roadmap */}
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth pb-1">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {[
            { id: 'plan', num: '01', label: '1. Plan', icon: FileText, isDone: isStep1Done, status: step1Status, canAccess: canAccessStep1, color: C.crimson, activeBorder: C.crimsonLine },
            { id: 'assets', num: '02', label: '2. Assets', icon: Layout, isDone: isStep2Done, status: step2Status, canAccess: canAccessStep2, color: C.sky, activeBorder: C.skyLine },
            { id: 'campaign', num: '03', label: '3. Campaign', icon: Megaphone, isDone: isStep3Done, status: step3Status, canAccess: canAccessStep3, color: C.violet, activeBorder: C.violetLine },
            { id: 'optimize', num: '04', label: '4. Optimize', icon: TrendingUp, isDone: isStep4Done, status: step4Status, canAccess: canAccessStep4, color: C.ok, activeBorder: C.okLine },
            { id: 'gate', num: '05', label: '5. Gate', icon: Flag, isDone: isStep5Done, status: step5Status, canAccess: canAccessStep5, color: C.warn, activeBorder: C.warnLine },
          ].map((step, idx, arr) => {
            const isActive = activeStep === step.id
            const isLocked = !step.canAccess
            const isDone = step.status === 'done' || Boolean(step.isDone)
            const isInProgress = step.status === 'in_progress' && !isDone

            return (
              <div key={step.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStepChange(step.id)}
                  disabled={isLocked}
                  title={isLocked ? getStepMissingPrerequisiteText(step.id) : step.label}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 cursor-pointer shadow-2xs"
                  style={
                    isActive
                      ? { background: C.raised, color: '#ffffff', border: `1px solid ${step.activeBorder}`, borderTop: `3px solid ${step.color}`, fontWeight: 700 }
                      : isDone
                      ? { background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}`, fontWeight: 600 }
                      : isLocked
                      ? { background: C.row, color: C.faint, border: `1px solid ${C.line}`, cursor: 'not-allowed', opacity: 0.5 }
                      : { background: C.row, color: C.muted, border: `1px solid ${C.line}` }
                  }
                >
                  {isActive ? (
                    <>
                      <span className="px-1 py-0.5 rounded text-[9px] font-bold" style={{ background: C.row, color: step.color }}>
                        STEP {step.num}
                      </span>
                      <span className="font-sans font-extrabold whitespace-nowrap" style={{ color: '#ffffff' }}>{step.label}</span>
                      {isDone ? (
                        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: C.ok, color: '#08090c' }}>
                          <Check className="w-2 h-2 stroke-[3]" />
                        </div>
                      ) : isInProgress ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warnLine}` }}>
                          Draft
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-0.5 shrink-0" style={{ background: step.color }} />
                      )}
                    </>
                  ) : isDone ? (
                    <>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: C.ok, color: '#08090c' }}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-sans font-bold whitespace-nowrap" style={{ color: C.text }}>{step.label}</span>
                    </>
                  ) : isInProgress ? (
                    <>
                      <span className="font-bold" style={{ color: C.faint }}>{step.num}</span>
                      <span className="font-sans font-medium whitespace-nowrap" style={{ color: C.body }}>{step.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warnLine}` }}>
                        Draft
                      </span>
                    </>
                  ) : isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: C.faint }} />
                      <span className="font-sans font-medium whitespace-nowrap" style={{ color: C.faint }}>{step.label}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold" style={{ color: C.faint }}>{step.num}</span>
                      <span className="font-sans font-medium whitespace-nowrap" style={{ color: C.muted }}>{step.label}</span>
                    </>
                  )}
                </button>
                {idx < arr.length - 1 && (
                  <div
                    className="flex-1 h-[2px] min-w-[8px] max-w-[48px] rounded-full shrink-0"
                    style={{ background: isDone ? C.ok : C.line }}
                  />
                )}
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {feedbackNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs shadow-2xl flex items-center justify-between gap-3 animate-slide-up backdrop-blur-md">
          <div className="flex items-center gap-2.5 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-snug">{feedbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice('')}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 1: VALIDATION PLAN */}
      {activeStep === 'plan' && (
        <Phase1Step1Plan
          project={project}
          plan={plan}
          updatePlan={updatePlan}
          generatePlan={generatePlan}
          isGenerating={isGenerating}
          hasPlanGenerated={hasPlanGenerated}
          saveAll={saveAll}
          saveStatus={saveStatus}
          presaleTarget={presaleTarget}
          campaignKit={campaignKit}
          theme={theme}
          showNotification={showNotification}
          setActiveStep={setActiveStep}
          onSelectStep={onSelectStep}
          onUpdateProject={onUpdateProject}
        />
      )}

      {/* STEP 2: BUILD VALIDATION ASSETS */}
      {activeStep === 'assets' && (
        <Phase1Step2Assets
          project={project}
          assetSubTab={assetSubTab}
          setAssetSubTab={setAssetSubTab}
          assetName={assetName}
          setAssetName={setAssetName}
          assetTagline={assetTagline}
          setAssetTagline={setAssetTagline}
          assetTone={assetTone}
          setAssetTone={setAssetTone}
          assetAudience={assetAudience}
          setAssetAudience={setAssetAudience}
          updateAssetField={updateAssetField}
          campaignKit={campaignKit}
          updateCampaignKit={updateCampaignKit}
          activeFoundingPrice={activeFoundingPrice}
          activeDepositPrice={activeDepositPrice}
          productSlug={productSlug}
          origin={origin}
          presalesRevenue={presalesRevenue}
          reservations={reservations}
          mockupImage={mockupImage}
          setMockupImage={setMockupImage}
          surveyData={surveyData}
          surveyResponses={surveyResponses}
          surveyAnalysis={surveyAnalysis}
          isAnalyzingResponses={isAnalyzingResponses}
          handleAnalyzeResponses={handleAnalyzeResponses}
          isGeneratingSurvey={isGeneratingSurvey}
          handleGenerateSurvey={handleGenerateSurvey}
          newQuestionCategory={newQuestionCategory}
          setNewQuestionCategory={setNewQuestionCategory}
          newQuestionText={newQuestionText}
          setNewQuestionText={setNewQuestionText}
          handleAddQuestion={handleAddQuestion}
          handleDeleteSurveyResponse={handleDeleteSurveyResponse}
          handleClearAllSurveyResponses={handleClearAllSurveyResponses}
          saveAll={saveAll}
          setIsStep2Approved={setIsStep2Approved}
          sanitizedPricingConfig={sanitizedPricingConfig}
          showNotification={showNotification}
          setActiveStep={setActiveStep}
          onSelectStep={onSelectStep}
          onUpdateProject={onUpdateProject}
        />
      )}

      {/* STEP 3: CREATOR CAMPAIGN */}
      {activeStep === 'campaign' && (
        <Phase1Step3Campaign
          project={project}
          campaignKit={campaignKit}
          updateCampaignKit={updateCampaignKit}
          isGeneratingCampaign={isGeneratingCampaign}
          generateCampaign={generateCampaign}
          hasCampaignGenerated={hasCampaignGenerated}
          saveAll={saveAll}
          campaignSubTab={campaignSubTab}
          setCampaignSubTab={setCampaignSubTab}
          isAutonomousEnabled={isAutonomousEnabled}
          handleToggleAutonomous={handleToggleAutonomous}
          viewDraftTask={viewDraftTask}
          setViewDraftTask={setViewDraftTask}
          draftModalView={draftModalView}
          setDraftModalView={setDraftModalView}
          campaignPacing={campaignPacing}
          setCampaignPacing={setCampaignPacing}
          postingFrequency={postingFrequency}
          setPostingFrequency={setPostingFrequency}
          campaignStrategyPrompt={campaignStrategyPrompt}
          setCampaignStrategyPrompt={setCampaignStrategyPrompt}
          creatorChannelUrl={creatorChannelUrl}
          audienceGroundingData={audienceGroundingData}
          setShowAudienceIntelModal={setShowAudienceIntelModal}
          setAudienceIntelModalTab={setAudienceIntelModalTab}
          productSlug={productSlug}
          origin={origin}
          showNotification={showNotification}
          setActiveStep={setActiveStep}
          onSelectStep={onSelectStep}
          onUpdateProject={onUpdateProject}
          handleToggleScheduleTask={handleToggleScheduleTask}
          handleSendTaskReminder={handleSendTaskReminder}
          handleWhatsAppNudge={handleWhatsAppNudge}
          handleGeneratePostImage={handleGeneratePostImage}
          isGeneratingImage={isGeneratingImage}
          imageGenError={imageGenError}
          setImageGenError={setImageGenError}
          handleGenerateCampaignVideo={handleGenerateCampaignVideo}
          isGeneratingVideo={isGeneratingVideo}
          videoGenError={videoGenError}
          setVideoGenError={setVideoGenError}
          handleSendPostKitEmail={handleSendPostKitEmail}
          isSendingTodayEmail={isSendingTodayEmail}
          remindingTaskId={remindingTaskId}
          copyToClipboard={copyToClipboard}
          copiedKey={copiedKey}
          getTaskDraftContent={getTaskDraftContent}
        />
      )}

      {/* STEP 4: RUN & OPTIMIZE */}
      {activeStep === 'optimize' && (
        <Phase1Step4Optimize
          project={project}
          reservations={reservations}
          presalesRevenue={presalesRevenue}
          presaleTarget={presaleTarget}
          totalTraffic={totalTraffic}
          totalSignups={totalSignups}
          conversionRate={dynamicConversionRate}
          surveyResponses={surveyResponses}
          handleDeleteSurveyResponse={handleDeleteSurveyResponse}
          campaignKit={campaignKit}
          updateCampaignKit={updateCampaignKit}
          experimentsData={experimentsData}
          isAnalyzingExperiments={isAnalyzingExperiments}
          handleRunExperimentsAI={handleRunExperimentsAI}
          handleApplyExperimentVariant={handleApplyExperiment}
          handleAddSimulatedReservation={handleAddSimulatedReservation}
          showNotification={showNotification}
          setActiveStep={setActiveStep}
          onSelectStep={onSelectStep}
          onUpdateProject={onUpdateProject}
        />
      )}

      {/* STEP 5: VALIDATION GATE */}
      {activeStep === 'gate' && (
        <Phase1Step5Gate
          project={project}
          allPriorStepsDone={allPriorStepsDone}
          isStep1Done={isStep1Done}
          isStep2Done={isStep2Done}
          isStep3Done={isStep3Done}
          isStep4Done={isStep4Done}
          canAccessStep2={canAccessStep2}
          canAccessStep3={canAccessStep3}
          canAccessStep4={canAccessStep4}
          isGatePassed={isGatePassed}
          presalesRevenue={presalesRevenue}
          presaleTarget={presaleTarget}
          reservations={reservations}
          dynamicConversionRate={dynamicConversionRate}
          isAdvancingPhase={isAdvancingPhase}
          setIsAdvancingPhase={setIsAdvancingPhase}
          onAdvanceToPhase2={onAdvanceToPhase2}
          isIteratingGate={isIteratingGate}
          setIsIteratingGate={setIsIteratingGate}
          isArchivingProject={isArchivingProject}
          setIsArchivingProject={setIsArchivingProject}
          handleStepChange={handleStepChange}
          showNotification={showNotification}
          onUpdateProject={onUpdateProject}
        />
      )}

      {/* AUDIENCE DATA GROUNDING & PROVENANCE CITATIONS MODAL */}
      <AudienceGroundingModal
        isOpen={showAudienceIntelModal}
        onClose={() => setShowAudienceIntelModal(false)}
        project={project}
        initialTab={audienceIntelModalTab}
      />
    </div>
  )
}
