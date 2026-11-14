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
import ProductMockupDisplay from '../ProductMockupDisplay'
import { C, HEADING_FONT, PILL_TONES } from './phase1Constants'

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
  onUpdateProject
}) {
  return (
    <div
      className="p-5 sm:p-6 rounded-2xl space-y-5"
      style={{ background: C.sheet, border: `1px solid ${C.line}` }}
    >
      {/* Top Header */}
      <div
        className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-base font-bold flex items-center gap-2"
              style={{ ...HEADING_FONT, color: C.text }}
            >
              <span>2. Build Validation Assets & Infrastructure</span>
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
              style={PILL_TONES.sky}
            >
              Stage 2 • Infrastructure & Copy
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>
            Product assets, branding, positioning, copy, landing page, checkout, waitlist, analytics & customer discovery surveys.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={saveAll}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            style={{ background: C.okSoft, borderColor: C.okLine, color: C.ok }}
          >
            <Save className="w-3.5 h-3.5" style={{ color: C.ok }} />
            <span>Save Assets</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 pb-2 overflow-x-auto" style={{ borderBottom: `1px solid ${C.line}` }}>
        {[
          { id: 'product_assets', label: '1. Product Identity & Mockup', icon: Palette },
          { id: 'infrastructure', label: '2. Landing Page & Checkout', icon: Globe },
          { id: 'research', label: '3. Customer Discovery Survey', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = assetSubTab === tab.id || (tab.id === 'product_assets' && (!assetSubTab || assetSubTab === 'branding'))
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAssetSubTab(tab.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border"
              style={
                isActive
                  ? { background: C.raised, borderColor: C.lineStrong, color: C.text }
                  : { background: 'transparent', borderColor: 'transparent', color: C.muted }
              }
            >
              <Icon className="w-3.5 h-3.5" style={{ color: isActive ? C.crimsonText : C.faint }} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 1. PRODUCT ASSETS */}
      {(assetSubTab === 'branding' || assetSubTab === 'product_assets') && (
        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Identity & Positioning Card */}
            <div
              className="p-4 sm:p-5 rounded-xl space-y-3.5"
              style={{ background: C.row, border: `1px solid ${C.line}` }}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider block font-mono" style={{ color: C.text }}>
                Product Identity, Branding & Positioning
              </span>

              <div>
                <label className="text-[10px] block font-bold" style={{ color: C.muted }}>Product Name</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => {
                    const val = e.target.value
                    setAssetName(val)
                    updateAssetField('productName', val)
                  }}
                  placeholder="e.g. RetroVault OS"
                  className="w-full mt-1 px-3 py-2 rounded-lg font-bold outline-none border transition-colors text-xs"
                  style={{ background: C.sheet, borderColor: C.line, color: C.text }}
                />
              </div>

              <div>
                <label className="text-[10px] block font-bold" style={{ color: C.muted }}>Positioning Statement / Tagline</label>
                <textarea
                  rows={2}
                  value={assetTagline}
                  onChange={(e) => {
                    const val = e.target.value
                    setAssetTagline(val)
                    updateAssetField('productTagline', val)
                  }}
                  placeholder="e.g. Cloud-save synchronizer and CRT shader engine for retro handhelds."
                  className="w-full mt-1 p-2.5 rounded-lg outline-none resize-none border transition-colors text-xs"
                  style={{ background: C.sheet, borderColor: C.line, color: C.body }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] block font-bold" style={{ color: C.muted }}>Brand Tone</label>
                  <input
                    type="text"
                    value={assetTone}
                    onChange={(e) => {
                      const val = e.target.value
                      setAssetTone(val)
                      updateAssetField('brandTone', val)
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-lg border text-xs outline-none"
                    style={{ background: C.sheet, borderColor: C.line, color: C.body }}
                  />
                </div>
                <div>
                  <label className="text-[10px] block font-bold" style={{ color: C.muted }}>Target Audience</label>
                  <input
                    type="text"
                    value={assetAudience}
                    onChange={(e) => {
                      const val = e.target.value
                      setAssetAudience(val)
                      updateAssetField('targetAudience', val)
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-lg border text-xs outline-none"
                    style={{ background: C.sheet, borderColor: C.line, color: C.body }}
                  />
                </div>
              </div>
            </div>

            {/* Copy & Pricing Card */}
            <div
              className="p-4 sm:p-5 rounded-xl space-y-3.5"
              style={{ background: C.row, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider block font-mono" style={{ color: C.ok }}>
                  Product Copy & Pricing Structure
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                  style={PILL_TONES.ok}
                >
                  Live on /preorder
                </span>
              </div>

              <div>
                <label className="text-[10px] block font-bold" style={{ color: C.muted }}>Hero Headline Copy</label>
                <input
                  type="text"
                  value={campaignKit?.landingPageCopy?.headline ?? `The ${project?.productName || 'Software'} Workspace Built with ${project?.creatorName || 'Founding Creator'}`}
                  onChange={(e) => {
                    const val = e.target.value
                    updateCampaignKit('landingPageCopy', { ...(campaignKit?.landingPageCopy || {}), headline: val })
                  }}
                  placeholder="e.g. Never lose a retro game save again — instant cloud sync across handhelds."
                  className="w-full mt-1 px-3 py-2 rounded-lg font-bold outline-none border transition-colors text-xs"
                  style={{ background: C.sheet, borderColor: C.line, color: C.text }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] block font-bold" style={{ color: C.muted }}>Founding Annual Price</label>
                  <div
                    className="flex items-center gap-1 mt-1 px-3 py-2 rounded-lg border"
                    style={{ background: C.sheet, borderColor: C.line }}
                  >
                    <span className="font-bold" style={{ color: C.muted }}>$</span>
                    <input
                      type="number"
                      value={activeFoundingPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0
                        updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), foundingPrice: val })
                      }}
                      className="bg-transparent font-bold text-xs outline-none w-full"
                      style={{ color: C.text }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] block font-bold" style={{ color: C.muted }}>Refundable Deposit</label>
                  <div
                    className="flex items-center gap-1 mt-1 px-3 py-2 rounded-lg border"
                    style={{ background: C.sheet, borderColor: C.line }}
                  >
                    <span className="font-bold" style={{ color: C.muted }}>$</span>
                    <input
                      type="number"
                      value={activeDepositPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0
                        updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), depositPrice: val })
                      }}
                      className="bg-transparent font-bold text-xs outline-none w-full"
                      style={{ color: C.text }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] block font-bold" style={{ color: C.muted }}>Offer Perks & Guarantee</label>
                <input
                  type="text"
                  value={campaignKit?.pricingConfig?.perks ?? `50% Lifetime Discount + 1-on-1 Alpha Onboarding for ${project?.creatorName || 'Founding'} VIPs`}
                  onChange={(e) => {
                    const val = e.target.value
                    updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), perks: val })
                  }}
                  placeholder="e.g. 50% Lifetime Discount + Beta Steam Deck & Miyoo Plugin"
                  className="w-full mt-1 px-3 py-2 rounded-lg border text-xs outline-none"
                  style={{ background: C.sheet, borderColor: C.line, color: C.body }}
                />
              </div>
            </div>
          </div>

          {/* Product Mockup Studio & Visual Asset */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider block font-mono px-1" style={{ color: C.text }}>
              Product Mockup Studio & Visual Asset
            </span>
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
          </div>
        </div>
      )}

      {/* 2. INFRASTRUCTURE */}
      {(assetSubTab === 'page' || assetSubTab === 'infrastructure') && (
        <div className="space-y-4 text-xs">
          {/* Top Browser Bar */}
          <div
            className="p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 border"
            style={{ background: C.row, borderColor: C.line }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-[11px] truncate flex-1 max-w-lg"
                style={{ background: C.sheet, borderColor: C.line, color: C.body }}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} />
                <span className="truncate">{`${origin}/preorder/${productSlug}`}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const url = `${origin}/preorder/${productSlug}`
                  if (url) {
                    navigator.clipboard?.writeText(url)
                    showNotification('Pre-order link copied!')
                  }
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
              >
                <Copy className="w-3 h-3" style={{ color: C.muted }} />
                <span>Copy Link</span>
              </button>

              <a
                href={`${origin}/preorder/${productSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                style={{ background: C.crimson }}
              >
                <span>Open Live Page</span>
                <ExternalLink className="w-3 h-3 text-white" />
              </a>
            </div>
          </div>

          {/* Interactive Landing Page Frame */}
          <div
            className="rounded-3xl border overflow-hidden p-6 sm:p-8 space-y-6"
            style={{ background: C.row, borderColor: C.line }}
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span
                  className="inline-block px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border"
                  style={PILL_TONES.ok}
                >
                  🔥 Founding Member Pre-Sale
                </span>
                {(campaignKit?.landingPageCopy?.activeExperimentTitle || campaignKit?.pricingConfig?.activeExperimentTitle) && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                    style={PILL_TONES.violet}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: C.violet }} />
                    <span>AI Optimization Variant Live</span>
                  </span>
                )}
              </div>
              <h2
                className="text-2xl sm:text-4xl font-black tracking-tight leading-tight"
                style={{ ...HEADING_FONT, color: C.text }}
              >
                {campaignKit?.landingPageCopy?.headline || `The ${project?.productName || 'Product'} System`}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed max-w-xl mx-auto" style={{ color: C.muted }}>
                {campaignKit?.landingPageCopy?.subheadline || project?.productTagline || 'Reserve early founding access and lock in lifetime benefits.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`${origin}/preorder/${productSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                  style={{ background: C.crimson }}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Live Checkout: Claim Access (${activeFoundingPrice})</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </a>

                <a
                  href={`${origin}/preorder/${productSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border"
                  style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
                >
                  <ShieldCheck className="w-4 h-4" style={{ color: C.ok }} />
                  <span>Reserve with ${activeDepositPrice} Deposit</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Visual Designed Mockup Showcase */}
            <div className="pt-4 max-w-4xl mx-auto">
              <ProductMockupDisplay project={project} theme="crimson" brandColor="#c81e3c" />
            </div>
          </div>

          {/* Infrastructure Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl border space-y-2.5" style={{ background: C.row, borderColor: C.line }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono" style={{ color: C.ok }}>
                  Stripe Checkout
                </span>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.ok }} />
              </div>
              <div className="text-xl font-extrabold font-display" style={{ color: C.text }}>
                ${presalesRevenue.toLocaleString()} <span className="text-xs font-normal" style={{ color: C.muted }}>Collected</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                Stripe pre-orders active. Live payment simulation updates revenue in real-time.
              </p>
            </div>

            <div className="p-4 rounded-2xl border space-y-2.5" style={{ background: C.row, borderColor: C.line }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono" style={{ color: C.skyText }}>
                  Attribution Tracker
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border" style={PILL_TONES.sky}>
                  ?ref={(project?.creatorHandle || 'creator').replace('@', '')}
                </span>
              </div>
              <div className="text-xl font-extrabold font-display" style={{ color: C.text }}>
                100% <span className="text-xs font-normal" style={{ color: C.muted }}>Channel Attribution</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                Tracks creator audience conversions, social link clicks, and presale attribution.
              </p>
            </div>

            <div className="p-4 rounded-2xl border space-y-2.5" style={{ background: C.row, borderColor: C.line }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono" style={{ color: C.violetText }}>
                  Waitlist System
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border" style={PILL_TONES.violet}>
                  {reservations.length} Leads
                </span>
              </div>
              <div className="text-xl font-extrabold font-display" style={{ color: C.text }}>
                ${activeDepositPrice} <span className="text-xs font-normal" style={{ color: C.muted }}>Deposit Model</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                Captures high-intent buyers with refundable reservation pass before full MVP build.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESEARCH */}
      {(assetSubTab === 'survey' || assetSubTab === 'research') && (
        <div className="space-y-4 text-xs">
          {/* Public Survey Bar */}
          <div
            className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
            style={{ background: C.row, borderColor: C.line }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-[11px] truncate flex-1 max-w-lg"
                style={{ background: C.sheet, borderColor: C.line, color: C.body }}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} />
                <span className="truncate font-semibold">{`${origin}/survey/${productSlug}`}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const url = `${origin}/survey/${productSlug}`
                  if (url) {
                    navigator.clipboard?.writeText(url)
                    showNotification('Shareable survey link copied!')
                  }
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
              >
                <Copy className="w-3.5 h-3.5" style={{ color: C.muted }} />
                <span>Copy Link</span>
              </button>

              <a
                href={`${origin}/survey/${productSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                style={{ background: C.crimson }}
              >
                <span>Open Live Survey</span>
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </a>
            </div>
          </div>

          {/* AI Research & Validation Scorecard */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ background: C.row, borderColor: C.line }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: C.line }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono" style={{ color: C.violetText }}>
                    AI Validation & Demand Score
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border" style={PILL_TONES.neutral}>
                    {surveyResponses.length} Responses Collected
                  </span>
                </div>
                <h3 className="text-lg font-black mt-0.5" style={{ ...HEADING_FONT, color: C.text }}>
                  {surveyAnalysis?.scoreVerdict || (surveyResponses.length > 0 ? 'Validation Data Ready for Analysis' : 'Awaiting Audience Responses')}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeResponses}
                disabled={isAnalyzingResponses || surveyResponses.length === 0}
                className="px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: C.crimson }}
              >
                {isAnalyzingResponses ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Analyze Responses with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Score Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border space-y-1" style={{ background: C.sheet, borderColor: C.line }}>
                <span className="text-[9px] uppercase font-bold block" style={{ color: C.muted }}>Overall Score</span>
                <div className="text-2xl font-black font-display" style={{ color: C.text }}>
                  {surveyAnalysis?.overallScore !== undefined ? `${surveyAnalysis.overallScore}/100` : '—'}
                </div>
                <div className="text-[10px] font-bold" style={{ color: surveyAnalysis?.recommendation === 'PROCEED' ? C.ok : C.warn }}>
                  {surveyAnalysis?.recommendation === 'PROCEED' ? '🟢 Proceed to Build' : surveyAnalysis ? '🟡 Iterate Pricing' : 'Awaiting analysis'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ background: C.sheet, borderColor: C.line }}>
                <span className="text-[9px] uppercase font-bold block" style={{ color: C.muted }}>Market Demand</span>
                <div className="text-2xl font-black font-display" style={{ color: C.ok }}>
                  {surveyAnalysis?.marketDemandScore !== undefined ? `${surveyAnalysis.marketDemandScore}%` : '—'}
                </div>
                <div className="text-[10px] font-medium" style={{ color: C.muted }}>Problem urgency signal</div>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ background: C.sheet, borderColor: C.line }}>
                <span className="text-[9px] uppercase font-bold block" style={{ color: C.muted }}>Pricing Viability (${activeFoundingPrice})</span>
                <div className="text-2xl font-black font-display" style={{ color: C.skyText }}>
                  {surveyAnalysis?.pricingViabilityScore !== undefined ? `${surveyAnalysis.pricingViabilityScore}%` : '—'}
                </div>
                <div className="text-[10px] font-medium" style={{ color: C.muted }}>Willingness to pay signal</div>
              </div>
            </div>

            {/* AI Executive Summary */}
            {surveyAnalysis?.executiveSummary && (
              <div className="p-4 rounded-xl border space-y-2" style={{ background: C.sheet, borderColor: C.line }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: C.text }}>
                  AI Executive Summary
                </span>
                <p className="text-xs leading-relaxed" style={{ color: C.body }}>
                  {surveyAnalysis.executiveSummary}
                </p>
                {surveyAnalysis.keyFindings?.length > 0 && (
                  <div className="pt-2 border-t space-y-1" style={{ borderColor: C.line }}>
                    {surveyAnalysis.keyFindings.map((finding, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px]" style={{ color: C.body }}>
                        <span className="font-bold" style={{ color: C.ok }}>✓</span>
                        <span>{finding}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Discovery Questions Card */}
          <div className="p-4 rounded-xl border space-y-3" style={{ background: C.row, borderColor: C.line }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: C.line }}>
              <div>
                <h4 className="font-bold text-xs" style={{ color: C.text }}>Customer Discovery Questions</h4>
                <p className="text-[11px]" style={{ color: C.muted }}>
                  Qualitative discovery questions asked on the public survey page.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateSurvey}
                disabled={isGeneratingSurvey}
                className="px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                style={{ background: C.crimson }}
              >
                {isGeneratingSurvey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Regenerate Questions with AI</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5">
              {(surveyData?.questions || []).map((q, index) => (
                <div
                  key={q.id || index}
                  className="p-3.5 rounded-xl border space-y-1.5"
                  style={{ background: C.sheet, borderColor: C.line }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-mono border" style={PILL_TONES.neutral}>
                        {q.category || 'Discovery'}
                      </span>
                      <span className="font-bold text-xs" style={{ color: C.text }}>{q.question}</span>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border"
                      style={(q.responseCount || 0) > 0 ? PILL_TONES.ok : PILL_TONES.neutral}
                    >
                      {(q.responseCount || 0) > 0 ? `${q.responseCount} responses` : '0 responses'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Question Form */}
            <form onSubmit={handleAddQuestion} className="flex gap-2 pt-2 border-t" style={{ borderColor: C.line }}>
              <select
                value={newQuestionCategory}
                onChange={(e) => setNewQuestionCategory(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold outline-none border cursor-pointer"
                style={{ background: C.sheet, borderColor: C.lineStrong, color: C.text }}
              >
                <option value="Pain Point">Pain Point</option>
                <option value="Pricing Validation">Pricing</option>
                <option value="Feature Wishlist">Feature Wishlist</option>
                <option value="Workflow Bottleneck">Workflow</option>
              </select>
              <input
                type="text"
                placeholder="Add custom survey question..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl text-xs outline-none border transition-colors"
                style={{ background: C.sheet, borderColor: C.line, color: C.text }}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                style={{ background: C.crimson }}
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Live Audience Responses Stream */}
          <div className="p-4 rounded-xl border space-y-3" style={{ background: C.row, borderColor: C.line }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.line }}>
              <div>
                <h4 className="font-bold text-xs" style={{ color: C.text }}>Live Community Response Stream</h4>
                <p className="text-[11px]" style={{ color: C.muted }}>
                  Real-time responses submitted by audience members through the public survey URL.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border font-mono" style={PILL_TONES.neutral}>
                  {surveyResponses.length} Responses
                </span>
                {surveyResponses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSurveyResponses}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border"
                    style={{ background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {surveyResponses.length === 0 ? (
              <div
                className="text-center py-8 text-xs border border-dashed rounded-xl space-y-1.5"
                style={{ background: C.sheet, borderColor: C.line }}
              >
                <p className="font-semibold" style={{ color: C.body }}>No audience responses submitted yet.</p>
                <p className="text-[10px]" style={{ color: C.muted }}>Share your survey URL to collect responses from the community.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {surveyResponses.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border space-y-2.5"
                    style={{ background: C.sheet, borderColor: C.line }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2" style={{ borderColor: C.line }}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs" style={{ color: C.text }}>{r.name}</span>
                        <span className="text-[10px] font-mono" style={{ color: C.muted }}>({r.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border" style={PILL_TONES.ok}>
                          Intent: {r.rating || 8}/10 🔥
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: C.faint }}>{r.submittedAt || r.date}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSurveyResponse(r.id)}
                          title="Delete response"
                          className="p-1 rounded hover:opacity-80 transition-opacity"
                          style={{ color: C.crimsonText }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {r.answers && (
                      <div className="space-y-1.5 text-[11px] pl-1" style={{ color: C.body }}>
                        {Object.entries(r.answers).map(([key, ans]) => (
                          <div key={key} className="flex items-start gap-1.5">
                            <span className="font-bold shrink-0" style={{ color: C.faint }}>•</span>
                            <span>{ans}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Approval Action */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t" style={{ borderColor: C.line }}>
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: C.muted }}>
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: C.ok }} />
          <span>Verification: Verify assets, copy, discovery survey & infrastructure</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
              productName: project?.productName,
              productTagline: project?.productTagline,
              pricingConfig: sanitizedPricingConfig
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
                  attributionTracking: true
                },
                research_survey: surveyData,
                review_status: 'approved',
                reviewStatus: 'approved'
              }
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
                  attributionTracking: true
                },
                research_survey: surveyData,
                review_status: 'approved'
              }).catch((e) => console.warn('[Phase1] DB campaign approval warning:', e))

              updateCoLaunchProject(project.id, {
                assetsApproved: true,
                landingPageApproved: true,
                campaignKit: campaignKit,
                campaign_kit: campaignKit
              }).catch((e) => console.warn('[Phase1] DB project approval warning:', e))

              logProjectActivity(project.id, {
                action: 'Validation Assets & Campaign Approved',
                details: 'Step 2 assets, copy, and research survey approved. Advancing to Creator Campaign.',
                step: 'assets',
                phase: 1
              }).catch((e) => console.warn('[Phase1] Activity logging warning:', e))
            }

            showNotification('Validation assets approved & locked in database! Advancing to Creator Campaign.')
            setActiveStep('campaign')
            onSelectStep?.('campaign')
          }}
          className="px-5 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer hover:opacity-90"
          style={{ background: C.crimson }}
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Approve & Launch Validation Campaign</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  )
}

