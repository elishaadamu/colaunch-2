import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import SiteRenderer from './SiteRenderer'
import { siteFromTemplate, safeImg, pageView } from './siteSchema'
import { getPublicSite } from '../../services/opsApi'

function setMeta(name, content, attr = 'name') {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
  el.setAttribute('content', content || '')
}

export default function SitePublicPage({ slug: rawSlug, handle }) {
  const [slug, subPath = ''] = String(rawSlug || '').split('/')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    getPublicSite(slug, handle)
      .then((r) => {
        const site = r.site?.sections ? r.site : siteFromTemplate(r.project, 'launch')
        const page = subPath ? (site.pages || []).find((pg) => pg.path === subPath) : null
        if (subPath && !page) { setErr("This page doesn't exist."); return }
        setData({ ...r, site, view: page ? pageView(site, page.id) : site })
        const s = site.settings || {}
        document.title = page ? `${page.title} · ${site.sections?.find((x) => x.type === 'nav')?.data?.brand || r.project?.productName || ''}` : (s.title || r.project?.productName || 'CoLaunch')
        setMeta('description', s.description)
        setMeta('og:title', s.title, 'property')
        setMeta('og:description', s.description, 'property')
        const hero = (site.sections || []).find((x) => x.type === 'hero')
        if (safeImg(hero?.data?.image)) setMeta('og:image', safeImg(hero.data.image), 'property')
        const fav = safeImg(s.faviconUrl) || safeImg(s.logoUrl)
        if (fav) {
          let link = document.head.querySelector('link[rel="icon"]')
          if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
          link.href = fav
        }
      })
      .catch((e) => setErr(/^410/.test(String(e.message)) ? 'This product is no longer available.' : "This page isn't published yet."))
  }, [slug, subPath, handle])

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#09090b', color: '#a1a1aa', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="text-center">
          <p className="m-0 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{err}</p>
          <a href="/" className="inline-block mt-4 text-sm" style={{ color: '#a1a1aa' }}>CoLaunch</a>
        </div>
      </div>
    )
  }
  if (!data) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}><Loader2 className="w-6 h-6 animate-spin text-zinc-600" /></div>
  return <SiteRenderer site={data.view} slug={data.slug} basePath={data.path} />
}
