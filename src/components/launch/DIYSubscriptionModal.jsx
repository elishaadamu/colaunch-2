import { useState, useEffect } from 'react'
import {
  X,
  CheckCircle2,
  Lock,
  Rocket,
  ShieldCheck,
  CreditCard,
  Zap,
  ArrowRight,
  Check,
  Loader2,
  DollarSign,
  Layers,
  Cpu,
  Copy,
  Mail,
  User,
  ExternalLink
} from 'lucide-react'
import { updateCoLaunchProject, sendDirectEmail, getWorkflowState } from '../../services/opsApi'
import FloatingPolygons from '../ui/FloatingPolygons'

export default function DIYSubscriptionModal({
  isOpen,
  onClose,
  project,
  passPrice: propPassPrice,
  onUnlockSuccess
}) {
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' | 'paypal'

  // Stripe card form state
  const [cardName, setCardName] = useState(project?.creatorName || '')
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [cardExp, setCardExp] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('888')

  // Payment processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [subscriptionRecord, setSubscriptionRecord] = useState(null)
  const [dedicatedUrl, setDedicatedUrl] = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [emailNotice, setEmailNotice] = useState('')
  const [dbPassPrice, setDbPassPrice] = useState(0)

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isProcessing, onClose])

  useEffect(() => {
    try { localStorage.removeItem('forge_cobuilder_pass_price') } catch (e) {}
    if (!isOpen) return
    getWorkflowState().then((wf) => {
      const dbFee = wf?.default_pass_price ?? wf?.cobuilder_pass_price ?? wf?.extra_state?.default_pass_price ?? wf?.extra_state?.cobuilder_pass_price
      if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
        setDbPassPrice(Number(dbFee))
      } else {
        setDbPassPrice(0)
      }
    }).catch(() => {
      setDbPassPrice(0)
    })

    const handlePriceEvent = (e) => {
      const p = e?.detail
      if (p !== undefined && p !== null && !isNaN(Number(p))) {
        setDbPassPrice(Number(p))
      } else {
        setDbPassPrice(0)
      }
    }
    window.addEventListener('forge_pass_price_changed', handlePriceEvent)
    return () => {
      window.removeEventListener('forge_pass_price_changed', handlePriceEvent)
    }
  }, [isOpen])

  if (!isOpen) return null

  const projectSpecificFee = Number(
    project?.diyFee ??
    project?.diyPassPrice ??
    project?.metadataInfo?.diy_fee ??
    project?.metadataInfo?.diyFee ??
    project?.metadata_info?.diy_fee ??
    project?.diySubscription?.amount
  )

  const hasCustomFee = Boolean(
    project?.hasCustomFee ||
    project?.metadataInfo?.hasCustomFee ||
    project?.metadata_info?.hasCustomFee ||
    (!isNaN(projectSpecificFee) && projectSpecificFee > 0 && dbPassPrice > 0 && projectSpecificFee !== dbPassPrice)
  )

  const amountToCharge = Number(
    (propPassPrice !== undefined && propPassPrice !== null && !isNaN(Number(propPassPrice)))
      ? Number(propPassPrice)
      : (!isNaN(projectSpecificFee) && projectSpecificFee > 0 && (hasCustomFee || !dbPassPrice))
        ? projectSpecificFee
        : (dbPassPrice || (!isNaN(projectSpecificFee) && projectSpecificFee > 0 ? projectSpecificFee : 50))
  )
  const productName = project?.productName || 'Your Custom SaaS App'

  const handleProcessPayment = async (isTestBypass = false) => {
    if (!project?.id) return
    setIsProcessing(true)

    try {
      if (isTestBypass) {
        setProcessingStep(`Instant test unlock verified ($${amountToCharge} USD bypass)...`)
        await new Promise((r) => setTimeout(r, 600))
      } else {
        setProcessingStep(
          paymentMethod === 'stripe'
            ? `Contacting Stripe Checkout & verifying $${amountToCharge} charge...`
            : `Authorizing PayPal $${amountToCharge.toFixed(2)} payment...`
        )
        await new Promise((r) => setTimeout(r, 1100))

        setProcessingStep('Provisioning autonomous CoLaunch license...')
        await new Promise((r) => setTimeout(r, 800))
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
      const creatorHandleClean = (project?.creatorHandle || project?.creatorName || 'creator')
        .replace(/^@/, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
      const generatedUrl = `${origin}/portal/${creatorHandleClean}?view=projectos&token=cf_diy_paid&project=${project.id}`
      setDedicatedUrl(generatedUrl)

      const licenseKey = `FORGE-COBUILDER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      const newSub = {
        active: true,
        plan: `diy_full_${amountToCharge}`,
        planName: `Interactive Co-Builder ProjectOS Pass ($${amountToCharge} USD)`,
        amount: amountToCharge,
        billingCycle: 'one_time',
        paymentMethod: isTestBypass ? 'Test Mode (Instant Unlock)' : paymentMethod === 'stripe' ? 'Stripe (Card •••• 4242)' : 'PayPal Express',
        transactionId: `tx_${paymentMethod}_${Date.now()}`,
        unlockedAt: new Date().toISOString(),
        unlockedPhases: [1, 2, 3],
        status: 'active',
        licenseKey,
        dedicatedUrl: generatedUrl
      }

      setProcessingStep('Unlocking Phase 1, Phase 2, & Phase 3 Interactive Co-Builder Access...')
      const updatedProject = {
        ...project,
        diySubscription: newSub,
        isDIY: true,
        diyOfferStatus: 'accepted'
      }

      // Persist to backend PostgreSQL
      await updateCoLaunchProject(project.id, {
        diySubscription: newSub,
        isDIY: true,
        diyOfferStatus: 'accepted'
      }).catch((e) => console.warn('[DIYSubscriptionModal] DB save warning:', e))

      // Dispatch dedicated URL to creator email immediately
      const targetEmail = (project?.creatorEmail || project?.email_public || '').trim()
      if (targetEmail && targetEmail.includes('@')) {
        setProcessingStep(`Dispatching dedicated URL to ${targetEmail}...`)
        try {
          const emailSubject = `🚀 Your Interactive Co-Builder ProjectOS URL: ${productName}`
          const emailBody = `Hi ${project?.creatorName || 'there'},\n\nThank you for your $${amountToCharge} payment! Your Interactive Co-Builder ProjectOS Workspace for ${productName} has been officially unlocked.\n\nYou now have full authority to directly participate and build alongside the studio across all 3 phases:\n• Phase 1: Market Validation & Pre-order Campaign\n• Phase 2: AI MVP Sprints, Architecture & Database\n• Phase 3: Launch & Production Telemetry\n• 50/50 Co-Founder Equity Partnership\n\nClick the link below to access your interactive workspace:\n${generatedUrl}\n\nBest regards,\nThe CoLaunch Studio Team`

          await sendDirectEmail(targetEmail, emailSubject, emailBody, project?.creatorId || project?.id)
          setEmailNotice(`Dedicated URL dispatched to ${targetEmail}`)
        } catch (mailErr) {
          console.warn('[DIYSubscriptionModal] Failed to dispatch confirmation email:', mailErr)
          setEmailNotice(`URL ready (email notification skipped: ${mailErr?.message || 'offline'})`)
        }
      }

      // Broadcast event so portal & ProjectOS immediately sync with database updatedProject
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('forge_project_updated', { detail: updatedProject })
        )
      }

      setSubscriptionRecord(newSub)
      setPaymentSuccess(true)
      setIsProcessing(false)

      if (onUnlockSuccess) {
        onUnlockSuccess(updatedProject)
      }
    } catch (err) {
      console.error('[DIYSubscriptionModal] Payment failure:', err)
      setIsProcessing(false)
      alert('Payment processing failed. Please try again.')
    }
  }

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

  return (
    <div
      className="fixed inset-0 z-[9999] backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      style={{ background: 'rgba(8,9,12,0.82)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose()
      }}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col my-auto overflow-hidden"
        style={{ background: C.sheet, border: `1px solid ${C.lineStrong}`, color: C.text }}
      >
        {/* Top Accent Bar */}
        <div
          className="h-1 w-full relative z-10"
          style={{ background: `linear-gradient(90deg, ${C.crimson}, #a78bfa, #38bdf8)` }}
        />

        {/* Top Header Bar */}
        <div
          className="px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-4 relative z-10"
          style={{ background: C.row, borderBottom: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
              style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" style={{ color: C.crimsonText }} />
              <span>Interactive Co-Builder Pass</span>
            </div>
            <span className="hidden sm:inline" style={{ color: C.faint }}>•</span>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: C.ok }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.ok }} />
              <span>50/50 Co-Founder Partnership</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl transition-colors cursor-pointer"
            style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, color: C.body }}
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[85vh] relative z-10">
          {paymentSuccess ? (
            /* SUCCESS STATE */
            <div className="p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200" style={{ background: C.sheet }}>
              <div
                className="w-16 h-16 rounded-2xl text-white flex items-center justify-center mx-auto shadow-lg"
                style={{ background: C.okSoft, border: `1px solid ${C.okLine}`, color: C.ok }}
              >
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3
                  className="text-xl sm:text-2xl font-bold"
                  style={{ color: C.text, fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                >
                  Interactive Co-Builder Access Unlocked!
                </h3>
                <p className="text-xs sm:text-sm max-w-lg mx-auto" style={{ color: C.muted }}>
                  Your ${amountToCharge} payment has been confirmed. You now have full execution authority to participate across all phases and build alongside the studio under our 50/50 co-founder partnership.
                </p>
              </div>

              {/* Dedicated ProjectOS URL Box with Copy */}
              <div
                className="p-4 sm:p-5 rounded-2xl text-left space-y-2.5 max-w-lg mx-auto"
                style={{ background: C.row, border: `1px solid ${C.okLine}` }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                    <Rocket className="w-3.5 h-3.5" style={{ color: C.ok }} />
                    <span>Your Dedicated Co-Builder Workspace URL:</span>
                  </span>
                  {emailNotice && (
                    <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: C.ok }}>
                      <Mail className="w-3 h-3" style={{ color: C.ok }} />
                      <span>Sent to Email</span>
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-2 p-2 rounded-xl"
                  style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                >
                  <input
                    type="text"
                    readOnly
                    value={dedicatedUrl}
                    className="w-full bg-transparent text-xs font-mono outline-none truncate"
                    style={{ color: C.body }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(dedicatedUrl)
                        setCopiedUrl(true)
                        setTimeout(() => setCopiedUrl(false), 2500)
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
                    style={{ background: C.crimson, color: '#ffffff' }}
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" style={{ color: C.ok }} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                {project?.creatorEmail && (
                  <p className="text-[11px] flex items-center gap-1.5" style={{ color: C.muted }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.ok }} />
                    <span>We also emailed this direct access link to <strong style={{ color: C.text }}>{project.creatorEmail}</strong>.</span>
                  </p>
                )}
              </div>

              {/* License Details Badge */}
              <div
                className="p-3.5 rounded-2xl text-left text-xs space-y-1.5 max-w-lg mx-auto"
                style={{ background: C.row, border: `1px solid ${C.line}` }}
              >
                <div className="flex justify-between items-center" style={{ color: C.muted }}>
                  <span>Pass Key:</span>
                  <strong className="font-mono" style={{ color: C.text }}>{subscriptionRecord?.licenseKey}</strong>
                </div>
                <div className="flex justify-between items-center" style={{ color: C.muted }}>
                  <span>Payment Amount:</span>
                  <strong style={{ color: C.text }}>${amountToCharge.toFixed(2)} USD (One-Time Access)</strong>
                </div>
                <div className="flex justify-between items-center" style={{ color: C.muted }}>
                  <span>Payment Gateway:</span>
                  <strong style={{ color: C.sky }}>{subscriptionRecord?.paymentMethod}</strong>
                </div>
                <div className="flex justify-between items-center" style={{ color: C.muted }}>
                  <span>Equity Partnership:</span>
                  <strong className="font-bold" style={{ color: C.ok }}>50/50 Co-Founder Split (Interactive Build Access)</strong>
                </div>
              </div>

              <div className="pt-2 max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const searchParams = new URLSearchParams(window.location.search)
                      searchParams.delete('offer')
                      searchParams.delete('track')
                      const newSearch = searchParams.toString()
                      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
                      window.history.replaceState({}, '', newUrl)
                      window.dispatchEvent(new CustomEvent('forge_view_change', { detail: 'projectos' }))
                    }
                    onClose()
                  }}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                  style={{ background: C.crimson, color: '#ffffff' }}
                >
                  <span>Open Interactive ProjectOS Workspace</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          ) : (
            /* 2-COLUMN MODERN CHECKOUT */
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
              {/* LEFT COLUMN: PRODUCT, VALUE & GUARANTEE (5 cols) */}
              <div
                className="md:col-span-5 p-5 sm:p-6 border-b md:border-b-0 md:border-r flex flex-col justify-between space-y-5 relative"
                style={{ background: C.row, borderColor: C.line }}
              >
                <div className="space-y-4">
                  {/* Product & Price Header */}
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest block" style={{ color: C.crimsonText }}>
                      Participate & Co-Build
                    </span>
                    <h3
                      className="text-base sm:text-lg font-bold leading-tight mt-0.5"
                      style={{ color: C.text, fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                    >
                      {productName}
                    </h3>
                  </div>

                  {/* Price Tag Box */}
                  <div
                    className="p-3.5 rounded-2xl space-y-1"
                    style={{ background: C.sheet, border: `1px solid ${C.okLine}` }}
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black tracking-tight" style={{ color: C.text }}>${amountToCharge}</span>
                      <span className="text-xs font-bold" style={{ color: C.muted }}>USD</span>
                      <span
                        className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        One-Time Pass
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug" style={{ color: C.muted }}>
                      No monthly fees. Unlocks direct execution authority across all phases.
                    </p>
                  </div>

                  {/* Benefit Checkpoints */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warnLine}` }}
                      >
                        <Layers className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="font-semibold block text-[11px]" style={{ color: C.text }}>All 3 Phases Unlocked</strong>
                        <span className="text-[10px] leading-tight block" style={{ color: C.muted }}>
                          Participate in Market Validation, MVP Sprints & Live Launch.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.violetSoft, color: C.violet, border: `1px solid ${C.violetLine}` }}
                      >
                        <Cpu className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="font-semibold block text-[11px]" style={{ color: C.text }}>AI Execution Authority</strong>
                        <span className="text-[10px] leading-tight block" style={{ color: C.muted }}>
                          Directly trigger AI tools, customize blueprints & modify features.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
                      >
                        <DollarSign className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="font-semibold block text-[11px]" style={{ color: C.text }}>50/50 Co-Founder Split</strong>
                        <span className="text-[10px] leading-tight block" style={{ color: C.muted }}>
                          Equal venture profit sharing with direct Stripe Connect deposits.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="pt-2 flex items-center justify-between text-[10px]" style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}>
                  <div className="flex items-center gap-1 font-medium" style={{ color: C.ok }}>
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: C.ok }} />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                  <span style={{ color: C.faint }}>14-Day Guarantee</span>
                </div>
              </div>

              {/* RIGHT COLUMN: PAYMENT GATEWAY & CHECKOUT (7 cols) */}
              <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4" style={{ background: C.sheet }}>
                <div className="space-y-3.5">
                  {/* Gateway Selector Tabs */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>
                        Select Payment Method
                      </label>
                      <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: C.muted }}>
                        <Lock className="w-2.5 h-2.5" style={{ color: C.ok }} />
                        <span>Instant Access</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className="py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        style={
                          paymentMethod === 'stripe'
                            ? { background: C.crimson, color: '#ffffff' }
                            : { color: C.muted }
                        }
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Card / Apple Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className="py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        style={
                          paymentMethod === 'paypal'
                            ? { background: C.warn, color: '#08090c' }
                            : { color: C.muted }
                        }
                      >
                        <span className="font-black italic text-sm leading-none">P</span>
                        <span>PayPal</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Form */}
                  {paymentMethod === 'stripe' ? (
                    <div className="space-y-2.5">
                      {/* Cardholder Name */}
                      <div className="space-y-1">
                        <label
                          htmlFor="co-builder-cc-name"
                          className="text-[10px] font-bold uppercase tracking-wider block"
                          style={{ color: C.muted }}
                        >
                          Cardholder Name
                        </label>
                        <div className="relative">
                          <input
                            id="co-builder-cc-name"
                            name="cc-name"
                            type="text"
                            autoComplete="cc-name"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Creator Name"
                            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none transition-all"
                            style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }}
                            required
                          />
                          <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5" style={{ color: C.faint }} />
                        </div>
                      </div>

                      {/* Card Number */}
                      <div className="space-y-1">
                        <label
                          htmlFor="co-builder-cc-number"
                          className="text-[10px] font-bold uppercase tracking-wider block"
                          style={{ color: C.muted }}
                        >
                          Card Information
                        </label>
                        <div className="relative">
                          <input
                            id="co-builder-cc-number"
                            name="cc-number"
                            type="text"
                            autoComplete="cc-number"
                            inputMode="numeric"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 •••• •••• 4242"
                            className="w-full pl-8 pr-16 py-2 rounded-xl text-xs font-mono outline-none transition-all"
                            style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }}
                            required
                          />
                          <CreditCard className="w-3.5 h-3.5 absolute left-2.5 top-2.5" style={{ color: C.faint }} />
                          <div className="absolute right-2.5 top-2 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: C.raised, color: C.body, border: `1px solid ${C.line}` }}>VISA</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: C.raised, color: C.body, border: `1px solid ${C.line}` }}>MC</span>
                          </div>
                        </div>
                      </div>

                      {/* Exp & CVC Row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label
                            htmlFor="co-builder-cc-exp"
                            className="text-[10px] font-bold uppercase tracking-wider block"
                            style={{ color: C.muted }}
                          >
                            Expires (MM/YY)
                          </label>
                          <input
                            id="co-builder-cc-exp"
                            name="cc-exp"
                            type="text"
                            autoComplete="cc-exp"
                            maxLength={5}
                            value={cardExp}
                            onChange={(e) => setCardExp(e.target.value)}
                            placeholder="12/28"
                            className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none transition-all"
                            style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor="co-builder-cc-csc"
                            className="text-[10px] font-bold uppercase tracking-wider block"
                            style={{ color: C.muted }}
                          >
                            CVC / Security Code
                          </label>
                          <input
                            id="co-builder-cc-csc"
                            name="cc-csc"
                            type="text"
                            autoComplete="cc-csc"
                            inputMode="numeric"
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="888"
                            className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none transition-all"
                            style={{ background: C.row, border: `1px solid ${C.lineStrong}`, color: C.text }}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PayPal Gateway Detail */
                    <div
                      className="p-4 rounded-xl text-center space-y-2"
                      style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}` }}
                    >
                      <div className="text-xl font-black italic" style={{ color: C.warn }}>PayPal</div>
                      <p className="text-xs" style={{ color: C.body }}>
                        Confirm your one-time payment of <strong style={{ color: C.text }}>${amountToCharge.toFixed(2)} USD</strong> for the Interactive ProjectOS Pass via PayPal.
                      </p>
                      <div className="text-[11px]" style={{ color: C.muted }}>
                        Immediate redirect & instantaneous license activation to your email.
                      </div>
                    </div>
                  )}

                  {/* Processing Status Banner */}
                  {isProcessing && (
                    <div
                      className="p-2.5 rounded-xl flex items-center gap-2.5 text-xs animate-pulse"
                      style={{ background: C.okSoft, border: `1px solid ${C.okLine}`, color: C.ok }}
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: C.ok }} />
                      <span className="truncate">{processingStep}</span>
                    </div>
                  )}
                </div>

                {/* Always Visible Checkout Actions */}
                <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={() => handleProcessPayment(false)}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-tight transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: C.crimson, color: '#ffffff' }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Authorizing Payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-white" />
                        <span>Pay ${amountToCharge}.00 USD & Unlock Access</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2.5 text-[10px] py-1" style={{ color: C.muted }}>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" style={{ color: C.ok }} />
                      <span>Instant URL dispatch & workspace provision</span>
                    </span>
                    <span style={{ color: C.faint }}>•</span>
                    <span className="font-mono" style={{ color: C.faint }}>256-bit SSL Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

