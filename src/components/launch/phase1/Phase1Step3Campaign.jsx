import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar, MessageSquare, Smartphone, Video, Send, Users, Globe, Youtube, Instagram, ShieldCheck,
  Save, Sparkles, Loader2, Mail, Copy, ExternalLink, Eye, Download, Check, CheckCircle2, ArrowRight,
  X, Plus, Trash2, Feather, Gauge, Rocket, MailCheck, Clock, Wand2, Film, Image as ImageIcon,
  RectangleVertical, RectangleHorizontal, Link2, Pencil, ListPlus, AlertCircle,
} from 'lucide-react'
import { updateCoLaunchProject } from '../../../services/opsApi'
import { Phase1CampaignGenSkeleton } from '../Section2Skeletons'
import { XLogo } from '../PostVisualMockup'
import { C, P1_SHARED_CSS } from './phase1Constants'
import StepRail from './StepRail'
import { resolveProjectLanding } from '../../../utils/projectLanding'
import {
  XPostTemplate, InstagramPostTemplate, StoryFramesTemplate, ShortVideoTemplate, ScriptBeats,
  NewsletterTemplate, DmTemplate, isLight,
} from './SocialPostTemplates'

const S3_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.s3 .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.s3 .btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;text-decoration:none;transition:background-color .15s,border-color .15s,color .15s,filter .15s;padding:.55rem .9rem}
.s3 .btn:disabled{opacity:.45;cursor:not-allowed}
.s3 .btn-primary{background:${C.crimson};color:#fff}
.s3 .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.s3 .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.s3 .btn-ok{background:${C.okSoft};color:${C.ok};border-color:${C.okLine}}
.s3 .card{background:${C.row};border:1px solid ${C.line}}
.s3 .well{background:${C.sheet};border:1px solid ${C.line}}
.s3 .in{width:100%;background:${C.sheet};border:1px solid ${C.line};color:${C.text};padding:.6rem .8rem;font-size:.875rem;outline:none;transition:border-color .15s}
.s3 .in:focus{border-color:${C.crimsonLine}}
.s3 .in::placeholder{color:${C.faint}}
.s3 textarea.in{resize:vertical;line-height:1.55}
.s3 .lbl{display:block;font-size:.75rem;font-weight:600;color:${C.body};margin-bottom:.375rem}
.s3 .eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.faint}}
.s3 .tab{display:inline-flex;align-items:center;gap:.5rem;white-space:nowrap;padding:.55rem .85rem;font-size:.8125rem;font-weight:600;cursor:pointer;color:${C.muted};border:1px solid transparent;background:transparent}
.s3 .tab:hover{color:${C.text}}
.s3 .chip{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .65rem;font-size:.75rem;font-weight:600;border:1px solid ${C.line};background:${C.sheet};color:${C.body};cursor:pointer}
.s3 .chip:hover{border-color:${C.lineStrong};color:${C.text}}
.s3 .seg{display:inline-flex;border:1px solid ${C.line};background:${C.sheet}}
.s3 .seg button{padding:.45rem .75rem;font-size:.75rem;font-weight:600;color:${C.muted};cursor:pointer;display:inline-flex;align-items:center;gap:.35rem}
.s3 .seg button[aria-pressed="true"]{background:${C.raised};color:${C.text}}
.s3 :focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
@media (prefers-reduced-motion:reduce){.s3 *{transition:none!important;animation:none!important}}
`

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
const fmtHour = (h) => `${(h % 12) || 12}:00 ${h < 12 ? 'AM' : 'PM'}`
const TIMEZONES = ['Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney', 'UTC']

export function taskKind(task = {}) {
  const dk = task.draftKey || ''
  if (dk === 'videoScript') return 'video'
  if (dk === 'storySequence') return 'story'
  if (dk === 'newsletterDraft') return 'newsletter'
  if (dk === 'directMessageScript') return 'dm'
  if (dk === 'announcementPost') return 'post'
  const s = `${task.channel || ''} ${task.title || ''}`.toLowerCase()
  if (/(video|reel|short|tiktok|youtube)/.test(s) && !s.includes('community')) return 'video'
  if (/stor(y|ies)/.test(s)) return 'story'
  if (/(newsletter|email)/.test(s)) return 'newsletter'
  if (/\bdm\b|direct message/.test(s)) return 'dm'
  return 'post'
}

const KIND_META = {
  post: { Icon: XLogo, label: 'Social post' },
  story: { Icon: Smartphone, label: 'Stories' },
  video: { Icon: Film, label: 'Short video' },
  newsletter: { Icon: Mail, label: 'Newsletter' },
  dm: { Icon: MessageSquare, label: 'DMs' },
}

const xIntent = (text, link) => {
  let t = String(text || '').replace(/https?:\/\/\S+/g, '').trim()
  if (t.length > 230) t = `${t.slice(0, 227).replace(/\s+\S*$/, '')}…`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${t}\n\n${link}`)}`
}

const SUGGESTED_NOTES = (price) => [
  ...(price > 0 ? [`Mention the $${price} founding price in every post`] : []),
  'Write in a casual, first-person voice',
  'Reference my most recent video',
  'No hashtags',
  'Use emojis sparingly',
  'Include one audience poll',
  'Keep each post under 15 minutes of effort',
]

export default function Phase1Step3Campaign(props) {
  const {
    project, campaignKit, updateCampaignKit, isGeneratingCampaign, generateCampaign, hasCampaignGenerated, saveAll,
    campaignSubTab, setCampaignSubTab, isAutonomousEnabled, handleToggleAutonomous, viewDraftTask, setViewDraftTask,
    campaignPacing, setCampaignPacing, postingFrequency, setPostingFrequency, campaignStrategyPrompt, setCampaignStrategyPrompt,
    creatorChannelUrl, setShowAudienceIntelModal, setAudienceIntelModalTab, productSlug, origin, showNotification,
    setActiveStep, onSelectStep, onUpdateProject, handleToggleScheduleTask, handleGeneratePostImage, isGeneratingImage,
    imageGenError, handleGenerateCampaignVideo, isGeneratingVideo, videoGenError, handleSendPostKitEmail, isSendingTodayEmail,
    copyToClipboard, copiedKey, getTaskDraftContent,
    autonomousEmail, setAutonomousEmail, creatorTimezone, setCreatorTimezone, sendHour, setSendHour,
    handleSaveDeliverySettings, isSavingAutonomousConfig, sendingEmailTaskId,
  } = props

  const landing = useMemo(() => resolveProjectLanding(project || {}), [project])
  const accent = landing.brandColor || C.crimson
  const accentInk = isLight(accent) ? '#0a0c10' : '#ffffff'
  const creatorName = project?.creatorName || 'Creator'
  const handle = String(project?.creatorHandle || creatorName).replace(/^@/, '').replace(/\s+/g, '').toLowerCase()
  const avatar = project?.creatorAvatar || ''
  const productName = project?.productName || 'the product'
  const tagline = project?.productTagline || landing.concept?.tagline || ''
  const foundingPrice = campaignKit?.pricingConfig?.foundingPrice || project?.campaignKit?.pricingConfig?.foundingPrice || 0
  const baseLink = `${origin}/preorder/${productSlug}`
  const link = (ref) => `${baseLink}?ref=${ref}`
  const imageUrl = campaignKit?.postImageUrl || campaignKit?.postImageDataUrl || ''
  const videoUrl = campaignKit?.videoUrl || ''

  const tasks = campaignKit?.postingSchedule || []
  const delivery = campaignKit?.autonomousEmailDelivery || {}
  const nextTask = tasks.find((t) => !t.done && !t.emailed) || null
  const sentCount = tasks.filter((t) => t.emailed).length

  // Social profiles (saved with the kit)
  const socials = { youtube: creatorChannelUrl || '', ...(campaignKit?.socialLinks || {}) }
  const [editingSocials, setEditingSocials] = useState(false)
  const [socialDraft, setSocialDraft] = useState(socials)
  useEffect(() => { if (!editingSocials) setSocialDraft(socials) }, [campaignKit?.socialLinks, creatorChannelUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // Extra prompt instructions, added before generating
  const [notes, setNotes] = useState(() => (Array.isArray(campaignKit?.promptNotes) ? campaignKit.promptNotes : []))
  const [noteDraft, setNoteDraft] = useState('')
  useEffect(() => { if (Array.isArray(campaignKit?.promptNotes)) setNotes(campaignKit.promptNotes) }, [campaignKit?.promptNotes])
  const commitNotes = (next) => {
    setNotes(next)
    if (hasCampaignGenerated) updateCampaignKit('promptNotes', next)
  }
  const addNote = (txt) => {
    const t = String(txt || '').trim()
    if (!t || notes.includes(t)) return
    commitNotes([...notes, t])
    setNoteDraft('')
  }

  // Media directions
  const [imageDirection, setImageDirection] = useState('')
  const [videoDirection, setVideoDirection] = useState('')
  const [videoFormat, setVideoFormat] = useState('9:16')
  const [videoLength, setVideoLength] = useState(8)
  const [postView, setPostView] = useState('x')

  const runGenerate = () => generateCampaign({ promptNotes: notes })

  const download = (url, filename) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const CopyBtn = ({ text, id, label = 'Copy' }) => (
    <button type="button" className="btn btn-quiet" onClick={() => copyToClipboard?.(text, id)} disabled={!text}>
      {copiedKey === id ? <Check className="w-3.5 h-3.5" style={{ color: C.ok }} /> : <Copy className="w-3.5 h-3.5" />}
      {copiedKey === id ? 'Copied' : label}
    </button>
  )

  const editor = ({ field, rows = 12, placeholder, mono }) => (
    <textarea
      className={`in ${mono ? 'font-mono text-[13px]' : ''}`}
      rows={rows}
      value={campaignKit?.[field] || ''}
      onChange={(e) => updateCampaignKit(field, e.target.value)}
      placeholder={placeholder}
    />
  )

  const PublishRow = ({ kind, text }) => {
    const items = {
      post: [['Post on X', xIntent(text, link('x_post')), XLogo], ['Open Instagram', socials.instagram || 'https://www.instagram.com/', Instagram], ['YouTube Community', 'https://studio.youtube.com/', Youtube]],
      story: [['Open Instagram Stories', socials.instagram || 'https://www.instagram.com/', Instagram]],
      video: [['YouTube Studio', 'https://studio.youtube.com/', Youtube], ['Instagram Reels', socials.instagram || 'https://www.instagram.com/', Instagram], ['TikTok upload', 'https://www.tiktok.com/upload', Film]],
    }[kind] || []
    if (!items.length) return null
    return (
      <div className="flex flex-wrap gap-2">
        {items.map(([label, href, Icon]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
            <Icon className="w-3.5 h-3.5" /> {label} <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        ))}
      </div>
    )
  }

  const renderTemplate = (kind, text) => {
    const common = { name: creatorName, handle, avatar, accent, productName, tagline }
    if (kind === 'story') return <StoryFramesTemplate {...common} text={text} imageUrl={imageUrl} />
    if (kind === 'video') return <ShortVideoTemplate {...common} videoUrl={videoUrl} posterUrl={campaignKit?.videoThumbnailUrl || imageUrl} caption={String(text || '').split('\n').find((l) => l.trim().length > 20) || tagline} />
    if (kind === 'newsletter') return <NewsletterTemplate {...common} text={text} link={link('newsletter')} />
    if (kind === 'dm') return <DmTemplate {...common} text={text} />
    return postView === 'ig'
      ? <InstagramPostTemplate {...common} text={text} imageUrl={imageUrl} />
      : <XPostTemplate {...common} text={text} imageUrl={imageUrl} />
  }

  const nextSendLabel = (() => {
    if (!delivery.nextSendAt) return null
    try {
      const d = new Date(delivery.nextSendAt)
      return d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: creatorTimezone || undefined })
    } catch { return null }
  })()

  const SectionHead = ({ icon: Icon, eyebrow, title, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}`, color: C.crimsonText }}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="eyebrow m-0">{eyebrow}</p>
          <h4 className="serif m-0 mt-0.5 text-2xl leading-tight" style={{ color: C.text }}>{title}</h4>
        </div>
      </div>
      {children}
    </div>
  )

  return (
    <div className="s3 p1-themed p1-rise p-5 sm:p-6 space-y-6" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
      <style>{P1_SHARED_CSS + S3_CSS}</style>
      <StepRail current="campaign" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="min-w-0">
          <p className="eyebrow m-0">Step 3 · Creator campaign</p>
          <h3 className="serif m-0 mt-1 text-3xl sm:text-4xl leading-tight" style={{ color: C.text }}>Plan the posts. We deliver one a day.</h3>
          <p className="m-0 mt-2 text-sm max-w-2xl" style={{ color: C.muted }}>
            Brief the AI, review every post as it will look on each platform, then {creatorName} gets each day's post kit by email, with the graphic and video attached.
          </p>
        </div>
        <button type="button" onClick={saveAll} className="btn btn-ok shrink-0"><Save className="w-3.5 h-3.5" /> Save</button>
      </div>

      {/* Creator + social profiles */}
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {avatar ? <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" /> : <span className="w-12 h-12 flex items-center justify-center shrink-0 font-bold" style={{ background: C.raised, color: C.text, borderRadius: 9999 }}>{creatorName.charAt(0)}</span>}
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold truncate" style={{ color: C.text }}>{creatorName} <span className="font-normal" style={{ color: C.muted }}>@{handle}</span></p>
              <p className="m-0 text-xs" style={{ color: C.faint }}>Posts are written from this creator's channel topics and audience comments.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['youtube', 'YouTube', Youtube], ['instagram', 'Instagram', Instagram], ['x', 'X', XLogo], ['tiktok', 'TikTok', Film],
            ].map(([key, label, Icon]) => socials[key] ? (
              <a key={key} href={socials[key]} target="_blank" rel="noopener noreferrer" className="chip"><Icon className="w-3.5 h-3.5" />{label}<ExternalLink className="w-3 h-3 opacity-50" /></a>
            ) : (
              <button key={key} type="button" className="chip" style={{ borderStyle: 'dashed', color: C.faint }} onClick={() => setEditingSocials(true)}><Plus className="w-3 h-3" />{label}</button>
            ))}
            <button type="button" className="chip" onClick={() => setEditingSocials((v) => !v)}><Pencil className="w-3 h-3" />Edit links</button>
            <button type="button" className="chip" onClick={() => { setAudienceIntelModalTab?.('transcripts'); setShowAudienceIntelModal?.(true) }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: C.ok }} />Audience sources
            </button>
          </div>
        </div>
        {editingSocials && (
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4"
            style={{ borderTop: `1px solid ${C.line}` }}
            onSubmit={(e) => {
              e.preventDefault()
              const clean = Object.fromEntries(Object.entries(socialDraft).map(([k, v]) => {
                const s = String(v || '').trim()
                return [k, s && !/^https?:\/\//i.test(s) ? `https://${s}` : s]
              }))
              updateCampaignKit('socialLinks', clean)
              setEditingSocials(false)
              showNotification('Social links saved.')
            }}
          >
            {[
              ['youtube', 'YouTube channel', 'youtube.com/@channel', Youtube], ['instagram', 'Instagram profile', 'instagram.com/handle', Instagram],
              ['x', 'X profile', 'x.com/handle', XLogo], ['tiktok', 'TikTok profile', 'tiktok.com/@handle', Film],
            ].map(([key, label, ph, Icon]) => (
              <label key={key} className="block">
                <span className="lbl flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</span>
                <input className="in" value={socialDraft[key] || ''} placeholder={ph} onChange={(e) => setSocialDraft((p) => ({ ...p, [key]: e.target.value }))} />
              </label>
            ))}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn btn-quiet" onClick={() => setEditingSocials(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Check className="w-3.5 h-3.5" />Save links</button>
            </div>
          </form>
        )}
      </section>

      {/* Brief the AI */}
      <section className="card p-4 sm:p-6 space-y-5">
        <SectionHead icon={Wand2} eyebrow="Before generating" title="Brief the AI" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <span className="lbl">How much can the creator post?</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low_burden', label: 'Light', desc: '4 posts · ~40 min', Icon: Feather },
                  { id: 'balanced', label: 'Balanced', desc: '5 posts · ~55 min', Icon: Gauge },
                  { id: 'intensive', label: 'Sprint', desc: '7 posts · ~90 min', Icon: Rocket },
                ].map(({ id, label, desc, Icon }) => {
                  const on = campaignPacing === id
                  return (
                    <button key={id} type="button" aria-pressed={on} onClick={() => setCampaignPacing(id)} className="p-3 text-left cursor-pointer transition-colors"
                      style={{ background: on ? C.crimsonSoft : C.sheet, border: `1px solid ${on ? C.crimsonLine : C.line}` }}>
                      <Icon className="w-4 h-4" style={{ color: on ? C.crimsonText : C.muted }} />
                      <span className="block mt-2 text-sm font-semibold" style={{ color: C.text }}>{label}</span>
                      <span className="block text-[11px]" style={{ color: C.muted }}>{desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <label className="block">
              <span className="lbl">Their normal posting rhythm</span>
              <select className="in cursor-pointer" value={postingFrequency} onChange={(e) => setPostingFrequency(e.target.value)}>
                <option value="1 video per week (Standard YouTube)">1 video a week (YouTube)</option>
                <option value="2-3 posts per week (Multi-channel)">2–3 posts a week, several channels</option>
                <option value="Bi-weekly or monthly (Long-form deep dives)">Every 2 weeks or monthly</option>
                <option value="High-frequency short-form (Daily TikTok/Reels)">Daily short-form (Reels / TikTok)</option>
              </select>
            </label>
            <label className="block">
              <span className="lbl">Main direction</span>
              <textarea className="in" rows={4} value={campaignStrategyPrompt} onChange={(e) => setCampaignStrategyPrompt(e.target.value)}
                placeholder="What should this campaign achieve, and how? e.g. Lead with the problem from my last video, push the founding price, keep it low-effort." />
            </label>
          </div>

          <div className="space-y-3">
            <span className="lbl flex items-center gap-1.5"><ListPlus className="w-3.5 h-3.5" />Extra instructions <span style={{ color: C.faint, fontWeight: 400 }}>({notes.length})</span></span>
            {notes.length > 0 ? (
              <ol className="list-none m-0 p-0 space-y-1.5">
                {notes.map((n, i) => (
                  <li key={n} className="well flex items-start gap-2.5 px-3 py-2">
                    <span className="text-[11px] font-mono mt-0.5" style={{ color: C.faint }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-sm" style={{ color: C.body }}>{n}</span>
                    <button type="button" aria-label="Remove instruction" className="p-0.5 cursor-pointer" style={{ color: C.faint }} onClick={() => commitNotes(notes.filter((x) => x !== n))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="well m-0 px-3 py-3 text-xs" style={{ color: C.faint }}>Add as many instructions as you like. The AI must follow every one.</p>
            )}
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addNote(noteDraft) }}>
              <input className="in" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="e.g. Mention the 30-day money-back guarantee" />
              <button type="submit" className="btn btn-quiet shrink-0" disabled={!noteDraft.trim()}><Plus className="w-3.5 h-3.5" />Add</button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_NOTES(foundingPrice).filter((s) => !notes.includes(s)).slice(0, 6).map((s) => (
                <button key={s} type="button" className="chip" onClick={() => addNote(s)}><Plus className="w-3 h-3" />{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
          <p className="m-0 text-xs" style={{ color: C.muted }}>
            {campaignPacing === 'intensive' ? 7 : campaignPacing === 'balanced' ? 5 : 4} posts · {notes.length + (campaignStrategyPrompt?.trim() ? 1 : 0)} instructions · graphic and video are made after the posts
          </p>
          <button type="button" onClick={runGenerate} disabled={isGeneratingCampaign} className="btn btn-primary px-5 py-2.5">
            {isGeneratingCampaign ? <><Loader2 className="w-4 h-4 animate-spin" />Writing the campaign…</> : <><Sparkles className="w-4 h-4" />{hasCampaignGenerated ? 'Regenerate campaign' : 'Generate campaign'}</>}
          </button>
        </div>
      </section>

      {isGeneratingCampaign ? (
        <Phase1CampaignGenSkeleton />
      ) : !hasCampaignGenerated ? (
        <div className="card p-8 sm:p-12 text-center space-y-3" style={{ borderStyle: 'dashed', borderColor: C.lineStrong }}>
          <span className="inline-flex w-14 h-14 items-center justify-center" style={{ background: C.raised, border: `1px solid ${C.line}`, color: C.crimsonText }}><Calendar className="w-6 h-6" /></span>
          <h4 className="serif m-0 text-2xl" style={{ color: C.text }}>No campaign yet</h4>
          <p className="m-0 text-sm max-w-md mx-auto" style={{ color: C.muted }}>Brief the AI above, then generate. You'll get a day-by-day schedule, posts for X and Instagram, stories, a short video, a newsletter and DMs.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div role="tablist" className="flex gap-1 overflow-x-auto pb-1" style={{ borderBottom: `1px solid ${C.line}` }}>
            {[
              ['schedule', 'Schedule & email', Calendar], ['post', 'X & Instagram', XLogo], ['story', 'Stories', Smartphone],
              ['video', 'Video', Video], ['newsletter', 'Newsletter', Mail], ['dm', 'DMs', Users], ['links', 'Links', Globe],
            ].map(([id, label, Icon]) => {
              const on = campaignSubTab === id
              return (
                <button key={id} role="tab" aria-selected={on} type="button" className="tab" onClick={() => setCampaignSubTab(id)}
                  style={on ? { color: C.text, borderBottom: `2px solid ${accent}`, marginBottom: -1 } : undefined}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              )
            })}
          </div>

          {/* SCHEDULE & EMAIL */}
          {campaignSubTab === 'schedule' && (
            <div className="space-y-5 p1-rise">
              <section className="card p-4 sm:p-5 space-y-4">
                <SectionHead icon={MailCheck} eyebrow="Automatic" title="Daily post kit by email">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border shrink-0"
                    style={isAutonomousEnabled ? { background: C.okSoft, borderColor: C.okLine, color: C.ok } : { background: C.sheet, borderColor: C.line, color: C.muted }}>
                    <span className="w-1.5 h-1.5" style={{ background: isAutonomousEnabled ? C.ok : C.faint }} />{isAutonomousEnabled ? 'On' : 'Paused'}
                  </span>
                </SectionHead>
                <p className="m-0 text-sm" style={{ color: C.muted }}>
                  Each morning the next post goes to the creator: the caption, the graphic and video as attachments, and buttons that open Instagram, YouTube and X ready to post.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="lbl">Send to</span>
                    <input className="in" type="email" value={autonomousEmail || ''} onChange={(e) => setAutonomousEmail?.(e.target.value)} placeholder="creator@email.com" />
                  </label>
                  <label className="block">
                    <span className="lbl">Time</span>
                    <select className="in cursor-pointer" value={sendHour} onChange={(e) => setSendHour?.(Number(e.target.value))}>
                      {HOURS.map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="lbl">Creator's timezone</span>
                    <input className="in" list="s3-tz" value={creatorTimezone || ''} onChange={(e) => setCreatorTimezone?.(e.target.value)} placeholder="Africa/Lagos" />
                    <datalist id="s3-tz">{TIMEZONES.map((t) => <option key={t} value={t} />)}</datalist>
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                  <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.muted }}>
                    <Clock className="w-3.5 h-3.5" />
                    {isAutonomousEnabled && nextTask
                      ? <>Next: <strong style={{ color: C.text }}>Day {nextTask.day} · {nextTask.title}</strong>{nextSendLabel ? ` on ${nextSendLabel}` : ''}</>
                      : isAutonomousEnabled ? 'All posts have been sent.' : `${sentCount} of ${tasks.length} sent so far.`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-quiet" disabled={isSavingAutonomousConfig || !autonomousEmail}
                      onClick={() => handleSaveDeliverySettings?.({ enabled: isAutonomousEnabled })}>
                      {isSavingAutonomousConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save settings
                    </button>
                    <button type="button" className={isAutonomousEnabled ? 'btn btn-quiet' : 'btn btn-primary'} disabled={isSavingAutonomousConfig || !autonomousEmail}
                      onClick={() => handleSaveDeliverySettings?.({ enabled: !isAutonomousEnabled })}>
                      {isAutonomousEnabled ? 'Pause daily email' : <><MailCheck className="w-3.5 h-3.5" />Turn on daily email</>}
                    </button>
                  </div>
                </div>
              </section>

              {nextTask && (
                <section className="p-4 sm:p-5 space-y-3" style={{ background: `linear-gradient(160deg, ${accent}1f, transparent 55%), ${C.row}`, border: `1px solid ${C.lineStrong}` }}>
                  <p className="eyebrow m-0" style={{ color: C.crimsonText }}>Up next · Day {nextTask.day}</p>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="serif m-0 text-2xl" style={{ color: C.text }}>{nextTask.title}</h4>
                      <p className="m-0 mt-1 text-sm" style={{ color: C.muted }}>{nextTask.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button type="button" className="btn btn-quiet" onClick={() => setViewDraftTask(nextTask)}><Eye className="w-3.5 h-3.5" />Preview</button>
                      <button type="button" className="btn btn-primary" style={{ background: accent, color: accentInk }} disabled={sendingEmailTaskId === nextTask.id || isSendingTodayEmail} onClick={() => handleSendPostKitEmail?.(nextTask)}>
                        {sendingEmailTaskId === nextTask.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Email it now
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <ol className="list-none m-0 p-0 relative space-y-2.5">
                {tasks.map((task, idx) => {
                  const kind = taskKind(task)
                  const { Icon, label } = KIND_META[kind]
                  const status = task.done ? ['Done', C.ok] : task.emailed ? ['Emailed', C.ok] : task === nextTask ? ['Next', C.crimsonText] : ['Upcoming', C.faint]
                  return (
                    <li key={task.id || idx} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3" style={task.done ? { borderColor: C.okLine } : undefined}>
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="w-11 shrink-0 text-center py-1.5" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                          <span className="block text-[10px] uppercase tracking-wider" style={{ color: C.faint }}>Day</span>
                          <span className="serif block text-xl leading-none" style={{ color: C.text }}>{task.day || idx + 1}</span>
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: C.text }}>{task.title}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] border" style={{ borderColor: C.line, color: C.muted }}><Icon className="w-3 h-3" />{task.channel || label}</span>
                            <span className="text-[11px] font-semibold" style={{ color: status[1] }}>● {status[0]}{task.emailed && task.lastEmailedAt ? ` ${new Date(task.lastEmailedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : ''}</span>
                          </div>
                          <p className="m-0 mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button type="button" className="btn btn-quiet" onClick={() => setViewDraftTask(task)}><Eye className="w-3.5 h-3.5" />Preview</button>
                        <button type="button" className="btn btn-quiet" title="Email this post kit now" disabled={sendingEmailTaskId === task.id} onClick={() => handleSendPostKitEmail?.(task)}>
                          {sendingEmailTaskId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                        <button type="button" className="btn btn-quiet" aria-pressed={!!task.done} title={task.done ? 'Mark as not done' : 'Mark as done'} onClick={() => handleToggleScheduleTask?.(task.id)}
                          style={task.done ? { color: C.ok, borderColor: C.okLine } : undefined}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {/* X & INSTAGRAM POST */}
          {campaignSubTab === 'post' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start p1-rise">
              <div className="xl:col-span-7 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="seg">
                    <button type="button" aria-pressed={postView === 'x'} onClick={() => setPostView('x')}><XLogo className="w-3 h-3" />X</button>
                    <button type="button" aria-pressed={postView === 'ig'} onClick={() => setPostView('ig')}><Instagram className="w-3.5 h-3.5" />Instagram</button>
                  </div>
                  <PublishRow kind="post" text={campaignKit?.announcementPost} />
                </div>
                {renderTemplate('post', campaignKit?.announcementPost)}
              </div>
              <div className="xl:col-span-5 space-y-4">
                <div className="card p-4 space-y-2.5">
                  <div className="flex items-center justify-between"><span className="lbl m-0">Caption</span><CopyBtn text={campaignKit?.announcementPost} id="post" /></div>
                  {editor({ field: "announcementPost", rows: 10, placeholder: "Write the announcement post…" })}
                </div>
                <div className="card p-4 space-y-2.5">
                  <span className="lbl m-0 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Graphic</span>
                  <textarea className="in" rows={2} value={imageDirection} onChange={(e) => setImageDirection(e.target.value)} placeholder="Optional direction, e.g. Show the dashboard on a laptop, bold headline, dark background" />
                  {imageGenError && <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.crimsonText }}><AlertCircle className="w-3.5 h-3.5" />{imageGenError}</p>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-primary" disabled={isGeneratingImage} onClick={() => handleGeneratePostImage?.(imageDirection || null)}>
                      {isGeneratingImage ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Making graphic…</> : <><Sparkles className="w-3.5 h-3.5" />{imageUrl ? 'Remake graphic' : 'Make graphic'}</>}
                    </button>
                    {imageUrl && <button type="button" className="btn btn-quiet" onClick={() => download(imageUrl, `${productSlug}-post.png`)}><Download className="w-3.5 h-3.5" />Download</button>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STORIES */}
          {campaignSubTab === 'story' && (
            <div className="space-y-4 p1-rise">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-sm" style={{ color: C.muted }}>Each frame as it appears on Instagram or TikTok Stories, with stickers where they go.</p>
                <PublishRow kind="story" />
              </div>
              {renderTemplate('story', campaignKit?.storySequence)}
              <div className="card p-4 space-y-2.5">
                <div className="flex items-center justify-between"><span className="lbl m-0">Story frames (start each with STORY 1, STORY 2…)</span><CopyBtn text={campaignKit?.storySequence} id="story" /></div>
                {editor({ field: "storySequence", rows: 10, placeholder: 'STORY 1 — Poll\nText: …\n[STICKER: Poll -> "Yes" / "No"]' })}
              </div>
            </div>
          )}

          {/* VIDEO */}
          {campaignSubTab === 'video' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start p1-rise">
              <div className="lg:col-span-4 space-y-3">
                {renderTemplate('video', campaignKit?.videoScript)}
                {videoUrl && <div className="flex justify-center"><button type="button" className="btn btn-quiet" onClick={() => download(videoUrl, `${productSlug}-video.mp4`)}><Download className="w-3.5 h-3.5" />Download MP4</button></div>}
              </div>
              <div className="lg:col-span-8 space-y-4">
                <section className="card p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}><Film className="w-4 h-4" style={{ color: C.crimsonText }} />Generate the video</span>
                    <span className="text-[11px] px-2 py-0.5 border" style={{ borderColor: C.line, color: C.muted }}>Google Veo 3.1 · Gemini API</span>
                  </div>
                  <textarea className="in" rows={3} value={videoDirection} onChange={(e) => setVideoDirection(e.target.value)}
                    placeholder="Describe the shot, e.g. Close-up of hands using the app on a phone, warm desk light, quick cuts, ends on the logo" />
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="seg" role="group" aria-label="Format">
                      <button type="button" aria-pressed={videoFormat === '9:16'} onClick={() => setVideoFormat('9:16')}><RectangleVertical className="w-3.5 h-3.5" />9:16 Shorts · Reels · TikTok</button>
                      <button type="button" aria-pressed={videoFormat === '16:9'} onClick={() => setVideoFormat('16:9')}><RectangleHorizontal className="w-3.5 h-3.5" />16:9 YouTube</button>
                    </div>
                    <select className="in cursor-pointer" style={{ width: 'auto' }} value={videoLength} onChange={(e) => setVideoLength(Number(e.target.value))} aria-label="Clip length">
                      {[4, 6, 8].map((s) => <option key={s} value={s}>{s} seconds</option>)}
                    </select>
                  </div>
                  {videoGenError && <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.crimsonText }}><AlertCircle className="w-3.5 h-3.5" />{videoGenError}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="m-0 text-xs" style={{ color: C.faint }}>Uses the script below plus your direction. Takes 1–3 minutes.</p>
                    <button type="button" className="btn btn-primary" disabled={isGeneratingVideo}
                      onClick={() => handleGenerateCampaignVideo?.(videoDirection || null, null, { aspectRatio: videoFormat, durationSeconds: videoLength })}>
                      {isGeneratingVideo ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</> : <><Sparkles className="w-3.5 h-3.5" />{videoUrl ? 'Regenerate video' : 'Generate video'}</>}
                    </button>
                  </div>
                </section>
                <PublishRow kind="video" />
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between"><span className="lbl m-0">Script</span><CopyBtn text={campaignKit?.videoScript} id="video" /></div>
                  <ScriptBeats text={campaignKit?.videoScript} accent={accent} />
                  <details className="card">
                    <summary className="px-4 py-3 text-sm cursor-pointer flex items-center gap-2" style={{ color: C.body }}><Pencil className="w-3.5 h-3.5" />Edit script</summary>
                    <div className="px-4 pb-4">{editor({ field: "videoScript", rows: 12, mono: true })}</div>
                  </details>
                </section>
              </div>
            </div>
          )}

          {/* NEWSLETTER */}
          {campaignSubTab === 'newsletter' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start p1-rise">
              <div className="xl:col-span-7">{renderTemplate('newsletter', campaignKit?.newsletterDraft)}</div>
              <div className="xl:col-span-5 card p-4 space-y-2.5">
                <div className="flex items-center justify-between"><span className="lbl m-0">Newsletter (first line: Subject: …)</span><CopyBtn text={campaignKit?.newsletterDraft} id="newsletter" /></div>
                {editor({ field: "newsletterDraft", rows: 16, placeholder: "Subject: …" })}
                {(() => {
                  const t = tasks.find((x) => taskKind(x) === 'newsletter')
                  return t ? (
                    <button type="button" className="btn btn-quiet w-full" disabled={sendingEmailTaskId === t.id} onClick={() => handleSendPostKitEmail?.(t)}>
                      {sendingEmailTaskId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Email this to {creatorName.split(' ')[0]}
                    </button>
                  ) : null
                })()}
              </div>
            </div>
          )}

          {/* DMs */}
          {campaignSubTab === 'dm' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start p1-rise">
              <div className="xl:col-span-6">{renderTemplate('dm', campaignKit?.directMessageScript)}</div>
              <div className="xl:col-span-6 card p-4 space-y-2.5">
                <div className="flex items-center justify-between"><span className="lbl m-0">Message</span><CopyBtn text={campaignKit?.directMessageScript} id="dm" /></div>
                {editor({ field: "directMessageScript", rows: 10, placeholder: "Hey [First Name]…" })}
                <p className="m-0 text-xs" style={{ color: C.faint }}>Send to 5–10 engaged followers. Personalise the first line for each.</p>
              </div>
            </div>
          )}

          {/* LINKS */}
          {campaignSubTab === 'links' && (
            <section className="card p-4 sm:p-5 space-y-3 p1-rise">
              <SectionHead icon={Link2} eyebrow="Attribution" title="Tracking links" />
              <p className="m-0 text-sm" style={{ color: C.muted }}>Each channel has its own link, so you can see which one brings pre-orders.</p>
              <ul className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  ['X post', 'x_post', XLogo], ['Instagram Stories', 'instagram_story', Instagram], ['YouTube / Shorts', 'youtube_video', Youtube],
                  ['TikTok / Reels', 'tiktok_video', Film], ['Newsletter', 'newsletter', Mail], ['DMs', 'dm_outreach', MessageSquare],
                ].map(([label, ref, Icon], i) => (
                  <li key={ref} className="well p-3 flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: C.raised, color: C.body }}><Icon className="w-3.5 h-3.5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>{label}</p>
                      <p className="m-0 text-xs font-mono truncate" style={{ color: C.muted }}>{link(ref)}</p>
                    </div>
                    <CopyBtn text={link(ref)} id={`link-${i}`} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Preview modal */}
          {viewDraftTask && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={() => setViewDraftTask(null)}>
              <div className="s3 w-full max-w-3xl p-5 sm:p-6 space-y-4 my-auto" style={{ background: C.sheet, border: `1px solid ${C.lineStrong}` }} onClick={(e) => e.stopPropagation()}>
                <style>{S3_CSS}</style>
                {(() => {
                  const kind = taskKind(viewDraftTask)
                  const text = getTaskDraftContent?.(viewDraftTask, kind)
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                        <div>
                          <p className="eyebrow m-0">Day {viewDraftTask.day} · {viewDraftTask.channel}</p>
                          <h3 className="serif m-0 mt-0.5 text-2xl" style={{ color: C.text }}>{viewDraftTask.title}</h3>
                        </div>
                        <button type="button" aria-label="Close" className="btn btn-quiet p-2" onClick={() => setViewDraftTask(null)}><X className="w-4 h-4" /></button>
                      </div>
                      <div className="max-h-[62vh] overflow-y-auto">{renderTemplate(kind, text)}</div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                        <div className="flex flex-wrap gap-2">
                          <CopyBtn text={text} id="draft-modal" label="Copy text" />
                          <button type="button" className="btn btn-quiet" disabled={sendingEmailTaskId === viewDraftTask.id} onClick={() => handleSendPostKitEmail?.(viewDraftTask)}>
                            {sendingEmailTaskId === viewDraftTask.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Email to creator
                          </button>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={() => { handleToggleScheduleTask?.(viewDraftTask.id); setViewDraftTask(null) }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />{viewDraftTask.done ? 'Mark not done' : 'Mark done'}
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>,
            document.body
          )}

          {/* Next */}
          <div className="pt-4 flex justify-end" style={{ borderTop: `1px solid ${C.line}` }}>
            <button
              type="button"
              className="btn btn-primary px-5 py-2.5"
              onClick={() => {
                const updated = { campaignApproved: true, phase1Step3Done: true, step3Done: true, campaignKit }
                onUpdateProject?.((prev) => ({ ...(prev || {}), ...updated }))
                if (project?.id) updateCoLaunchProject(project.id, { campaignApproved: true, phase1Step3Done: true, step3Done: true }).catch((e) => console.warn(e))
                showNotification('Campaign approved.')
                setActiveStep('optimize')
                onSelectStep?.('optimize')
              }}
            >
              Next: Run & optimise <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
