import React from 'react'
import { Check } from 'lucide-react'
import { C } from './phase1Constants'

export const PHASE1_STEPS = [
  { id: 'plan', label: 'Plan' },
  { id: 'assets', label: 'Assets' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'optimize', label: 'Optimize' },
  { id: 'gate', label: 'Gate' },
]

/**
 * Compact "Phase 1 · Step N of 5" rail shown at the top of every Phase 1 step.
 * `done` is an optional array of step ids that are complete.
 */
export default function StepRail({ current = 'plan', done = [], caption }) {
  const idx = Math.max(0, PHASE1_STEPS.findIndex((s) => s.id === current))
  return (
    <div className="space-y-2.5" aria-label={`Phase 1, step ${idx + 1} of ${PHASE1_STEPS.length}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#ff4d6d' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff4d6d', boxShadow: '0 0 10px rgba(255,77,109,0.9)' }} />
          Phase 1 · Step {idx + 1} of {PHASE1_STEPS.length} · {PHASE1_STEPS[idx].label}
        </span>
        {caption && <span className="text-[11px]" style={{ color: C.faint }}>{caption}</span>}
      </div>
      <ol className="grid grid-cols-5 gap-1.5 list-none m-0 p-0">
        {PHASE1_STEPS.map((s, i) => {
          const isDone = done.includes(s.id) || i < idx
          const isCurrent = i === idx
          return (
            <li key={s.id} className="min-w-0">
              <div
                className="h-1 w-full transition-all duration-500"
                style={{
                  background: isCurrent ? 'linear-gradient(90deg,#c81e3c,#ff4d6d)' : isDone ? 'rgba(255,255,255,0.45)' : '#1c1c20',
                }}
              />
              <span className="mt-1.5 hidden sm:flex items-center gap-1 text-[11px] truncate" style={{ color: isCurrent ? C.text : isDone ? C.body : C.faint, fontWeight: isCurrent ? 700 : 500 }}>
                {isDone && !isCurrent && <Check className="w-3 h-3 shrink-0" aria-hidden="true" />}
                {s.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
