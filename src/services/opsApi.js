import { PUBLIC_APP_URL } from '../utils/publicUrl'
import { loadAiKeys } from './ai'
import { loadKeys } from './scraper'

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
// When running locally in dev, route through Vite proxy ('/api') which forwards server-to-server
// to VITE_BACKEND_URL (https://creator-forge-backend-jj1y.onrender.com) avoiding browser CORS/preflight issues.
const BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? '/api'
  : (BACKEND_BASE ? `${BACKEND_BASE}/api` : '/api')

function buildApiUrl(path) {
  if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path
  }
  let clean = String(path || '')
  if (clean.startsWith('/api/')) {
    clean = clean.slice(4)
  }
  if (!clean.startsWith('/')) {
    clean = '/' + clean
  }
  return `${BASE}${clean}`
}

function proxyAvatars(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.map(proxyAvatars)
  }
  const res = {}
  for (const [key, val] of Object.entries(obj)) {
    if ((key === 'avatar_url' || key === 'avatarUrl') && typeof val === 'string' && val.startsWith('http') && !val.includes('/api/proxy/avatar')) {
      res[key] = `/api/proxy/avatar?url=${encodeURIComponent(val)}`
    } else if (typeof val === 'object' && val !== null) {
      res[key] = proxyAvatars(val)
    } else {
      res[key] = val
    }
  }
  return res
}

// ── Signed-in DIY creator session (email + password account) ───────────────
const CREATOR_SESSION_KEY = 'colaunch_creator_session'
export function getCreatorSession() {
  try {
    const s = JSON.parse(localStorage.getItem(CREATOR_SESSION_KEY) || 'null')
    if (!s?.token || (s.expiresAt && s.expiresAt < Date.now())) return null
    return s
  } catch { return null }
}
export function setCreatorSession(s) {
  try {
    if (s) localStorage.setItem(CREATOR_SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(CREATOR_SESSION_KEY)
  } catch { /* storage unavailable */ }
}

async function req(method, path, body, customSignal = null) {
  const aiKeys = loadAiKeys()
  const scrapeKeys = loadKeys()
  // 5-minute timeout for heavy endpoints (discover-creators with 50 creators, Apify)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000)

  if (customSignal) {
    if (customSignal.aborted) {
      controller.abort()
    } else {
      customSignal.addEventListener('abort', () => controller.abort())
    }
  }

  const operatorToken = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('forge_launch_auth_token') || localStorage.getItem('forge_op_token') || getCreatorSession()?.token || '')
    : ''
  const portalToken = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('token') || sessionStorage.getItem('creator_portal_token') || '')
    : ''

  const headers = {
    'Content-Type': 'application/json',
    'X-Gemini-Key': aiKeys?.geminiKey || '',
    'X-OpenAI-Key': aiKeys?.openaiKey || '',
    'X-Anthropic-Key': aiKeys?.anthropicKey || '',
    'X-Together-Key': aiKeys?.togetherKey || '',
    'X-Apify-Token': scrapeKeys?.apifyToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('forge_apify_token') : '') || '',
  }
  if (operatorToken) {
    headers['Authorization'] = `Bearer ${operatorToken}`
    headers['X-Operator-Token'] = operatorToken
  }
  if (portalToken) {
    headers['X-Portal-Token'] = portalToken
  }

  const opts = {
    method,
    signal: controller.signal,
    headers,
  }
  if (body) opts.body = JSON.stringify(body)
  try {
    const url = buildApiUrl(path)
    const res = await fetch(url, opts)
    clearTimeout(timeoutId)
    if (!res.ok) {
      let errMsg = ''
      try {
        const errText = await res.text()
        try {
          const parsed = JSON.parse(errText)
          if (Array.isArray(parsed.detail)) {
            errMsg = parsed.detail.map(d => (typeof d === 'object' ? d.msg || JSON.stringify(d) : String(d))).join(', ')
          } else {
            errMsg = parsed.detail || parsed.message || errText
          }
        } catch {
          errMsg = errText
        }
      } catch (readErr) {}

      if (Array.isArray(errMsg)) {
        errMsg = errMsg.map(e => (typeof e === 'object' ? e.msg || JSON.stringify(e) : String(e))).join(', ')
      } else if (typeof errMsg === 'object' && errMsg !== null) {
        errMsg = JSON.stringify(errMsg)
      }
      errMsg = (typeof errMsg === 'string' ? errMsg : String(errMsg || '')).trim()
      if (!errMsg) {
        if (res.status === 500) errMsg = 'Backend server temporarily unavailable (HTTP 500). Service is ready for retry.'
        else if (res.status === 502) errMsg = 'Backend server restarting or unavailable (HTTP 502 Bad Gateway). Please wait a moment and retry.'
        else if (res.status === 504) errMsg = 'Gateway timeout (HTTP 504). Operation took too long.'
        else if (res.status === 404) errMsg = `Endpoint not found (${path})`
        else errMsg = `Server returned HTTP ${res.status}`
      }
      throw new Error(`${res.status}: ${errMsg.slice(0, 200)}`)
    }
    const data = await res.json()
    return proxyAvatars(data)
  } catch (e) {
    clearTimeout(timeoutId)
    if (e.name === 'AbortError') {
      if (customSignal?.aborted) {
        const abortErr = new Error('Request cancelled by user')
        abortErr.name = 'AbortError'
        throw abortErr
      }
      throw new Error('Request timed out — the backend is still processing. Please try again with fewer creators.')
    }
    throw e
  }
}

