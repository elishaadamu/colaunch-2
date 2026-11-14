import React from 'react'
import {
  Rocket, Activity, Sliders, Radar, Trophy, Megaphone,
  MessageSquare, Crown, Camera, Video, Mail, Trash2, ArrowRight,
  Loader2, Plus, Sparkles, TrendingUp, Users, DollarSign, CheckCircle2
} from 'lucide-react'
import { updateCoLaunchProject } from '../../../services/opsApi'
import { XLogo } from '../PostVisualMockup'
import { C, HEADING_FONT, PILL_TONES } from './phase1Constants'

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
  // Stage Progression System
  const currentLevelData = (() => {
    if (reservations.length >= 50 || presalesRevenue >= presaleTarget) {
      return {
        level: 5,
        title: 'Cohort Validated',
        subtitle: 'Phase 1 validation criteria achieved. 50 Founding Members secured for Phase 2 MVP Engineering.',
        badgeStyle: PILL_TONES.ok,
        nextTarget: 'Target Reached (50 Backers)'
      }
    }
    if (reservations.length >= 10 || presalesRevenue >= 500) {
      return {
        level: 4,
        title: 'Scaling Momentum',
        subtitle: `${reservations.length} / 50 Founding passes secured. Strong conversion velocity across channels.`,
        badgeStyle: PILL_TONES.violet,
        nextTarget: '50 Backers Target'
      }
    }
    if (reservations.length >= 1 || presalesRevenue >= 50) {
      return {
        level: 3,
        title: 'Early Traction',
        subtitle: `First paid pre-orders verified! ${50 - reservations.length} Founding passes remaining.`,
        badgeStyle: PILL_TONES.ok,
        nextTarget: '10 Backers Milestone'
      }
    }
    if (totalTraffic >= 10 || totalSignups >= 1) {
      return {
        level: 2,
        title: 'Audience Signal',
        subtitle: `${totalTraffic} unique visitors tracking funnel resonance. Awaiting first customer pre-order.`,
        badgeStyle: PILL_TONES.sky,
        nextTarget: 'First Customer Pre-Order'
      }
    }
    return {
      level: 1,
      title: 'Funnel Initialized',
      subtitle: 'Validation engine active. Direct creator audience to pre-order checkout to validate demand.',
      badgeStyle: PILL_TONES.neutral,
      nextTarget: 'First 10 Visitors'
    }
  })()

  // Validation Milestones
  const validationTrophies = [
    {
      id: 'launch_kit',
      title: 'Mission Uplink',
      desc: 'Launch roadmap & assets ready',
      icon: Megaphone,
      unlocked: Boolean(campaignKit?.announcementPost || (campaignKit?.postingSchedule || []).length > 0),
      reward: 'Steps 1–3 Ready'
    },
    {
      id: 'traffic_pulse',
      title: 'Audience Radar',
      desc: 'Traffic arriving from creator channels',
      icon: Radar,
      unlocked: totalTraffic > 0,
      reward: 'Audience Active',
      current: `${totalTraffic} / 10 visitors`
    },
    {
      id: 'survey_voice',
      title: 'Voice of Community',
      desc: 'Discovery feedback recorded',
      icon: MessageSquare,
      unlocked: (surveyResponses?.length || 0) > 0,
      reward: 'Demand Validated',
      current: `${surveyResponses?.length || 0} responses`
    },
    {
      id: 'genesis_backer',
      title: 'Genesis Backer',
      desc: 'First pre-order payment collected',
      icon: Crown,
      unlocked: reservations.length > 0,
      reward: 'First Sale',
      current: `${reservations.length} / 1 backer`
    },
    {
      id: 'sovereign_gate',
      title: 'Sovereign Validation',
      desc: '50 Founding Members secured',
      icon: Trophy,
      unlocked: reservations.length >= 50 || presalesRevenue >= presaleTarget,
      reward: 'Phase 2 Unlock',
      current: `${reservations.length} / 50 backers`
    }
  ]

  // Attribution Channels
  const rawChannels = [
    {
      id: 'instagram',
      name: 'Instagram Stories',
      icon: Camera,
      badge: 'Story Polls',
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
      badge: '60s Video Mid-Roll',
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
      name: 'X (Social Post)',
      isXLogo: true,
      badge: 'Announcement Post',
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
      name: 'Email Newsletter',
      icon: Mail,
      badge: '1:1 Founder Letter',
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
      className="p-5 sm:p-6 rounded-2xl space-y-5"
      style={{ background: C.sheet, border: `1px solid ${C.line}` }}
    >
      {/* Funnel Progress Banner */}
      <div
        className="p-4 sm:p-5 rounded-2xl border space-y-3"
        style={{ background: C.row, borderColor: C.line }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-xl border flex items-center justify-center text-white shadow-sm"
                style={{ background: C.crimson, borderColor: C.crimsonLine }}
              >
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div
                className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold shadow-sm border"
                style={{ background: C.ok, color: '#08090c', borderColor: C.row }}
              >
                LVL {currentLevelData.level}
              </div>
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border"
                  style={currentLevelData.badgeStyle}
                >
                  Stage {currentLevelData.level}: {currentLevelData.title}
                </span>
                <h3 className="text-sm font-bold tracking-tight truncate" style={{ ...HEADING_FONT, color: C.text }}>
                  4. Run + Optimize Validation Engine
                </h3>
              </div>

              <div className="flex items-center gap-2 text-[11px] min-w-0" style={{ color: C.muted }}>
                <span className="truncate max-w-xs sm:max-w-md">{currentLevelData.subtitle}</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                  <span>Cohort: <strong style={{ color: C.text }}>{reservations.length}/50</strong></span>
                  <div
                    className="w-20 h-1.5 rounded-full overflow-hidden border inline-block align-middle"
                    style={{ background: C.sheet, borderColor: C.line }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        background: C.ok,
                        width: `${Math.min(100, Math.max(8, (reservations.length / 50) * 100))}%`
                      }}
                    />
                  </div>
                  <span style={{ color: C.ok }}>{currentLevelData.nextTarget}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRunExperimentsAI}
              disabled={isAnalyzingExperiments}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              style={{ background: C.crimson }}
            >
              {isAnalyzingExperiments ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Analyzing Telemetry...</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5 text-white" />
                  <span>Run AI Optimization</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: C.text }}>
            <Activity className="w-3.5 h-3.5" style={{ color: C.ok }} />
            <span>Validation Engine Telemetry</span>
          </span>
          <span className="text-[10px] font-mono font-medium" style={{ color: C.muted }}>
            Target: 50 Presales (${presaleTarget.toLocaleString()} Milestone)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="p-3 rounded-xl border space-y-1" style={{ background: C.row, borderColor: C.line }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.muted }}>Traffic</span>
            <div className="text-xl font-extrabold font-mono" style={{ color: C.text }}>{totalTraffic.toLocaleString()}</div>
            <div className="text-[9px]" style={{ color: C.faint }}>Unique Visitors</div>
          </div>

          <div className="p-3 rounded-xl border space-y-1" style={{ background: C.row, borderColor: C.line }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.skyText }}>CTR</span>
            <div className="text-xl font-extrabold font-mono" style={{ color: C.skyText }}>
              {totalTraffic > 0 ? ((totalSignups / totalTraffic) * 100).toFixed(1) : '3.8'}%
            </div>
            <div className="text-[9px]" style={{ color: C.faint }}>Click-Through Rate</div>
          </div>

          <div className="p-3 rounded-xl border space-y-1" style={{ background: C.row, borderColor: C.line }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.crimsonText }}>Pre-Orders</span>
            <div className="text-xl font-extrabold font-mono" style={{ color: C.crimsonText }}>
              {reservations.length} / 50
            </div>
            <div className="text-[9px]" style={{ color: C.faint }}>Founding Members</div>
          </div>

          <div className="p-3 rounded-xl border space-y-1" style={{ background: C.row, borderColor: C.line }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.ok }}>Presales Revenue</span>
            <div className="text-xl font-extrabold font-mono" style={{ color: C.ok }}>
              ${presalesRevenue.toLocaleString()}
            </div>
            <div className="text-[9px]" style={{ color: C.faint }}>Collected & Verified</div>
          </div>

          <div className="p-3 rounded-xl border space-y-1" style={{ background: C.row, borderColor: C.line }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.violetText }}>Discovery</span>
            <div className="text-xl font-extrabold font-mono" style={{ color: C.violetText }}>
              {surveyResponses.length}
            </div>
            <div className="text-[9px]" style={{ color: C.faint }}>Survey Submissions</div>
          </div>

          <div className="p-3 rounded-xl border space-y-1" style={{ background: C.row, borderColor: C.line }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: C.warn }}>Conversion Rate</span>
            <div className="text-xl font-extrabold font-mono" style={{ color: C.warn }}>
              {conversionRate || '2.89'}%
            </div>
            <div className="text-[9px]" style={{ color: C.faint }}>Visitor to Backer</div>
          </div>
        </div>
      </div>

      {/* Channel Attribution & Live Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
        {/* Left: Channel Attribution Breakdown */}
        <div className="lg:col-span-5 p-4 rounded-xl border space-y-3" style={{ background: C.row, borderColor: C.line }}>
          <span className="text-[11px] font-bold uppercase tracking-wider block font-mono" style={{ color: C.text }}>
            Traffic & Attribution Breakdown
          </span>
          <div className="space-y-2">
            {rawChannels.map((ch) => {
              const Icon = ch.icon
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
                      <div className="font-bold text-xs" style={{ color: C.text }}>{ch.name}</div>
                      <div className="text-[10px]" style={{ color: C.muted }}>{ch.badge}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold" style={{ color: C.text }}>{ch.traffic} visits</div>
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
              <span className="text-[11px] font-bold uppercase tracking-wider block font-mono" style={{ color: C.text }}>
                Live Backers & Pre-Order Stream
              </span>
              <p className="text-[10px]" style={{ color: C.muted }}>Verified customer deposits & founding member pass purchases.</p>
            </div>
            {handleAddSimulatedReservation && (
              <button
                type="button"
                onClick={handleAddSimulatedReservation}
                className="px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
              >
                <Plus className="w-3 h-3" />
                <span>Simulate Backer</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {reservations.length === 0 ? (
              <div className="text-center py-8 text-xs border border-dashed rounded-xl" style={{ borderColor: C.line, color: C.muted }}>
                No pre-orders recorded yet. Backer passes will appear here in real-time.
              </div>
            ) : (
              reservations.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="p-3 rounded-lg border flex items-center justify-between gap-3"
                  style={{ background: C.sheet, borderColor: C.line }}
                >
                  <div>
                    <div className="font-bold text-xs" style={{ color: C.text }}>{r.customerName || r.name || 'Founding Backer'}</div>
                    <div className="text-[10px] font-mono" style={{ color: C.muted }}>{r.email} • {r.passType || 'Co-Builder Pass'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs" style={{ color: C.ok }}>+${r.amount || 49}</div>
                    <div className="text-[9px]" style={{ color: C.faint }}>{r.date || 'Just now'}</div>
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
              <span className="text-[11px] font-bold uppercase tracking-wider block font-mono" style={{ color: C.violetText }}>
                Active A/B Experiments & AI Optimization
              </span>
              <p className="text-[10px]" style={{ color: C.muted }}>Iterative message, pricing, and headline variants generated to boost cohort conversion rate.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={PILL_TONES.violet}>
              {experimentsList.length} Active Tests
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
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border" style={PILL_TONES.ok}>
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
                  <div className="p-2 rounded border" style={{ background: 'rgba(111,207,155,0.06)', borderColor: C.okLine }}>
                    <span className="font-bold block" style={{ color: C.ok }}>Variant B (Winner):</span>
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
                    Apply Winning Variant B to Campaign
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
          <span>Proceed to Step 5: Gate Checkpoint</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  )
}

