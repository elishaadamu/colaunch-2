import { useEffect, useState } from 'react'
import {
  Github, KeyRound, Terminal, Copy, Check, Loader2, RefreshCw, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle,
  Bot, User, GitCommit, ExternalLink, PlayCircle, Ban, Plug,
} from 'lucide-react'
import {
  getBuildStatus, connectBuildGithub, disconnectBuildGithub, createBuildAgentKey, revokeBuildAgentKey, syncBuildCi,
} from '../../../services/opsApi'

const BACKEND = (import.meta.env.VITE_BACKEND_URL || 'https://colaunch-backend.onrender.com').replace(/\/$/, '')
const MCP_URL = `${BACKEND}/mcp`

const WORKFLOWS = {
  node: `name: tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present`,
  python: `name: tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11', cache: pip }
      - run: pip install -r requirements.txt
      - run: pytest -q`,
}

const CI_BADGE = {
  success: [CheckCircle2, '#34d399', 'CI passed'],
  failure: [XCircle, '#ff8fa3', 'CI failed'],
  pending: [Clock, '#fbbf24', 'CI running'],
  no_ci: [AlertTriangle, '#fbbf24', 'No CI ran'],
  not_found: [AlertTriangle, '#fbbf24', 'Not pushed'],
  error: [AlertTriangle, '#ff8fa3', 'GitHub error'],
}

