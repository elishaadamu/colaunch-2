// Channel attribution helpers for Step 4 (visits and pre-orders per channel from ?ref= tags).

export const CHANNELS = {
  instagram: { label: 'Instagram Stories', emoji: '📸', draftKey: 'storySequence', match: /insta|\big\b|story/i, ref: 'instagram_story' },
  video: { label: 'Shorts / Reels / TikTok', emoji: '🎬', draftKey: 'videoScript', match: /tiktok|short|reel|youtube|\byt\b/i, ref: 'tiktok_video' },
  x: { label: 'X', emoji: '𝕏', draftKey: 'announcementPost', match: /twitter|x \(|x_post|x post|tweet|^x$/i, ref: 'x_post' },
  newsletter: { label: 'Newsletter', emoji: '💌', draftKey: 'newsletterDraft', match: /newsletter|email|mail/i, ref: 'newsletter' },
  dm: { label: 'DMs', emoji: '💬', draftKey: 'directMessageScript', match: /\bdm\b|direct message|outreach/i, ref: 'dm_outreach' },
}

export function channelKeyOf(text = '') {
  const s = String(text || '')
  return Object.keys(CHANNELS).find((k) => CHANNELS[k].match.test(s)) || null
}

/** Visits and pre-orders per channel, from real tracked visitors and reservations. */
export function channelStats(project = {}, reservations = []) {
  const stats = Object.fromEntries(Object.keys(CHANNELS).map((k) => [k, { key: k, ...CHANNELS[k], visits: 0, backers: 0 }]))
  ;(Array.isArray(project?.uniqueVisitors) ? project.uniqueVisitors : []).forEach((v) => {
    const k = channelKeyOf(v.channel || v.ref)
    if (k) stats[k].visits += 1
  })
  const attr = project?.telemetry?.channelAttribution || {}
  Object.entries(attr).forEach(([name, n]) => {
    const k = channelKeyOf(name)
    if (k) stats[k].visits = Math.max(stats[k].visits, Number(n) || 0)
  })
  ;(reservations || []).forEach((r) => {
    const k = channelKeyOf(r.channel || r.ref || r.source)
    if (k) stats[k].backers += 1
  })
  return Object.values(stats).sort((a, b) => (b.backers - a.backers) || (b.visits - a.visits))
}
