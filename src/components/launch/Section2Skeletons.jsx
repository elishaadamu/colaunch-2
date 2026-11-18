import React from 'react'
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton, SkeletonCard } from '../common/Skeleton'
import { Layers, Sparkles, Rocket, RefreshCw, Megaphone, TrendingUp, Flag, Layout, FileText, Code, CheckCircle2, Loader2 } from 'lucide-react'

/**
 * 1. Project OS Section 2 Full Overview Skeleton — Light Mode Command Center
 */
export function ProjectOSSkeleton() {
  const C = {
    bg: '#08090c',
    sheet: '#10131a',
    row: '#0c0e13',
    raised: '#171b24',
    line: 'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.16)',
    crimson: '#c81e3c',
    crimsonSoft: 'rgba(200,30,60,0.14)',
    crimsonLine: 'rgba(200,30,60,0.38)',
    okSoft: 'rgba(111,207,155,0.12)',
    okLine: 'rgba(111,207,155,0.35)',
    skySoft: 'rgba(56,189,248,0.12)',
    skyLine: 'rgba(56,189,248,0.35)',
    violetSoft: 'rgba(167,139,250,0.12)',
    violetLine: 'rgba(167,139,250,0.35)',
    amberSoft: 'rgba(240,180,106,0.12)',
    amberLine: 'rgba(240,180,106,0.35)',
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden animate-fade-in" style={{ color: '#f3f4f6' }}>
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-28 h-5 rounded-full animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
            <span className="text-xs" style={{ color: '#6c7280' }}>•</span>
            <span className="w-28 h-5 rounded-full animate-pulse" style={{ background: C.row, border: `1px solid ${C.line}` }} />
          </div>
          <div className="w-64 sm:w-80 h-7 rounded-xl animate-pulse" style={{ background: C.raised }} />
          <div className="flex items-center gap-2 pt-0.5">
            <div className="w-36 h-3 rounded-full animate-pulse" style={{ background: C.raised }} />
            <span style={{ color: '#6c7280' }}>•</span>
            <div className="w-56 h-3 rounded-full animate-pulse" style={{ background: C.row }} />
          </div>
        </div>

        {/* Right Buttons Placeholder */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-36 h-8 rounded-xl animate-pulse" style={{ background: C.raised, border: `1px solid ${C.line}` }} />
          <div className="w-32 h-8 rounded-xl animate-pulse" style={{ background: C.raised, border: `1px solid ${C.line}` }} />
          <div className="w-28 h-8 rounded-xl animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
        </div>
      </div>

      {/* Expanded Command Center Skeleton (Matching ProjectOS Command Center) */}
      <div className="w-full space-y-4">
        <div
          className="rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch w-full relative overflow-hidden"
          style={{ background: C.sheet, border: `1px solid ${C.line}` }}
        >
          {/* Left Mini Sidebar Skeleton */}
          <div
            className="w-full md:w-56 lg:w-60 p-3 sm:p-3.5 flex flex-row md:flex-col justify-between items-center md:items-stretch gap-2 shrink-0 md:self-start md:min-h-[580px] rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl border-b md:border-b-0 md:border-r"
            style={{ background: C.row, borderColor: C.line }}
          >
            <div className="flex md:flex-col items-center md:items-stretch gap-1 overflow-x-auto scrollbar-none shrink-0 w-full pt-0.5">
              <div className="hidden md:block px-2 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6c7280' }}>
                Command Center
              </div>

              {[
                { label: 'Overview', active: true },
                { label: 'Tasks' },
                { label: 'Metrics' },
                { label: 'Files' },
                { label: 'Messages' },
                { label: 'Decisions' },
              ].map((tab, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold w-full shrink-0"
                  style={
                    tab.active
                      ? { background: C.raised, border: `1px solid ${C.crimsonLine}`, borderLeft: `3px solid ${C.crimson}` }
                      : { border: '1px solid transparent' }
                  }
                >
                  <div
                    className="w-3.5 h-3.5 rounded shrink-0 animate-pulse"
                    style={{ background: tab.active ? C.crimsonSoft : C.raised }}
                  />
                  <span
                    className={`h-3 rounded-full animate-pulse ${tab.active ? 'w-20' : 'w-16'}`}
                    style={{ background: tab.active ? 'rgba(255,255,255,0.18)' : C.raised }}
                  />
                </div>
              ))}
            </div>

            {/* Bottom Active Phase Box */}
            <div className="md:mt-auto md:pt-4 shrink-0 w-full">
              <div
                className="p-2 sm:p-3 rounded-2xl text-center flex md:flex-col items-center gap-2"
                style={{ background: C.sheet, border: `1px solid ${C.line}` }}
              >
                <span className="hidden md:block w-20 h-2.5 rounded animate-pulse mx-auto" style={{ background: C.raised }} />
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl animate-pulse" style={{ background: C.raised, border: `1px solid ${C.line}` }} />
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl animate-pulse" style={{ background: C.raised, border: `1px solid ${C.line}` }} />
                </div>
                <span className="hidden md:block w-24 h-2 rounded animate-pulse mx-auto" style={{ background: C.raised }} />
              </div>
            </div>
          </div>

          {/* Right Main Command Center Inner Area Skeleton */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-4 rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl overflow-x-hidden" style={{ background: C.sheet }}>
            {/* Header inside Command Center */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-48 sm:w-60 h-6 sm:h-7 rounded-xl animate-pulse" style={{ background: C.raised }} />
                  <span style={{ color: '#6c7280' }}>×</span>
                  <div className="w-36 sm:w-44 h-6 sm:h-7 rounded-xl animate-pulse" style={{ background: C.row }} />
                </div>

                {/* Unified metadata row */}
                <div className="flex items-center gap-2 flex-wrap max-w-full pt-0.5">
                  <div className="w-44 h-6 rounded-lg animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
                  <div className="w-52 h-6 rounded-lg animate-pulse" style={{ background: C.violetSoft, border: `1px solid ${C.violetLine}` }} />
                  <div className="w-36 h-6 rounded-lg animate-pulse" style={{ background: C.skySoft, border: `1px solid ${C.skyLine}` }} />
                </div>

                <div className="w-full sm:w-3/4 h-3.5 rounded-full animate-pulse pt-0.5" style={{ background: C.row }} />
              </div>

              {/* Action buttons on right of Command Center Header */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:pt-0.5 flex-wrap">
                <div className="w-32 h-8 rounded-xl animate-pulse" style={{ background: C.okSoft, border: `1px solid ${C.okLine}` }} />
                <div className="w-28 h-8 rounded-xl animate-pulse" style={{ background: C.violetSoft, border: `1px solid ${C.violetLine}` }} />
                <div className="w-40 h-8 rounded-xl animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
              </div>
            </div>

            {/* Overview Hero Blueprint Card Skeleton */}
            <div
              className="relative rounded-2xl p-4 sm:p-5 lg:p-6 space-y-4 overflow-hidden"
              style={{ background: C.row, border: `1px solid ${C.crimsonLine}` }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${C.crimson}, #a78bfa, #38bdf8)` }} />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl animate-pulse shrink-0" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-44 h-4 rounded animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
                      <div className="w-24 h-4 rounded-full animate-pulse" style={{ background: C.raised, border: `1px solid ${C.line}` }} />
                      <div className="w-36 h-4 rounded-full animate-pulse" style={{ background: C.okSoft, border: `1px solid ${C.okLine}` }} />
                    </div>
                    <div className="w-48 h-6 rounded-lg animate-pulse mt-1" style={{ background: C.raised }} />
                  </div>
                </div>
                <div className="w-36 h-8 rounded-xl animate-pulse shrink-0" style={{ background: C.okSoft, border: `1px solid ${C.okLine}` }} />
              </div>

              {/* Blueprint Columns: Left Details + Right Simulated Architecture Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-7 space-y-3">
                  <div className="w-full h-3.5 rounded-full animate-pulse" style={{ background: C.raised }} />
                  <div className="w-4/5 h-3 rounded-full animate-pulse" style={{ background: C.sheet }} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-4 rounded-xl space-y-2" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                      <div className="w-24 h-3.5 rounded animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
                      <div className="w-full h-2.5 rounded animate-pulse" style={{ background: C.raised }} />
                      <div className="w-4/5 h-2.5 rounded animate-pulse" style={{ background: C.raised }} />
                    </div>
                    <div className="p-4 rounded-xl space-y-2" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                      <div className="w-24 h-3.5 rounded animate-pulse" style={{ background: C.skySoft, border: `1px solid ${C.skyLine}` }} />
                      <div className="w-full h-2.5 rounded animate-pulse" style={{ background: C.raised }} />
                      <div className="w-3/4 h-2.5 rounded animate-pulse" style={{ background: C.raised }} />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-md" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                  <div className="px-3.5 py-2.5 flex items-center justify-between" style={{ background: C.raised, borderBottom: `1px solid ${C.line}` }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(200,30,60,0.65)' }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(240,180,106,0.65)' }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(111,207,155,0.65)' }} />
                      <div className="w-32 h-2.5 rounded ml-2 animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    </div>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6fcf9b' }} />
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div className="w-full h-3 rounded animate-pulse" style={{ background: C.raised }} />
                    <div className="w-4/5 h-3 rounded animate-pulse" style={{ background: C.raised }} />
                    <div className="w-3/5 h-3 rounded animate-pulse" style={{ background: C.raised }} />
                    <div className="w-1/2 h-8 rounded-xl mt-3 animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Top 4 KPI Metric Cards Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[C.okLine, C.skyLine, C.violetLine, C.amberLine].map((accentLine, i) => (
                <div key={i} className="p-4 rounded-xl space-y-2" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                  <div className="w-20 h-2.5 rounded animate-pulse" style={{ background: C.raised }} />
                  <div className="w-24 h-6 rounded-lg animate-pulse" style={{ background: accentLine }} />
                  <div className="w-28 h-2 rounded animate-pulse" style={{ background: C.raised }} />
                  <div className="w-full h-1.5 rounded-full animate-pulse mt-1" style={{ background: C.raised }} />
                </div>
              ))}
            </div>

            {/* Bottom 2 Columns: Tasks & AI Activity Stream */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 sm:p-5 rounded-xl space-y-3" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                <div className="flex items-center justify-between pb-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <div className="w-36 h-3.5 rounded animate-pulse" style={{ background: C.raised }} />
                  <div className="w-12 h-3.5 rounded animate-pulse" style={{ background: C.skySoft }} />
                </div>
                <div className="space-y-2.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between py-1" style={{ borderBottom: i < 3 ? `1px solid ${C.line}` : 'none' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ background: C.raised }} />
                        <div className="w-44 h-3 rounded animate-pulse" style={{ background: C.raised }} />
                      </div>
                      <div className="w-12 h-2.5 rounded animate-pulse" style={{ background: C.sheet }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-xl space-y-3" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                <div className="flex items-center justify-between pb-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <div className="w-32 h-3.5 rounded animate-pulse" style={{ background: C.raised }} />
                  <div className="w-20 h-4 rounded-full animate-pulse" style={{ background: C.violetSoft, border: `1px solid ${C.violetLine}` }} />
                </div>
                <div className="space-y-2.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <span className="w-2 h-2 rounded-full mt-1 shrink-0 animate-pulse" style={{ background: '#a78bfa' }} />
                      <div className="space-y-1 w-full">
                        <div className="w-3/4 h-3 rounded animate-pulse" style={{ background: C.raised }} />
                        <div className="w-1/2 h-2 rounded animate-pulse" style={{ background: C.sheet }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 2. Phase 1 Validation View Skeleton — Light Mode
 */
export function Phase1ValidateSkeleton() {
  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden animate-fade-in text-[#FAFAFA]">
      {/* 5-Step Progress Nav Skeleton */}
      <div className="p-2 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-2 min-w-max">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-24 h-7 rounded-xl bg-[#18181C] border border-[#2a2a30] animate-pulse" />
          ))}
        </div>
        <div className="w-32 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-pulse shrink-0" />
      </div>

      {/* Main Spec Card Skeleton */}
      <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#2a2a30]/80 pb-4">
          <div className="space-y-1.5">
            <div className="w-48 h-4 rounded-full bg-[#222227] animate-pulse" />
            <div className="w-72 h-3 rounded-full bg-[#18181C] animate-pulse" />
          </div>
          <div className="w-28 h-8 rounded-xl bg-[#18181C] border border-[#2a2a30] animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2">
            <div className="w-24 h-4 rounded bg-[#222227] animate-pulse" />
            <div className="w-full h-3 rounded bg-[#18181C] animate-pulse" />
            <div className="w-3/4 h-3 rounded bg-[#18181C] animate-pulse" />
          </div>
          <div className="p-4 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2">
            <div className="w-24 h-4 rounded bg-[#222227] animate-pulse" />
            <div className="w-full h-3 rounded bg-[#18181C] animate-pulse" />
            <div className="w-3/4 h-3 rounded bg-[#18181C] animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2">
              <div className="w-20 h-3 rounded-full bg-[#222227] animate-pulse" />
              <div className="w-16 h-5 rounded-lg bg-[#2a2a30] animate-pulse" />
              <div className="w-full h-2 rounded-full bg-[#18181C] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 3. Phase 1 AI Campaign Kit Generation Shimmer Skeleton
 */
export function Phase1CampaignGenSkeleton() {
  return (
    <div className="space-y-4 p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#1C1C20] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#18181C] border border-[#2a2a30] text-[#D4D4D8]">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FAFAFA] flex items-center gap-2">
              <span>Generating 7-Day Campaign Kit with AI...</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2a2a30] animate-pulse" />
            </h4>
            <p className="text-[10px] text-[#A1A1AA]">
              Synthesizing Instagram Stories, TikTok scripts, VIP email newsletter, and 1-on-1 DM sequences.
            </p>
          </div>
        </div>
        <Skeleton variant="default" rounded="rounded-full" className="w-24 h-5" />
      </div>

      {/* Shimmer Schedule Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((day, i) => (
          <div key={i} className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#A1A1AA]">{day}</span>
              <SkeletonCircle size={10} variant="default" />
            </div>
            <Skeleton rounded="rounded-full" className="w-full h-2.5" />
            <Skeleton rounded="rounded-full" className="w-3/4 h-2" />
          </div>
        ))}
      </div>

      {/* Shimmer Copy Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div className="p-4 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2.5">
          <div className="flex items-center gap-2">
            <SkeletonCircle size={18} variant="default" />
            <Skeleton rounded="rounded-full" className="w-32 h-3" />
          </div>
          <SkeletonText lines={3} />
        </div>
        <div className="p-4 rounded-xl bg-[#141720] border border-[#2a2a30]/[0.06] space-y-2.5">
          <div className="flex items-center gap-2">
            <SkeletonCircle size={18} variant="blue" />
            <Skeleton rounded="rounded-full" className="w-36 h-3" />
          </div>
          <SkeletonText lines={3} />
        </div>
      </div>
    </div>
  )
}

/**
 * 4. Phase 1 AI CRO Experiments Generation Skeleton
 */
export function Phase1ExperimentsGenSkeleton() {
  return (
    <div className="space-y-4 p-5 rounded-2xl bg-[#0e1117] border border-emerald-500/20 shadow-lg shadow-emerald-950/20 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#2a2a30]/[0.07] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <TrendingUp className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Formulating CRO Experiments with AI...</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-[#71717A]">
              Evaluating telemetry, drop-off rates, and generating high-impact A/B variants.
            </p>
          </div>
        </div>
        <Skeleton variant="emerald" rounded="rounded-full" className="w-28 h-5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-xl bg-[#141720] border border-[#2a2a30]/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-36 h-3.5" />
              <Skeleton variant="emerald" rounded="rounded-full" className="w-16 h-4" />
            </div>
            <SkeletonText lines={2} />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton rounded="rounded-md" className="w-20 h-6" />
              <Skeleton rounded="rounded-md" className="w-24 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 5. Phase 2 Build MVP Specifications Skeleton
 */
export function Phase2BuildMVPSkeleton() {
  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden animate-fade-in text-[#FAFAFA]">
      {/* Subtab Bar Skeleton */}
      <div className="p-1.5 rounded-2xl bg-[#18181C] border border-[#2a2a30] flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} rounded="rounded-xl" className="w-28 h-7 bg-[#222227]/80" />
          ))}
        </div>
        <div className="w-32 h-7 rounded-xl bg-[#222227]/80 animate-pulse" />
      </div>

      {/* Main PRD Spec Card */}
      <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#1C1C20] pb-3">
          <div className="space-y-1">
            <Skeleton rounded="rounded-full" className="w-60 h-4 bg-[#222227]" />
            <Skeleton rounded="rounded-full" className="w-40 h-2.5 bg-[#222227]/70" />
          </div>
          <Skeleton rounded="rounded-full" className="w-20 h-5 bg-[#222227]/80" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2">
            <Skeleton rounded="rounded-full" className="w-28 h-3 bg-[#222227]" />
            <SkeletonText lines={3} />
          </div>
          <div className="p-4 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2">
            <Skeleton rounded="rounded-full" className="w-32 h-3 bg-[#222227]" />
            <SkeletonText lines={3} />
          </div>
          <div className="p-4 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2">
            <Skeleton rounded="rounded-full" className="w-36 h-3 bg-[#222227]" />
            <SkeletonText lines={3} />
          </div>
        </div>

        {/* Division of Labor Tasks Shimmer */}
        <div className="space-y-2 pt-2">
          <Skeleton rounded="rounded-full" className="w-44 h-3.5 bg-[#222227]" />
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonCircle size={18} variant="blue" />
                <Skeleton rounded="rounded-full" className="w-64 h-3 bg-[#222227]" />
              </div>
              <Skeleton rounded="rounded-full" className="w-20 h-4 bg-[#222227]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 6. Phase 2 Feedback Clustering Skeleton
 */
export function FeedbackClusterSkeleton() {
  return (
    <div className="space-y-3 p-4 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs animate-fade-in text-[#FAFAFA]">
      <div className="flex items-center justify-between border-b border-[#1C1C20] pb-2">
        <Skeleton rounded="rounded-full" className="w-48 h-3.5 bg-[#222227]" />
        <SkeletonCircle size={16} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2">
            <Skeleton rounded="rounded-full" className="w-24 h-3 bg-[#222227]" />
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 7. Phase 3 Launch & Scale View Skeleton
 */
export function Phase3LaunchSkeleton() {
  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden animate-fade-in">
      <div className="p-1.5 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} rounded="rounded-xl" className="w-28 h-7" />
          ))}
        </div>
        <Skeleton variant="emerald" rounded="rounded-full" className="w-24 h-6 shrink-0" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-2">
            <Skeleton rounded="rounded-full" className="w-16 h-3" />
            <Skeleton rounded="rounded-lg" className="w-20 h-6" />
            <Skeleton rounded="rounded-full" className="w-28 h-2" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-4">
        <Skeleton rounded="rounded-full" className="w-52 h-4" />
        <SkeletonText lines={4} />
      </div>
    </div>
  )
}

/**
 * 8. Phase 3 Executive Launch Report Skeleton
 */
export function LaunchReportSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#2a2a30]/[0.06] pb-3">
        <Skeleton rounded="rounded-full" className="w-64 h-5" />
        <SkeletonButton width={110} height={30} variant="emerald" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 rounded-xl bg-[#0C0C0E]/[0.02] border border-[#2a2a30]/[0.05] space-y-1">
            <Skeleton rounded="rounded-full" className="w-16 h-2.5" />
            <Skeleton rounded="rounded-lg" className="w-20 h-5" />
          </div>
        ))}
      </div>
      <SkeletonText lines={4} />
    </div>
  )
}

/**
 * 9. Creator Partner Portal Skeleton — Dark Studio Theme Matching Real Portal
 */
export function CreatorPortalSkeleton() {
  const C = {
    bg: '#08090c',
    sheet: '#10131a',
    row: '#0c0e13',
    raised: '#171b24',
    line: 'rgba(255,255,255,0.08)',
    crimson: '#c81e3c',
    crimsonSoft: 'rgba(200,30,60,0.14)',
    crimsonLine: 'rgba(200,30,60,0.38)',
    okSoft: 'rgba(111,207,155,0.12)',
    okLine: 'rgba(111,207,155,0.35)',
    skySoft: 'rgba(56,189,248,0.12)',
    skyLine: 'rgba(56,189,248,0.35)',
    violetSoft: 'rgba(167,139,250,0.12)',
    violetLine: 'rgba(167,139,250,0.35)',
  }

  return (
    <div
      className="min-h-screen font-sans flex flex-col relative antialiased animate-fade-in"
      style={{ background: C.bg, color: '#f3f4f6' }}
    >
      <div className="h-1 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${C.crimson}, #a78bfa, #38bdf8)` }} />
      {/* Top Nav Header Skeleton */}
      <header
        className="h-16 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8"
        style={{ background: C.sheet, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl animate-pulse shrink-0" style={{ background: C.raised, border: `1px solid ${C.line}` }} />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-36 h-4 rounded-md animate-pulse" style={{ background: C.raised }} />
              <div className="w-20 h-4 rounded-full animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
            </div>
            <div className="w-24 h-2.5 rounded animate-pulse" style={{ background: C.row }} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 p-1 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
            <div className="w-28 h-7 rounded-lg animate-pulse" style={{ background: C.crimsonSoft }} />
            <div className="w-28 h-7 rounded-lg animate-pulse" style={{ background: C.raised }} />
          </div>
          <div className="w-36 h-8 rounded-xl animate-pulse" style={{ background: C.okSoft, border: `1px solid ${C.okLine}` }} />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6 flex-1">
        {/* Hero Revenue Card Skeleton */}
        <div
          className="p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ background: C.sheet, border: `1px solid ${C.line}` }}
        >
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-24 h-5 rounded-full animate-pulse" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }} />
              <div className="w-32 h-4 rounded-full animate-pulse" style={{ background: C.raised }} />
            </div>
            <div className="w-64 sm:w-80 h-8 rounded-xl animate-pulse" style={{ background: C.raised }} />
            <div className="w-full sm:w-96 h-4 rounded-md animate-pulse" style={{ background: C.row }} />
          </div>

          <div
            className="p-5 rounded-xl space-y-3 min-w-[240px]"
            style={{ background: C.row, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-3 rounded animate-pulse" style={{ background: C.raised }} />
              <div className="w-12 h-3 rounded animate-pulse" style={{ background: C.okSoft }} />
            </div>
            <div className="w-32 h-7 rounded-lg animate-pulse" style={{ background: C.raised }} />
            <div className="w-full h-2 rounded-full animate-pulse" style={{ background: C.crimsonSoft }} />
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[C.crimsonLine, C.skyLine, C.violetLine, C.okLine].map((accent, i) => (
            <div key={i} className="p-4 rounded-xl space-y-2" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
              <div className="w-20 h-3 rounded animate-pulse" style={{ background: C.raised }} />
              <div className="w-16 h-6 rounded-lg animate-pulse" style={{ background: accent }} />
              <div className="w-24 h-2.5 rounded animate-pulse" style={{ background: C.row }} />
            </div>
          ))}
        </div>

        {/* Step Progression Bar */}
        <div className="p-4 rounded-xl space-y-3" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between">
            <div className="w-40 h-3.5 rounded animate-pulse" style={{ background: C.raised }} />
            <div className="w-20 h-3 rounded animate-pulse" style={{ background: C.okSoft }} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="p-2.5 rounded-lg flex items-center gap-2"
                style={{
                  background: i === 1 ? C.crimsonSoft : C.row,
                  border: `1px solid ${i === 1 ? C.crimsonLine : C.line}`
                }}
              >
                <div className="w-4 h-4 rounded-full animate-pulse shrink-0" style={{ background: C.raised }} />
                <div className="w-16 h-3 rounded animate-pulse" style={{ background: C.raised }} />
              </div>
            ))}
          </div>
        </div>

        {/* Daily Tasks Card */}
        <div className="p-6 rounded-2xl space-y-4" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
            <div className="space-y-1">
              <div className="w-48 h-4 rounded animate-pulse" style={{ background: C.raised }} />
              <div className="w-72 h-3 rounded animate-pulse" style={{ background: C.row }} />
            </div>
            <div className="w-24 h-8 rounded-xl animate-pulse" style={{ background: C.crimsonSoft }} />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="p-3.5 rounded-xl flex items-center justify-between gap-3"
                style={{ background: C.row, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg animate-pulse shrink-0" style={{ background: C.raised }} />
                  <div className="space-y-1.5">
                    <div className="w-48 sm:w-64 h-3.5 rounded animate-pulse" style={{ background: C.raised }} />
                    <div className="w-32 sm:w-44 h-2.5 rounded animate-pulse" style={{ background: C.sheet }} />
                  </div>
                </div>
                <div className="w-20 h-7 rounded-lg animate-pulse shrink-0" style={{ background: C.raised, border: `1px solid ${C.line}` }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * 10. Pre-Order Landing Page Skeleton with Live API Loader
 */
export function PreorderLandingSkeleton({ slug }) {
  const displaySlug = slug ? `@${slug.replace(/^@/, '')}` : 'Active Co-Launch Project'
  return (
    <div className="min-h-screen bg-[#080A0C] text-white flex flex-col animate-fade-in relative selection:bg-[#C81E3C]">
      {/* Top Animated Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1.5 bg-gradient-to-r from-[#C81E3C] via-[#78E08F] to-[#C81E3C] animate-pulse shadow-md shadow-[#C81E3C]/20" />

      {/* Top Navbar Skeleton */}
      <div className="p-4 sm:p-5 border-b border-[#334155] flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#171C22] border border-[#334155] flex items-center justify-center text-[#FF4D6D] text-xs font-bold font-mono animate-pulse">
            CF
          </div>
          <div className="space-y-1">
            <div className="w-36 h-4 rounded-full bg-[#1C1C20] animate-pulse" />
            <div className="w-24 h-2.5 rounded-full bg-[#1C1C20]/60 animate-pulse" />
          </div>
        </div>
        <div className="w-32 h-9 rounded-xl bg-[#C81E3C]/20 border border-[#C81E3C]/30 animate-pulse flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-[#FF4D6D]" />
        </div>
      </div>

      {/* Hero Body Skeleton with Animated Spinner & Status Badges */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-12 text-center space-y-7 flex flex-col items-center justify-center my-auto">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#101419] border border-[#C81E3C]/30 text-[#FF4D6D] text-xs font-mono font-bold shadow-lg shadow-[#C81E3C]/5">
          <Loader2 className="w-4 h-4 animate-spin text-[#FF4D6D]" />
          <span>Connecting to CoLaunch Registry for {displaySlug}...</span>
        </div>

        <div className="space-y-3 w-full max-w-2xl mx-auto">
          <div className="w-full h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-[#171C22] via-[#252B32] to-[#171C22] animate-pulse mx-auto border border-[#334155]" />
          <div className="w-3/4 max-w-md h-4 rounded-full bg-[#1C1C20]/80 animate-pulse mx-auto" />
        </div>

        {/* Live Loading Steps Pill */}
        <div className="p-4 rounded-2xl bg-[#101419]/90 border border-[#334155] max-w-md w-full space-y-2 text-left">
          <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#334155] pb-2">
            <span className="text-[#969DA6]">Backend Initialization</span>
            <span className="text-[#78E08F] font-bold">Synchronizing...</span>
          </div>
          <div className="space-y-1.5 text-xs text-[#969DA6]">
            <div className="flex items-center gap-2 text-[#F5F3EA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#78E08F]" />
              <span>Fetching verified creator concept & dynamic pricing</span>
            </div>
            <div className="flex items-center gap-2 text-[#969DA6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2a2a30]" />
              <span>Building customized product mockup canvas</span>
            </div>
            <div className="flex items-center gap-2 text-[#969DA6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2a2a30]" />
              <span>Mounting Stripe & PayPal secure reservation gateway</span>
            </div>
          </div>
        </div>

        {/* Pricing pass cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-w-xl w-full mx-auto">
          <div className="p-5 rounded-2xl bg-[#101419] border border-[#334155] space-y-3 text-left">
            <div className="w-28 h-3.5 rounded bg-[#1C1C20] animate-pulse" />
            <div className="w-24 h-7 rounded bg-[#C81E3C]/20 animate-pulse" />
            <div className="w-full h-3 rounded bg-[#1C1C20]/60 animate-pulse" />
            <div className="w-full h-10 rounded-xl bg-[#C81E3C]/20 animate-pulse mt-2" />
          </div>
          <div className="p-5 rounded-2xl bg-[#101419] border border-[#334155] space-y-3 text-left">
            <div className="w-24 h-3.5 rounded bg-[#1C1C20] animate-pulse" />
            <div className="w-20 h-7 rounded bg-[#1C1C20] animate-pulse" />
            <div className="w-full h-3 rounded bg-[#1C1C20]/60 animate-pulse" />
            <div className="w-full h-10 rounded-xl bg-[#1C1C20]/60 animate-pulse mt-2" />
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * 11. Follow-Up CRM & Inbox Skeleton Table & Card Mockups
 */
export function CRMSkeleton() {
  const C = {
    bg: '#050506',
    sheet: '#0c0c0e',
    row: '#111114',
    raised: '#1c1c20',
    line: 'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.16)',
    crimson: '#c81e3c',
    crimsonSoft: 'rgba(200,30,60,0.14)',
    crimsonLine: 'rgba(200,30,60,0.38)',
    okSoft: 'rgba(111,207,155,0.12)',
    okLine: 'rgba(111,207,155,0.35)',
    skySoft: 'rgba(56,189,248,0.12)',
    skyLine: 'rgba(56,189,248,0.35)',
    violetSoft: 'rgba(167,139,250,0.12)',
    violetLine: 'rgba(167,139,250,0.35)',
    amberSoft: 'rgba(240,180,106,0.12)',
    amberLine: 'rgba(240,180,106,0.35)',
  }

  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* KPI Status Pills Skeleton */}
      <div
        className="p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
        style={{ background: C.sheet, border: `1px solid ${C.line}` }}
      >
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="p-3 rounded-xl flex items-center justify-between"
            style={{ background: C.row, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: i === 1 ? '#c81e3c' : i === 2 ? '#6fcf9b' : i === 3 ? '#c4b5fd' : '#7dd3fc' }}
              />
              <div className="w-16 h-3 rounded animate-pulse" style={{ background: C.raised }} />
            </div>
            <div className="w-6 h-4 rounded animate-pulse" style={{ background: C.raised }} />
          </div>
        ))}
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl"
        style={{ background: C.sheet, border: `1px solid ${C.line}` }}
      >
        <div className="w-full sm:w-80 h-9 rounded-xl animate-pulse" style={{ background: C.row, border: `1px solid ${C.line}` }} />
        <div className="flex items-center gap-2">
          <div className="w-24 h-8 rounded-lg animate-pulse" style={{ background: C.row, border: `1px solid ${C.line}` }} />
          <div className="w-24 h-8 rounded-lg animate-pulse" style={{ background: C.row, border: `1px solid ${C.line}` }} />
        </div>
      </div>

      {/* Directory Full Cards Mockups */}
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div
            key={i}
            className="p-5 sm:p-6 rounded-2xl space-y-4"
            style={{ background: C.sheet, border: `1px solid ${C.line}` }}
          >
            {/* Header: Avatar, Name, Handle, Stage Badge */}
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl animate-pulse shrink-0"
                  style={{ background: C.row, border: `1px solid ${C.lineStrong}` }}
                />
                <div className="space-y-1.5">
                  <div className="w-44 h-4 rounded animate-pulse" style={{ background: C.raised }} />
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-3 rounded animate-pulse" style={{ background: C.okSoft }} />
                    <div className="w-16 h-3 rounded animate-pulse" style={{ background: C.row }} />
                  </div>
                </div>
              </div>
              <div
                className="w-36 h-6 rounded-full animate-pulse"
                style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }}
              />
            </div>

            {/* 6 Stats Tiles */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: C.row, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <div className="w-32 h-3 rounded animate-pulse" style={{ background: C.raised }} />
                <div
                  className="w-24 h-4 rounded animate-pulse"
                  style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map(idx => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg text-center space-y-1"
                    style={{ background: C.sheet, border: `1px solid ${C.line}` }}
                  >
                    <div className="w-12 h-2.5 mx-auto rounded animate-pulse" style={{ background: C.raised }} />
                    <div className="w-10 h-3.5 mx-auto rounded animate-pulse" style={{ background: C.row }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Content Bio Box */}
            <div
              className="p-3.5 rounded-xl space-y-1.5"
              style={{ background: C.row, border: `1px solid ${C.line}` }}
            >
              <div className="w-24 h-2.5 rounded animate-pulse" style={{ background: C.raised }} />
              <div className="w-full h-3 rounded animate-pulse" style={{ background: C.sheet }} />
              <div className="w-3/4 h-3 rounded animate-pulse" style={{ background: C.sheet }} />
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-16 h-7 rounded-xl animate-pulse"
                  style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }}
                />
                <div
                  className="w-24 h-7 rounded-xl animate-pulse"
                  style={{ background: C.raised, border: `1px solid ${C.line}` }}
                />
                <div
                  className="w-28 h-7 rounded-xl animate-pulse"
                  style={{ background: C.raised, border: `1px solid ${C.line}` }}
                />
              </div>
              <div
                className="w-40 h-7 rounded-xl animate-pulse"
                style={{ background: C.okSoft, border: `1px solid ${C.okLine}` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 12. Phase 3 Launch Strategy & Schedule Skeleton
 */
export function Phase3StrategySkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-3">
          <Skeleton rounded="rounded-full" className="w-32 h-3" variant="emerald" />
          <Skeleton rounded="rounded-lg" className="w-40 h-7" />
          <Skeleton rounded="rounded-full" className="w-full h-3" />
          <Skeleton rounded="rounded-xl" className="w-full h-10" variant="default" />
        </div>
        <div className="md:col-span-2 p-5 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-3">
          <div className="flex items-center justify-between border-b border-[#2a2a30]/[0.06] pb-2">
            <Skeleton rounded="rounded-full" className="w-44 h-3.5" variant="blue" />
            <Skeleton rounded="rounded-full" className="w-28 h-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-3.5 rounded-xl bg-[#141720] border border-[#2a2a30]/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
                  <Skeleton rounded="rounded" className="w-12 h-4" variant="default" />
                </div>
                <Skeleton rounded="rounded-full" className="w-full h-2.5" />
                <Skeleton rounded="rounded-full" className="w-3/4 h-2.5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-3">
        <Skeleton rounded="rounded-full" className="w-56 h-3.5" variant="emerald" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[1, 2].map(i => (
            <div key={i} className="p-4 rounded-xl bg-[#141720] border border-[#2a2a30]/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton rounded="rounded-full" className="w-32 h-4" />
                <Skeleton rounded="rounded-lg" className="w-20 h-6" variant="emerald" />
              </div>
              <Skeleton rounded="rounded-full" className="w-48 h-3" />
              <Skeleton rounded="rounded-lg" className="w-full h-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 13. Phase 3 Creator Assets Skeleton
 */
export function Phase3AssetsSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#2a2a30]/[0.07] pb-3">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} rounded="rounded-xl" className="w-24 h-7" />
          ))}
        </div>
        <SkeletonButton width={130} height={32} variant="default" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton rounded="rounded-full" className="w-48 h-4" />
          <Skeleton rounded="rounded-lg" className="w-20 h-7" />
        </div>
        <div className="p-5 rounded-xl bg-[#090b0e] border border-[#2a2a30]/[0.06] space-y-2">
          <Skeleton rounded="rounded-full" className="w-full h-3" />
          <Skeleton rounded="rounded-full" className="w-4/5 h-3" />
          <Skeleton rounded="rounded-full" className="w-3/5 h-3" />
          <Skeleton rounded="rounded-full" className="w-2/3 h-3" />
        </div>
      </div>
    </div>
  )
}

/**
 * 14. Phase 3 Infrastructure Skeleton
 */
export function Phase3InfraSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#2a2a30]/[0.06] pb-2.5">
        <Skeleton rounded="rounded-full" className="w-64 h-4" variant="emerald" />
        <Skeleton rounded="rounded-full" className="w-24 h-3.5" variant="emerald" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="p-4 rounded-xl bg-[#141720] border border-[#2a2a30]/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
              <Skeleton rounded="rounded" className="w-14 h-4" variant="emerald" />
            </div>
            <Skeleton rounded="rounded-full" className="w-full h-2.5" />
            <Skeleton rounded="rounded-full" className="w-3/4 h-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 15. Phase 3 Checklists Skeleton
 */
export function Phase3ChecklistsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {[1, 2].map(col => (
        <div key={col} className="p-5 rounded-2xl bg-[#0e1117] border border-[#2a2a30]/[0.08] space-y-3">
          <div className="flex items-center justify-between border-b border-[#2a2a30]/[0.06] pb-2.5">
            <Skeleton rounded="rounded-full" className="w-40 h-4" variant={col === 1 ? 'emerald' : 'blue'} />
            <Skeleton rounded="rounded-full" className="w-24 h-3" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-3 rounded-xl bg-[#141720] border border-[#2a2a30]/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 w-full">
                  <SkeletonCircle size={16} />
                  <Skeleton rounded="rounded-full" className="w-4/5 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 16. Section 1 Step 2: Creator Candidate Cards Skeleton
 */
export function CreatorCardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-none bg-[#0D121F] border border-[#334155] shadow-none space-y-3.5 relative overflow-hidden animate-fade-in"
        >
          {/* Subtle Shimmer Overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[#334155]/30 to-transparent pointer-events-none" />

          {/* Header row with avatar, name and score */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-none bg-[#131929] border border-[#334155] animate-pulse" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-none bg-[#1E293B] border border-[#0D121F] animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-4 w-32 sm:w-36 bg-[#1E293B] rounded-none animate-pulse" />
                <div className="h-3 w-24 bg-[#131929] rounded-none animate-pulse" />
              </div>
            </div>
            {/* Score Badge */}
            <div className="h-6 w-16 bg-cyan-950/20 border border-cyan-500/20 rounded-none flex items-center justify-center animate-pulse shrink-0">
              <div className="h-2.5 w-10 bg-cyan-500/30 rounded-none" />
            </div>
          </div>

          {/* Stats 4-Grid in dark secondary tiles */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="p-2 rounded-none bg-[#131929] border border-[#334155] space-y-1 animate-pulse">
              <div className="h-2 w-8 mx-auto bg-[#1E293B] rounded-none" />
              <div className="h-3 w-10 mx-auto bg-[#1E293B]/70 rounded-none" />
            </div>
            <div className="p-2 rounded-none bg-[#131929] border border-[#334155] space-y-1 animate-pulse">
              <div className="h-2 w-8 mx-auto bg-[#1E293B] rounded-none" />
              <div className="h-3 w-10 mx-auto bg-[#1E293B]/70 rounded-none" />
            </div>
            <div className="p-2 rounded-none bg-[#131929] border border-[#334155] space-y-1 animate-pulse">
              <div className="h-2 w-8 mx-auto bg-[#1E293B] rounded-none" />
              <div className="h-3 w-10 mx-auto bg-[#1E293B]/70 rounded-none" />
            </div>
            <div className="p-2 rounded-none bg-[#131929] border border-[#334155] space-y-1 animate-pulse">
              <div className="h-2 w-8 mx-auto bg-[#1E293B] rounded-none" />
              <div className="h-3 w-10 mx-auto bg-[#1E293B]/70 rounded-none" />
            </div>
          </div>

          {/* Bio lines snippet box */}
          <div className="p-2.5 rounded-none bg-[#131929] border border-[#334155] space-y-1.5 animate-pulse">
            <div className="h-2.5 w-full bg-[#1E293B] rounded-none" />
            <div className="h-2.5 w-4/5 bg-[#1E293B]/60 rounded-none" />
          </div>

          {/* Contact and action footer */}
          <div className="pt-2 border-t border-[#334155] flex items-center justify-between gap-2">
            <div className="h-6 w-36 bg-[#131929] border border-[#334155] rounded-none animate-pulse" />
            <div className="h-7 w-20 bg-[#131929] border border-[#334155] rounded-none animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 17. Section 1 Step 5: AI Software Concept Cards Skeleton
 */
export function ConceptCardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-[#2a2a30]/90 bg-[#0C0C0E] space-y-4 relative overflow-hidden shadow-2xs animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#1C1C20] pb-3">
            <div className="h-6 w-28 bg-[#18181C] border border-[#2a2a30]/70 rounded-lg animate-pulse" />
            <div className="h-5 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-4/5 bg-[#222227]/80 rounded-full animate-pulse" />
            <div className="h-3 w-full bg-[#18181C] rounded-full animate-pulse" />
            <div className="h-3 w-2/3 bg-[#18181C] rounded-full animate-pulse" />
          </div>
          <div className="space-y-2 pt-2 border-t border-[#1C1C20]">
            {[1, 2, 3].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#222227] shrink-0 animate-pulse" />
                <div className="h-3 w-3/4 bg-[#18181C] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
          <div className="pt-2">
            <div className="h-10 w-full bg-[#18181C] border border-[#2a2a30]/80 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 18. Section 1 Step 3: Direct Outreach Queue Skeleton
 */
export function OutreachQueueSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 space-y-4 animate-fade-in w-full shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#1C1C20] pb-3">
        <div className="h-4 w-48 bg-[#222227]/80 rounded-full animate-pulse" />
        <div className="h-6 w-24 bg-[#18181C] border border-[#2a2a30]/60 rounded-full animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3.5 rounded-xl bg-[#111114] border border-[#2a2a30]/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-[#222227] animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-36 bg-[#222227]/80 rounded-full animate-pulse" />
                <div className="h-2.5 w-56 bg-[#18181C] rounded-full animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full shrink-0 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 19. Section 1 Step 4: Reply Classifier Inbox Skeleton
 */
export function ReplyInboxSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 space-y-4 animate-fade-in w-full shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#1C1C20] pb-3">
        <div className="h-4 w-44 bg-[#222227]/80 rounded-full animate-pulse" />
        <div className="h-6 w-28 bg-emerald-500/10 border border-emerald-500/30 rounded-full animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-xl bg-[#111114] border border-[#2a2a30]/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#222227] animate-pulse shrink-0" />
                <div className="h-3.5 w-32 bg-[#222227]/80 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full animate-pulse" />
            </div>
            <div className="h-3 w-4/5 bg-[#222227]/70 rounded-full animate-pulse" />
            <div className="h-2.5 w-1/2 bg-[#18181C] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}


