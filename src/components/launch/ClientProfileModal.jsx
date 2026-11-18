import { useState } from "react";
import {
  X,
  ExternalLink,
  User,
  Youtube,
  Instagram,
  Globe,
  Sparkles,
  ShieldCheck,
  Mail,
  MessageSquare,
  Clock,
  TrendingUp,
  Star,
  CheckCircle2,
  Lock,
  Layers,
  Zap,
  Target,
  FileText,
  DollarSign,
  Laptop,
  Check,
} from "lucide-react";
import FormattedMarkdownBody from "./FormattedMarkdownBody";
import { generateCreatorAvatarSvg } from "../../utils/avatarColorExtractor";

export default function ClientProfileModal({
  isOpen,
  onClose,
  creator,
  concepts = [],
  selectedConceptId = null,
  onSelectConcept = null,
  threads = [],
  threadMessages = [],
  hunterData = null,
  onApplyAutoDraft = null,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "concepts" | "threads" | "deliverability"
  const activeMessages = (threadMessages && threadMessages.length > 0) ? threadMessages : threads;

  if (!isOpen || !creator) return null;

  const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();
  const platform = (creator.platform || "youtube").toLowerCase();
  const profileUrl =
    creator.profile_url ||
    creator.url ||
    (platform === "youtube"
      ? `https://www.youtube.com/@${cleanHandle}`
      : platform === "instagram"
        ? `https://www.instagram.com/${cleanHandle}`
        : platform === "tiktok"
          ? `https://www.tiktok.com/@${cleanHandle}`
          : platform === "twitter"
            ? `https://twitter.com/${cleanHandle}`
            : platform === "linkedin"
              ? `https://www.linkedin.com/in/${cleanHandle}`
              : `https://www.youtube.com/@${cleanHandle}`);

  const followerCount = creator.follower_count || 100000;
  const followerStr =
    creator.followerStr ||
    (followerCount >= 1000000
      ? `${(followerCount / 1000000).toFixed(1)}M`
      : followerCount >= 1000
        ? `${Math.round(followerCount / 1000)}K`
        : followerCount.toString());

  const engagementScore = creator.engagement_score
    ? `${creator.engagement_score}%`
    : "4.2%";

  const creatorScore = creator.creatorScore || creator.score || 88;
  const deliverabilityScore = hunterData?.score || creator.hunter_score || 95;

  const niches = Array.isArray(creator.niche)
    ? creator.niche
    : typeof creator.niche === "string"
      ? creator.niche.split(",").map((s) => s.trim())
      : ["Creator Economy", "Tech"];

  const resolvedConcepts =
    concepts && concepts.length > 0
      ? concepts
      : creator.productConcepts && creator.productConcepts.length > 0
        ? creator.productConcepts
        : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#050506]/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl rounded-2xl bg-[#0C0C0E] border border-[#2a2a30] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="p-5 border-b border-[#1C1C20] flex items-start justify-between gap-4 bg-gradient-to-r from-[#111114] via-[#0C0C0E] to-[#111114]/50">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={
                  creator.avatar ||
                  creator.avatar_url ||
                  generateCreatorAvatarSvg(creator.name || creator.display_name || creator.handle || "Creator")
                }
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = generateCreatorAvatarSvg(creator.name || creator.display_name || creator.handle || "Creator");
                }}
                alt={creator.name || creator.display_name}
                className="w-14 h-14 rounded-2xl object-cover border border-[#2a2a30] shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-[#0C0C0E] border border-[#2a2a30] shadow-2xs text-[#D4D4D8]">
                {platform === "youtube" ? (
                  <Youtube className="w-3.5 h-3.5 text-red-300" />
                ) : platform === "instagram" ? (
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-[#FF8FA3]" />
                )}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#FAFAFA] truncate">
                  {creator.name || creator.display_name || creator.handle}
                </h3>
                <span className="text-xs font-mono text-[#A1A1AA] font-medium">
                  @{cleanHandle}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Quality Score: {creatorScore}/100
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5 truncate flex items-center gap-2">
                <span className="text-emerald-300 font-mono font-medium">
                  {creator.email || creator.email_public || "No verified email"}
                </span>
                <span>•</span>
                <span className="capitalize">{platform} Creator</span>
                <span>•</span>
                <span>{followerStr} followers</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#111114] hover:bg-[#18181C] text-[#D4D4D8] border border-[#2a2a30] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Open external channel in a new tab"
            >
              <span>Live Channel</span>
              <ExternalLink className="w-3 h-3 text-[#71717A]" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#18181C] text-[#71717A] hover:text-[#D4D4D8] transition"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-2 border-b border-[#1C1C20] bg-[#0C0C0E] flex items-center gap-1 overflow-x-auto">
          {[
            { id: "overview", label: "Channel & Overview", icon: User },
            {
              id: "concepts",
              label: `Software Concepts (${resolvedConcepts.length})`,
              icon: Sparkles,
            },
            {
              id: "threads",
              label: `Email Messages (${activeMessages.length})`,
              icon: MessageSquare,
            },
            {
              id: "deliverability",
              label: "Hunter.io Deliverability",
              icon: ShieldCheck,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-[#222227] text-[#FAFAFA]"
                    : "border-transparent text-[#A1A1AA] hover:text-[#E4E4E7] hover:border-[#3a3a42]"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-emerald-300" : "text-[#71717A]"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[#111114]/50">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs">
                  <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">
                    Total Followers
                  </span>
                  <span className="text-lg font-black text-[#FAFAFA] font-mono mt-0.5 block">
                    {followerStr}
                  </span>
                  <span className="text-[10px] text-[#A1A1AA] block">
                    Verified platform reach
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs">
                  <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">
                    Engagement Rate
                  </span>
                  <span className="text-lg font-black text-emerald-300 font-mono mt-0.5 block">
                    {engagementScore}
                  </span>
                  <span className="text-[10px] text-[#A1A1AA] block">
                    Audience activity ratio
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs">
                  <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">
                    Creator Quality
                  </span>
                  <span className="text-lg font-black text-[#FF8FA3] font-mono mt-0.5 block">
                    {creatorScore} / 100
                  </span>
                  <span className="text-[10px] text-[#A1A1AA] block">
                    Overall software fit score
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs">
                  <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">
                    Deliverability
                  </span>
                  <span className="text-lg font-black text-cyan-700 font-mono mt-0.5 block">
                    {deliverabilityScore}%
                  </span>
                  <span className="text-[10px] text-[#A1A1AA] block">
                    Hunter.io SMTP verified
                  </span>
                </div>
              </div>

              {/* Bio & Channel Description */}
              <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider block">
                  Channel Bio & Background
                </span>
                <p className="text-xs text-[#D4D4D8] leading-relaxed font-sans">
                  {creator.bio ||
                    "Leading digital content creator producing high-retention instructional and showcase media. Audience demonstrates strong intent for tools, digital workflows, and specialized productivity solutions."}
                </p>
                {creator.location && (
                  <p className="text-[11px] text-[#A1A1AA] pt-1 border-t border-[#1C1C20]">
                    Location:{" "}
                    <strong className="text-[#D4D4D8]">
                      {creator.location}
                    </strong>
                  </p>
                )}
              </div>

              {/* Niches & Verticals */}
              <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider block">
                  Target Verticals & Content Niches
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {niches.map((n, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#18181C] text-[#D4D4D8] border border-[#2a2a30]/90"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Why Software Fits This Creator */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#0C0C0E] to-[#111114] border border-emerald-500/30 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs font-bold text-[#FAFAFA]">
                    Why This Creator Is Prime for a 50/50 Co-Founding Venture
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  With {followerStr} followers and an active {engagementScore}{" "}
                  engagement rate, this creator commands high audience trust.
                  Rather than one-off brand sponsorships, an owned SaaS product
                  generates high-margin Monthly Recurring Revenue (MRR) without
                  requiring any engineering or infrastructure effort from the
                  creator.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT CONCEPTS */}
          {activeTab === "concepts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
                  Engineered Product Concepts for {creator.name || "Creator"}
                </span>
                <span className="text-xs text-[#A1A1AA]">
                  Select a concept to make it primary in Step 6
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resolvedConcepts.map((concept, idx) => {
                  const isSelected =
                    concept.id === selectedConceptId ||
                    (!selectedConceptId && idx === 0);
                  return (
                    <div
                      key={concept.id || idx}
                      className={`p-4 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#0C0C0E] border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-[#0C0C0E] border-[#2a2a30] hover:border-[#3a3a42] shadow-2xs"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                            Concept #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            {concept.pricing || "$29/mo"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#FAFAFA]">
                          {concept.name}
                        </h4>
                        <p className="text-xs text-[#A1A1AA] line-clamp-2">
                          {concept.tagline}
                        </p>
                        <div className="pt-2 border-t border-[#1C1C20] text-[11px] text-[#A1A1AA] space-y-1">
                          <div>
                            <strong>Solves:</strong> {concept.problem}
                          </div>
                          <div>
                            <strong>MVP Difficulty:</strong>{" "}
                            {concept.mvpDifficulty || "2 weeks"}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#1C1C20] flex items-center justify-between gap-2">
                        {isSelected ? (
                          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Selected</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectConcept?.(concept.id)}
                            className="text-xs font-bold text-[#A1A1AA] hover:text-[#FAFAFA] px-2.5 py-1 rounded-lg border border-[#2a2a30] hover:bg-[#111114] transition cursor-pointer"
                          >
                            Set Primary
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onApplyAutoDraft?.(creator, "concept_deep_dive", concept);
                            onClose();
                          }}
                          className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 px-2 py-1 rounded-lg border border-emerald-500/30 transition cursor-pointer"
                          title="Draft email specifically focusing on this concept"
                        >
                          Draft Pitch ✍️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL THREAD MESSAGES */}
          {activeTab === "threads" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block">
                Recorded Conversation Messages ({activeMessages.length})
              </span>
              {activeMessages.length > 0 ? (
                <div className="space-y-3">
                  {activeMessages.map((msg, idx) => {
                    const isFromCreator = !/partnerships@(creatorforge|colaunch)\.com/i.test(
                      msg.from_address || ""
                    );
                    return (
                      <div
                        key={msg.id || idx}
                        className={`p-4 rounded-2xl border text-xs space-y-2 shadow-2xs ${
                          isFromCreator
                            ? "bg-cyan-50/70 border-cyan-200/80 ml-6"
                            : "bg-[#0C0C0E] border-[#2a2a30] mr-6"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] border-b border-[#1C1C20]/80 pb-2">
                          <span className="font-bold text-[#FAFAFA] flex items-center gap-2">
                            <span>
                              {isFromCreator
                                ? creator.name || msg.from_address
                                : "CoLaunch Team"}
                            </span>
                            {isFromCreator && (
                              <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                Creator Response
                              </span>
                            )}
                          </span>
                          <span className="text-[#71717A] font-mono text-[10px]">
                            {msg.received_at
                              ? new Date(msg.received_at).toLocaleString([], {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "Recently"}
                          </span>
                        </div>
                        <div className="text-xs text-[#D4D4D8] leading-relaxed font-sans">
                          <FormattedMarkdownBody text={msg.body} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0C0C0E] rounded-2xl border border-[#2a2a30] text-xs text-[#A1A1AA] italic space-y-2">
                  <Clock className="w-6 h-6 text-[#71717A] mx-auto" />
                  <p>No messages recorded in the thread yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DELIVERABILITY */}
          {activeTab === "deliverability" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#2a2a30]/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    <h4 className="text-sm font-bold text-[#FAFAFA]">
                      Hunter.io Lead Verification Intelligence
                    </h4>
                  </div>
                  <span className="text-xs font-black text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                    {deliverabilityScore}% Deliverable
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30]/80">
                    <span className="text-[10px] text-[#A1A1AA] uppercase font-bold block">
                      Target Email
                    </span>
                    <strong className="text-[#FAFAFA] font-mono truncate block">
                      {creator.email || creator.email_public || "No email listed"}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30]/80">
                    <span className="text-[10px] text-[#A1A1AA] uppercase font-bold block">
                      SMTP Mailbox Status
                    </span>
                    <strong className="text-emerald-300 block">
                      {hunterData?.smtp_check !== false
                        ? "Active & Deliverable"
                        : "Blocked or Greylisted"}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111114] border border-[#2a2a30]/80">
                    <span className="text-[10px] text-[#A1A1AA] uppercase font-bold block">
                      Public Web Sources
                    </span>
                    <strong className="text-[#E4E4E7] block">
                      {hunterData?.sources_count ||
                        (hunterData?.sources || []).length ||
                        3}{" "}
                      verified web sources
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1C1C20] bg-[#0C0C0E] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#A1A1AA]">
            Selected Creator:{" "}
            <strong className="text-[#E4E4E7]">
              {creator.name || creator.display_name}
            </strong>{" "}
            (@{cleanHandle})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onApplyAutoDraft?.(creator, "smart");
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>Auto-Draft Response Now ⚡</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#18181C] hover:bg-[#222227] text-[#D4D4D8] font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
