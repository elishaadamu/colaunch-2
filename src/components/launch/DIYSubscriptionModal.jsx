import { useEffect, useState } from 'react'
import { X, Lock, ArrowRight, Loader2, CreditCard, UserPlus, LogIn, Check, AlertTriangle, Layers, Wand2, Rocket } from 'lucide-react'
import { getDiyPrice, payDiyPass } from '../../services/opsApi'

// DIY pass: the creator enters a card (simulated payment, nothing is charged), then creates an account
// (name, email, password) at /creator/signup and signs in at /creator/login.
// The full card number never leaves the browser: only the brand and last 4 digits are sent.

const C = {
  sheet: '#0f0f12', row: '#0a0a0c', line: '#26262b', text: '#f4f4f5', body: '#d4d4d8', muted: '#a1a1aa', faint: '#71717a',
  crimson: '#c81e3c', crimsonText: '#ff8fa3', ok: '#34d399',
}

const clean = (m) => String(m || '').replace(/^\d{3}:\s*/, '')
const digits = (v) => String(v || '').replace(/\D/g, '')
const brandOf = (n) => /^4/.test(n) ? 'visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'mastercard' : /^3[47]/.test(n) ? 'amex' : /^6(011|5)/.test(n) ? 'discover' : /^(506[01]|507[89]|6500)/.test(n) ? 'verve' : 'card'
const luhn = (n) => { let sum = 0; for (let i = 0; i < n.length; i += 1) { let d = +n[n.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9 } sum += d } return n.length >= 12 && sum % 10 === 0 }
const fmtCard = (v) => { const n = digits(v).slice(0, 19); return brandOf(n) === 'amex' ? [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ') : n.replace(/(\d{4})(?=\d)/g, '$1 ') }
const fmtExp = (v) => { const n = digits(v).slice(0, 4); return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n }
const expOk = (v) => { const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m) return false; const mo = +m[1], yr = 2000 + +m[2]; if (mo < 1 || mo > 12) return false; const now = new Date(); return yr > now.getFullYear() || (yr === now.getFullYear() && mo >= now.getMonth() + 1) }
const inputStyle = { background: '#050506', border: '1px solid #26262b', color: '#f4f4f5' }

export default function DIYSubscriptionModal({ isOpen, onClose, project, passPrice }) {
  const [price, setPrice] = useState(null)
  const [email, setEmail] = useState(project?.creatorEmail || '')
  const [busy, setBusy] = useState(false)
  const [cardName, setCardName] = useState(project?.creatorName || '')
  const [card, setCard] = useState('')
  const [exp, setExp] = useState('')
  const [cvc, setCvc] = useState('')
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !project?.id) return
    setError('')
    getDiyPrice(project.id).then(setPrice).catch((e) => setError(clean(e.message)))
  }, [isOpen, project?.id])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, busy, onClose])

  if (!isOpen) return null

  const amount = price?.amount ?? (Number(passPrice) || null)
  const productName = project?.productName || 'your product'
  const alreadyPaid = Boolean(project?.diySubscription?.active && project?.diySubscription?.plan === 'diy_pass')

  const num = digits(card)
  const brand = brandOf(num)
  const cvcLen = brand === 'amex' ? 4 : 3
  const problem = !cardName.trim() ? 'Enter the name on the card.'
    : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? 'Enter a valid email for the receipt.'
    : !luhn(num) ? 'Check the card number.'
    : !expOk(exp) ? 'Check the expiry date (MM/YY, not in the past).'
    : digits(cvc).length !== cvcLen ? `The security code is ${cvcLen} digits.` : ''

  const pay = async (e) => {
    e?.preventDefault()
    if (!project?.id || busy) return
    if (problem) { setError(problem); return }
    setBusy(true); setError('')
    try {
      const [r] = await Promise.all([
        payDiyPass({ projectId: project.id, name: cardName.trim(), email: email.trim(), brand, last4: num.slice(-4), exp }),
        new Promise((res) => setTimeout(res, 1400)),
      ])
      try { localStorage.setItem(`colaunch_diy_session_${project.id}`, r.sessionId) } catch { /* storage unavailable */ }
      setPaid(true)
      setTimeout(() => window.location.assign(`/creator/signup?session_id=${encodeURIComponent(r.sessionId)}`), 1300)
    } catch (err) {
      setError(clean(err.message)); setBusy(false)
    }
  }

  const steps = [
    [CreditCard, 'Pay by card', 'One-time payment for the pass.'],
    [UserPlus, 'Create your account', 'Your name, email and a password. We email you to confirm.'],
    [LogIn, 'Sign in', 'Sign in with your email and password to open your workspace.'],
  ]
  const gets = [
    [Layers, 'Phase 1 · Validate', 'Concept, survey, pre-order page, campaign and the go / no-go gate.'],
    [Wand2, 'Phase 2 · Build', 'Build Studio: describe the product and watch the AI build it. Beta test it with real customers.'],
    [Rocket, 'Phase 3 · Launch', 'Launch plan, live numbers and a launch manager that advises you.'],
  ]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto" style={{ background: 'rgba(5,5,6,0.85)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="diy-title" className="relative w-full max-w-3xl my-auto" style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.text }}>
        <header className="flex items-center justify-between gap-4 px-5 py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: C.crimsonText }}>DIY pass</p>
            <h2 id="diy-title" className="m-0 mt-1 text-2xl leading-tight truncate" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>Run the launch of {productName} yourself</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer" style={{ border: `1px solid ${C.line}`, color: C.body }}><X className="w-4 h-4" /></button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px]">
          <div className="p-5 space-y-5" style={{ borderRight: `1px solid ${C.line}` }}>
            <section>
              <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.faint }}>What you get</p>
              <ul className="list-none m-0 p-0 space-y-2">
                {gets.map(([I, t, d]) => (
                  <li key={t} className="flex gap-3 p-3" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                    <I className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.body }} />
                    <div><p className="m-0 text-sm font-semibold">{t}</p><p className="m-0 mt-0.5 text-xs" style={{ color: C.muted }}>{d}</p></div>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.faint }}>How it works</p>
              <ol className="list-none m-0 p-0 space-y-2">
                {steps.map(([I, t, d], i) => (
                  <li key={t} className="flex gap-3 items-start">
                    <span className="w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold" style={{ border: `1px solid ${C.line}`, color: C.body }}>{i + 1}</span>
                    <div><p className="m-0 text-sm font-semibold flex items-center gap-1.5"><I className="w-3.5 h-3.5" style={{ color: C.muted }} />{t}</p><p className="m-0 text-xs" style={{ color: C.muted }}>{d}</p></div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="p-5 flex flex-col gap-4" style={{ background: C.row }}>
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.faint }}>One-time payment</p>
              <p className="m-0 mt-1 text-4xl font-semibold tabular-nums">{amount != null ? `$${Number(amount).toFixed(2)}` : <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.faint }} />}</p>
              <p className="m-0 mt-1 text-xs" style={{ color: C.muted }}>USD · no subscription</p>
            </div>

            {alreadyPaid ? (
              <div className="p-3 text-sm space-y-2" style={{ border: `1px solid rgba(52,211,153,.35)`, background: 'rgba(52,211,153,.06)' }}>
                <p className="m-0 flex items-center gap-1.5 font-semibold" style={{ color: C.ok }}><Check className="w-4 h-4" />Already paid</p>
                <a href={`/creator/login${project?.creatorAccount?.email ? `?email=${encodeURIComponent(project.creatorAccount.email)}` : ''}`} className="inline-flex items-center gap-1.5 text-sm font-semibold underline" style={{ color: C.text }}>Sign in to your workspace<ArrowRight className="w-3.5 h-3.5" /></a>
              </div>
            ) : paid ? (
              <div className="p-4 space-y-2" style={{ border: '1px solid rgba(52,211,153,.35)', background: 'rgba(52,211,153,.06)' }}>
                <p className="m-0 flex items-center gap-2 font-semibold" style={{ color: C.ok }}><Check className="w-5 h-5" />Payment successful</p>
                <p className="m-0 text-sm" style={{ color: C.body }}>{brand === 'card' ? 'Card' : brand[0].toUpperCase() + brand.slice(1)} ending {num.slice(-4)}. Taking you to create your account…</p>
              </div>
            ) : (
              <form onSubmit={pay} className="flex flex-col gap-3" noValidate>
                <label className="block">
                  <span className="text-xs font-semibold" style={{ color: C.body }}>Email for the receipt</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                    className="mt-1 w-full px-3 py-2.5 text-sm outline-none" style={inputStyle} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold" style={{ color: C.body }}>Name on card</span>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)} autoComplete="cc-name"
                    className="mt-1 w-full px-3 py-2.5 text-sm outline-none" style={inputStyle} />
                </label>
                <div>
                  <span className="text-xs font-semibold" style={{ color: C.body }}>Card details</span>
                  <div className="mt-1" style={{ border: '1px solid #26262b' }}>
                    <div className="relative">
                      <input value={card} onChange={(e) => setCard(fmtCard(e.target.value))} inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" aria-label="Card number"
                        className="w-full pl-3 pr-20 py-2.5 text-sm outline-none font-mono" style={{ ...inputStyle, border: 0, borderBottom: '1px solid #26262b' }} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider" style={{ color: num ? C.body : C.faint }}>{num ? brand : <CreditCard className="w-4 h-4" />}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <input value={exp} onChange={(e) => setExp(fmtExp(e.target.value))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" aria-label="Expiry date"
                        className="w-full px-3 py-2.5 text-sm outline-none font-mono" style={{ ...inputStyle, border: 0, borderRight: '1px solid #26262b' }} />
                      <input value={cvc} onChange={(e) => setCvc(digits(e.target.value).slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" aria-label="Security code"
                        className="w-full px-3 py-2.5 text-sm outline-none font-mono" style={{ ...inputStyle, border: 0 }} />
                    </div>
                  </div>
                </div>
                {error && <p role="alert" className="m-0 p-2.5 text-xs flex gap-1.5" style={{ color: '#ffb3c1', border: '1px solid rgba(255,77,109,.35)', background: 'rgba(255,77,109,.08)' }}><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}</p>}
                <button type="submit" disabled={busy || amount == null}
                  className="w-full py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: C.crimson, color: '#fff' }}>
                  {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Processing payment…</> : <><Lock className="w-4 h-4" />Pay {amount != null ? `$${Number(amount).toFixed(2)}` : ''}</>}
                </button>
                <p className="m-0 text-[11px] leading-relaxed flex items-center gap-1.5" style={{ color: C.faint }}><Lock className="w-3 h-3 shrink-0" />After paying you'll create your account with your email and a password.</p>
              </form>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
