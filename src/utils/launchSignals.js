// Phase 3 · AI Launch Manager signals. Each one is computed from real launch metrics and
// becomes either a creator task (content) or an engineering task. Nothing fires without data.

export const CHANNEL_LABEL = {
  instagram: 'Instagram', video: 'Shorts / Reels / TikTok', x: 'X', newsletter: 'Newsletter', dm: 'DMs', direct: 'Direct',
}
export const CHANNEL_DRAFT = {
  instagram: 'storySequence', video: 'videoScript', x: 'announcementPost', newsletter: 'newsletterDraft', dm: 'directMessageScript',
}

const pct = (n) => `${Number(n).toFixed(1)}%`
const today = () => new Date().toISOString().slice(0, 10)

export function detectSignals(metrics, { liveAt } = {}) {
  if (!metrics) return []
  const out = []
  const t = metrics.totals || {}
  const p = metrics.periods || {}
  const h = metrics.health || {}
  const day = today()

  // 1. One channel converts far better than the rest → more content there tonight
  const qualified = (metrics.channels || []).filter((c) => c.channel !== 'direct' && c.visitors >= 20 && c.conversion !== null)
  if (qualified.length >= 2) {
    const sorted = [...qualified].sort((a, b) => b.conversion - a.conversion)
    const best = sorted[0]
    const rest = sorted.slice(1)
    const restAvg = rest.reduce((s, c) => s + c.conversion, 0) / rest.length
    if (best.conversion >= 2 && best.conversion >= restAvg * 2) {
      out.push({
        key: `channel-${best.channel}-${day}`, kind: 'creator', severity: 'high', channel: best.channel,
        title: `Post another ${CHANNEL_LABEL[best.channel]} piece tonight`,
        evidence: sorted.slice(0, 3).map((c) => `${CHANNEL_LABEL[c.channel]}: ${pct(c.conversion)} paid conversion`).join(' · '),
        why: `${CHANNEL_LABEL[best.channel]} converts ${(best.conversion / Math.max(0.1, restAvg)).toFixed(1)}× better than the other channels.`,
      })
    }
  }

  // 2. Checkout conversion dropped → possible technical issue
  const l = p.last24h || {}
  const pr = p.prev72h || {}
  if (l.checkoutOpens >= 8 && pr.checkoutOpens >= 8) {
    const now = l.customers / l.checkoutOpens
    const before = pr.customers / pr.checkoutOpens
    if (before > 0 && now < before * 0.75) {
      const drop = Math.round((1 - now / before) * 100)
      out.push({
        key: `checkout-drop-${day}`, kind: 'engineering', severity: 'high',
        title: `Checkout conversion dropped ${drop}%`,
        evidence: `Last 24h: ${l.customers} paid of ${l.checkoutOpens} checkouts (${pct(now * 100)}) · before: ${pct(before * 100)}${h.checkoutErrors ? ` · ${h.checkoutErrors} checkout errors logged` : ''}`,
        why: 'Potential technical issue in checkout. Check payment errors, the success redirect and mobile checkout.',
      })
    }
  }

  // 3. Browser error spike
  const prevDaily = (pr.errors || 0) / 3
  if ((l.errors || 0) >= 5 && l.errors >= Math.max(5, prevDaily * 3)) {
    out.push({
      key: `errors-${day}`, kind: 'engineering', severity: 'high',
      title: `Error spike: ${l.errors} errors in 24h`,
      evidence: `${l.errors} errors in the last 24h vs ~${Math.round(prevDaily)} a day before${(h.topErrors || []).length ? ` · e.g. "${h.topErrors[0]}"` : ''}`,
      why: 'Something in the product is breaking for real users.',
    })
  }

  // 4. Production downtime
  if (h.uptime !== null && h.uptime !== undefined && h.checks >= 12 && h.uptime < 99) {
    out.push({
      key: `uptime-${day}`, kind: 'engineering', severity: 'high',
      title: `Production uptime is ${h.uptime}%`,
      evidence: `${h.checks} checks this week · avg response ${h.avgLatencyMs ?? '—'}ms · last check ${h.lastCheck?.ok ? 'up' : `down (${h.lastCheck?.status || 'no response'})`}`,
      why: 'Customers hit an unavailable product.',
    })
  }

  // 5. Customers aren't activating
  if ((t.withAccess || 0) >= 5 && t.activationRate !== null && t.activationRate < 40) {
    out.push({
      key: `activation-${day}`, kind: 'engineering', severity: 'medium',
      title: `Only ${t.activationRate}% of customers activated`,
      evidence: `${t.activated} of ${t.withAccess} customers used the product · ${t.opened ?? '—'} opened it`,
      why: 'Onboarding is losing people between payment and first use.',
    })
  }

  // 6. Traffic is falling week on week
  const w = p.last7d || {}
  const pw = p.prev7d || {}
  if (pw.visitors >= 50 && w.visitors < pw.visitors * 0.5) {
    const top = (metrics.channels || []).find((c) => c.channel !== 'direct') || { channel: 'instagram' }
    out.push({
      key: `traffic-drop-${day}`, kind: 'creator', severity: 'medium', channel: top.channel,
      title: `Traffic fell ${Math.round((1 - w.visitors / pw.visitors) * 100)}% this week`,
      evidence: `${w.visitors} visitors this week vs ${pw.visitors} last week`,
      why: `A fresh ${CHANNEL_LABEL[top.channel]} post brings the audience back.`,
    })
  }

  // 7. Launched but almost nobody has seen it
  if (liveAt && Date.now() - new Date(liveAt).getTime() > 864e5 && (t.visitors || 0) < 10) {
    out.push({
      key: `announce-${day}`, kind: 'creator', severity: 'high', channel: 'instagram',
      title: 'Announce the launch',
      evidence: `${t.visitors || 0} visitors since going live`,
      why: "The audience doesn't know it's live yet.",
    })
  }
  return out
}

