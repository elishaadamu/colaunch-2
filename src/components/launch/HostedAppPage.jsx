import { useEffect, useMemo, useState } from 'react'
import { Loader2, Lock, LifeBuoy, Maximize2 } from 'lucide-react'
import { getProductAccess } from '../../services/opsApi'
import { compileSandboxPreviewDocument } from './CloudCodeStudio'
import { buildStudioDocument } from '../../utils/studioRuntime'
import { trackLaunch } from '../../utils/launchTracker'
import { updatePageSEO } from '../../utils/seo'

// Paying customers use the production release here. Sessions, activation and browser errors
// are reported to the launch dashboard.
const ERROR_BRIDGE = `<script>
window.addEventListener('error',function(e){try{parent.postMessage({__cl:'error',message:String(e.message||'').slice(0,200),line:e.lineno},'*')}catch(_){}});
window.addEventListener('unhandledrejection',function(e){try{parent.postMessage({__cl:'error',message:String((e.reason&&e.reason.message)||e.reason||'').slice(0,200)},'*')}catch(_){}});
document.addEventListener('click',function(){try{parent.postMessage({__cl:'interact'},'*')}catch(_){}},{once:true});
</script>`

export default function HostedAppPage({ slug }) {
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : ''
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getProductAccess(slug, token)
      .then((d) => {
        setData(d)
        trackLaunch('session', { projectId: d.projectId, source: 'app', meta: { token } })
      })
      .catch((e) => setError(e?.message || "This link isn't valid."))
  }, [slug, token])

  useEffect(() => {
    if (!data) return undefined
    let activated = false
    const onMsg = (ev) => {
      if (!ev.data || !ev.data.__cl) return
      if (ev.data.__cl === 'error') trackLaunch('js_error', { projectId: data.projectId, source: 'app', meta: { message: ev.data.message, line: ev.data.line, token } })
      if (ev.data.__cl === 'interact' && !activated) {
        activated = true
        trackLaunch('activated', { projectId: data.projectId, source: 'app', meta: { token } })
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [data, token])

  const productName = data?.project?.productName || 'Your product'
  useEffect(() => { updatePageSEO({ title: productName, description: data?.project?.productTagline || '' }) }, [productName])

  const doc = useMemo(() => {
    if (data?.release?.url) return ''
    const files = data?.release?.files || []
    if (!files.length) return ''
    const html = data.release.runtime === 'studio'
      ? buildStudioDocument(files.map((f) => ({ path: f.name, content: f.content })), { title: data?.project?.productName })
      : compileSandboxPreviewDocument(files.find((f) => f.name === data.release.entry) || files[0], files)
    return html.includes('</head>') ? html.replace('</head>', `${ERROR_BRIDGE}</head>`) : ERROR_BRIDGE + html
  }, [data])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050506', color: '#e4e4e7' }}>
        <div className="max-w-md text-center space-y-3 p-8" style={{ border: '1px solid #27272a', background: '#0c0c0e' }}>
          <Lock className="w-6 h-6 mx-auto" style={{ color: '#a1a1aa' }} />
          <p className="m-0 text-lg font-semibold text-white">Can't open this link</p>
          <p className="m-0 text-sm" style={{ color: '#a1a1aa' }}>{error}</p>
        </div>
      </div>
    )
  }
  if (!data) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#050506' }}><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050506' }}>
      <header className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid #1c1c20', color: '#e4e4e7' }}>
        <span className="text-sm font-semibold truncate">{productName} <span className="text-xs font-normal" style={{ color: '#71717a' }}>{data.release?.version}</span></span>
        <span className="flex items-center gap-3 text-xs">
          {data.project?.supportEmail && <a href={`mailto:${data.project.supportEmail}`} className="flex items-center gap-1" style={{ color: '#a1a1aa' }}><LifeBuoy className="w-3.5 h-3.5" />Support</a>}
          <button type="button" className="flex items-center gap-1 cursor-pointer" style={{ color: '#a1a1aa' }} onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(doc); w.document.close() } }}><Maximize2 className="w-3.5 h-3.5" />Full screen</button>
        </span>
      </header>
      {data.release?.url ? (
        <iframe title={productName} src={data.release.url} className="flex-1 w-full block" style={{ border: 0, background: '#fff', minHeight: 'calc(100vh - 44px)' }} />
      ) : <iframe title={productName} srcDoc={doc} sandbox="allow-scripts allow-forms allow-modals allow-popups" className="flex-1 w-full block" style={{ border: 0, background: '#fff', minHeight: 'calc(100vh - 44px)' }} />}
    </div>
  )
}