// ── Creators / Leads ─────────────────────────────────────────────────────────

function getActiveUsername() {
  try {
    const cached = localStorage.getItem('forge_user_profile')
    if (cached) {
      const parsed = JSON.parse(cached)
      return parsed.username || 'internal'
    }
  } catch (e) {
    console.warn('[opsApi] Failed to parse forge_user_profile:', e)
  }
  return 'internal'
}

export const getCreators = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/creators${q ? '?' + q : ''}`)
}

export const saveCreator = (data) => 
  req('POST', '/creators', data)

export const updateCreatorDetails = (creatorId, data) =>
  req('PATCH', `/creators/${creatorId}`, data)

export const recommendCreator = (id) => {
  const actor = getActiveUsername()
  return req('POST', `/creators/${id}/recommend?actor=${encodeURIComponent(actor)}`)
}

export const scrapeCreator = (platform, handle) =>
  req('POST', '/creators/scrape', { platform, handle })

export const analyzeCreator = (id) => {
  const actor = getActiveUsername()
  return req('POST', `/creators/${id}/analyze?actor=${encodeURIComponent(actor)}`)
}

export const getCreatorAnalysis = (id) =>
  req('GET', `/creators/${id}/analysis`)

export const qualifyCreator = (id, status) =>
  req('POST', `/creators/${id}/qualify`, { status })

export const suppressCreator = (id, reason = 'do_not_contact') =>
  req('POST', `/creators/${id}/suppress`, { reason })

export const deleteCreator = (id) =>
  req('DELETE', `/creators/${id}`)

export const deleteAllCreators = () =>
  req('DELETE', '/creators/all')

export const getCreator = (id) =>
  req('GET', `/creators/${id}`)

export const getCreatorVideos = (creatorIdOrHandle, limit = 8) => {
  const isId = creatorIdOrHandle && !creatorIdOrHandle.startsWith('@') && !creatorIdOrHandle.includes('youtube.com') && !creatorIdOrHandle.includes('http')
  const q = isId 
    ? `/creators/${encodeURIComponent(creatorIdOrHandle)}/videos?limit=${limit}` 
    : `/creators/youtube-videos?handle=${encodeURIComponent(creatorIdOrHandle)}&limit=${limit}`
  return req('GET', q)
}

export const getYouTubeVideoComments = (videoIdOrUrl, limit = 8) => {
  const clean = String(videoIdOrUrl || '').trim()
  const isHandle = clean.startsWith('@') || (!clean.includes('v=') && !clean.includes('youtu.be') && (clean.length !== 11 || clean.includes(' ')))
  const q = isHandle ? `handle=${encodeURIComponent(clean.replace(/^@/, ''))}` : `video_id=${encodeURIComponent(clean)}`
  return req('GET', `/creators/youtube-comments?${q}&limit=${limit}`)
}

export const getCreatorComments = (creatorIdOrHandle, limit = 8) => {
  const clean = String(creatorIdOrHandle || '').replace(/^@/, '').trim()
  return req('GET', `/creators/youtube-comments?handle=${encodeURIComponent(clean)}&limit=${limit}`)
}

export const addCreatorContact = (creatorId, contactType, value) =>
  req('POST', `/creators/${creatorId}/contacts`, { contact_type: contactType, value, source: 'manual' })

// ── Outreach / Queue ─────────────────────────────────────────────────────────

export const getOutreachMessages = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/outreach${q ? '?' + q : ''}`)
}

