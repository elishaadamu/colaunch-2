import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Globe, Loader2, PanelsTopLeft } from 'lucide-react'
import SiteRenderer from './SiteRenderer'
import { getSite } from '../../services/opsApi'

// Build MVP step: the product website is edited in its own tab (/builder/<pid>).
// This card opens it and shows a small live preview that refreshes when you come back to this tab.
export default function SiteBuilderCard({ project }) {
  const pid = project?.id
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const box = useRef(null)
  const [scale, setScale] = useState(0.4)

  const load = () => {
    if (!pid) return
    getSite(pid).then((r) => { setData(r); setErr('') }).catch((e) => setErr(String(e.message || '').replace(/^\d{3}:\s*/, '')))
  }
  useEffect(() => {
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [pid])
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1200))
    ro.observe(el)
    return () => ro.disconnect()
  }, [data])

  const draft = data?.site?.draft?.sections ? data.site.draft : null
  const url = data?.site?.path ? `${window.location.origin}${data.site.path}` : null
  const open = () => window.open(`/builder/${encodeURIComponent(pid)}`, '_blank', 'noopener')
  const when = data?.site?.updatedAt ? new Date(data.site.updatedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''

  return (
    <section style={{ background: '#0c0c0e', border: '1px solid #26262b' }}>
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-[#ff8fa3]">Product website</p>
          <h3 className="m-0 mt-1 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            {draft ? 'Your website' : 'Build your product website'}
          </h3>
          <p className="m-0 mt-1 text-sm text-[#a1a1aa]">
            {err ? err
              : !data ? 'Loading…'
              : draft ? <>Saved {when}. {data.site.published && url ? <>Live at <a href={url} target="_blank" rel="noreferrer" className="text-white">{url.replace(/^https?:\/\//, '')}</a></> : 'Goes live when you launch in Phase 3.'}</>
              : 'Pick a template, change the words and images, done. No code needed. It opens in a new tab and saves as you go.'}
          </p>
        </div>
        <button type="button" onClick={open} disabled={!pid}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold cursor-pointer border-0"
          style={{ background: '#c81e3c', color: '#fff' }}>
          <PanelsTopLeft className="w-4 h-4" />{draft ? 'Open site builder' : 'Start building'}<ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>
      {draft && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div ref={box} onClick={open} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && open()} aria-label="Open the site builder"
            className="relative overflow-hidden cursor-pointer" style={{ height: 260, border: '1px solid #26262b', background: '#09090b' }}>
            <div style={{ width: 1200, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
              <SiteRenderer site={draft} />
            </div>
            <span className="absolute bottom-2 right-2 text-[11px] px-2 py-1 flex items-center gap-1" style={{ background: 'rgba(0,0,0,.75)', color: '#e4e4e7' }}>
              {data.site.published ? <Globe className="w-3 h-3" /> : <Loader2 className="w-3 h-3 hidden" />}Live preview
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
