import { useState, useEffect, useMemo } from 'react'
import {
  Check, Loader2, Clock, Gift, ShieldCheck, Flame, Wallet, Tag, Sparkles, MessageSquare,
  Workflow, HeartHandshake, HelpCircle, X, Bell, Crown, User, Mail, ArrowRight, Users, Lock,
} from 'lucide-react'
import { getProjectBySlug, getCoLaunchProjects, recordSurveyResponseUniversal } from '../../services/opsApi'
import { trackVisit } from '../../services/tracker'
import { updatePageSEO } from '../../utils/seo'
import { resolveProjectLanding } from '../../utils/projectLanding'
import { sanitizePricingConfig } from '../../utils/pricing'

// Every colour on this page derives from one accent (the approved landing-page colour).
function buildAccent(input) {
  let hex = String(input || '').trim()
  if (/^#[0-9a-f]{3}$/i.test(hex)) hex = '#' + hex.slice(1).split('').map((c) => c + c).join('')
  if (!/^#[0-9a-f]{6}$/i.test(hex)) hex = '#c81e3c'
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const tint = (v) => Math.round(v + (255 - v) * 0.45)
  return {
    '--acc': hex,
    '--acc-soft': `rgba(${r},${g},${b},0.13)`,
    '--acc-line': `rgba(${r},${g},${b},0.45)`,
    '--acc-glow': `rgba(${r},${g},${b},0.35)`,
    '--acc-text': `rgb(${tint(r)},${tint(g)},${tint(b)})`,
    '--acc-ink': lum > 0.4 ? '#0a0c10' : '#ffffff',
  }
}

function iconFor(category = '') {
  const c = category.toLowerCase()
  if (c.includes('pain') || c.includes('frustr') || c.includes('problem')) return Flame
  if (c.includes('spend') || c.includes('budget') || c.includes('cost')) return Wallet
  if (c.includes('pric') || c.includes('pay')) return Tag
  if (c.includes('feature') || c.includes('wish')) return Sparkles
  if (c.includes('workflow') || c.includes('process')) return Workflow
  return MessageSquare
}

const PRICE_POINTS = ['Under $5/mo', '$5–10/mo', '$10–20/mo', '$20+/mo', 'Free only']

export default function PublicSurveyPage({ slug }) {
  const [project, setProject] = useState(null)
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [answers, setAnswers] = useState({})
  const [intentRating, setIntentRating] = useState(null)
  const [decision, setDecision] = useState(null) // yes | maybe | no
  const [level, setLevel] = useState('waitlist') // waitlist | deposit | founding
  const [pricePoint, setPricePoint] = useState('')
  const [consent, setConsent] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [supporterCount, setSupporterCount] = useState(null)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchProject = async () => {
      try {
        let fetched = null
        if (slug) {
          try { fetched = await getProjectBySlug(slug) } catch (e) {}
        }
        if (!fetched) {
          const all = await getCoLaunchProjects()
          const list = Array.isArray(all) ? all : all?.projects || []
          if (slug) {
            const clean = slug.toLowerCase().trim()
            fetched = list.find((p) =>
              (p.slug && p.slug.toLowerCase() === clean) ||
              (p.productName && p.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean) ||
              p.id === clean)
          }
          if (!fetched && list.length > 0) fetched = list[0]
        }
        if (isMounted && fetched) setProject(fetched)
      } catch (err) {
        console.warn('[PublicSurveyPage] Project fetch notice:', err)
      }
    }
    fetchProject()
    trackVisit(`/survey/${slug || 'product'}`, () => {})
    return () => { isMounted = false }
  }, [slug])

  useEffect(() => {
    updatePageSEO({
      title: project?.productName ? `Help shape ${project.productName} | CoLaunch` : 'Audience Survey | CoLaunch',
      description: 'Two minutes to shape a new product, and the option to support it as a founding member.',
      image: '/og-image.svg',
    })
  }, [project?.productName])

  const productName = project?.productName || 'this product'
  const creatorName = project?.creatorName || 'the creator'
  const creatorAvatar = project?.creatorAvatar || ''
  const tagline = project?.productTagline || project?.selectedConcept?.tagline || ''
  const landing = useMemo(() => resolveProjectLanding(project || {}), [project])
  const accentVars = buildAccent(landing.brandColor)
  const pricing = sanitizePricingConfig(project?.campaignKit?.pricingConfig, project?.pricing || project?.selectedConcept?.pricing || '')
  const foundingPrice = pricing.foundingPrice || 49
  const depositPrice = pricing.depositPrice || Math.max(9, Math.round(foundingPrice * 0.2))
  const productSlug = (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const preorderHref = `/preorder/${productSlug}`

  const rawQuestions = project?.surveyQuestions ||
    project?.surveyData?.questions ||
    project?.validationCampaign?.researchSurvey?.questions ||
    project?.validationCampaign?.research_survey?.questions
  const questions = (Array.isArray(rawQuestions) && rawQuestions.length > 0)
    ? rawQuestions
    : [
        { id: 'q1', category: 'Pain point', question: `What is the most frustrating part of this for you today?` },
        { id: 'q2', category: 'Current spend', question: 'What tools or services do you pay for now, and roughly how much each month?' },
        { id: 'q3', category: 'Pricing', question: `What would make ${productName} worth paying for on day one?` },
        { id: 'q4', category: 'Feature wishlist', question: `What is the one feature ${productName} must have?` },
      ]

  const answeredCount = questions.filter((q) => String(answers[q.id] || '').trim()).length
  const totalSteps = questions.length + 2 // + excitement + support
  const doneSteps = answeredCount + (intentRating ? 1 : 0) + (decision ? 1 : 0)
  const firstName = respondentName.trim().split(/\s+/)[0] || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!decision) {
      setSubmitError(`Let ${creatorName} know whether you'd support ${productName}.`)
      document.getElementById('sv-support')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const res = await recordSurveyResponseUniversal({
        projectId: project?.id,
        slug: slug || project?.slug || project?.productName,
        name: respondentName.trim() || 'Community Member',
        email: respondentEmail.trim(),
        rating: intentRating || 5,
        answers,
        support: { decision, level: decision === 'yes' ? level : null, pricePoint: pricePoint || null, consent },
      })
      if (res && typeof res.supporterCount === 'number') setSupporterCount(res.supporterCount)
      setIsSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed saving survey response:', err)
      setSubmitError('Your answers could not be saved. Check your connection and send them again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const supportOptions = [
    { id: 'yes', Icon: HeartHandshake, title: "Yes, I'll support it", text: 'Count me in as an early supporter.' },
    { id: 'maybe', Icon: HelpCircle, title: 'Maybe', text: 'Keep me posted while it takes shape.' },
    { id: 'no', Icon: X, title: 'Not for me', text: "That's useful to know too." },
  ]
  const levels = [
    { id: 'waitlist', Icon: Bell, title: 'Join the waitlist', price: 'Free', text: 'Get early access news first.' },
    { id: 'deposit', Icon: ShieldCheck, title: 'Reserve a spot', price: `$${depositPrice} deposit`, text: 'Fully refundable, holds your place.' },
    { id: 'founding', Icon: Crown, title: 'Founding member', price: `$${foundingPrice}`, text: 'Lifetime founding price and perks.', featured: true },
  ]

  return (
    <div className="survey-root" style={accentVars}>
      <style>{`
        .survey-root { min-height: 100vh; background: radial-gradient(1200px 500px at 50% -10%, var(--acc-soft), transparent 70%), #050506; color: #e8eaf0; font-family: 'Roboto', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .survey-root ::selection { background: var(--acc); color: var(--acc-ink); }
        .survey-root .serif { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; letter-spacing: -0.015em; }
        .sv-bar { position: sticky; top: 0; z-index: 10; background: rgba(5,5,6,.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,.07); }
        .sv-track { height: 2px; background: rgba(255,255,255,.08); }
        .sv-fill { height: 100%; background: linear-gradient(90deg, var(--acc), var(--acc-text)); transition: width .4s ease; }
        .sv-wrap { max-width: 44rem; margin: 0 auto; padding: 0 1.25rem; }
        .sv-muted { color: #a1a1aa; }
        .sv-card { position: relative; background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0) 120px), #0c0c0e; border: 1px solid #222227; padding: 1.4rem; transition: border-color .2s; }
        .sv-card:focus-within { border-color: var(--acc-line); }
        .sv-icon { width: 2.5rem; height: 2.5rem; display: inline-flex; align-items: center; justify-content: center; background: var(--acc-soft); border: 1px solid var(--acc-line); color: var(--acc-text); flex-shrink: 0; }
        .sv-field { width: 100%; background: #050506 !important; border: 1px solid #2a2a30 !important; color: #fff !important; padding: .85rem 1rem; font-size: 1rem; line-height: 1.55; outline: none; transition: border-color .15s, box-shadow .15s; font-family: inherit; }
        .sv-field::placeholder { color: #71717a; }
        .sv-field:focus { border-color: var(--acc) !important; box-shadow: 0 0 0 3px var(--acc-soft) !important; }
        .sv-scale { display: grid; grid-template-columns: repeat(10, 1fr); gap: .375rem; }
        .sv-pt { height: 2.75rem; background: #050506; border: 1px solid #2a2a30; color: #a1a1aa; font-weight: 700; cursor: pointer; transition: all .15s; font-family: inherit; }
        .sv-pt:hover { border-color: var(--acc-line); color: #fff; }
        .sv-pt[aria-checked='true'] { background: var(--acc); border-color: var(--acc); color: var(--acc-ink); }
        .sv-choice { width: 100%; text-align: left; display: flex; gap: .85rem; align-items: flex-start; padding: 1rem; background: #050506; border: 1px solid #2a2a30; color: #e8eaf0; cursor: pointer; transition: border-color .15s, background .15s, transform .15s; font-family: inherit; }
        .sv-choice:hover { border-color: var(--acc-line); transform: translateY(-1px); }
        .sv-choice[aria-checked='true'] { border-color: var(--acc); background: linear-gradient(160deg, var(--acc-soft), rgba(5,5,6,1)); box-shadow: 0 12px 30px -18px var(--acc-glow); }
        .sv-chip { padding: .5rem .85rem; background: #050506; border: 1px solid #2a2a30; color: #d4d4d8; font-size: .85rem; font-weight: 600; cursor: pointer; font-family: inherit; }
        .sv-chip[aria-pressed='true'] { border-color: var(--acc); color: #fff; background: var(--acc-soft); }
        .sv-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: .5rem; padding: 1rem 1.25rem; border: 0; background: var(--acc); color: var(--acc-ink); font-weight: 700; font-size: 1rem; cursor: pointer; box-shadow: 0 14px 34px -12px var(--acc-glow); transition: transform .1s, filter .15s; font-family: inherit; text-decoration: none; }
        .sv-btn:hover { filter: brightness(1.08) } .sv-btn:active { transform: translateY(1px) } .sv-btn:disabled { opacity: .5; cursor: default }
        .sv-ghost { display: inline-flex; align-items: center; gap: .5rem; padding: .85rem 1.1rem; border: 1px solid #2a2a30; background: #0c0c0e; color: #d4d4d8; font-weight: 600; font-size: .9rem; cursor: pointer; font-family: inherit; text-decoration: none; }
        .sv-ghost:hover { border-color: #3f3f46; color: #fff }
        .survey-root :focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
        @keyframes sv-in { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        .sv-in { animation: sv-in .45s cubic-bezier(.16,1,.3,1) both }
        .sv-stagger > * { animation: sv-in .45s cubic-bezier(.16,1,.3,1) both }
        .sv-stagger > *:nth-child(2) { animation-delay: .05s } .sv-stagger > *:nth-child(3) { animation-delay: .1s } .sv-stagger > *:nth-child(n+4) { animation-delay: .15s }
        @media (prefers-reduced-motion: reduce) { .sv-in, .sv-stagger > * { animation: none } .sv-fill { transition: none } }
        @media (max-width: 480px) { .sv-pt { height: 2.4rem; font-size: .8rem } .sv-scale { gap: .2rem } .sv-card { padding: 1.1rem } }
      `}</style>

      {/* Sticky progress */}
      <header className="sv-bar">
        <div className="sv-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '3.25rem', gap: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '.6rem', fontSize: '.85rem', fontWeight: 700, minWidth: 0 }}>
            <span style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--acc)', color: 'var(--acc-ink)', fontSize: '.8rem', flexShrink: 0 }}>
              {productName.slice(0, 1).toUpperCase()}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productName}</span>
          </span>
          {!isSubmitted && (
            <span className="sv-muted" style={{ fontSize: '.8rem', flexShrink: 0 }} aria-live="polite">
              {doneSteps} of {totalSteps} done
            </span>
          )}
        </div>
        <div className="sv-track" role="presentation">
          <div className="sv-fill" style={{ width: isSubmitted ? '100%' : `${(doneSteps / Math.max(1, totalSteps)) * 100}%` }} />
        </div>
      </header>

      <main className="sv-wrap" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        {isSubmitted ? (
          /* ── Thank you ── */
          <section className="sv-in sv-card" style={{ padding: '2rem' }}>
            <span className="sv-icon" style={{ width: 56, height: 56 }}><Check size={26} /></span>
            <h1 className="serif" style={{ fontSize: 'clamp(2.25rem, 7vw, 3.5rem)', lineHeight: 1.06, margin: '1.25rem 0 .75rem', color: '#fff' }}>
              {decision === 'yes' ? `You're in${firstName ? `, ${firstName}` : ''}.` : `Thank you${firstName ? `, ${firstName}` : ''}.`}
            </h1>
            <p style={{ color: '#d4d4d8', lineHeight: 1.65, maxWidth: '34rem', margin: 0 }}>
              {decision === 'yes'
                ? `${creatorName} now knows you'll support ${productName}.${supporterCount ? ` You're one of ${supporterCount} supporters so far.` : ''}`
                : `Your answers were sent to ${creatorName}. They decide what ${productName} does first.`}
            </p>

            {decision === 'yes' && level !== 'waitlist' ? (
              <div className="sv-card" style={{ marginTop: '1.5rem', background: '#050506' }}>
                <div style={{ display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                  <span className="sv-icon">{level === 'founding' ? <Crown size={18} /> : <ShieldCheck size={18} />}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>
                      {level === 'founding' ? `Lock in founding access for $${foundingPrice}` : `Hold your spot with a $${depositPrice} refundable deposit`}
                    </p>
                    <p className="sv-muted" style={{ margin: '.3rem 0 1rem', fontSize: '.9rem' }}>Takes a minute on the founding pre-order page. You can change your mind later.</p>
                    <a href={preorderHref} className="sv-btn" style={{ width: 'auto', display: 'inline-flex' }}>
                      {level === 'founding' ? 'Claim founding access' : 'Reserve my spot'} <ArrowRight size={18} />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginTop: '1.75rem' }}>
                <a href={preorderHref} className="sv-ghost">See the founding offer <ArrowRight size={16} /></a>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* ── Hero ── */}
            <section className="sv-in" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1rem' }}>
                {creatorAvatar ? (
                  <img src={creatorAvatar} alt="" style={{ width: 36, height: 36, borderRadius: 9999, objectFit: 'cover', border: '2px solid var(--acc-line)' }} />
                ) : (
                  <span className="sv-icon" style={{ borderRadius: 9999, width: 36, height: 36 }}><User size={16} /></span>
                )}
                <span className="sv-muted" style={{ fontSize: '.9rem' }}>A quick question from <strong style={{ color: '#fff' }}>{creatorName}</strong></span>
              </div>
              <h1 className="serif" style={{ fontSize: 'clamp(2.6rem, 8vw, 4.2rem)', lineHeight: 1.02, margin: '0 0 .9rem', color: '#fff' }}>
                Help shape {productName}
              </h1>
              <p style={{ color: '#d4d4d8', lineHeight: 1.65, margin: 0, maxWidth: '36rem', fontSize: '1.02rem' }}>
                {tagline ? `${tagline}. ` : ''}{creatorName} is building it with the people who'll use it. Your answers decide what ships first, and you can choose to back it as an early supporter.
              </p>
              <ul style={{ listStyle: 'none', margin: '1.5rem 0 0', padding: 0, display: 'grid', gap: '.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))' }}>
                {[
                  { Icon: Clock, text: `${questions.length + 2} quick steps · 2 min` },
                  { Icon: Gift, text: 'Founding perks for supporters' },
                  { Icon: Lock, text: 'No payment to answer' },
                ].map(({ Icon, text }) => (
                  <li key={text} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.65rem .8rem', background: '#0c0c0e', border: '1px solid #222227', fontSize: '.85rem', color: '#d4d4d8' }}>
                    <Icon size={16} style={{ color: 'var(--acc-text)', flexShrink: 0 }} />{text}
                  </li>
                ))}
              </ul>
            </section>

            <form onSubmit={handleSubmit}>
              <ol className="sv-stagger" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem' }}>
                {questions.map((q, idx) => {
                  const Icon = iconFor(q.category)
                  const done = Boolean(String(answers[q.id] || '').trim())
                  const inputId = `sv-q-${q.id || idx}`
                  return (
                    <li key={q.id || idx} className="sv-card">
                      <div style={{ display: 'flex', gap: '.9rem', alignItems: 'flex-start', marginBottom: '.9rem' }}>
                        <span className="sv-icon" style={done ? { background: 'var(--acc)', color: 'var(--acc-ink)', borderColor: 'var(--acc)' } : undefined}>
                          {done ? <Check size={18} /> : <Icon size={18} />}
                        </span>
                        <label htmlFor={inputId} style={{ display: 'block', minWidth: 0 }}>
                          <span className="sv-muted" style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                            {String(idx + 1).padStart(2, '0')} · {q.category || 'Question'}{idx === 0 ? ' · required' : ''}
                          </span>
                          <span className="serif" style={{ display: 'block', fontSize: 'clamp(1.35rem, 4.5vw, 1.7rem)', lineHeight: 1.22, color: '#fff', marginTop: '.3rem' }}>
                            {q.question}
                          </span>
                        </label>
                      </div>
                      <textarea
                        id={inputId}
                        rows={3}
                        required={idx === 0}
                        className="sv-field"
                        placeholder="Write what comes to mind. Specific examples help most."
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        style={{ resize: 'vertical' }}
                      />
                    </li>
                  )
                })}

                {/* Excitement */}
                <li className="sv-card">
                  <div style={{ display: 'flex', gap: '.9rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span className="sv-icon"><Sparkles size={18} /></span>
                    <div>
                      <span className="sv-muted" style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        {String(questions.length + 1).padStart(2, '0')} · Excitement
                      </span>
                      <p id="sv-rating-label" className="serif" style={{ fontSize: 'clamp(1.35rem, 4.5vw, 1.7rem)', lineHeight: 1.22, color: '#fff', margin: '.3rem 0 0' }}>
                        How excited are you to use {productName}?
                      </p>
                    </div>
                  </div>
                  <div className="sv-scale" role="radiogroup" aria-labelledby="sv-rating-label">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button key={num} type="button" role="radio" aria-checked={intentRating === num} className="sv-pt" onClick={() => setIntentRating(num)}>
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="sv-muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginTop: '.6rem' }}>
                    <span>Not interested</span><span>Need it on day one</span>
                  </div>
                </li>

                {/* Support pledge */}
                <li id="sv-support" className="sv-card" style={{ borderColor: decision === 'yes' ? 'var(--acc-line)' : undefined }}>
                  <div style={{ display: 'flex', gap: '.9rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span className="sv-icon"><HeartHandshake size={18} /></span>
                    <div>
                      <span className="sv-muted" style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        {String(questions.length + 2).padStart(2, '0')} · Your support · required
                      </span>
                      <p id="sv-support-label" className="serif" style={{ fontSize: 'clamp(1.45rem, 5vw, 1.9rem)', lineHeight: 1.18, color: '#fff', margin: '.3rem 0 0' }}>
                        Will you support {productName} when it launches?
                      </p>
                    </div>
                  </div>

                  <div role="radiogroup" aria-labelledby="sv-support-label" style={{ display: 'grid', gap: '.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
                    {supportOptions.map(({ id, Icon, title, text }) => (
                      <button key={id} type="button" role="radio" aria-checked={decision === id} className="sv-choice" onClick={() => { setDecision(id); setSubmitError('') }}>
                        <span className="sv-icon" style={decision === id ? { background: 'var(--acc)', color: 'var(--acc-ink)', borderColor: 'var(--acc)' } : undefined}><Icon size={18} /></span>
                        <span>
                          <span style={{ display: 'block', fontWeight: 700, color: '#fff' }}>{title}</span>
                          <span className="sv-muted" style={{ display: 'block', fontSize: '.82rem', marginTop: '.15rem' }}>{text}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {decision === 'yes' && (
                    <div className="sv-in" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #222227' }}>
                      <p style={{ margin: '0 0 .75rem', fontWeight: 700, color: '#fff' }}>How would you like to support it?</p>
                      <div role="radiogroup" aria-label="Support level" style={{ display: 'grid', gap: '.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
                        {levels.map(({ id, Icon, title, price, text, featured }) => (
                          <button key={id} type="button" role="radio" aria-checked={level === id} className="sv-choice" onClick={() => setLevel(id)} style={{ flexDirection: 'column', gap: '.5rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <Icon size={20} style={{ color: 'var(--acc-text)' }} />
                              {featured && <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '.15rem .45rem', background: 'var(--acc)', color: 'var(--acc-ink)' }}>Best value</span>}
                            </span>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{title}</span>
                            <span className="serif" style={{ fontSize: '1.6rem', lineHeight: 1, color: '#fff' }}>{price}</span>
                            <span className="sv-muted" style={{ fontSize: '.82rem' }}>{text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {decision && decision !== 'no' && (
                    <div className="sv-in" style={{ marginTop: '1.25rem' }}>
                      <p style={{ margin: '0 0 .6rem', fontWeight: 600, color: '#d4d4d8', fontSize: '.9rem' }}>What would you happily pay each month? <span className="sv-muted" style={{ fontWeight: 400 }}>(optional)</span></p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem' }}>
                        {PRICE_POINTS.map((p) => (
                          <button key={p} type="button" aria-pressed={pricePoint === p} className="sv-chip" onClick={() => setPricePoint(pricePoint === p ? '' : p)}>{p}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              </ol>

              {/* Contact */}
              <section className="sv-card" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '.9rem', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
                  <span className="sv-icon"><Users size={18} /></span>
                  <div>
                    <h2 className="serif" style={{ fontSize: '1.7rem', margin: 0, color: '#fff' }}>Where should we reach you?</h2>
                    <p className="sv-muted" style={{ margin: '.25rem 0 0', fontSize: '.9rem' }}>Supporters get the founding offer before anyone else.</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                  {[
                    { id: 'sv-name', label: 'Your name', Icon: User, type: 'text', value: respondentName, set: setRespondentName, ph: 'First and last name', ac: 'name' },
                    { id: 'sv-email', label: 'Your email', Icon: Mail, type: 'email', value: respondentEmail, set: setRespondentEmail, ph: 'you@email.com', ac: 'email' },
                  ].map((f) => (
                    <div key={f.id}>
                      <label htmlFor={f.id} style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, marginBottom: '.4rem', color: '#d4d4d8' }}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <f.Icon size={16} style={{ position: 'absolute', left: '.9rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a', pointerEvents: 'none' }} />
                        <input id={f.id} type={f.type} required autoComplete={f.ac} className="sv-field" placeholder={f.ph} value={f.value} onChange={(e) => f.set(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', marginTop: '1rem', fontSize: '.88rem', color: '#d4d4d8', cursor: 'pointer' }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: '.2rem', accentColor: 'var(--acc)', width: 16, height: 16 }} />
                  <span>{creatorName} can email me about {productName} and its launch. Unsubscribe any time.</span>
                </label>
              </section>

              {submitError && (
                <p role="alert" style={{ margin: '1rem 0 0', padding: '.8rem 1rem', background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.4)', color: '#ffb3c1', fontSize: '.9rem' }}>
                  {submitError}
                </p>
              )}

              <div style={{ marginTop: '1.25rem' }}>
                <button type="submit" disabled={isSubmitting} className="sv-btn">
                  {isSubmitting ? (<><Loader2 size={18} className="animate-spin" /><span>Sending</span></>) : (
                    <><span>{decision === 'yes' ? 'Send answers and pledge my support' : 'Send my answers'}</span><ArrowRight size={18} /></>
                  )}
                </button>
                <p className="sv-muted" style={{ textAlign: 'center', fontSize: '.8rem', margin: '.75rem 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
                  <Lock size={13} /> No payment is taken here. Your answers go only to {creatorName}.
                </p>
              </div>
            </form>
          </>
        )}

        <footer className="sv-muted" style={{ marginTop: '3rem', fontSize: '.8rem', textAlign: 'center' }}>Powered by CoLaunch</footer>
      </main>
    </div>
  )
}