export const generateOutreach = (creatorId, campaignId, opts = {}) =>
  req('POST', '/outreach/drafts', { creator_id: creatorId, campaign_id: campaignId, ...opts })

export const approveOutreach = (id) =>
  req('POST', `/outreach/${id}/approve`)

export const rejectOutreach = (id, notes = '') =>
  req('POST', `/outreach/${id}/reject`, { notes })

export const sendOutreach = (id) =>
  req('POST', `/outreach/${id}/send`)

export const sendDirectEmail = (toEmail, subject, body, creatorId = null, extraOptions = {}) =>
  req('POST', '/outreach/send-direct', {
    to_email: toEmail,
    subject,
    body,
    creator_id: creatorId,
    concept_image_url: extraOptions.concept_image_url || extraOptions.conceptImageUrl || null,
    concepts: extraOptions.concepts ?? null,
    is_rejection: extraOptions.is_rejection ?? extraOptions.isRejection ?? false,
    include_concepts: extraOptions.include_concepts ?? extraOptions.includeConcepts ?? null,
  })

export const submitConceptSelection = (payload) =>
  req('POST', '/outreach/concept-selection', payload)

export const updateOutreachDraft = (id, subject, body) =>
  req('PATCH', `/outreach/${id}`, { subject, body })

export const submitOutreachDraft = (id) =>
  req('POST', `/outreach/drafts/${id}/submit`)

export const deleteOutreachMessage = (id) =>
  req('DELETE', `/outreach/messages/${id}`)

// ── Reply Inbox ──────────────────────────────────────────────────────────────