/** Launch report decision: scale / iterate / maintain / kill. */
export function evaluateLaunchDecision(metrics, { target = 0 } = {}) {
  const t = metrics?.totals || {}
  const p = metrics?.periods || {}
  const h = metrics?.health || {}
  const daysLive = metrics?.liveAt ? Math.floor((Date.now() - new Date(metrics.liveAt).getTime()) / 864e5) : 0
  const w = p.last7d || {}
  const pw = p.prev7d || {}
  const conv = t.conversion ?? 0
  const growth = pw.revenue > 0 ? (w.revenue - pw.revenue) / pw.revenue : (w.revenue > 0 ? 1 : 0)
  const techOk = (h.uptime === null || h.uptime === undefined || h.uptime >= 99) && (h.checkoutSuccess === null || h.checkoutSuccess === undefined || h.checkoutSuccess >= 50)
  const activationOk = t.activationRate === null || t.activationRate === undefined || t.activationRate >= 40
  const reasons = []
  const actions = []
  let verdict

  if (!metrics?.liveAt) {
    verdict = 'maintain'
    reasons.push('The product is not live yet, so there are no launch results to judge.')
    actions.push({ step: 'prep', title: 'Go live', detail: 'Finish the readiness checks and launch.' })
  } else if (daysLive < 3 || (t.visitors || 0) < 50) {
    verdict = 'maintain'
    reasons.push(`Too early to judge: ${daysLive} days live, ${t.visitors || 0} visitors (50+ and 3+ days needed).`)
    reasons.push('Keep the launch running unchanged and let the AI Launch Manager act on signals.')
  } else if (growth >= 0.1 && conv >= 2 && t.customers >= 5 && activationOk && techOk) {
    verdict = 'scale'
    reasons.push(`Revenue grew ${Math.round(growth * 100)}% week on week (${'$' + Math.round(w.revenue)} vs ${'$' + Math.round(pw.revenue)}).`)
    reasons.push(`${conv}% of visitors pay, above the 2% benchmark, and ${t.activationRate ?? '—'}% of customers activate.`)
    if (h.uptime) reasons.push(`Production is healthy (${h.uptime}% uptime).`)
  } else if (daysLive >= 14 && (t.visitors || 0) >= 300 && (t.customers < 3 || conv < 0.3) && growth <= 0) {
    verdict = 'kill'
    reasons.push(`${daysLive} days live, ${t.visitors} visitors and only ${t.customers} customers (${conv}% conversion).`)
    reasons.push('Revenue is flat or falling, so more promotion is unlikely to change the outcome.')
  } else if (Math.abs(growth) <= 0.15 && conv >= 1 && techOk) {
    verdict = 'maintain'
    reasons.push(`Revenue is steady (${growth >= 0 ? '+' : ''}${Math.round(growth * 100)}% week on week) at ${conv}% conversion.`)
    reasons.push('The product works and sells; no channel is growing fast enough to justify scaling spend.')
  } else {
    verdict = 'iterate'
    if (conv < 2) reasons.push(`Conversion is ${conv}%, below the 2% benchmark.`)
    if (!activationOk) reasons.push(`Only ${t.activationRate}% of customers activate.`)
    if (!techOk) reasons.push(`Technical health needs work (uptime ${h.uptime ?? '—'}%, checkout success ${h.checkoutSuccess ?? '—'}%).`)
    if (growth < -0.15) reasons.push(`Revenue fell ${Math.round(-growth * 100)}% week on week.`)
    if (!reasons.length) reasons.push('Results are mixed; fix the weakest part of the funnel before scaling.')
  }

  if (metrics?.liveAt) {
    if (conv < 2 && (t.visitors || 0) >= 50) actions.push({ step: 'monitor', title: 'Improve conversion', detail: 'Test a new headline or price on the live page; use the best-converting channel more.' })
    if (!activationOk) actions.push({ step: 'manager', title: 'Fix onboarding', detail: 'The Launch Manager creates an engineering task for the first-use flow.' })
    if (!techOk) actions.push({ step: 'manager', title: 'Fix technical issues', detail: 'Checkout or uptime problems are hurting sales.' })
    if ((t.visitors || 0) < 50) actions.push({ step: 'manager', title: 'Drive traffic', detail: 'Have the creator post on the channel that converts best.' })
  }
  if (target && (t.revenue || 0) < target && verdict === 'scale') actions.push({ step: 'monitor', title: 'Set the next revenue goal', detail: `Current revenue $${Math.round(t.revenue)} vs goal $${target}.` })

  const confidence = verdict === 'maintain' && reasons[0]?.startsWith('Too early') ? 'low' : daysLive >= 14 ? 'high' : 'medium'
  return { verdict, headline: { scale: 'Scale', iterate: 'Iterate', maintain: 'Maintain', kill: 'Kill' }[verdict], confidence, reasons, actions, daysLive }
}
