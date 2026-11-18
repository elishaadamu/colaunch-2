// Step 4 "Launch Arena" move engine.
// Every move is a real change to an earlier step (landing page, pricing, campaign schedule,
// survey, plan goal). applyMove returns the new state plus a `before` snapshot so a move can be undone.

const TEXT_FIELDS = ['announcementPost', 'storySequence', 'videoScript', 'newsletterDraft', 'directMessageScript']

export const MOVE_COOLDOWN_HOURS = 12

export const CHANNELS = {
  instagram: { label: 'Instagram Stories', emoji: '📸', draftKey: 'storySequence', match: /insta|\big\b|story/i, ref: 'instagram_story' },
  video: { label: 'Shorts / Reels / TikTok', emoji: '🎬', draftKey: 'videoScript', match: /tiktok|short|reel|youtube|\byt\b/i, ref: 'tiktok_video' },
  x: { label: 'X', emoji: '𝕏', draftKey: 'announcementPost', match: /twitter|x \(|x_post|tweet|^x$/i, ref: 'x_post' },
  newsletter: { label: 'Newsletter', emoji: '💌', draftKey: 'newsletterDraft', match: /newsletter|email|mail/i, ref: 'newsletter' },
  dm: { label: 'DMs', emoji: '💬', draftKey: 'directMessageScript', match: /\bdm\b|direct|outreach/i, ref: 'dm_outreach' },
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

const PRICE_POINT_MONTHLY = { 'Under $5/mo': 4, '$5–10/mo': 8, '$10–20/mo': 15, '$20+/mo': 25, 'Free only': 0 }

export const nicePrice = (x) => Math.max(5, Math.round(Number(x) / 10) * 10 - 1)

/** Suggested founding price from survey price answers and real conversion. */
export function suggestPrice({ founding, visitors, backers, pricePoints = {} }) {
  const entries = Object.entries(pricePoints).filter(([k]) => PRICE_POINT_MONTHLY[k] > 0)
  const total = entries.reduce((s, [, n]) => s + n, 0)
  if (total >= 3) {
    const sorted = entries.map(([k, n]) => [PRICE_POINT_MONTHLY[k], n]).sort((a, b) => a[0] - b[0])
    let acc = 0
    let median = sorted[0][0]
    for (const [m, n] of sorted) { acc += n; if (acc >= total / 2) { median = m; break } }
    return { price: nicePrice(median * 12 * 0.5), reason: `${total} survey answers put fair monthly value around $${median}. Founding = 6 months of that.` }
  }
  const conv = visitors > 0 ? backers / visitors : 0
  if (visitors >= 20 && conv < 0.01) return { price: nicePrice(founding * 0.8), reason: `${visitors} visitors, ${backers} pre-orders. A lower entry price removes friction.` }
  if (visitors >= 20 && conv > 0.05) return { price: nicePrice(founding * 1.15), reason: `${(conv * 100).toFixed(1)}% conversion is strong. There's room to charge more.` }
  return { price: nicePrice(founding * 0.9), reason: 'Not enough data yet. A small drop is the safest test.' }
}

const replacePrice = (text, from, to) => {
  if (!text || !from || from === to) return text
  return String(text).replace(new RegExp(`\\$${from}(?![\\d.])`, 'g'), `$${to}`)
}

/**
 * Apply a move. ctx = { kit, plan, surveyData, foundingPrice, depositPrice }.
 * Returns { kit, plan, surveyData, before, affects, summary } (only changed parts are non-null).
 */
export function applyMove(move, ctx) {
  const kit = { ...(ctx.kit || {}) }
  const p = move.payload || {}
  const out = { kit: null, plan: null, surveyData: null, before: {}, affects: [], summary: '' }

  if (move.type === 'headline') {
    const lp = kit.landingPageCopy || {}
    out.before.landingPageCopy = lp
    kit.landingPageCopy = { ...lp, headline: p.headline, ...(p.cta ? { ctaText: p.cta } : {}), updatedByMove: move.id }
    out.kit = kit
    out.affects = ['Step 2 · Landing page', 'Live pre-order page']
    out.summary = `Headline is now "${p.headline}"`
  }

  if (move.type === 'price') {
    const fromF = Number(ctx.foundingPrice)
    const fromD = Number(ctx.depositPrice)
    const toF = Number(p.founding)
    const toD = Number(p.deposit)
    out.before.pricingConfig = kit.pricingConfig || null
    out.before.texts = Object.fromEntries(TEXT_FIELDS.map((f) => [f, kit[f]]))
    out.before.planPricing = ctx.plan?.pricing ?? null
    kit.pricingConfig = { ...(kit.pricingConfig || {}), foundingPrice: toF, depositPrice: toD, updatedByMove: move.id }
    TEXT_FIELDS.forEach((f) => { kit[f] = replacePrice(replacePrice(kit[f], fromF, toF), fromD, toD) })
    out.kit = kit
    out.plan = { ...(ctx.plan || {}), pricing: `$${toF} founding pass · $${toD} refundable deposit` }
    out.affects = ['Step 1 · Plan pricing', 'Step 2 · Checkout', 'Step 3 · All drafts', 'Live pre-order page']
    out.summary = `Founding $${fromF} → $${toF}, deposit $${fromD} → $${toD}`
  }

  if (move.type === 'double_down') {
    const ch = CHANNELS[p.channelKey] || CHANNELS.x
    const schedule = Array.isArray(kit.postingSchedule) ? [...kit.postingSchedule] : []
    out.before.postingSchedule = kit.postingSchedule || []
    out.before.promptNotes = kit.promptNotes || []
    const task = {
      id: `bonus-${Date.now()}`,
      title: p.title || `Bonus ${ch.label} post`,
      channel: ch.label,
      draftKey: ch.draftKey,
      effort: '~10 mins',
      description: p.description || `Extra ${ch.label} push: it's the channel bringing the most visitors.`,
      done: false,
      fromMove: move.id,
    }
    const nextIdx = schedule.findIndex((t) => !t.done && !t.emailed)
    schedule.splice(nextIdx === -1 ? schedule.length : nextIdx, 0, task)
    kit.postingSchedule = schedule.map((t, i) => ({ ...t, day: i + 1 }))
    const note = `Prioritise ${ch.label}: it converts best so far.`
    kit.promptNotes = [...(kit.promptNotes || []).filter((n) => n !== note), note]
    out.kit = kit
    out.affects = ['Step 3 · Schedule', 'Next daily email', 'Step 3 · AI brief']
    out.summary = `Added "${task.title}" as the next post`
  }

  if (move.type === 'urgency') {
    const lp = kit.landingPageCopy || {}
    out.before.landingPageCopy = lp
    const deadline = p.deadline || new Date(Date.now() + 7 * 864e5).toISOString()
    const text = p.text || `Only ${p.spotsLeft} founding spots left · offer ends ${new Date(deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
    kit.landingPageCopy = { ...lp, urgency: { text, spotsLeft: p.spotsLeft, deadline }, updatedByMove: move.id }
    out.kit = kit
    out.affects = ['Live pre-order page', 'Step 2 · Landing page']
    out.summary = text
  }

  if (move.type === 'survey_question') {
    const sd = { ...(ctx.surveyData || {}) }
    const qs = Array.isArray(sd.questions) ? sd.questions : []
    out.before.questions = qs
    sd.questions = [...qs, { id: `q-${Date.now()}`, category: p.category || 'Objection', question: p.question, responseCount: 0, fromMove: move.id }]
    out.surveyData = sd
    out.affects = ['Step 2 · Survey', 'Public survey page']
    out.summary = `New survey question: "${p.question}"`
  }

  if (move.type === 'target') {
    const plan = { ...(ctx.plan || {}) }
    out.before.threshold = plan.threshold ?? null
    out.before.targetRevenue = plan.targetRevenue ?? null
    const amount = Math.round(Number(p.amount))
    plan.threshold = plan.threshold && /\$[\d,]+/.test(plan.threshold)
      ? plan.threshold.replace(/\$[\d,]+/, `$${amount.toLocaleString()}`)
      : `$${amount.toLocaleString()} in pre-orders`
    plan.targetRevenue = amount
    out.plan = plan
    out.affects = ['Step 1 · Validation goal', 'Step 5 · Gate']
    out.summary = `Goal set to $${amount.toLocaleString()}`
  }

  return out
}

/** Restore what a move changed. */
export function undoMove(entry, ctx) {
  const b = entry.before || {}
  const kit = { ...(ctx.kit || {}) }
  const out = { kit: null, plan: null, surveyData: null }
  if (entry.type === 'headline' || entry.type === 'urgency') {
    kit.landingPageCopy = b.landingPageCopy || {}
    out.kit = kit
  }
  if (entry.type === 'price') {
    kit.pricingConfig = b.pricingConfig || kit.pricingConfig
    Object.entries(b.texts || {}).forEach(([f, v]) => { kit[f] = v })
    out.kit = kit
    out.plan = { ...(ctx.plan || {}), pricing: b.planPricing ?? ctx.plan?.pricing }
  }
  if (entry.type === 'double_down') {
    kit.postingSchedule = (kit.postingSchedule || []).filter((t) => t.fromMove !== entry.id).map((t, i) => ({ ...t, day: i + 1 }))
    kit.promptNotes = b.promptNotes || []
    out.kit = kit
  }
  if (entry.type === 'survey_question') {
    out.surveyData = { ...(ctx.surveyData || {}), questions: (ctx.surveyData?.questions || []).filter((q) => q.fromMove !== entry.id) }
  }
  if (entry.type === 'target') {
    out.plan = { ...(ctx.plan || {}), threshold: b.threshold, targetRevenue: b.targetRevenue }
  }
  return out
}

/** XP is earned only from real progress. */
export function computeXp({ visitors, signups, surveyCount, supporters, backers, postsDone, movesPlayed }) {
  const parts = [
    ['👀 Visitors', visitors, 2], ['✍️ Sign-ups', signups, 5], ['🗣️ Survey answers', surveyCount, 10],
    ['🤝 Supporters', supporters, 15], ['💳 Pre-orders', backers, 100], ['📣 Posts published', postsDone, 20], ['🃏 Moves played', movesPlayed, 25],
  ].map(([label, n, per]) => ({ label, n: Number(n) || 0, per, xp: (Number(n) || 0) * per }))
  return { total: parts.reduce((s, x) => s + x.xp, 0), parts }
}

export const RANKS = [
  { min: 0, emoji: '🥚', name: 'Rookie' },
  { min: 100, emoji: '🐣', name: 'Scout' },
  { min: 300, emoji: '🔥', name: 'Hustler' },
  { min: 700, emoji: '🚀', name: 'Rainmaker' },
  { min: 1500, emoji: '💎', name: 'Closer' },
  { min: 3000, emoji: '👑', name: 'Legend' },
]

export function rankFor(xp) {
  let idx = 0
  RANKS.forEach((r, i) => { if (xp >= r.min) idx = i })
  const cur = RANKS[idx]
  const next = RANKS[idx + 1] || null
  const progress = next ? (xp - cur.min) / (next.min - cur.min) : 1
  return { ...cur, level: idx + 1, next, progress: Math.max(0, Math.min(1, progress)) }
}

export function grade(ratio) {
  if (ratio >= 1) return ['S', '#34d399']
  if (ratio >= 0.75) return ['A', '#34d399']
  if (ratio >= 0.5) return ['B', '#fbbf24']
  if (ratio >= 0.25) return ['C', '#f59e0b']
  return ['D', '#ff8fa3']
}
