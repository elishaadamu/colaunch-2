import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar, MessageSquare, Smartphone, Video, Send, Users, Globe,
  Youtube, ShieldCheck, Save, Sparkles, Loader2, Mail, Copy, ExternalLink,
  Eye, Download, Play, Check, CheckCircle2, ArrowRight, AlertCircle,
  Bell, X, Sliders, Shield
} from 'lucide-react'
import { updateCoLaunchProject } from '../../../services/opsApi'
import { Phase1CampaignGenSkeleton } from '../Section2Skeletons'
import PostVisualMockup, { XLogo } from '../PostVisualMockup'
import { C, HEADING_FONT, PILL_TONES } from './phase1Constants'

export default function Phase1Step3Campaign({
  project,
  campaignKit,
  updateCampaignKit,
  isGeneratingCampaign,
  generateCampaign,
  hasCampaignGenerated,
  saveAll,
  campaignSubTab,
  setCampaignSubTab,
  isAutonomousEnabled,
  handleToggleAutonomous,
  viewDraftTask,
  setViewDraftTask,
  draftModalView,
  setDraftModalView,
  campaignPacing,
  setCampaignPacing,
  postingFrequency,
  setPostingFrequency,
  campaignStrategyPrompt,
  setCampaignStrategyPrompt,
  creatorChannelUrl,
  audienceGroundingData,
  setShowAudienceIntelModal,
  setAudienceIntelModalTab,
  productSlug,
  origin,
  showNotification,
  setActiveStep,
  onSelectStep,
  onUpdateProject,
  handleToggleScheduleTask,
  handleSendTaskReminder,
  handleWhatsAppNudge,
  handleGeneratePostImage,
  isGeneratingImage,
  imageGenError,
  setImageGenError,
  handleGenerateCampaignVideo,
  isGeneratingVideo,
  videoGenError,
  setVideoGenError,
  handleSendPostKitEmail,
  isSendingTodayEmail,
  remindingTaskId,
  copyToClipboard,
  copiedKey,
  getTaskDraftContent
}) {
  const handleDownloadAsset = (url, filename) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'campaign_asset'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showNotification('Download started!')
  }

  const tasksList = campaignKit?.postingSchedule || []
  const todayTask = tasksList.find((t) => !t.done) || tasksList[0] || null

  return (
    <div
      className="p-5 sm:p-6 rounded-2xl space-y-5"
      style={{ background: C.sheet, border: `1px solid ${C.line}` }}
    >
      {/* Top Header */}
      <div
        className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-base font-bold flex items-center gap-2"
              style={{ ...HEADING_FONT, color: C.text }}
            >
              <span>3. Creator Campaign Execution</span>
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
              style={PILL_TONES.violet}
            >
              Stage 3 • Omnichannel Content
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>
            Posts, Instagram stories, newsletter copy, videos, polls, CTAs, images & 60s scripts for the creator.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={generateCampaign}
            disabled={isGeneratingCampaign}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm cursor-pointer"
            style={{ background: C.crimson }}
          >
            {isGeneratingCampaign ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Drafting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>{hasCampaignGenerated ? 'Regenerate Content' : 'Generate AI Content'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={saveAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            style={{ background: C.okSoft, borderColor: C.okLine, color: C.ok }}
          >
            <Save className="w-3.5 h-3.5" style={{ color: C.ok }} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Creator Channel & Audience Data Investigation Bar */}
      <div
        className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: C.row, borderColor: C.line }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.35)' }}
          >
            <Youtube className="w-5 h-5 text-red-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black truncate" style={{ color: C.text }}>
                {project?.creatorName || 'Creator Partner'}
              </span>
              {project?.creatorHandle && (
                <span className="text-[11px] font-mono font-medium" style={{ color: C.muted }}>
                  {project.creatorHandle.startsWith('@') ? project.creatorHandle : `@${project.creatorHandle}`}
                </span>
              )}
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1"
                style={PILL_TONES.ok}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.ok }} />
                <span>Audience Data Grounded</span>
              </span>
            </div>
            <p className="text-[11px] truncate mt-0.5" style={{ color: C.faint }}>
              Sourced from recent channel uploads & community discussions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={creatorChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer group"
            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
            title="Open Creator Channel"
          >
            <Youtube className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Creator Channel</span>
            <ExternalLink className="w-3 h-3 text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <button
            type="button"
            onClick={() => {
              setAudienceIntelModalTab?.('transcripts')
              setShowAudienceIntelModal?.(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
            style={{ background: C.raised, borderColor: C.lineStrong, color: C.body }}
            title="View Audience Citations and transcripts"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: C.ok }} />
            <span>Audience Citations</span>
          </button>
        </div>
      </div>

      {/* Campaign Cadence & Pacing */}
      <div
        className="p-4 sm:p-5 rounded-2xl border space-y-3.5"
        style={{ background: C.row, borderColor: C.line }}
      >
        <div className="flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: C.line }}>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4" style={{ color: C.crimsonText }} />
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text }}>
              Campaign Cadence & Creator Effort
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Cadence Mode Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold block" style={{ color: C.body }}>
              Cadence Intensity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low_burden', label: 'Low-Burden', desc: '4 posts' },
                { id: 'balanced', label: 'Balanced', desc: '5 posts' },
                { id: 'intensive', label: 'Sprint', desc: '7 posts' }
              ].map((p) => {
                const isSelected = campaignPacing === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCampaignPacing(p.id)}
                    className="py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer"
                    style={
                      isSelected
                        ? { background: C.crimson, borderColor: C.crimsonLine, color: '#fff' }
                        : { background: C.sheet, borderColor: C.line, color: C.body }
                    }
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-[10px]" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : C.muted }}>
                      {p.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Normal Posting Rhythm Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold block" style={{ color: C.body }}>
              Creator Posting Frequency
            </label>
            <select
              value={postingFrequency}
              onChange={(e) => setPostingFrequency(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all cursor-pointer"
              style={{ background: C.sheet, borderColor: C.lineStrong, color: C.text }}
            >
              <option value="1 video per week (Standard YouTube)">1 video / week (Standard YouTube)</option>
              <option value="2-3 posts per week (Multi-channel)">2–3 posts / week (Multi-channel)</option>
              <option value="Bi-weekly or monthly (Long-form deep dives)">Bi-weekly or monthly</option>
              <option value="High-frequency short-form (Daily TikTok/Reels)">Daily short-form (Reels/TikTok)</option>
            </select>
          </div>
        </div>

        {/* Optional Custom Instructions */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.body }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: C.violet }} />
              <span>Custom Instructions (Optional)</span>
            </label>
            {campaignStrategyPrompt && (
              <button
                type="button"
                onClick={() => setCampaignStrategyPrompt('')}
                className="text-[10px] hover:underline cursor-pointer"
                style={{ color: C.muted }}
              >
                Clear
              </button>
            )}
          </div>

          <input
            type="text"
            value={campaignStrategyPrompt}
            onChange={(e) => setCampaignStrategyPrompt(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-xs outline-none transition-colors"
            style={{ background: C.sheet, borderColor: C.line, color: C.text }}
            placeholder="e.g. Focus on YouTube mid-roll, avoid Twitter spam, keep effort under 30 mins..."
          />

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: '⚡ Low-Burden (4 posts)', prompt: 'Design a low-burden roadmap of 4 spaced milestones. Avoid daily spam.', pacing: 'low_burden' },
              { label: '🎯 Balanced (5 posts)', prompt: 'Create 5 spaced touchpoints including a behind-the-scenes engineering story and mid-roll demo.', pacing: 'balanced' },
              { label: '🚀 Sprint Pace (7 posts)', prompt: 'Execute a fast 7-milestone validation sprint across multiple channels to lock 50 Founding Members.', pacing: 'intensive' },
              { label: '🎬 Video Mid-Roll Only', prompt: 'Focus promotional effort on an organic 60s mid-roll in their next YouTube video plus 1:1 email.' },
              { label: '💌 Email + Stories Only', prompt: 'Hit the goal using only 1:1 founder email and Instagram story polls. Zero video filming required.' }
            ].map((chip) => {
              const isMatch = campaignStrategyPrompt === chip.prompt
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setCampaignStrategyPrompt(chip.prompt)
                    if (chip.pacing) setCampaignPacing(chip.pacing)
                  }}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer"
                  style={
                    isMatch
                      ? { background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText }
                      : { background: C.sheet, borderColor: C.line, color: C.muted }
                  }
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: C.line }}>
          <span className="text-xs font-medium" style={{ color: C.muted }}>
            {campaignPacing === 'low_burden'
              ? '4 spaced milestones · ~40 mins creator effort'
              : campaignPacing === 'balanced'
              ? '5 spaced milestones · ~55 mins creator effort'
              : '7 milestones · Sprint pace'}
          </span>

          <button
            type="button"
            onClick={generateCampaign}
            disabled={isGeneratingCampaign}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            style={{ background: C.crimson }}
          >
            {isGeneratingCampaign ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Generating Campaign...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>{hasCampaignGenerated ? 'Update Campaign' : 'Generate Campaign'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generating State, Empty State, or Sub-tabs Content */}
      {isGeneratingCampaign ? (
        <Phase1CampaignGenSkeleton />
      ) : !hasCampaignGenerated ? (
        <div
          className="p-8 sm:p-12 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-6 border border-dashed"
          style={{ background: C.row, borderColor: C.lineStrong }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border"
            style={{ background: C.violetSoft, borderColor: C.violetLine, color: C.violetText }}
          >
            <Users className="w-8 h-8" style={{ color: C.violet }} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-base font-bold" style={{ ...HEADING_FONT, color: C.text }}>Campaign Kit Ready to Generate</h4>
            <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
              Generate a tailored launch roadmap with non-burdensome spaced milestones, social copy, story sequences, 60s video scripts, newsletter drafts, and tracking links customized for {project?.creatorName || 'the creator'}.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={generateCampaign}
              disabled={isGeneratingCampaign}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ background: C.crimson }}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Generate Campaign Kit with AI</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sub-Tabs Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
            {[
              { id: 'schedule', label: '1. Schedule & Roadmap', icon: Calendar },
              { id: 'post', label: '2. Announcement Post', icon: MessageSquare },
              { id: 'story', label: '3. Stories & Polls', icon: Smartphone },
              { id: 'video', label: '4. Video Script', icon: Video },
              { id: 'newsletter', label: '5. Newsletter Draft', icon: Send },
              { id: 'dm', label: '6. DM Outreach', icon: Users },
              { id: 'links', label: '7. Tracking Links', icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = campaignSubTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCampaignSubTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border"
                  style={
                    isActive
                      ? { background: C.raised, borderColor: C.lineStrong, color: C.text }
                      : { background: 'transparent', borderColor: 'transparent', color: C.muted }
                  }
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? C.crimsonText : C.faint }} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* SUBTAB 1: SCHEDULE */}
          {campaignSubTab === 'schedule' && (
            <div className="space-y-4 text-xs">
              {/* Autonomous Dispatcher Banner */}
              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-3"
                style={{ background: C.row, borderColor: C.line }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                      style={PILL_TONES.violet}
                    >
                      <Mail className="w-5 h-5" style={{ color: C.violet }} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold" style={{ ...HEADING_FONT, color: C.text }}>
                          Autonomous 24-Hour Post Dispatcher
                        </h4>
                        <span
                          className="text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono border"
                          style={isAutonomousEnabled ? PILL_TONES.ok : PILL_TONES.neutral}
                        >
                          {isAutonomousEnabled ? '● AUTO-DELIVERY ACTIVE (EVERY 24H)' : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed max-w-2xl" style={{ color: C.muted }}>
                        Zero friction. CoLaunch automatically emails each day's ready-to-post caption + direct download link for the high-res graphic or video directly to the creator's inbox every 24 hours on schedule.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutonomous}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 shrink-0"
                    style={
                      isAutonomousEnabled
                        ? { background: C.crimsonSoft, borderColor: C.crimsonLine, color: C.crimsonText }
                        : { background: C.okSoft, borderColor: C.okLine, color: C.ok }
                    }
                  >
                    {isAutonomousEnabled ? 'Pause Dispatcher' : 'Enable 24h Auto-Delivery'}
                  </button>
                </div>
              </div>

              {/* Milestones List */}
              <div className="space-y-2.5">
                {tasksList.map((task, idx) => {
                  const isDone = Boolean(task.done)
                  return (
                    <div
                      key={task.id || idx}
                      className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      style={{
                        background: isDone ? 'rgba(111,207,155,0.04)' : C.row,
                        borderColor: isDone ? C.okLine : C.line
                      }}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleScheduleTask?.(task.id)}
                          className="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                          style={
                            isDone
                              ? { background: C.ok, borderColor: C.ok, color: '#fff' }
                              : { background: C.sheet, borderColor: C.lineStrong, color: 'transparent' }
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                              style={PILL_TONES.neutral}
                            >
                              Day {task.day || idx + 1}
                            </span>
                            <span className="text-xs font-bold" style={{ color: C.text }}>
                              {task.title || `Milestone ${idx + 1}`}
                            </span>
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded border"
                              style={PILL_TONES.sky}
                            >
                              {task.channel || 'Social'}
                            </span>
                          </div>
                          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: C.muted }}>
                            {task.description || 'Deliverable details'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setViewDraftTask(task)}
                          className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
                        >
                          <Eye className="w-3.5 h-3.5" style={{ color: C.muted }} />
                          <span>View Draft</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SUBTAB 2: POST */}
          {campaignSubTab === 'post' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                    <XLogo className="w-3.5 h-3.5" style={{ color: C.crimsonText }} />
                    <span>Visual Post Mockup (Official X Post Preview)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGeneratePostImage?.()}
                    disabled={isGeneratingImage}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-white font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    style={{ background: C.crimson }}
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Generating Image...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>{campaignKit?.postImageUrl ? 'Regenerate Image' : 'Generate Graphic'}</span>
                      </>
                    )}
                  </button>
                </div>

                <PostVisualMockup
                  type="post"
                  project={project}
                  copyText={campaignKit?.announcementPost}
                  preorderUrl={`${origin}/preorder/${productSlug}`}
                  imageUrl={campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                  isGeneratingImage={isGeneratingImage}
                  imageError={imageGenError}
                  onRetryImage={() => handleGeneratePostImage?.()}
                />
              </div>

              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                    Social Announcement Post Copy
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard?.(campaignKit?.announcementPost, 'post')}
                    disabled={!campaignKit?.announcementPost}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
                  >
                    {copiedKey === 'post' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'post' ? 'Copied!' : 'Copy Post'}</span>
                  </button>
                </div>
                <textarea
                  value={campaignKit?.announcementPost || ''}
                  onChange={(e) => updateCampaignKit('announcementPost', e.target.value)}
                  placeholder="Click 'Generate AI Content' or write custom announcement post..."
                  rows={12}
                  className="w-full p-3.5 rounded-xl border text-xs outline-none leading-relaxed resize-y transition-all"
                  style={{ background: C.row, borderColor: C.line, color: C.text }}
                />
              </div>
            </div>
          )}

          {/* SUBTAB 3: STORIES */}
          {campaignSubTab === 'story' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                    <Smartphone className="w-3.5 h-3.5" style={{ color: C.crimsonText }} />
                    <span>Interactive 9:16 Story Frame Mockup</span>
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: C.muted }}>Instagram / TikTok</span>
                </div>
                <PostVisualMockup
                  type="story"
                  project={project}
                  copyText={campaignKit?.storySequence}
                  preorderUrl={`${origin}/preorder/${productSlug}`}
                />
              </div>

              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                    Instagram / TikTok 3-Story Sequence & Polls
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard?.(campaignKit?.storySequence, 'story')}
                    disabled={!campaignKit?.storySequence}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
                  >
                    {copiedKey === 'story' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'story' ? 'Copied!' : 'Copy Stories'}</span>
                  </button>
                </div>
                <textarea
                  value={campaignKit?.storySequence || ''}
                  onChange={(e) => updateCampaignKit('storySequence', e.target.value)}
                  placeholder="Story 1: Pain point poll&#10;Story 2: Product announcement&#10;Story 3: Link sticker CTA"
                  rows={14}
                  className="w-full p-3.5 rounded-xl border text-xs outline-none leading-relaxed resize-y transition-all"
                  style={{ background: C.row, borderColor: C.line, color: C.text }}
                />
              </div>
            </div>
          )}

          {/* SUBTAB 4: VIDEO SCRIPT */}
          {campaignSubTab === 'video' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    <span>60-Second Video Player & Teleprompter</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerateCampaignVideo?.()}
                    disabled={isGeneratingVideo}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-white font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    style={{ background: C.crimson }}
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Generating Video...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>{campaignKit?.videoUrl ? 'Regenerate Video' : 'Generate Video'}</span>
                      </>
                    )}
                  </button>
                </div>

                <PostVisualMockup
                  type="video"
                  project={project}
                  copyText={campaignKit?.videoScript}
                  preorderUrl={`${origin}/preorder/${productSlug}`}
                  videoUrl={campaignKit?.videoUrl}
                  isGeneratingVideo={isGeneratingVideo}
                  videoError={videoGenError}
                  onRetryVideo={() => handleGenerateCampaignVideo?.()}
                />
              </div>

              <div className="lg:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                    60-Second Short Form Script
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard?.(campaignKit?.videoScript, 'video')}
                    disabled={!campaignKit?.videoScript}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
                  >
                    {copiedKey === 'video' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'video' ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <textarea
                  value={campaignKit?.videoScript || ''}
                  onChange={(e) => updateCampaignKit('videoScript', e.target.value)}
                  placeholder="Click 'Generate AI Content' or write 60-second video script..."
                  rows={12}
                  className="w-full p-3.5 rounded-xl border text-xs outline-none leading-relaxed font-mono resize-y transition-all"
                  style={{ background: C.row, borderColor: C.line, color: C.text }}
                />
              </div>
            </div>
          )}

          {/* SUBTAB 5: NEWSLETTER */}
          {campaignSubTab === 'newsletter' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: C.skyText }} />
                    <span>1:1 Founder Email Inbox Mockup</span>
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: C.muted }}>Primary Inbox guaranteed</span>
                </div>
                <PostVisualMockup
                  type="newsletter"
                  project={project}
                  copyText={campaignKit?.newsletterDraft}
                  preorderUrl={`${origin}/preorder/${productSlug}`}
                />
              </div>

              <div className="lg:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                    Creator Email Newsletter Copy
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard?.(campaignKit?.newsletterDraft, 'newsletter')}
                    disabled={!campaignKit?.newsletterDraft}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
                  >
                    {copiedKey === 'newsletter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'newsletter' ? 'Copied!' : 'Copy Newsletter'}</span>
                  </button>
                </div>
                <textarea
                  rows={12}
                  value={campaignKit?.newsletterDraft || ''}
                  onChange={(e) => updateCampaignKit('newsletterDraft', e.target.value)}
                  placeholder="Click 'Generate AI Content' or write newsletter copy..."
                  className="w-full p-3.5 rounded-xl border text-xs outline-none leading-relaxed transition-all"
                  style={{ background: C.row, borderColor: C.line, color: C.text }}
                />
              </div>
            </div>
          )}

          {/* SUBTAB 6: DM OUTREACH */}
          {campaignSubTab === 'dm' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                    <Users className="w-3.5 h-3.5" style={{ color: C.violetText }} />
                    <span>1:1 Direct Message Mockup</span>
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: C.muted }}>VIP Community Outreach</span>
                </div>
                <PostVisualMockup
                  type="dm"
                  project={project}
                  copyText={campaignKit?.directMessageScript}
                  preorderUrl={`${origin}/preorder/${productSlug}`}
                />
              </div>

              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                    1-on-1 DM Script
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard?.(campaignKit?.directMessageScript, 'dm')}
                    disabled={!campaignKit?.directMessageScript}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
                  >
                    {copiedKey === 'dm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'dm' ? 'Copied!' : 'Copy DM'}</span>
                  </button>
                </div>
                <textarea
                  value={campaignKit?.directMessageScript || ''}
                  onChange={(e) => updateCampaignKit('directMessageScript', e.target.value)}
                  placeholder="Click 'Generate AI Content' or write DM outreach template..."
                  rows={10}
                  className="w-full p-3.5 rounded-xl border text-xs outline-none leading-relaxed transition-all"
                  style={{ background: C.row, borderColor: C.line, color: C.text }}
                />
              </div>
            </div>
          )}

          {/* SUBTAB 7: TRACKING LINKS */}
          {campaignSubTab === 'links' && (
            <div className="p-4 sm:p-5 rounded-2xl border space-y-3.5" style={{ background: C.row, borderColor: C.line }}>
              <div>
                <h4 className="text-xs font-bold" style={{ color: C.text }}>Channel Attribution UTM Links</h4>
                <p className="text-[11px]" style={{ color: C.muted }}>
                  Trackable pre-order URLs for creator social bio, stories, videos, and newsletters.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { channel: 'Instagram Stories', ref: 'instagram_story' },
                  { channel: 'TikTok / Shorts', ref: 'tiktok_video' },
                  { channel: 'X (Social Post)', ref: 'x_post' },
                  { channel: 'Email Newsletter', ref: 'newsletter' },
                  { channel: '1-on-1 DM Outreach', ref: 'dm_outreach' },
                ].map((item, i) => {
                  const slug = (project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '')
                  const fullUrl = `${origin}/preorder/${slug}?ref=${item.ref}`
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      style={{ background: C.sheet, borderColor: C.line }}
                    >
                      <div>
                        <span className="font-bold text-xs block" style={{ color: C.text }}>{item.channel}</span>
                        <span className="text-[11px] font-mono truncate" style={{ color: C.body }}>{fullUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard?.(fullUrl, `link-${i}`)}
                        className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        style={{ background: C.raised, borderColor: C.lineStrong, color: C.text }}
                      >
                        {copiedKey === `link-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === `link-${i}` ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* View Draft Modal */}
          {viewDraftTask && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
              <div
                className="w-full max-w-2xl rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-4 my-auto"
                style={{ background: C.sheet, borderColor: C.lineStrong, color: C.text }}
              >
                <div className="flex items-center justify-between border-b pb-3 gap-3" style={{ borderColor: C.line }}>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block font-mono" style={{ color: C.muted }}>
                      Day {viewDraftTask.day} · {viewDraftTask.channel}
                    </span>
                    <h3 className="text-base font-extrabold" style={{ ...HEADING_FONT, color: C.text }}>{viewDraftTask.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewDraftTask(null)}
                      className="p-1.5 rounded-xl transition-colors cursor-pointer border"
                      style={{ background: C.raised, borderColor: C.line, color: C.muted }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="py-1 max-h-[68vh] overflow-y-auto">
                  <PostVisualMockup
                    type={viewDraftTask.viewType || 'post'}
                    project={project}
                    copyText={getTaskDraftContent?.(viewDraftTask)}
                    preorderUrl={`${origin}/preorder/${productSlug}`}
                    imageUrl={viewDraftTask?.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                    videoUrl={viewDraftTask?.videoUrl || campaignKit?.videoUrl}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: C.line }}>
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard?.(getTaskDraftContent?.(viewDraftTask), 'draft-modal')
                      showNotification?.('Draft content copied to clipboard!')
                    }}
                    className="px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    style={{ background: C.crimson }}
                  >
                    <Copy className="w-3.5 h-3.5 text-white" />
                    <span>{copiedKey === 'draft-modal' ? 'Copied!' : 'Copy Draft Text'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleScheduleTask?.(viewDraftTask.id)
                        setViewDraftTask(null)
                      }}
                      className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      style={{ background: C.ok }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Mark Completed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewDraftTask(null)}
                      className="px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                      style={{ background: C.raised, borderColor: C.line, color: C.body }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Bottom Next Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const updated = {
                  ...(project || {}),
                  campaignApproved: true,
                  step3Done: true,
                  campaignKit: campaignKit
                }
                if (onUpdateProject) onUpdateProject((prev) => ({ ...(prev || {}), ...updated }))
                if (project?.id) {
                  updateCoLaunchProject(project.id, {
                    campaignApproved: true,
                    step3Done: true
                  }).catch((e) => console.warn(e))
                }
                showNotification('Creator campaign approved & sprint launched!')
                setActiveStep('optimize')
                onSelectStep?.('optimize')
              }}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 hover:opacity-90"
              style={{ background: C.crimson }}
            >
              <span>Next: Run & Optimize</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

