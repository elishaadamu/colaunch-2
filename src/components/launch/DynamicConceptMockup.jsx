import React, { useState } from "react";
import {
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  Users,
  Activity,
  Zap,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Star,
  Monitor,
  Command,
  Bot,
  Database,
  BarChart3,
  Calendar,
  Check,
  Terminal,
  Eye,
  X,
  Globe,
  ChevronRight,
  MessageSquare,
  Shield,
  Rocket,
  Search,
  Pencil,
  Sliders,
  Heart,
  BookOpen,
  FolderOpen
} from "lucide-react";
import { ConceptLandingModal } from "./ConceptLandingPage";
import { getFriendlyColorName, hexToRgba } from "../../utils/avatarColorExtractor";

/**
 * CoLaunch Studio Color Scheme
 * High-contrast, prestigious venture studio palettes (Emerald, Forge Lime, Ocean Cyan, CoLaunch Blue, Venture Amber, Hot Coral)
 * Guaranteed readability and contrast against dark slate / obsidian canvases.
 */
export const BRAND_COLORS = [
  { name: "Creator Crimson", hex: "#c81e3c", bg: "bg-[#c81e3c] text-white", text: "text-white", border: "border-[#c81e3c]/40", glow: "rgba(200, 30, 60, 0.35)" },
  { name: "Electric Emerald", hex: "#10B981", bg: "bg-emerald-600", text: "text-emerald-400", border: "border-emerald-500/40", glow: "rgba(16, 185, 129, 0.35)" },
  { name: "Forge Lime", hex: "#C8FF3D", bg: "bg-[#C8FF3D]", text: "text-[#C8FF3D]", border: "border-[#C8FF3D]/40", glow: "rgba(200, 255, 61, 0.3)" },
  { name: "Ocean Cyan", hex: "#06B6D4", bg: "bg-cyan-600", text: "text-cyan-400", border: "border-cyan-500/40", glow: "rgba(6, 182, 212, 0.35)" },
  { name: "CoLaunch Blue", hex: "#3B82F6", bg: "bg-blue-600", text: "text-blue-400", border: "border-blue-500/40", glow: "rgba(59, 130, 246, 0.35)" },
  { name: "Venture Amber", hex: "#F59E0B", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/40", glow: "rgba(245, 158, 11, 0.35)" },
  { name: "Hot Coral", hex: "#F43F5E", bg: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/40", glow: "rgba(244, 63, 94, 0.35)" },
];

/**
 * Ensures accent colors on dark backgrounds are always vibrant and legible.
 * Never allows pitch dark navy / obsidian (#0F172A, #1E293B, #000000) as an accent.
 */
export function sanitizeAccentColor(hex) {
  if (!hex) return BRAND_COLORS[0].hex;
  const clean = String(hex).replace("#", "").toLowerCase().trim();
  const darkTones = ["0f172a", "1e293b", "090b10", "0a0e17", "000000", "111827", "18181b", "27272a", "334155", "475569"];
  if (darkTones.includes(clean)) {
    return "#06B6D4"; // Ocean Cyan
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.25) {
    return "#10B981"; // Electric Emerald
  }
  return String(hex).startsWith("#") ? hex : `#${hex}`;
}

/**
 * Computes optimal foreground text color (black vs white) for a given accent background.
 */
export function getContrastTextColor(hex) {
  const safe = sanitizeAccentColor(hex);
  const clean = safe.replace("#", "").toLowerCase();
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? "#0A0E17" : "#FFFFFF";
}

export function getBrandColorObj(colorInput) {
  if (!colorInput) return BRAND_COLORS[0];
  const sanitizedInput = sanitizeAccentColor(colorInput);
  const found = BRAND_COLORS.find(
    (c) =>
      c.name.toLowerCase() === String(sanitizedInput).toLowerCase() ||
      c.hex.toLowerCase() === String(sanitizedInput).toLowerCase()
  );
  if (found) return found;

  const hex = sanitizedInput;
  const friendlyName = getFriendlyColorName(hex);

  return {
    name: friendlyName || "Creator Custom",
    hex: hex,
    bg: "bg-slate-900",
    text: "text-white",
    border: `${hex}50`,
    glow: hexToRgba(hex, 0.35),
    isCustom: true,
  };
}

/**
 * Dynamic Concept Mockup
 * Renders authentic, high-converting product Landing Page Hero Mockups
 * styled in the creator's branding color and niche visual style, directly matching
 * the reference examples (Coachly, Puppy Borrow, study100).
 */
export default function DynamicConceptMockup({
  concept,
  creator,
  conceptIndex = 0,
  theme,
  onOpenDeck,
  onEditConcept
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const brandColorObj = theme
    ? {
        name: theme.name,
        hex: sanitizeAccentColor(theme.primaryHex),
        glow: theme.glow || `${sanitizeAccentColor(theme.primaryHex)}35`,
        bg: theme.badgeBg,
        text: theme.badgeText,
        border: theme.borderActive || sanitizeAccentColor(theme.primaryHex),
      }
    : getBrandColorObj(concept?.brandColor || (conceptIndex === 0 ? "#10B981" : conceptIndex === 1 ? "#06B6D4" : "#F59E0B"));
  const accentHex = sanitizeAccentColor(brandColorObj.hex);
  const contrastText = getContrastTextColor(accentHex);
  const creatorName = creator?.name || creator?.display_name || "Creator";
  const firstName = creatorName.split(" ")[0];
  const niche = creator?.niche || "Creator Economy";

  const rawAppUrl =
    concept?.mockup?.appUrl ||
    concept?.appUrl ||
    `${(concept?.name || firstName).toLowerCase().replace(/[^a-z0-9]/g, "")}.app`;
  const appUrl = (rawAppUrl || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/dashboard\/?$/i, "")
    .replace(/\/+$/, "");

  // Determine distinct visual mockup archetype (matches Deck 1, Deck 2, Deck 3)
  const resolvedMockupType = (() => {
    if (concept?.isModifiedByAdmin && concept?.mockupType) {
      return concept.mockupType;
    }
    const raw = concept?.mockupType;
    if (conceptIndex === 0) {
      return raw === "ai_copilot" ? "ai_copilot" : "saas_os";
    }
    if (conceptIndex === 1) {
      return raw === "saas_os" ? "saas_os" : "ai_copilot";
    }
    return "knowledge_hub";
  })();

  const mockupType = resolvedMockupType;

  const rawCustomImg = (concept?.customImageUrl || concept?.imageUrl || concept?.mockup?.imageUrl || "").trim();
  const hasRealCustomImg = Boolean(
    rawCustomImg &&
    !rawCustomImg.includes("/api/outreach/concept-card-image") &&
    !rawCustomImg.includes("images.unsplash.com")
  );
  const customImageUrl = hasRealCustomImg ? rawCustomImg : null;

  return (
    <>
      <div
        className="rounded-xl bg-[#080A0E] border border-slate-800/90 p-2.5 relative overflow-hidden flex flex-col justify-between shadow-md space-y-2.5 transition-all duration-300 group"
        style={{
          boxShadow: `0 6px 24px -4px ${brandColorObj.glow}`,
          borderColor: `${accentHex}50`
        }}
      >
        {/* Top Window Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-300">
            <Monitor className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{concept.name || "Product Preview"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="text-[8.5px] font-bold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-all flex items-center gap-1"
              style={{
                color: accentHex,
                backgroundColor: `${accentHex}1a`,
                borderColor: `${accentHex}45`
              }}
              title="Click to view interactive full landing page preview"
            >
              <span>Landing Page</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* ── Realistic Product Landing Page Hero Canvas ── */}
        <div
          className="relative rounded-lg overflow-hidden border border-slate-800/90 min-h-[225px] sm:min-h-[240px] flex flex-col justify-between p-3 select-none transition-all duration-300"
          style={{
            background: mockupType === "ai_copilot"
              ? `radial-gradient(ellipse at 50% 0%, ${accentHex}20 0%, #070A0F 75%)`
              : mockupType === "knowledge_hub"
              ? `radial-gradient(ellipse at 50% 0%, ${accentHex}24 0%, #080A0E 75%)`
              : `radial-gradient(ellipse at 50% 0%, ${accentHex}25 0%, #06080C 75%)`
          }}
        >
          {/* If custom image provided, display it */}
          {customImageUrl ? (
            <div className="absolute inset-0 z-0">
              <img
                src={customImageUrl}
                alt={concept.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>
          ) : (
            <div className="relative z-10 w-full h-full flex flex-col justify-between space-y-2">
              {/* ── STYLE 1: Modern Dark SaaS (Coachly Inspired) ── */}
              {mockupType === "saas_os" && (
                <div className="flex flex-col justify-between h-full space-y-2.5">
                  {/* Mini Navigation Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/70 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded font-black text-[9px] flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: accentHex, color: contrastText }}
                      >
                        {concept.name ? concept.name.charAt(0) : "C"}
                      </div>
                      <span className="text-[10px] font-bold text-white tracking-tight truncate max-w-[110px]">
                        {concept.name}
                      </span>
                    </div>
                    <div className="hidden xs:flex items-center gap-2 text-[7.5px] text-slate-400 font-medium">
                      <span>Workflows</span>
                      <span>Templates</span>
                      <span>Pricing</span>
                    </div>
                    <span
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded shadow-2xs"
                      style={{ backgroundColor: accentHex, color: contrastText }}
                    >
                      Start Free
                    </span>
                  </div>

                  {/* Hero Headline & Benefit */}
                  <div className="text-center space-y-1.5 pt-0.5">
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7.5px] font-semibold border"
                      style={{
                        color: accentHex,
                        backgroundColor: `${accentHex}15`,
                        borderColor: `${accentHex}35`
                      }}
                    >
                      <span>The #1 All-in-One OS for {niche}</span>
                    </div>

                    <h4 className="text-[12.5px] sm:text-[13px] font-black text-white leading-tight tracking-tight px-1">
                      {concept.tagline || `Run your entire ${niche} workflow in one place.`}
                    </h4>

                    <p className="text-[8.5px] text-slate-300 line-clamp-2 leading-relaxed px-2">
                      {concept.problem
                        ? `Eliminates manual friction. ${concept.problem.slice(0, 95)}...`
                        : `Automated project pipelines, live analytics, and digital asset delivery built for ${creatorName}'s audience.`}
                    </p>

                    {/* Dual Action Buttons */}
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <span
                        className="text-[8px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                        style={{ backgroundColor: accentHex, color: contrastText }}
                      >
                        <span>Launch App</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                      <span className="text-[8px] font-semibold px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                        View Demo
                      </span>
                    </div>
                  </div>

                  {/* Domain Cards / Feature Strip (Like Coachly's domain pill strip) */}
                  <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800/60">
                    <div className="bg-slate-900/90 rounded border border-slate-800/80 p-1 text-center">
                      <Zap className="w-2.5 h-2.5 mx-auto" style={{ color: accentHex }} />
                      <span className="text-[6.5px] text-slate-300 font-bold block truncate mt-0.5">Pipeline</span>
                    </div>
                    <div className="bg-slate-900/90 rounded border border-slate-800/80 p-1 text-center">
                      <BarChart3 className="w-2.5 h-2.5 text-amber-400 mx-auto" />
                      <span className="text-[6.5px] text-slate-300 font-bold block truncate mt-0.5">Analytics</span>
                    </div>
                    <div className="bg-slate-900/90 rounded border border-slate-800/80 p-1 text-center">
                      <FolderOpen className="w-2.5 h-2.5 text-sky-400 mx-auto" />
                      <span className="text-[6.5px] text-slate-300 font-bold block truncate mt-0.5">Presets</span>
                    </div>
                    <div className="bg-slate-900/90 rounded border border-slate-800/80 p-1 text-center">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 mx-auto" />
                      <span className="text-[6.5px] text-slate-300 font-bold block truncate mt-0.5">Verified</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STYLE 2: High-Contrast Editorial AI (study100 Inspired) ── */}
              {mockupType === "ai_copilot" && (
                <div className="flex flex-col justify-between h-full space-y-2.5">
                  {/* Mini Navigation Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/70 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded font-bold text-[9px] flex items-center justify-center bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      >
                        <Bot className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white tracking-tight truncate max-w-[110px]">
                        {concept.name}
                      </span>
                    </div>
                    <div className="hidden xs:flex items-center gap-2 text-[7.5px] text-slate-400 font-medium">
                      <span>Model</span>
                      <span>Benchmarks</span>
                      <span>Pricing</span>
                    </div>
                    <span
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded text-white shadow-2xs border border-sky-500/40 bg-sky-950/80"
                    >
                      Try Copilot
                    </span>
                  </div>

                  {/* Hero Headline & Editorial Tag */}
                  <div className="text-center space-y-1.5 pt-0.5">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7.5px] font-semibold border border-sky-500/30 bg-sky-500/10 text-sky-300">
                      <span>Fine-tuned for {creatorName}&apos;s Audience</span>
                    </div>

                    <h4 className="text-[12.5px] sm:text-[13px] font-black text-white leading-tight tracking-tight px-1">
                      The AI Copilot that <span className="italic" style={{ color: accentHex }}>actually</span> delivers.
                    </h4>

                    <p className="text-[8.5px] text-slate-300 line-clamp-2 leading-relaxed px-2">
                      {concept.description || `Instantly synthesizes ${niche} strategies, optimizes client outputs, and saves 14+ manual hours each week.`}
                    </p>

                    {/* Dual Action Buttons */}
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <span
                        className="text-[8px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                        style={{ backgroundColor: accentHex, color: contrastText }}
                      >
                        <span>Start Free</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                      <span className="text-[8px] font-semibold px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                        Exam Coverage
                      </span>
                    </div>
                  </div>

                  {/* Simulated AI Prompt & Response Showcase Card */}
                  <div className="bg-slate-950/90 rounded border border-slate-800/90 p-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[7px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-slate-300 truncate">
                        <Terminal className="w-2 h-2 text-sky-400 shrink-0" />
                        <span>Prompt: Automate {niche} workflow...</span>
                      </span>
                      <span className="text-emerald-400 font-bold shrink-0">120ms</span>
                    </div>
                    <div className="flex items-center gap-1 text-[6.5px] text-slate-400 bg-black/50 px-1.5 py-0.5 rounded border border-slate-800">
                      <Check className="w-2 h-2 text-emerald-400 shrink-0" />
                      <span className="truncate">450+ verified templates indexed | 99.2% accuracy</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STYLE 3: Warm High-Trust Community & Vault (Puppy Borrow Inspired) ── */}
              {mockupType === "knowledge_hub" && (
                <div className="flex flex-col justify-between h-full space-y-2.5">
                  {/* Mini Navigation Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/70 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded font-bold text-[9px] flex items-center justify-center bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      >
                        <Heart className="w-2.5 h-2.5 text-amber-400" />
                      </div>
                      <span className="text-[10px] font-bold text-white tracking-tight truncate max-w-[110px]">
                        {concept.name}
                      </span>
                    </div>
                    <div className="hidden xs:flex items-center gap-2 text-[7.5px] text-slate-400 font-medium">
                      <span>Vault</span>
                      <span>Live Calls</span>
                      <span>Perks</span>
                    </div>
                    <span
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded shadow-2xs"
                      style={{ backgroundColor: accentHex, color: contrastText }}
                    >
                      Join Vault
                    </span>
                  </div>

                  {/* Hero Headline & Community Tag */}
                  <div className="text-center space-y-1.5 pt-0.5">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7.5px] font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300">
                      <Users className="w-2 h-2 text-amber-400" />
                      <span>Private Mastermind & VIP Vault</span>
                    </div>

                    <h4 className="text-[12.5px] sm:text-[13px] font-black text-white leading-tight tracking-tight px-1">
                      More impact. <span className="font-bold" style={{ color: accentHex }}>Less friction.</span> Built for {firstName}&apos;s inner circle.
                    </h4>

                    <p className="text-[8.5px] text-slate-300 line-clamp-2 leading-relaxed px-2">
                      {concept.description || `Direct weekly strategy calls with ${creatorName}, 40+ curated presets, and an invite-only network of top founders.`}
                    </p>

                    {/* Dual Action Buttons */}
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <span
                        className="text-[8px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                        style={{ backgroundColor: accentHex, color: contrastText }}
                      >
                        <span>Apply for Access</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                      <span className="text-[8px] font-semibold px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                        Explore Vault
                      </span>
                    </div>
                  </div>

                  {/* 3 Community Perk Cards */}
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/60">
                    <div className="bg-slate-900/90 rounded border border-slate-800/80 p-1 text-center">
                      <Calendar className="w-2.5 h-2.5 text-amber-400 mx-auto" />
                      <span className="text-[6.5px] text-slate-300 font-bold block truncate mt-0.5">Live Calls</span>
                    </div>
                    <div className="bg-slate-900/90 rounded border border-slate-800/80 p-1 text-center">
                      <Database className="w-2.5 h-2.5 text-cyan-400 mx-auto" />
                      <span className="text-[6.5px] text-slate-300 font-bold block truncate mt-0.5">42+ Presets</span>
                    </div>
                    <div className="bg-slate-900/90 rounded border border-slate-800/80 p-1 text-center">
                      <Star className="w-2.5 h-2.5 text-emerald-400 mx-auto" />
                      <span className="text-[6.5px] text-slate-300 font-bold block truncate mt-0.5">94% Retention</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hover Action Overlay: Preview Landing Page, View Deck, Customize */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 p-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow-md hover:scale-105 active:scale-95"
              style={{ backgroundColor: accentHex, color: contrastText }}
              title="Preview Landing Page"
            >
              <Eye className="w-3 h-3" style={{ color: contrastText }} />
              <span>Preview Landing Page</span>
            </button>

            {onOpenDeck && (
              <button
                type="button"
                onClick={onOpenDeck}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                title="View Pitch Deck"
              >
                <Monitor className="w-3 h-3 text-slate-700" />
                <span>Deck</span>
              </button>
            )}

            {onEditConcept && (
              <button
                type="button"
                onClick={onEditConcept}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
                title="Customize Concept"
              >
                <Pencil className="w-3 h-3 text-slate-300" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Metric Pills with Studio High-Contrast Styling */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[7.5px] text-slate-400 block font-medium">MRR Projected</span>
            <span className="text-[10px] font-bold font-mono" style={{ color: accentHex }}>
              {concept?.mockup?.primaryMetric || concept?.primaryMetric || "$22.5K"}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[7.5px] text-slate-400 block font-medium">Active Users</span>
            <span className="text-[10px] font-bold text-slate-200 font-mono">
              {concept?.mockup?.activeMetric || concept?.activeMetric || "850"}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[7.5px] text-slate-400 block font-medium">Retention</span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">
              {concept?.mockup?.efficiencyMetric || concept?.efficiencyMetric || "94%"}
            </span>
          </div>
        </div>

        {/* Target User & Pricing Footer */}
        <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/80 pt-1.5">
          <span className="truncate max-w-[130px] text-slate-300 font-medium">
            {concept?.customer || concept?.demographicAlignment || "Target Users"}
          </span>
          <span className="font-bold font-mono" style={{ color: accentHex }}>
            {concept?.pricing || "$29/mo"}
          </span>
        </div>
      </div>

      {/* Unified Concept Landing Page Modal */}
      <ConceptLandingModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        concept={concept}
        conceptIndex={conceptIndex}
        creator={creator}
        brandColor={accentHex}
        onEdit={onEditConcept}
      />
    </>
  );
}
