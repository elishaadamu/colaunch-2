import React from 'react'
import { Sparkles, Star } from 'lucide-react'

/**
 * Step5SkeletonLoader
 * Dark studio animated skeleton state shown while AI synthesizes
 * and engineers the top 3 co-launch software product concepts for the creator.
 * Matches the exact clean dark studio design system of CoLaunch.
 */
export default function Step5SkeletonLoader({ creatorName = 'Creator' }) {
  return (
    <div className="space-y-4 w-full animate-fade-in text-slate-100">
      {/* ── Top 3 Product Concepts Skeleton ── */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-[#1E293B] pb-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <span>Top 3 Product Opportunities for {creatorName}</span>
            </h3>
            <p className="text-slate-400 text-xs">
              Synthesizing problem statements, core features, target audience use cases, pricing models, and revenue projections...
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold shrink-0 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>Engineering 3 Concepts...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="p-5 rounded-none border border-[#1E293B] bg-[#101524] text-slate-200 space-y-4 flex flex-col justify-between shadow-md relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

              <div className="space-y-3.5">
                {/* Header Badge & Opportunity Score */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 bg-[#090D16] px-2.5 py-0.5 rounded-none border border-[#1E293B]">
                    Concept #{num}
                  </span>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-amber-950/60 border border-amber-500/40">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <div className="h-3 w-16 bg-amber-400/30 rounded-none animate-pulse" />
                  </div>
                </div>

                {/* Window Chrome Mockup Preview Skeleton */}
                <div className="rounded-none bg-[#090D16] border border-[#1E293B] p-2.5 relative overflow-hidden flex flex-col justify-between shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <div className="h-3.5 w-28 bg-[#101524] border border-[#1E293B] rounded-none animate-pulse ml-1.5" />
                    </div>
                    <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-none border border-emerald-500/30">
                      Landing Page
                    </span>
                  </div>

                  {/* Mockup Landing Page Shimmer Canvas */}
                  <div className="relative rounded-none overflow-hidden border border-[#1E293B] min-h-[225px] bg-[#06080C] flex flex-col justify-between p-3 text-center space-y-2">
                    {/* Mini Nav Wireframe */}
                    <div className="flex items-center justify-between border-b border-[#1E293B] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-none bg-slate-800 animate-pulse" />
                        <div className="h-2.5 w-16 bg-slate-800 rounded-none animate-pulse" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-10 bg-slate-800/80 rounded-none animate-pulse hidden xs:block" />
                        <div className="h-3 w-12 bg-emerald-500/30 rounded-none animate-pulse" />
                      </div>
                    </div>

                    {/* Hero Badge & Headline Wireframe */}
                    <div className="space-y-2 py-1 flex flex-col items-center">
                      <div className="h-3 w-36 bg-slate-800/90 rounded-none animate-pulse" />
                      <div className="h-4 w-48 bg-slate-700/80 rounded-none animate-pulse" />
                      <div className="h-2.5 w-40 bg-slate-800/60 rounded-none animate-pulse" />
                      <div className="flex items-center gap-2 pt-1">
                        <div className="h-5 w-20 bg-[#C81E3C]/60 rounded-none animate-pulse" />
                        <div className="h-5 w-16 bg-[#101524] border border-[#1E293B] rounded-none animate-pulse" />
                      </div>
                    </div>

                    {/* Feature Card Strip Wireframe */}
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#1E293B]">
                      <div className="h-7 bg-[#101524] rounded-none border border-[#1E293B] animate-pulse" />
                      <div className="h-7 bg-[#101524] rounded-none border border-[#1E293B] animate-pulse" />
                      <div className="h-7 bg-[#101524] rounded-none border border-[#1E293B] animate-pulse" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-pulse pointer-events-none" />
                  </div>

                  {/* 3 Metric Tiles Skeleton */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="p-1.5 rounded-none bg-[#101524] border border-[#1E293B] text-center space-y-1">
                      <span className="text-[7.5px] text-slate-400 block font-mono">MRR</span>
                      <div className="h-2.5 w-10 mx-auto bg-emerald-500/40 rounded-none animate-pulse" />
                    </div>
                    <div className="p-1.5 rounded-none bg-[#101524] border border-[#1E293B] text-center space-y-1">
                      <span className="text-[7.5px] text-slate-400 block font-mono">Users</span>
                      <div className="h-2.5 w-8 mx-auto bg-slate-700 rounded-none animate-pulse" />
                    </div>
                    <div className="p-1.5 rounded-none bg-[#101524] border border-[#1E293B] text-center space-y-1">
                      <span className="text-[7.5px] text-slate-400 block font-mono">Score</span>
                      <div className="h-2.5 w-8 mx-auto bg-cyan-400/40 rounded-none animate-pulse" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-[#1E293B] pt-1">
                    <div className="h-2 w-24 bg-slate-800 rounded-none animate-pulse" />
                    <div className="h-2 w-16 bg-slate-800/70 rounded-none animate-pulse" />
                  </div>
                </div>

                {/* Title & Tagline in Card Body */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-4 w-3/4 bg-slate-700/80 rounded-none animate-pulse" />
                  <div className="h-2.5 w-full bg-slate-800 rounded-none animate-pulse" />
                  <div className="h-2.5 w-4/5 bg-slate-800 rounded-none animate-pulse" />
                </div>

                {/* Problem & Solution Callout Box */}
                <div className="p-3 rounded-none bg-[#090D16] border border-[#1E293B] space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-20 bg-amber-500/30 rounded-none animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-full bg-slate-700/60 rounded-none animate-pulse" />
                    <div className="h-2 w-4/5 bg-slate-800 rounded-none animate-pulse" />
                  </div>
                </div>

                {/* Key Features Bullets */}
                <div className="space-y-1.5 pt-1">
                  {[1, 2, 3].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C81E3C] shrink-0" />
                      <div className="h-2 w-4/5 bg-slate-800 rounded-none animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Metrics Pill & Action */}
              <div className="pt-3 border-t border-[#1E293B] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-24 bg-[#090D16] border border-[#1E293B] rounded-none animate-pulse" />
                  <div className="h-6 w-20 bg-emerald-950/60 border border-emerald-500/40 rounded-none animate-pulse" />
                </div>
                <div className="w-full h-8 rounded-none bg-[#131929] border border-[#1E293B] flex items-center justify-center animate-pulse">
                  <div className="h-2.5 w-28 bg-slate-600/60 rounded-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
