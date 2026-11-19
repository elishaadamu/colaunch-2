import React from 'react'
import {
  Heart, MessageCircle, Repeat2, Share, Bookmark, Send, MoreHorizontal, BadgeCheck, Play,
  Music2, BarChart3, Link2, Instagram, Youtube, Mail, Star, Inbox, Paperclip, Image as ImageIcon,
} from 'lucide-react'
import { XLogo } from '../PostVisualMockup'

// Shared, platform-faithful previews for Step 3 content (X, Instagram feed & stories, Shorts/Reels,
// newsletter, DMs). Everything derives from the real draft text so what you see is what gets posted.

const URL_RE = /(https?:\/\/[^\s)]+)/g

export function Linkified({ text, color = '#1d9bf0' }) {
  const parts = String(text || '').split(URL_RE)
  return parts.map((p, i) =>
    /^https?:\/\//.test(p)
      ? <span key={i} style={{ color, wordBreak: 'break-all' }}>{p.replace(/^https?:\/\//, '')}</span>
      : <React.Fragment key={i}>{p}</React.Fragment>
  )
}

export function parseStories(text = '') {
  const chunks = String(text).split(/^\s*(STORY\s*\d+[^\n]*)$/im)
  const frames = []
  for (let i = 1; i < chunks.length; i += 2) {
    const title = chunks[i].replace(/^STORY\s*\d+\s*[—:-]*\s*/i, '').trim()
    const body = chunks[i + 1] || ''
    const visual = (body.match(/Visual:\s*(.+)/i) || [])[1] || ''
    const textLine = (body.match(/Text:\s*"?([^\n"]+)"?/i) || [])[1] || body.replace(/Visual:.*|\[STICKER:[^\]]*\]/gi, '').trim()
    const poll = body.match(/Poll[^"]*"([^"]+)"\s*\/\s*"([^"]+)"/i)
    const link = body.match(/Link[^"]*"([^"]+)"/i)
    frames.push({ title, visual, text: textLine.trim(), poll: poll ? [poll[1], poll[2]] : null, link: link ? link[1] : null })
  }
  if (!frames.length && text.trim()) frames.push({ title: 'Story', text: text.trim().slice(0, 220), visual: '', poll: null, link: null })
  return frames
}

export function parseBeats(text = '') {
  const chunks = String(text).split(/^\s*((?:HOOK|PROBLEM|SOLUTION|DEMO|CTA)[^\n]*)$/im)
  const beats = []
  for (let i = 1; i < chunks.length; i += 2) {
    const head = chunks[i]
    const time = (head.match(/\(([^)]*\d:\d\d[^)]*)\)/) || [])[1] || ''
    const label = head.replace(/\(.*?\)/g, '').replace(/[:&].*$/, '').trim()
    const body = (chunks[i + 1] || '').trim()
    const direction = (body.match(/^\(([^)]+)\)/) || [])[1] || ''
    const line = body.replace(/^\([^)]+\)\s*/, '').replace(/^"|"$/g, '').trim()
    beats.push({ label, time, direction, line })
  }
  return beats
}

export function parseNewsletter(text = '') {
  const m = String(text).match(/^\s*subject\s*:\s*(.+)$/im)
  const subject = m ? m[1].trim() : ''
  const body = m ? String(text).replace(m[0], '').trim() : String(text).trim()
  return { subject, body }
}

function Avatar({ src, name, size = 40, ring }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return src ? (
    <img src={src} alt="" className="shrink-0 object-cover" style={{ width: size, height: size, borderRadius: 9999, boxShadow: ring ? `0 0 0 2px #000, 0 0 0 4px ${ring}` : undefined }} />
  ) : (
    <span className="shrink-0 flex items-center justify-center font-bold text-white" style={{ width: size, height: size, borderRadius: 9999, background: '#3f3f46', fontSize: size * 0.4, boxShadow: ring ? `0 0 0 2px #000, 0 0 0 4px ${ring}` : undefined }}>
      {initial}
    </span>
  )
}

function BrandArt({ productName, tagline, accent, ratio = '1 / 1' }) {
  return (
    <div className="relative w-full overflow-hidden flex flex-col justify-end p-5" style={{ aspectRatio: ratio, background: `radial-gradient(120% 90% at 85% 0%, ${accent}66, transparent 60%), linear-gradient(160deg, #18181b, #050506)` }}>
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <span className="relative text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>Founding access</span>
      <span className="relative mt-1 text-2xl sm:text-3xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1.05 }}>{productName}</span>
      {tagline && <span className="relative mt-1 text-xs text-zinc-300 line-clamp-2">{tagline}</span>}
    </div>
  )
}

/* ─── X post ─────────────────────────────────────────────────────────────────────────── */
export function XPostTemplate({ name, handle, avatar, text, imageUrl, productName, tagline, accent }) {
  return (
    <article className="w-full max-w-[560px] mx-auto bg-black text-[15px] leading-[1.45] text-[#e7e9ea]" style={{ border: '1px solid #2f3336', fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div className="flex gap-3 p-4">
        <Avatar src={avatar} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold truncate">{name}</span>
            <BadgeCheck className="w-[18px] h-[18px] shrink-0" style={{ color: '#1d9bf0' }} />
            <span className="truncate text-[#71767b]">@{handle} · 1m</span>
            <MoreHorizontal className="w-4 h-4 ml-auto shrink-0 text-[#71767b]" />
          </div>
          <p className="m-0 mt-0.5 whitespace-pre-wrap break-words"><Linkified text={text} /></p>
          <div className="mt-3 overflow-hidden" style={{ border: '1px solid #2f3336', borderRadius: 16 }}>
            {imageUrl ? <img src={imageUrl} alt="" className="block w-full object-cover" style={{ aspectRatio: '16 / 9' }} /> : <BrandArt productName={productName} tagline={tagline} accent={accent} ratio="16 / 9" />}
          </div>
          <div className="mt-3 flex items-center justify-between max-w-[420px] text-[13px] text-[#71767b]">
            {[MessageCircle, Repeat2, Heart, BarChart3].map((Icon, i) => (
              <span key={i} className="flex items-center gap-1.5"><Icon className="w-[18px] h-[18px]" /></span>
            ))}
            <span className="flex items-center gap-3"><Bookmark className="w-[18px] h-[18px]" /><Share className="w-[18px] h-[18px]" /></span>
          </div>
        </div>
      </div>
    </article>
  )
}

/* ─── Instagram feed post ────────────────────────────────────────────────────────────── */
export function InstagramPostTemplate({ handle, avatar, name, text, imageUrl, productName, tagline, accent }) {
  const caption = String(text || '').replace(URL_RE, '').replace(/\n{3,}/g, '\n\n').trim()
  return (
    <article className="w-full max-w-[420px] mx-auto bg-black text-white text-[14px]" style={{ border: '1px solid #262626', fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar src={avatar} name={name} size={32} ring="#d62976" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="m-0 font-semibold truncate">{handle}</p>
          <p className="m-0 text-[11px] text-zinc-400 truncate">{productName}</p>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </header>
      {imageUrl ? <img src={imageUrl} alt="" className="block w-full object-cover" style={{ aspectRatio: '4 / 5' }} /> : <BrandArt productName={productName} tagline={tagline} accent={accent} ratio="4 / 5" />}
      <div className="px-3 pt-2.5 pb-3 space-y-1.5">
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6" /><MessageCircle className="w-6 h-6" /><Send className="w-6 h-6" />
          <Bookmark className="w-6 h-6 ml-auto" />
        </div>
        <p className="m-0 whitespace-pre-wrap break-words line-clamp-6"><span className="font-semibold">{handle}</span> {caption}</p>
        <p className="m-0 text-[12px] text-zinc-400">Link in bio</p>
      </div>
    </article>
  )
}

/* ─── Instagram / TikTok story frames ────────────────────────────────────────────────── */
export function StoryFramesTemplate({ text, handle, avatar, name, accent, imageUrl, link }) {
  const frames = parseStories(text)
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
      {frames.map((f, i) => (
        <div key={i} className="relative shrink-0 snap-start overflow-hidden text-white flex flex-col" style={{ width: 220, aspectRatio: '9 / 16', borderRadius: 18, background: i === 1 && imageUrl ? `center/cover url(${imageUrl})` : `radial-gradient(120% 80% at 80% 0%, ${accent}55, transparent 60%), linear-gradient(170deg, #1c1c20, #050506)`, border: '1px solid #27272a' }}>
          <div className="absolute inset-0" style={{ background: i === 1 && imageUrl ? 'linear-gradient(180deg, rgba(0,0,0,.55), transparent 30%, transparent 55%, rgba(0,0,0,.75))' : 'none' }} />
          <div className="relative flex gap-1 px-2.5 pt-2.5">
            {frames.map((_, j) => <span key={j} className="h-[3px] flex-1" style={{ background: j <= i ? '#fff' : 'rgba(255,255,255,.35)' }} />)}
          </div>
          <div className="relative flex items-center gap-2 px-2.5 pt-2">
            <Avatar src={avatar} name={name} size={24} />
            <span className="text-[12px] font-semibold truncate">{handle}</span>
            <span className="text-[11px] text-zinc-300">{i + 1}h</span>
          </div>
          <div className="relative flex-1 flex flex-col justify-center px-4 gap-3">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>{f.title || `Story ${i + 1}`}</p>
            <p className="m-0 text-[17px] leading-snug font-semibold" style={{ textShadow: '0 1px 8px rgba(0,0,0,.5)' }}>{f.text}</p>
            {f.poll && (
              <div className="bg-white text-black p-2 space-y-1.5 shadow-lg" style={{ borderRadius: 12 }}>
                {f.poll.map((opt) => <div key={opt} className="text-center text-[12px] font-bold py-1.5" style={{ background: '#f4f4f5', borderRadius: 8 }}>{opt}</div>)}
              </div>
            )}
            {f.link && (
              <span className="self-center inline-flex items-center gap-1.5 bg-white text-[12px] font-bold px-3 py-1.5 shadow-lg" style={{ borderRadius: 8, color: '#2563eb' }}>
                <Link2 className="w-3.5 h-3.5" />{f.link.replace(/[↗]/g, '').trim()}
              </span>
            )}
          </div>
          {f.visual && <p className="relative m-0 px-3 pb-3 text-[10px] text-zinc-400 line-clamp-2">Visual: {f.visual}</p>}
        </div>
      ))}
    </div>
  )
}

/* ─── Shorts / Reels / TikTok video ──────────────────────────────────────────────────── */
export function ShortVideoTemplate({ videoUrl, posterUrl, handle, avatar, name, caption, accent, productName, tagline }) {
  return (
    <div className="relative mx-auto overflow-hidden bg-black text-white" style={{ width: 260, aspectRatio: '9 / 16', borderRadius: 26, border: '6px solid #18181b', boxShadow: '0 30px 60px -30px rgba(0,0,0,.8)' }}>
      {videoUrl ? (
        <video src={videoUrl} poster={posterUrl || undefined} controls playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0">
          {posterUrl ? <img src={posterUrl} alt="" className="w-full h-full object-cover" /> : <BrandArt productName={productName} tagline={tagline} accent={accent} ratio="9 / 16" />}
          <span className="absolute inset-0 m-auto w-14 h-14 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.55)', borderRadius: 9999 }}><Play className="w-6 h-6 ml-0.5" /></span>
        </div>
      )}
      <div className="pointer-events-none absolute right-2 bottom-24 flex flex-col items-center gap-4 text-[11px]">
        {[Heart, MessageCircle, Share].map((Icon, i) => (
          <span key={i} className="flex flex-col items-center gap-1"><Icon className="w-6 h-6" /></span>
        ))}
      </div>
      <div className="pointer-events-none absolute left-0 right-12 bottom-0 p-3 space-y-1.5" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.8))' }}>
        <div className="flex items-center gap-2"><Avatar src={avatar} name={name} size={26} /><span className="text-[13px] font-semibold truncate">@{handle}</span></div>
        <p className="m-0 text-[12px] leading-snug line-clamp-2">{caption}</p>
        <p className="m-0 flex items-center gap-1 text-[11px] text-zinc-300"><Music2 className="w-3 h-3" />Original audio · {name}</p>
      </div>
    </div>
  )
}

export function ScriptBeats({ text, accent }) {
  const beats = parseBeats(text)
  if (!beats.length) return <p className="m-0 text-sm whitespace-pre-wrap text-zinc-300">{text}</p>
  return (
    <ol className="list-none m-0 p-0 space-y-2">
      {beats.map((b, i) => (
        <li key={i} className="p-3.5" style={{ background: '#0c0c0e', border: '1px solid rgba(255,255,255,.08)', borderLeft: `3px solid ${accent}` }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>{b.label}</span>
            {b.time && <span className="text-[11px] font-mono text-zinc-500">{b.time}</span>}
          </div>
          <p className="m-0 mt-1.5 text-[15px] leading-relaxed text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{b.line}</p>
          {b.direction && <p className="m-0 mt-1 text-xs text-zinc-500">{b.direction}</p>}
        </li>
      ))}
    </ol>
  )
}

/* ─── Newsletter ─────────────────────────────────────────────────────────────────────── */
export function NewsletterTemplate({ text, name, avatar, productName, accent, link, imageUrl }) {
  const { subject, body } = parseNewsletter(text)
  const ink = isLight(accent) ? '#0a0c10' : '#ffffff'
  return (
    <div className="w-full max-w-[620px] mx-auto overflow-hidden" style={{ border: '1px solid #27272a', background: '#0c0c0e' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-400" style={{ borderBottom: '1px solid #27272a', background: '#111114' }}>
        <Inbox className="w-3.5 h-3.5" /> Primary
        <span className="ml-auto flex items-center gap-1"><Star className="w-3.5 h-3.5" /><Paperclip className="w-3.5 h-3.5" /></span>
      </div>
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #27272a' }}>
        <p className="m-0 text-lg text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{subject || `A note about ${productName}`}</p>
        <div className="mt-2 flex items-center gap-2.5">
          <Avatar src={avatar} name={name} size={32} />
          <div className="min-w-0 text-xs leading-tight">
            <p className="m-0 font-semibold text-zinc-200 truncate">{name}</p>
            <p className="m-0 text-zinc-500 truncate">to subscribers · 8:00 AM</p>
          </div>
        </div>
      </div>
      <div className="bg-white px-5 sm:px-8 py-6 text-[15px] leading-[1.7] text-zinc-800" style={{ fontFamily: 'Georgia, serif' }}>
        {imageUrl && <img src={imageUrl} alt="" className="block w-full mb-5" />}
        <p className="m-0 whitespace-pre-wrap break-words"><Linkified text={body} color={accent} /></p>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="inline-block mt-5 px-5 py-3 text-sm font-bold no-underline" style={{ background: accent, color: ink, fontFamily: 'Roboto, sans-serif' }}>
            Claim founding access
          </a>
        )}
      </div>
    </div>
  )
}

/* ─── DM ─────────────────────────────────────────────────────────────────────────────── */
export function DmTemplate({ text, name, avatar, handle }) {
  const paras = String(text || '').split(/\n{2,}/).filter(Boolean)
  return (
    <div className="w-full max-w-[420px] mx-auto bg-black text-white" style={{ border: '1px solid #262626', fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif' }}>
      <header className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid #262626' }}>
        <span className="w-8 h-8 flex items-center justify-center bg-zinc-800 text-xs font-bold" style={{ borderRadius: 9999 }}>F</span>
        <div className="leading-tight"><p className="m-0 text-sm font-semibold">Follower</p><p className="m-0 text-[11px] text-zinc-500">Active now</p></div>
        <Instagram className="w-4 h-4 ml-auto text-zinc-500" />
      </header>
      <div className="p-4 space-y-2 min-h-[260px] flex flex-col justify-end">
        <div className="self-start max-w-[80%] px-3.5 py-2 text-[14px] bg-zinc-800" style={{ borderRadius: 18 }}>Loved your last video 🙌</div>
        {paras.map((p, i) => (
          <div key={i} className="self-end max-w-[85%] px-3.5 py-2 text-[14px] whitespace-pre-wrap break-words" style={{ borderRadius: 18, background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
            <Linkified text={p} color="#fde68a" />
          </div>
        ))}
        <div className="flex items-center gap-1.5 self-end text-[11px] text-zinc-500"><Avatar src={avatar} name={name} size={14} />Seen as @{handle}</div>
      </div>
    </div>
  )
}

export function isLight(hex = '#c81e3c') {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#c81e3c'
  const n = parseInt(h.slice(1), 16)
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 160
}

export const PLATFORM_ICONS = { x: XLogo, instagram: Instagram, youtube: Youtube, newsletter: Mail, image: ImageIcon }
