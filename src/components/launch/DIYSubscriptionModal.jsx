import { useEffect, useState } from 'react'
import { X, Lock, ArrowRight, Loader2, CreditCard, UserPlus, LogIn, Check, AlertTriangle, Layers, Wand2, Rocket } from 'lucide-react'
import { getDiyPrice, startDiyCheckout } from '../../services/opsApi'

// DIY pass: the creator pays on Stripe's hosted checkout, then creates an account
// (name, email, password) at /creator/signup and signs in at /creator/login.
// Nothing is unlocked in the browser; the server unlocks the project once Stripe confirms the payment.

const C = {
  sheet: '#0f0f12', row: '#0a0a0c', line: '#26262b', text: '#f4f4f5', body: '#d4d4d8', muted: '#a1a1aa', faint: '#71717a',
  crimson: '#c81e3c', crimsonText: '#ff8fa3', ok: '#34d399',
}

const clean = (m) => String(m || '').replace(/^\d{3}:\s*/, '')

export default function DIYSubscriptionModal({ isOpen, onClose, project, passPrice }) {
  const [price, setPrice] = useState(null)
  const [email, setEmail] = useState(project?.creatorEmail || '')
  const [busy, setBusy] = useState(false)
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
  const alreadyPaid = Boolean(project?.diySubscription?.active && project?.diySubscription?.paymentMethod === 'Stripe')

  const pay = async () => {
    if (!project?.id || busy) return
    setBusy(true); setError('')
    try {
      const r = await startDiyCheckout(project.id, email.trim())
      try { localStorage.setItem(`colaunch_diy_session_${project.id}`, r.sessionId) } catch { /* storage unavailable */ }
      window.location.assign(r.checkoutUrl)
    } catch (e) {
      setError(clean(e.message)); setBusy(false)
    }
  }

  const steps = [
    [CreditCard, 'Pay on Stripe', 'Secure checkout hosted by Stripe. Card, Apple Pay and Google Pay.'],
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
            ) : (
              <>
                <label className="block">
                  <span className="text-xs font-semibold" style={{ color: C.body }}>Email for the receipt</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                    className="mt-1 w-full px-3 py-2.5 text-sm outline-none" style={{ background: '#050506', border: `1px solid ${C.line}`, color: C.text }} />
                </label>
                {error && <p className="m-0 p-2.5 text-xs flex gap-1.5" style={{ color: '#ffb3c1', border: '1px solid rgba(255,77,109,.35)', background: 'rgba(255,77,109,.08)' }}><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}</p>}
                <button type="button" onClick={pay} disabled={busy || amount == null}
                  className="w-full py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: C.crimson, color: '#fff' }}>
                  {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Opening Stripe…</> : <><Lock className="w-4 h-4" />Continue to secure checkout<ArrowRight className="w-4 h-4" /></>}
                </button>
                <p className="m-0 text-[11px] leading-relaxed" style={{ color: C.faint }}>
                  You'll pay on Stripe, then come back here to create your account.{price?.stripe === 'test' ? ' Stripe is in test mode: use card 4242 4242 4242 4242.' : ''}
                </p>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
