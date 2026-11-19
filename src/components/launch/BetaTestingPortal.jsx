import { useEffect, useMemo, useState } from 'react'
import {
  Bug, Lightbulb, ShieldQuestion, LifeBuoy, Compass, Heart, Send, Loader2, Check, Star, Maximize2,
  MonitorPlay, MessageSquare, Lock, Sparkles, Clock,
} from 'lucide-react'
import { updatePageSEO } from '../../utils/seo'
import { getBetaSession, postBetaEvent, postBetaFeedback } from '../../services/opsApi'
import { compileSandboxPreviewDocument } from './CloudCodeStudio'
import { buildStudioDocument } from '../../utils/studioRuntime'
import CoLaunchLogo from '../ui/CoLaunchLogo'

const CATEGORY_META = {
  Bug: { Icon: Bug, hint: 'Something broke or behaved wrongly', ph: 'What did you do, what happened, and what did you expect?' },
  'Feature request': { Icon: Lightbulb, hint: 'Something you wish it did', ph: 'What would you like it to do, and why would it help you?' },
  Objection: { Icon: ShieldQuestion, hint: 'A reason you might not use or pay', ph: 'What would stop you from using or paying for this?' },
  'Support question': { Icon: LifeBuoy, hint: "You're stuck or unsure how to do something", ph: 'What are you trying to do?' },
  'Onboarding / UX': { Icon: Compass, hint: 'Confusing screens, wording or steps', ph: 'Where did you get confused?' },
  Praise: { Icon: Heart, hint: 'Something you loved', ph: 'What worked really well for you?' },
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
        if (!s?.staging?.files?.length && !s?.staging?.url) setTab('feedback')
        postBetaEvent({ slug, token, type: 'open' }).catch(() => {})
      })
      .catch(() => alive && setLoadError("This beta link isn't active. Check the link in your invite email."))
    return () => { alive = false }
  }, [slug, token])

  const project = session?.project || {}
  const productName = project.productName || 'the beta'
  const staging = session?.staging
  const firstName = (session?.tester?.name || '').split(' ')[0]

  useEffect(() => {
    updatePageSEO({ title: `${productName} beta | CoLaunch`, description: `Try ${productName} early and tell the team what to fix.` })
  }, [productName])

  const previewDoc = useMemo(() => {
    if (staging?.url) return ''
    if (!staging?.files?.length) return ''
    if (staging.runtime === 'studio') return buildStudioDocument(staging.files.map((f) => ({ path: f.name, content: f.content })), { title: productName })
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
  const hasBuild = Boolean((staging?.url && session.verified) || previewDoc)
  const deployed = staging?.deployedAt ? new Date(staging.deployedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''
  const openFull = () => {
    if (staging?.url) { window.open(staging.url, '_blank', 'noopener'); return }
    const w = window.open('', '_blank'); if (w) { w.document.write(previewDoc); w.document.close() }
  }
  const counts = mine.reduce((m, f) => ({ ...m, [f.category]: (m[f.category] || 0) + 1 }), {})

  return (
    <div className="bp min-h-screen flex flex-col" style={{ background: '#050506', color: '#e4e4e7', fontFamily: 'Roboto, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
        .bp{--acc:#c81e3c;--acc-soft:rgba(200,30,60,.12);--acc-line:rgba(200,30,60,.5)}
        .bp .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
        .bp .card{background:#0c0c0e;border:1px solid #222227}
        .bp .lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#71717a}
        .bp .in{width:100%;background:#050506;border:1px solid #2a2a30;color:#fff;padding:.75rem .9rem;font-size:.95rem;outline:none;resize:vertical}
        .bp .in:focus{border-color:var(--acc)}
        .bp .tab{padding:.55rem 1rem;font-size:.85rem;font-weight:600;color:#a1a1aa;display:inline-flex;align-items:center;gap:.45rem;background:transparent;border:0;cursor:pointer}
        .bp .tab[aria-selected="true"]{color:#fff;background:#18181b;box-shadow:inset 0 -2px 0 var(--acc)}
        .bp .cat{display:flex;gap:.6rem;align-items:flex-start;text-align:left;padding:.7rem .75rem;border:1px solid #2a2a30;background:#050506;cursor:pointer;transition:border-color .15s}
        .bp .cat:hover{border-color:#3f3f46}
        .bp .cat[aria-checked="true"]{border-color:var(--acc);background:var(--acc-soft)}
        .bp .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.8rem 1.2rem;font-weight:700;font-size:.9rem;background:var(--acc);color:#fff;border:0;cursor:pointer}
        .bp .btn:hover{background:#a8182f}
        .bp .btn:disabled{opacity:.5;cursor:not-allowed}
        .bp .ghost{display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .7rem;font-size:.78rem;font-weight:600;color:#e4e4e7;background:transparent;border:1px solid #2a2a30;cursor:pointer}
        .bp .ghost:hover{border-color:#52525b}
        .bp :focus-visible{outline:2px solid var(--acc);outline-offset:2px}
      `}</style>

      <header className="sticky top-0 z-20" style={{ background: 'rgba(5,5,6,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1c1c20' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:inline-flex"><CoLaunchLogo size={20} theme="dark" showWordmark={false} /></span>
            <span className="hidden sm:block w-px h-6" style={{ background: '#27272a' }} />
            <p className="m-0 font-semibold text-white truncate">{productName}</p>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 shrink-0" style={{ color: '#ff8fa3', background: 'var(--acc-soft)', border: '1px solid var(--acc-line)' }}>BETA{staging?.version ? ` ${staging.version}` : ''}</span>
          </div>
          <nav role="tablist" aria-label="Beta" className="flex shrink-0" style={{ border: '1px solid #222227' }}>
            <button role="tab" aria-selected={tab === 'try'} className="tab" onClick={() => setTab('try')}><MonitorPlay className="w-4 h-4" /><span className="hidden sm:inline">Try the build</span><span className="sm:hidden">Try</span></button>
            <button role="tab" aria-selected={tab === 'feedback'} className="tab" onClick={() => setTab('feedback')}><MessageSquare className="w-4 h-4" />Feedback{mine.length ? <span className="text-[10px] font-mono px-1" style={{ background: 'var(--acc)', color: '#fff' }}>{mine.length}</span> : null}</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="lbl m-0">{session.verified ? `Signed in as ${session.tester.name}` : 'Guest tester'}</p>
            <h1 className="serif m-0 mt-2 text-4xl sm:text-5xl text-white leading-[1.05]">
              {tab === 'try' ? (firstName ? `Welcome, ${firstName}.` : `Welcome to the ${productName} beta.`) : 'What should we know?'}
            </h1>
            <p className="m-0 mt-3 text-[15px] leading-relaxed" style={{ color: '#a1a1aa' }}>
              {tab === 'try'
                ? 'Use it like you would for real. When something breaks, confuses you or is missing, send it in. Every report goes straight to the build team.'
                : 'Pick a type, then be specific. One report per issue works best.'}
            </p>
          </div>
          <ol className="list-none m-0 p-0 grid grid-cols-3 shrink-0" style={{ border: '1px solid #222227' }}>
            {[['1', 'Try it'], ['2', 'Spot issues'], ['3', 'Report']].map(([n, t], i) => (
              <li key={n} className="px-4 py-3" style={{ borderLeft: i ? '1px solid #222227' : 0 }}>
                <span className="block font-mono text-[11px]" style={{ color: '#ff4d6d' }}>0{n}</span>
                <span className="block text-sm font-semibold text-white whitespace-nowrap">{t}</span>
              </li>
            ))}
          </ol>
        </section>

        {!session.verified && (
          <p className="m-0 p-3 text-sm flex items-start gap-2" style={{ border: '1px solid #27272a', background: '#0c0c0e', color: '#a1a1aa' }}>
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />Open the personal link from your invite email so your feedback is counted and you can try the build.
          </p>
        )}

        {tab === 'try' && (
          <section className="space-y-4">
            {hasBuild ? (
              <div className="card overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2" style={{ background: '#111114', borderBottom: '1px solid #222227' }}>
                  <span className="flex gap-1.5 shrink-0">{[0, 1, 2].map((i) => <span key={i} className="w-2.5 h-2.5" style={{ background: '#27272a' }} />)}</span>
                  <span className="flex-1 min-w-0 truncate text-xs font-mono px-2 py-1" style={{ background: '#050506', color: '#71717a', border: '1px solid #1c1c20' }}>
                    {staging?.url && session.verified ? staging.url : `${productName.toLowerCase().replace(/\s+/g, '')} · staging`}
                  </span>
                  <span className="hidden md:flex items-center gap-1.5 text-xs shrink-0" style={{ color: '#71717a' }}><Clock className="w-3 h-3" />{staging?.version}{deployed ? ` · ${deployed}` : ''}</span>
                  <button type="button" className="ghost shrink-0" onClick={openFull}><Maximize2 className="w-3.5 h-3.5" />Full screen</button>
                </div>
                {staging?.url && session.verified
                  ? <iframe title={`${productName} beta`} src={staging.url} className="w-full block" style={{ height: '72vh', background: '#fff', border: 0 }} />
                  : <iframe title={`${productName} beta`} srcDoc={previewDoc} sandbox="allow-scripts allow-forms allow-modals allow-popups" className="w-full block" style={{ height: '72vh', background: '#fff', border: 0 }} />}
              </div>
            ) : (
              <div className="card p-10 text-center space-y-3">
                <Sparkles className="w-6 h-6 mx-auto" style={{ color: '#ff4d6d' }} />
                <p className="serif m-0 text-2xl text-white">{session.verified ? 'The first build is on its way.' : 'Open your personal invite link to try the build.'}</p>
                <p className="m-0 text-sm max-w-md mx-auto" style={{ color: '#a1a1aa' }}>{session.verified ? "You'll get an email when the staging version is ready. You can already send ideas and questions." : 'Your link includes a personal token so your feedback is counted.'}</p>
                <button type="button" className="btn mt-2" onClick={() => setTab('feedback')}><MessageSquare className="w-4 h-4" />Send feedback</button>
              </div>
            )}
            {hasBuild && (
              <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="m-0 text-sm" style={{ color: '#a1a1aa' }}>Found something? Report it while it's fresh.</p>
                <button type="button" className="btn" onClick={() => setTab('feedback')}><MessageSquare className="w-4 h-4" />Send feedback</button>
              </div>
            )}
          </section>
        )}

        {tab === 'feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={submit} className="lg:col-span-8 card p-5 sm:p-6 space-y-6">
              <div>
                <p className="lbl m-0 mb-2.5">1 · Type</p>
                <div role="radiogroup" aria-label="Feedback type" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(CATEGORY_META).map(([name, { Icon, hint }]) => (
                    <button key={name} type="button" role="radio" aria-checked={category === name} className="cat" onClick={() => setCategory(name)}>
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: category === name ? '#ff4d6d' : '#71717a' }} />
                      <span className="min-w-0"><span className="block text-sm font-semibold text-white">{name}</span><span className="block text-[11px] leading-snug" style={{ color: '#a1a1aa' }}>{hint}</span></span>
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="lbl block mb-2.5">2 · Details</span>
                <textarea className="in" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={meta.ph} />
              </label>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="lbl block mb-1.5">3 · Overall so far</span>
                  <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Overall rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(rating === n ? 0 : n)} className="p-0.5 cursor-pointer bg-transparent border-0">
                        <Star className="w-5 h-5" style={{ color: n <= rating ? '#fbbf24' : '#3f3f46', fill: n <= rating ? '#fbbf24' : 'none' }} />
                      </button>
                    ))}
                  </div>
                </div>
                {!session.verified && (
                  <input className="in" style={{ maxWidth: 240 }} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name (optional)" aria-label="Your name" />
                )}
              </div>
              {error && <p role="alert" className="m-0 p-2.5 text-sm" style={{ color: '#ffb3c1', border: '1px solid rgba(255,77,109,.35)', background: 'rgba(255,77,109,.08)' }}>{error}</p>}
              {sentNote && <p role="status" className="m-0 p-2.5 text-sm flex items-center gap-1.5" style={{ color: '#34d399', border: '1px solid rgba(52,211,153,.35)', background: 'rgba(52,211,153,.06)' }}><Check className="w-4 h-4" />{sentNote}</p>}
              <button type="submit" className="btn w-full" disabled={sending}>
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending</> : <><Send className="w-4 h-4" />Send {category.toLowerCase()}</>}
              </button>
            </form>

            <aside className="lg:col-span-4 card lg:sticky lg:top-24">
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #222227' }}>
                <p className="lbl m-0">Your reports</p>
                <span className="font-mono text-xs" style={{ color: '#a1a1aa' }}>{mine.length}</span>
              </div>
              {mine.length > 0 && (
                <div className="px-5 py-3 flex flex-wrap gap-1.5" style={{ borderBottom: '1px solid #222227' }}>
                  {Object.entries(counts).map(([c, n]) => <span key={c} className="text-[11px] px-1.5 py-0.5" style={{ border: '1px solid #2a2a30', color: '#a1a1aa' }}>{c} · {n}</span>)}
                </div>
              )}
              {mine.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-5 h-5 mx-auto mb-2" style={{ color: '#3f3f46' }} />
                  <p className="m-0 text-sm" style={{ color: '#71717a' }}>Nothing yet. Your reports appear here.</p>
                </div>
              ) : (
                <ul className="list-none m-0 p-0 max-h-[60vh] overflow-y-auto">
                  {mine.map((f) => {
                    const M = CATEGORY_META[f.category] || CATEGORY_META.Bug
                    return (
                      <li key={f.id} className="px-5 py-3.5" style={{ borderBottom: '1px solid #1c1c20' }}>
                        <p className="m-0 text-xs font-semibold flex items-center gap-1.5" style={{ color: '#a1a1aa' }}>
                          <M.Icon className="w-3.5 h-3.5" style={{ color: '#ff4d6d' }} />{f.category}
                          {f.rating ? <span className="ml-auto font-mono" style={{ color: '#fbbf24' }}>{'★'.repeat(f.rating)}</span> : null}
                        </p>
                        <p className="m-0 mt-1.5 text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#e4e4e7' }}>{f.message}</p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </aside>
          </div>
        )}
      </main>

      <footer className="text-center text-xs font-mono py-5" style={{ color: '#52525b', borderTop: '1px solid #1c1c20' }}>Beta powered by CoLaunch</footer>
    </div>
  )
}
