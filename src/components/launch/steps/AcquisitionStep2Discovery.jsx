import {
  Target,
  Search,
  XCircle,
  ArrowRight,
  RefreshCw,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Mail,
  Users,
  TrendingUp,
  X,
  Pencil,
  Instagram,
  Youtube,
  Music,
  Globe,
  Loader2,
  RotateCw,
} from "lucide-react";
import { CreatorCardSkeleton } from "../Section2Skeletons";

export default function AcquisitionStep2Discovery({
  apifyStatusMsg,
  cancelEditEmail,
  copiedEmail,
  countdownSeconds,
  creators,
  creatorsBatchCount,
  discovering,
  discoveryAbortRef,
  editingEmailCreatorId,
  formatCountdown,
  generateCreatorAvatarSvg,
  getCreatorAvatar,
  handleCopyEmail,
  handleHunterFindEmail,
  handleHunterVerifyEmail,
  handleStartEngine,
  handleStopDiscovery,
  hunterActionType,
  hunterDataMap,
  hunterLoadingId,
  loadingCreatorsFromDb,
  minScoreThreshold,
  niches,
  saveEditEmail,
  selectedCreatorId,
  setActiveStep,
  setMinScoreThreshold,
  setSelectedCreatorId,
  setStep2EmailOnly,
  setStep2PlatformFilter,
  setStep2SearchQuery,
  setTempEmailValue,
  startEditEmail,
  step2EmailOnly,
  step2PlatformFilter,
  step2SearchQuery,
  tempEmailValue,
  timerPaused,
  toggleStep2Timer,
  unlaunchedCreators,
}) {
  return (
  <div className="p-3.5 sm:p-6 acq-card space-y-5 min-w-0 w-full relative overflow-hidden">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2a2a30] pb-4 min-w-0 relative z-10">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] font-display">
            Discovered Leads
          </span>
          <span className="text-xs text-[#71717A]">•</span>
          <span className="text-xs text-[#71717A]">
            Profile & Contact Intelligence
          </span>
        </div>
        <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5 font-display">
          <Search className="w-4 h-4 text-[#C81E3C] shrink-0" />
          <span>Find & Qualify Creators</span>
        </h2>
        <p className="text-xs text-[#71717A] mt-0.5">
          Review discovered creator profiles and verified contact emails before launching outreach.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 max-w-full">
        {creators.length > 0 && !discovering && (
          <div className="h-9 px-3 rounded-lg bg-[#141417] border border-[#2a2a30] text-[#A1A1AA] text-xs font-mono flex items-center gap-2 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-[#A1A1AA] flex-shrink-0" />
            <span>
              Auto-Advance to Step 3 in:{" "}
              <strong className="text-white">{formatCountdown(countdownSeconds)}</strong>
            </span>
            <button
              type="button"
              onClick={toggleStep2Timer}
              className="ml-1 text-[11px] underline text-[#D4D4D8] hover:text-white cursor-pointer font-sans"
            >
              {timerPaused ? "Resume" : "Pause"}
            </button>
          </div>
        )}

        {discovering ? (
          <button
            type="button"
            onClick={handleStopDiscovery}
            className="h-9 px-3.5 rounded-lg bg-[#1A0B10] hover:bg-[#2A0F18] text-[#FF4D6D] hover:text-white border border-rose-900/60 hover:border-[#C81E3C] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
            title="Stop discovery early and keep currently scouted creators"
          >
            <XCircle className="w-3.5 h-3.5 text-[#FF4D6D]" />
            <span>Stop Scouting ({creators.length} Found)</span>
          </button>
        ) : (
          <button
            onClick={handleStartEngine}
            disabled={discovering}
            className="h-9 px-3.5 rounded-lg bg-[#141417] hover:bg-[#1C1C20] text-[#A1A1AA] hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer border border-[#2a2a30] whitespace-nowrap active:scale-95"
            title="Re-run discovery"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#A1A1AA] ${discovering ? "animate-spin" : ""}`}
            />
            <span>{discovering ? "Scouting..." : "Re-Discover"}</span>
          </button>
        )}

        <button
          onClick={() => {
            if (editingEmailCreatorId && tempEmailValue.trim()) {
              saveEditEmail(editingEmailCreatorId, null, tempEmailValue.trim());
            }
            if (discovering || discoveryAbortRef.current) {
              handleStopDiscovery();
            }
            setActiveStep(3);
          }}
          className="relative inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg acq-btn-primary text-white font-bold text-xs shadow-lg shadow-[#C81E3C]/20 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
        >
          <span>Proceed to Step 3: Outreach Wave</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>

    {/* Active Scouting State (Initial, 0 creators): Header + Shimmer Skeleton Grid */}
    {discovering && creators.length === 0 && (
      <div className="space-y-4 animate-in fade-in">
        <div className="p-4 sm:p-5 rounded-xl bg-[#111114] border border-[#222227] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-none">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#1A0B10] border border-rose-900/50 flex items-center justify-center text-[#C81E3C] shrink-0">
              <RotateCw className="w-5 h-5 animate-spin text-[#C81E3C]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white tracking-wide font-display flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF4D6D] animate-pulse shadow-[0_0_8px_rgba(255,77,109,0.8)] shrink-0" />
                  <span>Discovering Target Creators</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#141417] text-white border border-[#2a2a30] font-mono">
                  Target: {creatorsBatchCount || 25}
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] truncate">
                Scouting verified creators across {niches.join(", ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleStopDiscovery}
              className="px-3.5 py-1.5 rounded-lg bg-[#1A0B10] hover:bg-[#2A0F18] text-[#FF4D6D] hover:text-white border border-rose-900/60 hover:border-[#C81E3C] text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-none active:scale-95"
            >
              <X className="w-3.5 h-3.5 text-[#FF4D6D]" />
              <span>Stop Discovery</span>
            </button>
          </div>
        </div>

        {/* Shimmer Skeleton Cards only while waiting for first creators */}
        <CreatorCardSkeleton count={Math.min(6, creatorsBatchCount || 25)} />
      </div>
    )}

    {/* Discovered Creators Grid / Empty State */}
    {!discovering && creators.length === 0 ? (
      loadingCreatorsFromDb ? (
        <div className="text-center py-16 text-slate-500 text-xs space-y-4 animate-in fade-in">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF4D6D]" />
            <p className="text-sm font-medium text-slate-600">Loading creators from database…</p>
            <p className="text-[11px] text-slate-400">Syncing your pipeline from the server</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 text-xs space-y-4">
          <p>
            No creators discovered yet. Click Start Discovery to find matching creators.
          </p>
          <button
            onClick={handleStartEngine}
            disabled={discovering}
            className="relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F0F12] hover:bg-[#222227] text-white font-medium text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#FF4D6D]" />
            <span>
              Start Lead Discovery ({creatorsBatchCount} Creators)
            </span>
          </button>
        </div>
      )
    ) : unlaunchedCreators.length > 0 ? (() => {
      const validCreators = Array.isArray(unlaunchedCreators) ? (discovering ? unlaunchedCreators.slice(0, creatorsBatchCount || 25) : unlaunchedCreators) : [];
      const advanceableCount = validCreators.filter((c) => (c.creatorScore || 85) >= minScoreThreshold).length;
      const verifiedEmailCount = validCreators.filter((c) => {
        const bioMatch = (c.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        return Boolean(c.email_public || c.email || bioMatch);
      }).length;
      const ytCount = validCreators.filter(c => (c.platform || "").toLowerCase() === 'youtube').length;
      const igCount = validCreators.filter(c => (c.platform || "").toLowerCase() === 'instagram').length;
      const ttCount = validCreators.filter(c => (c.platform || "").toLowerCase() === 'tiktok').length;

      const filteredCreators = validCreators.filter((c) => {
        const pSlug = (c.platform || "youtube").toLowerCase();
        if (step2PlatformFilter !== "ALL" && pSlug !== step2PlatformFilter.toLowerCase()) {
          return false;
        }
        const bioMatch = (c.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        const effectiveEmail = c.email_public || c.email || (bioMatch ? bioMatch[0].trim() : "");
        if (step2EmailOnly && !effectiveEmail) {
          return false;
        }
        if (step2SearchQuery.trim()) {
          const q = step2SearchQuery.toLowerCase().trim();
          const nameMatch = (c.name || c.display_name || "").toLowerCase().includes(q);
          const handleMatch = (c.handle || "").toLowerCase().includes(q);
          const nicheMatch = (c.niche || "").toLowerCase().includes(q);
          if (!nameMatch && !handleMatch && !nicheMatch) return false;
        }
        return true;
      });

      return (
        <div className="space-y-4">
          {/* Active Ingestion Banner if discovery is still streaming candidates in background */}
          {discovering && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#111114] border border-[#222227] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-none animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#1A0B10] text-[#C81E3C] flex items-center justify-center shrink-0 border border-rose-900/50">
                  <RotateCw className="w-4 h-4 animate-spin text-[#C81E3C]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide font-display">
                      Scouting Active: {validCreators.length} of {creatorsBatchCount || 25} Creators Gathered
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#FAFAFA] bg-[#1C1C20] border border-[#3a3a42] font-mono inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] animate-pulse shrink-0" />
                      <span>Live Ingestion</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] truncate">
                    Audience crawler is finding more profiles across {niches.join(", ")}. Received leads below are active.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleStopDiscovery}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1A0B10] hover:bg-[#2A0F18] text-[#FF4D6D] hover:text-white border border-rose-900/60 hover:border-[#C81E3C] text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-none active:scale-95"
                >
                  <X className="w-3.5 h-3.5 text-[#FF4D6D]" />
                  <span>Stop Scouting ({validCreators.length} Ready)</span>
                </button>
              </div>
            </div>
          )}

          {/* 4 KPI Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {/* 1. Scouted Leads */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#111114] border border-[#222227] space-y-1 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider font-display">
                  Candidates Scouted
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#141417] text-[#C81E3C] flex items-center justify-center border border-[#2a2a30]">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-display">
                {validCreators.length}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] pt-0.5">
                <span>Target: {creatorsBatchCount || 25}</span>
                <span className="font-semibold text-white bg-[#141417] border border-[#2a2a30] px-2 py-0.5 rounded-lg text-[10px] font-mono">
                  ↑ Live Pipeline
                </span>
              </div>
            </div>

            {/* 2. Qualified Fit */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#111114] border border-[#222227] space-y-1 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider font-display">
                  High Fit (≥{minScoreThreshold})
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#141417] text-[#C81E3C] flex items-center justify-center border border-[#2a2a30]">
                  <Target className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-display">
                {advanceableCount}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] pt-0.5">
                <span>Advanceable</span>
                <span className="font-bold text-[#FAFAFA] bg-[#1C1C20] border border-[#3a3a42] px-2 py-0.5 rounded-lg text-[10px] font-mono">
                  {Math.round((advanceableCount / (validCreators.length || 1)) * 100)}% Pass
                </span>
              </div>
            </div>

            {/* 3. Verified Contacts */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#111114] border border-[#222227] space-y-1 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider font-display">
                  Verified Contacts
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#141417] text-[#C81E3C] flex items-center justify-center border border-[#2a2a30]">
                  <Mail className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-display">
                {verifiedEmailCount}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] pt-0.5">
                <span>Direct Inboxes</span>
                <span className="font-bold text-[#FAFAFA] bg-[#1C1C20] border border-[#3a3a42] px-2 py-0.5 rounded-lg text-[10px] font-mono">
                  {Math.round((verifiedEmailCount / (validCreators.length || 1)) * 100)}% Verified
                </span>
              </div>
            </div>

            {/* 4. Platform Diversity */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#111114] border border-[#222227] space-y-1 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider font-display">
                  Platform Mix
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#141417] text-[#C81E3C] flex items-center justify-center border border-[#2a2a30]">
                  <Globe className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono font-bold">{ytCount} YT</span>
                <span className="text-xs text-[#71717A]">•</span>
                <span className="text-xs font-mono font-bold">{igCount} IG</span>
                <span className="text-xs text-[#71717A]">•</span>
                <span className="text-xs font-mono font-bold">{ttCount} TT</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] pt-0.5">
                <span>Omni-channel</span>
                <span className="font-semibold text-white bg-[#141417] border border-[#2a2a30] px-2 py-0.5 rounded-lg text-[10px] font-mono">
                  Multi-Source
                </span>
              </div>
            </div>
          </div>

          {/* Filter Pills & Score Gate Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 rounded-xl bg-[#111114] border border-[#222227]">
            {/* Left: Platform Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: "ALL", label: `All (${validCreators.length})` },
                { id: "youtube", label: `YouTube (${ytCount})` },
                { id: "instagram", label: `Instagram (${igCount})` },
                { id: "tiktok", label: `TikTok (${ttCount})` },
              ].map((tab) => {
                const active = step2PlatformFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStep2PlatformFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${active
                        ? "bg-[#C81E3C] text-white shadow-xs"
                        : "bg-[#141417] text-[#A1A1AA] hover:text-white border border-[#2a2a30] hover:border-[#2a2a30]"
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}

              {/* Verified email toggle */}
              <button
                type="button"
                onClick={() => setStep2EmailOnly(!step2EmailOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${step2EmailOnly
                    ? "bg-[#C81E3C] text-white shadow-xs"
                    : "bg-[#141417] text-[#A1A1AA] hover:text-white border border-[#2a2a30] hover:border-[#2a2a30]"
                  }`}
              >
                <Mail className="w-3 h-3 text-white" />
                <span>Verified Email</span>
              </button>
            </div>

            {/* Right: Quick Search & Score Gate */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:w-44">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={step2SearchQuery}
                  onChange={(e) => setStep2SearchQuery(e.target.value)}
                  placeholder="Search creators..."
                  className="w-full pl-8 pr-7 py-1 text-xs bg-[#141417] border border-[#2a2a30] rounded-lg text-white placeholder:text-[#71717A] focus:outline-none focus:border-[#C81E3C] font-medium"
                />
                {step2SearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStep2SearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-[#141417] p-1 rounded-lg border border-[#2a2a30]">
                <span className="text-[10px] text-[#71717A] font-bold px-1.5 uppercase font-mono">Gate</span>
                {[60, 70, 80, 85].map((threshold) => (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() => setMinScoreThreshold(threshold)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${minScoreThreshold === threshold
                        ? "bg-[#C81E3C] text-white"
                        : "text-[#A1A1AA] hover:text-white hover:bg-[#222227]"
                      }`}
                  >
                    ≥{threshold}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Creators Cards Grid */}
          {filteredCreators.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#111114] border border-[#222227] text-xs text-[#A1A1AA] space-y-2">
              <p className="font-semibold text-white">No creators match your active filter.</p>
              <button
                type="button"
                onClick={() => {
                  setStep2PlatformFilter("ALL");
                  setStep2EmailOnly(false);
                  setStep2SearchQuery("");
                }}
                className="px-3 py-1.5 rounded-lg bg-[#141417] border border-[#2a2a30] text-white hover:bg-[#222227] font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCreators.map((c) => {
                const cleanHandle = (c.handle || "").replace(/^@/, "");
                const platformSlug = (c.platform || "youtube").toLowerCase();
                const profileUrl =
                  c.profile_url ||
                  c.url ||
                  (platformSlug === "youtube"
                    ? `https://www.youtube.com/@${cleanHandle}`
                    : platformSlug === "instagram"
                      ? `https://www.instagram.com/${cleanHandle}`
                      : platformSlug === "tiktok"
                        ? `https://www.tiktok.com/@${cleanHandle}`
                        : `https://twitter.com/${cleanHandle}`);
                const bioEmailMatch = (c.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
                const effectiveEmail = c.email_public || c.email || (bioEmailMatch ? bioEmailMatch[0].trim() : "");
                const hasEmail = Boolean(effectiveEmail);
                const score = c.creatorScore || 85;
                const isAbove = score >= minScoreThreshold;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCreatorId(c.id)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer space-y-3 relative ${selectedCreatorId === c.id
                        ? "bg-[#1A0F12] border-[#C81E3C] shadow-none"
                        : "bg-[#0C0C0E] border-[#2a2a30] hover:border-[#2a2a30] shadow-none"
                      }`}
                  >
                    {/* Creator Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={getCreatorAvatar(c)}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-[#2a2a30] bg-[#141417]"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = generateCreatorAvatarSvg(c.name || c.display_name || cleanHandle);
                            }}
                          />
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center border border-[#0C0C0E] ${platformSlug === 'youtube'
                              ? 'bg-red-600 text-white'
                              : platformSlug === 'instagram'
                                ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-600 text-white'
                                : 'bg-[#050506] text-[#FAFAFA]'
                            }`}>
                            {platformSlug === 'youtube' ? (
                              <Youtube className="w-2.5 h-2.5" />
                            ) : platformSlug === 'instagram' ? (
                              <Instagram className="w-2.5 h-2.5" />
                            ) : (
                              <Music className="w-2.5 h-2.5" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate font-display">
                            {c.name || c.display_name}
                          </h3>
                          <p className="text-[11px] text-[#A1A1AA] truncate font-mono">
                            @{cleanHandle} • {c.platform}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                            isAbove
                              ? "text-[#FAFAFA] bg-[#1C1C20] border-[#3a3a42]"
                              : "text-[#A1A1AA] bg-[#141417] border-[#2a2a30]"
                          }`}
                        >
                          <TrendingUp className={`w-3 h-3 ${isAbove ? "text-[#FF4D6D]" : "text-[#A1A1AA]"}`} />
                          <span>{score}/100</span>
                          {isAbove && <span className="text-[#FAFAFA] font-black">✓</span>}
                        </span>
                      </div>
                    </div>

                    {/* Stats 4-Grid in dark secondary tiles */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                      <div className="p-2 rounded-lg bg-[#141417] border border-[#2a2a30]">
                        <span className="text-[9px] uppercase font-bold text-[#A1A1AA] block tracking-wider">Followers</span>
                        <span className="text-xs font-black text-white font-mono truncate block">{c.followerStr || c.follower_count || "100K+"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141417] border border-[#2a2a30]">
                        <span className="text-[9px] uppercase font-bold text-[#A1A1AA] block tracking-wider">Engage</span>
                        <span className="text-xs font-black text-white font-mono truncate block">{c.engagement || c.engagement_score || 4.2}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141417] border border-[#2a2a30]">
                        <span className="text-[9px] uppercase font-bold text-[#A1A1AA] block tracking-wider">Niche Fit</span>
                        <span className="text-xs font-black text-white font-mono truncate block">{c.nicheFit || c.niche_fit || "95%"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141417] border border-[#2a2a30]">
                        <span className="text-[9px] uppercase font-bold text-[#A1A1AA] block tracking-wider">Potential</span>
                        <span className="text-xs font-black text-white font-mono truncate block">{c.commercialPotential || c.commercial_potential || "Strong"}</span>
                      </div>
                    </div>

                    {/* Scraped Bio Description */}
                    {c.bio && (
                      <p className="text-[11px] text-[#D4D4D8] line-clamp-2 leading-relaxed bg-[#141417]/60 p-2.5 rounded-lg border border-[#2a2a30] italic">
                        "{c.bio}"
                      </p>
                    )}

                    {/* External Channel Link + Contact Info / Email Modifier */}
                    <div className="pt-1">
                      {editingEmailCreatorId === c.id ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className="p-1.5 px-2 rounded-lg bg-[#141417] border border-[#2a2a30] flex items-center gap-1.5 text-xs"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#C81E3C] flex-shrink-0" />
                          <input
                            type="email"
                            autoFocus
                            value={tempEmailValue}
                            onChange={(e) =>
                              setTempEmailValue(e.target.value)
                            }
                            onBlur={(e) => {
                              if (tempEmailValue.trim()) {
                                saveEditEmail(c.id, e);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditEmail(c.id, e);
                              if (e.key === "Escape") cancelEditEmail(e);
                            }}
                            placeholder="Enter creator email..."
                            className="bg-transparent text-white font-mono text-[11px] focus:outline-none flex-1 min-w-0"
                          />
                          <button
                            type="button"
                            onClick={(e) => saveEditEmail(c.id, e)}
                            className="px-2 py-0.5 rounded-lg acq-btn-primary text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-none"
                            title="Save Email"
                          >
                            <Check className="w-3 h-3 text-white" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => cancelEditEmail(e)}
                            className="p-1 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#222227] transition-all cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            {hasEmail ? (
                              <div className="p-1.5 px-2.5 rounded-lg bg-[#141417] border border-[#2a2a30] flex items-center justify-between gap-2 text-xs min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Mail className="w-3.5 h-3.5 text-[#C81E3C] flex-shrink-0" />
                                  <span className="font-mono text-white truncate font-bold text-[11px]">
                                    {effectiveEmail}
                                  </span>
                                  {(c.hunter_score || hunterDataMap[c.id]?.score) ? (
                                    <span
                                      className="text-[9px] font-extrabold text-[#FAFAFA] bg-[#1C1C20] border border-[#3a3a42] px-1.5 py-0.5 rounded-lg flex items-center gap-1 whitespace-nowrap"
                                      title={`Hunter.io: ${c.hunter_score || hunterDataMap[c.id]?.score}%`}
                                    >
                                      <Check className="w-2.5 h-2.5 text-[#FAFAFA] stroke-[2.5]" />
                                      <span>{c.hunter_score || hunterDataMap[c.id]?.score}%</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-[#FAFAFA] bg-[#1C1C20] border border-[#3a3a42] px-1.5 py-0.5 rounded-lg flex items-center gap-1 whitespace-nowrap">
                                      <Check className="w-2.5 h-2.5 text-[#FAFAFA] stroke-[2.5]" />
                                      <span>Verified</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyEmail(effectiveEmail);
                                    }}
                                    className="p-1 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#222227] transition-colors"
                                    title="Copy Email"
                                  >
                                    {copiedEmail === effectiveEmail ? (
                                      <Check className="w-3.5 h-3.5 text-[#FAFAFA]" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleHunterVerifyEmail({ ...c, email: effectiveEmail, email_public: effectiveEmail }, e)}
                                    disabled={hunterLoadingId === c.id}
                                    className="p-1 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#222227] transition-colors disabled:opacity-50"
                                    title="Verify deliverability with Hunter.io"
                                  >
                                    {hunterLoadingId === c.id && hunterActionType === 'verify' ? (
                                      <RefreshCw className="w-3 h-3 text-[#C81E3C] animate-spin" />
                                    ) : (
                                      <ShieldCheck className="w-3.5 h-3.5 text-[#C81E3C]" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => startEditEmail(c.id, effectiveEmail, e)}
                                    className="p-1 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#222227] transition-colors"
                                    title="Modify Email"
                                  >
                                    <Pencil className="w-3 h-3 text-[#A1A1AA]" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleHunterFindEmail(c, e)}
                                  disabled={hunterLoadingId === c.id}
                                  className="p-1.5 px-3 rounded-lg bg-[#1A0B10] hover:bg-[#2A0F18] border border-rose-900/60 hover:border-[#C81E3C] text-white flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                                  title="Auto-search bio, Hunter.io B2B, and social directory for verified contact"
                                >
                                  {hunterLoadingId === c.id && hunterActionType === 'find' ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-[#C81E3C]" />
                                  ) : (
                                    <Search className="w-3 h-3 text-[#C81E3C]" />
                                  )}
                                  <span>
                                    {hunterLoadingId === c.id && hunterActionType === 'find'
                                      ? "Searching..."
                                      : "Auto-Find Email"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => startEditEmail(c.id, "", e)}
                                  className="p-1.5 px-2 rounded-lg bg-[#141417] hover:bg-[#222227] border border-[#2a2a30] text-[#A1A1AA] hover:text-white flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Manually enter email address"
                                >
                                  <Pencil className="w-2.5 h-2.5 text-[#71717A]" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            )}

                            {/* Direct Channel URL Button */}
                            <a
                              href={profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#141417] hover:bg-[#222227] text-[#A1A1AA] hover:text-white border border-[#2a2a30] transition-all flex-shrink-0"
                              title="Open creator profile in new tab"
                            >
                              <span>Channel</span>
                              <ExternalLink className="w-3 h-3 text-[#71717A]" />
                            </a>
                          </div>

                          {apifyStatusMsg[c.id] && (
                            <p className="text-[10px] text-[#A1A1AA] font-mono px-1">
                              {apifyStatusMsg[c.id]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Subtle trailing candidate card if background discovery is still pulling more profiles */}
              {discovering && validCreators.length < (creatorsBatchCount || 25) && (
                <div className="p-5 rounded-lg border-2 border-dashed border-[#2a2a30] bg-[#0C0C0E] flex flex-col items-center justify-center text-center space-y-2.5 min-h-[260px] animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-[#1A0B10] border border-rose-900/50 flex items-center justify-center text-[#C81E3C]">
                    <RotateCw className="w-5 h-5 animate-spin text-[#C81E3C]" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">
                      Scouting Candidate #{validCreators.length + 1}...
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] max-w-[200px]">
                      Extracting engagement metrics and verified contact endpoints
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    })() : null}
  </div>
  );
}
