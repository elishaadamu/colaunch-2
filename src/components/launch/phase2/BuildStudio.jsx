import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles, Send, Loader2, Check, FileCode2, Eye, Code2, Server, RotateCcw, ExternalLink, CloudUpload, AlertTriangle,
  Wand2, Square, Copy, ChevronRight, Clock, Bot, User,
} from 'lucide-react'
import { getStudio, restoreStudioCheckpoint, streamSSE, deployStaging } from '../../../services/opsApi'
import { buildStudioDocument } from '../../../utils/studioRuntime'
import { bumpVersion } from '../../../utils/betaTokens'
import FormattedMarkdownBody from '../FormattedMarkdownBody'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.bs .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.bs .tab{display:inline-flex;align-items:center;gap:.4rem;padding:.6rem .9rem;font-size:.8125rem;font-weight:600;color:#a1a1aa;border-bottom:2px solid transparent;cursor:pointer}
.bs .tab[aria-selected="true"]{color:#fafafa;border-color:#c81e3c}
.bs .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;font-size:.75rem;font-weight:600;padding:.5rem .75rem;cursor:pointer;border:1px solid #2a2a30;background:#16161a;color:#e4e4e7}
.bs .btn:hover:not(:disabled){border-color:#3f3f46;color:#fff}
.bs .btn:disabled{opacity:.45;cursor:not-allowed}
.bs .btn-primary{background:#c81e3c;border-color:#c81e3c;color:#fff}
.bs .chip{display:inline-flex;align-items:center;gap:.3rem;padding:.35rem .6rem;font-size:.75rem;border:1px solid #2a2a30;background:#0c0c0e;color:#d4d4d8;cursor:pointer;text-align:left}
.bs .chip:hover{border-color:#c81e3c;color:#fff}
.bs :focus-visible{outline:2px solid #c81e3c;outline-offset:2px}
@keyframes bsPulse{0%,100%{opacity:1}50%{opacity:.35}}
.bs .pulse{animation:bsPulse 1.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.bs .pulse{animation:none}}
`

// Parse the live model output as it streams: plan lines, finished files, the file being written now
function parseLive(text) {
  const planM = text.match(/<plan>([\s\S]*?)(<\/plan>|$)/)
  const plan = planM ? planM[1].split('\n').map((l) => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean) : []
  const done = []
  const re = /<file path="([^"]+)">\n?([\s\S]*?)<\/file>/g
  let m
  let lastEnd = 0
  while ((m = re.exec(text))) { done.push({ path: m[1], content: m[2].replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```\s*$/, '\n') }); lastEnd = re.lastIndex }
  const open = text.slice(lastEnd).match(/<file path="([^"]+)">\n?([\s\S]*)$/)
  const summary = (text.match(/<summary>([\s\S]*?)(<\/summary>|$)/) || [])[1]?.trim() || ''
  return { plan, done, writing: open ? { path: open[1], chars: open[2].length } : null, summary }
}

const fmtTime = (iso) => { try { return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) } catch { return '' } }

