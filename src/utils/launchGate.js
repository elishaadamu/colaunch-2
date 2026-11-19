// Phase 2 readiness + launch gate. Every score comes from real project data;
// AI only writes the narrative. Verdict: launch / continue_beta / kill.

const isBuilt = (t) => ['Completed', 'done', 'Done'].includes(t.status) || Boolean(t.aiOutput || t.executedAt)
const pct = (n) => Math.round(Math.max(0, Math.min(1, n)) * 100)
const SEV = { High: 3, Critical: 3, Medium: 2, Low: 1 }

export function computeReadiness({ project = {}, tasks = [], qa = {}, clusters = [], feedback = [], cohort = [] }) {
  const total = tasks.length
  const verified = tasks.filter((t) => t.verified).length
  const built = tasks.filter(isBuilt).length
  const qaTested = (qa?.passed || 0) + (qa?.failed || 0)
  const usage = project?.betaUsage || {}
  const invited = cohort.filter((b) => b.inviteStatus === 'Sent' || b.lastInviteSentAt).length
  const active = Number(usage.testersActive || 0)
  const ratings = feedback.map((f) => Number(f.rating)).filter((n) => n > 0)
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
  const objections = feedback.filter((f) => /objection/i.test(f.category || f.type || '')).length
  const openIssues = clusters.filter((c) => c.status !== 'Resolved')
  const openHigh = openIssues.filter((c) => (SEV[c.severity] || 1) >= 3)
  const weightAll = clusters.reduce((s, c) => s + (SEV[c.severity] || 1) * Math.max(1, Number(c.count || c.userCount || 1)), 0)
  const weightResolved = clusters.filter((c) => c.status === 'Resolved').reduce((s, c) => s + (SEV[c.severity] || 1) * Math.max(1, Number(c.count || c.userCount || 1)), 0)
  const revenue = Number(project?.currentPresales || 0)
  const target = Number(project?.presaleTarget || project?.targetRevenue || 0)

  const pillars = [
    {
      key: 'build', name: 'Build complete', weight: 25,
      score: total ? pct(verified / total) : 0,
      detail: total ? `${verified} of ${total} tasks verified by QA (${built} built)` : 'No engineering tasks yet',
    },
    {
      key: 'quality', name: 'QA', weight: 25,
      score: qaTested ? pct((qa.passed || 0) / qaTested) : 0,
      detail: qaTested ? `${qa.passed} passed · ${qa.failed} failed${qa.unverified ? ` · ${qa.unverified} couldn't run` : ''}` : 'QA has not run',
    },
    {
      key: 'beta', name: 'Beta usage', weight: 15,
      score: invited ? pct(active / Math.max(3, invited * 0.4)) : 0,
      detail: invited ? `${active} active of ${invited} invited · ${usage.opens || 0} sessions · ${feedback.length} reports` : 'No testers invited yet',
    },
    {
      key: 'issues', name: 'Issues resolved', weight: 20,
      score: clusters.length ? pct(weightResolved / Math.max(1, weightAll)) : (feedback.length ? 0 : 0),
      detail: clusters.length ? `${clusters.length - openIssues.length} of ${clusters.length} issues fixed · ${openHigh.length} high-severity open` : feedback.length ? `${feedback.length} reports not grouped yet` : 'No feedback yet',
    },
    {
      key: 'sentiment', name: 'Tester sentiment', weight: 15,
      score: avgRating ? pct((avgRating - 1) / 4) : 0,
      detail: avgRating ? `${avgRating.toFixed(1)} / 5 average · ${objections} objections` : 'No ratings yet',
    },
  ].map((p) => ({ ...p, status: p.score >= 80 ? 'Passed' : p.score >= 50 ? 'Needs work' : 'Failing' }))

  const score = Math.round(pillars.reduce((s, p) => s + p.score * p.weight, 0) / pillars.reduce((s, p) => s + p.weight, 0))
  const blockers = []
  if (total && verified < total) blockers.push(`${total - verified} tasks not verified by QA`)
  if (qa?.failed) blockers.push(`${qa.failed} tasks failing QA`)
  if (openHigh.length) blockers.push(`${openHigh.length} high-severity issues open`)
  if (!project?.staging) blockers.push('No staging build deployed')
  if (!invited) blockers.push('No beta testers invited')

  return {
    score, pillars, blockers,
    summary: `${score}/100. ${blockers.length ? `Blocking: ${blockers.slice(0, 2).join('; ')}.` : 'No blockers found.'}`,
    metrics: { total, verified, built, qa, invited, active, opens: usage.opens || 0, feedback: feedback.length, avgRating, objections, clusters: clusters.length, openIssues: openIssues.length, openHigh: openHigh.length, revenue, target, staging: !!project?.staging },
  }
}

