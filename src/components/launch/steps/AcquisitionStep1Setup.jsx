import {
  Target,
  Search,
  ArrowRight,
  RefreshCw,
  Check,
  Users,
  X,
  Trash2,
  Plus,
  AlertTriangle,
  Flame,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

export default function AcquisitionStep1Setup({
  activeNicheCategory,
  addNiche,
  creators,
  creatorsBatchCount,
  customNicheInput,
  deleteNiche,
  discovering,
  filteredAvailableNiches,
  handleBulkSyncNiches,
  handleDeleteAllCreators,
  handleStartEngine,
  handleStartFresh,
  isDeletingAll,
  loadingCreatorsFromDb,
  loadingNiches,
  minEngagement,
  minFollowers,
  nicheSearchQuery,
  niches,
  removeNiche,
  selectedGeography,
  selectedPlatforms,
  setActiveNicheCategory,
  setCreatorsBatchCount,
  setCustomNicheInput,
  setMaxFollowers,
  setMinEngagement,
  setMinFollowers,
  setNicheSearchQuery,
  togglePlatform,
}) {
  return (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0 items-start">
    <div className="lg:col-span-8 space-y-6 w-full min-w-0">
      {/* Parameters Card */}
      <div className="acq-card p-6 sm:p-7  min-w-0 w-full relative overflow-hidden">

        <div className="relative z-10 space-y-6">
          {/* Header row of the card */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#2a2a30]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#141417] text-[#C81E3C] border border-[#2a2a30]">
                <SlidersHorizontal className="w-5 h-5 text-[#C81E3C]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Campaign Parameters</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteAllCreators}
                disabled={isDeletingAll || loadingCreatorsFromDb}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#FF4D6D] hover:text-white bg-[#1A0B10] hover:bg-[#2A0F18] border border-rose-900/60 hover:border-[#C81E3C] transition cursor-pointer disabled:opacity-50 active:scale-95"

              >
                {loadingCreatorsFromDb ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-[#FF4D6D] animate-spin" />
                    <span>Loading creators...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-[#FF4D6D]" />
                    <span>{isDeletingAll ? "Deleting..." : `Delete All Creators (${creators.length})`}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleStartFresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A1A1AA] hover:text-white bg-[#141417] hover:bg-[#1C1C20] border border-[#2a2a30] hover:border-[#2a2a30] transition cursor-pointer"

              >
                <RefreshCw className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>Reset Fresh</span>
              </button>
            </div>
          </div>

          {/* SECTION: Target Platforms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Target Platforms</span>
              </div>
              <span className="text-[11px] text-[#71717A] font-mono">Select at least 1</span>
            </div>

            <div id="tour-s1-platforms" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* YouTube Card */}
              <button
                type="button"
                onClick={() => togglePlatform("youtube")}
                className={`relative p-3.5 rounded-lg border flex items-center justify-between group transition-all duration-150 cursor-pointer ${
                  selectedPlatforms.includes("youtube")
                    ? "border-[#C81E3C] bg-[#1A0F12]"
                    : "border-[#2a2a30] bg-[#0C0C0E] opacity-60 hover:opacity-100 hover:border-[#2a2a30]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1A0B10] text-[#EF4444] flex items-center justify-center border border-rose-900/50">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">YouTube</span>
                    <span className="text-[10px] text-[#A1A1AA] font-mono">Long-form & Shorts</span>
                  </div>
                </div>
                <span className={`status-dot w-2.5 h-2.5 rounded-lg transition-colors ${
                  selectedPlatforms.includes("youtube")
                    ? "bg-[#C81E3C] shadow-sm shadow-[#C81E3C]/50"
                    : "bg-[#2a2a30]"
                }`} />
              </button>

              {/* Instagram Card */}
              <button
                type="button"
                onClick={() => togglePlatform("instagram")}
                className={`relative p-3.5 rounded-lg border flex items-center justify-between group transition-all duration-150 cursor-pointer ${
                  selectedPlatforms.includes("instagram")
                    ? "border-[#C81E3C] bg-[#1A0F12]"
                    : "border-[#2a2a30] bg-[#0C0C0E] opacity-60 hover:opacity-100 hover:border-[#2a2a30]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1A0B10] text-[#E1306C] flex items-center justify-center border border-pink-900/50">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Instagram</span>
                    <span className="text-[10px] text-[#A1A1AA] font-mono">Reels & Carousels</span>
                  </div>
                </div>
                <span className={`status-dot w-2.5 h-2.5 rounded-lg transition-colors ${
                  selectedPlatforms.includes("instagram")
                    ? "bg-[#C81E3C] shadow-sm shadow-[#C81E3C]/50"
                    : "bg-[#2a2a30]"
                }`} />
              </button>

              {/* TikTok Card */}
              <button
                type="button"
                onClick={() => togglePlatform("tiktok")}
                className={`relative p-3.5 rounded-lg border flex items-center justify-between group transition-all duration-150 cursor-pointer ${
                  selectedPlatforms.includes("tiktok")
                    ? "border-[#C81E3C] bg-[#1A0F12]"
                    : "border-[#2a2a30] bg-[#0C0C0E] opacity-60 hover:opacity-100 hover:border-[#2a2a30]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F1B26] text-[#00F2FE] flex items-center justify-center border border-emerald-900/50">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">TikTok</span>
                    <span className="text-[10px] text-[#A1A1AA] font-mono">Viral Short Video</span>
                  </div>
                </div>
                <span className={`status-dot w-2.5 h-2.5 rounded-lg transition-colors ${
                  selectedPlatforms.includes("tiktok")
                    ? "bg-[#C81E3C] shadow-sm shadow-[#C81E3C]/50"
                    : "bg-[#2a2a30]"
                }`} />
              </button>
            </div>
          </div>

          {/* SECTION: Selected Niches Bar */}
          <div id="tour-s1-niche-select" className="pt-6 border-t border-[#2a2a30] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Target Niche(s)</span>
                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${
                  niches.length > 0
                    ? "bg-[#C81E3C]/20 text-[#FF4D6D] border-[#C81E3C]/40"
                    : "bg-rose-950/40 text-rose-300 border-rose-800"
                }`}>
                  {niches.length > 0 ? `${niches.length} selected` : "0 selected (Required)"}
                </span>
              </div>
              {niches.length > 0 && !loadingNiches && (
                <button
                  type="button"
                  onClick={() => handleBulkSyncNiches([])}
                  className="text-xs font-mono font-semibold text-[#A1A1AA] hover:text-[#FF4D6D] transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Active tags container + Add input with skeleton loader */}
            {loadingNiches ? (
              <div className="p-3 rounded-lg border bg-[#0A0F1D] border-[#2a2a30] flex items-center gap-2 min-h-[50px] animate-pulse">
                <div className="h-6 w-20 bg-[#141417] rounded-lg" />
                <div className="h-6 w-24 bg-[#141417] rounded-lg" />
                <div className="h-6 w-16 bg-[#141417] rounded-lg" />
                <div className="h-6 w-22 bg-[#141417] rounded-lg" />
                <div className="h-6 w-28 bg-[#141417] rounded-lg" />
              </div>
            ) : (
              <div className={`p-3 rounded-lg border flex flex-wrap items-center gap-2 min-h-[50px] transition-colors ${
                niches.length === 0
                  ? "bg-rose-950/20 border-rose-900/60"
                  : "bg-[#0A0F1D] border-[#2a2a30]"
              }`}>
                {niches.length === 0 && (
                  <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5 py-0.5 px-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>No niche selected — choose below or type a custom one:</span>
                  </span>
                )}
                {niches.map((niche) => (
                  <div
                    key={niche}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#C81E3C] text-white border border-[#C81E3C] shadow-sm transition hover:bg-[#B01732]"
                  >
                    <span className="text-white font-bold">{niche}</span>
                    <button
                      type="button"
                      onClick={() => removeNiche(niche)}
                      title="Remove"
                      className="text-white/80 hover:text-white transition-colors p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                <div className="inline-flex items-center">
                  <input
                    type="text"
                    value={customNicheInput}
                    onChange={(e) => setCustomNicheInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addNiche(customNicheInput);
                      }
                    }}
                    placeholder="+ Add custom..."
                    className="text-xs bg-[#0C0C0E] border border-dashed border-[#2a2a30] rounded-lg px-3 py-1 text-white placeholder-[#71717A] focus:outline-none focus:border-[#C81E3C] font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION: Available Niches Interactive Grid (Redesigned - No Icons) */}
          <div className="pt-6 border-t border-[#2a2a30] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Available Niches</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#141417] text-[#A1A1AA] border border-[#2a2a30]">
                    {niches.length} active
                  </span>
                </div>
              </div>

              {/* Instant Search Input */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter niches..."
                  value={nicheSearchQuery}
                  onChange={(e) => setNicheSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg bg-[#030304] border border-[#2a2a30] text-white placeholder-[#71717A] focus:outline-none focus:border-[#C81E3C] transition"
                />
                {nicheSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setNicheSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Bar + Quick Select Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "All" },
                  { id: "tech", label: "Tech & Dev" },
                  { id: "business", label: "Business & Web3" },
                  { id: "creative", label: "Creative & Media" },
                  { id: "lifestyle", label: "Lifestyle" },
                ].map((cat) => {
                  const isActive = activeNicheCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveNicheCategory(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${
                        isActive
                          ? "font-bold bg-[#C81E3C] text-white shadow-sm"
                          : "font-medium bg-[#141417] hover:bg-[#1C1C20] text-[#A1A1AA] hover:text-white border border-[#2a2a30]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Quick Bulk Actions */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const toAdd = filteredAvailableNiches.map((n) => n.label);
                    handleBulkSyncNiches(Array.from(new Set([...niches, ...toAdd])));
                  }}
                  className="text-xs font-semibold text-[#FF4D6D] hover:underline cursor-pointer"
                >
                  Select Filtered
                </button>
                <span className="text-[#2a2a30]">·</span>
                <button
                  type="button"
                  onClick={() => {
                    const toRemove = new Set(filteredAvailableNiches.map((n) => n.label.toLowerCase()));
                    handleBulkSyncNiches(niches.filter((t) => !toRemove.has(t.toLowerCase())));
                  }}
                  className="text-xs font-medium text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  Deselect Filtered
                </button>
              </div>
            </div>

            {/* Niches Grid with Skeleton Loading (Clean Typography, No Icons) */}
            {loadingNiches ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-[#2a2a30] bg-[#0C0C0E] animate-pulse shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-24 bg-[#141417] rounded-lg" />
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-lg bg-[#141417]" />
                        <div className="w-5 h-5 rounded-lg bg-[#141417]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                {filteredAvailableNiches.length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-[#030304] rounded-lg border border-dashed border-[#2a2a30]">
                    <p className="text-xs text-[#A1A1AA]">No niches matched your search criteria.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setNicheSearchQuery("");
                        setActiveNicheCategory("all");
                      }}
                      className="text-xs font-semibold text-[#FF4D6D] hover:underline mt-1 cursor-pointer"
                    >
                      Clear search query
                    </button>
                  </div>
                ) : (
                  filteredAvailableNiches.map((item) => {
                    const isAdded = niches.some((n) => n.toLowerCase() === item.label.toLowerCase());
                    return isAdded ? (
                      <div
                        key={item.id}
                        onClick={() => removeNiche(item.label)}
                        className="group relative cursor-pointer select-none p-3 rounded-lg border border-[#C81E3C] bg-[#1A0F12] shadow-sm transition-all duration-150 hover:bg-[#19233A]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="text-xs font-bold text-white truncate block">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              title={`Delete ${item.label} niche`}
                              onClick={(e) => deleteNiche(e, item.label)}
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#FF4D6D] hover:bg-rose-950/50 transition-all duration-150 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-5 h-5 rounded-lg bg-[#C81E3C] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                              <Check className="w-3 h-3 text-white stroke-[2.5]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={item.id}
                        onClick={() => addNiche(item.label)}
                        className="group relative cursor-pointer select-none p-3 rounded-lg border border-[#2a2a30] bg-[#0C0C0E] hover:bg-[#141417] hover:border-[#2a2a30] shadow-xs transition-all duration-150"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="text-xs font-medium text-slate-300 truncate block group-hover:text-white">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              title={`Delete ${item.label} niche`}
                              onClick={(e) => deleteNiche(e, item.label)}
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-[#475569] hover:text-rose-400 hover:bg-rose-950/40 transition-all duration-150 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-5 h-5 rounded-lg border border-[#2a2a30] group-hover:border-slate-500 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-white transition-colors">
                              <Plus className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Campaign Summary & Start Button (Right Sidebar - Matching User HTML Design) */}
    <div className="lg:col-span-4 w-full min-w-0 lg:sticky lg:top-24 space-y-4 z-20">
      <div className="acq-card p-6  relative overflow-hidden space-y-5">
        {/* Ambient top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C81E3C] via-[#B01732] to-[#C81E3C]" />

        <div className="flex items-center justify-between pb-4 border-b border-[#2a2a30]">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#71717A] block">Preview Deck</span>
            <h2 className="text-sm font-bold tracking-tight text-white uppercase">Campaign Summary</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Spec
          </span>
        </div>

        {/* Summary Metric list with clean typography */}
        <div className="divide-y divide-[#222227] py-2">
          {/* Min Followers */}
          <div id="tour-s1-followers" className="py-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Min Followers</span>
              </span>
              <span className="font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded-lg">
                {minFollowers >= 1000000 ? "1M" : `${Math.round((minFollowers || 100000) / 1000)}K`}
              </span>
            </div>
            <input
              type="range"
              min="100000"
              max="1000000"
              step="25000"
              value={minFollowers || 100000}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinFollowers(val);
                setMaxFollowers(1000000);
                try {
                  localStorage.setItem("forge_launch_min_followers", String(val));
                  localStorage.setItem("forge_launch_max_followers", "1000000");
                } catch (err) {}
              }}
              className="w-full cursor-pointer h-5 bg-transparent appearance-none slider-cyan border-none outline-none focus:outline-none shadow-none"
            />
          </div>

          {/* Geography */}
          <div className="py-2.5 flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">Geography</span>
            <span className="font-mono font-bold text-white uppercase">{selectedGeography}</span>
          </div>

          {/* Batch Discovery Size */}
          <div id="tour-s1-creators-count" className="py-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Batch Discovery Size</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const val = Math.max(5, (creatorsBatchCount || 25) - 5);
                    setCreatorsBatchCount(val);
                    try { localStorage.setItem("forge_launch_creators_batch_count", String(val)); } catch (err) {}
                  }}
                  className="w-5 h-5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-200 transition cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold text-emerald-300 px-1">{creatorsBatchCount || 25}</span>
                <button
                  type="button"
                  onClick={() => {
                    const val = Math.min(50, (creatorsBatchCount || 25) + 5);
                    setCreatorsBatchCount(val);
                    try { localStorage.setItem("forge_launch_creators_batch_count", String(val)); } catch (err) {}
                  }}
                  className="w-5 h-5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-200 transition cursor-pointer"
                >
                  +
                </button>
                <span className="text-[10px] text-emerald-400/70">Creators</span>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={creatorsBatchCount || 25}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCreatorsBatchCount(val);
                try {
                  localStorage.setItem("forge_launch_creators_batch_count", String(val));
                } catch (err) {}
              }}
              className="w-full cursor-pointer h-5 bg-transparent appearance-none slider-emerald border-none outline-none focus:outline-none shadow-none"
            />
          </div>

          {/* Min Engagement */}
          <div className="py-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Min Engagement</span>
              </span>
              <span className="font-mono font-bold text-rose-300 bg-rose-950/40 border border-rose-500/40 px-2 py-0.5 rounded-lg">
                ≥ {minEngagement}%
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={minEngagement}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinEngagement(val);
                try {
                  localStorage.setItem("forge_launch_min_engagement", String(val));
                } catch (err) {}
              }}
              className="w-full cursor-pointer h-5 bg-transparent appearance-none slider-rose border-none outline-none focus:outline-none shadow-none"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">Estimated Match Pool</span>
            <span className={`font-mono font-bold ${niches.length > 0 ? "text-white" : "text-[#FF4D6D]"}`}>
              {niches.length > 0
                ? `~${(niches.length * 380 * 3).toLocaleString()} profiles`
                : "0 profiles (Select niche)"}
            </span>
          </div>
        </div>

        {/* Primary Call to Action Button */}
        <div className="mt-5 space-y-3">
          <button
            id="tour-s1-discovery-btn"
            type="button"
            onClick={handleStartEngine}
            disabled={discovering || niches.length === 0 || selectedPlatforms.length === 0}
            className={`w-full group relative overflow-hidden flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-bold text-sm tracking-wide transition-all transform ${
              discovering || niches.length === 0 || selectedPlatforms.length === 0
                ? "bg-[#222227] text-[#71717A] border border-[#2a2a30] cursor-not-allowed shadow-none"
                : "acq-btn-primary text-white shadow-lg shadow-[#C81E3C]/20 active:scale-[0.99] cursor-pointer"
            }`}
            title={
              niches.length === 0
                ? "Select a target niche to begin"
                : selectedPlatforms.length === 0
                ? "Select a platform to begin discovery"
                : "Start Lead Discovery"
            }
          >
            {discovering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Discovering & Enriching Leads...</span>
              </>
            ) : niches.length === 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-white" />
                <span>Select Target Niche to Discover</span>
              </>
            ) : selectedPlatforms.length === 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-white" />
                <span>Select Platform to Discover</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 transition-transform group-hover:rotate-45 text-white" />
                <span>Start Lead Discovery</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-white" />
              </>
            )}
          </button>

          {loadingCreatorsFromDb ? (
            <div className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#A1A1AA] bg-[#141417] border border-[#2a2a30]">
              <Loader2 className="w-3.5 h-3.5 text-[#A1A1AA] animate-spin" />
              <span>Loading creators from database...</span>
            </div>
          ) : creators.length > 0 ? (
            <button
              type="button"
              onClick={handleDeleteAllCreators}
              disabled={isDeletingAll}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold text-[#FF4D6D] hover:text-white bg-[#1A0B10] hover:bg-[#2A0F18] border border-rose-900/60 hover:border-[#C81E3C] transition cursor-pointer shadow-none disabled:opacity-50"

            >
              <Trash2 className="w-3.5 h-3.5 text-[#FF4D6D]" />
              <span>Delete All Creators ({creators.length})</span>
            </button>
          ) : null}

          {niches.length === 0 ? (
            <p className="text-[11px] text-center text-[#FF6B6B] font-medium leading-relaxed px-3 py-2 bg-[#2C0F14] border border-rose-900/60 rounded-lg flex items-center justify-center gap-1.5 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#FF6B6B]" />
              <span>Select a target niche to begin</span>
            </p>
          ) : selectedPlatforms.length === 0 ? (
            <p className="text-[11px] text-center text-[#FF6B6B] font-medium leading-relaxed px-3 py-2 bg-[#2C0F14] border border-rose-900/60 rounded-lg flex items-center justify-center gap-1.5 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#FF6B6B]" />
              <span>Select at least 1 platform to begin</span>
            </p>
          ) : (
            <p className="text-[11px] text-center text-[#71717A] leading-relaxed px-2">
              Scouts qualifying creator profiles for review in Step 2.
            </p>
          )}
        </div>
      </div>
    </div>

  </div>
  );
}
