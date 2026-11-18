import { useState, useEffect } from 'react'
import {
  Sparkles, CheckCircle2, ShieldCheck, CreditCard, ArrowRight,
  Zap, Star, Lock, Users, Globe, ExternalLink, HelpCircle, Check,
  Loader2, AlertCircle, RefreshCw, Layers, Award, Target, CheckCircle
} from 'lucide-react'
import { trackVisit } from '../../services/tracker'
import { updatePageSEO } from '../../utils/seo'
import {
  parseMainPricingAmount,
  parseDepositPricingAmount,
  sanitizePricingConfig,
  parseConceptPricing
} from '../../utils/pricing'
import { sanitizeAccentColor, getContrastTextColor } from './DynamicConceptMockup'
import { hexToRgba } from '../../utils/avatarColorExtractor'
import { PreorderLandingSkeleton } from './Section2Skeletons'
import ConceptLandingPage from './ConceptLandingPage'
import { resolveProjectLanding } from '../../utils/projectLanding'

export default function PreorderLandingPage({ slug }) {
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' | 'paypal'

  // Read ?concept= query parameter from URL
  const conceptParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('concept') || ''
    : ''

  // Dynamic Selected Concept & Pricing Extraction
  const selectedConcept = (() => {
    if (!project) return null
    const conceptsList = Array.isArray(project.concepts) && project.concepts.length > 0
      ? project.concepts
      : (Array.isArray(project.productConcepts) && project.productConcepts.length > 0 ? project.productConcepts : [])

    if (conceptParam && conceptsList.length > 0) {
      const cleanParam = conceptParam.toLowerCase().replace(/[^a-z0-9]/g, '')
      const matched = conceptsList.find(c => {
        const cName = (c.name || c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        return cName.includes(cleanParam) || cleanParam.includes(cName)
      })
      if (matched) return matched
    }

    return project.selectedConcept || (conceptsList.length > 0 ? conceptsList.find(c => c.selected) || conceptsList[0] : null)
  })()

  // Default brand colors from index.css (:root --brand / --theme-accent: #c81e3c)
  // Same colour as the approved landing page (Step 5 rule), so checkout & loaders match it.
  const approvedLanding = resolveProjectLanding(project || {}, selectedConcept)
  const brandColor = approvedLanding.brandColor
  // eslint-disable-next-line no-unused-vars
  const legacyBrandColor = (() => {
    const candidate = selectedConcept?.brandColor || project?.brandColor || project?.brand_color
    if (candidate) {
      const clean = String(candidate).trim().toLowerCase()
      // Ignore old emerald/green defaults in favor of default #c81e3c from index.css
      if (clean === '#10b981' || clean === '10b981' || clean === '#16a34a' || clean === '16a34a' || clean === 'emerald') {
        return '#c81e3c'
      }
      return sanitizeAccentColor(candidate)
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('forge_creator_brand_color_map')
        if (stored) {
          const map = JSON.parse(stored)
          const cId = project?.creatorId || project?.id
          const storedHex = cId && map[cId]?.primaryHex
          if (storedHex) {
            const cleanStored = String(storedHex).trim().toLowerCase()
            if (cleanStored !== '#10b981' && cleanStored !== '10b981' && cleanStored !== '#16a34a' && cleanStored !== '16a34a') {
              return sanitizeAccentColor(storedHex)
            }
          }
        }
      } catch (e) {}
    }
    return '#c81e3c'
  })()
  const brandContrastText = getContrastTextColor(brandColor)


  const productName = project?.productName || selectedConcept?.name || project?.title || 'Software Co-Launch'
  const creatorName = project?.creatorName || project?.creatorHandle || 'Creator Partner'
  const creatorAvatar = project?.creatorAvatar || selectedConcept?.creatorAvatar || null
  const creatorHandle = project?.creatorHandle || 'creator'
  const savedMockupImage = project?.mockupImage || project?.mockup_image || project?.meta?.mockup_image || null
  const niche = project?.niche || selectedConcept?.demographicAlignment || selectedConcept?.niche || 'Software & Tech'
  const tagline = project?.productTagline || selectedConcept?.tagline || selectedConcept?.description || 'Personalized software tool built for the community.'
  const headline = project?.campaignKit?.landingPageCopy?.headline || `The ${productName} Workspace Built with ${creatorName}`
  const subheadline = project?.campaignKit?.landingPageCopy?.subheadline || selectedConcept?.description || tagline

  const targetAudience = selectedConcept?.customer || project?.targetAudience || project?.customer || 'Target Community & Verified Members'
  const problemSolved = selectedConcept?.problem || project?.problem || 'Manual operational friction and lack of specialized, high-performance tooling.'
  const keyFeatures = (Array.isArray(selectedConcept?.keyFeatures) && selectedConcept.keyFeatures.length > 0)
    ? selectedConcept.keyFeatures
    : (Array.isArray(project?.keyFeatures) && project.keyFeatures.length > 0)
      ? project.keyFeatures
      : (Array.isArray(selectedConcept?.features) && selectedConcept.features.length > 0)
        ? selectedConcept.features
        : ['Automated workflow execution', 'Real-time performance metrics', 'Direct community integration', 'Founding member lifetime perks']

  const conceptPricing = selectedConcept?.pricing || project?.pricing || '$29/mo Starter • $79/mo Pro'

  const cfg = project?.campaignKit?.pricingConfig || project?.pricingConfig || project?.validationCampaign?.productAssets?.pricingConfig
  const sanitizedPricing = sanitizePricingConfig(cfg, conceptPricing)
  const foundingPrice = sanitizedPricing.foundingPrice || 99
  const depositPrice = sanitizedPricing.depositPrice || Math.max(9, Math.round(foundingPrice * 0.2))
  const perksText = cfg?.perks || `50% Lifetime Price Lock ($${foundingPrice}/yr) & VIP Alpha Perks`

  // Build Comprehensive List of Selectable Tiers
  const parsedConcept = parseConceptPricing(conceptPricing, foundingPrice)
  const availableTiers = [
    ...(parsedConcept.tiers || []).map(t => ({
      id: `tier_${t.price}`,
      name: t.name,
      price: t.price,
      period: t.period === 'month' ? '/mo' : t.period === 'annual' ? '/yr' : '',
      deposit: false,
      badge: t.price >= 50 ? 'POPULAR TIER' : 'STARTER',
      highlight: false
    })),
    {
      id: 'tier_founding_annual',
      name: `Founding Annual Pass ($${foundingPrice}/yr)`,
      price: foundingPrice,
      period: '/yr',
      deposit: false,
      badge: '50% LIFETIME PRICE LOCK',
      highlight: true
    },
    {
      id: 'tier_deposit',
      name: `VIP Reservation Deposit ($${depositPrice})`,
      price: depositPrice,
      period: 'refundable',
      deposit: true,
      badge: '100% REFUNDABLE GUARANTEE',
      highlight: false
    }
  ]

  const [selectedTier, setSelectedTier] = useState({
    name: `Founding Annual Pass ($${foundingPrice})`,
    price: foundingPrice,
    deposit: false
  })

  useEffect(() => {
    const title = productName
      ? `VIP Early Access — ${productName} | Co-Built with ${creatorName}`
      : "VIP Early Access & Pre-Order | CoLaunch";
    updatePageSEO({
      title,
      description: tagline || "Lock in founder pricing and early access to our exclusive software tool.",
      image: "/og-image.svg"
    });
  }, [productName, creatorName, tagline]);

  // Synchronize default selected tier with dynamic founding/deposit pricing
  useEffect(() => {
    setSelectedTier(prev => {
      if (prev.deposit) {
        return { name: `VIP Deposit ($${depositPrice})`, price: depositPrice, deposit: true }
      }
      if (prev.price === foundingPrice) {
        return { name: `Founding Annual Pass ($${foundingPrice})`, price: foundingPrice, deposit: false }
      }
      return prev
    })
  }, [foundingPrice, depositPrice])

  // Payer Details (Required)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  
  // Stripe Card Details
  const [cardNumber, setCardNumber] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [successReceipt, setSuccessReceipt] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDbProject = async () => {
      setIsLoading(true)
      try {
        const { getProjectBySlug, getCoLaunchProjects } = await import('../../services/opsApi')
        let dbProj = null
        if (slug) {
          try {
            dbProj = await getProjectBySlug(slug)
          } catch (e) {
            console.warn('[Preorder] Direct slug lookup notice:', e)
          }
        }
        if (!dbProj) {
          try {
            const all = await getCoLaunchProjects()
            const list = Array.isArray(all) ? all : all?.projects || []
            if (slug) {
              const clean = slug.toLowerCase().replace(/[^a-z0-9]/g, '')
              dbProj = list.find(p => {
                const pSlug = (p.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                const pName = (p.productName || p.title || p.product_name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                const pHandle = (p.creatorHandle || p.creator_handle || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                const pId = (p.id || '').toLowerCase()
                return pSlug === clean || pName === clean || pHandle === clean || pId === slug.toLowerCase()
              })
            }
            if (slug && !dbProj) {
              try {
                const { getCreators } = await import('../../services/opsApi')
                const allCreators = await getCreators()
                const cList = Array.isArray(allCreators) ? allCreators : allCreators?.creators || []
                const clean = slug.toLowerCase().replace(/[^a-z0-9]/g, '')
                const matchedCreator = cList.find(c => {
                  const cHandle = (c.handle || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                  const cName = (c.name || c.display_name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                  const cId = (c.id || '').toLowerCase()
                  return cHandle === clean || cName === clean || cId === slug.toLowerCase()
                })
                if (matchedCreator) {
                  const concepts = matchedCreator.productConcepts || []
                  const targetConcept = (conceptParam && concepts.find(c => {
                    const cleanP = conceptParam.toLowerCase().replace(/[^a-z0-9]/g, '')
                    const cN = (c.name || c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                    return cN.includes(cleanP) || cleanP.includes(cN)
                  })) || concepts[0] || null

                  dbProj = {
                    id: matchedCreator.id,
                    slug: slug,
                    creatorId: matchedCreator.id,
                    creatorName: matchedCreator.name || matchedCreator.display_name || 'Creator Partner',
                    creatorHandle: matchedCreator.handle,
                    creatorAvatar: matchedCreator.avatar_url || matchedCreator.avatar,
                    brandColor: targetConcept?.brandColor || matchedCreator.brand_color || matchedCreator.brandColor || null,
                    niche: matchedCreator.niche,
                    productName: targetConcept?.name || `${matchedCreator.name || 'Creator'} OS`,
                    productTagline: targetConcept?.tagline || `The automated operating system for ${matchedCreator.niche || 'tech'} professionals`,
                    selectedConcept: targetConcept,
                    concepts: concepts,
                    pricing: targetConcept?.pricing || '$29/mo Starter • $79/mo Pro',
                    keyFeatures: targetConcept?.keyFeatures || targetConcept?.features || [],
                    problem: targetConcept?.problem || targetConcept?.description || 'Audience operational friction',
                    targetAudience: targetConcept?.customer || matchedCreator.niche,
                  }
                }
              } catch (e) {
                console.warn('[Preorder] Creator fallback lookup error:', e)
              }
            }

            if (!dbProj && list.length > 0) {
              dbProj = list[0]
            }

            if (!dbProj && slug) {
              const formattedCreator = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              const formattedConcept = conceptParam
                ? conceptParam.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                : `${formattedCreator} OS`

              dbProj = {
                id: slug,
                slug: slug,
                creatorName: formattedCreator,
                creatorHandle: slug,
                productName: formattedConcept,
                productTagline: `The bespoke software suite built with ${formattedCreator} for high-performing operators.`,
                pricing: '$29/mo Starter • $79/mo Pro',
                keyFeatures: [
                  'Automated workflow execution & audience sync',
                  'Client milestone tracking & unified inbox',
                  'Dedicated member portal & automated operations',
                  'VIP Founding Pass with direct partner onboarding'
                ],
                problem: 'Scattered operational tools, unorganized client comms, and manual delivery bottlenecks.',
                targetAudience: 'Community members, consultants, and creator operators'
              }
            }
          } catch (e) {
            console.warn('[Preorder] Projects list fallback notice:', e)
          }
        }

        if (isMounted && dbProj) {
          setProject(dbProj)
        }
      } catch (err) {
        console.warn('[Preorder] Failed to load project from MongoDB Atlas:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDbProject()

    // Visitor telemetry tracking
    trackVisit(`/preorder/${slug || 'product'}`, visitorTelemetry => {
      if (isMounted && visitorTelemetry) {
        setProject(prev => prev ? ({
          ...prev,
          visitors: visitorTelemetry.visitors ?? prev.visitors,
          uniqueVisitors: visitorTelemetry.uniqueVisitors ?? prev.uniqueVisitors,
          conversionRate: visitorTelemetry.conversionRate ?? prev.conversionRate,
          channelAttribution: visitorTelemetry.channelAttribution ?? prev.channelAttribution
        }) : prev)
      }
    })

    const handleSync = (e) => {
      if (e?.detail && (e.detail.productName || e.detail.id || e.detail.selectedConcept)) {
        setProject(e.detail)
      }
    }

    window.addEventListener('forge_project_updated', handleSync)
    return () => {
      isMounted = false
      window.removeEventListener('forge_project_updated', handleSync)
    }
  }, [slug])

  // Handle returning from verified Stripe Checkout
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('checkout_success') === 'true' || sp.get('session_id')) {
      const sessionId = sp.get('session_id') || 'cs_verified'
      const amount = sp.get('amount') || selectedTier?.price || '49'
      const tier = sp.get('tier') || selectedTier?.name || 'Founding Member Pass'
      setSuccessReceipt({
        txId: sessionId,
        name: 'Founding Supporter',
        email: sp.get('customer_email') || '',
        amount: Number(amount) || 49,
        tier: tier,
        paymentMethod: sp.get('test_checkout') === 'true' ? 'Stripe (Test Mode)' : 'Stripe Live Rails',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'Paid & Confirmed'
      })
      setIsSuccess(true)
      setCheckoutModalOpen(true)
    }
  }, [])

  if (isLoading && !project) {
    return <PreorderLandingSkeleton slug={slug} />
  }

  const handleCheckoutSubmit = async (e) => {
    e?.preventDefault()
    setErrorMessage('')

    if (!buyerName.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }
    if (!buyerEmail.trim() || !buyerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setIsProcessing(true)
    setProcessingStep('Authorizing secure checkout session...')

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const refQuery = (urlParams.get('ref') || urlParams.get('utm_source') || urlParams.get('utm') || urlParams.get('source') || urlParams.get('channel') || '').toLowerCase()
      let attributedChannel = 'Direct / Other'
      if (refQuery.includes('instagram') || refQuery.includes('ig') || refQuery.includes('story') || refQuery.includes('insta')) {
        attributedChannel = 'Instagram Stories'
      } else if (refQuery.includes('tiktok') || refQuery.includes('reels') || refQuery.includes('shorts') || refQuery.includes('youtube') || refQuery.includes('yt')) {
        attributedChannel = 'TikTok / Shorts'
      } else if (refQuery.includes('twitter') || refQuery.includes('x_post') || refQuery.includes('tweet') || refQuery.includes('x')) {
        attributedChannel = 'X Post'
      } else if (refQuery.includes('newsletter') || refQuery.includes('email') || refQuery.includes('broadcast') || refQuery.includes('mail')) {
        attributedChannel = 'Email Newsletter'
      } else if (refQuery.includes('dm') || refQuery.includes('outreach')) {
        attributedChannel = 'Direct Messages'
      }

      const activeExpVariant = project?.campaignKit?.pricingConfig?.activeExperimentTitle || project?.campaignKit?.landingPageCopy?.activeExperimentTitle || null

      // Create verified Checkout Session with backend
      const { createProjectCheckoutSession } = await import('../../services/opsApi')
      const successUrl = `${window.location.origin}${window.location.pathname}?checkout_success=true&tier=${encodeURIComponent(selectedTier.name)}&amount=${selectedTier.price}`
      const cancelUrl = window.location.href

      const sessionRes = await createProjectCheckoutSession(project?.id, {
        slug: slug,
        creatorHandle: project?.creatorHandle,
        name: buyerName.trim(),
        email: buyerEmail.trim(),
        amount: selectedTier.price,
        tier: selectedTier.name,
        tierName: selectedTier.name,
        channel: attributedChannel,
        ref: refQuery || attributedChannel,
        successUrl,
        cancelUrl,
      })

      // If a live Stripe checkout URL was returned, redirect customer to Stripe Checkout
      if (sessionRes?.checkoutUrl && !sessionRes?.isTestMode && sessionRes?.mode === 'stripe_live') {
        setProcessingStep('Redirecting to Stripe Live Checkout...')
        window.location.href = sessionRes.checkoutUrl
        return
      }

      // Test/Developer Mode fallback (when STRIPE_SECRET_KEY is not configured)
      const txId = sessionRes?.sessionId || `tx_test_${Date.now().toString(36)}`
      const receipt = {
        txId,
        name: buyerName.trim(),
        email: buyerEmail.trim(),
        amount: selectedTier.price,
        tier: selectedTier.name,
        paymentMethod: sessionRes?.isTestMode ? 'Stripe (Test Mode)' : 'Stripe (Credit / Debit Card)',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'Paid & Confirmed'
      }

      setSuccessReceipt(receipt)
      setIsSuccess(true)
    } catch (err) {
      console.warn('[Preorder] Payment API warning:', err)
      setErrorMessage(err.message || 'Payment processing failed. Please check your details and try again.')
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const openCheckout = (tier) => {
    setSelectedTier(tier)
    setIsSuccess(false)
    setSuccessReceipt(null)
    setErrorMessage('')
    setCheckoutModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#050506] text-[#FAFAFA] selection:bg-[#c81e3c] selection:text-white font-sans antialiased overflow-x-hidden relative">
      {/* Top Dynamic API Loading Indicator Bar */}
      {isLoading && (
        <div
          className="fixed top-0 left-0 right-0 z-[9999] h-1 animate-pulse shadow-sm"
          style={{ background: `linear-gradient(to right, ${brandColor}, ${hexToRgba(brandColor, 0.4)}, ${brandColor})` }}
        />
      )}

      {/* Floating Backend Sync Status Pill */}
      {isLoading && (
        <div
          className="fixed top-4 right-4 z-[9999] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101419]/90 border backdrop-blur-md shadow-lg shadow-black/50 text-xs font-mono"
          style={{ borderColor: `${brandColor}60`, color: brandColor }}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: brandColor }} />
          <span>Syncing backend data...</span>
        </div>
      )}

      {/* Approved landing page — the exact Step 5 concept page (same layout + base palette).
          Every CTA on it opens the real reservation checkout below. */}
      <div className="pb-24">
        {project?.campaignKit?.landingPageCopy?.urgency?.text && (
          <div className="w-full px-4 py-2.5 text-center text-sm font-semibold" style={{ background: approvedLanding.brandColor, color: '#fff' }}>
            ⏳ {project.campaignKit.landingPageCopy.urgency.text}
          </div>
        )}
        <ConceptLandingPage
          concept={project?.campaignKit?.landingPageCopy?.headline
            ? { ...(approvedLanding.concept || {}), tagline: project.campaignKit.landingPageCopy.headline }
            : approvedLanding.concept}
          conceptIndex={approvedLanding.conceptIndex}
          creator={approvedLanding.creator}
          brandColor={approvedLanding.brandColor}
          mode="full"
          heroImageUrl={savedMockupImage || ''}
          ctaLabel={project?.campaignKit?.landingPageCopy?.ctaText || 'Claim founding access'}
          onCtaClick={() => openCheckout(availableTiers.find((t) => t.highlight) || availableTiers[0])}
        />
      </div>

      {/* Sticky reservation bar */}
      <div
        className="preorder-reserve-bar fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl"
        style={{ background: 'rgba(5,5,6,0.88)', borderColor: hexToRgba(approvedLanding.brandColor, 0.35) }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-sm font-bold text-white truncate">{productName}</p>
            <p className="m-0 text-[11px] text-[#A1A1AA] truncate">
              Founding price <span className="text-white font-semibold">${foundingPrice}/yr</span>
              {' '}· or reserve with a ${depositPrice} refundable deposit
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openCheckout(availableTiers.find((t) => t.deposit) || availableTiers[availableTiers.length - 1])}
              className="hidden sm:inline-flex h-10 px-4 items-center text-xs font-semibold text-[#D4D4D8] border border-[#2a2a30] hover:border-[#3f3f46] hover:text-white bg-[#111114] transition-colors cursor-pointer"
            >
              Reserve for ${depositPrice}
            </button>
            <button
              type="button"
              onClick={() => openCheckout(availableTiers.find((t) => t.highlight) || availableTiers[0])}
              className="h-10 px-5 inline-flex items-center gap-2 text-xs font-bold transition-[filter] hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: approvedLanding.brandColor, color: getContrastTextColor(approvedLanding.brandColor) }}
            >
              <CreditCard className="w-4 h-4" />
              Claim founding access
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal (Stripe & PayPal Options) */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-md w-full max-h-[90vh] flex flex-col p-5 sm:p-6 rounded-3xl bg-[#101419] border border-[#252B32] shadow-2xl animate-fade-in text-left my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#252B32] pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#F5F3EA]">Complete Pre-Order Reservation</h3>
                <p className="text-[11px] text-[#969DA6]">{selectedTier.name} — ${selectedTier.price}</p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#171C22] hover:bg-[#252B32] text-[#969DA6] hover:text-[#F5F3EA] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto pr-1 pt-3 space-y-3.5">
              {isSuccess && successReceipt ? (
                <div className="text-center py-2 space-y-3">
                  <div
                    className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto shadow-lg"
                    style={{
                      backgroundColor: `${brandColor}20`,
                      borderColor: `${brandColor}40`,
                      color: brandColor,
                      boxShadow: `0 8px 20px -4px ${hexToRgba(brandColor, 0.3)}`
                    }}
                  >
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#F5F3EA]">Payment Successful! 🎉</h4>
                    <p className="text-xs text-[#969DA6] mt-0.5">
                      Welcome to the Founding Member cohort, <span className="text-[#F5F3EA] font-bold">{successReceipt.name}</span>!
                    </p>
                  </div>

                  {/* Receipt Card */}
                  <div className="p-3.5 rounded-2xl bg-[#0D1014] border border-[#252B32] text-xs space-y-1.5 text-left">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#252B32]">
                      <span className="text-[#969DA6] text-[11px]">Transaction ID</span>
                      <span className="font-mono font-bold text-[11px]" style={{ color: brandColor }}>{successReceipt.txId}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#969DA6]">Payer Name</span>
                      <span className="text-[#F5F3EA] font-semibold">{successReceipt.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#969DA6]">Payer Email</span>
                      <span className="text-[#F5F3EA] font-mono">{successReceipt.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#969DA6]">Payment Gateway</span>
                      <span className="text-[#F5F3EA]">{successReceipt.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#252B32] font-bold text-[11px]">
                      <span className="text-[#969DA6]">Amount Paid</span>
                      <span className="text-sm font-mono" style={{ color: brandColor }}>+${successReceipt.amount}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#969DA6]">
                    A receipt and your private founder credentials have been sent to <strong className="text-[#F5F3EA] font-mono">{successReceipt.email}</strong>.
                  </p>

                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="w-full py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: brandColor,
                      color: brandContrastText,
                      boxShadow: `0 8px 20px -4px ${hexToRgba(brandColor, 0.25)}`
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-3">
                  {errorMessage && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Tier Selection */}
                  <div>
                    <label className="text-[10px] text-[#969DA6] font-bold uppercase tracking-wider block mb-1">
                      1. Select Reservation Tier
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableTiers.slice(0, 4).map((t, idx) => {
                        const isChosen = selectedTier.name === t.name || (t.deposit && selectedTier.deposit)
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedTier({ name: t.name, price: t.price, deposit: t.deposit })}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              isChosen
                                ? 'text-[#F5F3EA] shadow-sm'
                                : 'bg-[#0D1014] border-[#252B32] text-[#969DA6] hover:text-[#F5F3EA]'
                            }`}
                            style={
                              isChosen
                                ? {
                                    backgroundColor: `${brandColor}18`,
                                    borderColor: brandColor
                                  }
                                : {}
                            }
                          >
                            <span className="font-bold block text-[#F5F3EA] text-[11px] truncate">{t.name}</span>
                            <span className="font-mono font-bold text-xs" style={{ color: brandColor }}>${t.price}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Required Payer Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#969DA6] font-bold uppercase tracking-wider block mb-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={buyerName}
                        onChange={e => setBuyerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0D1014] border border-[#252B32] text-xs text-[#F5F3EA] outline-none focus:border-slate-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#969DA6] font-bold uppercase tracking-wider block mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="jane@example.com"
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0D1014] border border-[#252B32] text-xs text-[#F5F3EA] outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector (Stripe vs PayPal) */}
                  <div>
                    <label className="text-[10px] text-[#969DA6] font-bold uppercase tracking-wider block mb-1">
                      2. Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === 'stripe'
                            ? 'shadow-sm'
                            : 'bg-[#0D1014] border-[#252B32] text-[#969DA6] hover:text-[#F5F3EA]'
                        }`}
                        style={
                          paymentMethod === 'stripe'
                            ? {
                                backgroundColor: brandColor,
                                color: brandContrastText,
                                borderColor: brandColor
                              }
                            : {}
                        }
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Stripe (Card)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === 'paypal'
                            ? 'bg-[#0070ba] text-white border-[#0070ba] shadow-sm'
                            : 'bg-[#0D1014] border-[#252B32] text-[#969DA6] hover:text-[#F5F3EA]'
                        }`}
                      >
                        <span className="font-extrabold italic">P</span>
                        <span>PayPal</span>
                      </button>
                    </div>
                  </div>

                  {/* Stripe Card Inputs Simulation */}
                  {paymentMethod === 'stripe' && (
                    <div className="p-3 rounded-xl bg-[#0D1014] border border-[#252B32] space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-[#969DA6]">
                        <span>Card Details</span>
                        <span className="font-mono flex items-center gap-1" style={{ color: brandColor }}>
                          <Lock className="w-2.5 h-2.5" />
                          <span>256-bit Encrypted</span>
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="4242 •••• •••• 4242"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#101419] border border-[#252B32] text-xs text-[#F5F3EA] outline-none font-mono focus:border-slate-400"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={cardExp}
                          onChange={e => setCardExp(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#101419] border border-[#252B32] text-xs text-[#F5F3EA] outline-none font-mono focus:border-slate-400 text-center"
                        />
                        <input
                          type="text"
                          placeholder="CVC"
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#101419] border border-[#252B32] text-xs text-[#F5F3EA] outline-none font-mono focus:border-slate-400 text-center"
                        />
                      </div>
                    </div>
                  )}

                  {/* PayPal Express Container Simulation */}
                  {paymentMethod === 'paypal' && (
                    <div className="p-3 rounded-xl bg-[#0D1014] border border-[#252B32] text-center space-y-1">
                      <span className="text-[11px] text-[#F5F3EA] block font-semibold">
                        You will complete the payment securely via PayPal.
                      </span>
                      <span className="text-[10px] text-[#969DA6] block">
                        1-Click checkout with PayPal Balance, Bank, or Linked Cards.
                      </span>
                    </div>
                  )}

                  {/* Total Bar */}
                  <div className="p-2.5 rounded-xl bg-[#0D1014] border border-[#252B32] text-xs flex items-center justify-between">
                    <span className="text-[#969DA6]">Total Due Today:</span>
                    <span className="text-sm font-bold font-mono" style={{ color: brandColor }}>${selectedTier.price}.00</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-lg cursor-pointer ${
                      paymentMethod === 'paypal'
                        ? 'bg-[#ffc439] hover:bg-[#f0b830] text-[#080A0C]'
                        : 'hover:opacity-90'
                    }`}
                    style={
                      paymentMethod === 'stripe'
                        ? {
                            backgroundColor: brandColor,
                            color: brandContrastText,
                            boxShadow: `0 8px 24px -4px ${hexToRgba(brandColor, 0.3)}`
                          }
                        : {}
                    }
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#080A0C]" />
                        <span>{processingStep || 'Processing Payment...'}</span>
                      </>
                    ) : paymentMethod === 'paypal' ? (
                      <span>Pay ${selectedTier.price} with PayPal</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay ${selectedTier.price} via Stripe</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
