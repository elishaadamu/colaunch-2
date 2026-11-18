import React from 'react'
import {
  Palette, Globe, HelpCircle, Save, Copy, ExternalLink,
  CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Sparkles,
  Loader2, Plus, Trash2
} from 'lucide-react'
import {
  updateValidationCampaign,
  updateCoLaunchProject,
  logProjectActivity
} from '../../../services/opsApi'
import ProductMockupCanvas from '../ProductMockupCanvas'
import { C, PILL_TONES, P1_SHARED_CSS } from './phase1Constants'
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
          waitlistCount: 240,
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
          waitlistCount: 240,
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

          <div className="card overflow-hidden">
            <div className="px-6 sm:px-10 pt-10 pb-8 text-center space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-medium border" style={PILL_TONES.ok}>Founding member pre-sale</span>
                {hasVariant && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border" style={PILL_TONES.violet}>
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    AI variant is live
                  </span>
                )}
              </div>
              <h2 className="serif m-0 text-4xl sm:text-5xl leading-[1.05]">
                {campaignKit?.landingPageCopy?.headline || `The ${project?.productName || 'Product'} System`}
              </h2>
              <p className="m-0 text-sm sm:text-base leading-relaxed max-w-xl mx-auto" style={{ color: C.muted }}>
                {campaignKit?.landingPageCopy?.subheadline || project?.productTagline || 'Reserve early founding access and lock in lifetime benefits.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full sm:w-auto h-11 px-6">
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                  <span>Claim access for ${activeFoundingPrice}</span>
                </a>
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-quiet w-full sm:w-auto h-11 px-5">
                  <ShieldCheck className="w-4 h-4" style={{ color: C.ok }} aria-hidden="true" />
                  <span>Reserve with ${activeDepositPrice} deposit</span>
                </a>
              </div>
            </div>
            {(mockupImage || project?.mockupImage || project?.mockup_image || project?.meta?.mockup_image) && (
              <div className="px-5 sm:px-10 pb-10 max-w-4xl mx-auto space-y-2">
                <div className="overflow-hidden rounded-xl border border-[#252B32] bg-[#101419] shadow-2xl">
                  <img
                    src={mockupImage || project?.mockupImage || project?.mockup_image || project?.meta?.mockup_image}
                    alt={project?.productName || project?.selectedConcept?.name || 'Planned product'}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <p className="m-0 text-xs text-center" style={{ color: C.muted }}>
                  Illustration of the planned product. The final design may differ.
                </p>
              </div>
            )}
          </div>

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
      {tab === 'research' && (
        <div className="space-y-6">
          <UrlBar
            url={surveyUrl}
            copyLabel="Copy link"
            openLabel="Open live survey"
            onCopy={() => { navigator.clipboard?.writeText(surveyUrl); showNotification('Shareable survey link copied!') }}
          />

          {/* Score */}
          <section className="card p-5 sm:p-6 space-y-5" aria-labelledby="p1a-score">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-xs" style={{ color: C.muted }}>{surveyResponses.length} {surveyResponses.length === 1 ? 'response' : 'responses'} collected</p>
                <h4 id="p1a-score" className="serif m-0 mt-0.5 text-3xl leading-tight">
                  {surveyAnalysis?.scoreVerdict || (surveyResponses.length > 0 ? 'Responses are ready to analyse' : 'Waiting for responses')}
                </h4>
              </div>
              <button type="button" onClick={handleAnalyzeResponses} disabled={isAnalyzingResponses || surveyResponses.length === 0} className="btn btn-primary h-10 px-4 shrink-0">
                {isAnalyzingResponses ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /><span>Analysing...</span></>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /><span>Analyse with AI</span></>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {analysisScores.map((s) => (
                <div key={s.label} className="p-4 rounded-xl" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                  <p className="m-0 text-xs" style={{ color: C.muted }}>{s.label}</p>
                  <p className="serif m-0 mt-1.5 text-4xl leading-none" style={{ color: s.value ? s.color : C.faint }}>{s.value || '--'}</p>
                  <p className="m-0 mt-2 text-xs" style={{ color: s.noteColor }}>{s.note}</p>
                </div>
              ))}
            </div>

            {surveyAnalysis?.executiveSummary && (
              <div className="p-4 rounded-xl space-y-3" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
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
                <p className="m-0 mt-1 text-xs" style={{ color: C.muted }}>What people are asked on the public survey page.</p>
              </div>
              <button type="button" onClick={handleGenerateSurvey} disabled={isGeneratingSurvey} className="btn btn-quiet h-9 px-3.5 shrink-0">
                {isGeneratingSurvey ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /><span>Writing questions...</span></>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /><span>Regenerate with AI</span></>
                )}
              </button>
            </div>

            <ol className="list-none m-0 p-0 space-y-2">
              {(surveyData?.questions || []).map((q, index) => (
                <li key={q.id || index} className="p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xs tabular-nums mt-0.5 shrink-0" style={{ color: C.faint }}>{index + 1}.</span>
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-medium" style={{ color: C.text }}>{q.question}</p>
                      <p className="m-0 mt-0.5 text-xs" style={{ color: C.faint }}>{q.category || 'Discovery'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 self-start sm:self-center" style={(q.responseCount || 0) > 0 ? PILL_TONES.ok : PILL_TONES.neutral}>
                    {q.responseCount || 0} {(q.responseCount || 0) === 1 ? 'response' : 'responses'}
                  </span>
                </li>
              ))}
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
                <p className="m-0 mt-1 text-xs" style={{ color: C.muted }}>Answers sent in through the public survey link.</p>
              </div>
              {surveyResponses.length > 0 && (
                <button type="button" onClick={handleClearAllSurveyResponses} className="btn btn-danger h-8 px-3 text-xs">
                  Clear all
                </button>
              )}
            </div>

            {surveyResponses.length === 0 ? (
              <div className="text-center py-10 rounded-xl space-y-1" style={{ background: C.sheet, border: `1px dashed ${C.lineStrong}` }}>
                <p className="m-0 text-sm font-medium" style={{ color: C.body }}>No responses yet</p>
                <p className="m-0 text-xs" style={{ color: C.muted }}>Share the survey link with the creator's community to start collecting answers.</p>
              </div>
            ) : (
              <ul className="list-none m-0 p-0 space-y-3">
                {surveyResponses.map((r) => (
                  <li key={r.id} className="p-4 rounded-xl space-y-3" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold" style={{ color: C.text }}>{r.name}</span>
                        <span className="ml-2 text-xs break-all" style={{ color: C.muted }}>{r.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {r.rating ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border" style={PILL_TONES.ok}>Intent {r.rating}/10</span>
                        ) : null}
                        <span className="text-xs" style={{ color: C.faint }}>{r.submittedAt || r.date}</span>
                        <button type="button" onClick={() => handleDeleteSurveyResponse(r.id)} aria-label={`Delete response from ${r.name}`} title="Delete response" className="p-1 rounded cursor-pointer" style={{ color: C.crimsonText }}>
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {r.answers && (
                      <ul className="list-none m-0 p-0 pt-3 space-y-1.5 text-sm" style={{ borderTop: `1px solid ${C.line}`, color: C.body }}>
                        {Object.entries(r.answers).map(([key, ans]) => (
                          <li key={key} className="leading-relaxed">{ans}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

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