export function evaluateLaunchGate(readiness) {
  const m = readiness.metrics
  const buildRatio = m.total ? m.verified / m.total : 0
  const objectionShare = m.feedback ? m.objections / m.feedback : 0
  const reasons = []
  const actions = []

  const betaRan = m.active >= 5 && m.feedback >= 10
  let verdict
  if (buildRatio >= 0.9 && !(m.qa?.failed) && m.openHigh === 0 && m.staging && m.active >= 3 && (m.avgRating === null || m.avgRating >= 3.5)) {
    verdict = 'launch'
  } else if (betaRan && m.avgRating !== null && m.avgRating < 2.5 && objectionShare >= 0.4) {
    verdict = 'kill'
  } else {
    verdict = 'continue_beta'
  }

  if (verdict === 'launch') {
    reasons.push(`${m.verified} of ${m.total} tasks verified and QA has no failures.`)
    reasons.push(`${m.active} testers used staging; no high-severity issues are open.`)
    if (m.avgRating !== null) reasons.push(`Testers rate it ${m.avgRating.toFixed(1)} / 5.`)
  } else if (verdict === 'kill') {
    reasons.push(`${m.active} testers sent ${m.feedback} reports and rate it ${m.avgRating.toFixed(1)} / 5.`)
    reasons.push(`${Math.round(objectionShare * 100)}% of reports are objections to using or paying for it.`)
    reasons.push('That points to the product, not bugs, so more fixing is unlikely to change the result.')
  } else {
    if (!m.total) reasons.push('There is no build plan or engineering tasks yet.')
    if (m.total && buildRatio < 0.9) reasons.push(`Only ${m.verified} of ${m.total} tasks are verified by QA.`)
    if (m.qa?.failed) reasons.push(`${m.qa.failed} tasks are failing QA.`)
    if (m.openHigh) reasons.push(`${m.openHigh} high-severity issues are still open.`)
    if (!m.staging) reasons.push('No staging build has been deployed, so testers have nothing to try.')
    if (m.active < 3) reasons.push(`Only ${m.active} testers have used the beta (3+ needed to judge).`)
    if (m.avgRating !== null && m.avgRating < 3.5) reasons.push(`Testers rate it ${m.avgRating.toFixed(1)} / 5, below 3.5.`)
    if (!reasons.length) reasons.push('Close, but not every launch check passes yet.')
  }

  if (!m.total) actions.push({ step: 'plan', title: 'Generate and approve the build plan', detail: 'The spec, technical plan and engineering tasks come first. Nothing can be built or tested without them.' })
  if (m.total && m.built < m.total) actions.push({ step: 'build', title: `Build the remaining ${m.total - m.built} tasks`, detail: 'Dispatch AI agents for suitable tasks; assign security, payments and hard bugs to a human engineer.' })
  if (m.built && (m.verified < m.built || m.qa?.failed)) actions.push({ step: 'build', title: 'Run QA and fix failures', detail: `${m.built - m.verified} built tasks aren't verified against their acceptance criteria.`, cta: 'qa' })
  if (!m.staging) actions.push({ step: 'build', title: 'Deploy to staging', detail: 'Testers can only try what is deployed to staging.', cta: 'staging' })
  if (!m.invited) actions.push({ step: 'beta', title: 'Invite pre-order and waitlist customers', detail: 'Send beta invites so real customers can test the build.' })
  else if (m.active < 3) actions.push({ step: 'beta', title: 'Nudge invited testers', detail: `${m.invited} invited, ${m.active} have opened it. Resend to those who haven't.` })
  if (m.feedback && !m.clusters) actions.push({ step: 'beta', title: 'Group the feedback with AI', detail: `${m.feedback} reports are waiting to be grouped into issues.` })
  if (m.openIssues) actions.push({ step: 'gate', title: `Fix ${m.openIssues} open issues`, detail: 'AI prioritises them, builds the fixes it can, retests and ships a new staging version.', cta: 'fix' })

  const confidence = verdict === 'launch' ? (m.active >= 10 ? 'high' : 'medium') : verdict === 'kill' ? 'medium' : (m.active >= 3 ? 'medium' : 'low')
  const headline = { launch: 'Launch', continue_beta: 'Continue beta', kill: 'Kill' }[verdict]
  return { verdict, headline, confidence, reasons, actions }
}