export default function BuildStudio({ project, buildPlan, showToast, onUpdateProject }) {
  const pid = project?.id
  const [files, setFiles] = useState([])
  const [messages, setMessages] = useState([])
  const [checkpoints, setCheckpoints] = useState([])
  const [advice, setAdvice] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState('preview')
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(null) // { kind: 'build'|'advice', text, model, startedAt }
  const [previewError, setPreviewError] = useState('')
  const [activeFile, setActiveFile] = useState(null)
  const [deploying, setDeploying] = useState(false)
  const [, tick] = useState(0)
  const abortRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!pid) return
    getStudio(pid).then((s) => {
      setFiles(s.files || []); setMessages(s.messages || []); setCheckpoints(s.checkpoints || []); setAdvice(s.advice || null)
    }).catch((e) => console.warn('[Studio] load', e)).finally(() => setLoaded(true))
  }, [pid])

  useEffect(() => {
    const onMsg = (ev) => {
      if (ev.data?.__studio === 'error') setPreviewError(ev.data.message)
      if (ev.data?.__studio === 'ready') setPreviewError('')
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages.length, running?.text?.length])

  const live = useMemo(() => (running?.kind === 'build' ? parseLive(running.text) : null), [running])
  // While streaming, the preview updates every time a file is finished
  const previewFiles = useMemo(() => {
    if (!live?.done?.length) return files
    const map = new Map(files.map((f) => [f.path, f]))
    live.done.forEach((f) => map.set(f.path, f))
    return [...map.values()]
  }, [files, live?.done?.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const previewDoc = useMemo(() => (previewFiles.length ? buildStudioDocument(previewFiles, { title: project?.productName }) : ''), [previewFiles, project?.productName])

  const spec = buildPlan?.productSpec || {}
  const brief = useMemo(() => {
    const screens = (spec.screens || []).map((s) => s.name).filter(Boolean)
    return `Build the first complete version of ${project?.productName || 'the product'}${screens.length ? ` with these screens: ${screens.join(', ')}` : ''}. Follow the user flows in the brief and use realistic data for ${spec.targetCustomer || 'its customers'}.`
  }, [spec, project?.productName])
  const suggestions = files.length
    ? [...(spec.screens || []).slice(0, 4).map((s) => `Make the ${s.name} screen feel finished: real states, polish, details`), 'Make every screen work well on mobile', 'Add onboarding for a first-time user', 'Tighten the visual design and spacing']
    : [brief]

  const send = async (text, { previewErr } = {}) => {
    const p = (text || prompt).trim()
    if (!p || running) return
    setPrompt('')
    setPreviewError('')
    setTab('preview')
    setMessages((m) => [...m, { role: 'user', text: p, at: new Date().toISOString() }])
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setRunning({ kind: 'build', text: '', model: null, startedAt: Date.now(), stage: 'thinking' })
    try {
      await streamSSE(`/studio/${pid}/generate`, { prompt: p, previewError: previewErr || null }, (event, data) => {
        if (event === 'model') setRunning((r) => r && { ...r, model: data.model })
        if (event === 'delta') setRunning((r) => r && { ...r, text: r.text + data.t, stage: 'writing' })
        if (event === 'done') {
          setFiles(data.files)
          setCheckpoints((c) => [...c, data.checkpoint])
          setMessages((m) => [...m, { role: 'assistant', plan: data.plan, summary: data.summary, changed: data.changed, deleted: data.deleted, checkpoint: data.checkpoint.id, model: data.checkpoint.model, at: data.checkpoint.at }])
          if (!activeFile && data.changed?.[0]) setActiveFile(data.changed[0])
        }
        if (event === 'error') {
          setMessages((m) => [...m, { role: 'system', text: data.message, error: true, at: new Date().toISOString() }])
        }
      }, ctrl.signal)
    } catch (e) {
      if (e.name !== 'AbortError') setMessages((m) => [...m, { role: 'system', text: e.message, error: true, at: new Date().toISOString() }])
      else setMessages((m) => [...m, { role: 'system', text: 'Stopped. Nothing from this turn was saved.', at: new Date().toISOString() }])
    } finally { setRunning(null); abortRef.current = null }
  }

  const getAdvice = async () => {
    if (running) return
    setTab('backend')
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setRunning({ kind: 'advice', text: '', model: null, startedAt: Date.now() })
    try {
      await streamSSE(`/studio/${pid}/backend-advice`, {}, (event, data) => {
        if (event === 'model') setRunning((r) => r && { ...r, model: data.model })
        if (event === 'delta') setRunning((r) => r && { ...r, text: r.text + data.t })
        if (event === 'done') setAdvice({ markdown: data.markdown, at: new Date().toISOString() })
        if (event === 'error') showToast?.(data.message, 'error', 7000)
      }, ctrl.signal)
    } catch (e) { if (e.name !== 'AbortError') showToast?.(e.message, 'error', 7000) } finally { setRunning(null); abortRef.current = null }
  }

  const restore = async (cp) => {
    try {
      const r = await restoreStudioCheckpoint(pid, cp)
      setFiles(r.files)
      setMessages((m) => [...m, { role: 'system', text: 'Restored an earlier version.', at: new Date().toISOString() }])
    } catch (e) { showToast?.(e.message, 'error') }
  }

  const deploy = async () => {
    if (!files.length) return
    setDeploying(true)
    try {
      const version = bumpVersion(project?.staging?.version || 'v0.0.0', 'minor')
      const res = await deployStaging(pid, { version, runtime: 'studio', files: files.map((f) => ({ name: f.path, content: f.content })), notes: messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.summary || '' })
      onUpdateProject?.((prev) => ({ ...(prev || {}), staging: res.staging, mvpVersion: version }))
      showToast?.(`Staging ${version} is live for beta testers.`, 'success', 6000)
    } catch (e) { showToast?.(`Deploy failed: ${e.message}`, 'error', 7000) } finally { setDeploying(false) }
  }

  const openTab = () => { const w = window.open('', '_blank'); if (w) { w.document.write(previewDoc); w.document.close() } }
  const elapsed = running ? Math.round((Date.now() - running.startedAt) / 1000) : 0
  const codeFile = files.find((f) => f.path === activeFile) || files[0]

  return (
    <section className="bs" style={{ background: '#0a0a0c', border: '1px solid #26262b' }}>
      <style>{CSS}</style>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1f1f24' }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'rgba(200,30,60,.15)', border: '1px solid rgba(200,30,60,.45)', color: '#ff8fa3' }}><Wand2 className="w-4 h-4" /></span>
          <div className="min-w-0">
            <p className="serif m-0 text-xl text-white leading-none">Build Studio</p>
            <p className="m-0 mt-1 text-[11px] text-[#71717a]">Describe it, watch it get built. Frontend only; the backend is planned with you.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {checkpoints.length > 0 && <span className="text-[11px] text-[#71717a] flex items-center gap-1"><Clock className="w-3 h-3" />{checkpoints.length} versions</span>}
          <button type="button" className="btn" onClick={openTab} disabled={!files.length}><ExternalLink className="w-3.5 h-3.5" />Open</button>
          <button type="button" className="btn btn-primary" onClick={deploy} disabled={!files.length || deploying || !!running}>{deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}Deploy to staging</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr]" style={{ minHeight: 720 }}>
        {/* Chat */}
        <aside className="flex flex-col" style={{ borderRight: '1px solid #1f1f24', maxHeight: 820 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!loaded && <p className="text-xs text-[#71717a]">Loading…</p>}
            {loaded && !messages.length && !running && (
              <div className="p-4 space-y-2" style={{ background: '#0f0f12', border: '1px dashed #2a2a30' }}>
                <p className="m-0 text-sm text-white font-semibold">Start from the spec</p>
                <p className="m-0 text-xs text-[#a1a1aa]">The AI reads the Phase 2 spec (screens, flows, features, brand) and builds a working frontend you can click through. Then keep asking for changes.</p>
              </div>
            )}
            {messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="flex gap-2 justify-end">
                  <p className="m-0 max-w-[85%] px-3 py-2 text-sm text-white whitespace-pre-wrap" style={{ background: '#1c1c20', border: '1px solid #2a2a30' }}>{m.text}</p>
                  <User className="w-4 h-4 mt-2 shrink-0 text-[#71717a]" />
                </div>
              ) : m.role === 'assistant' ? (
                <div key={i} className="flex gap-2">
                  <Bot className="w-4 h-4 mt-1 shrink-0 text-[#ff8fa3]" />
                  <div className="flex-1 min-w-0 p-3 space-y-2" style={{ background: '#0f0f12', border: '1px solid #1f1f24' }}>
                    {m.plan && <ul className="list-none m-0 p-0 space-y-1">{m.plan.split('\n').map((l) => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).map((l) => <li key={l} className="flex items-start gap-1.5 text-xs text-[#a1a1aa]"><Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#34d399]" />{l}</li>)}</ul>}
                    {m.summary && <p className="m-0 text-sm text-[#e4e4e7] leading-relaxed">{m.summary}</p>}
                    {(m.changed || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">{m.changed.map((f) => <button key={f} type="button" className="chip" onClick={() => { setActiveFile(f); setTab('code') }}><FileCode2 className="w-3 h-3" />{f.replace(/^src\//, '')}</button>)}</div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-[#52525b]">
                      <span>{m.model || ''} · {fmtTime(m.at)}</span>
                      {m.checkpoint && <button type="button" className="flex items-center gap-1 hover:text-white cursor-pointer" onClick={() => restore(m.checkpoint)}><RotateCcw className="w-3 h-3" />Restore this version</button>}
                    </div>
                  </div>
                </div>
              ) : (
                <p key={i} className="m-0 text-xs px-3 py-2" style={{ color: m.error ? '#ffb3c1' : '#a1a1aa', background: m.error ? 'rgba(255,77,109,.08)' : '#0f0f12', border: `1px solid ${m.error ? 'rgba(255,77,109,.3)' : '#1f1f24'}` }}>{m.text}</p>
              )
            ))}

            {running?.kind === 'build' && (
              <div className="flex gap-2">
                <Bot className="w-4 h-4 mt-1 shrink-0 text-[#ff8fa3]" />
                <div className="flex-1 min-w-0 p-3 space-y-2" style={{ background: '#0f0f12', border: '1px solid rgba(200,30,60,.4)' }}>
                  <p className="m-0 text-xs flex items-center gap-1.5 text-[#ff8fa3]"><Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {!running.text ? 'Thinking through the build…' : live?.writing ? `Writing ${live.writing.path.replace(/^src\//, '')}` : live?.summary ? 'Wrapping up…' : 'Planning…'}
                    <span className="ml-auto text-[#52525b]">{elapsed}s{running.model ? ` · ${running.model}` : ''}</span>
                  </p>
                  {live?.plan?.length > 0 && <ul className="list-none m-0 p-0 space-y-1">{live.plan.map((l, idx) => {
                    const doneSteps = Math.min(live.plan.length, live.done.length)
                    return <li key={idx} className="flex items-start gap-1.5 text-xs" style={{ color: idx < doneSteps ? '#a1a1aa' : '#e4e4e7' }}>{idx < doneSteps ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#34d399]" /> : <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#52525b]" />}{l}</li>
                  })}</ul>}
                  {(live?.done?.length > 0 || live?.writing) && (
                    <ul className="list-none m-0 p-0 space-y-0.5 pt-1" style={{ borderTop: '1px solid #1f1f24' }}>
                      {live.done.map((f) => <li key={f.path} className="text-[11px] font-mono flex items-center gap-1.5 text-[#a1a1aa]"><Check className="w-3 h-3 text-[#34d399]" />{f.path} <span className="text-[#52525b]">{f.content.split('\n').length} lines</span></li>)}
                      {live.writing && <li className="text-[11px] font-mono flex items-center gap-1.5 text-white"><span className="w-1.5 h-1.5 pulse" style={{ background: '#c81e3c' }} />{live.writing.path} <span className="text-[#52525b]">{live.writing.chars.toLocaleString()} chars</span></li>}
                    </ul>
                  )}
                  <button type="button" className="btn" onClick={() => abortRef.current?.abort()}><Square className="w-3 h-3" />Stop</button>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {previewError && !running && (
            <div className="mx-4 mb-2 p-2.5 text-xs space-y-1.5" style={{ background: 'rgba(255,77,109,.08)', border: '1px solid rgba(255,77,109,.35)', color: '#ffb3c1' }}>
              <p className="m-0 flex items-center gap-1.5 font-semibold"><AlertTriangle className="w-3.5 h-3.5" />The preview has an error</p>
              <p className="m-0 font-mono text-[10px] line-clamp-3 opacity-80">{previewError}</p>
              <button type="button" className="btn btn-primary" onClick={() => send('Fix the error shown in the preview.', { previewErr: previewError })}><Wand2 className="w-3 h-3" />Ask AI to fix it</button>
            </div>
          )}

          <div className="p-3 space-y-2" style={{ borderTop: '1px solid #1f1f24' }}>
            {!running && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, files.length ? 5 : 1).map((s) => <button key={s} type="button" className="chip" onClick={() => send(s)}><Sparkles className="w-3 h-3 shrink-0 text-[#ff8fa3]" /><span className="line-clamp-2">{files.length ? s : 'Build the first version from the spec'}</span></button>)}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex gap-2">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} disabled={!!running}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() } }}
                placeholder={files.length ? 'Describe a change… (⌘↵ to send)' : 'Describe the app, or use the spec suggestion above'}
                className="flex-1 px-3 py-2 text-sm text-white outline-none resize-none" style={{ background: '#050506', border: '1px solid #2a2a30' }} />
              <button type="submit" className="btn btn-primary self-stretch" disabled={!prompt.trim() || !!running} aria-label="Send"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        </aside>

        {/* Preview / code / backend */}
        <div className="flex flex-col min-w-0">
          <div role="tablist" className="flex px-2" style={{ borderBottom: '1px solid #1f1f24' }}>
            {[['preview', 'Preview', Eye], ['code', `Code${files.length ? ` · ${files.length}` : ''}`, Code2], ['backend', 'Backend plan', Server]].map(([id, label, I]) => (
              <button key={id} role="tab" aria-selected={tab === id} type="button" className="tab" onClick={() => setTab(id)}><I className="w-3.5 h-3.5" />{label}</button>
            ))}
          </div>

          {tab === 'preview' && (
            <div className="flex-1 relative" style={{ background: '#fff' }}>
              {previewDoc ? (
                <iframe key={previewFiles.length + ':' + (live?.done?.length || 0)} title="Live preview" srcDoc={previewDoc} sandbox="allow-scripts allow-forms allow-modals allow-popups" className="absolute inset-0 w-full h-full" style={{ border: 0 }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center" style={{ background: '#0a0a0c' }}>
                  <div className="space-y-3 max-w-sm">
                    <Wand2 className="w-8 h-8 mx-auto text-[#ff8fa3]" />
                    <p className="serif m-0 text-2xl text-white">Nothing built yet</p>
                    <p className="m-0 text-sm text-[#a1a1aa]">Start with the spec suggestion. The preview appears as soon as the first files are written.</p>
                    <button type="button" className="btn btn-primary" disabled={!!running} onClick={() => send(brief)}><Sparkles className="w-3.5 h-3.5" />Build from the spec</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'code' && (
            <div className="flex-1 grid grid-cols-[220px_1fr] min-h-0">
              <ul className="list-none m-0 p-2 space-y-0.5 overflow-y-auto" style={{ borderRight: '1px solid #1f1f24', maxHeight: 760 }}>
                {files.map((f) => (
                  <li key={f.path}><button type="button" onClick={() => setActiveFile(f.path)} className="w-full text-left px-2 py-1.5 text-xs font-mono truncate cursor-pointer" style={{ background: codeFile?.path === f.path ? '#1c1c20' : 'transparent', color: codeFile?.path === f.path ? '#fff' : '#a1a1aa' }}>{f.path}</button></li>
                ))}
                {!files.length && <li className="px-2 py-1.5 text-xs text-[#52525b]">No files yet</li>}
              </ul>
              <div className="relative min-w-0 overflow-auto" style={{ maxHeight: 760 }}>
                {codeFile && (
                  <>
                    <button type="button" className="btn absolute top-2 right-2" onClick={() => { navigator.clipboard?.writeText(codeFile.content); showToast?.('Copied.', 'info') }}><Copy className="w-3 h-3" />Copy</button>
                    <pre className="m-0 p-4 text-[12px] leading-relaxed font-mono text-[#e4e4e7] whitespace-pre">{codeFile.content}</pre>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'backend' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: 780 }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <p className="serif m-0 text-2xl text-white">How to structure the backend</p>
                  <p className="m-0 mt-1 text-xs text-[#a1a1aa] max-w-xl">Advice only, no backend code. It reads the spec and every <code className="text-[#e4e4e7]">// API:</code> contract the frontend relies on, then recommends the data model, endpoints, auth, payments and build order for your engineers.</p>
                </div>
                <button type="button" className="btn btn-primary shrink-0" onClick={getAdvice} disabled={!!running}>{running?.kind === 'advice' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}{advice ? 'Refresh advice' : 'Get backend advice'}</button>
              </div>
              {running?.kind === 'advice' ? (
                <div className="p-4" style={{ background: '#0f0f12', border: '1px solid #1f1f24' }}>
                  <p className="m-0 mb-3 text-xs text-[#ff8fa3] flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{running.text ? 'Writing…' : 'Thinking…'} <span className="text-[#52525b]">{elapsed}s</span></p>
                  <FormattedMarkdownBody text={running.text} />
                </div>
              ) : advice?.markdown ? (
                <div className="p-4" style={{ background: '#0f0f12', border: '1px solid #1f1f24' }}>
                  <p className="m-0 mb-3 text-[10px] text-[#52525b]">Updated {fmtTime(advice.at)}</p>
                  <FormattedMarkdownBody text={advice.markdown} />
                </div>
              ) : (
                <p className="m-0 p-4 text-sm text-[#71717a]" style={{ border: '1px dashed #2a2a30' }}>Build the frontend first for the most specific advice: each `// API:` comment becomes an endpoint the backend must provide.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
