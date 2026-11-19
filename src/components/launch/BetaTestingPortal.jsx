import { useEffect, useMemo, useState } from 'react'
import {
  Bug, Lightbulb, ShieldQuestion, LifeBuoy, Compass, Heart, Send, Loader2, Check, Star, Maximize2,
  MonitorPlay, MessageSquare, Lock, Sparkles, Clock,
} from 'lucide-react'
import { updatePageSEO } from '../../utils/seo'
import { getBetaSession, postBetaEvent, postBetaFeedback } from '../../services/opsApi'
import { compileSandboxPreviewDocument } from './CloudCodeStudio'
import { resolveProjectLanding } from '../../utils/projectLanding'

const CATEGORY_META = {
  Bug: { Icon: Bug, hint: 'Something broke or behaved wrongly', ph: 'What did you do, what happened, and what did you expect?' },
  'Feature request': { Icon: Lightbulb, hint: 'Something you wish it did', ph: 'What would you like it to do, and why would it help you?' },
  Objection: { Icon: ShieldQuestion, hint: 'A reason you might not use or pay', ph: 'What would stop you from using or paying for this?' },
  'Support question': { Icon: LifeBuoy, hint: "You're stuck or unsure how to do something", ph: 'What are you trying to do?' },
  'Onboarding / UX': { Icon: Compass, hint: 'Confusing screens, wording or steps', ph: 'Where did you get confused?' },
  Praise: { Icon: Heart, hint: 'Something you loved', ph: 'What worked really well for you?' },
}

