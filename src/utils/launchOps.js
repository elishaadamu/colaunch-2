// Phase 3 helpers: evidence for the AI, and turning plans/signals into real tasks
// (creator posts go into the Step 3 daily email schedule; engineering tasks go into Phase 2).
import { channelStats } from './launchMoves'
import { CHANNEL_DRAFT, CHANNEL_LABEL } from './launchSignals'

export function buildLaunchEvidence(project = {}, { config = {}, publicUrl = '', slug = '' } = {}) {
  const reservations = Array.isArray(project.reservations) ? project.reservations : []
  const survey = Array.isArray(project.surveyResponses) ? project.surveyResponses : []
  const feedback = Array.isArray(project.betaFeedback) ? project.betaFeedback : []
  const answers = survey.flatMap((r) => Object.values(r.answers || {})).filter((a) => String(a || '').trim().length > 15)
  return {
    slug,
    publicUrl,
    launchPrice: config.price || null,
    validation: {
      preOrders: reservations.length,
      preSaleRevenue: Number(project.currentPresales || 0),
      goal: Number(project.presaleTarget || project.targetRevenue || 0),
      visitors: Number(project.visitors || 0),
    },
    channels: channelStats(project, reservations).filter((c) => c.visits || c.backers).map((c) => ({ channel: c.key, visits: c.visits, preOrders: c.backers })),
    winningExperiments: (project.experimentsData?.experiments || project.experiments || []).filter((e) => e.status === 'applied').map((e) => ({ type: e.category, change: e.variant })),
    customerQuotes: answers.slice(0, 8),
    objections: [
      ...feedback.filter((f) => /objection/i.test(f.category || f.type || '')).map((f) => f.message),
      ...survey.filter((r) => r?.support?.decision === 'no').flatMap((r) => Object.values(r.answers || {})).slice(0, 3),
    ].filter(Boolean).slice(0, 8),
    supportQuestions: feedback.filter((f) => /support/i.test(f.category || f.type || '')).map((f) => f.message).slice(0, 6),
    beta: {
      version: project.staging?.version || project.mvpVersion || null,
      readinessScore: project.readinessReport?.score ?? null,
      issues: (project.feedbackClusters || []).map((c) => ({ issue: c.title, people: c.count, status: c.status })).slice(0, 8),
      testers: project.betaUsage?.testersActive || 0,
    },
    creatorChannels: project.campaignKit?.socialLinks || {},
  }
}

/** Insert creator posts as the next items of the Step 3 schedule (delivered by the daily email). */
export function addCreatorTasks(campaignKit = {}, items = [], tag = {}) {
  const schedule = Array.isArray(campaignKit.postingSchedule) ? [...campaignKit.postingSchedule] : []
  const nextIdx = schedule.findIndex((t) => !t.done && !t.emailed)
  const insertAt = nextIdx === -1 ? schedule.length : nextIdx
  const created = items.map((it, i) => ({
    id: `${tag.prefix || 'launch'}-${Date.now()}-${i}`,
    title: it.title,
    channel: CHANNEL_LABEL[it.channel] || it.channel || 'Social',
    draftKey: it.draftKey || CHANNEL_DRAFT[it.channel] || 'announcementPost',
    content: it.content,
    effort: '~10 mins',
    description: it.description || it.why || '',
    done: false,
    ...tag.fields,
  }))
  schedule.splice(insertAt, 0, ...created)
  return { kit: { ...campaignKit, postingSchedule: schedule.map((t, i) => ({ ...t, day: i + 1 })) }, created }
}
