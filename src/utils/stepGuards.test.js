import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getPhase1StepGuards } from './stepGuards.js'

describe('getPhase1StepGuards', () => {
  it('case 1: new project with AI-generated campaign kit but no approval has Step 3 not done, status in_progress, and Step 4 locked', () => {
    const project = {
      currentPhase: 1,
      planLocked: true,
      assetsApproved: true,
      campaignKit: {
        postingSchedule: [{ day: 1, time: '10:00 AM' }],
        announcementPost: 'Announcing our new software tool!',
        videoScript: 'Hook: Stop struggling with manual processes...',
      },
      campaignApproved: false,
      phase1Step3Done: false,
    }

    const guards = getPhase1StepGuards(project)

    assert.equal(guards.isStep1Done, true, 'Step 1 should be done')
    assert.equal(guards.isStep2Done, true, 'Step 2 should be done')
    assert.equal(guards.isStep3Done, false, 'Step 3 must NOT be marked done without human approval')
    assert.equal(guards.step3Status, 'in_progress', 'Step 3 status should be in_progress when kit exists')
    assert.equal(guards.hasKitContent, true, 'hasKitContent should be true')
    assert.equal(guards.canAccessStep4, false, 'Step 4 must be locked when Step 3 is not done')
  })

  it('case 2: after clicking Approve in Step 3, Step 3 is marked done and Step 4 unlocks', () => {
    const projectApproved = {
      currentPhase: 1,
      planLocked: true,
      assetsApproved: true,
      campaignKit: {
        announcementPost: 'Announcing our new software tool!',
      },
      campaignApproved: true,
      phase1Step3Done: true,
    }

    const guards = getPhase1StepGuards(projectApproved)

    assert.equal(guards.isStep3Done, true, 'Step 3 should be done after approval')
    assert.equal(guards.step3Status, 'done', 'Step 3 status should be done')
    assert.equal(guards.canAccessStep4, true, 'Step 4 must unlock once Step 3 is approved')
  })

  it('case 3: a project with currentPhase 2 still shows all Phase 1 steps done', () => {
    const projectPhase2 = {
      currentPhase: 2,
    }

    const guards = getPhase1StepGuards(projectPhase2)

    assert.equal(guards.isStep1Done, true, 'Step 1 should be done in Phase 2')
    assert.equal(guards.isStep2Done, true, 'Step 2 should be done in Phase 2')
    assert.equal(guards.isStep3Done, true, 'Step 3 should be done in Phase 2')
    assert.equal(guards.isStep4Done, true, 'Step 4 should be done in Phase 2')
    assert.equal(guards.isStep5Done, true, 'Step 5 should be done in Phase 2')
    assert.equal(guards.step3Status, 'done', 'Step 3 status should be done in Phase 2')
    assert.equal(guards.canAccessStep4, true, 'Step 4 should be accessible')
  })

  it('case 4: new project with no kit generated has Step 3 as not_started and Step 4 locked', () => {
    const freshProject = {
      currentPhase: 1,
      planLocked: true,
      assetsApproved: true,
    }

    const guards = getPhase1StepGuards(freshProject)

    assert.equal(guards.isStep3Done, false, 'Step 3 should not be done')
    assert.equal(guards.step3Status, 'not_started', 'Step 3 status should be not_started')
    assert.equal(guards.hasKitContent, false, 'hasKitContent should be false')
    assert.equal(guards.canAccessStep4, false, 'Step 4 must be locked')
  })
})
