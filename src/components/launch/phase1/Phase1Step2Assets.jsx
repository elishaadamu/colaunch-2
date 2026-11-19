import React from 'react'
import {
  Palette, Globe, HelpCircle, Save, Copy, ExternalLink,
  CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Sparkles,
  Loader2, Plus, Trash2, MessageSquare, HeartHandshake, Crown, Bell, Gauge,
  Flame, Wallet, Tag, Workflow, X, Mail, Inbox, BarChart3
} from 'lucide-react'
import {
  updateValidationCampaign,
  updateCoLaunchProject,
  logProjectActivity
} from '../../../services/opsApi'
import ProductMockupCanvas from '../ProductMockupCanvas'
import { C, PILL_TONES, P1_SHARED_CSS } from './phase1Constants'
import ConceptLandingPage from '../ConceptLandingPage'
import { resolveProjectLanding } from '../../../utils/projectLanding'
import StepRail from './StepRail'

const ASSETS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.p1assets .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-0.01em}
.p1assets .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;white-space:nowrap;font-size:.8125rem;font-weight:600;border-radius:.625rem;cursor:pointer;border:1px solid transparent;text-decoration:none;transition:background-color .15s,border-color .15s,color .15s}
.p1assets .btn:disabled{opacity:.45;cursor:not-allowed}
.p1assets .btn-primary{background:${C.crimson};color:#fff}
.p1assets .btn-primary:hover:not(:disabled){background:${C.crimsonHover}}
.p1assets .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.p1assets .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.p1assets .btn-ok{background:${C.okSoft};color:${C.ok};border-color:${C.okLine}}
.p1assets .btn-danger{background:transparent;color:${C.crimsonText};border-color:${C.crimsonLine}}
.p1assets .btn-danger:hover:not(:disabled){background:${C.crimsonSoft}}
.p1assets .btn:focus-visible,.p1assets .tab:focus-visible,.p1assets input:focus-visible,.p1assets textarea:focus-visible,.p1assets select:focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
.p1assets .tab{display:inline-flex;align-items:center;gap:.5rem;white-space:nowrap;padding:.5rem .875rem;border-radius:.625rem;font-size:.8125rem;font-weight:500;cursor:pointer;color:${C.muted};border:1px solid transparent;background:transparent;transition:color .15s,background-color .15s}
.p1assets .tab:hover{color:${C.text}}
.p1assets .tab[aria-selected="true"]{background:${C.raised};color:${C.text};border-color:${C.line}}
.p1assets .in{width:100%;background:${C.row};border:1px solid ${C.line};color:${C.text};border-radius:.625rem;padding:.55rem .8rem;font-size:.875rem;transition:border-color .15s}
.p1assets .in:hover{border-color:${C.lineStrong}}
.p1assets .in:focus{border-color:${C.crimsonLine};outline:none}
.p1assets .in::placeholder{color:${C.faint}}
.p1assets textarea.in{resize:vertical;line-height:1.5}
@media (min-width:640px){.p1assets .in.sel{width:11rem;flex:none}.p1assets .in.grow{flex:1;width:auto;min-width:0}}
.p1assets .card{background:${C.row};border:1px solid ${C.line};border-radius:1rem}
.p1assets .lbl{display:block;font-size:.75rem;font-weight:600;color:${C.body};margin-bottom:.375rem}
@media (prefers-reduced-motion:reduce){.p1assets *{transition:none!important;animation:none!important}}
`

const Field = ({ label, children }) => (
  <label className="block">
    <span className="lbl">{label}</span>
    {children}
  </label>
)

function UrlBar({ url, copyLabel, onCopy, openLabel }) {
  return (
    <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg min-w-0 flex-1" style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.body }}>
        <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} aria-hidden="true" />
        <span className="truncate text-xs" title={url}>{url}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={onCopy} className="btn btn-quiet h-9 px-3.5">
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{copyLabel}</span>
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-9 px-3.5">
          <span>{openLabel}</span>
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}

const TABS = [
  { id: 'product_assets', label: 'Identity and mockup', icon: Palette },
  { id: 'infrastructure', label: 'Landing page and checkout', icon: Globe },
  { id: 'research', label: 'Customer survey', icon: HelpCircle },
]

export default function Phase1Step2Assets({
  project,
  assetSubTab,
  setAssetSubTab,
  assetName,
  setAssetName,
  assetTagline,
  setAssetTagline,
  assetTone,
  setAssetTone,
  assetAudience,
  setAssetAudience,
  updateAssetField,
  campaignKit,
  updateCampaignKit,
  activeFoundingPrice,
  activeDepositPrice,
  productSlug,
  origin,
  presalesRevenue,
  reservations,
  mockupImage,
  setMockupImage,
  surveyData,
  surveyResponses,
  surveyAnalysis,
  isAnalyzingResponses,
  handleAnalyzeResponses,
  isGeneratingSurvey,
  handleGenerateSurvey,
  newQuestionCategory,
  setNewQuestionCategory,
  newQuestionText,
  setNewQuestionText,
  handleAddQuestion,
  handleDeleteSurveyResponse,
  handleClearAllSurveyResponses,
  saveAll,
  setIsStep2Approved,
  sanitizedPricingConfig,
  showNotification,
  setActiveStep,
  onSelectStep,
  onUpdateProject,
}) {
  const tab =
    assetSubTab === 'page' ? 'infrastructure'
    : assetSubTab === 'survey' ? 'research'
    : assetSubTab === 'branding' || !assetSubTab ? 'product_assets'
    : assetSubTab

  const pageUrl = `${origin}/preorder/${productSlug}`
  const surveyUrl = `${origin}/survey/${productSlug}`
  const refTag = (project?.creatorHandle || 'creator').replace('@', '')
  const hasVariant = Boolean(campaignKit?.landingPageCopy?.activeExperimentTitle || campaignKit?.pricingConfig?.activeExperimentTitle)

  const approveAssets = () => {
    const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
      productName: project?.productName,
      productTagline: project?.productTagline,
      pricingConfig: sanitizedPricingConfig,
    }

    setIsStep2Approved(true)

    const updated = {
      ...(project || {}),
      planLocked: true,
      assetsApproved: true,
      landingPageApproved: true,
      validationCampaign: {
        ...(project?.validationCampaign || {}),
        product_assets: step2Assets,
        productAssets: step2Assets,
        campaign_kit: campaignKit,
        campaignKit: campaignKit,
        creator_tasks: campaignKit?.postingSchedule || [],
        infrastructure: {
          landingPageUrl: `/p/${productSlug}`,
          checkoutUrl: `/p/${productSlug}/checkout`,
          waitlistCount: Array.isArray(project?.waitlist) ? project.waitlist.length : 0,
          attributionTracking: true,
        },
        research_survey: surveyData,
        review_status: 'approved',
        reviewStatus: 'approved',
      },
    }

    if (onUpdateProject) {
      onUpdateProject((prev) => ({ ...(prev || {}), ...updated }))
    }

    if (project?.id) {
      updateValidationCampaign(project.id, {
        product_assets: step2Assets,
        campaign_kit: campaignKit,
        campaignKit: campaignKit,
        creator_tasks: campaignKit?.postingSchedule || [],
        infrastructure: {
          landingPageUrl: `/p/${productSlug}`,
          checkoutUrl: `/p/${productSlug}/checkout`,
          waitlistCount: Array.isArray(project?.waitlist) ? project.waitlist.length : 0,
          attributionTracking: true,
        },
        research_survey: surveyData,
        review_status: 'approved',
      }).catch((e) => console.warn('[Phase1] DB campaign approval warning:', e))

      updateCoLaunchProject(project.id, {
        assetsApproved: true,
        landingPageApproved: true,
        campaignKit: campaignKit,
        campaign_kit: campaignKit,
      }).catch((e) => console.warn('[Phase1] DB project approval warning:', e))

      logProjectActivity(project.id, {
        action: 'Validation Assets & Campaign Approved',
        details: 'Step 2 assets, copy, and research survey approved. Advancing to Creator Campaign.',
        step: 'assets',
        phase: 1,
      }).catch((e) => console.warn('[Phase1] Activity logging warning:', e))
    }

    showNotification('Validation assets approved & locked in database! Advancing to Creator Campaign.')
    setActiveStep('campaign')
    onSelectStep?.('campaign')
  }

  const analysisScores = [
    { label: 'Overall score', value: surveyAnalysis?.overallScore !== undefined ? `${surveyAnalysis.overallScore}/100` : null, note: surveyAnalysis?.recommendation === 'PROCEED' ? 'Proceed to build' : surveyAnalysis ? 'Iterate on pricing' : 'Run the analysis', color: C.text, noteColor: surveyAnalysis?.recommendation === 'PROCEED' ? C.ok : surveyAnalysis ? C.warn : C.faint },
    { label: 'Market demand', value: surveyAnalysis?.marketDemandScore !== undefined ? `${surveyAnalysis.marketDemandScore}%` : null, note: 'How urgent the problem feels', color: C.ok, noteColor: C.faint },
    { label: `Pricing fit at $${activeFoundingPrice}`, value: surveyAnalysis?.pricingViabilityScore !== undefined ? `${surveyAnalysis.pricingViabilityScore}%` : null, note: 'Willingness to pay', color: C.skyText, noteColor: C.faint },
  ]

  return (
    <div className="p1-themed p1-rise p1assets p-5 sm:p-8 rounded-2xl space-y-6" style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.text }}>
      <style>{P1_SHARED_CSS}</style>
      <StepRail current="assets" />
      <style>{ASSETS_CSS}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="serif m-0 text-4xl leading-none">Validation assets</h3>
          <p className="m-0 mt-2.5 text-sm leading-relaxed max-w-2xl" style={{ color: C.muted }}>
            Everything buyers see before the product exists: the name, the pitch, the pre-order page and a short survey.
          </p>
        </div>
        <button type="button" onClick={saveAll} className="btn btn-ok h-9 px-4 shrink-0">
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Save assets</span>
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Asset sections" className="flex items-center gap-1 overflow-x-auto pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="tab" onClick={() => setAssetSubTab(t.id)}>
              <Icon className="w-3.5 h-3.5" style={{ color: tab === t.id ? C.crimsonText : C.faint }} aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* IDENTITY */}
      {tab === 'product_assets' && (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-5">
            <section className="card p-5 sm:p-6 space-y-4" aria-labelledby="p1a-identity">
              <h4 id="p1a-identity" className="serif m-0 text-2xl">Name and positioning</h4>
              <Field label="Product name">
                <input
                  type="text"
                  className="in"
                  value={assetName}
                  onChange={(e) => { const val = e.target.value; setAssetName(val); updateAssetField('productName', val) }}
                  placeholder="RetroVault OS"
                />
              </Field>
              <Field label="Tagline">
                <textarea
                  rows={2}
                  className="in"
                  value={assetTagline}
                  onChange={(e) => { const val = e.target.value; setAssetTagline(val); updateAssetField('productTagline', val) }}
                  placeholder="Cloud-save sync and CRT shaders for retro handhelds."
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Brand tone">
                  <input type="text" className="in" value={assetTone} onChange={(e) => { const val = e.target.value; setAssetTone(val); updateAssetField('brandTone', val) }} />
                </Field>
                <Field label="Target audience">
                  <input type="text" className="in" value={assetAudience} onChange={(e) => { const val = e.target.value; setAssetAudience(val); updateAssetField('targetAudience', val) }} />
                </Field>
              </div>
            </section>

            <section className="card p-5 sm:p-6 space-y-4" aria-labelledby="p1a-offer">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4 id="p1a-offer" className="serif m-0 text-2xl">Headline and pricing</h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border" style={PILL_TONES.ok}>Shown on /preorder</span>
              </div>
              <Field label="Headline">
                <input
                  type="text"
                  className="in"
                  value={campaignKit?.landingPageCopy?.headline ?? `The ${project?.productName || 'Software'} Workspace Built with ${project?.creatorName || 'Founding Creator'}`}
                  onChange={(e) => updateCampaignKit('landingPageCopy', { ...(campaignKit?.landingPageCopy || {}), headline: e.target.value })}
                  placeholder="Never lose a retro game save again."
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Founding annual price">
                  <div className="in flex items-center gap-1.5">
                    <span style={{ color: C.muted }}>$</span>
                    <input
                      type="number"
                      aria-label="Founding annual price"
                      value={activeFoundingPrice}
                      onChange={(e) => updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), foundingPrice: Number(e.target.value) || 0 })}
                      className="w-full bg-transparent outline-none"
                      style={{ color: C.text }}
                    />
                  </div>
                </Field>
                <Field label="Refundable deposit">
                  <div className="in flex items-center gap-1.5">
                    <span style={{ color: C.muted }}>$</span>
                    <input
                      type="number"
                      aria-label="Refundable deposit"
                      value={activeDepositPrice}
                      onChange={(e) => updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), depositPrice: Number(e.target.value) || 0 })}
                      className="w-full bg-transparent outline-none"
                      style={{ color: C.text }}
                    />
                  </div>
                </Field>
              </div>
              <Field label="Perks and guarantee">
                <input
                  type="text"
                  className="in"
                  value={campaignKit?.pricingConfig?.perks ?? `50% Lifetime Discount + 1-on-1 Alpha Onboarding for ${project?.creatorName || 'Founding'} VIPs`}
                  onChange={(e) => updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), perks: e.target.value })}
                  placeholder="50% lifetime discount and early beta access"
                />
              </Field>
            </section>
          </div>

          <section aria-labelledby="p1a-mockup" className="space-y-3">
            <div>
              <h4 id="p1a-mockup" className="serif m-0 text-2xl">Product mockup</h4>
              <p className="m-0 mt-1 text-xs" style={{ color: C.muted }}>The picture of the product used on the pre-order page and in the campaign.</p>
            </div>
            <ProductMockupCanvas
              project={{ ...(project || {}), currentPresales: presalesRevenue, reservations, mockupImage }}
              onSaveMockupImage={(imgUrl) => {
                setMockupImage(imgUrl)
                if (onUpdateProject) onUpdateProject((prev) => ({ ...(prev || {}), mockupImage: imgUrl }))
                if (project?.id) {
                  updateCoLaunchProject(project.id, { mockupImage: imgUrl }).catch(() => {})
                }
              }}
              onShowNotification={showNotification}
            />
          </section>
        </div>
      )}

      {/* LANDING PAGE */}
      {tab === 'infrastructure' && (
        <div className="space-y-5">
          <UrlBar
            url={pageUrl}
            copyLabel="Copy link"
            openLabel="Open live page"
            onCopy={() => { navigator.clipboard?.writeText(pageUrl); showNotification('Pre-order link copied!') }}
          />

          {/* Exactly the page buyers see at the live link (same component, mockup and prices) */}
          {(() => {
            const landing = resolveProjectLanding(project || {})
            const heroImg = mockupImage || project?.mockupImage || project?.mockup_image || project?.meta?.mockup_image || ''
            return (
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ background: C.raised, borderBottom: `1px solid ${C.line}` }}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#3f3f46' }} />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#3f3f46' }} />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#3f3f46' }} />
                    <span className="ml-2 text-[11px] font-mono truncate" style={{ color: C.muted }}>{pageUrl}</span>
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: C.faint }}>Live preview</span>
                </div>
                <div className="max-h-[760px] overflow-y-auto">
                  {campaignKit?.landingPageCopy?.urgency?.text && (
                    <div className="px-4 py-2 text-center text-xs font-semibold" style={{ background: landing.brandColor, color: '#fff' }}>
                      ⏳ {campaignKit.landingPageCopy.urgency.text}
                    </div>
                  )}
                  <ConceptLandingPage
                    concept={campaignKit?.landingPageCopy?.headline ? { ...(landing.concept || {}), tagline: campaignKit.landingPageCopy.headline } : landing.concept}
                    conceptIndex={landing.conceptIndex}
                    creator={landing.creator}
                    brandColor={landing.brandColor}
                    mode="full"
                    heroImageUrl={heroImg}
                    ctaLabel={campaignKit?.landingPageCopy?.ctaText || `Claim access for $${activeFoundingPrice}`}
                    onCtaClick={() => window.open(pageUrl, '_blank', 'noopener')}
                  />
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 space-y-1.5">
              <p className="m-0 text-xs" style={{ color: C.muted }}>Collected through Stripe</p>
              <p className="serif m-0 text-4xl leading-none">${(presalesRevenue || 0).toLocaleString()}</p>
              <p className="m-0 pt-1 text-xs leading-relaxed" style={{ color: C.faint }}>Pre-orders update here as payments come in.</p>
            </div>
            <div className="card p-5 space-y-1.5">
              <p className="m-0 text-xs" style={{ color: C.muted }}>Creator attribution tag</p>
              <p className="m-0 text-2xl leading-none pt-1.5" style={{ color: C.skyText }}>?ref={refTag}</p>
              <p className="m-0 pt-2 text-xs leading-relaxed" style={{ color: C.faint }}>Add this to the link so sales from the creator's audience are credited to them.</p>
            </div>
            <div className="card p-5 space-y-1.5">
              <p className="m-0 text-xs" style={{ color: C.muted }}>Waitlist</p>
              <p className="serif m-0 text-4xl leading-none">{(reservations || []).length} <span className="text-base" style={{ color: C.muted }}>{(reservations || []).length === 1 ? 'lead' : 'leads'}</span></p>
              <p className="m-0 pt-1 text-xs leading-relaxed" style={{ color: C.faint }}>Buyers hold a spot with a ${activeDepositPrice} refundable deposit before the product is built.</p>
            </div>
          </div>
        </div>
      )}

      {/* SURVEY */}
      {tab === 'research' && (() => {
        const qs = surveyData?.questions || []
        const qText = (key) => (qs.find((q) => String(q.id) === String(key)) || {}).question
        const qCat = (key) => (qs.find((q) => String(q.id) === String(key)) || {}).category
        const st = { yes: 0, maybe: 0, no: 0, waitlist: 0, deposit: 0, founding: 0, consented: 0, pricePoints: {} }
        let ratingSum = 0, ratingN = 0
        surveyResponses.forEach((r) => {
          const sp = r.support || {}
          if (st[sp.decision] !== undefined && ['yes', 'maybe', 'no'].includes(sp.decision)) st[sp.decision] += 1
          if (['waitlist', 'deposit', 'founding'].includes(sp.level)) st[sp.level] += 1
          if (sp.consent) st.consented += 1
          if (sp.pricePoint) st.pricePoints[sp.pricePoint] = (st.pricePoints[sp.pricePoint] || 0) + 1
          if (Number(r.rating) > 0) { ratingSum += Number(r.rating); ratingN += 1 }
        })
        const total = surveyResponses.length
        const decided = st.yes + st.maybe + st.no
        const avgRating = ratingN ? (ratingSum / ratingN).toFixed(1) : null
        const pledgedValue = st.deposit * Number(activeDepositPrice || 0) + st.founding * Number(activeFoundingPrice || 0)
        const priceRows = Object.entries(st.pricePoints).sort((a, b) => b[1] - a[1])
        const priceMax = priceRows.length ? priceRows[0][1] : 1
        const pct = (n) => (decided ? Math.round((n / decided) * 100) : 0)
        const stats = [
          { Icon: MessageSquare, label: 'Responses', value: total, note: `${st.consented} opted in to emails`, tone: C.body },
          { Icon: HeartHandshake, label: 'Will support', value: st.yes, note: decided ? `${pct(st.yes)}% said yes` : 'No pledges yet', tone: C.ok },
          { Icon: Crown, label: 'Founding', value: st.founding, note: `$${activeFoundingPrice} each`, tone: C.violetText },
          { Icon: ShieldCheck, label: 'Deposits', value: st.deposit, note: `$${activeDepositPrice} refundable`, tone: C.warn },
          { Icon: Bell, label: 'Waitlist', value: st.waitlist, note: 'Free sign-ups', tone: C.body },
          { Icon: Gauge, label: 'Avg excitement', value: avgRating ? `${avgRating}` : '--', note: avgRating ? 'out of 10' : 'No ratings yet', tone: C.crimsonText },
        ]
        const catIcon = (category = '') => {
          const c = category.toLowerCase()
          if (c.includes('pain') || c.includes('problem')) return Flame
          if (c.includes('spend') || c.includes('budget')) return Wallet
          if (c.includes('pric') || c.includes('pay')) return Tag
          if (c.includes('feature') || c.includes('wish')) return Sparkles
          if (c.includes('workflow') || c.includes('process')) return Workflow
          return MessageSquare
        }
        const decisionBadge = (sp) => {
          if (sp?.decision === 'yes') {
            const lvl = { founding: ['Founding member', Crown, PILL_TONES.violet], deposit: ['Deposit', ShieldCheck, PILL_TONES.warn], waitlist: ['Waitlist', Bell, PILL_TONES.ok] }[sp.level] || ['Supporter', HeartHandshake, PILL_TONES.ok]
            return { label: lvl[0], Icon: lvl[1], style: lvl[2] }
          }
          if (sp?.decision === 'maybe') return { label: 'Maybe', Icon: HelpCircle, style: PILL_TONES.raised }
          if (sp?.decision === 'no') return { label: 'Not for them', Icon: X, style: PILL_TONES.neutral }
          return null
        }
        const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || '?'

        return (
        <div className="space-y-6 p1-rise">
          <UrlBar
            url={surveyUrl}
            copyLabel="Copy link"
            openLabel="Open live survey"
            onCopy={() => { navigator.clipboard?.writeText(surveyUrl); showNotification('Shareable survey link copied!') }}
          />

          {/* Support dashboard */}
          <section className="card p-5 sm:p-6 space-y-5" aria-labelledby="p1a-support">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                  <HeartHandshake className="w-3.5 h-3.5" style={{ color: C.crimsonText }} aria-hidden="true" /> Support pledges
                </p>
                <h4 id="p1a-support" className="serif m-0 mt-1 text-3xl leading-tight">
                  {st.yes > 0 ? `${st.yes} ${st.yes === 1 ? 'person' : 'people'} will support it` : 'No supporters yet'}
                </h4>
                <p className="m-0 mt-1 text-xs" style={{ color: C.faint }}>
                  Respondents choose yes, maybe or no on the survey, then how they'd back it.
                </p>
              </div>
              <div className="shrink-0 px-4 py-3" style={{ background: C.sheet, border: `1px solid ${C.okLine}` }}>
                <p className="m-0 text-[11px] uppercase tracking-wider" style={{ color: C.muted }}>Pledged value</p>
                <p className="serif m-0 text-3xl leading-none mt-1" style={{ color: C.ok }}>${pledgedValue.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.map(({ Icon, label, value, note, tone }) => (
                <div key={label} className="p-4 acq-lift" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="m-0 text-xs" style={{ color: C.muted }}>{label}</p>
                    <span className="w-7 h-7 flex items-center justify-center shrink-0" style={{ background: C.raised, border: `1px solid ${C.line}`, color: tone }}>
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="serif m-0 mt-2 text-4xl leading-none" style={{ color: value && value !== '--' ? C.text : C.faint }}>{value}</p>
                  <p className="m-0 mt-2 text-xs" style={{ color: C.faint }}>{note}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="p-4 space-y-3" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                <p className="m-0 text-xs font-semibold" style={{ color: C.body }}>Would they support it?</p>
                <div className="flex h-3 w-full overflow-hidden" style={{ background: C.raised }} role="img" aria-label={`Yes ${st.yes}, maybe ${st.maybe}, no ${st.no}`}>
                  {decided > 0 && (<>
                    <span style={{ width: `${pct(st.yes)}%`, background: C.ok }} />
                    <span style={{ width: `${pct(st.maybe)}%`, background: C.warn }} />
                    <span style={{ width: `${pct(st.no)}%`, background: '#3f3f46' }} />
                  </>)}
                </div>
                <ul className="list-none m-0 p-0 grid grid-cols-3 gap-2 text-xs">
                  {[['Yes', st.yes, C.ok], ['Maybe', st.maybe, C.warn], ['No', st.no, '#71717a']].map(([l, n, col]) => (
                    <li key={l} className="flex items-center gap-1.5" style={{ color: C.body }}>
                      <span className="w-2 h-2 shrink-0" style={{ background: col }} aria-hidden="true" />
                      {l} <span className="tabular-nums" style={{ color: C.muted }}>{n} · {pct(n)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 space-y-2.5" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                <p className="m-0 flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.body }}>
                  <Tag className="w-3.5 h-3.5" style={{ color: C.muted }} aria-hidden="true" /> What they'd pay monthly
                </p>
                {priceRows.length === 0 ? (
                  <p className="m-0 text-xs" style={{ color: C.faint }}>Price answers appear here as supporters respond.</p>
                ) : (
                  <ul className="list-none m-0 p-0 space-y-2">
                    {priceRows.map(([label, n]) => (
                      <li key={label} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 text-xs">
                        <span className="truncate" style={{ color: C.body }}>{label}</span>
                        <span className="h-2" style={{ background: C.raised }}>
                          <span className="block h-full" style={{ width: `${(n / priceMax) * 100}%`, background: C.crimson }} />
                        </span>
                        <span className="text-right tabular-nums" style={{ color: C.muted }}>{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* AI score */}
          <section className="card p-5 sm:p-6 space-y-5" aria-labelledby="p1a-score">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}>
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-xs" style={{ color: C.muted }}>AI read of {total} {total === 1 ? 'response' : 'responses'}</p>
                  <h4 id="p1a-score" className="serif m-0 mt-0.5 text-3xl leading-tight">
                    {surveyAnalysis?.scoreVerdict || (total > 0 ? 'Responses are ready to analyse' : 'Waiting for responses')}
                  </h4>
                </div>
              </div>
              <button type="button" onClick={handleAnalyzeResponses} disabled={isAnalyzingResponses || total === 0} className="btn btn-primary h-10 px-4 shrink-0">
                {isAnalyzingResponses ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /><span>Analysing...</span></>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /><span>Analyse with AI</span></>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {analysisScores.map((s) => (
                <div key={s.label} className="p-4" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                  <p className="m-0 text-xs" style={{ color: C.muted }}>{s.label}</p>
                  <p className="serif m-0 mt-1.5 text-4xl leading-none" style={{ color: s.value ? s.color : C.faint }}>{s.value || '--'}</p>
                  <p className="m-0 mt-2 text-xs" style={{ color: s.noteColor }}>{s.note}</p>
                </div>
              ))}
            </div>

            {surveyAnalysis?.executiveSummary && (
              <div className="p-4 space-y-3" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                <p className="m-0 text-sm leading-relaxed" style={{ color: C.body }}>{surveyAnalysis.executiveSummary}</p>
                {surveyAnalysis.keyFindings?.length > 0 && (
                  <ul className="list-none m-0 p-0 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${C.line}` }}>
                    {surveyAnalysis.keyFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: C.body }}>
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.ok }} aria-hidden="true" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Questions */}
          <section className="card p-5 sm:p-6 space-y-4" aria-labelledby="p1a-questions">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 id="p1a-questions" className="serif m-0 text-2xl">Survey questions</h4>
                <p className="m-0 mt-1 text-xs" style={{ color: C.muted }}>
                  Shown on the public page, followed by an excitement score and the "Will you support it?" step.
                </p>
              </div>
              <button type="button" onClick={handleGenerateSurvey} disabled={isGeneratingSurvey} className="btn btn-quiet h-9 px-3.5 shrink-0">
                {isGeneratingSurvey ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /><span>Writing questions...</span></>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /><span>Regenerate with AI</span></>
                )}
              </button>
            </div>

            <ol className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {qs.map((q, index) => {
                const Icon = catIcon(q.category)
                const answered = surveyResponses.filter((r) => String(r.answers?.[q.id] || '').trim()).length
                return (
                  <li key={q.id || index} className="p-4 flex items-start gap-3 acq-lift" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                    <span className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.crimsonText }}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[11px] uppercase tracking-wider" style={{ color: C.faint }}>
                        {String(index + 1).padStart(2, '0')} · {q.category || 'Discovery'}
                      </p>
                      <p className="m-0 mt-1 text-sm font-medium leading-snug" style={{ color: C.text }}>{q.question}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 text-[11px] font-medium border" style={answered > 0 ? PILL_TONES.ok : PILL_TONES.neutral}>
                        {answered} {answered === 1 ? 'answer' : 'answers'}
                      </span>
                    </div>
                  </li>
                )
              })}
              <li className="p-4 flex items-start gap-3" style={{ background: C.sheet, border: `1px dashed ${C.lineStrong}` }}>
                <span className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: C.okSoft, border: `1px solid ${C.okLine}`, color: C.ok }}>
                  <HeartHandshake className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-[11px] uppercase tracking-wider" style={{ color: C.faint }}>Always last · Support</p>
                  <p className="m-0 mt-1 text-sm font-medium leading-snug" style={{ color: C.text }}>Will you support it? Waitlist, ${activeDepositPrice} deposit or ${activeFoundingPrice} founding.</p>
                </div>
              </li>
            </ol>

            <form onSubmit={handleAddQuestion} className="flex flex-col sm:flex-row gap-2 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <select
                aria-label="Question type"
                value={newQuestionCategory}
                onChange={(e) => setNewQuestionCategory(e.target.value)}
                className="in sel cursor-pointer"
              >
                <option value="Pain Point">Pain point</option>
                <option value="Pricing Validation">Pricing</option>
                <option value="Feature Wishlist">Feature wishlist</option>
                <option value="Workflow Bottleneck">Workflow</option>
              </select>
              <input
                type="text"
                aria-label="New question"
                placeholder="Write your own question"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="in grow"
              />
              <button type="submit" className="btn btn-primary h-10 px-4">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add question</span>
              </button>
            </form>
          </section>

          {/* Responses */}
          <section className="card p-5 sm:p-6 space-y-4" aria-labelledby="p1a-responses">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h4 id="p1a-responses" className="serif m-0 text-2xl">Responses</h4>
                <p className="m-0 mt-1 text-xs" style={{ color: C.muted }}>Each answer is shown next to the question it replies to.</p>
              </div>
              {total > 0 && (
                <button type="button" onClick={handleClearAllSurveyResponses} className="btn btn-danger h-8 px-3 text-xs">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Clear all
                </button>
              )}
            </div>

            {total === 0 ? (
              <div className="text-center py-10 px-4 space-y-2" style={{ background: C.sheet, border: `1px dashed ${C.lineStrong}` }}>
                <span className="inline-flex w-11 h-11 items-center justify-center" style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.muted }}>
                  <Inbox className="w-5 h-5" aria-hidden="true" />
                </span>
                <p className="m-0 text-sm font-medium" style={{ color: C.body }}>No responses yet</p>
                <p className="m-0 text-xs" style={{ color: C.muted }}>Share the survey link with the creator's community to start collecting answers and pledges.</p>
              </div>
            ) : (
              <ul className="list-none m-0 p-0 grid grid-cols-1 xl:grid-cols-2 gap-3">
                {surveyResponses.map((r) => {
                  const badge = decisionBadge(r.support)
                  return (
                    <li key={r.id} className="p-4 space-y-3 acq-lift" style={{ background: C.sheet, border: `1px solid ${r.support?.decision === 'yes' ? C.okLine : C.line}` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, color: C.text }}>
                            {initials(r.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="m-0 text-sm font-semibold truncate" style={{ color: C.text }}>{r.name}</p>
                            <p className="m-0 text-xs truncate" style={{ color: C.muted }}>{r.email || 'No email'}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleDeleteSurveyResponse(r.id)} aria-label={`Delete response from ${r.name}`} title="Delete response" className="p-1.5 cursor-pointer shrink-0" style={{ color: C.faint }}>
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {badge && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium border" style={badge.style}>
                            <badge.Icon className="w-3 h-3" aria-hidden="true" />{badge.label}
                          </span>
                        )}
                        {r.rating ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium border" style={PILL_TONES.crimson}>
                            <Gauge className="w-3 h-3" aria-hidden="true" />Excitement {r.rating}/10
                          </span>
                        ) : null}
                        {r.support?.pricePoint && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium border" style={PILL_TONES.raised}>
                            <Tag className="w-3 h-3" aria-hidden="true" />{r.support.pricePoint}
                          </span>
                        )}
                        {r.support?.consent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium border" style={PILL_TONES.neutral}>
                            <Mail className="w-3 h-3" aria-hidden="true" />Opted in
                          </span>
                        )}
                        <span className="ml-auto text-[11px]" style={{ color: C.faint }}>{r.submittedAt || r.date}</span>
                      </div>

                      {r.answers && Object.keys(r.answers).length > 0 && (
                        <dl className="m-0 pt-3 space-y-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
                          {Object.entries(r.answers).filter(([, ans]) => String(ans || '').trim()).map(([key, ans]) => {
                            const Icon = catIcon(qCat(key))
                            return (
                              <div key={key} className="flex items-start gap-2.5">
                                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: C.faint }} aria-hidden="true" />
                                <div className="min-w-0">
                                  <dt className="text-[11px]" style={{ color: C.faint }}>{qText(key) || 'Answer'}</dt>
                                  <dd className="m-0 text-sm leading-relaxed" style={{ color: C.body }}>{ans}</dd>
                                </div>
                              </div>
                            )
                          })}
                        </dl>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
        )
      })()}

      {/* Approval */}
      <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.line}` }}>
        <p className="m-0 flex items-start gap-2 text-sm max-w-xl" style={{ color: C.muted }}>
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.ok }} aria-hidden="true" />
          <span>Check the name, copy, pricing, page and survey, then approve to start the creator campaign.</span>
        </p>
        <button type="button" onClick={approveAssets} className="btn btn-primary h-11 px-6">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          <span>Approve and launch campaign</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
