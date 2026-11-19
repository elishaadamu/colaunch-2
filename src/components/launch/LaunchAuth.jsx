import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import {
  Lock,
  User,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Mail,
  Check,
  Building2,
  Sparkles
} from 'lucide-react'
import CoLaunchLogo from '../ui/CoLaunchLogo'
import { creatorLogin, setCreatorSession } from '../../services/opsApi'

const LAUNCH_AUTH_SESSION_KEY = 'forge_launch_auth_token'
const LAUNCH_AUTH_EMAIL_KEY = 'forge_launch_auth_email'
const LAUNCH_AUTH_TIMESTAMP_KEY = 'forge_launch_auth_timestamp'
const ONE_HOUR_MS = 60 * 60 * 1000 // 1 hour expiration (3,600,000 ms)

export const LaunchAuthContext = createContext(null)
export const useLaunchAuth = () => useContext(LaunchAuthContext)

export function isLaunchAuthenticated() {
  try {
    const token = localStorage.getItem(LAUNCH_AUTH_SESSION_KEY)
    const email = localStorage.getItem(LAUNCH_AUTH_EMAIL_KEY)
    const timestampStr = localStorage.getItem(LAUNCH_AUTH_TIMESTAMP_KEY)
    if (!token || !email || !timestampStr) return false

    const ts = parseInt(timestampStr, 10)
    if (isNaN(ts) || Date.now() - ts > ONE_HOUR_MS) {
      logoutLaunchAuth()
      return false
    }
    return true
  } catch {
    return false
  }
}

export function logoutLaunchAuth() {
  try {
    localStorage.removeItem(LAUNCH_AUTH_SESSION_KEY)
    localStorage.removeItem(LAUNCH_AUTH_EMAIL_KEY)
    localStorage.removeItem(LAUNCH_AUTH_TIMESTAMP_KEY)
    localStorage.removeItem('forge_launch_auth_user')
  } catch (e) {
    console.warn('[LaunchAuth] Logout error:', e)
  }
}

