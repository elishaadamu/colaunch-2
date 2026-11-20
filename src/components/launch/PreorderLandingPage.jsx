import { useState, useEffect } from 'react'
import {
  Sparkles, CheckCircle2, ShieldCheck, CreditCard, ArrowRight,
  Zap, Star, Lock, Users, Globe, ExternalLink, HelpCircle, Check,
  Loader2, AlertCircle, RefreshCw, Layers, Award, Target, CheckCircle, Mail, X
} from 'lucide-react'
import { trackVisit } from '../../services/tracker'
import { completeSimulatedPayment } from '../../services/opsApi'
import { digits, brandOf, fmtCard, fmtExp, cardProblem } from '../../utils/cards'
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
import { trackLaunch } from '../../utils/launchTracker'
import { resolveProjectLanding } from '../../utils/projectLanding'

export default function PreorderLandingPage({ slug }) {
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  // Simulated card payments: after the order is created the buyer enters a card here
  const [cardSession, setCardSession] = useState(null)
  const [card, setCard] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvc, setCardCvc] = useState('')

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
  const tagline = project?.productTagline || selectedConcept?.tagline || selectedConcept?.description || ''
  const headline = project?.campaignKit?.landingPageCopy?.headline || `The ${productName} Workspace Built with ${creatorName}`
  const subheadline = project?.campaignKit?.landingPageCopy?.subheadline || selectedConcept?.description || tagline

  const targetAudience = selectedConcept?.customer || project?.targetAudience || project?.customer || ''
  const problemSolved = selectedConcept?.problem || project?.problem || ''
  const keyFeatures = (Array.isArray(selectedConcept?.keyFeatures) && selectedConcept.keyFeatures.length > 0)
    ? selectedConcept.keyFeatures
    : (Array.isArray(project?.keyFeatures) && project.keyFeatures.length > 0)
      ? project.keyFeatures
      : (Array.isArray(selectedConcept?.features) && selectedConcept.features.length > 0)
        ? selectedConcept.features
        : []

  const conceptPricing = selectedConcept?.pricing || project?.pricing || ''

  const cfg = project?.campaignKit?.pricingConfig || project?.pricingConfig || project?.validationCampaign?.productAssets?.pricingConfig
  const sanitizedPricing = sanitizePricingConfig(cfg, conceptPricing)
  const foundingPrice = sanitizedPricing.foundingPrice || 0
  const depositPrice = sanitizedPricing.depositPrice || Math.max(9, Math.round(foundingPrice * 0.2))
  const perksText = cfg?.perks || `50% Lifetime Price Lock ($${foundingPrice}/yr) & VIP Alpha Perks`

  // Build Comprehensive List of Selectable Tiers
  const parsedConcept = parseConceptPricing(conceptPricing, foundingPrice)
  const preorderTiers = [
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
  // Only real prices are sold; a $0 tier means the price hasn't been set yet
  const pricedPreorderTiers = preorderTiers.filter((t) => Number(t.price) > 0)
  // Once launched, buyers get the product at the launch price (no deposits or founding passes)
  const availableTiers = project?.publicMode === 'live' && Number(project?.launchPrice) > 0
    ? [{ id: 'tier_launch', name: `${productName}${project?.launchPriceLabel ? ` (${project.launchPriceLabel})` : ''}`, price: Number(project.launchPrice), period: '', deposit: false, badge: 'NOW LIVE', highlight: true }]
    : pricedPreorderTiers

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
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [successReceipt, setSuccessReceipt] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [notFound, setNotFound] = useState(false)

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
          } catch (e) {
            console.warn('[Preorder] Projects list fallback notice:', e)
          }
        }

        if (isMounted) {
          if (dbProj) setProject(dbProj)
          else setNotFound(true)
        }
      } catch (err) {
        console.warn('[Preorder] Failed to load project from MongoDB Atlas:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDbProject()

    // Visitor telemetry tracking
    trackLaunch('page_view', { slug })
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
      // Confirm with Stripe server-side; the receipt shows Stripe's answer, not an assumption
      if (sp.get('session_id')) {
        import('../../services/opsApi').then((m) => m.confirmLaunchOrder(sp.get('session_id'))).then((r) => {
          const st = r?.status
          setSuccessReceipt((prev) => prev ? { ...prev, status: st === 'paid' ? 'Paid' : st === 'test' ? 'Test order (no charge)' : 'Payment processing', test: st === 'test' } : prev)
        }).catch(() => {
          setSuccessReceipt((prev) => prev ? { ...prev, status: 'Payment processing' } : prev)
        })
      }
      const amount = sp.get('amount') || selectedTier?.price || '49'
      const tier = sp.get('tier') || selectedTier?.name || 'Founding Member Pass'
      setSuccessReceipt({
        txId: sessionId,
        name: '',
        email: sp.get('customer_email') || '',
        amount: Number(amount) || 0,
        tier: tier,
        paymentMethod: sp.get('test_checkout') === 'true' ? 'Test mode' : 'Card (Stripe)',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'Checking payment…'
      })
      setIsSuccess(true)
      setCheckoutModalOpen(true)
    }
  }, [])

  // ?checkout=1 (campaign "buy" links, /p/<slug>/checkout) opens checkout straight away
  const wantsCheckout = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('checkout') === '1'
  useEffect(() => {
    if (!wantsCheckout || !project || checkoutModalOpen || isSuccess) return
    const t = availableTiers.find((x) => x.highlight) || availableTiers[0]
    if (t && Number(t.price) > 0 && project.publicMode !== 'closed') { setSelectedTier(t); setCheckoutModalOpen(true) }
  }, [project?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoading && !project && notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050506', color: '#e4e4e7' }}>
        <div className="max-w-md w-full text-center space-y-3 p-8" style={{ background: '#0c0c0e', border: '1px solid #27272a' }}>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#71717a' }}>Page not found</p>
          <h1 className="m-0 text-3xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>This product page doesn't exist</h1>
          <p className="m-0 text-sm" style={{ color: '#a1a1aa' }}>Check the link you were sent. If it came from a creator, it may have been moved or closed.</p>
        </div>
      </div>
    )
  }

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
        attributedChannel = 'X (Social Post)'
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

      if (sessionRes?.simulated && sessionRes?.sessionId) {
        setCardSession({ sessionId: sessionRes.sessionId, amount: sessionRes.amount ?? selectedTier.price, tier: sessionRes.tier || selectedTier.name })
        return
      }

      // If a live Stripe checkout URL was returned, redirect customer to Stripe Checkout
      if (sessionRes?.checkoutUrl && !sessionRes?.isTestMode && sessionRes?.mode === 'stripe_live') {
        setProcessingStep('Redirecting to Stripe Live Checkout...')
        window.location.href = sessionRes.checkoutUrl
        return
      }

      if (!sessionRes?.isTestMode) {
        throw new Error('Checkout could not be opened. Please try again in a moment.')
      }
      // Payments aren't switched on yet: record a test order and say so plainly
      setSuccessReceipt({
        txId: sessionRes?.sessionId || '',
        name: buyerName.trim(),
        email: buyerEmail.trim(),
        amount: selectedTier.price,
        tier: selectedTier.name,
        paymentMethod: 'Test mode',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'Test order (no charge)',
        test: true,
      })
      setIsSuccess(true)
    } catch (err) {
      console.warn('[Preorder] Payment API warning:', err)
      setErrorMessage(err.message || 'Payment processing failed. Please check your details and try again.')
      trackLaunch('checkout_error', { slug, meta: { message: err?.message || 'checkout failed' } })
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const handleCardSubmit = async (e) => {
    e?.preventDefault()
    setErrorMessage('')
    const problem = cardProblem({ card, exp: cardExp, cvc: cardCvc })
    if (problem) { setErrorMessage(problem); return }
    setIsProcessing(true)
    setProcessingStep('Processing payment…')
    try {
      const n = digits(card)
      const [r] = await Promise.all([
        completeSimulatedPayment(project?.id, { sessionId: cardSession.sessionId, name: buyerName.trim(), email: buyerEmail.trim(), brand: brandOf(n), last4: n.slice(-4) }),
        new Promise((res) => setTimeout(res, 1200)),
      ])
      trackLaunch('checkout_paid', { slug, meta: { tier: cardSession.tier, amount: cardSession.amount } })
      setSuccessReceipt({
        txId: cardSession.sessionId, name: buyerName.trim(), email: buyerEmail.trim(), amount: cardSession.amount, tier: cardSession.tier,
        paymentMethod: r?.paymentMethod || 'Card', status: 'Paid',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })
      setIsSuccess(true)
      setCardSession(null); setCard(''); setCardExp(''); setCardCvc('')
    } catch (err) {
      setErrorMessage(String(err?.message || 'Payment failed. Check the card and try again.').replace(/^\d{3}:\s*/, ''))
      trackLaunch('checkout_error', { slug, meta: { message: err?.message || 'payment failed' } })
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const openCheckout = (tier) => {
    if (project?.publicMode === 'closed' || !tier || !(Number(tier.price) > 0)) return
    trackLaunch('checkout_open', { slug, meta: { tier: tier?.name, price: tier?.price } })
    setSelectedTier(tier)
    setCardSession(null)
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
        {project?.publicMode === 'live' && (
          <div className="w-full px-4 py-2.5 text-center text-sm font-semibold" style={{ background: '#0b0b0d', color: '#fff', borderBottom: `2px solid ${approvedLanding.brandColor}` }}>
            {productName} is live. {project?.launchPrice ? `Get it for $${project.launchPrice}${project?.launchPriceLabel ? ` ${project.launchPriceLabel}` : ''}.` : 'Get instant access.'}
          </div>
        )}
        {project?.publicMode === 'closed' && (
          <div className="w-full px-4 py-3 text-center text-sm font-semibold" style={{ background: '#27272a', color: '#e4e4e7' }}>
            {productName} is no longer available. Existing customers have been contacted about refunds.
          </div>
        )}
        {project?.publicMode !== 'live' && project?.campaignKit?.landingPageCopy?.urgency?.text && (
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
          ctaLabel={!availableTiers.length ? 'Pre-orders open soon' : project?.publicMode === 'live' ? `Get ${productName}${project?.launchPrice ? ` · $${project.launchPrice}` : ''}` : (project?.campaignKit?.landingPageCopy?.ctaText || 'Claim founding access')}
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

      {/* Checkout */}
      {checkoutModalOpen && (() => {
        const featureList = (keyFeatures || []).map((f) => (typeof f === 'string' ? f : f?.title || f?.name || '')).filter(Boolean).slice(0, 4)
        const status = successReceipt?.status || ''
        const paid = status === 'Paid'
        const pending = /processing|checking/i.test(status)
        const ink = brandContrastText
        const field = 'w-full pl-10 pr-3 py-3 text-[15px] text-white outline-none transition-colors'
        return (
          <div className="ck fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" style={{ background: 'rgba(5,5,6,.86)', backdropFilter: 'blur(10px)' }} role="dialog" aria-modal="true" aria-labelledby="ck-title"
            onClick={(e) => { if (e.target === e.currentTarget && !isProcessing) setCheckoutModalOpen(false) }}>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
              .ck .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
              .ck input{background:#050506;border:1px solid #2a2a30}
              .ck input:focus{border-color:${brandColor};box-shadow:0 0 0 3px ${hexToRgba(brandColor, 0.18)}}
              .ck input::placeholder{color:#52525b}
              .ck :focus-visible{outline:2px solid ${brandColor};outline-offset:2px}
              @keyframes ckIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
              .ck .ck-in{animation:ckIn .35s cubic-bezier(.16,1,.3,1) both}
              @media (prefers-reduced-motion:reduce){.ck .ck-in{animation:none}}
            `}</style>
            <div className="ck-in w-full max-w-4xl my-auto grid grid-cols-1 md:grid-cols-5 overflow-hidden" style={{ background: '#0c0c0e', border: '1px solid #26262b', boxShadow: '0 40px 80px -30px rgba(0,0,0,.8)' }}>

              {/* Order summary */}
              <aside className="md:col-span-2 p-6 sm:p-7 flex flex-col gap-5" style={{ background: `linear-gradient(165deg, ${hexToRgba(brandColor, 0.22)}, transparent 55%), #08080a`, borderRight: '1px solid #1f1f24' }}>
                <div className="flex items-center gap-3">
                  {creatorAvatar
                    ? <img src={creatorAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: `2px solid ${hexToRgba(brandColor, 0.6)}` }} />
                    : <span className="w-10 h-10 flex items-center justify-center font-bold shrink-0" style={{ background: brandColor, color: ink }}>{productName.charAt(0)}</span>}
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-semibold text-white truncate">{productName}</p>
                    <p className="m-0 text-xs truncate" style={{ color: '#a1a1aa' }}>with {creatorName}</p>
                  </div>
                </div>
                {tagline && <p className="m-0 text-sm leading-relaxed" style={{ color: '#d4d4d8' }}>{tagline}</p>}
                {featureList.length > 0 && (
                  <ul className="list-none m-0 p-0 space-y-2">
                    {featureList.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#e4e4e7' }}><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: brandColor }} />{f}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-5 space-y-2" style={{ borderTop: '1px solid #1f1f24' }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm truncate" style={{ color: '#a1a1aa' }}>{selectedTier?.name}</span>
                    <span className="serif text-4xl text-white leading-none">${selectedTier?.price}</span>
                  </div>
                  <p className="m-0 text-xs" style={{ color: '#71717a' }}>
                    {selectedTier?.deposit ? 'Refundable deposit. Holds your place until launch.' : project?.publicMode === 'live' ? 'Instant access after payment.' : 'Charged once today.'}
                  </p>
                </div>
              </aside>

              {/* Form / result */}
              <section className="md:col-span-3 p-6 sm:p-8 relative">
                <button type="button" onClick={() => !isProcessing && setCheckoutModalOpen(false)} aria-label="Close checkout" className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center cursor-pointer" style={{ background: '#16161a', border: '1px solid #26262b', color: '#a1a1aa' }}>
                  <X className="w-4 h-4" />
                </button>

                {isSuccess && successReceipt ? (
                  <div className="space-y-6 pt-2">
                    <span className="w-14 h-14 flex items-center justify-center" style={{ background: successReceipt.test ? '#16161a' : hexToRgba(brandColor, 0.16), border: `1px solid ${successReceipt.test ? '#3f3f46' : hexToRgba(brandColor, 0.5)}`, color: successReceipt.test ? '#a1a1aa' : brandColor }}>
                      {pending ? <Loader2 className="w-6 h-6 animate-spin" /> : successReceipt.test ? <AlertCircle className="w-6 h-6" /> : <Check className="w-7 h-7" />}
                    </span>
                    <div>
                      <h3 id="ck-title" className="serif m-0 text-4xl text-white leading-tight">
                        {successReceipt.test ? 'Test order recorded' : pending ? 'Confirming your payment' : paid ? `You're in${successReceipt.name ? `, ${successReceipt.name.split(' ')[0]}` : ''}` : 'Order received'}
                      </h3>
                      <p className="m-0 mt-2 text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                        {successReceipt.test
                          ? 'Payments aren’t switched on for this product yet, so no card was charged.'
                          : pending
                            ? 'Stripe is confirming the payment. This usually takes a few seconds.'
                            : successReceipt.email
                              ? (project?.publicMode === 'live'
                                ? <>Your access link is on its way to <strong className="text-white">{successReceipt.email}</strong>.</>
                                : <>You're a founding member. We'll email <strong className="text-white">{successReceipt.email}</strong> when it opens.</>)
                              : 'Your order is recorded.'}
                      </p>
                    </div>
                    <dl className="m-0 text-sm" style={{ border: '1px solid #26262b' }}>
                      {[
                        ['Pass', successReceipt.tier || selectedTier?.name],
                        ['Amount', `$${successReceipt.amount}`],
                        ['Status', successReceipt.status],
                        successReceipt.email ? ['Email', successReceipt.email] : null,
                        successReceipt.txId ? ['Reference', successReceipt.txId] : null,
                      ].filter(Boolean).map(([k, v], i) => (
                        <div key={k} className="flex items-center justify-between gap-4 px-4 py-3" style={{ borderTop: i ? '1px solid #1f1f24' : 'none' }}>
                          <dt style={{ color: '#71717a' }}>{k}</dt>
                          <dd className={`m-0 text-right truncate ${k === 'Reference' ? 'font-mono text-xs' : ''}`} style={{ color: k === 'Status' && paid ? brandColor : '#fafafa' }}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <button type="button" onClick={() => setCheckoutModalOpen(false)} className="w-full py-3.5 text-sm font-bold cursor-pointer hover:opacity-90" style={{ background: brandColor, color: ink }}>Done</button>
                  </div>
                ) : cardSession ? (
                  <form onSubmit={handleCardSubmit} className="space-y-6 pt-2" noValidate>
                    <div>
                      <p className="m-0 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#71717a' }}>Payment</p>
                      <h3 id="ck-title" className="serif m-0 mt-1 text-3xl sm:text-4xl text-white leading-tight">Pay ${cardSession.amount}</h3>
                      <p className="m-0 mt-1 text-sm" style={{ color: '#a1a1aa' }}>{cardSession.tier} · {buyerEmail}</p>
                    </div>
                    {errorMessage && (
                      <div role="alert" className="p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(255,77,109,.08)', border: '1px solid rgba(255,77,109,.35)', color: '#ffb3c1' }}>
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{errorMessage}</span>
                      </div>
                    )}
                    <div>
                      <p className="m-0 mb-2 text-sm font-semibold text-white">Card details</p>
                      <div style={{ border: '1px solid #2a2a30' }}>
                        <div className="relative">
                          <input value={card} onChange={(e) => setCard(fmtCard(e.target.value))} inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" aria-label="Card number"
                            className="w-full pl-3 pr-24 py-3 text-[15px] text-white outline-none font-mono" style={{ border: 0, borderBottom: '1px solid #2a2a30' }} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a1a1aa' }}>{digits(card) ? brandOf(digits(card)) : <CreditCard className="w-4 h-4" />}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <input value={cardExp} onChange={(e) => setCardExp(fmtExp(e.target.value))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" aria-label="Expiry date"
                            className="w-full px-3 py-3 text-[15px] text-white outline-none font-mono" style={{ border: 0, borderRight: '1px solid #2a2a30' }} />
                          <input value={cardCvc} onChange={(e) => setCardCvc(digits(e.target.value).slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" aria-label="Security code"
                            className="w-full px-3 py-3 text-[15px] text-white outline-none font-mono" style={{ border: 0 }} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 pt-1">
                      <button type="submit" disabled={isProcessing} className="w-full py-4 text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
                        style={{ background: brandColor, color: ink, boxShadow: `0 16px 36px -14px ${hexToRgba(brandColor, 0.7)}` }}>
                        {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /><span>{processingStep || 'Processing payment…'}</span></> : <><Lock className="w-4 h-4" /><span>Pay ${cardSession.amount}</span></>}
                      </button>
                      <button type="button" disabled={isProcessing} onClick={() => { setCardSession(null); setErrorMessage('') }} className="w-full text-xs cursor-pointer bg-transparent border-0" style={{ color: '#71717a' }}>Back to your details</button>
                      <p className="m-0 flex items-center justify-center gap-1.5 text-xs" style={{ color: '#71717a' }}><ShieldCheck className="w-3.5 h-3.5" />Test payment: no real card is charged.</p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-6 pt-2" noValidate>
                    <div>
                      <p className="m-0 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#71717a' }}>Secure checkout</p>
                      <h3 id="ck-title" className="serif m-0 mt-1 text-3xl sm:text-4xl text-white leading-tight">Get {productName}</h3>
                    </div>

                    {errorMessage && (
                      <div role="alert" className="p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(255,77,109,.08)', border: '1px solid rgba(255,77,109,.35)', color: '#ffb3c1' }}>
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{errorMessage}</span>
                      </div>
                    )}

                    {availableTiers.length > 1 && (
                      <fieldset className="m-0 p-0 border-0 space-y-2">
                        <legend className="text-sm font-semibold text-white mb-2">Choose your pass</legend>
                        <div role="radiogroup" className="space-y-2">
                          {availableTiers.slice(0, 4).map((t) => {
                            const on = selectedTier?.name === t.name
                            return (
                              <button key={t.id || t.name} type="button" role="radio" aria-checked={on} onClick={() => setSelectedTier({ name: t.name, price: t.price, deposit: t.deposit })}
                                className="w-full flex items-center gap-3 p-3.5 text-left cursor-pointer transition-colors"
                                style={{ background: on ? hexToRgba(brandColor, 0.1) : '#050506', border: `1px solid ${on ? brandColor : '#2a2a30'}` }}>
                                <span className="w-4 h-4 shrink-0 flex items-center justify-center" style={{ border: `1.5px solid ${on ? brandColor : '#52525b'}`, borderRadius: 9999 }}>
                                  {on && <span className="w-2 h-2" style={{ background: brandColor, borderRadius: 9999 }} />}
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="block text-sm font-semibold text-white truncate">{t.name}</span>
                                  {(t.badge || t.deposit) && <span className="block text-xs" style={{ color: '#a1a1aa' }}>{t.deposit ? 'Refundable, holds your spot' : t.badge.toLowerCase()}</span>}
                                </span>
                                <span className="text-base font-bold text-white shrink-0">${t.price}<span className="text-xs font-normal" style={{ color: '#71717a' }}>{t.period}</span></span>
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                    )}

                    <div className="space-y-3">
                      <p className="m-0 text-sm font-semibold text-white">Your details</p>
                      <label className="block relative">
                        <span className="sr-only">Full name</span>
                        <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#71717a' }} />
                        <input className={field} type="text" autoComplete="name" required placeholder="Full name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                      </label>
                      <label className="block relative">
                        <span className="sr-only">Email</span>
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#71717a' }} />
                        <input className={field} type="email" autoComplete="email" required placeholder="Email for your receipt and access" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
                      </label>
                    </div>

                    <div className="space-y-3 pt-1">
                      <button type="submit" disabled={isProcessing} className="w-full py-4 text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
                        style={{ background: brandColor, color: ink, boxShadow: `0 16px 36px -14px ${hexToRgba(brandColor, 0.7)}` }}>
                        {isProcessing
                          ? <><Loader2 className="w-4 h-4 animate-spin" /><span>{processingStep || 'Opening secure checkout…'}</span></>
                          : <><Lock className="w-4 h-4" /><span>Pay ${selectedTier?.price} securely</span><ArrowRight className="w-4 h-4" /></>}
                      </button>
                      <p className="m-0 flex items-center justify-center gap-1.5 text-xs" style={{ color: '#71717a' }}>
                        <ShieldCheck className="w-3.5 h-3.5" />Payments are processed securely.
                      </p>
                    </div>
                  </form>
                )}
              </section>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