function buildAccent(hex) {
  const h = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#c81e3c'
  const n = parseInt(h.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const light = (0.299 * r + 0.587 * g + 0.114 * b) > 160
  return { '--acc': h, '--acc-soft': `rgba(${r},${g},${b},.14)`, '--acc-line': `rgba(${r},${g},${b},.45)`, '--acc-ink': light ? '#0a0c10' : '#fff' }
}

export default function BetaTestingPortal({ slug }) {
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : ''
  const [session, setSession] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState('try')
  const [category, setCategory] = useState('Bug')
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [author, setAuthor] = useState('')
  const [sending, setSending] = useState(false)
  const [sentNote, setSentNote] = useState('')
  const [error, setError] = useState('')
  const [mine, setMine] = useState([])

  useEffect(() => {
    let alive = true
    getBetaSession(slug, token)
      .then((s) => {
        if (!alive) return
        setSession(s)
        setMine(s?.myFeedback || [])
        if (!s?.staging?.files?.length) setTab('feedback')
        postBetaEvent({ slug, token, type: 'open' }).catch(() => {})
      })
      .catch(() => alive && setLoadError("This beta link isn't active. Check the link in your invite email."))
    return () => { alive = false }
  }, [slug, token])

  const project = session?.project || {}
  const productName = project.productName || 'the beta'
  const landing = useMemo(() => resolveProjectLanding(project), [project])
  const accent = buildAccent(landing.brandColor)
  const staging = session?.staging
  const firstName = (session?.tester?.name || '').split(' ')[0]

  useEffect(() => {
    updatePageSEO({ title: `${productName} beta | CoLaunch`, description: `Try ${productName} early and tell the team what to fix.` })
  }, [productName])

  const previewDoc = useMemo(() => {
    if (!staging?.files?.length) return ''
    const entry = staging.files.find((f) => f.name === staging.entry) || staging.files[0]
    return compileSandboxPreviewDocument(entry, staging.files)
  }, [staging])

  const submit = async (e) => {
    e.preventDefault()
    if (message.trim().length < 3) { setError('Add a little more detail so the team can act on it.'); return }
    setSending(true); setError('')
    try {
      const res = await postBetaFeedback({ slug, token, author, category, rating: rating || null, message: message.trim() })
      setMine((m) => [res.feedback, ...m])
      setMessage(''); setRating(0)
      setSentNote(`Thanks${firstName ? `, ${firstName}` : ''}. The team sees this right away.`)
      setTimeout(() => setSentNote(''), 5000)
    } catch (err) {
      setError(err?.message || 'Could not send. Check your connection and try again.')
    } finally { setSending(false) }
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050506', color: '#e4e4e7' }}>
        <div className="max-w-md text-center space-y-3 p-8" style={{ border: '1px solid #27272a', background: '#0c0c0e' }}>
          <Lock className="w-6 h-6 mx-auto" style={{ color: '#a1a1aa' }} />
          <p className="m-0 text-lg font-semibold text-white">Beta link not found</p>
          <p className="m-0 text-sm" style={{ color: '#a1a1aa' }}>{loadError}</p>
        </div>
      </div>
    )
  }
  if (!session) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#050506' }}><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
  }

  const meta = CATEGORY_META[category]

  return (
    <div className="bp min-h-screen" style={{ ...accent, background: '#050506', color: '#e4e4e7', fontFamily: 'Roboto, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
        .bp .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
        .bp .card{background:#0c0c0e;border:1px solid #222227}
        .bp .in{width:100%;background:#050506;border:1px solid #2a2a30;color:#fff;padding:.75rem .9rem;font-size:.95rem;outline:none}
        .bp .in:focus{border-color:var(--acc)}
        .bp .tab{padding:.6rem .9rem;font-size:.875rem;font-weight:600;color:#a1a1aa;display:inline-flex;align-items:center;gap:.45rem;border-bottom:2px solid transparent;cursor:pointer}
        .bp .tab[aria-selected="true"]{color:#fff;border-color:var(--acc)}
        .bp .cat{display:flex;gap:.65rem;align-items:flex-start;text-align:left;padding:.8rem;border:1px solid #2a2a30;background:#050506;cursor:pointer}
        .bp .cat[aria-checked="true"]{border-color:var(--acc);background:var(--acc-soft)}
        .bp .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.8rem 1.2rem;font-weight:700;background:var(--acc);color:var(--acc-ink);border:0;cursor:pointer}
        .bp .btn:disabled{opacity:.5}
        .bp :focus-visible{outline:2px solid var(--acc);outline-offset:2px}
      `}</style>

      <header className="border-b" style={{ borderColor: '#1c1c20' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 flex items-center justify-center font-bold shrink-0" style={{ background: 'var(--acc)', color: 'var(--acc-ink)' }}>{productName.charAt(0)}</span>
            <div className="min-w-0">
              <p className="m-0 font-semibold text-white truncate">{productName} <span className="text-xs font-semibold px-1.5 py-0.5 ml-1" style={{ background: 'var(--acc-soft)', color: '#fff', border: '1px solid var(--acc-line)' }}>BETA {staging?.version || ''}</span></p>
              <p className="m-0 text-xs" style={{ color: '#a1a1aa' }}>{session.verified ? `Signed in as ${session.tester.name}` : 'Guest tester: use the link from your invite to be counted'}</p>
            </div>
          </div>
          <nav role="tablist" className="flex">
            <button role="tab" aria-selected={tab === 'try'} className="tab" onClick={() => setTab('try')}><MonitorPlay className="w-4 h-4" />Try it</button>
            <button role="tab" aria-selected={tab === 'feedback'} className="tab" onClick={() => setTab('feedback')}><MessageSquare className="w-4 h-4" />Feedback {mine.length ? `(${mine.length})` : ''}</button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {tab === 'try' && (
          <section className="space-y-4">
            <div>
              <h1 className="serif m-0 text-4xl sm:text-5xl text-white">{firstName ? `Welcome, ${firstName}.` : `Welcome to the ${productName} beta.`}</h1>
              <p className="m-0 mt-2 max-w-2xl" style={{ color: '#a1a1aa' }}>Use it like you would for real. When something breaks, confuses you, or is missing, tell us in the Feedback tab. Every report goes straight to the build team.</p>
            </div>
            {previewDoc ? (
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 text-xs" style={{ background: '#111114', borderBottom: '1px solid #222227', color: '#a1a1aa' }}>
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />Staging {staging.version} · deployed {new Date(staging.deployedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                  <button type="button" className="flex items-center gap-1 cursor-pointer" style={{ color: '#e4e4e7' }}
                    onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(previewDoc); w.document.close() } }}>
                    <Maximize2 className="w-3.5 h-3.5" />Full screen
                  </button>
                </div>
                <iframe title={`${productName} beta`} srcDoc={previewDoc} sandbox="allow-scripts allow-forms allow-modals allow-popups" className="w-full block" style={{ height: '72vh', background: '#fff', border: 0 }} />
              </div>
            ) : (
              <div className="card p-8 text-center space-y-2">
                <Sparkles className="w-6 h-6 mx-auto" style={{ color: 'var(--acc)' }} />
                <p className="m-0 font-semibold text-white">{session.verified ? 'The first build is on its way.' : 'Open your personal invite link to try the build.'}</p>
                <p className="m-0 text-sm" style={{ color: '#a1a1aa' }}>{session.verified ? "You'll get an email when the staging version is ready. You can already send ideas and questions." : 'Your link includes a personal token so your feedback is counted.'}</p>
              </div>
            )}
          </section>
        )}

        {tab === 'feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={submit} className="lg:col-span-7 card p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="serif m-0 text-3xl text-white">What should we know?</h2>
                <p className="m-0 mt-1 text-sm" style={{ color: '#a1a1aa' }}>Pick a type, then be specific. One report per issue works best.</p>
              </div>
              <div role="radiogroup" aria-label="Feedback type" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(CATEGORY_META).map(([name, { Icon, hint }]) => (
                  <button key={name} type="button" role="radio" aria-checked={category === name} className="cat" onClick={() => setCategory(name)}>
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: category === name ? 'var(--acc)' : '#a1a1aa' }} />
                    <span><span className="block text-sm font-semibold text-white">{name}</span><span className="block text-xs" style={{ color: '#a1a1aa' }}>{hint}</span></span>
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="block text-sm font-semibold mb-1.5 text-white">Details</span>
                <textarea className="in" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={meta.ph} />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1" aria-label="How is the beta so far?">
                  <span className="text-xs mr-1" style={{ color: '#a1a1aa' }}>Overall</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="p-0.5 cursor-pointer">
                      <Star className="w-5 h-5" style={{ color: n <= rating ? '#fbbf24' : '#3f3f46', fill: n <= rating ? '#fbbf24' : 'none' }} />
                    </button>
                  ))}
                </div>
                {!session.verified && (
                  <input className="in" style={{ maxWidth: 220 }} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name (optional)" />
                )}
              </div>
              {error && <p role="alert" className="m-0 text-sm" style={{ color: '#ff8fa3' }}>{error}</p>}
              {sentNote && <p role="status" className="m-0 text-sm flex items-center gap-1.5" style={{ color: '#34d399' }}><Check className="w-4 h-4" />{sentNote}</p>}
              <button type="submit" className="btn w-full" disabled={sending}>
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending</> : <><Send className="w-4 h-4" />Send {category.toLowerCase()}</>}
              </button>
            </form>

            <aside className="lg:col-span-5 card p-5 space-y-3">
              <p className="m-0 text-xs font-bold uppercase tracking-widest" style={{ color: '#71717a' }}>Your reports</p>
              {mine.length === 0 ? (
                <p className="m-0 text-sm" style={{ color: '#71717a' }}>Nothing yet. Your reports appear here.</p>
              ) : (
                <ul className="list-none m-0 p-0 space-y-2">
                  {mine.map((f) => {
                    const M = CATEGORY_META[f.category] || CATEGORY_META.Bug
                    return (
                      <li key={f.id} className="p-3" style={{ background: '#050506', border: '1px solid #222227' }}>
                        <p className="m-0 text-xs font-semibold flex items-center gap-1.5" style={{ color: '#a1a1aa' }}><M.Icon className="w-3.5 h-3.5" />{f.category}</p>
                        <p className="m-0 mt-1 text-sm whitespace-pre-wrap" style={{ color: '#e4e4e7' }}>{f.message}</p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
