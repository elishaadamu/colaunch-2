import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ShieldCheck, Youtube, MessageSquare, Shield, Check, Copy,
  ExternalLink, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Clock, RotateCw
} from 'lucide-react'
import { getProjectAudienceGrounding } from '../../utils/audienceGrounding'
import { fetchCreatorYouTubeVideos, fetchYouTubeVideoComments, fetchCreatorComments } from '../../services/scraper'

export default function AudienceGroundingModal({
  isOpen,
  onClose,
  project,
  initialTab = 'transcripts'
}) {
  const resolvedInitialTab = (initialTab === 'deliverability' || initialTab === 'voice') ? 'transcripts' : initialTab
  const [activeTab, setActiveTab] = useState(resolvedInitialTab)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (initialTab) {
      setActiveTab((initialTab === 'deliverability' || initialTab === 'voice') ? 'transcripts' : initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const [liveVideos, setLiveVideos] = useState(null)
  const [isFetchingLive, setIsFetchingLive] = useState(false)
  const [liveComments, setLiveComments] = useState(null)
  const [isFetchingComments, setIsFetchingComments] = useState(false)

  // 1. Fetch real YouTube creator videos if not yet populated
  useEffect(() => {
    if (!isOpen) return
    const currentPosts = (Array.isArray(project?.recentPosts) && project.recentPosts.length > 0 ? project.recentPosts : null) ||
      (Array.isArray(project?.videos) && project.videos.length > 0 ? project.videos : null)
    
    if (!currentPosts && !liveVideos && !isFetchingLive) {
      const cleanH = String(project?.creatorHandle || project?.creator_handle || project?.handle || project?.creatorName || '').replace(/^@/, '').trim()
      if (cleanH && !/^[0-9a-f-]{15,}$/i.test(cleanH)) {
        setIsFetchingLive(true)
        fetchCreatorYouTubeVideos(cleanH)
          .then(vids => {
            if (vids && vids.length > 0) setLiveVideos(vids)
          })
          .catch(() => {})
          .finally(() => setIsFetchingLive(false))
      }
    }
  }, [isOpen, project, liveVideos, isFetchingLive])

  // 2. Fetch real YouTube audience comments directly from uploads or channel handle
  useEffect(() => {
    if (!isOpen) return
    if (liveComments || isFetchingComments) return

    const posts = (Array.isArray(liveVideos) && liveVideos.length > 0 ? liveVideos : null) ||
      (Array.isArray(project?.recentPosts) && project.recentPosts.length > 0 ? project.recentPosts : null) ||
      (Array.isArray(project?.videos) && project.videos.length > 0 ? project.videos : null)

    const targetVid = posts?.[0]?.videoId || posts?.[0]?.id
    const cleanH = String(project?.creatorHandle || project?.creator_handle || project?.handle || project?.creatorName || '').replace(/^@/, '').trim()
    const target = targetVid || (cleanH && !/^[0-9a-f-]{15,}$/i.test(cleanH) ? cleanH : null)

    if (target) {
      setIsFetchingComments(true)
      fetchCreatorComments(target)
        .then(cmts => {
          if (cmts && cmts.length > 0) {
            setLiveComments(cmts)
          }
        })
        .catch(() => {})
        .finally(() => setIsFetchingComments(false))
    }
  }, [isOpen, project, liveVideos, liveComments, isFetchingComments])

  if (!isOpen) return null

  const effectiveProject = liveVideos ? { ...project, recentPosts: liveVideos, videos: liveVideos } : project
  const grounding = getProjectAudienceGrounding(effectiveProject, liveComments)
  const creator = grounding.creatorName
  const product = grounding.productName

  const creatorChannelUrl = (() => {
    if (project?.channelUrl && String(project.channelUrl).startsWith('http')) return project.channelUrl
    if (project?.youtubeUrl && String(project.youtubeUrl).startsWith('http')) return project.youtubeUrl
    if (project?.creatorChannel && String(project.creatorChannel).startsWith('http')) return project.creatorChannel
    if (project?.socialUrl && String(project.socialUrl).startsWith('http')) return project.socialUrl
    if (project?.channel_url && String(project.channel_url).startsWith('http')) return project.channel_url
    if (project?.youtube_url && String(project.youtube_url).startsWith('http')) return project.youtube_url

    const handle = String(project?.creatorHandle || project?.creator_handle || project?.handle || '').replace(/^@/, '').trim()
    if (handle && !/^[0-9a-f-]{10,}$/i.test(handle)) {
      return `https://www.youtube.com/@${handle}`
    }

    const name = String(project?.creatorName || project?.creator_name || creator || '').trim()
    if (name && !/^[0-9a-f-]{10,}$/i.test(name)) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`
    }

    return 'https://www.youtube.com'
  })()

  const primaryVideo = grounding.transcripts?.[0]
  const primaryVideoUrl = (() => {
    if (primaryVideo?.url && String(primaryVideo.url).startsWith('http')) return primaryVideo.url
    if (project?.videoUrl && String(project.videoUrl).startsWith('http')) return project.videoUrl
    if (project?.youtubeUrl && String(project.youtubeUrl).startsWith('http')) return project.youtubeUrl
    if (project?.videos?.[0]?.url && String(project.videos[0].url).startsWith('http')) return project.videos[0].url
    if (primaryVideo?.title) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${creator} ${primaryVideo.title}`)}`
    }
    return creatorChannelUrl
  })()

  const getVideoUrlForComment = (comment, idx) => {
    if (comment?.videoUrl && String(comment.videoUrl).startsWith('http')) return comment.videoUrl
    const matchedTranscript = grounding.transcripts?.find(t => 
      (comment.videoTitle && t.title?.toLowerCase().includes(comment.videoTitle.toLowerCase())) ||
      (t.id && comment.id && t.id.replace('yt-', '') === comment.id.replace('comm-', ''))
    ) || primaryVideo

    if (matchedTranscript?.url && String(matchedTranscript.url).startsWith('http')) {
      return matchedTranscript.url
    }
    if (matchedTranscript?.title) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${creator} ${matchedTranscript.title}`)}`
    }
    return primaryVideoUrl
  }

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const C = {
    bg: '#08090c',
    sheet: '#10131a',
    row: '#0c0e13',
    raised: '#171b24',
    line: 'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.16)',
    text: '#f3f4f6',
    body: '#cdd1da',
    muted: '#9ba1ae',
    faint: '#6c7280',
    crimson: '#c81e3c',
    crimsonSoft: 'rgba(200,30,60,0.14)',
    crimsonLine: 'rgba(200,30,60,0.4)',
    crimsonText: '#ff8fa3',
    ok: '#6fcf9b',
    okSoft: 'rgba(111,207,155,0.12)',
    okLine: 'rgba(111,207,155,0.35)',
    sky: '#7dd3fc',
    skySoft: 'rgba(56,189,248,0.12)',
    skyLine: 'rgba(56,189,248,0.35)',
    amber: '#f0b46a',
    amberSoft: 'rgba(240,180,106,0.12)',
    amberLine: 'rgba(240,180,106,0.35)',
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(8,9,12,0.82)' }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: C.sheet, border: `1px solid ${C.lineStrong}`, color: C.text }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-start justify-between gap-4 shrink-0"
          style={{ background: C.row, borderBottom: `1px solid ${C.line}` }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"
                style={{ background: C.okSoft, color: C.ok, border: `1px solid ${C.okLine}` }}
              >
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: C.ok }} />
                <span>Verified Creator Voice</span>
              </span>
              <span className="text-[11px] font-mono" style={{ color: C.muted }}>
                {product} × {creator}
              </span>
              <a
                href={creatorChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors"
                style={{ background: C.crimsonSoft, color: C.crimsonText, border: `1px solid ${C.crimsonLine}` }}
                title={`Open ${creator}'s YouTube channel in a new tab`}
              >
                <Youtube className="w-3 h-3" style={{ color: C.crimsonText }} />
                <span>Open YouTube Channel</span>
                <ExternalLink className="w-2.5 h-2.5" style={{ color: C.crimsonText }} />
              </a>
            </div>
            <h2
              className="text-base sm:text-lg font-bold tracking-tight"
              style={{ color: C.text, fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
              Audience Data Grounding & Content Provenance
            </h2>
            <p className="text-xs max-w-2xl" style={{ color: C.muted }}>
              All co-launch sprint tasks, 60s video hooks, story sequences, and emails are derived directly from verified YouTube video transcripts, audience comments, and {creator}’s authentic communication profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
            style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, color: C.body }}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex items-center gap-1.5 px-5 pt-3 overflow-x-auto no-scrollbar scrollbar-none shrink-0"
          style={{ background: C.sheet, borderBottom: `1px solid ${C.line}` }}
        >
          {[
            { id: 'transcripts', label: `YouTube Transcripts (${grounding.transcripts.length})`, icon: Youtube },
            { id: 'comments', label: `Audience Comments (${grounding.audienceComments.length})`, icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap"
                style={
                  isActive
                    ? { background: C.raised, color: C.text, borderBottom: `2px solid ${C.crimson}`, borderTop: `1px solid ${C.line}`, borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }
                    : { background: 'transparent', color: C.muted, borderBottom: '2px solid transparent' }
                }
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? C.crimsonText : C.faint }} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5" style={{ background: C.bg }}>
          {/* TAB 1: YOUTUBE TRANSCRIPTS */}
          {activeTab === 'transcripts' && (
            <div className="space-y-4">
              <div
                className="p-3.5 rounded-xl text-xs flex items-start gap-3"
                style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.body }}
              >
                <Youtube className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.crimsonText }} />
                <div className="space-y-1">
                  <div className="font-bold" style={{ color: C.text }}>Verified Channel Uploads & Discussion Grounding</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: C.body }}>
                    Rather than generating boilerplate copy, all launch assets and video scripts are derived directly from {creator}'s channel uploads, channel description, and audience discussions. The 60-second video demo and social stories seamlessly connect the key workflow challenges highlighted in their recent content.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {grounding.transcripts.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-4 rounded-xl space-y-3"
                    style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1"
                            style={{ background: C.crimsonSoft, color: C.crimsonText, border: `1px solid ${C.crimsonLine}` }}
                          >
                            <Youtube className="w-3 h-3" style={{ color: C.crimsonText }} />
                            <span>{t.tag || 'Channel Discussion Topic'}</span>
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: C.faint }}>{t.views}</span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm mt-1" style={{ color: C.text }}>
                          {t.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <a
                          href={t.url && String(t.url).startsWith('http') ? t.url : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${creator} ${t.title}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          style={{ background: C.crimsonSoft, color: C.crimsonText, border: `1px solid ${C.crimsonLine}` }}
                          title={`Open "${t.title}" on YouTube`}
                        >
                          <Youtube className="w-3 h-3" style={{ color: C.crimsonText }} />
                          <span>Watch on YouTube</span>
                          <ExternalLink className="w-2.5 h-2.5" style={{ color: C.crimsonText }} />
                        </a>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: C.raised, color: C.muted, border: `1px solid ${C.line}` }}
                        >
                          {t.tag}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`"${t.quote}" — ${t.title}`, t.id)}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                          style={{ background: C.raised, color: C.body, border: `1px solid ${C.line}` }}
                          title="Copy transcript quote"
                        >
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5" style={{ color: C.ok }} /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-lg text-xs italic leading-relaxed"
                      style={{ background: C.row, border: `1px solid ${C.line}`, color: C.body }}
                    >
                      “{t.quote}”
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2.5 rounded-lg" style={{ background: C.okSoft, border: `1px solid ${C.okLine}`, color: C.body }}>
                        <span className="font-bold block text-[10px] uppercase mb-0.5" style={{ color: C.ok }}>Applied Sprint Tasks</span>
                        <span>{t.appliedTo}</span>
                      </div>
                      <div className="p-2.5 rounded-lg" style={{ background: C.skySoft, border: `1px solid ${C.skyLine}`, color: C.body }}>
                        <span className="font-bold block text-[10px] uppercase mb-0.5" style={{ color: C.sky }}>Audience Psychology Rationale</span>
                        <span>{t.relevance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIENCE COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div
                className="p-3.5 rounded-xl text-xs flex items-start gap-3"
                style={{ background: C.skySoft, border: `1px solid ${C.skyLine}`, color: C.body }}
              >
                <MessageSquare className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.sky }} />
                <div className="space-y-1">
                  <div className="font-bold" style={{ color: C.text }}>Real Community Questions & Demand Signals</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: C.body }}>
                    Extracted from {creator}'s top video comments and community discussions. Every pre-order offer and teaser post answers these verified, high-friction pain points.
                  </div>
                </div>
              </div>

              {/* Analyzed Source Video Banner */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}
                    >
                      <Youtube className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                          style={{ background: C.crimsonSoft, color: C.crimsonText, border: `1px solid ${C.crimsonLine}` }}
                        >
                          Source Video Analyzed
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: C.faint }}>
                          {primaryVideo?.views || 'Channel Upload'} • Sourced from Channel Content
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold truncate" style={{ color: C.text }}>
                        {primaryVideo?.title || `${creator}'s Latest Video Breakdown`}
                      </h4>
                      <p className="text-[11px]" style={{ color: C.muted }}>
                        {creator} • Direct YouTube transcript & comments analyzed for audience demand
                      </p>
                    </div>
                  </div>
                  <a
                    href={primaryVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer group"
                    style={{ background: C.crimson, color: '#ffffff' }}
                    title="Open this video on YouTube to read the original viewer comments"
                  >
                    <Youtube className="w-4 h-4 text-white" />
                    <span>Watch Video & Read Comments</span>
                    <ExternalLink className="w-3 h-3 text-white/90 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Comments List */}
              {grounding.audienceComments.length > 0 ? (
                <div className="space-y-3">
                  {grounding.audienceComments.map((c, idx) => {
                    const commentVideoUrl = getVideoUrlForComment(c, idx)
                    const matchedVideoTitle = c.videoTitle || primaryVideo?.title || 'YouTube Devlog Upload'

                    return (
                      <div
                        key={c.id || idx}
                        className="p-4 rounded-xl space-y-3"
                        style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pb-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold" style={{ color: C.text }}>{c.author}</span>
                            <span className="text-[10px] font-mono" style={{ color: C.muted }}>• {c.source}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                              style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.amberLine}` }}
                            >
                              👍 {c.likes} {c.likes === 1 || c.likes === '1' ? 'Upvote' : 'Upvotes'}
                            </span>
                            {c.published && (
                              <span className="text-[10px] font-mono" style={{ color: C.faint }}>
                                {c.published}
                              </span>
                            )}
                            <a
                              href={commentVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer group"
                              style={{ background: C.crimsonSoft, color: C.crimsonText, border: `1px solid ${C.crimsonLine}` }}
                              title={`Read this comment and thread on YouTube: "${matchedVideoTitle}"`}
                            >
                              <Youtube className="w-3 h-3 shrink-0" style={{ color: C.crimsonText }} />
                              <span>Read on YouTube</span>
                              <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" style={{ color: C.crimsonText }} />
                            </a>
                          </div>
                        </div>

                        <p
                          className="text-xs leading-relaxed font-sans italic p-3 rounded-lg"
                          style={{ background: C.row, border: `1px solid ${C.line}`, color: C.body }}
                        >
                          "{c.quote}"
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px]" style={{ borderTop: `1px solid ${C.line}` }}>
                          <div>
                            <span className="font-mono" style={{ color: C.muted }}>Answers Pain: </span>
                            <span className="font-bold" style={{ color: C.text }}>{c.addressedBy}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="font-medium" style={{ color: C.ok }}>
                              ✓ {c.actionTaken}
                            </div>
                            <a
                              href={commentVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold flex items-center gap-1 hover:underline text-[10px]"
                              style={{ color: C.crimsonText }}
                            >
                              <span>Open Source Video</span>
                              <ExternalLink className="w-2.5 h-2.5" style={{ color: C.crimsonText }} />
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-xl text-center space-y-3" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.muted }}
                  >
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold" style={{ color: C.text }}>
                      {isFetchingComments ? 'Extracting Audience Comments from Channel...' : 'No Public Comments Found for This Channel'}
                    </h4>
                    <p className="text-xs max-w-md mx-auto" style={{ color: C.muted }}>
                      {isFetchingComments
                        ? 'Connecting to verified channel video uploads to grab authentic community questions and pain points...'
                        : 'No public viewer comments were returned for the recent uploads on this channel, or comments may be disabled. Zero artificial placeholder comments are injected.'}
                    </p>
                  </div>
                  {!isFetchingComments && (
                    <button
                      type="button"
                      onClick={() => {
                        const cleanH = String(project?.creatorHandle || project?.creator_handle || project?.handle || project?.creatorName || '').replace(/^@/, '').trim()
                        if (cleanH) {
                          setIsFetchingComments(true)
                          fetchCreatorComments(cleanH)
                            .then(cmts => {
                              if (cmts && cmts.length > 0) setLiveComments(cmts)
                            })
                            .catch(() => {})
                            .finally(() => setIsFetchingComments(false))
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      style={{ background: C.raised, border: `1px solid ${C.lineStrong}`, color: C.body }}
                    >
                      <RotateCw className="w-3.5 h-3.5" style={{ color: C.muted }} />
                      <span>Retry Fetching Comments</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between text-xs shrink-0"
          style={{ background: C.row, borderTop: `1px solid ${C.line}` }}
        >
          <div className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: C.muted }}>
            <ShieldCheck className="w-4 h-4" style={{ color: C.ok }} />
            <span>Audience Grounding & Provenance Engine Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            style={{ background: C.crimson, color: '#ffffff' }}
          >
            Done Viewing Citations
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
