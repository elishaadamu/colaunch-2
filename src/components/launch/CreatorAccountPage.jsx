import { useEffect, useState } from 'react'
import { Loader2, Check, AlertTriangle, Mail, Lock, User, Eye, EyeOff, ArrowRight, LogOut } from 'lucide-react'
import { confirmDiyPayment, creatorSignup, creatorLogin, creatorMe, getCreatorSession, setCreatorSession } from '../../services/opsApi'

// /creator/signup?session_id=…  after paying for the DIY pass
// /creator/login                 email + password, then into the creator's workspace

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
.ca{font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
.ca .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.ca input{background:#050506;border:1px solid #2a2a30;color:#f4f4f5;outline:none;width:100%;padding:.75rem .75rem .75rem 2.4rem;font-size:.9375rem}
.ca input:focus{border-color:#c81e3c}
.ca .btn{display:flex;align-items:center;justify-content:center;gap:.5rem;width:100%;padding:.8rem 1rem;font-weight:600;font-size:.9375rem;background:#c81e3c;color:#fff;cursor:pointer;border:0}
.ca .btn:hover:not(:disabled){background:#d92a49}
.ca .btn:disabled{opacity:.5;cursor:not-allowed}
`
const clean = (m) => String(m || '').replace(/^\d{3}:\s*/, '')

function Field({ icon: I, label, children, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#d4d4d8]">{label}</span>
      <div className="relative mt-1.5">
        <I className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" aria-hidden="true" />
        {children}
      </div>
      {hint && <span className="block mt-1 text-xs text-[#71717a]">{hint}</span>}
    </label>
  )
}

function Shell({ eyebrow, title, sub, children }) {
  return (
    <div className="ca min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#050506', color: '#f4f4f5' }}>
      <style>{CSS}</style>
      <div className="w-full max-w-md">
        <a href="/" className="block mb-8 text-sm font-bold tracking-[0.18em] uppercase text-white no-underline">Co<span style={{ color: '#c81e3c' }}>Launch</span></a>
        <div className="p-6 sm:p-8" style={{ background: '#0f0f12', border: '1px solid #26262b' }}>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff8fa3]">{eyebrow}</p>
          <h1 className="serif m-0 mt-2 text-4xl leading-tight text-white">{title}</h1>
          {sub && <p className="m-0 mt-2 text-sm text-[#a1a1aa]">{sub}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

const ErrorBox = ({ children }) => children ? (
  <p role="alert" className="m-0 p-3 text-sm flex gap-2" style={{ color: '#ffb3c1', border: '1px solid rgba(255,77,109,.35)', background: 'rgba(255,77,109,.08)' }}><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{children}</p>
) : null

function PasswordInput({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required style={{ paddingRight: '2.6rem' }} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 cursor-pointer text-[#a1a1aa] hover:text-white">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </>
  )
}

function Signup() {
  const sessionId = new URLSearchParams(window.location.search).get('session_id') || ''
  const [pay, setPay] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) { setLoadErr('This link is missing the payment reference. Open the DIY pass from your portal again.'); return undefined }
    let tries = 0, stop = false
    // Stripe can take a few seconds to mark the session paid; check again before giving up.
    const check = () => confirmDiyPayment(sessionId).then((r) => {
      if (stop) return
      if (r.paid || tries >= 4) { setPay(r); setName((n) => n || r.name || ''); setEmail((e) => e || r.email || '') } else { tries += 1; setTimeout(check, 2500) }
    }).catch((e) => !stop && setLoadErr(clean(e.message)))
    check()
    return () => { stop = true }
  }, [sessionId])

  const problems = [
    password && password.length < 10 && 'at least 10 characters',
    password && !(/[A-Za-z]/.test(password) && /\d/.test(password)) && 'letters and numbers',
  ].filter(Boolean)

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('The two passwords don’t match.'); return }
    if (problems.length) { setError(`Password needs ${problems.join(' and ')}.`); return }
    setBusy(true); setError('')
    try {
      const r = await creatorSignup({ sessionId, name: name.trim(), email: email.trim(), password })
      window.location.assign(`/creator/login?email=${encodeURIComponent(r.email)}&created=1${r.emailed ? '&emailed=1' : ''}`)
    } catch (err) { setError(clean(err.message)); setBusy(false) }
  }

  if (loadErr) return <Shell eyebrow="DIY pass" title="We couldn’t confirm the payment"><ErrorBox>{loadErr}</ErrorBox></Shell>
  if (!pay) return <Shell eyebrow="DIY pass" title="Confirming your payment…"><p className="m-0 text-sm text-[#a1a1aa] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Checking your payment.</p></Shell>
  if (!pay.paid) return <Shell eyebrow="DIY pass" title="Payment not completed" sub="This payment hasn’t gone through. Go back to your portal and try again."><a className="btn no-underline" href="/">Back</a></Shell>
  if (pay.claimed) return <Shell eyebrow="DIY pass" title="Your account already exists" sub="An account was already created with this payment."><a className="btn no-underline" href="/creator/login">Sign in<ArrowRight className="w-4 h-4" /></a></Shell>

  return (
    <Shell eyebrow={`Paid · $${Number(pay.amount || 0).toFixed(2)} · ${pay.project?.productName || ''}`} title="Create your account" sub="You’ll use this email and password to sign in to your workspace.">
      <form onSubmit={submit} className="space-y-4">
        <Field icon={User} label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={80} /></Field>
        <Field icon={Mail} label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
        <Field icon={Lock} label="Password" hint="At least 10 characters, with letters and numbers."><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
        <Field icon={Lock} label="Confirm password"><PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
        <ErrorBox>{error}</ErrorBox>
        <button type="submit" className="btn" disabled={busy || !name.trim() || !email.trim() || !password || !confirm}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Create account</button>
        <p className="m-0 text-center text-sm text-[#a1a1aa]">Already have an account? <a href="/creator/login" className="text-white underline">Sign in</a></p>
      </form>
    </Shell>
  )
}

function Login() {
  const sp = new URLSearchParams(window.location.search)
  const [email, setEmail] = useState(sp.get('email') || '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState(null)
  const [session, setSession] = useState(() => getCreatorSession())
  const next = sp.get('next')

  const go = (list) => {
    const target = next && next.startsWith('/portal/') ? next : list.length === 1 ? list[0].portalPath : null
    if (target) window.location.assign(target)
    else setProjects(list)
  }

  // Already signed in: show their projects (or go straight in)
  useEffect(() => {
    if (!session) return
    creatorMe().then((r) => go(r.projects || [])).catch(() => { setCreatorSession(null); setSession(null) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const f = e.currentTarget
      const em = (email || f.querySelector('input[type=email]')?.value || '').trim()
      const pw = password || f.querySelector('input[autocomplete=current-password]')?.value || ''
      const r = await creatorLogin(em, pw)
      const s = { token: r.token, user: r.user, expiresAt: Date.now() + (r.expiresIn || 0) * 1000 }
      setCreatorSession(s); setSession(s)
      go(r.projects || [])
    } catch (err) { setError(clean(err.message)); setBusy(false) }
  }

  if (projects) {
    return (
      <Shell eyebrow={`Signed in · ${session?.user?.email || ''}`} title="Your projects">
        {projects.length ? (
          <ul className="list-none m-0 p-0 space-y-2">{projects.map((p) => (
            <li key={p.id}><a href={p.portalPath} className="flex items-center justify-between gap-3 p-4 no-underline text-white hover:border-[#c81e3c]" style={{ background: '#0a0a0c', border: '1px solid #26262b' }}>
              <span><span className="block font-semibold">{p.productName || p.id}</span><span className="block text-xs text-[#a1a1aa]">{p.creatorName}</span></span><ArrowRight className="w-4 h-4" /></a></li>
          ))}</ul>
        ) : <p className="m-0 text-sm text-[#a1a1aa]">No projects are linked to this account yet.</p>}
        <button type="button" className="mt-5 text-sm text-[#a1a1aa] hover:text-white flex items-center gap-1.5 cursor-pointer" onClick={() => { setCreatorSession(null); setSession(null); setProjects(null) }}><LogOut className="w-4 h-4" />Sign out</button>
      </Shell>
    )
  }

  return (
    <Shell eyebrow="Creator workspace" title="Sign in" sub="Use the email and password you created after paying for the DIY pass.">
      {sp.get('created') && (
        <p className="m-0 mb-4 p-3 text-sm flex gap-2" style={{ color: '#a7f3d0', border: '1px solid rgba(52,211,153,.35)', background: 'rgba(52,211,153,.06)' }}>
          <Check className="w-4 h-4 shrink-0 mt-0.5" />Account created.{sp.get('emailed') ? ' We sent a confirmation to your email.' : ''} Sign in to continue.
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field icon={Mail} label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
        <Field icon={Lock} label="Password"><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
        <ErrorBox>{error}</ErrorBox>
        <button type="submit" className="btn" disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Sign in</button>
      </form>
    </Shell>
  )
}

export default function CreatorAccountPage({ mode }) {
  return mode === 'signup' ? <Signup /> : <Login />
}
