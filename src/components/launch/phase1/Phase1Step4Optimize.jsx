import React, { useEffect, useState } from 'react'
import {
  Activity, Sliders, Radar, Trophy, Megaphone,
  MessageSquare, Crown, Camera, Video, Mail,
  Loader2, Plus, Check, Lock, Target
} from 'lucide-react'
import { updateCoLaunchProject } from '../../../services/opsApi'
import { XLogo } from '../PostVisualMockup'
import { C, HEADING_FONT, PILL_TONES, P1_SHARED_CSS } from './phase1Constants'
import StepRail from './StepRail'

export default function Phase1Step4Optimize({
  project,
  reservations,
  presalesRevenue,
  presaleTarget,
  totalTraffic,
  totalSignups,
  conversionRate,
  surveyResponses,
  handleDeleteSurveyResponse,
  campaignKit,
  updateCampaignKit,
  experimentsData,
  isAnalyzingExperiments,
  handleRunExperimentsAI,
  handleApplyExperimentVariant,
  handleAddSimulatedReservation,
  showNotification,
  setActiveStep,
  onSelectStep,
  onUpdateProject
}) {
  // All progress below is computed from real project data. Nothing is simulated or scored with invented weights.
  const visitors = Number(totalTraffic) || 0
  const signups = Number(totalSignups) || 0
  const backers = reservations.length
  const surveyCount = surveyResponses?.length || 0
  const revenue = Number(presalesRevenue) || 0
  const goalRevenue = Number(presaleTarget) || 0
  const schedule = campaignKit?.postingSchedule || []
  const postsTotal = schedule.length
  const postsDone = schedule.filter((t) => t.done).length
  const kitReady = Boolean(campaignKit?.announcementPost || postsTotal > 0)
  const showSimTools = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('simulate') === '1'

  const level = (() => {
    if (backers >= 50 || (goalRevenue > 0 && revenue >= goalRevenue)) return 5
    if (backers >= 10 || revenue >= 500) return 4
    if (backers >= 1 || revenue >= 50) return 3
    if (visitors >= 10 || signups >= 1) return 2
    return 1
  })()

  const LEVELS = [
    { level: 1, title: 'Funnel ready', subtitle: 'Send your audience to your pre-order page to get started.' },
    { level: 2, title: 'Audience signal', subtitle: `${visitors.toLocaleString()} visitors so far. Now turn them into a first pre-order.` },
    { level: 3, title: 'Early traction', subtitle: `${backers} paid ${backers === 1 ? 'pre-order' : 'pre-orders'} confirmed. ${Math.max(0, 50 - backers)} founding passes left.` },
    { level: 4, title: 'Scaling momentum', subtitle: `${backers} of 50 founding passes taken.` },
    { level: 5, title: 'Cohort validated', subtitle: 'You hit the validation target. You can take this to the gate.' },
  ]
  const levelData = LEVELS[level - 1]

  // What it takes to reach the next level, measured with real counts.
  const next = [
    { label: 'Reach 10 visitors', value: visitors, goal: 10 },
    { label: 'Get your first pre-order', value: backers, goal: 1 },
    { label: 'Reach 10 pre-orders', value: backers, goal: 10 },
    { label: 'Reach 50 pre-orders', value: backers, goal: 50 },
    null,
  ][level - 1]
  const nextProgress = next ? Math.min(1, next.value / next.goal) : 1

  // One clear next move, chosen from what the data says.
  const quest = (() => {
    if (level === 5) return { title: 'Target reached', body: 'Review your numbers, then go to the gate checkpoint to decide what happens next.' }
    if (postsTotal > 0 && postsDone === 0) {
      return { title: 'Publish your first post', body: `You have ${postsTotal} posts planned and none marked as published.`, action: { label: 'Open the campaign', onClick: () => { setActiveStep('campaign'); onSelectStep?.('campaign') } } }
    }
    if (visitors === 0) {
      return { title: 'Get your first visitor', body: 'No one has visited your pre-order page yet. Put your pre-order link in your next post or story.' }
    }
    if (backers === 0) {
      return { title: 'Get your first pre-order', body: `${visitors.toLocaleString()} ${visitors === 1 ? 'person has' : 'people have'} visited and nobody has pre-ordered. Test a new headline or price.`, action: { label: 'Run AI optimization', onClick: handleRunExperimentsAI } }
    }
    return { title: `Get ${Math.max(0, 50 - backers)} more pre-orders`, body: `You are at ${backers} of 50. Post again on the channel that sends the most visitors.` }
  })()

  const milestones = [
    { id: 'kit', title: 'Kit ready', desc: 'Campaign plan and posts written', icon: Megaphone, unlocked: kitReady, status: kitReady ? 'Done' : 'Open Step 3 to create it' },
    { id: 'visitors', title: 'First visitors', desc: 'People arrive from your channels', icon: Radar, unlocked: visitors > 0, status: visitors > 0 ? `${visitors.toLocaleString()} so far` : '0 of 10 visitors', pct: Math.min(1, visitors / 10) },
    { id: 'voices', title: 'Voices heard', desc: 'Survey answers from your audience', icon: MessageSquare, unlocked: surveyCount > 0, status: `${surveyCount} ${surveyCount === 1 ? 'response' : 'responses'}` },
    { id: 'first', title: 'First pre-order', desc: 'A real payment collected', icon: Crown, unlocked: backers > 0, status: backers > 0 ? 'Done' : '0 of 1 pre-orders', pct: Math.min(1, backers / 1) },
    { id: 'cohort', title: 'Cohort validated', desc: '50 founding members secured', icon: Trophy, unlocked: level === 5, status: `${backers} of 50 pre-orders`, pct: Math.min(1, backers / 50), reward: 'Unlocks Phase 2' },
  ]
  const nextMilestoneId = (milestones.find((m) => !m.unlocked) || {}).id

  // One-time level-up moment: shown only when the saved level for this project is lower than the current one.
  const [levelUp, setLevelUp] = useState(null)
  useEffect(() => {
    if (!project?.id) return
    const key = `p1s4_level_${project.id}`
    let saved = null
    try { saved = Number(localStorage.getItem(key)) || null } catch (_) {}
    if (saved && level > saved) {
      setLevelUp(level)
      const t = setTimeout(() => setLevelUp(null), 7000)
      try { localStorage.setItem(key, String(level)) } catch (_) {}
      return () => clearTimeout(t)
    }
    try { localStorage.setItem(key, String(Math.max(level, saved || 0))) } catch (_) {}
  }, [project?.id, level])

  const pct = (n) => `${Math.round(n * 100)}%`

  // Attribution Channels
  const rawChannels = [
    {
      id: 'instagram',
      name: 'Instagram stories',
      icon: Camera,
      badge: 'Story polls',
      traffic: Math.max(
        (project?.uniqueVisitors || []).filter((v) => {
          const ch = (v.channel || '').toLowerCase()
          return ch.includes('instagram') || ch.includes('ig') || ch.includes('story')
        }).length,
        Number(project?.telemetry?.channelAttribution?.['Instagram Stories'] || 0)
      ),
      conversions: reservations.filter((r) => (r.channel || '').toLowerCase().includes('instagram')).length
    },
    {
      id: 'tiktok',
      name: 'TikTok / Shorts',
      icon: Video,
      badge: '60 second video',
      traffic: Math.max(
        (project?.uniqueVisitors || []).filter((v) => {
          const ch = (v.channel || '').toLowerCase()
          return ch.includes('tiktok') || ch.includes('shorts') || ch.includes('youtube')
        }).length,
        Number(project?.telemetry?.channelAttribution?.['TikTok / Shorts'] || 0)
      ),
      conversions: reservations.filter((r) => (r.channel || '').toLowerCase().includes('tiktok') || (r.channel || '').toLowerCase().includes('shorts')).length
    },
    {
      id: 'x',
      name: 'X',
      isXLogo: true,
      badge: 'Announcement post',
      traffic: Math.max(
        (project?.uniqueVisitors || []).filter((v) => {
          const ch = (v.channel || '').toLowerCase()
          return ch.includes('twitter') || ch.includes('x')
        }).length,
        Number(project?.telemetry?.channelAttribution?.['Twitter / X'] || 0)
      ),
      conversions: reservations.filter((r) => (r.channel || '').toLowerCase().includes('twitter') || (r.channel || '').toLowerCase().includes('x')).length
    },
    {
      id: 'newsletter',
      name: 'Email newsletter',
      icon: Mail,
      badge: 'Founder letter',
      traffic: Math.max(
        (project?.uniqueVisitors || []).filter((v) => {
          const ch = (v.channel || '').toLowerCase()
          return ch.includes('newsletter') || ch.includes('email')
        }).length,
        Number(project?.telemetry?.channelAttribution?.['Email Newsletter'] || 0)
      ),
      conversions: reservations.filter((r) => (r.channel || '').toLowerCase().includes('newsletter') || (r.channel || '').toLowerCase().includes('email')).length
    }
  ]

  const experimentsList = experimentsData?.experiments || project?.experiments || []

  return (
    <div
      className="p1-themed p-5 sm:p-6 rounded-2xl space-y-5"
      style={{ background: C.sheet, border: `1px solid ${C.line}` }}
    >
      <style>{P1_SHARED_CSS}</style>
      <StepRail current="optimize" />
      <style>{`
        @keyframes p1s4-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        .p1s4-rise { animation: p1s4-rise .35s ease-out both }
        @media (prefers-reduced-motion: reduce) { .p1s4-rise { animation: none } }
      `}</style>

      {levelUp && (
        <div
          role="status"
          className="p1s4-rise flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
          style={{ background: C.okSoft, borderColor: C.okLine }}
        >
          <span className="text-sm font-semibold" style={{ color: C.text }}>
            Level {levelUp} reached: {LEVELS[levelUp - 1].title}
          </span>
          <button type="button" onClick={() => setLevelUp(null)} className="text-xs cursor-pointer" style={{ color: C.muted }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Level and next move */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: C.row, borderColor: C.line }}>
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 w-16 h-16 rounded-2xl border flex flex-col items-center justify-center"
                style={{ background: C.crimsonSoft, borderColor: C.crimsonLine }}
              >
                <span className="text-[11px] leading-none" style={{ color: C.crimsonText }}>Level</span>
                <span className="text-3xl leading-none mt-1" style={{ ...HEADING_FONT, color: C.text }}>{level}</span>
              </div>
              <div className="min-w-0">
                <h3 className="m-0 text-2xl leading-tight" style={{ ...HEADING_FONT, color: C.text }}>{levelData.title}</h3>
                <p className="m-0 mt-1 text-sm" style={{ color: C.muted }}>{levelData.subtitle}</p>
              </div>
            </div>

            {/* Level track: filled levels are reached, the next segment fills with real progress */}
            <div>
              <div className="flex gap-1.5" role="img" aria-label={`Level ${level} of 5`}>
                {LEVELS.map((l) => {
                  const fill = l.level <= level ? 1 : l.level === level + 1 ? nextProgress : 0
                  return (
                    <div key={l.level} className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: pct(fill), background: l.level <= level ? C.crimson : C.ok }} />
                    </div>
                  )
                })}
              </div>
              <div className="hidden sm:flex gap-1.5 mt-2">
                {LEVELS.map((l) => (
                  <span key={l.level} className="flex-1 text-[11px] truncate" style={{ color: l.level === level ? C.text : C.faint, fontWeight: l.level === level ? 600 : 400 }}>
                    {l.title}
                  </span>
                ))}
              </div>
            </div>

            {next && (
              <p className="m-0 text-sm" style={{ color: C.body }}>
                Next level: {next.label}. <span style={{ color: C.text, fontWeight: 600 }}>{Math.min(next.value, next.goal)} of {next.goal}</span>
              </p>
            )}
          </div>

          <div className="lg:col-span-5 rounded-xl border p-4 flex flex-col justify-between gap-3" style={{ background: C.sheet, borderColor: C.line }}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm" style={{ color: C.crimsonText }}>
                <Target className="w-4 h-4" />
                <span className="font-semibold">Your next move</span>
              </div>
              <p className="m-0 text-lg" style={{ ...HEADING_FONT, color: C.text }}>{quest.title}</p>
              <p className="m-0 text-sm" style={{ color: C.muted }}>{quest.body}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {quest.action && (
                <button
                  type="button"
                  onClick={quest.action.onClick}
                  disabled={isAnalyzingExperiments}
                  className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer disabled:opacity-50 active:scale-95"
                  style={{ background: C.crimson }}
                >
                  {quest.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={handleRunExperimentsAI}
                disabled={isAnalyzingExperiments}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 border"
                style={quest.action?.label === 'Run AI optimization' ? { display: 'none' } : { background: C.raised, borderColor: C.lineStrong, color: C.text }}
              >
                {isAnalyzingExperiments ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                <span>{isAnalyzingExperiments ? 'Analyzing' : 'Run AI optimization'}</span>
              </button>
              {postsTotal > 0 && (
                <span className="text-xs ml-auto" style={{ color: C.muted }}>Posts published: {postsDone} of {postsTotal}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold" style={{ color: C.text }}>Milestones</span>
          <span className="text-xs" style={{ color: C.muted }}>{milestones.filter((m) => m.unlocked).length} of {milestones.length} reached</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {milestones.map((m) => {
            const Icon = m.icon
            const isNext = m.id === nextMilestoneId
            return (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border space-y-2"
                style={{
                  background: m.unlocked ? C.okSoft : C.row,
                  borderColor: m.unlocked ? C.okLine : isNext ? C.crimsonLine : C.line,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: m.unlocked ? C.ok : C.sheet, color: m.unlocked ? '#050506' : C.faint, border: m.unlocked ? 'none' : `1px solid ${C.line}` }}
                  >
                    {m.unlocked ? <Check className="w-4 h-4" /> : isNext ? <Icon className="w-4 h-4" style={{ color: C.crimsonText }} /> : <Lock className="w-3.5 h-3.5" />}
                  </span>
                  {isNext && <span className="text-[11px] px-2 py-0.5 rounded-full border" style={PILL_TONES.crimson}>Next</span>}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: C.text }}>{m.title}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{m.desc}</div>
                </div>
                {!m.unlocked && m.pct !== undefined && (
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.sheet }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: pct(m.pct), background: C.crimson }} />
                  </div>
                )}
                <div className="text-xs" style={{ color: m.unlocked ? C.ok : C.body }}>
                  {m.unlocked && m.reward ? m.reward : m.status}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Numbers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: C.text }}>
            <Activity className="w-3.5 h-3.5" style={{ color: C.ok }} />
            <span>Your numbers</span>
          </span>
          <span className="text-xs" style={{ color: C.muted }}>
            Goal: 50 pre-orders{goalRevenue > 0 ? `, $${goalRevenue.toLocaleString()}` : ''}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { label: 'Visitors', value: visitors.toLocaleString(), note: 'Unique visits' },
            { label: 'Signup rate', value: visitors > 0 ? `${((signups / visitors) * 100).toFixed(1)}%` : '—', note: 'Signups per visitor' },
            { label: 'Pre-orders', value: `${backers} of 50`, note: 'Founding members' },
            { label: 'Revenue', value: `$${revenue.toLocaleString()}`, note: 'Collected and verified', tone: C.ok },
            { label: 'Survey answers', value: String(surveyCount), note: 'From your audience' },
            { label: 'Conversion', value: visitors > 0 && Number.isFinite(Number(conversionRate)) ? `${Number(conversionRate).toFixed(1)}%` : '—', note: 'Visitors who pre-ordered' },
          ].map((c) => (
            <div key={c.label} className="p-3 rounded-xl border space-y-1" style={{ background: C.row, borderColor: C.line }}>
              <span className="text-xs block" style={{ color: C.muted }}>{c.label}</span>
              <div className="text-xl font-bold" style={{ color: c.tone || C.text }}>{c.value}</div>
              <div className="text-[11px]" style={{ color: C.faint }}>{c.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Attribution & Live Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
        {/* Left: Channel Attribution Breakdown */}
        <div className="lg:col-span-5 p-4 rounded-xl border space-y-3" style={{ background: C.row, borderColor: C.line }}>
          <span className="text-sm font-semibold block" style={{ color: C.text }}>
            Where your visitors come from
          </span>
          <div className="space-y-2">
            {rawChannels.map((ch) => {
              const Icon = ch.icon
              const isTop = ch.traffic > 0 && ch.traffic === Math.max(...rawChannels.map((c) => c.traffic))
              return (
                <div
                  key={ch.id}
                  className="p-3 rounded-lg border flex items-center justify-between gap-3"
                  style={{ background: C.sheet, borderColor: C.line }}
                >
                  <div className="flex items-center gap-2.5">
                    {ch.isXLogo ? (
                      <XLogo className="w-4 h-4" style={{ color: C.crimsonText }} />
                    ) : (
                      <Icon className="w-4 h-4" style={{ color: C.skyText }} />
                    )}
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5" style={{ color: C.text }}>
                        <span>{ch.name}</span>
                        {isTop && <span className="text-[10px] px-1.5 rounded-full border font-medium" style={PILL_TONES.ok}>Top channel</span>}
                      </div>
                      <div className="text-[10px]" style={{ color: C.muted }}>{ch.badge}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: C.text }}>{ch.traffic} visits</div>
                    <div className="text-[10px]" style={{ color: C.ok }}>{ch.conversions} backers</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Live Backers Stream */}
        <div className="lg:col-span-7 p-4 rounded-xl border space-y-3" style={{ background: C.row, borderColor: C.line }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold block" style={{ color: C.text }}>
                Pre-orders
              </span>
              <p className="text-xs" style={{ color: C.muted }}>Each paid pre-order appears here as it arrives.</p>
            </div>
            {showSimTools && handleAddSimulatedReservation && (
              <button
                type="button"
                onClick={handleAddSimulatedReservation}
                className="px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
              >
                <Plus className="w-3 h-3" />
                <span>Add test pre-order</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {reservations.length === 0 ? (
              <div className="text-center py-8 text-xs border border-dashed rounded-xl" style={{ borderColor: C.line, color: C.muted }}>
                No pre-orders yet. Your first one will unlock the next level.
              </div>
            ) : (
              reservations.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="p-3 rounded-lg border flex items-center justify-between gap-3"
                  style={{ background: C.sheet, borderColor: C.line }}
                >
                  <div>
                    <div className="font-bold text-xs" style={{ color: C.text }}>{r.customerName || r.name || 'Pre-order'}</div>
                    <div className="text-[11px]" style={{ color: C.muted }}>{[r.email, r.passType].filter(Boolean).join(', ')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs" style={{ color: C.ok }}>{Number(r.amount) > 0 ? `$${Number(r.amount).toLocaleString()}` : ""}</div>
                    <div className="text-[9px]" style={{ color: C.faint }}>{r.date || ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* A/B Optimization Experiments Engine */}
      {experimentsList.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl border space-y-3.5" style={{ background: C.row, borderColor: C.line }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold block" style={{ color: C.text }}>
                Tests to improve conversion
              </span>
              <p className="text-xs" style={{ color: C.muted }}>Headline, message and price ideas written by AI from your numbers.</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded border" style={PILL_TONES.violet}>
              {experimentsList.length} {experimentsList.length === 1 ? 'test' : 'tests'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {experimentsList.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="p-3.5 rounded-xl border space-y-2"
                style={{ background: C.sheet, borderColor: C.line }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: C.text }}>{exp.name}</span>
                  <span className="text-[10px] px-1.5 rounded border" style={PILL_TONES.ok}>
                    {exp.trafficSplit || '50/50'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: C.body }}>
                  {exp.hypothesis}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  <div className="p-2 rounded border" style={{ background: C.row, borderColor: C.line }}>
                    <span className="font-bold block" style={{ color: C.muted }}>Variant A:</span>
                    <span style={{ color: C.body }}>{exp.variantA}</span>
                  </div>
                  <div className="p-2 rounded border" style={{ background: 'rgba(52, 211, 153,0.06)', borderColor: C.okLine }}>
                    <span className="font-bold block" style={{ color: C.ok }}>Variant B (suggested):</span>
                    <span style={{ color: C.text }}>{exp.variantB}</span>
                  </div>
                </div>
                {handleApplyExperimentVariant && (
                  <button
                    type="button"
                    onClick={() => handleApplyExperimentVariant(exp)}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg text-white font-bold text-[10px] transition-all cursor-pointer shadow-sm active:scale-95"
                    style={{ background: C.crimson }}
                  >
                    Use variant B in the campaign
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            const updated = {
              ...(project || {}),
              step4Done: true,
              phase1Step4Done: true,
              validationOptimized: true,
              telemetryReviewed: true
            }
            if (onUpdateProject) onUpdateProject((prev) => ({ ...(prev || {}), ...updated }))
            if (project?.id) {
              updateCoLaunchProject(project.id, {
                step4Done: true,
                phase1Step4Done: true,
                validationOptimized: true,
                telemetryReviewed: true
              }).catch((e) => console.warn(e))
            }
            showNotification('Validation metrics reviewed. Ready for Gate Checkpoint.')
            setActiveStep('gate')
            onSelectStep?.('gate')
          }}
          className="px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 hover:opacity-90"
          style={{ background: C.crimson }}
        >
          <span>Go to the gate checkpoint</span>
        </button>
      </div>
    </div>
  )
}
