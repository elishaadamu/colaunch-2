// Phase 1 gate decision engine.
// Turns the real validation evidence into a verdict (build / iterate / kill / keep running),
// explains why, and lists corrective actions that point at the step that fixes each problem.

const pct = (n) => `${(n * 100).toFixed(1)}%`
const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`

export const BENCHMARKS = {
  conversion: 0.02, // 2% visitor → pre-order is a healthy creator pre-sale
  minVisitorsToJudge: 100, // below this, conversion is noise
  killVisitors: 300, // enough traffic to call a failure
  yesRatioGood: 0.4,
  yesRatioBad: 0.15,
}

function parsePeriodDays(period) {
  const m = String(period || '').match(/(\d+)\s*(day|week)/i)
  if (!m) return 14
  return Number(m[1]) * (m[2].toLowerCase().startsWith('week') ? 7 : 1)
}

export function campaignClock(schedule = [], period) {
  const sent = schedule.map((t) => t.firstEmailedAt || t.lastEmailedAt).filter(Boolean).map((d) => new Date(d).getTime()).filter(Number.isFinite)
  const totalDays = parsePeriodDays(period)
  if (!sent.length) return { started: false, daysElapsed: 0, totalDays, daysLeft: totalDays }
  const start = Math.min(...sent)
  const daysElapsed = Math.max(0, Math.floor((Date.now() - start) / 864e5))
  return { started: true, startedAt: new Date(start).toISOString(), daysElapsed, totalDays, daysLeft: Math.max(0, totalDays - daysElapsed) }
}

/**
 * evidence: { revenue, target, backers, visitors, signups, foundingPrice, surveyResponses[], schedule[], period, followers }
 */
export function evaluateGate(e) {
  const revenue = Number(e.revenue) || 0
  const target = Math.max(1, Number(e.target) || 0)
  const backers = Number(e.backers) || 0
  const visitors = Number(e.visitors) || 0
  const conv = visitors > 0 ? backers / visitors : 0
  const progress = revenue / target
  const responses = Array.isArray(e.surveyResponses) ? e.surveyResponses : []
  const decided = responses.filter((r) => r?.support?.decision)
  const yes = decided.filter((r) => r.support.decision === 'yes').length
  const yesRatio = decided.length ? yes / decided.length : null
  const ratings = responses.map((r) => Number(r.rating)).filter((n) => n > 0)
  const avgExcitement = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
  const schedule = Array.isArray(e.schedule) ? e.schedule : []
  const postsOut = schedule.filter((t) => t.emailed || t.done).length
  const postsTotal = schedule.length
  const clock = campaignClock(schedule, e.period)
  const followers = Number(e.followers) || 0
  const price = Math.max(1, Number(e.foundingPrice) || 1)
  const backersNeeded = Math.ceil(target / price)
  const realisticBackers = followers > 0 ? Math.round(followers * 0.0025) : null // ~0.25% of an audience pre-orders

  // Enough evidence = real traffic, or the whole campaign went out and still reached some people.
  // An expired clock alone doesn't count: if the posts never went out, the test never ran.
  const evidenceEnough = visitors >= BENCHMARKS.minVisitorsToJudge || (postsTotal > 0 && postsOut >= postsTotal && visitors >= 30)
  const surveyMeaningful = decided.length >= 5
  const reasons = []
  const actions = []

  // Signals (each is shown to the user as a check line)
  const signals = [
    { key: 'revenue', label: 'Pre-sale revenue', value: `${money(revenue)} of ${money(target)}`, status: progress >= 1 ? 'pass' : progress >= 0.5 ? 'warn' : 'fail' },
    { key: 'conversion', label: 'Visitor → pre-order', value: visitors ? pct(conv) : 'No visitors', status: !visitors ? 'unknown' : conv >= BENCHMARKS.conversion ? 'pass' : conv >= BENCHMARKS.conversion / 2 ? 'warn' : 'fail', note: `benchmark ${pct(BENCHMARKS.conversion)}` },
    { key: 'traffic', label: 'Traffic', value: `${visitors.toLocaleString()} visitors`, status: visitors >= BENCHMARKS.minVisitorsToJudge ? 'pass' : visitors > 0 ? 'warn' : 'fail', note: `${BENCHMARKS.minVisitorsToJudge}+ needed to judge` },
    { key: 'campaign', label: 'Campaign delivered', value: postsTotal ? `${postsOut} of ${postsTotal} posts` : 'Not generated', status: !postsTotal ? 'fail' : postsOut >= postsTotal ? 'pass' : postsOut > 0 ? 'warn' : 'fail' },
    { key: 'demand', label: 'Survey: would support', value: yesRatio === null ? 'No answers' : `${yes} of ${decided.length} (${Math.round(yesRatio * 100)}%)`, status: yesRatio === null ? 'unknown' : yesRatio >= BENCHMARKS.yesRatioGood ? 'pass' : yesRatio >= BENCHMARKS.yesRatioBad ? 'warn' : 'fail' },
    { key: 'clock', label: 'Sprint clock', value: clock.started ? `Day ${clock.daysElapsed} of ${clock.totalDays}` : 'Not started', status: !clock.started ? 'unknown' : clock.daysLeft > 0 ? 'warn' : 'pass' },
  ]

  // ── Verdict ──────────────────────────────────────────────────────────────────────────
  let verdict
  if (progress >= 1 || (progress >= 0.7 && conv >= BENCHMARKS.conversion && backers >= 10)) {
    verdict = 'build'
  } else if (!evidenceEnough) {
    verdict = 'keep_running'
  } else if (
    progress < 0.1 && conv < BENCHMARKS.conversion / 4 &&
    (!surveyMeaningful || yesRatio < BENCHMARKS.yesRatioBad) &&
    visitors >= BENCHMARKS.killVisitors
  ) {
    verdict = 'kill'
  } else {
    verdict = 'iterate'
  }

  // ── Reasons ──────────────────────────────────────────────────────────────────────────
  if (verdict === 'build') {
    reasons.push(`${money(revenue)} collected from ${backers} paying ${backers === 1 ? 'backer' : 'backers'}: ${Math.round(progress * 100)}% of the goal.`)
    if (visitors) reasons.push(`${pct(conv)} of visitors pre-ordered${conv >= BENCHMARKS.conversion ? ', above the 2% benchmark' : ''}.`)
    if (yesRatio !== null) reasons.push(`${Math.round(yesRatio * 100)}% of survey respondents said they'd support it.`)
  }
  if (verdict === 'keep_running') {
    reasons.push(`Too little evidence to judge: ${visitors} visitors (need ${BENCHMARKS.minVisitorsToJudge}+) and ${postsOut} of ${postsTotal || 0} posts out.`)
    if (clock.started && clock.daysLeft === 0 && postsOut < postsTotal) reasons.push(`The ${clock.totalDays}-day window has passed, but most of the campaign never went out, so the test hasn't really run yet.`)
    reasons.push(`A ${pct(conv)} conversion on ${visitors} visitors says nothing yet. Building or killing now would be a guess.`)
  }
  if (verdict === 'iterate') {
    reasons.push(`Revenue is at ${Math.round(progress * 100)}% of the goal with ${visitors} visitors, so the demand test ran but didn't pass.`)
    if (conv > 0) reasons.push(`Conversion is ${pct(conv)}${conv < BENCHMARKS.conversion ? `, below the ${pct(BENCHMARKS.conversion)} benchmark` : ''}.`)
    if (surveyMeaningful && yesRatio >= BENCHMARKS.yesRatioBad) reasons.push(`But ${Math.round(yesRatio * 100)}% of survey respondents said yes, so interest exists. The offer or page is the problem, not the idea.`)
  }
  if (verdict === 'kill') {
    reasons.push(`${visitors} people saw the offer and ${backers} paid (${pct(conv)}), far below the ${pct(BENCHMARKS.conversion)} benchmark.`)
    reasons.push(!surveyMeaningful ? 'No meaningful survey signal suggests hidden demand.' : `Only ${Math.round(yesRatio * 100)}% of survey respondents would support it.`)
    reasons.push('The full campaign has run, so more of the same is unlikely to change the result.')
  }

  // ── Corrective actions (point at the step that fixes it) ─────────────────────────────
  if (!postsTotal) actions.push({ step: 'campaign', title: 'Generate the creator campaign', detail: 'There is no campaign yet, so no one has been sent to the page.' })
  else if (postsOut < postsTotal) actions.push({ step: 'campaign', title: `Send the remaining ${postsTotal - postsOut} posts`, detail: 'Turn on the daily email in Step 3 so the creator gets each post kit automatically.' })
  if (visitors < BENCHMARKS.minVisitorsToJudge) actions.push({ step: 'campaign', title: 'Drive more traffic', detail: `${BENCHMARKS.minVisitorsToJudge - visitors} more visitors are needed before conversion means anything. Add a post on the channel that sends the most visitors.` })
  if (visitors >= 30 && conv < BENCHMARKS.conversion) actions.push({ step: 'optimize', title: 'Fix conversion on the page', detail: `People arrive but don't buy (${pct(conv)}). Run the AI analysis in Step 4 and apply the headline or pricing experiment.` })
  if (surveyMeaningful && yesRatio >= BENCHMARKS.yesRatioGood && conv < BENCHMARKS.conversion && visitors >= 30) actions.push({ step: 'assets', title: 'Lower the barrier to buy', detail: `${Math.round(yesRatio * 100)}% said they'd support it but few paid. Try a smaller deposit in Step 2.` })
  if (!responses.length) actions.push({ step: 'assets', title: 'Collect audience feedback', detail: 'No survey answers yet. Share the survey link from Step 2 to learn why people do or don’t buy.' })
  if (realisticBackers !== null && backersNeeded > realisticBackers * 2 && verdict !== 'build') {
    const realisticTarget = Math.max(price, realisticBackers * price)
    actions.push({ step: 'plan', title: 'Re-check the goal', detail: `The goal needs ${backersNeeded} pre-orders; about ${realisticBackers} is typical for ${followers.toLocaleString()} followers. A goal near ${money(realisticTarget)} is realistic.`, targetSuggestion: realisticTarget })
  }

  const confidence = verdict === 'keep_running'
    ? 'low'
    : (visitors >= BENCHMARKS.killVisitors && postsTotal && postsOut >= postsTotal) || progress >= 1 ? 'high' : 'medium'

  const headline = {
    build: 'Build the MVP',
    iterate: 'Fix and test again',
    kill: 'Stop this venture',
    keep_running: 'Keep the test running',
  }[verdict]

  return { verdict, headline, confidence, reasons, actions, signals, metrics: { revenue, target, progress, backers, visitors, conv, yesRatio, avgExcitement, postsOut, postsTotal, clock, backersNeeded, realisticBackers } }
}