export default function LaunchAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isLaunchAuthenticated())
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  // Who is signing in: the studio team (operator console) or a creator (their own launch workspace)
  const [audience, setAudience] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('as') === 'creator' ? 'creator' : 'studio' } catch { return 'studio' }
  })
  const isCreator = audience === 'creator'
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Periodic expiration watcher: check every 10 seconds for session timeout
  useEffect(() => {
    const checkExpiration = () => {
      const authenticated = isLaunchAuthenticated()
      if (!authenticated && isAuthenticated) {
        setIsAuthenticated(false)
        setError('Session expired. Please sign in again.')
      }
    }

    const interval = setInterval(checkExpiration, 10000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // `token` is the signed operator session token issued by /api/auth/launch-login.
  const establishLaunchSession = (cleanEmail, token) => {
    localStorage.setItem(LAUNCH_AUTH_SESSION_KEY, token)
    localStorage.setItem(LAUNCH_AUTH_EMAIL_KEY, cleanEmail || 'admin@colaunch.com')
    localStorage.setItem(LAUNCH_AUTH_TIMESTAMP_KEY, Date.now().toString())
    localStorage.setItem('forge_launch_auth_user', JSON.stringify({ email: cleanEmail || 'admin@colaunch.com', role: 'operator_admin' }))
    localStorage.setItem('forge_active_session', 'true')
    localStorage.setItem('forge_login_timestamp', Date.now().toString())

    let existingProfile = {}
    try {
      existingProfile = JSON.parse(localStorage.getItem('forge_user_profile') || '{}')
    } catch (e) {}

    const isRealEmail = cleanEmail && cleanEmail.includes('@') && cleanEmail !== 'creatorforgeweb@gmail.com'

    localStorage.setItem(
      'forge_user_profile',
      JSON.stringify({
        ...existingProfile,
        username: existingProfile.username || (isRealEmail ? cleanEmail.split('@')[0] : 'admin'),
        email: isRealEmail ? cleanEmail : (existingProfile.email || 'admin@colaunch.com'),
        role: 'operator_admin',
        needsCredentials: existingProfile.needsCredentials ?? !isRealEmail
      })
    )

    setTimeout(() => {
      setIsAuthenticated(true)
      setLoading(false)
    }, 200)
  }

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setError('')

    // Browser autofill fills the inputs without firing onChange, so read the fields themselves too
    const form = e?.currentTarget
    const cleanIdentifier = (identifier || form?.querySelector('#auth-email')?.value || '').trim().toLowerCase()
    const cleanPass = password || form?.querySelector('#auth-password')?.value || ''

    if (!cleanIdentifier) {
      setError('Please enter your username or email.')
      return
    }
    if (!cleanPass) {
      setError('Please enter your password.')
      return
    }

    if (isCreator) {
      setLoading(true)
      try {
        const r = await creatorLogin(cleanIdentifier, cleanPass)
        setCreatorSession({ token: r.token, user: r.user, expiresAt: Date.now() + (r.expiresIn || 0) * 1000 })
        const list = r.projects || []
        window.location.assign(list.length === 1 ? list[0].portalPath : '/creator/login')
      } catch (err) {
        setError(String(err?.message || 'Sign-in failed').replace(/^\d{3}:\s*/, ''))
        setLoading(false)
      }
      return
    }

    setLoading(true)

    try {
      // Call backend auth API
      const res = await fetch('/api/auth/launch-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanIdentifier,
          password: cleanPass
        })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.status === 'success' && data.token) {
        establishLaunchSession(data.user?.email || cleanIdentifier, data.token)
        return
      }

      setError(data.detail || 'Invalid email or password.')
      setLoading(false)
    } catch (err) {
      setError('Could not reach the server. Please try again.')
      setLoading(false)
    }
  }



  const handleSignup = async (e) => {
    if (e) e.preventDefault()
    setError('')
    const cleanEmail = identifier.trim().toLowerCase()
    if (!fullName.trim()) return setError('Please enter your name.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) return setError('Please enter a valid email address.')
    if (password.length < 10) return setError('Password must be at least 10 characters.')
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError('Password must contain both letters and numbers.')
    if (password !== confirmPassword) return setError("Passwords don't match.")

    setLoading(true)
    try {
      const res = await fetch('/api/auth/operator-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: cleanEmail,
          password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.status === 'success' && data.token) {
        establishLaunchSession(data.user?.email || cleanEmail, data.token)
        return
      }
      const detail = Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(', ') : data.detail
      setError(detail || 'Could not create your account.')
      setLoading(false)
    } catch (err) {
      setError('Could not reach the server. Please try again.')
      setLoading(false)
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  const passwordChecks = [
    { label: '10+ characters', ok: password.length >= 10 },
    { label: 'Letters & numbers', ok: /[A-Za-z]/.test(password) && /\d/.test(password) },
    { label: 'Passwords match', ok: confirmPassword.length > 0 && password === confirmPassword },
  ]

  const logout = useCallback(() => {
    logoutLaunchAuth()
    setIsAuthenticated(false)
    setPassword('')
  }, [])

  if (isAuthenticated) {
    return (
      <LaunchAuthContext.Provider value={{ isAuthenticated, logout, operatorEmail: identifier || '' }}>
        {children}
      </LaunchAuthContext.Provider>
    )
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#050506] text-white selection:bg-[#C81E3C] selection:text-white font-sans">

      {/* ── LEFT: FULL-BLEED IMAGE PANEL ── */}
      <div className="relative hidden lg:block overflow-hidden h-full min-h-screen bg-[#030304]">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = '/images/hero_saas_macbook.jpg'
          }}
          alt="Engineering team collaborating in modern workspace"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        {/* Dark overlay with soft gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050506]/70 via-[#050506]/20 to-[#050506]/90 pointer-events-none" />

        {/* CoLaunch branding */}
        <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
          <CoLaunchLogo size={24} theme="dark" showWordmark={true} />
        </div>

        {/* Caption text */}
        <div className="absolute bottom-0 left-0 right-0 p-10 z-10 space-y-3">
          <span className="inline-block px-2.5 py-0.5 rounded-none text-[10px] font-mono font-bold text-[#FF8FA3] bg-[#C81E3C]/15 border border-[#C81E3C]/45 uppercase tracking-wider">
            {isCreator ? 'CREATOR' : 'STUDIO'}
          </span>
          <h2 className="text-4xl text-white leading-[1.05] m-0" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            {isCreator ? <>Your audience.<br />Your product.</> : <>Build Products.<br />Share Ownership.</>}
          </h2>
          <p className="text-sm text-[#D4D4D8] max-w-sm leading-relaxed">
            {isCreator ? 'Validate, build and launch your product with the AI advising at every step.' : '50/50 co-founder partnerships powered by AI sprint workflows.'}
          </p>
        </div>
      </div>

      {/* ── RIGHT: DARK MODE LOGIN FORM ── */}
      <div className="flex flex-col justify-between bg-[#050506] border-l border-[#222227] min-h-screen p-6 sm:p-10 lg:p-14 relative">
        {/* Subtle ambient corner glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C81E3C]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between w-full relative z-10 mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-[#71717A]">
            {isCreator ? 'Creator workspace' : 'Operator console'}
          </span>

          {/* Mobile-only logo */}
          <div className="lg:hidden">
            <CoLaunchLogo size={20} theme="dark" showWordmark={true} />
          </div>
        </div>

        {/* Form inner (vertically centered) */}
        <div className="w-full max-w-sm mx-auto my-auto relative z-10 space-y-6">

          {/* Who's signing in */}
          <div>
            <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">Sign in as</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Sign in as">
              {[
                { id: 'studio', label: 'Studio team', sub: 'Operator console', Icon: Building2 },
                { id: 'creator', label: 'Creator', sub: 'My launch workspace', Icon: Sparkles },
              ].map((a) => (
                <button key={a.id} type="button" role="radio" aria-checked={audience === a.id}
                  onClick={() => { setAudience(a.id); setError(''); if (a.id === 'creator') setMode('signin') }}
                  className={`p-3 text-left flex items-start gap-2.5 border transition-colors cursor-pointer ${audience === a.id ? 'border-[#C81E3C] bg-[#C81E3C]/10' : 'border-[#222227] bg-[#0C0C0E] hover:border-[#3f3f46]'}`}>
                  <a.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${audience === a.id ? 'text-[#FF8FA3]' : 'text-[#71717A]'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{a.label}</span>
                    <span className="block text-[11px] text-[#A1A1AA]">{a.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sign in / Create account switch (studio only: creators get an account after the DIY pass) */}
          {!isCreator && <div className="grid grid-cols-2 p-1 bg-[#0C0C0E] border border-[#222227]" role="tablist" aria-label="Account">
            {[
              { id: 'signin', label: 'Sign in' },
              { id: 'signup', label: 'Create account' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={mode === t.id}
                onClick={() => switchMode(t.id)}
                className={`h-9 text-xs font-bold transition-colors cursor-pointer ${
                  mode === t.id
                    ? 'bg-gradient-to-b from-[#d62546] to-[#ad1833] text-white'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>}

          {/* Heading */}
          <div key={mode} className="acq-pop">
            <h1 className="text-4xl text-white m-0 leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              {isCreator ? 'Welcome back, creator' : mode === 'signin' ? 'Welcome back' : 'Create your operator account'}
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-2 mb-0">
              {isCreator
                ? 'Sign in with the email and password you created after getting your DIY pass.'
                : mode === 'signin'
                  ? 'Sign in to the CoLaunch studio.'
                  : 'Set up your login for the CoLaunch studio.'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div role="alert" className="acq-pop p-3 bg-[#C81E3C]/10 border border-[#C81E3C]/45 text-[#FF8FA3] text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-[#FF4D6D] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={mode === 'signin' ? handleLogin : handleSignup} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <div className="acq-pop">
                <label htmlFor="auth-name" className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">Full name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 text-sm font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                {isCreator ? 'Email' : mode === 'signin' ? 'Username or email' : 'Work email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type={mode === 'signin' ? 'text' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={mode === 'signin' ? 'you@company.com' : 'you@company.com'}
                  autoComplete={mode === 'signin' ? 'username' : 'email'}
                  className="w-full pl-10 pr-4 py-3 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signin' ? 'Your password' : 'At least 10 characters'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full pl-10 pr-10 py-3 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white transition cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div className="acq-pop">
                  <label htmlFor="auth-confirm" className="block text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">Confirm password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-3 text-sm font-medium"
                    />
                  </div>
                  <ul className="list-none m-0 mt-2 p-0 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                    {passwordChecks.map((c) => (
                      <li key={c.label} className={`inline-flex items-center gap-1.5 transition-colors ${c.ok ? 'text-emerald-400' : 'text-[#71717A]'}`}>
                        {c.ok ? <Check className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#3f3f46]" />}
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="acq-btn-primary w-full mt-2 py-3.5 px-4 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign in' : 'Create account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-[#A1A1AA] text-center mt-6 mb-0">
            {isCreator ? (
              <>No account yet? Open your portal link and get the DIY pass; you create your account right after paying.</>
            ) : mode === 'signin' ? (
              <>New to the studio?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-white font-semibold underline-offset-2 hover:underline cursor-pointer">Create an account</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="text-white font-semibold underline-offset-2 hover:underline cursor-pointer">Sign in</button>
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="w-full text-center text-xs text-[#52525B] font-mono py-4 border-t border-[#222227]/60 relative z-10 mt-8">
          © 2026 CoLaunch
        </div>

      </div>

    </div>
  )
}
