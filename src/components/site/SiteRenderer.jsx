import { useEffect, useMemo, useRef, useState } from 'react'
import { FONTS, safeHref, safeImg, videoEmbed } from './siteSchema'
import { siteSignup } from '../../services/opsApi'

// Renders a site document. Used by the public page, the builder's live view and the editor
// (editing=true outlines sections and reports clicks). Layout responds to the container width
// (container queries), so the desktop / mobile preview works without an iframe.

function hexRgb(h) {
  const n = parseInt((/^#[0-9a-f]{6}$/i.test(h || '') ? h : '#c81e3c').slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function themeVars(theme = {}) {
  const dark = theme.mode !== 'light'
  const [r, g, b] = hexRgb(theme.accent)
  const lightAcc = 0.299 * r + 0.587 * g + 0.114 * b > 165
  const f = FONTS[theme.font] || FONTS.modern
  return {
    '--acc': theme.accent || '#c81e3c',
    '--acc-ink': lightAcc ? '#0a0a0b' : '#ffffff',
    '--acc-soft': `rgba(${r},${g},${b},${dark ? 0.16 : 0.09})`,
    '--bg': dark ? '#09090b' : '#ffffff',
    '--bg2': dark ? '#111114' : '#f6f6f4',
    '--fg': dark ? '#fafafa' : '#0a0a0b',
    '--mut': dark ? '#a1a1aa' : '#52525b',
    '--line': dark ? '#26262b' : '#e4e4e7',
    '--head': f.head,
    '--body': f.body,
    '--hw': f.weight,
  }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;500;600;700;800&display=swap');
.sr{container-type:inline-size;background:var(--bg);color:var(--fg);font-family:var(--body);line-height:1.55;-webkit-font-smoothing:antialiased}
.sr *{box-sizing:border-box}
.sr h1,.sr h2,.sr h3{font-family:var(--head)!important;font-weight:var(--hw)!important;letter-spacing:-.02em;margin:0;line-height:1.08}
.sr p{margin:0}
.sr a{color:inherit}
.sr .wrap{max-width:1120px;margin:0 auto;padding:0 24px}
.sr .sec{padding:88px 0;position:relative}
.sr .alt{background:var(--bg2)}
.sr .eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--acc)}
.sr .mut{color:var(--mut)}
.sr .h2{font-size:clamp(28px,4.2cqi,44px)}
.sr .btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;font-weight:600;font-size:15px;text-decoration:none;background:var(--acc);color:var(--acc-ink);border:1px solid var(--acc);cursor:pointer}
.sr .btn2{display:inline-flex;align-items:center;padding:14px 22px;font-weight:600;font-size:15px;text-decoration:none;border:1px solid var(--line);color:var(--fg);background:transparent}
.sr .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.sr .split{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
.sr .card{border:1px solid var(--line);padding:26px;background:var(--bg)}
.sr .img{width:100%;display:block;object-fit:cover;background:var(--bg2)}
.sr .in{flex:1;min-width:0;padding:14px 16px;font-size:15px;border:1px solid var(--line);background:var(--bg);color:var(--fg);outline:none}
.sr .in:focus{border-color:var(--acc)}
.sr details{border-bottom:1px solid var(--line)}
.sr summary{cursor:pointer;list-style:none;padding:20px 0;font-weight:600;font-size:17px;display:flex;justify-content:space-between;gap:16px}
.sr summary::-webkit-details-marker{display:none}
.sr summary::after{content:'+';color:var(--mut);font-weight:400;font-size:22px;line-height:1}
.sr details[open] summary::after{content:'–'}
.sr .edit{outline:1px dashed transparent;outline-offset:-1px;cursor:pointer;transition:outline-color .12s}
.sr .edit:hover{outline-color:rgba(200,30,60,.6)}
.sr .edit[data-sel="true"]{outline:2px solid #c81e3c}
.sr .tag{position:absolute;top:0;left:0;z-index:5;background:#c81e3c;color:#fff;font:600 11px/1 Inter,sans-serif;padding:5px 8px;display:none}
.sr .edit:hover .tag,.sr .edit[data-sel="true"] .tag{display:block}
.sr .empty{border:1px dashed var(--line);padding:28px;text-align:center;color:var(--mut);font-size:14px}
@container (max-width:760px){
  .sr .grid3{grid-template-columns:1fr}
  .sr .split{grid-template-columns:1fr;gap:32px}
  .sr .sec{padding:60px 0}
  .sr .navlinks{display:none}
  .sr .hero-title{font-size:40px!important}
  .sr .row{flex-direction:column;align-items:stretch}
}
`

// Links to the site's own pages (/<handle>/<slug>/<path>) go through onNavigate when the builder previews them.
function pageLinks(site, where, base) {
  return (site.pages || []).filter((pg) => pg.menu === where).map((pg) => ({ label: pg.title, href: `${base}/${pg.path}`, path: pg.path }))
}
const Nav = ({ l, nav, className, style, children }) => (
  <a href={l.path != null ? l.href : (safeHref(l.href) || '#')} className={className} style={style}
    onClick={l.path != null && nav ? (e) => { e.preventDefault(); nav(l.path) } : undefined}>{children || l.label}</a>
)

const Btn = ({ l, alt }) => (l?.label ? <a className={alt ? 'btn2' : 'btn'} href={safeHref(l.href) || '#'}>{l.label}</a> : null)
const Img = ({ src, alt = '', style, className = 'img' }) => {
  const s = safeImg(src)
  return s ? <img src={s} alt={alt} className={className} style={style} loading="lazy" referrerPolicy="no-referrer" /> : null
}
const Head = ({ title, subtitle, center = true }) => (title || subtitle) ? (
  <div style={{ textAlign: center ? 'center' : 'left', maxWidth: center ? 680 : 'none', margin: center ? '0 auto 48px' : '0 0 40px' }}>
    {title && <h2 className="h2">{title}</h2>}
    {subtitle && <p className="mut" style={{ marginTop: 14, fontSize: 17 }}>{subtitle}</p>}
  </div>
) : null

function Signup({ d, slug, editing }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('') // '' | 'busy' | 'done' | error text
  const submit = async (e) => {
    e.preventDefault()
    if (editing || !slug) { setState('done'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setState('Enter a valid email address.'); return }
    setState('busy')
    try { await siteSignup(slug, email.trim()); setState('done') } catch (err) { setState(String(err.message || 'Could not sign up.').replace(/^\d{3}:\s*/, '')) }
  }
  return (
    <div className="wrap" style={{ maxWidth: 640, textAlign: 'center' }}>
      {d.title && <h2 className="h2">{d.title}</h2>}
      {d.text && <p className="mut" style={{ marginTop: 12, fontSize: 17 }}>{d.text}</p>}
      {state === 'done' ? (
        <p style={{ marginTop: 28, fontWeight: 600, color: 'var(--acc)' }}>{d.success || "Thanks, you're in."}</p>
      ) : (
        <form onSubmit={submit} className="row" style={{ display: 'flex', gap: 8, marginTop: 28 }}>
          <input className="in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" />
          <button className="btn" type="submit" disabled={state === 'busy'}>{state === 'busy' ? '…' : d.button || 'Join'}</button>
        </form>
      )}
      {state && !['busy', 'done'].includes(state) && <p style={{ marginTop: 10, fontSize: 14, color: '#e11d48' }}>{state}</p>}
    </div>
  )
}

// AI/custom code runs in a sandboxed iframe (own origin, no access to this page) and reports its height.
function CustomBlock({ d, theme, editing }) {
  const ref = useRef(null)
  const [h, setH] = useState(() => Math.max(80, parseInt(d.height, 10) || 480))
  const id = useMemo(() => Math.random().toString(36).slice(2), [])
  useEffect(() => {
    const on = (e) => { if (e.source === ref.current?.contentWindow && e.data?.cxid === id && e.data.h) setH(Math.min(Math.ceil(e.data.h), 4000)) }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
  }, [id])
  if (!d.html) return editing ? <div className="wrap sec"><div className="empty">Describe what you want in the panel and the AI builds it</div></div> : null
  const vars = Object.entries(themeVars(theme)).map(([k, v]) => `${k}:${v}`).join(';')
  const html = String(d.html).replace(/<script[\s\S]*?<\/script>/gi, '')
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">
<style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;500;600;700;800&display=swap');
:root{${vars}}*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--body)}img{max-width:100%}${String(d.css || '').replace(/<\/style/gi, '')}</style></head>
<body>${html}<script>(function(){function p(){parent.postMessage({cxid:${JSON.stringify(id)},h:document.documentElement.scrollHeight},'*')}new ResizeObserver(p).observe(document.body);window.addEventListener('load',p);p()})()</script></body></html>`
  return <iframe ref={ref} title="Custom section" srcDoc={doc} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style={{ width: '100%', height: h, border: 0, display: 'block', pointerEvents: editing ? 'none' : 'auto' }} />
}

function Section({ s, site, slug, editing, base, nav }) {
  const d = s.data || {}
  const items = (k) => (Array.isArray(d[k]) ? d[k] : [])
  switch (s.type) {
    case 'nav': {
      const logo = safeImg(site.settings?.logoUrl)
      return (
        <div style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68, gap: 16 }}>
            <a href={base || '#top'} onClick={nav ? (e) => { e.preventDefault(); nav('') } : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
              {logo && <img src={logo} alt="" style={{ height: 32, width: 'auto', maxWidth: 160, objectFit: 'contain' }} referrerPolicy="no-referrer" />}
              <span style={{ fontFamily: 'var(--head)', fontWeight: 'var(--hw)', fontSize: 20 }}>{d.brand}</span>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <nav className="navlinks" style={{ display: 'flex', gap: 24 }}>
                {[...items('links').filter((l) => l.label), ...pageLinks(site, 'header', base)].map((l, i) => <Nav key={i} l={l} nav={nav} className="mut" style={{ textDecoration: 'none', fontSize: 14, fontWeight: 500 }} />)}
              </nav>
              {d.cta?.label && <a className="btn" href={safeHref(d.cta.href) || '#'} style={{ padding: '10px 16px', fontSize: 14 }}>{d.cta.label}</a>}
            </div>
          </div>
        </div>
      )
    }
    case 'hero': {
      const img = safeImg(d.image)
      const text = (align) => (
        <div style={{ textAlign: align }}>
          {d.eyebrow && <p className="eyebrow" style={{ marginBottom: 18 }}>{d.eyebrow}</p>}
          <h1 className="hero-title" style={{ fontSize: d.layout === 'split' ? 'clamp(40px,5.4cqi,64px)' : 'clamp(44px,7cqi,84px)', whiteSpace: 'pre-line' }}>{d.title}</h1>
          {d.subtitle && <p className="mut" style={{ marginTop: 20, fontSize: 19, maxWidth: 620, marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0, color: d.layout === 'cover' ? 'rgba(255,255,255,.85)' : undefined }}>{d.subtitle}</p>}
          <div className="row" style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: align === 'center' ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
            <Btn l={d.cta} /><Btn l={d.secondary} alt />
          </div>
        </div>
      )
      if (d.layout === 'cover') {
        return (
          <div style={{ position: 'relative', minHeight: 620, display: 'flex', alignItems: 'center', color: '#fff', background: '#0a0a0b' }}>
            {img && <img src={img} alt="" referrerPolicy="no-referrer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />}
            <div className="wrap" style={{ position: 'relative', width: '100%', padding: '96px 24px', '--fg': '#fff' }}>{text('center')}</div>
          </div>
        )
      }
      if (d.layout === 'split') {
        return (
          <div className="sec"><div className="wrap split">
            {text('left')}
            {img ? <img src={img} alt="" className="img" style={{ height: 'auto', maxHeight: 560, objectFit: 'contain', border: '1px solid var(--line)' }} referrerPolicy="no-referrer" /> : editing ? <div className="empty">Add an image in the panel</div> : null}
          </div></div>
        )
      }
      return (
        <div className="sec"><div className="wrap">
          {text('center')}
          {img && <img src={img} alt="" className="img" style={{ marginTop: 56, height: 'auto', maxHeight: 640, objectFit: 'contain', border: '1px solid var(--line)' }} referrerPolicy="no-referrer" />}
        </div></div>
      )
    }
    case 'features':
      return (
        <div className="sec alt"><div className="wrap">
          <Head title={d.title} subtitle={d.subtitle} />
          <div className="grid3">
            {items('items').map((f, i) => (
              <div key={i} className="card">
                <span style={{ display: 'inline-flex', width: 34, height: 34, alignItems: 'center', justifyContent: 'center', background: 'var(--acc-soft)', color: 'var(--acc)', fontWeight: 700, fontSize: 14 }}>{String(i + 1).padStart(2, '0')}</span>
                <h3 style={{ fontSize: 20, marginTop: 18 }}>{f.title}</h3>
                {f.text && <p className="mut" style={{ marginTop: 8, fontSize: 15 }}>{f.text}</p>}
              </div>
            ))}
          </div>
        </div></div>
      )
    case 'text': {
      const img = safeImg(d.image)
      return (
        <div className="sec"><div className={`wrap ${img ? 'split' : ''}`} style={img ? undefined : { maxWidth: 760 }}>
          <div>
            {d.title && <h2 className="h2">{d.title}</h2>}
            {d.body && <p className="mut" style={{ marginTop: 18, fontSize: 18, whiteSpace: 'pre-line' }}>{d.body}</p>}
          </div>
          {img && <img src={img} alt="" className="img" style={{ aspectRatio: '1/1', border: '1px solid var(--line)' }} referrerPolicy="no-referrer" />}
        </div></div>
      )
    }
    case 'gallery':
      return (
        <div className="sec"><div className="wrap">
          <Head title={d.title} />
          {items('images').filter((im) => safeImg(im.url)).length ? (
            <div className="grid3">
              {items('images').filter((im) => safeImg(im.url)).map((im, i) => (
                <figure key={i} style={{ margin: 0 }}>
                  <Img src={im.url} alt={im.caption} style={{ aspectRatio: '1/1', border: '1px solid var(--line)' }} />
                  {im.caption && <figcaption className="mut" style={{ fontSize: 14, marginTop: 8 }}>{im.caption}</figcaption>}
                </figure>
              ))}
            </div>
          ) : editing ? <div className="empty">Add image links in the panel</div> : null}
        </div></div>
      )
    case 'video': {
      const src = videoEmbed(d.url)
      return (
        <div className="sec alt"><div className="wrap" style={{ maxWidth: 960 }}>
          <Head title={d.title} />
          {src ? <div style={{ position: 'relative', paddingTop: '56.25%', border: '1px solid var(--line)' }}><iframe src={src} title={d.title || 'Video'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} /></div>
            : editing ? <div className="empty">Paste a YouTube, Vimeo or Loom link in the panel</div> : null}
        </div></div>
      )
    }
    case 'pricing': {
      const plans = items('plans')
      return (
        <div className="sec" id={undefined}><div className="wrap">
          <Head title={d.title} subtitle={d.subtitle} />
          <div className="grid3" style={plans.length < 3 ? { gridTemplateColumns: `repeat(${Math.max(plans.length, 1)}, minmax(0, 360px))`, justifyContent: 'center' } : undefined}>
            {plans.map((p, i) => (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18, borderColor: p.highlight ? 'var(--acc)' : undefined, boxShadow: p.highlight ? '0 0 0 1px var(--acc)' : undefined }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{p.name}</p>
                  <p style={{ marginTop: 10 }}><span style={{ fontFamily: 'var(--head)', fontWeight: 'var(--hw)', fontSize: 44 }}>{p.price}</span>{p.period && <span className="mut"> / {p.period}</span>}</p>
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10, flex: 1 }}>
                  {String(p.features || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x, j) => (
                    <li key={j} style={{ display: 'flex', gap: 10, fontSize: 15 }}><span style={{ color: 'var(--acc)', fontWeight: 700 }}>✓</span>{x}</li>
                  ))}
                </ul>
                {p.cta?.label && <a className={p.highlight ? 'btn' : 'btn2'} href={safeHref(p.cta.href) || '#'} style={{ justifyContent: 'center' }}>{p.cta.label}</a>}
              </div>
            ))}
          </div>
        </div></div>
      )
    }
    case 'testimonials':
      return (
        <div className="sec alt"><div className="wrap">
          <Head title={d.title} />
          <div className="grid3">
            {items('items').map((t, i) => (
              <figure key={i} className="card" style={{ margin: 0 }}>
                <blockquote style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>“{t.quote}”</blockquote>
                <figcaption style={{ marginTop: 18, fontSize: 14 }}><b>{t.name}</b>{t.role && <span className="mut"> · {t.role}</span>}</figcaption>
              </figure>
            ))}
          </div>
          {!items('items').length && editing && <div className="empty">Add quotes in the panel</div>}
        </div></div>
      )
    case 'faq':
      return (
        <div className="sec"><div className="wrap" style={{ maxWidth: 780 }}>
          <Head title={d.title} />
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {items('items').map((f, i) => (
              <details key={i} open={editing && i === 0}>
                <summary>{f.q}</summary>
                <p className="mut" style={{ paddingBottom: 20, fontSize: 16, whiteSpace: 'pre-line' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div></div>
      )
    case 'signup':
      return <div className="sec alt"><Signup d={d} slug={slug} editing={editing} /></div>
    case 'cta':
      return (
        <div className="sec" style={{ background: 'var(--acc)', color: 'var(--acc-ink)' }}><div className="wrap" style={{ textAlign: 'center', maxWidth: 760 }}>
          <h2 className="h2">{d.title}</h2>
          {d.text && <p style={{ marginTop: 14, fontSize: 18, opacity: 0.85 }}>{d.text}</p>}
          {d.button?.label && <a href={safeHref(d.button.href) || '#'} className="btn" style={{ marginTop: 30, background: 'var(--acc-ink)', color: 'var(--acc)', borderColor: 'var(--acc-ink)' }}>{d.button.label}</a>}
        </div></div>
      )
    case 'custom':
      return <CustomBlock d={d} theme={site.theme} editing={editing} />
    case 'footer':
      return (
        <div style={{ borderTop: '1px solid var(--line)', padding: '36px 0' }}>
          <div className="wrap row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p className="mut" style={{ fontSize: 14 }}>{d.text}</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[...items('links').filter((l) => l.label), ...pageLinks(site, 'footer', base)].map((l, i) => <Nav key={i} l={l} nav={nav} className="mut" style={{ fontSize: 14, textDecoration: 'none' }} />)}
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

export default function SiteRenderer({ site, slug, basePath, editing = false, selectedId, onSelect, labels = {}, onNavigate }) {
  const base = basePath || (slug ? `/site/${slug}` : '')
  if (!site) return null
  const sections = (site.sections || []).filter((s) => !s.hidden)
  return (
    <div className="sr clp-root" id="top" style={themeVars(site.theme)}>
      <style>{CSS}</style>
      {sections.map((s) => (
        <section key={s.id} id={s.anchor || s.type} className={editing ? 'edit' : undefined} data-sel={editing && selectedId === s.id ? 'true' : undefined}
          style={{ position: 'relative', opacity: editing && s._shared ? 0.75 : undefined }}
          onClickCapture={editing ? (e) => { e.preventDefault(); e.stopPropagation(); if (!s._shared) onSelect?.(s.id) } : undefined}>
          {editing && <span className="tag">{s._shared ? `${labels[s.type] || s.type} · edit on Home` : labels[s.type] || s.type}</span>}
          <Section s={s} site={site} slug={slug} editing={editing} base={base} nav={editing ? null : onNavigate} />
        </section>
      ))}
      {!sections.length && <div className="wrap sec"><div className="empty">This page has no visible sections yet.</div></div>}
    </div>
  )
}