export const getThreads = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/outreach/threads${q ? '?' + q : ''}`)
}

export const pollInboxReplies = () => req('POST', '/outreach/poll-inbox')

export const getThread = (id) =>
  req('GET', `/outreach/threads/${id}`)

export const sendThreadReply = (threadId, body, toEmail = null) =>
  req('POST', `/outreach/threads/${threadId}/reply`, { body, to_email: toEmail })

export const deleteThread = (id) =>
  req('DELETE', `/outreach/threads/${id}`)

export const deleteReply = (id) =>
  req('DELETE', `/outreach/replies/${id}`)

// ── Campaigns ────────────────────────────────────────────────────────────────

export const getCampaigns = () => req('GET', '/campaigns')
export const createCampaign = (data) => req('POST', '/campaigns', data)

// ── Agent (batch runner) ─────────────────────────────────────────────────────

export const runDiscovery = (handles, platform = 'youtube') =>
  req('POST', '/agent/run-discovery', { handles, platform })

export const runOutreachBatch = (campaignId) =>
  req('POST', '/agent/run-outreach', { campaign_id: campaignId })

export const runFollowupBatch = () =>
  req('POST', '/agent/run-followups')

export const getAgentStatus = () =>
  req('GET', '/agent/status')

// ── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = () => req('GET', '/analytics/summary')

// ── Autonomous Outreach Campaigns ───────────────────────────────────────────

export const getAutonomousCampaigns = () => req('GET', '/autonomous/campaigns')
export const createAutonomousCampaign = (data) => req('POST', '/autonomous/campaigns', data)
export const getAutonomousCampaign = (id) => req('GET', `/autonomous/campaigns/${id}`)
export const updateAutonomousCampaign = (id, data) => req('PUT', `/autonomous/campaigns/${id}`, data)
export const deleteAutonomousCampaign = (id) => req('DELETE', `/autonomous/campaigns/${id}`)
export const runAutonomousBatch = (id, limit, payload = {}) => {
  const q = limit ? `?limit=${limit}` : ''
  return req('POST', `/autonomous/campaigns/${id}/run${q}`, payload)
}
export const runAutonomousFollowups = (id) => req('POST', `/autonomous/run-followups${id ? '?campaign_id=' + id : ''}`)
export const previewAutonomousTemplate = (data) => req('POST', '/autonomous/preview', data)
export const discoverAutonomousCreators = (data, signal = null) => req('POST', '/autonomous/discover-creators', data || {}, signal)
export const stopAutonomousDiscovery = () => req('POST', '/autonomous/stop-discovery', {})
export const getFollowupSchedulerStatus = () => req('GET', '/autonomous/followup-scheduler/status')


// ── Apify Business Email Scraper ──────────────────────────────────────────────
export const findEmailWithApify = (params) => req('POST', '/creators/apify/find-email', params)

// ── Hunter.io Email Finder & Verifier ─────────────────────────────────────────
export const findEmailWithHunter = (params) => req('POST', '/creators/hunter/find-email', params)
export const verifyEmailWithHunter = (params) => req('POST', '/creators/hunter/verify-email', params)

// ── Co-Launch Projects & 5-Step Validation Workflow ─────────────────────────
export const getCoLaunchProjects = () => req('GET', '/projects')
export const getCoLaunchProject = (id) => req('GET', `/projects/${id}`)
export const createCoLaunchProject = (data) => req('POST', '/projects', data)
export const updateCoLaunchProject = (id, data) => req('PATCH', `/projects/${id}`, data)
export const updateValidationPlan = (id, plan) => req('PUT', `/projects/${id}/plan`, plan)
export const updateValidationCampaign = (id, campaign) => req('PUT', `/projects/${id}/campaign`, campaign)
export const generateCampaignSocialImage = (id, params = {}) => req('POST', `/projects/${id}/campaign/generate-image`, params)
export const generateCampaignVideo = (id, params = {}) => req('POST', `/projects/${id}/campaign/generate-video`, params)
export const getCreatorCampaignTasks = (id) => req('GET', `/projects/${id}/creator-tasks`)
export const updateCreatorCampaignTask = (id, taskId, updates) => req('PATCH', `/projects/${id}/creator-tasks/${taskId}`, updates)
export const sendTaskReminder = (id, taskId) => req('POST', `/projects/${id}/remind-task/${taskId}`)
export const createProjectCheckoutSession = (projectId, data = {}) => {
  const endpoint = projectId ? `/projects/${projectId}/create-checkout-session` : '/projects/create-checkout-session'
  return req('POST', endpoint, { ...data, projectId })
}
export const recordSurveyResponseUniversal = (data) => req('POST', '/projects/record-survey-response', data)
export const addProjectSurveyResponse = (id, data) => req('POST', `/projects/${id}/survey-response`, data)
export const deleteSurveyResponse = (id, responseId) => req('DELETE', `/projects/${id}/survey-response/${responseId}`)
export const clearAllSurveyResponses = (id) => req('DELETE', `/projects/${id}/survey-responses`)
export const recordVisitUniversal = (data) => req('POST', '/projects/record-visit', data)
export const logProjectActivity = (id, activity) => req('POST', `/projects/${id}/log-activity`, activity)
export const getProjectBySlug = (slug) => req('GET', `/projects/by-slug/${slug}`)
export const recordGateDecision = (id, decisionData) => req('POST', `/projects/${id}/gate-decision`, decisionData)
export const deleteCoLaunchProject = (id) => req('DELETE', `/projects/${id}`)
export const deleteAllProjects = () => req('DELETE', '/projects')

export const generateDecisionEmail = (params) =>
  req('POST', '/autonomous/generate-decision-email', params)

export const generateAudienceAndConcepts = (params) =>
  req('POST', '/autonomous/generate-audience-and-concepts', params)

export const generateStep6Response = (params) =>
  req('POST', '/autonomous/generate-step6-response', params)

// ── Global Cross-Device Workflow State Sync ─────────────────────────────────
let _cachedWorkflowState = null
let _workflowStatePromise = null

export const getWorkflowState = async (forceRefresh = false) => {
  if (!forceRefresh && _cachedWorkflowState) {
    // SWR: return cached immediately, refresh in background silently
    req('GET', '/workflow-state').then(ws => {
      if (ws) {
        _cachedWorkflowState = ws
      }
    }).catch(() => {})
    return _cachedWorkflowState
  }

  if (_workflowStatePromise) {
    return _workflowStatePromise
  }

  _workflowStatePromise = (async () => {
    try {
      const res = await req('GET', '/workflow-state')
      if (res) {
        _cachedWorkflowState = res
      }
      return res
    } finally {
      _workflowStatePromise = null
    }
  })()

  return _workflowStatePromise
}

export const updateWorkflowState = async (data) => {
  if (_cachedWorkflowState && typeof data === 'object') {
    _cachedWorkflowState = { ..._cachedWorkflowState, ...data }
  }
  const res = await req('POST', '/workflow-state', data)
  if (res) {
    _cachedWorkflowState = res
  }
  return res
}

export const resetWorkflowState = async () => {
  _cachedWorkflowState = null
  return req('DELETE', '/workflow-state')
}

export const uploadMediaToCloudinary = (data) => req('POST', '/upload', data)

export const uploadFormFileToCloudinary = async (file, folder = 'colaunch', projectId = null) => {
  const formData = new FormData()
  formData.append('file', file)
  if (folder) formData.append('folder', folder)
  if (projectId) formData.append('project_id', projectId)

  const res = await fetch('/api/upload/form', {
    method: 'POST',
    body: formData
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Upload failed')
  }
  return res.json()
}

export const deleteMediaFromCloudinary = async ({ publicId, url, resourceType = 'image', projectId = null, fileId = null }) => {
  try {
    const res = await fetch('/api/upload/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicId,
        url,
        resourceType,
        projectId,
        fileId
      })
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || 'Delete failed')
    }
    return res.json()
  } catch (e) {
    console.warn('[opsApi] deleteMediaFromCloudinary error:', e)
    return { success: false, error: e.message }
  }
}


// Shareable/public links (pre-order, portal, landing pages) always use the public app URL.
export const getFrontendUrl = () => PUBLIC_APP_URL

// ── Target Niches Database Operations ─────────────────────────────────────────
export const getNiches = () => req('GET', '/niches')
export const addNicheToDb = (data) => req('POST', '/niches', data)
export const removeNicheFromDb = (name, permanent = false) =>
  req('DELETE', `/niches/${encodeURIComponent(name)}${permanent ? '?permanent=true' : ''}`)
export const saveActiveNichesToDb = (niches) => req('PUT', '/niches/active', { niches })
export const toggleNicheActiveInDb = (name, is_active) => req('PUT', '/niches/toggle', { name, is_active })

// ── Campaign Media & Autonomous Post Delivery Operations ──────────────────────
export const sendCampaignPostEmail = (projectId, payload = {}) =>
  req('POST', `/projects/${projectId}/campaign/send-post-email`, payload)

export const toggleAutonomousCampaignDelivery = (projectId, payload = {}) =>
  req('POST', `/projects/${projectId}/campaign/toggle-autonomous-delivery`, payload)


// ── Phase 2 beta program & staging ─────────────────────────────────────────────────────────
export const getBetaSession = (slug, token = '') =>
  req('GET', `/beta/session?slug=${encodeURIComponent(slug)}${token ? `&token=${encodeURIComponent(token)}` : ''}`)
export const postBetaEvent = (payload) => req('POST', '/beta/event', payload)
export const postBetaFeedback = (payload) => req('POST', '/beta/feedback', payload)
export const deployStaging = (projectId, payload) => req('POST', `/beta/staging/${projectId}`, payload)
export const deleteBetaFeedback = (projectId, feedbackId) => req('DELETE', `/beta/feedback/${projectId}/${feedbackId}`)

// ── Phase 3 launch ─────────────────────────────────────────────────────────────────────────
export const getLaunchState = (pid) => req('GET', `/launch/${pid}/state`)
export const saveLaunchConfig = (pid, cfg) => req('PUT', `/launch/${pid}/config`, cfg)
export const goLive = (pid, payload = {}) => req('POST', `/launch/${pid}/go-live`, payload)
export const pauseLaunch = (pid) => req('POST', `/launch/${pid}/pause`)
export const getLaunchMetrics = (pid) => req('GET', `/launch/${pid}/metrics`)
export const postLaunchDecision = (pid, payload) => req('POST', `/launch/${pid}/decision`, payload)
export const listLaunchDecisions = (pid) => req('GET', `/launch/${pid}/decisions`)
export const confirmLaunchOrder = (sessionId) => req('POST', '/launch/order/confirm', { sessionId })
export const getProductAccess = (slug, token) => req('GET', `/launch/access?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`)
export const postLaunchEvent = (payload) => req('POST', '/launch/event', payload)

// ── Phase 2 coding agent (MCP) + GitHub ───────────────────────────────────────────────────
export const getBuildStatus = (pid) => req('GET', `/build/${pid}/status`)
export const connectBuildGithub = (pid, body) => req('PUT', `/build/${pid}/github`, body)
export const disconnectBuildGithub = (pid) => req('DELETE', `/build/${pid}/github`)
export const createBuildAgentKey = (pid, label) => req('POST', `/build/${pid}/keys`, { label })
export const revokeBuildAgentKey = (pid, prefix) => req('DELETE', `/build/${pid}/keys/${prefix}`)
export const syncBuildCi = (pid) => req('POST', `/build/${pid}/github/sync`)
export const getBuildTaskRuns = (pid, taskId) => req('GET', `/build/${pid}/runs/${encodeURIComponent(taskId)}`)

// ── Phase 2 Build Studio (streamed AI build) ──────────────────────────────────────────────
/** POST and read a Server-Sent Events stream. onEvent(event, data) for each message. */
export async function streamSSE(path, body, onEvent, signal) {
  const operatorToken = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('forge_launch_auth_token') || localStorage.getItem('forge_op_token') || getCreatorSession()?.token || '')
    : ''
  const headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' }
  if (operatorToken) {
    headers.Authorization = `Bearer ${operatorToken}`
    headers['X-Operator-Token'] = operatorToken
  }
  const res = await fetch(buildApiUrl(path), { method: 'POST', headers, body: JSON.stringify(body || {}), signal })
  if (!res.ok || !res.body) {
    let msg = `Request failed (${res.status})`
    try { const j = await res.json(); msg = j.detail || j.message || msg } catch { /* not json */ }
    throw new Error(msg)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const raw = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      let event = 'message'
      let data = ''
      for (const line of raw.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7).trim()
        else if (line.startsWith('data: ')) data += line.slice(6)
      }
      try { onEvent(event, data ? JSON.parse(data) : null) } catch (e) { console.warn('[SSE] handler', e) }
    }
  }
}
export const getStudio = (pid) => req('GET', `/studio/${pid}`)
export const restoreStudioCheckpoint = (pid, cp) => req('POST', `/studio/${pid}/restore/${cp}`)

// ── DIY pass + creator accounts ────────────────────────────────────────────
export const getDiyPrice = (projectId) => req('GET', `/creator-auth/diy/price?project=${encodeURIComponent(projectId)}`)
export const payDiyPass = (body) => req('POST', '/creator-auth/diy/pay', body)
export const confirmDiyPayment = (sessionId) => req('POST', '/creator-auth/diy/confirm', { sessionId })
export const creatorSignup = (body) => req('POST', '/creator-auth/signup', body)
export const creatorLogin = (email, password) => req('POST', '/creator-auth/login', { email, password })
export const creatorMe = () => req('GET', '/creator-auth/me')

// ── Product website (site builder) ─────────────────────────────────────────
export const getSite = (pid) => req('GET', `/sites/${encodeURIComponent(pid)}`)
export const saveSite = (pid, draft, baseRev) => req('PUT', `/sites/${encodeURIComponent(pid)}`, { draft, baseRev })
export const publishSite = (pid, notify = false) => req('POST', `/sites/${encodeURIComponent(pid)}/publish`, { notify })
export const unpublishSite = (pid) => req('POST', `/sites/${encodeURIComponent(pid)}/unpublish`)
export const getPublicSite = (slug, handle) => req('GET', `/sites/public/${encodeURIComponent(slug)}${handle != null ? `?handle=${encodeURIComponent(handle)}` : ''}`)
export const siteSignup = (slug, email, name) => req('POST', `/sites/public/${encodeURIComponent(slug)}/signup`, { email, name })
export const aiSiteSection = (pid, type, data, instruction) => req('POST', `/sites/${encodeURIComponent(pid)}/ai/section`, { type, data, instruction })
export const aiSitePage = (pid, sections, instruction) => req('POST', `/sites/${encodeURIComponent(pid)}/ai/page`, { sections, instruction })
export const aiSiteCode = (pid, payload) => req('POST', `/sites/${encodeURIComponent(pid)}/ai/code`, payload)
export const aiSiteLogo = (pid, payload) => req('POST', `/sites/${encodeURIComponent(pid)}/ai/logo`, payload)
export const listSiteRevisions = (pid) => req('GET', `/sites/${encodeURIComponent(pid)}/revisions`)
export const getSiteRevision = (pid, rid) => req('GET', `/sites/${encodeURIComponent(pid)}/revisions/${encodeURIComponent(rid)}`)