function CopyBlock({ text, label }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative">
      <pre className="m-0 p-3 pr-20 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all" style={{ background: '#050506', border: '1px solid #2a2a30', color: '#e4e4e7' }}>{text}</pre>
      <button type="button" aria-label={`Copy ${label || ''}`} className="absolute top-2 right-2 px-2 py-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer" style={{ background: '#1c1c20', border: '1px solid #2a2a30', color: '#e4e4e7' }}
        onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}>
        {copied ? <Check className="w-3 h-3" style={{ color: '#34d399' }} /> : <Copy className="w-3 h-3" />}{copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function BuildAgentPanel({ project, engineeringTasks = [], showToast, onRefreshProject }) {
  const pid = project?.id
  const [status, setStatus] = useState(null)
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [branch, setBranch] = useState('main')
  const [busy, setBusy] = useState('')
  const [newKey, setNewKey] = useState('')
  const [client, setClient] = useState('claude')
  const [stack, setStack] = useState('node')

  const load = async () => {
    if (!pid) return
    try {
      const s = await getBuildStatus(pid)
      setStatus(s)
      if (s.github?.repo) { setRepo(s.github.repo); setBranch(s.github.branch || 'main') }
    } catch (e) { console.warn('[BuildAgent] status', e) }
  }
  useEffect(() => {
    load()
    const id = setInterval(() => { if (document.visibilityState === 'visible') { load(); onRefreshProject?.() } }, 30000)
    return () => clearInterval(id)
  }, [pid]) // eslint-disable-line react-hooks/exhaustive-deps

  const connect = async (e) => {
    e.preventDefault()
    setBusy('github')
    try {
      const r = await connectBuildGithub(pid, { repo, token: token || undefined, branch })
      setToken('')
      showToast?.(`Connected ${r.repo}. Commits the agent submits are verified by its CI.`, 'success')
      await load()
    } catch (err) { showToast?.(err.message, 'error', 7000) } finally { setBusy('') }
  }
  const makeKey = async () => {
    setBusy('key')
    try { const r = await createBuildAgentKey(pid, client === 'claude' ? 'Claude Code' : 'Cursor'); setNewKey(r.key); await load() }
    catch (err) { showToast?.(err.message, 'error') } finally { setBusy('') }
  }
  const revoke = async (prefix) => { await revokeBuildAgentKey(pid, prefix).catch(() => {}); if (newKey.startsWith(prefix)) setNewKey(''); load() }
  const recheck = async () => {
    setBusy('sync')
    try { const r = await syncBuildCi(pid); showToast?.(`Re-checked ${r.rechecked} commits on GitHub.`, 'info'); await onRefreshProject?.(); await load() }
    finally { setBusy('') }
  }

  const keyShown = newKey || '<YOUR_AGENT_KEY>'
  const claudeCmd = `claude mcp add --transport http colaunch ${MCP_URL} --header "Authorization: Bearer ${keyShown}"`
  const cursorCfg = JSON.stringify({ mcpServers: { colaunch: { url: MCP_URL, headers: { Authorization: `Bearer ${keyShown}` } } } }, null, 2)
  const prompt = `Use the colaunch MCP server. Call get_build_context, then keep calling get_next_task and build each task in this repo until none are left: meet every acceptance criterion, write tests, run them and report each run with report_test_run, fix until green, push, submit_commit, and check_ci until it passes.`

  const tasks = engineeringTasks
  const verified = tasks.filter((t) => t.verified).length
  const connected = Boolean(status?.github?.repo)
  const keys = status?.keys || []
  const lastUse = keys.map((k) => k.lastUsedAt).filter(Boolean).sort().pop()

  return (
    <section className="p-4 sm:p-5 space-y-5" style={{ background: '#111114', border: '1px solid #2a2a30' }}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#71717A] flex items-center gap-1.5"><Plug className="w-3 h-3" />Real build</p>
          <h3 className="m-0 mt-1 text-2xl text-[#FAFAFA]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Build in a real repo with a coding agent</h3>
          <p className="m-0 mt-1 text-sm text-[#A1A1AA] max-w-3xl">Claude Code or Cursor connects to this plan over MCP, writes the code in your GitHub repo, runs the real tests as many times as it takes, and reports every run. A task counts as done only when GitHub CI passes on its commit.</p>
        </div>
        <span className="text-xs px-2.5 py-1.5 font-semibold shrink-0" style={{ background: '#0C0C0E', border: '1px solid #2a2a30', color: lastUse ? '#34d399' : '#A1A1AA' }}>
          {lastUse ? `Agent active ${new Date(lastUse).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'No agent connected yet'}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 1. GitHub */}
        <div className="p-4 space-y-3" style={{ background: '#0C0C0E', border: `1px solid ${connected ? 'rgba(52,211,153,.38)' : '#2a2a30'}` }}>
          <p className="m-0 text-sm font-semibold text-[#FAFAFA] flex items-center gap-2"><Github className="w-4 h-4" />1. Connect GitHub</p>
          {connected ? (
            <div className="space-y-2">
              <a href={status.github.url} target="_blank" rel="noreferrer" className="text-sm text-[#E4E4E7] flex items-center gap-1.5 break-all">{status.github.repo} <ExternalLink className="w-3 h-3" /></a>
              <p className="m-0 text-[11px] text-[#71717A]">Branch {status.github.branch} · token stored encrypted · CI re-checked every 2 minutes</p>
              <div className="flex gap-2">
                <button type="button" onClick={recheck} disabled={busy === 'sync'} className="px-3 py-1.5 text-xs font-semibold bg-[#1C1C20] border border-[#2a2a30] text-[#E4E4E7] flex items-center gap-1.5 cursor-pointer">{busy === 'sync' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}Re-check CI</button>
                <button type="button" onClick={async () => { await disconnectBuildGithub(pid); setRepo(''); load() }} className="px-3 py-1.5 text-xs font-semibold bg-transparent border border-[#2a2a30] text-[#A1A1AA] cursor-pointer">Disconnect</button>
              </div>
            </div>
          ) : (
            <form onSubmit={connect} className="space-y-2">
              <input className="w-full px-3 py-2 text-sm bg-[#050506] border border-[#2a2a30] text-white outline-none" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo" required />
              <input className="w-full px-3 py-2 text-sm bg-[#050506] border border-[#2a2a30] text-white outline-none" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="GitHub token (read access)" autoComplete="off" required />
              <input className="w-full px-3 py-2 text-sm bg-[#050506] border border-[#2a2a30] text-white outline-none" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
              <p className="m-0 text-[11px] text-[#71717A]">Fine-grained token: this repo only, read access to Contents, Commit statuses and Checks.</p>
              <button type="submit" disabled={busy === 'github'} className="w-full px-3 py-2 text-xs font-semibold bg-[#C81E3C] text-white flex items-center justify-center gap-1.5 cursor-pointer">{busy === 'github' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}Connect repo</button>
            </form>
          )}
          <div className="pt-2 space-y-2" style={{ borderTop: '1px solid #2a2a30' }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#A1A1AA]">CI workflow · <code>.github/workflows/tests.yml</code></span>
              <div className="flex">{['node', 'python'].map((k) => <button key={k} type="button" onClick={() => setStack(k)} className="px-2 py-0.5 text-[11px] cursor-pointer" style={{ background: stack === k ? '#1C1C20' : 'transparent', color: stack === k ? '#fff' : '#71717A', border: '1px solid #2a2a30' }}>{k}</button>)}</div>
            </div>
            <CopyBlock text={WORKFLOWS[stack]} label="workflow" />
          </div>
        </div>

        {/* 2. Agent key + MCP */}
        <div className="p-4 space-y-3 xl:col-span-2" style={{ background: '#0C0C0E', border: '1px solid #2a2a30' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-sm font-semibold text-[#FAFAFA] flex items-center gap-2"><KeyRound className="w-4 h-4" />2. Connect your coding agent</p>
            <div className="flex">{[['claude', 'Claude Code'], ['cursor', 'Cursor']].map(([k, l]) => <button key={k} type="button" onClick={() => setClient(k)} className="px-2.5 py-1 text-xs cursor-pointer" style={{ background: client === k ? '#1C1C20' : 'transparent', color: client === k ? '#fff' : '#71717A', border: '1px solid #2a2a30' }}>{l}</button>)}</div>
          </div>
          {newKey ? (
            <p className="m-0 text-xs text-[#fbbf24]">Copy this now. The key is shown once and only works for this project.</p>
          ) : (
            <button type="button" onClick={makeKey} disabled={busy === 'key'} className="px-3 py-2 text-xs font-semibold bg-[#C81E3C] text-white flex items-center gap-1.5 cursor-pointer">{busy === 'key' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}Create agent key</button>
          )}
          {client === 'claude' ? (
            <>
              <p className="m-0 text-xs text-[#A1A1AA] flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" />Run in your repo folder:</p>
              <CopyBlock text={claudeCmd} label="command" />
            </>
          ) : (
            <>
              <p className="m-0 text-xs text-[#A1A1AA]">Add to <code>.cursor/mcp.json</code> in your repo:</p>
              <CopyBlock text={cursorCfg} label="config" />
            </>
          )}
          <p className="m-0 text-xs text-[#A1A1AA] flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" />Then give the agent this instruction:</p>
          <CopyBlock text={prompt} label="prompt" />
          {keys.length > 0 && (
            <ul className="list-none m-0 p-0 space-y-1">
              {keys.map((k) => (
                <li key={k.prefix} className="flex items-center justify-between gap-2 text-[11px] px-2.5 py-1.5" style={{ background: '#050506', border: '1px solid #2a2a30', color: '#A1A1AA' }}>
                  <span><code className="text-[#E4E4E7]">{k.prefix}…</code> · {k.label} · {k.lastUsedAt ? `used ${new Date(k.lastUsedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'never used'}</span>
                  <button type="button" onClick={() => revoke(k.prefix)} className="flex items-center gap-1 cursor-pointer text-[#ff8fa3]"><Trash2 className="w-3 h-3" />Revoke</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 3. Live task board */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="m-0 text-sm font-semibold text-[#FAFAFA]">3. Work tracked from the agent · {verified}/{tasks.length} verified</p>
          <span className="text-[11px] text-[#71717A]">refreshes every 30s</span>
        </div>
        <ul className="list-none m-0 p-0 space-y-1.5">
          {tasks.map((t) => {
            const ci = t.ci?.state ? CI_BADGE[t.ci.state] : null
            const CiIcon = ci ? ci[0] : null
            const Who = t.assignedTo === 'Human Engineer' ? User : Bot
            return (
              <li key={t.id} className="px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ background: '#0C0C0E', border: `1px solid ${t.verified ? 'rgba(52,211,153,.38)' : '#2a2a30'}` }}>
                <span className="flex-1 min-w-[14rem] text-sm text-[#FAFAFA] flex items-center gap-2"><Who className="w-3.5 h-3.5 text-[#71717A] shrink-0" />{t.title}</span>
                <span className="text-[11px] font-semibold" style={{ color: t.verified ? '#34d399' : t.status === 'Blocked' ? '#ff8fa3' : t.status === 'Needs fixes' ? '#fbbf24' : '#A1A1AA' }}>
                  {t.status === 'Blocked' ? <span className="flex items-center gap-1"><Ban className="w-3 h-3" />Blocked</span> : t.verified ? `Verified${t.verifiedBy === 'github_ci' ? ' by CI' : t.verifiedBy === 'agent_tests' ? ' by tests' : ''}` : (t.status || 'Ready')}
                </span>
                {t.lastRun && <span className="text-[11px]" style={{ color: t.lastRun.ok ? '#34d399' : '#ff8fa3' }}>Run {t.lastRun.n}: {t.lastRun.passed}/{t.lastRun.total} passed</span>}
                {t.commit?.sha && <a href={t.ci?.url || '#'} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-[#E4E4E7] flex items-center gap-1"><GitCommit className="w-3 h-3" />{t.commit.sha.slice(0, 7)}</a>}
                {ci && <span className="text-[11px] flex items-center gap-1" style={{ color: ci[1] }} title={t.ci?.failing?.length ? `Failing: ${t.ci.failing.join(', ')}` : t.ci?.detail}><CiIcon className="w-3 h-3" />{ci[2]}</span>}
                {t.blockedReason && <span className="basis-full text-[11px] text-[#ff8fa3]">{t.blockedReason}</span>}
              </li>
            )
          })}
          {!tasks.length && <li className="px-3 py-4 text-sm text-[#71717A]" style={{ background: '#0C0C0E', border: '1px solid #2a2a30' }}>Generate the build plan in Step 1 first. The agent builds those tasks.</li>}
        </ul>
      </div>
    </section>
  )
}
