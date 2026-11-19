import React from 'react'
import {
  UserRound, AlertCircle, Sparkles, Layers, Route, MonitorSmartphone, Plug, CreditCard, Lock, BarChart3, Server,
  Database, Package, CheckCircle2, Milestone, Check, X, Cpu, Globe, Boxes, Flag,
} from 'lucide-react'
import { C } from '../phase1/phase1Constants'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.p2v .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.p2v .card{background:${C.row};border:1px solid ${C.line}}
.p2v .well{background:${C.sheet};border:1px solid ${C.line}}
.p2v .eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.faint}}
.p2v .chip{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .55rem;font-size:.6875rem;font-weight:600;border:1px solid ${C.line};background:${C.sheet};color:${C.body}}
`
const txt = (v) => (typeof v === 'string' ? v : v?.name || v?.item || v?.title || v?.description || '')
const arr = (v) => (Array.isArray(v) ? v : [])

function Head({ icon: Icon, eyebrow, title, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}><Icon className="w-4 h-4" /></span>
        <div className="min-w-0">
          <p className="eyebrow m-0">{eyebrow}</p>
          <h4 className="serif m-0 mt-0.5 text-2xl leading-tight" style={{ color: C.text }}>{title}</h4>
        </div>
      </div>
      {right}
    </div>
  )
}

function Empty({ children }) {
  return <p className="well m-0 p-4 text-sm" style={{ color: C.faint }}>{children}</p>
}

/* ─── Product spec ─────────────────────────────────────────────────────────────────── */
function SpecView({ spec = {}, project }) {
  const features = arr(spec.features)
  const p0 = features.filter((f) => /p0|must/i.test(f.priority || ''))
  const flows = arr(spec.userFlows)
  const screens = arr(spec.screens)
  const brief = [
    { Icon: UserRound, label: 'Customer', value: spec.targetCustomer || spec.targetUser || project?.validationPlan?.customer },
    { Icon: AlertCircle, label: 'Problem', value: spec.coreProblem || project?.validationPlan?.problem },
    { Icon: Sparkles, label: 'Value', value: spec.valueProposition || spec.coreValueProp || project?.productTagline },
  ]
  const events = arr(spec.analytics?.trackedEvents)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {brief.map(({ Icon, label, value }) => (
          <div key={label} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="eyebrow flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" style={{ color: C.crimsonText }} />{label}</span>
              <span className="text-[10px] font-semibold" style={{ color: C.faint }}>From Phase 1</span>
            </div>
            <p className="m-0 text-[15px] leading-relaxed" style={{ color: value ? C.text : C.faint }}>{value || 'Not defined yet'}</p>
          </div>
        ))}
      </div>

      <section className="card p-4 sm:p-5 space-y-4">
        <Head icon={Layers} eyebrow="Smallest usable version" title="What the MVP does"
          right={<div className="flex gap-1.5"><span className="chip" style={{ color: C.crimsonText, borderColor: C.crimsonLine }}>{p0.length} must-have</span><span className="chip">{features.length - p0.length} high priority</span></div>} />
        {features.length ? (
          <ol className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {features.map((f, i) => {
              const must = /p0|must/i.test(f.priority || '')
              return (
                <li key={i} className="well p-4 flex gap-3" style={{ borderLeft: `3px solid ${must ? C.crimson : C.warn}` }}>
                  <span className="serif text-2xl leading-none shrink-0" style={{ color: C.faint }}>{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: C.text }}>{f.name || txt(f)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: must ? C.crimsonText : C.warn }}>{must ? 'Must have' : 'High priority'}</span>
                    </div>
                    {f.description && <p className="m-0 text-xs leading-relaxed" style={{ color: C.muted }}>{f.description}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        ) : <Empty>No features yet. Generate the build plan.</Empty>}
      </section>

      <section className="card p-4 sm:p-5 space-y-4">
        <Head icon={Route} eyebrow="User flow" title="From first visit to first result" />
        {flows.length ? (
          <ol className="list-none m-0 p-0 grid gap-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))' }}>
            {flows.map((f, i) => (
              <li key={i} className="relative p-3 pt-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0" style={{ background: C.crimson, color: '#fff', borderRadius: 9999 }}>{i + 1}</span>
                  {i < flows.length - 1 && <span className="flex-1 h-px" style={{ background: C.lineStrong }} />}
                </div>
                <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{String(f.step || '').replace(/^\d+\.\s*/, '') || `Step ${i + 1}`}</p>
                <p className="m-0 mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>{f.action || txt(f)}</p>
              </li>
            ))}
          </ol>
        ) : <Empty>No user flow yet.</Empty>}
      </section>

      <section className="card p-4 sm:p-5 space-y-4">
        <Head icon={MonitorSmartphone} eyebrow="Screens" title={`${screens.length} screens to build`} />
        {screens.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {screens.map((s, i) => (
              <div key={i} className="well overflow-hidden">
                <div className="flex items-center gap-1 px-2.5 py-1.5" style={{ background: C.raised, borderBottom: `1px solid ${C.line}` }}>
                  {[0, 1, 2].map((d) => <span key={d} className="w-1.5 h-1.5" style={{ background: '#3f3f46', borderRadius: 9999 }} />)}
                  <span className="ml-1.5 text-[10px] truncate" style={{ color: C.faint }}>/{String(s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}</span>
                </div>
                <div className="p-3 space-y-1">
                  <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{s.name || txt(s)}</p>
                  <p className="m-0 text-xs leading-relaxed" style={{ color: C.muted }}>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty>No screens yet.</Empty>}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="card p-4 space-y-2">
          <p className="eyebrow m-0 flex items-center gap-1.5"><Plug className="w-3.5 h-3.5" />Integrations</p>
          {arr(spec.integrations).length ? arr(spec.integrations).map((it, i) => (
            <div key={i}><p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{txt(it)}</p>{it?.purpose && <p className="m-0 text-xs" style={{ color: C.muted }}>{it.purpose}</p>}</div>
          )) : <p className="m-0 text-xs" style={{ color: C.faint }}>None in the MVP</p>}
        </div>
        <div className="card p-4 space-y-2">
          <p className="eyebrow m-0 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />Payments</p>
          <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{spec.payments?.provider || 'Stripe'}</p>
          <p className="m-0 text-xs" style={{ color: C.body }}>{spec.payments?.model || project?.pricing || '—'}</p>
          {spec.payments?.flow && <p className="m-0 text-xs" style={{ color: C.muted }}>{spec.payments.flow}</p>}
        </div>
        <div className="card p-4 space-y-2">
          <p className="eyebrow m-0 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />Authentication</p>
          <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{spec.authentication?.method || '—'}</p>
          {spec.authentication?.security && <p className="m-0 text-xs" style={{ color: C.muted }}>{spec.authentication.security}</p>}
        </div>
        <div className="card p-4 space-y-2">
          <p className="eyebrow m-0 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Analytics</p>
          <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{spec.analytics?.engine || '—'}</p>
          {events.length > 0 && <div className="flex flex-wrap gap-1">{events.map((e) => <span key={e} className="chip font-mono">{e}</span>)}</div>}
        </div>
      </div>
    </div>
  )
}

/* ─── Technical plan ───────────────────────────────────────────────────────────────── */
function TechView({ tech = {} }) {
  const stack = tech.techStack || {}
  const stackItems = [['Frontend', Globe, stack.frontend], ['Backend', Server, stack.backend], ['Database', Database, stack.database], ['AI', Cpu, stack.aiInference || stack.ai], ['Hosting', Boxes, stack.hosting]].filter(([, , v]) => v)
  const tables = arr(tech.database).length ? arr(tech.database) : arr(tech.databaseSchema)
  const deps = arr(tech.dependencies)
  const criteria = arr(tech.acceptanceCriteria)
  const milestones = arr(tech.milestones)
  return (
    <div className="space-y-5">
      <section className="card p-4 sm:p-5 space-y-4">
        <Head icon={Server} eyebrow="Architecture" title="How it fits together" />
        {tech.architecture ? <p className="m-0 text-[15px] leading-relaxed max-w-4xl" style={{ color: C.body }}>{typeof tech.architecture === 'string' ? tech.architecture : JSON.stringify(tech.architecture)}</p> : <Empty>No architecture yet.</Empty>}
        {stack.rationale && <p className="m-0 text-xs" style={{ color: C.muted }}>Why this stack: {stack.rationale}</p>}
        {stackItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            {stackItems.map(([label, Icon, value]) => (
              <div key={label} className="well p-3 space-y-1">
                <p className="eyebrow m-0 flex items-center gap-1.5"><Icon className="w-3 h-3" />{label}</p>
                <p className="m-0 text-sm" style={{ color: C.text }}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-4 sm:p-5 space-y-4">
        <Head icon={Database} eyebrow="Database" title={`${tables.length} ${tables.length === 1 ? 'table' : 'tables'}`} />
        {tables.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {tables.map((t, i) => {
              const cols = String(t.columns || t.fields || '').split(/,\s*/).filter(Boolean)
              return (
                <div key={i} className="well">
                  <p className="m-0 px-3 py-2 text-sm font-mono font-semibold" style={{ color: C.text, borderBottom: `1px solid ${C.line}` }}>{t.table || t.name || txt(t)}</p>
                  <ul className="list-none m-0 p-2 space-y-0.5">
                    {cols.map((c) => <li key={c} className="px-1.5 py-0.5 text-xs font-mono" style={{ color: C.muted }}>{c}</li>)}
                  </ul>
                </div>
              )
            })}
          </div>
        ) : <Empty>No tables yet.</Empty>}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card p-4 sm:p-5 space-y-3">
          <Head icon={CheckCircle2} eyebrow="Definition of done" title="Acceptance criteria" />
          {criteria.length ? (
            <ul className="list-none m-0 p-0 space-y-1.5">
              {criteria.map((c, i) => <li key={i} className="well px-3 py-2.5 flex items-start gap-2.5 text-sm" style={{ color: C.body }}><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.ok }} />{txt(c)}</li>)}
            </ul>
          ) : <Empty>No acceptance criteria yet.</Empty>}
        </section>
        <section className="card p-4 sm:p-5 space-y-3">
          <Head icon={Package} eyebrow="Dependencies" title="What the build relies on" />
          {deps.length ? <div className="flex flex-wrap gap-1.5">{deps.map((d, i) => <span key={i} className="chip font-mono" style={{ fontSize: '.75rem' }}>{txt(d)}</span>)}</div> : <Empty>No external dependencies listed.</Empty>}
        </section>
      </div>

      <section className="card p-4 sm:p-5 space-y-4">
        <Head icon={Milestone} eyebrow="Milestones" title="Build sequence" />
        {milestones.length ? (
          <ol className="list-none m-0 p-0 grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
            {milestones.map((m, i) => (
              <li key={i} className="well p-3.5 space-y-1" style={{ borderTop: `3px solid ${i === 0 ? C.crimson : C.lineStrong}` }}>
                <p className="eyebrow m-0 flex items-center gap-1.5"><Flag className="w-3 h-3" />Milestone {i + 1}</p>
                <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{m.name || txt(m)}</p>
                {m.duration && <p className="m-0 text-xs" style={{ color: C.muted }}>{m.duration}</p>}
              </li>
            ))}
          </ol>
        ) : <Empty>No milestones yet.</Empty>}
      </section>
    </div>
  )
}

/* ─── Scope boundaries ─────────────────────────────────────────────────────────────── */
function ScopeView({ scope = {} }) {
  const inc = arr(scope.includedInMVP).length ? arr(scope.includedInMVP) : arr(scope.inScopeMvp)
  const exc = arr(scope.excludedFromMVP).length ? arr(scope.excludedFromMVP) : arr(scope.outOfScope)
  const split = (v) => {
    const s = txt(v)
    const reason = v?.reason || (s.includes(' — ') ? s.split(' — ').slice(1).join(' — ') : s.includes(': ') && s.indexOf(': ') < 60 ? s.slice(s.indexOf(': ') + 2) : '')
    const head = v?.reason ? s : s.includes(' — ') ? s.split(' — ')[0] : reason ? s.slice(0, s.indexOf(': ')) : s
    return [head, reason]
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="card p-4 sm:p-5 space-y-3" style={{ borderTop: `3px solid ${C.ok}` }}>
        <p className="eyebrow m-0 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: C.ok }} />In the MVP · {inc.length}</p>
        <h4 className="serif m-0 text-2xl" style={{ color: C.text }}>We build this now</h4>
        {inc.length ? (
          <ul className="list-none m-0 p-0 space-y-1.5">
            {inc.map((v, i) => { const [h, r] = split(v); return (
              <li key={i} className="well px-3 py-2.5 flex items-start gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.ok }} /><span className="text-sm" style={{ color: C.text }}>{h}{r && <span className="block text-xs mt-0.5" style={{ color: C.muted }}>{r}</span>}</span></li>
            ) })}
          </ul>
        ) : <Empty>Nothing listed yet.</Empty>}
      </section>
      <section className="card p-4 sm:p-5 space-y-3" style={{ borderTop: `3px solid ${C.lineStrong}` }}>
        <p className="eyebrow m-0 flex items-center gap-1.5"><X className="w-3.5 h-3.5" />Not in the MVP · {exc.length}</p>
        <h4 className="serif m-0 text-2xl" style={{ color: C.text }}>Later, if customers ask</h4>
        {exc.length ? (
          <ul className="list-none m-0 p-0 space-y-1.5">
            {exc.map((v, i) => { const [h, r] = split(v); return (
              <li key={i} className="well px-3 py-2.5 flex items-start gap-2.5"><X className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.faint }} /><span className="text-sm" style={{ color: C.body }}>{h}{r && <span className="block text-xs mt-0.5" style={{ color: C.faint }}>{r}</span>}</span></li>
            ) })}
          </ul>
        ) : <Empty>Nothing excluded yet. A tight MVP says what it won't do.</Empty>}
      </section>
    </div>
  )
}

export default function Phase2PlanView({ section, buildPlan, project }) {
  return (
    <div className="p2v">
      <style>{CSS}</style>
      {section === 'spec' && <SpecView spec={buildPlan?.productSpec || {}} project={project} />}
      {section === 'technical' && <TechView tech={buildPlan?.technicalPlan || {}} />}
      {section === 'scope' && <ScopeView scope={buildPlan?.scopeBoundaries || {}} />}
    </div>
  )
}
