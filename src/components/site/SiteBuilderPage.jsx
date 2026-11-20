import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown, GripVertical, Monitor, Smartphone, Check, Loader2,
  CloudOff, Undo2, Redo2, ExternalLink, Rocket, X, LayoutTemplate, Palette, Layers, Pencil, Globe, Lock, AlertTriangle, Image as ImageIcon,
} from 'lucide-react'
import CoLaunchLogo from '../ui/CoLaunchLogo'
import SiteRenderer from './SiteRenderer'
import { SECTION_TYPES, TEMPLATES, FONTS, ACCENTS, siteFromTemplate, applyTemplate, newSection, uid, safeImg } from './siteSchema'
import { getSite, saveSite, publishSite, unpublishSite, getCoLaunchProject } from '../../services/opsApi'

const LABELS = Object.fromEntries(Object.entries(SECTION_TYPES).map(([k, v]) => [k, v.label]))
const clean = (m) => String(m || '').replace(/^\d{3}:\s*/, '')
const LAUNCHED = ['launched', 'scaling', 'iterating', 'maintaining']

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.sb{font-family:Inter,Roboto,system-ui,sans-serif;color:#e4e4e7;background:#050506}
.sb .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
.sb .lbl{display:block;font-size:12px;font-weight:600;color:#a1a1aa;margin-bottom:6px}
.sb .in{width:100%;background:#0c0c0e;border:1px solid #26262b;color:#f4f4f5;padding:9px 11px;font-size:14px;outline:none;font-family:inherit}
.sb .in:focus{border-color:#c81e3c}
.sb textarea.in{resize:vertical;line-height:1.5}
.sb .ib{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;color:#a1a1aa;background:transparent;border:0;cursor:pointer}
.sb .ib:hover:not(:disabled){color:#fff;background:#18181b}
.sb .ib:disabled{opacity:.3;cursor:default}
.sb .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;font-size:13px;font-weight:600;border:1px solid #2a2a30;background:#111114;color:#e4e4e7;cursor:pointer;white-space:nowrap}
.sb .btn:hover:not(:disabled){border-color:#3f3f46;color:#fff}
.sb .btn:disabled{opacity:.45;cursor:not-allowed}
.sb .btn-p{background:#c81e3c;border-color:#c81e3c;color:#fff}
.sb .btn-p:hover:not(:disabled){background:#a8182f;border-color:#a8182f}
.sb .seg{display:inline-flex;border:1px solid #26262b;background:#0c0c0e}
.sb .seg button{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;font-size:13px;font-weight:600;color:#a1a1aa;background:transparent;border:0;cursor:pointer}
.sb .seg button[aria-pressed="true"]{background:#1c1c20;color:#fff;box-shadow:inset 0 -2px 0 #c81e3c}
.sb .row{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 4px;border:1px solid transparent;cursor:pointer;font-size:14px}
.sb .row:hover{background:#111114}
.sb .row[data-sel="true"]{background:#16161a;border-color:#c81e3c}
.sb .row[data-hidden="true"] .nm{color:#52525b;text-decoration:line-through}
.sb .row .acts{display:none}
.sb .row:hover .acts,.sb .row[data-sel="true"] .acts{display:flex}
.sb .row[data-over="true"]{box-shadow:inset 0 2px 0 #c81e3c}
.sb .ptab{flex:1;padding:12px 0;font-size:13px;font-weight:600;color:#71717a;background:transparent;border:0;border-bottom:2px solid transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.sb .ptab[aria-selected="true"]{color:#fff;border-color:#c81e3c}
.sb .tile{text-align:left;padding:10px;border:1px solid #26262b;background:#0c0c0e;cursor:pointer}
.sb .tile:hover{border-color:#3f3f46}
.sb .tile[aria-pressed="true"]{border-color:#c81e3c;background:rgba(200,30,60,.08)}
.sb .item{border:1px solid #222227;background:#09090b}
.sb :focus-visible{outline:2px solid #c81e3c;outline-offset:1px}
.sb ::-webkit-scrollbar{width:8px;height:8px}.sb ::-webkit-scrollbar-thumb{background:#26262b}
`

// ── Field editors ───────────────────────────────────────────────────────────────────────────────
function ImageField({ value, onChange, label }) {
  const [broken, setBroken] = useState(false)
  const url = safeImg(value)
  useEffect(() => setBroken(false), [value])
  return (
    <div>
      <span className="lbl">{label}</span>
      <div className="flex gap-2 items-start">
        <div className="w-14 h-14 shrink-0 flex items-center justify-center overflow-hidden" style={{ border: '1px solid #26262b', background: '#0c0c0e' }}>
          {url && !broken ? <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : <ImageIcon className="w-4 h-4 text-zinc-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <input className="in" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Paste an image link (https://…)" />
          {value && !url && <p className="m-0 mt-1 text-[11px] text-[#ff8fa3]">Use a link that starts with https://</p>}
          {url && broken && <p className="m-0 mt-1 text-[11px] text-[#ff8fa3]">That link doesn't load as an image.</p>}
          {value && <button type="button" className="mt-1 text-[11px] text-zinc-500 hover:text-white bg-transparent border-0 p-0 cursor-pointer" onClick={() => onChange('')}>Remove image</button>}
        </div>
      </div>
    </div>
  )
}

function Field({ f, value, onChange }) {
  if (f.type === 'text' || f.type === 'url') {
    return <label className="block"><span className="lbl">{f.label}</span><input className="in" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder || (f.type === 'url' ? 'https://… or #section' : '')} /></label>
  }
  if (f.type === 'textarea') {
    return <label className="block"><span className="lbl">{f.label}</span><textarea className="in" rows={f.rows || 3} value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>
  }
  if (f.type === 'image') return <ImageField label={f.label} value={value} onChange={onChange} />
  if (f.type === 'link') {
    const v = value || {}
    return (
      <div>
        <span className="lbl">{f.label}</span>
        <div className="grid grid-cols-2 gap-1.5">
          <input className="in" value={v.label || ''} onChange={(e) => onChange({ ...v, label: e.target.value })} placeholder="Button text" aria-label={`${f.label} text`} />
          <input className="in" value={v.href || ''} onChange={(e) => onChange({ ...v, href: e.target.value })} placeholder="Link" aria-label={`${f.label} link`} />
        </div>
        <p className="m-0 mt-1 text-[11px] text-zinc-600">Leave the text empty to hide it.</p>
      </div>
    )
  }
  if (f.type === 'select') {
    return (
      <div>
        <span className="lbl">{f.label}</span>
        <div className="grid gap-1">
          {f.options.map(([k, l]) => (
            <button key={k} type="button" className="tile text-sm" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>
          ))}
        </div>
      </div>
    )
  }
  if (f.type === 'toggle') {
    return (
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="accent-[#c81e3c] w-4 h-4" />{f.label}
      </label>
    )
  }
  if (f.type === 'list') return <ListField f={f} value={Array.isArray(value) ? value : []} onChange={onChange} />
  return null
}

function ListField({ f, value, onChange }) {
  const [open, setOpen] = useState(0)
  const set = (i, v) => onChange(value.map((x, j) => (j === i ? v : x)))
  const move = (i, d) => { const a = [...value]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); onChange(a); setOpen(i + d) }
  const blank = () => Object.fromEntries(f.item.map((it) => [it.key, it.type === 'link' ? { label: '', href: '' } : it.type === 'toggle' ? false : '']))
  const title = (x) => x[f.item[0].key] && typeof x[f.item[0].key] === 'string' ? x[f.item[0].key] : `Item`
  return (
    <div>
      <span className="lbl">{f.label}</span>
      <div className="space-y-1.5">
        {value.map((x, i) => (
          <div key={i} className="item">
            <div className="flex items-center gap-1 pl-2.5 pr-1 py-1 cursor-pointer" onClick={() => setOpen(open === i ? -1 : i)}>
              <span className="flex-1 min-w-0 truncate text-[13px]">{title(x) || `Item ${i + 1}`}</span>
              <button type="button" className="ib" aria-label="Move up" disabled={i === 0} onClick={(e) => { e.stopPropagation(); move(i, -1) }}><ChevronUp className="w-3.5 h-3.5" /></button>
              <button type="button" className="ib" aria-label="Move down" disabled={i === value.length - 1} onClick={(e) => { e.stopPropagation(); move(i, 1) }}><ChevronDown className="w-3.5 h-3.5" /></button>
              <button type="button" className="ib" aria-label="Remove" onClick={(e) => { e.stopPropagation(); onChange(value.filter((_, j) => j !== i)) }}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            {open === i && (
              <div className="p-2.5 pt-1 space-y-3" style={{ borderTop: '1px solid #1c1c20' }}>
                {f.item.map((it) => <Field key={it.key} f={it} value={x[it.key]} onChange={(v) => set(i, { ...x, [it.key]: v })} />)}
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn w-full mt-1.5" onClick={() => { onChange([...value, blank()]); setOpen(value.length) }}><Plus className="w-3.5 h-3.5" />{f.addLabel || 'Add'}</button>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────────────────────
export default function SiteBuilderPage({ pid }) {
  const [phase, setPhase] = useState('loading') // loading | auth | missing | error | ready
  const [loadErr, setLoadErr] = useState('')
  const [meta, setMeta] = useState(null) // { project, site, signups, suggestedSlug }
  const [project, setProject] = useState(null)
  const [site, setSiteState] = useState(null)
  const [mode, setMode] = useState('edit') // edit | live
  const [device, setDevice] = useState('desktop')
  const [panel, setPanel] = useState('sections')
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState(false)
  const [save, setSave] = useState({ state: 'saved', at: null }) // saved | dirty | saving | error
  const [notice, setNotice] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  const revRef = useRef(0)
  const latest = useRef(null)
  const timer = useRef(null)
  const inflight = useRef(false)
  const pending = useRef(false)
  const hist = useRef({ past: [], future: [], lastPush: 0 })
  const [, bump] = useState(0)
  const isOperator = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('forge_launch_auth_token') || localStorage.getItem('forge_op_token'))

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice((n) => (n === m ? '' : n)), 4000) }

  // ── Load ──
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await getSite(pid)
        if (!alive) return
        let full = null
        try { full = await getCoLaunchProject(r.project.id) } catch { full = null }
        const proj = full?.project || full || r.project
        setProject(proj)
        setMeta(r)
        const draft = r.site?.draft && !r.site.draft.auto && Array.isArray(r.site.draft.sections) ? r.site.draft : null
        revRef.current = r.site?.rev || 0
        if (draft) { setSiteState(draft); latest.current = draft; setPhase('ready') }
        else setPhase('pick')
        document.title = `Site builder · ${r.project.productName || 'CoLaunch'}`
      } catch (e) {
        if (!alive) return
        const m = String(e.message || '')
        setPhase(/^(401|403)/.test(m) ? 'auth' : /^404/.test(m) ? 'missing' : 'error')
        setLoadErr(clean(m))
      }
    })()
    return () => { alive = false }
  }, [pid])

  // ── Autosave ──
  const flush = useCallback(async () => {
    if (inflight.current) { pending.current = true; return }
    const draft = latest.current
    if (!draft) return
    inflight.current = true
    setSave((s) => ({ ...s, state: 'saving' }))
    try {
      const r = await saveSite(pid, draft, revRef.current)
      revRef.current = r.rev
      setMeta((m) => (m ? { ...m, site: { ...(m.site || {}), slug: r.slug, rev: r.rev, updatedAt: r.updatedAt } } : m))
      setSave({ state: pending.current ? 'dirty' : 'saved', at: new Date() })
    } catch (e) {
      const m = String(e.message || '')
      if (/^409/.test(m)) {
        try {
          const r = await getSite(pid)
          revRef.current = r.site?.rev || 0
          if (r.site?.draft?.sections) { latest.current = r.site.draft; setSiteState(r.site.draft) }
          setSave({ state: 'saved', at: new Date() })
          flash('This page was changed in another tab. Loaded the latest version.')
        } catch { setSave((s) => ({ ...s, state: 'error' })) }
      } else {
        setSave((s) => ({ ...s, state: 'error' }))
        clearTimeout(timer.current)
        timer.current = setTimeout(flush, 5000)
      }
    } finally {
      inflight.current = false
      if (pending.current) { pending.current = false; flush() }
    }
  }, [pid])

  const setSite = useCallback((updater, { history = true } = {}) => {
    setSiteState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (history && prev) {
        const h = hist.current
        const now = Date.now()
        if (now - h.lastPush > 700) { h.past.push(prev); if (h.past.length > 60) h.past.shift() }
        h.lastPush = now
        h.future = []
      }
      latest.current = next
      return next
    })
    setSave((s) => ({ ...s, state: 'dirty' }))
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, 900)
    bump((x) => x + 1)
  }, [flush])

  const undo = () => {
    const h = hist.current
    if (!h.past.length) return
    const prev = h.past.pop(); h.future.push(latest.current); h.lastPush = 0
    setSite(prev, { history: false })
  }
  const redo = () => {
    const h = hist.current
    if (!h.future.length) return
    const next = h.future.pop(); h.past.push(latest.current); h.lastPush = 0
    setSite(next, { history: false })
  }

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '')
      if (typing || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      e.preventDefault(); e.shiftKey ? redo() : undo()
    }
    const onUnload = (e) => { if (save.state !== 'saved') { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', onUnload)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onUnload) }
  })

  // ── Section operations ──
  const sections = site?.sections || []
  const selected = sections.find((s) => s.id === sel)
  const updSection = (id, fn) => setSite((p) => ({ ...p, sections: p.sections.map((s) => (s.id === id ? fn(s) : s)) }))
  const moveSection = (id, d) => setSite((p) => {
    const a = [...p.sections]; const i = a.findIndex((s) => s.id === id); const j = i + d
    if (i < 0 || j < 0 || j >= a.length) return p
    ;[a[i], a[j]] = [a[j], a[i]]; return { ...p, sections: a }
  })
  const dropOn = (targetId) => {
    if (!dragId || dragId === targetId) return
    setSite((p) => {
      const a = [...p.sections]; const from = a.findIndex((s) => s.id === dragId)
      const [x] = a.splice(from, 1); const to = a.findIndex((s) => s.id === targetId)
      a.splice(to, 0, x); return { ...p, sections: a }
    })
  }
  const duplicate = (id) => setSite((p) => {
    const i = p.sections.findIndex((s) => s.id === id)
    const copy = { ...JSON.parse(JSON.stringify(p.sections[i])), id: uid() }
    const a = [...p.sections]; a.splice(i + 1, 0, copy); setSel(copy.id); return { ...p, sections: a }
  })
  const remove = (id) => {
    const s = sections.find((x) => x.id === id)
    if (!window.confirm(`Delete the ${LABELS[s?.type] || ''} section? You can undo this.`)) return
    setSite((p) => ({ ...p, sections: p.sections.filter((x) => x.id !== id) }))
    if (sel === id) setSel(null)
  }
  const add = (type) => {
    const s = newSection(type)
    setSite((p) => {
      const a = [...p.sections]
      const at = sel ? a.findIndex((x) => x.id === sel) + 1 : Math.max(a.findIndex((x) => x.type === 'footer'), 0) || a.length
      a.splice(at > 0 ? at : a.length, 0, s)
      return { ...p, sections: a }
    })
    setSel(s.id); setAdding(false); setPanel('sections')
  }

  const startFrom = (templateId) => {
    const s = siteFromTemplate(project, templateId)
    latest.current = s; setSiteState(s); setPhase('ready')
    setSave({ state: 'dirty', at: null }); clearTimeout(timer.current); timer.current = setTimeout(flush, 200)
  }

  // ── Publish ──
  const launched = isOperator || Number(project?.currentPhase || meta?.project?.currentPhase) >= 3 && LAUNCHED.includes(String(project?.status || meta?.project?.status || '').toLowerCase())
  const isPublished = Boolean(meta?.site?.published)
  const liveUrl = meta?.site?.slug ? `${window.location.origin}/site/${meta.site.slug}` : null
  const publish = async () => {
    setPublishing(true)
    try {
      clearTimeout(timer.current); await flush()
      const r = await publishSite(pid, !meta?.site?.notifiedAt)
      setMeta((m) => ({ ...m, site: { ...(m.site || {}), published: true, publishedAt: r.publishedAt, slug: r.slug, notifiedAt: r.emailed ? r.publishedAt : m?.site?.notifiedAt } }))
      flash(r.emailed ? 'Published. We emailed the link to the creator.' : 'Published. Your changes are live.')
    } catch (e) { flash(`Couldn't publish: ${clean(e.message)}`) } finally { setPublishing(false) }
  }
  const unpublish = async () => {
    if (!window.confirm('Take the page offline? The link will stop working until you publish again.')) return
    try { await unpublishSite(pid); setMeta((m) => ({ ...m, site: { ...(m.site || {}), published: false } })); flash('The page is offline.') } catch (e) { flash(clean(e.message)) }
  }

  // ── States ──
  if (phase !== 'ready' && phase !== 'pick') {
    const next = encodeURIComponent(window.location.pathname)
    const copy = {
      loading: null,
      auth: ['Sign in to edit this site', 'Your session ended or you are signed in with a different account.', `/creator/login?next=${next}`, 'Sign in'],
      missing: ['Project not found', "We couldn't find this project. Check the link from your workspace.", '/', 'Go home'],
      error: ['Something went wrong', loadErr || 'Try again in a moment.', window.location.href, 'Retry'],
    }[phase]
    return (
      <div className="sb min-h-screen flex items-center justify-center p-6"><style>{CSS}</style>
        {!copy ? <Loader2 className="w-6 h-6 animate-spin text-zinc-500" /> : (
          <div className="max-w-sm w-full text-center p-8" style={{ border: '1px solid #222227', background: '#0c0c0e' }}>
            <Lock className="w-5 h-5 mx-auto text-zinc-500" />
            <h1 className="serif m-0 mt-3 text-3xl text-white">{copy[0]}</h1>
            <p className="m-0 mt-2 text-sm text-zinc-400">{copy[1]}</p>
            <a href={copy[2]} className="btn btn-p mt-5 no-underline">{copy[3]}</a>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'pick') {
    return (
      <div className="sb min-h-screen"><style>{CSS}</style>
        <header className="h-14 px-5 flex items-center gap-3" style={{ borderBottom: '1px solid #1c1c20' }}>
          <CoLaunchLogo size={20} theme="dark" showWordmark={false} />
          <span className="text-sm font-semibold text-white">{meta?.project?.productName}</span>
          <span className="text-xs text-zinc-500">Site builder</span>
        </header>
        <main className="max-w-5xl mx-auto px-5 py-14">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-[#ff8fa3]">Step 1</p>
          <h1 className="serif m-0 mt-2 text-5xl text-white">Pick a starting template</h1>
          <p className="m-0 mt-3 text-zinc-400 max-w-xl">We fill it in with your product's name, tagline and features. You can change every word, image and colour after, or switch template later.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {Object.entries(TEMPLATES).map(([id, t]) => (
              <button key={id} type="button" onClick={() => startFrom(id)} className="tile p-0 overflow-hidden group">
                <div className="h-44 overflow-hidden" style={{ background: t.theme.mode === 'dark' ? '#09090b' : '#f6f6f4' }}>
                  <div style={{ width: 1120, transform: 'scale(.29)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                    <SiteRenderer site={{ ...siteFromTemplate(project, id), sections: siteFromTemplate(project, id).sections.slice(0, 3) }} />
                  </div>
                </div>
                <div className="p-4" style={{ borderTop: '1px solid #222227' }}>
                  <p className="m-0 font-semibold text-white flex items-center justify-between">{t.label}<span className="text-xs text-[#ff8fa3] opacity-0 group-hover:opacity-100">Use this →</span></p>
                  <p className="m-0 mt-1 text-sm text-zinc-500">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  const saveBadge = {
    saved: [<Check key="i" className="w-3.5 h-3.5 text-emerald-400" />, save.at ? 'Saved' : 'All changes saved'],
    dirty: [<span key="i" className="w-1.5 h-1.5 bg-zinc-500" />, 'Unsaved changes'],
    saving: [<Loader2 key="i" className="w-3.5 h-3.5 animate-spin" />, 'Saving…'],
    error: [<CloudOff key="i" className="w-3.5 h-3.5 text-[#ff8fa3]" />, 'Offline, retrying'],
  }[save.state]
  const frameW = device === 'mobile' ? 390 : '100%'

  return (
    <div className="sb h-screen flex flex-col overflow-hidden"><style>{CSS}</style>
      {/* Top bar */}
      <header className="h-14 shrink-0 px-3 sm:px-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1c1c20', background: '#08080a' }}>
        <a href="/" className="shrink-0 flex" aria-label="CoLaunch"><CoLaunchLogo size={20} theme="dark" showWordmark={false} /></a>
        <div className="min-w-0 hidden md:block">
          <p className="m-0 text-sm font-semibold text-white truncate leading-tight">{meta?.project?.productName}</p>
          <p className="m-0 text-[11px] text-zinc-500 flex items-center gap-1.5 leading-tight mt-0.5" aria-live="polite">{saveBadge[0]}{saveBadge[1]}</p>
        </div>
        <div className="flex items-center gap-0.5 ml-1">
          <button className="ib" onClick={undo} disabled={!hist.current.past.length} aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
          <button className="ib" onClick={redo} disabled={!hist.current.future.length} aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><Redo2 className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 flex justify-center gap-2">
          <div className="seg" role="group" aria-label="Mode">
            <button aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}><Pencil className="w-3.5 h-3.5" />Edit</button>
            <button aria-pressed={mode === 'live'} onClick={() => setMode('live')}><Eye className="w-3.5 h-3.5" />Live</button>
          </div>
          <div className="seg hidden sm:inline-flex" role="group" aria-label="Device">
            <button aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')} aria-label="Desktop"><Monitor className="w-3.5 h-3.5" /></button>
            <button aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')} aria-label="Mobile"><Smartphone className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {isPublished && liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" className="btn no-underline hidden lg:inline-flex"><ExternalLink className="w-3.5 h-3.5" />View page</a>}
        <button className="btn btn-p" onClick={publish} disabled={publishing || !launched}
          title={launched ? '' : 'Your page goes live automatically when you launch in Phase 3.'}>
          {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : launched ? <Rocket className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {isPublished ? 'Update live page' : launched ? 'Publish' : 'Publishes at launch'}
        </button>
      </header>

      {notice && <div className="shrink-0 px-4 py-2 text-sm flex items-center gap-2" style={{ background: '#16161a', borderBottom: '1px solid #26262b' }} role="status"><Check className="w-4 h-4 text-emerald-400" />{notice}</div>}

      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        {mode === 'edit' && (
          <aside className="w-[270px] shrink-0 flex flex-col min-h-0" style={{ borderRight: '1px solid #1c1c20', background: '#08080a' }}>
            <div className="flex shrink-0" role="tablist" style={{ borderBottom: '1px solid #1c1c20' }}>
              <button role="tab" className="ptab" aria-selected={panel === 'sections'} onClick={() => setPanel('sections')}><Layers className="w-3.5 h-3.5" />Sections</button>
              <button role="tab" className="ptab" aria-selected={panel === 'design'} onClick={() => setPanel('design')}><Palette className="w-3.5 h-3.5" />Design</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {panel === 'sections' ? (
                <>
                  <ul className="list-none m-0 p-0 space-y-0.5">
                    {sections.map((s, i) => (
                      <li key={s.id} className="row" data-sel={sel === s.id} data-hidden={s.hidden} data-over={overId === s.id && dragId !== s.id}
                        draggable onDragStart={() => setDragId(s.id)} onDragEnd={() => { setDragId(null); setOverId(null) }}
                        onDragOver={(e) => { e.preventDefault(); setOverId(s.id) }} onDrop={(e) => { e.preventDefault(); dropOn(s.id); setOverId(null) }}
                        onClick={() => setSel(s.id)}>
                        <GripVertical className="w-3.5 h-3.5 text-zinc-600 shrink-0 cursor-grab" />
                        <span className="nm flex-1 min-w-0 truncate">{LABELS[s.type]}</span>
                        <span className="acts items-center">
                          <button className="ib" aria-label="Move up" disabled={i === 0} onClick={(e) => { e.stopPropagation(); moveSection(s.id, -1) }}><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button className="ib" aria-label="Move down" disabled={i === sections.length - 1} onClick={(e) => { e.stopPropagation(); moveSection(s.id, 1) }}><ChevronDown className="w-3.5 h-3.5" /></button>
                          <button className="ib" aria-label={s.hidden ? 'Show' : 'Hide'} onClick={(e) => { e.stopPropagation(); updSection(s.id, (x) => ({ ...x, hidden: !x.hidden })) }}>{s.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button className="btn w-full mt-3" onClick={() => setAdding(true)}><Plus className="w-4 h-4" />Add section</button>
                  <p className="m-0 mt-3 text-[11px] text-zinc-600 leading-relaxed">Click a section on the page or in this list to edit it. Drag to reorder.</p>
                </>
              ) : (
                <DesignPanel site={site} setSite={setSite} project={project} />
              )}
            </div>
            <div className="shrink-0 p-3 text-[11px] text-zinc-500 space-y-1" style={{ borderTop: '1px solid #1c1c20' }}>
              <p className="m-0 flex items-center gap-1.5"><Globe className="w-3 h-3" />{isPublished ? 'Live at' : 'Will be live at'}</p>
              <p className="m-0 font-mono text-zinc-300 break-all">{window.location.host}/site/{meta?.site?.slug || meta?.suggestedSlug}</p>
              {isPublished && <button className="bg-transparent border-0 p-0 text-zinc-500 hover:text-white cursor-pointer" onClick={unpublish}>Take offline</button>}
              {meta?.signups > 0 && <p className="m-0">{meta.signups} email signup{meta.signups === 1 ? '' : 's'}</p>}
            </div>
          </aside>
        )}

        {/* Canvas */}
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: mode === 'edit' ? '#121215' : '#050506' }} onClick={() => mode === 'edit' && setSel(null)}>
          <div className={mode === 'edit' ? 'p-4 sm:p-6' : ''}>
            <div style={{ width: frameW, maxWidth: '100%', margin: '0 auto', boxShadow: mode === 'edit' || device === 'mobile' ? '0 0 0 1px #26262b, 0 20px 50px rgba(0,0,0,.4)' : undefined }} onClick={(e) => e.stopPropagation()}>
              <SiteRenderer site={site} slug={meta?.site?.slug} editing={mode === 'edit'} selectedId={sel} onSelect={(id) => { setSel(id); setPanel('sections') }} labels={LABELS} />
            </div>
          </div>
        </main>

        {/* Right panel */}
        {mode === 'edit' && selected && (
          <aside className="w-[320px] shrink-0 flex flex-col min-h-0" style={{ borderLeft: '1px solid #1c1c20', background: '#08080a' }}>
            <div className="h-12 shrink-0 px-3 flex items-center gap-1" style={{ borderBottom: '1px solid #1c1c20' }}>
              <p className="m-0 flex-1 text-sm font-semibold text-white">{LABELS[selected.type]}</p>
              <button className="ib" title="Duplicate" aria-label="Duplicate section" onClick={() => duplicate(selected.id)}><Copy className="w-4 h-4" /></button>
              <button className="ib" title="Delete" aria-label="Delete section" onClick={() => remove(selected.id)}><Trash2 className="w-4 h-4" /></button>
              <button className="ib" aria-label="Close" onClick={() => setSel(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {SECTION_TYPES[selected.type].fields.map((f) => (
                <Field key={f.key} f={f} value={selected.data?.[f.key]} onChange={(v) => updSection(selected.id, (s) => ({ ...s, data: { ...s.data, [f.key]: v } }))} />
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Add section picker */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.7)' }} onClick={() => setAdding(false)}>
          <div className="w-full max-w-2xl p-5" style={{ background: '#0c0c0e', border: '1px solid #26262b' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Add a section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="serif m-0 text-3xl text-white">Add a section</h2>
              <button className="ib" onClick={() => setAdding(false)} aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(SECTION_TYPES).map(([k, t]) => (
                <button key={k} type="button" className="tile" onClick={() => add(k)}>
                  <span className="block text-sm font-semibold text-white">{t.label}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">{t.hint}</span>
                </button>
              ))}
            </div>
            <p className="m-0 mt-3 text-xs text-zinc-500">{selected ? `Adds below “${LABELS[selected.type]}”.` : 'Adds above the footer.'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function DesignPanel({ site, setSite, project }) {
  const theme = site.theme || {}
  const setTheme = (patch) => setSite((p) => ({ ...p, theme: { ...p.theme, ...patch } }))
  const setSettings = (patch) => setSite((p) => ({ ...p, settings: { ...p.settings, ...patch } }))
  const custom = !ACCENTS.includes(theme.accent)
  return (
    <div className="space-y-6">
      <div>
        <span className="lbl flex items-center gap-1.5"><LayoutTemplate className="w-3.5 h-3.5" />Template</span>
        <div className="grid gap-1.5">
          {Object.entries(TEMPLATES).map(([id, t]) => (
            <button key={id} type="button" className="tile" aria-pressed={site.template === id}
              onClick={() => { if (site.template !== id && window.confirm(`Switch to the ${t.label} template? Your text and images stay; the look changes.`)) setSite((p) => applyTemplate(p, project, id)) }}>
              <span className="block text-sm font-semibold text-white">{t.label}</span>
              <span className="block text-[11px] text-zinc-500">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="lbl">Brand colour</span>
        <div className="flex flex-wrap gap-1.5">
          {ACCENTS.map((c) => (
            <button key={c} type="button" aria-label={c} aria-pressed={theme.accent === c} onClick={() => setTheme({ accent: c })}
              className="w-7 h-7 cursor-pointer" style={{ background: c, border: theme.accent === c ? '2px solid #fff' : '1px solid #26262b' }} />
          ))}
          <label className="w-7 h-7 cursor-pointer relative flex items-center justify-center text-[10px] text-zinc-400" title="Custom colour"
            style={{ background: custom ? theme.accent : '#0c0c0e', border: custom ? '2px solid #fff' : '1px dashed #3f3f46' }}>
            {!custom && '+'}
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(theme.accent || '') ? theme.accent : '#c81e3c'} onChange={(e) => setTheme({ accent: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        </div>
      </div>
      <div>
        <span className="lbl">Background</span>
        <div className="grid grid-cols-2 gap-1.5">
          {[['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => <button key={k} type="button" className="tile text-sm" aria-pressed={(theme.mode || 'dark') === k} onClick={() => setTheme({ mode: k })}>{l}</button>)}
        </div>
      </div>
      <div>
        <span className="lbl">Font style</span>
        <div className="grid gap-1.5">
          {Object.entries(FONTS).map(([k, f]) => (
            <button key={k} type="button" className="tile" aria-pressed={(theme.font || 'modern') === k} onClick={() => setTheme({ font: k })}>
              <span className="block text-lg text-white" style={{ fontFamily: f.head, fontWeight: f.weight }}>{f.label} Aa</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Field f={{ type: 'image', label: 'Logo' }} value={site.settings?.logoUrl} onChange={(v) => setSettings({ logoUrl: v })} />
        <Field f={{ type: 'text', label: 'Page title (shows in the browser tab and Google)' }} value={site.settings?.title} onChange={(v) => setSettings({ title: v })} />
        <Field f={{ type: 'textarea', label: 'Description (shows on Google and when shared)' }} value={site.settings?.description} onChange={(v) => setSettings({ description: v })} />
        <Field f={{ type: 'image', label: 'Browser tab icon' }} value={site.settings?.faviconUrl} onChange={(v) => setSettings({ faviconUrl: v })} />
      </div>
      <p className="m-0 text-[11px] text-zinc-600 flex gap-1.5"><AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />Images come from links you paste. Make sure you have the right to use them.</p>
    </div>
  )
}
