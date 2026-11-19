// Real per-project numbers. Nothing here invents a value: when the data isn't there, the
// answer is 0 / null and the UI says "not set" instead of showing a made-up figure.
import { suggestThreshold, parseFollowerCount, derivePresalePrice } from '../components/launch/conceptSchema'

const moneyIn = (str) => {
  const m = String(str || '').replace(/,/g, '').match(/\$(\d+)/)
  return m ? Number(m[1]) : 0
}

/** Pre-sale goal: plan threshold → saved target → frozen seed → followers × price → 0 (not set). */
export function presaleGoalFor(project = {}) {
  const fromPlan = moneyIn(project?.validationPlan?.threshold || project?.threshold)
  if (fromPlan > 0) return fromPlan
  const stored = Number(project?.presaleTarget || project?.targetRevenue || 0)
  if (stored > 0) return stored
  const seeded = Number(project?.validationSeed?.suggestedThreshold?.target || 0)
  if (seeded > 0) return seeded
  const followers = parseFollowerCount(project?.followers) ?? parseFollowerCount(project?.creatorProfile?.followers) ?? parseFollowerCount(project?.subscriberCount)
  const price = derivePresalePrice((project?.selectedConcept || {}).pricing || project?.pricing)
  return suggestThreshold({ followers, price })?.target || 0
}

/** Goal computed for a concept + creator before a project exists. */
export function conceptGoalFor(concept = {}, creator = {}, seed = null) {
  if (Number(seed?.suggestedThreshold?.target) > 0) return Number(seed.suggestedThreshold.target)
  if (Number(concept?.presaleTarget) > 0) return Number(concept.presaleTarget)
  const followers = parseFollowerCount(creator?.followers) ?? parseFollowerCount(creator?.followerCount) ?? parseFollowerCount(creator?.follower_count)
  return suggestThreshold({ followers, price: derivePresalePrice(concept?.pricing) })?.target || 0
}

export const formatGoal = (n) => (Number(n) > 0 ? `$${Math.round(Number(n)).toLocaleString()}` : 'Goal not set')
