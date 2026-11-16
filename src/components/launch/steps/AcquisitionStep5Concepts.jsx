import { useMemo, useState } from "react";
import {
  Activity, Send, CheckCircle2, Eye, RefreshCw, Clock, Mail, X, Pencil,
  AlertTriangle, Lightbulb, Heart, Palette, Layers,
} from "lucide-react";
import { getBrandColorObj } from "../DynamicConceptMockup";
import ConceptLandingPage, { ConceptLandingModal } from "../ConceptLandingPage";
import { getHarmoniousConceptColors, getFriendlyColorName } from "../../../utils/avatarColorExtractor";
import FormattedMarkdownBody from "../FormattedMarkdownBody";
import Step5SkeletonLoader from "../Step5SkeletonLoader";
import { formatConceptPricing } from "../../../utils/pricing";

/* ──────────────────────────────────────────────────────────────────────────
 * Palette. Dark surfaces with CoLaunch crimson as the one UI accent.
 * Each concept's own brand colour appears ONLY inside its landing-page preview
 * (and one small dot), so the page stays calm and the preview is what you look at.
 * ────────────────────────────────────────────────────────────────────────── */
const C = {
  bg: "#08090c",
  sheet: "#10131a",
  row: "#0c0e13",
  raised: "#171b24",
  line: "rgba(255,255,255,0.07)",
  lineStrong: "rgba(255,255,255,0.16)",
  text: "#f3f4f6",
  body: "#cdd1da",
  muted: "#9ba1ae",
  faint: "#6c7280",
  crimson: "#c81e3c",
  crimsonHover: "#d92a49",
  crimsonSoft: "rgba(200,30,60,0.14)",
  crimsonLine: "rgba(200,30,60,0.4)",
  ok: "#6fcf9b",
  okSoft: "rgba(111,207,155,0.12)",
  okLine: "rgba(111,207,155,0.35)",
  warn: "#f0b46a",
};

const PAGE_CSS = `
.s5 .serif{font-family:'Roboto',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-weight:700;letter-spacing:-0.015em}
.s5 .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;white-space:nowrap;font-size:.8125rem;font-weight:600;border-radius:.625rem;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s;border:1px solid transparent}
.s5 .btn:disabled{opacity:.5;cursor:not-allowed}
.s5 .btn:focus-visible,.s5 .chip:focus-visible,.s5 .tile:focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
.s5 .btn-primary{background:${C.crimson};color:#fff}
.s5 .btn-primary:hover:not(:disabled){background:${C.crimsonHover}}
.s5 .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.s5 .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.s5 .chip{display:inline-flex;align-items:center;gap:.4rem;border-radius:999px;font-size:.75rem;font-weight:500;cursor:pointer;transition:border-color .15s,color .15s;border:1px solid ${C.line};background:${C.row};color:${C.muted}}
.s5 .chip:hover{border-color:${C.lineStrong};color:${C.text}}
.s5 .chip[aria-pressed="true"]{background:${C.crimson};border-color:${C.crimson};color:#fff}
.s5 .tile{transition:border-color .15s}
.s5 .tile:hover{border-color:${C.lineStrong}}
@media (prefers-reduced-motion:reduce){.s5 *{animation:none!important;transition:none!important}}
`;

const FALLBACK_BRAND = "#c81e3c";
const TUNE_COLORS = [
  { name: "Crimson", hex: "#C81E3C" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Indigo", hex: "#6366F1" },
];

const conceptKey = (concept, index) => concept.id || index;
const creatorLabel = (c) => c?.name || c?.display_name || c?.handle || "Creator";

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim()) ||
    /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(String(hex || "").trim());
  if (!m) return [200, 30, 60];
  const h = m.length === 2 ? m[1] : m.slice(1).map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
/** Readable text colour on top of a brand colour. */
function onColor(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#0b0c10" : "#ffffff";
}

/* ──────────────────────────────────────────────────────────────────────────
 * Small pieces
 * ────────────────────────────────────────────────────────────────────────── */
function Pill({ tone = "neutral", children, className = "" }) {
  const tones = {
    neutral: { color: C.muted, background: C.row, borderColor: C.line },
    crimson: { color: "#ff8fa3", background: C.crimsonSoft, borderColor: C.crimsonLine },
    ok: { color: C.ok, background: C.okSoft, borderColor: C.okLine },
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${className}`}
      style={tones[tone]}
    >
      {children}
    </span>
  );
}

function CreatorAvatar({ creator, getCreatorAvatar, generateCreatorAvatarSvg, className, style }) {
  return (
    <img
      src={getCreatorAvatar(creator)}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = generateCreatorAvatarSvg(creatorLabel(creator));
      }}
      alt=""
      className={`rounded-full object-cover ${className}`}
      style={style}
    />
  );
}

function AdvanceButton({ dispatched, isSending, sendBlocked, onSend, onAdvance, size = "h-9 px-4" }) {
  const label = isSending ? "Sending..." : dispatched ? "Continue to step 6" : "Send 3 concepts and continue";
  const Icon = isSending ? RefreshCw : dispatched ? CheckCircle2 : Send;
  return (
    <button
      type="button"
      onClick={dispatched ? onAdvance : onSend}
      disabled={dispatched ? false : isSending || sendBlocked}
      title={dispatched ? "Continue to step 6" : "Email the 3 concepts to the creator and move to step 6"}
      className={`btn btn-primary ${size}`}
    >
      <Icon className={`w-3.5 h-3.5 ${isSending ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Sections
 * ────────────────────────────────────────────────────────────────────────── */
function PositiveReplyBanner({ notice, onDismiss }) {
  return (
    <div
      role="status"
      className="p-4 rounded-xl flex items-start justify-between gap-3"
      style={{ background: C.okSoft, border: `1px solid ${C.okLine}` }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: C.ok }} aria-hidden="true" />
        <div className="min-w-0 space-y-0.5">
          <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>
            {notice.creatorName} replied positively <span className="font-normal text-xs" style={{ color: C.muted }}>at {notice.time}</span>
          </p>
          <p className="m-0 text-xs break-words" style={{ color: C.body }}>
            {notice.handle}: <span className="italic">“{notice.replyText}”</span>
          </p>
          <p className="m-0 text-xs font-medium" style={{ color: C.ok }}>Approved. Concepts are ready.</p>
        </div>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="btn" style={{ color: C.muted, padding: 4 }}>
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function CreatorSwitcher({
  creators, selectedCreator, awaitingCount, onSelect, onOpenInterested, onOpenAwaiting,
  getCreatorAvatar, generateCreatorAvatarSvg,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="text-sm font-medium shrink-0" style={{ color: C.muted }}>Interested creators</span>
        {creators.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            aria-pressed={selectedCreator?.id === c.id}
            className="chip pl-1.5 pr-3 py-1"
          >
            <CreatorAvatar
              creator={c}
              getCreatorAvatar={getCreatorAvatar}
              generateCreatorAvatarSvg={generateCreatorAvatarSvg}
              className="w-5 h-5"
            />
            <span>{c.name || c.display_name}</span>
          </button>
        ))}
        {creators.length === 0 && (
          <span className="text-xs italic" style={{ color: C.warn }}>No creators marked interested yet</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={onOpenInterested} className="btn btn-quiet px-3 py-1.5">
          <Heart className="w-3.5 h-3.5" style={{ color: "#ff8fa3" }} aria-hidden="true" />
          <span>Interested ({creators.length})</span>
        </button>
        <button type="button" onClick={onOpenAwaiting} className="btn btn-quiet px-3 py-1.5">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Awaiting ({awaitingCount})</span>
        </button>
      </div>
    </div>
  );
}

function ThreadStream({ creator, messages, pollingImap, onSync }) {
  return (
    <section
      aria-label={`Email thread with ${creator.name}`}
      className="p-4 rounded-xl space-y-3"
      style={{ background: C.row, border: `1px solid ${C.line}` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 text-sm font-semibold min-w-0" style={{ color: C.text }}>
          <Mail className="w-4 h-4 shrink-0" style={{ color: "#ff8fa3" }} aria-hidden="true" />
          <span className="truncate">{creator.name} ({creator.email || creator.email_public})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: C.muted }}>{messages.length} synced, newest first</span>
          <button
            type="button"
            onClick={onSync}
            disabled={pollingImap}
            aria-label="Sync Gmail replies for this thread"
            className="btn btn-quiet px-2.5 py-1 text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${pollingImap ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <ul className="space-y-2 max-h-52 overflow-y-auto pr-1 list-none p-0 m-0">
        {messages.map((msg, idx) => {
          const latest = idx === 0;
          return (
            <li
              key={msg.id || idx}
              className="p-3 rounded-lg text-xs space-y-1.5"
              style={{
                background: latest ? C.sheet : C.bg,
                border: `1px solid ${latest ? C.crimsonLine : C.line}`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold truncate" style={{ color: C.text }}>{msg.from_address}</span>
                  {latest && <Pill tone="crimson">Latest</Pill>}
                </span>
                <span className="shrink-0" style={{ color: C.faint }}>
                  {msg.received_at
                    ? new Date(msg.received_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Recently"}
                </span>
              </div>
              <div className="p-2.5 rounded-md" style={{ background: C.bg, color: C.body }}>
                <FormattedMarkdownBody text={msg.body} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StatusBanner({ state, creatorName, sentInfo }) {
  const synth = state === "synthesizing";
  const done = state === "dispatched";
  const Icon = synth ? RefreshCw : done ? CheckCircle2 : Layers;
  const title = synth
    ? "Building concepts"
    : done
    ? "Concepts sent, waiting for a reply"
    : "Concepts ready to send";
  const body = synth
    ? `Reading ${creatorName}'s channel and comments to design 3 software products.`
    : done
    ? "The 3 concepts were emailed. Re-send a follow-up below, or continue to step 6."
    : "Review the 3 concepts below, then send them to the creator.";

  return (
    <div role="status" className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: done ? C.okSoft : C.crimsonSoft }}
      >
        <Icon className={`w-4 h-4 ${synth ? "animate-spin" : ""}`} style={{ color: done ? C.ok : "#ff8fa3" }} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-sm font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.text }}>
          {synth && <Activity className="w-3.5 h-3.5" aria-hidden="true" />}
          {title}
          {done && sentInfo && (
            <span className="text-xs font-normal" style={{ color: C.muted }}>
              sent {sentInfo.time} to {sentInfo.recipient}
            </span>
          )}
        </p>
        <p className="m-0 text-xs" style={{ color: C.muted }}>{body}</p>
      </div>
    </div>
  );
}

function BrandColorBar({
  creator, avatarHex, colorInfo, isExtracting, uniformBrandColor, onToggleUniform, onSetColor,
  getCreatorAvatar, generateCreatorAvatarSvg,
}) {
  const hex = colorInfo.primaryHex;
  const normalizedHex = hex.toLowerCase();
  const normalizedAvatar = String(avatarHex || hex).toLowerCase();
  const avatarInPresets = TUNE_COLORS.some((c) => c.hex.toLowerCase() === normalizedAvatar);
  const swatches = avatarInPresets
    ? TUNE_COLORS
    : [{ name: "From avatar", hex: avatarHex }, ...TUNE_COLORS];
  const isCustomActive = !swatches.some((c) => c.hex.toLowerCase() === normalizedHex);

  const previewColors = uniformBrandColor
    ? [hex, hex, hex]
    : [
        colorInfo.colors[0] || hex,
        colorInfo.colors[1] || hex,
        colorInfo.colors[2] || hex,
      ];

  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{ background: C.row, border: `1px solid ${C.line}` }}
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative shrink-0">
            <CreatorAvatar
              creator={creator}
              getCreatorAvatar={getCreatorAvatar}
              generateCreatorAvatarSvg={generateCreatorAvatarSvg}
              className="w-10 h-10"
              style={{ boxShadow: `0 0 0 2px ${hex}` }}
            />
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: hex, color: onColor(hex), boxShadow: `0 0 0 2px ${C.row}` }}
              title={`Active brand colour: ${hex}`}
            >
              <Palette className="w-2.5 h-2.5" aria-hidden="true" />
            </span>
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="m-0 text-sm font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.text }}>
              Brand colour
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ color: C.text, background: C.sheet, border: `1px solid ${C.lineStrong}` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: hex }} aria-hidden="true" />
                {isExtracting ? "Reading avatar..." : `${colorInfo.name} · ${hex.toUpperCase()}`}
              </span>
            </p>
            <p className="m-0 text-xs" style={{ color: C.muted }}>
              {uniformBrandColor
                ? `Applies ${colorInfo.name} across all 3 concept landing pages. Edit any card to override.`
                : "Applies to Concept 1, with distinct contrasting accents for Concepts 2 & 3. Edit any card to override."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0" role="group" aria-label="Change brand colour">
          {swatches.map((item) => {
            const isSelected = normalizedHex === item.hex.toLowerCase();
            return (
              <button
                key={`${item.name}-${item.hex}`}
                type="button"
                onClick={() => onSetColor(item.hex)}
                aria-pressed={isSelected}
                title={`${item.name} (${item.hex})`}
                className="chip px-2.5 py-1 text-[11px]"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.hex }} aria-hidden="true" />
                <span>{item.name}</span>
              </button>
            );
          })}
          <label className="relative cursor-pointer ml-0.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2" style={{ outlineColor: C.crimson }} title="Pick a custom colour">
            <input
              type="color"
              value={`#${hexToRgb(hex).map((v) => v.toString(16).padStart(2, "0")).join("")}`}
              onChange={(e) => onSetColor(e.target.value)}
              aria-label="Pick a custom brand colour"
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
            <span
              className="chip px-2.5 py-1 text-[11px]"
              style={isCustomActive ? { background: C.crimson, borderColor: C.crimson, color: "#fff" } : undefined}
            >
              {isCustomActive ? (
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: hex }} aria-hidden="true" />
              ) : (
                <Palette className="w-3 h-3" aria-hidden="true" />
              )}
              <span>Custom</span>
            </span>
          </label>
        </div>
      </div>

      <div
        className="pt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-3 flex-wrap" style={{ color: C.muted }}>
          <span>Active colours:</span>
          {previewColors.map((cHex, i) => (
            <span key={i} className="inline-flex items-center gap-1.5" style={{ color: C.body }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: cHex }} aria-hidden="true" />
              <span>Concept {i + 1}</span>
            </span>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 p-0.5 rounded-full" style={{ background: C.bg, border: `1px solid ${C.line}` }} role="group" aria-label="Colour distribution across concepts">
          <button
            type="button"
            onClick={() => onToggleUniform(false)}
            aria-pressed={!uniformBrandColor}
            className="chip px-2.5 py-0.5 text-[11px]"
            style={{ borderColor: "transparent" }}
          >
            3 distinct accents
          </button>
          <button
            type="button"
            onClick={() => onToggleUniform(true)}
            aria-pressed={uniformBrandColor}
            className="chip px-2.5 py-0.5 text-[11px]"
            style={{ borderColor: "transparent" }}
          >
            Same on all 3
          </button>
        </div>
      </div>
    </div>
  );
}

function resolveConceptBrandHex(concept, index, colorInfo, uniformBrandColor = false) {
  const defaultColor = uniformBrandColor
    ? colorInfo.primaryHex
    : colorInfo.colors[index % colorInfo.colors.length] || colorInfo.primaryHex;
  const effectiveColor = concept?.isCustomColor ? concept?.brandColor : defaultColor;
  if (typeof effectiveColor === "string" && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(effectiveColor.trim())) {
    const raw = effectiveColor.trim();
    return raw.startsWith("#") ? raw : `#${raw}`;
  }
  return getBrandColorObj(effectiveColor).hex;
}

function ConceptCard({
  concept, index, creator, colorInfo, uniformBrandColor, onOpenLanding, onEdit,
  getCreatorAvatar, generateCreatorAvatarSvg,
}) {
  const brandColor = resolveConceptBrandHex(concept, index, colorInfo, uniformBrandColor);
  const accentHex = getBrandColorObj(brandColor).hex;
  const buildLabel = concept.mvpDifficulty
    ? (concept.mvpDifficulty.includes("build")
        ? concept.mvpDifficulty
        : `${concept.mvpDifficulty.replace(/\s*to ship\b/i, "").replace(/^(low|medium|high)\s*\((.*?)\)$/i, "$2")} to build`)
    : "2 weeks to build";
  const revenueLabel = (concept.revenueModel || "Subscription · 50/50 revenue share")
    .replace(/[•·]\s*Projected\s*\$[\d.,]+[KkMm]?\s*MRR/i, "")
    .replace(/\s*·\s*Projected.*$/i, "")
    .trim();

  return (
    <article className="tile p-4 sm:p-5 rounded-2xl flex flex-col justify-between gap-4" style={{ background: C.sheet, border: `1px solid ${C.line}`, color: C.text }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-medium" style={{ color: C.muted }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: accentHex }} aria-hidden="true" />
            Concept {index + 1}
          </span>
          {concept.opportunityScore ? (
            <Pill tone="neutral">Fit {concept.opportunityScore}/100</Pill>
          ) : null}
        </div>

        <ConceptLandingPage
          concept={concept}
          conceptIndex={index}
          creator={creator}
          brandColor={brandColor}
          mode="thumb"
          getCreatorAvatar={getCreatorAvatar}
          generateCreatorAvatarSvg={generateCreatorAvatarSvg}
        />

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="serif m-0 text-2xl leading-tight" style={{ color: C.text }}>{concept.name}</h3>
            <span className="text-xs shrink-0" style={{ color: C.faint }}>{buildLabel}</span>
          </div>
          <p className="mt-1 mb-0 text-sm font-medium" style={{ color: C.body }}>
            {formatConceptPricing(concept.pricing)}
            <span className="font-normal" style={{ color: C.muted }}> · {revenueLabel}</span>
          </p>
        </div>
      </div>

      <div className="pt-3 flex items-center gap-2 flex-wrap" style={{ borderTop: `1px solid ${C.line}` }}>
        <button type="button" onClick={onOpenLanding} className="btn btn-primary flex-1 py-2 px-3">
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>View landing page</span>
        </button>
        <button type="button" onClick={onEdit} className="btn btn-quiet px-3 py-2">
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Edit</span>
        </button>
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main component (props unchanged)
 * ────────────────────────────────────────────────────────────────────────── */
export default function AcquisitionStep5Concepts({
  awaitingCreators,
  creatorBrandColorMap,
  creatorConceptSelectionMap,
  expandedConceptDetailsMap,
  generateCreatorAvatarSvg,
  getCreatorAvatar,
  getCreatorThreadMessages,
  handleSendBlueprintAndAdvanceToStep6,
  handleSendOpportunityPitch,
  handleSaveConcept,
  handleSetCreatorBrandColor,
  handleSynthesizeStep5Ai,
  interestedCreators,
  isExtractingAvatarColor,
  isSendingPitch,
  isSynthesizingStep5Ai,
  pitchSentMap,
  pollingImap,
  positiveAdvanceNotice,
  realThreads,
  selectedCreator,
  setActiveStep,
  setEditingConcept,
  setEditingConceptIndex,
  setExpandedConceptDetailsMap,
  setPositiveAdvanceNotice,
  setSelectedConceptId,
  setSelectedCreatorId,
  setShowAwaitingModal,
  setShowInterestedModal,
  setShowStep5EmailModal,
  setViewingDeckConcept,
  setViewingDeckIndex,
  step5Error,
  syncImapReplies,
}) {
  const concepts = selectedCreator?.productConcepts || [];
  const hasConcepts = Boolean(Array.isArray(concepts) && concepts.length > 0);
  const showSkeleton = Boolean(isSynthesizingStep5Ai || !hasConcepts) && !step5Error;
  const sentInfo = selectedCreator ? pitchSentMap[selectedCreator.id] : null;
  const isDispatched = Boolean(sentInfo);
  const sendBlocked = isSynthesizingStep5Ai || !hasConcepts || Boolean(step5Error);
  const creatorName = creatorLabel(selectedCreator);

  const threadMessages = useMemo(
    () => (selectedCreator ? getCreatorThreadMessages(selectedCreator, realThreads) : []),
    [selectedCreator, getCreatorThreadMessages, realThreads],
  );

  const baseBrand = selectedCreator?.brand_color || selectedCreator?.brandColor || FALLBACK_BRAND;
  const colorInfo = useMemo(() => {
    const stored = selectedCreator && creatorBrandColorMap[selectedCreator.id];
    const primary = stored?.primaryHex || baseBrand;
    return {
      primaryHex: primary,
      name: stored?.name || getFriendlyColorName(primary),
      source: stored?.source || "avatar_vision",
      colors: getHarmoniousConceptColors(primary),
    };
  }, [selectedCreator, creatorBrandColorMap, baseBrand]);

  const [landingModalIndex, setLandingModalIndex] = useState(null);
  const [landingModalEditing, setLandingModalEditing] = useState(false);
  const [uniformBrandColor, setUniformBrandColor] = useState(false);

  const bannerState = showSkeleton ? "synthesizing" : isDispatched ? "dispatched" : "ready";
  const activeLandingConcept =
    landingModalIndex !== null && landingModalIndex >= 0 && landingModalIndex < concepts.length
      ? concepts[landingModalIndex]
      : null;
  const activeLandingBrandColor = activeLandingConcept
    ? resolveConceptBrandHex(activeLandingConcept, landingModalIndex, colorInfo, uniformBrandColor)
    : colorInfo.primaryHex;

  const selectCreator = (c) => {
    setSelectedCreatorId(c.id);
    setSelectedConceptId(creatorConceptSelectionMap[c.id] || c.selectedConceptId || c.productConcepts?.[0]?.id || null);
  };
  const openLandingModal = (index, startInEditMode = false) => {
    setLandingModalEditing(Boolean(startInEditMode));
    setLandingModalIndex(index);
  };
  const sendBlueprint = () => handleSendBlueprintAndAdvanceToStep6(selectedCreator);
  const goToStep6 = () => setActiveStep(6);

  return (
    <div className="s5 p-4 sm:p-6 rounded-2xl space-y-5" style={{ background: C.bg, color: C.text, border: `1px solid ${C.line}` }}>
      <style>{PAGE_CSS}</style>

      {positiveAdvanceNotice && (
        <PositiveReplyBanner notice={positiveAdvanceNotice} onDismiss={() => setPositiveAdvanceNotice(null)} />
      )}

      <CreatorSwitcher
        creators={interestedCreators}
        selectedCreator={selectedCreator}
        awaitingCount={awaitingCreators.length}
        onSelect={selectCreator}
        onOpenInterested={() => setShowInterestedModal(true)}
        onOpenAwaiting={() => setShowAwaitingModal(true)}
        getCreatorAvatar={getCreatorAvatar}
        generateCreatorAvatarSvg={generateCreatorAvatarSvg}
      />

      {selectedCreator && threadMessages.length > 0 && (
        <ThreadStream creator={selectedCreator} messages={threadMessages} pollingImap={pollingImap} onSync={() => syncImapReplies(true)} />
      )}

      <StatusBanner state={bannerState} creatorName={creatorName} sentInfo={sentInfo} />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="min-w-0">
          <h2 className="serif m-0 text-3xl leading-tight flex items-center gap-2.5" style={{ color: C.text }}>
            <Lightbulb className="w-5 h-5 shrink-0" style={{ color: "#ff8fa3" }} aria-hidden="true" />
            <span>3 product ideas for {creatorName}</span>
          </h2>
          <p className="mt-1 mb-0 text-sm" style={{ color: C.muted }}>
            Each one is shown as the landing page {creatorName}'s audience would see.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => handleSynthesizeStep5Ai(selectedCreator)}
            disabled={isSynthesizingStep5Ai}
            className="btn btn-quiet h-9 px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizingStep5Ai ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isSynthesizingStep5Ai ? "Generating..." : hasConcepts ? "Regenerate ideas" : "Generate ideas"}</span>
          </button>
          {isDispatched && (
            <button type="button" onClick={() => handleSendOpportunityPitch(selectedCreator)} disabled={isSendingPitch} className="btn btn-quiet h-9 px-3.5">
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isSendingPitch ? "Re-sending..." : "Re-send email"}</span>
            </button>
          )}
          <AdvanceButton
            dispatched={isDispatched}
            isSending={isSendingPitch && !isDispatched}
            sendBlocked={sendBlocked}
            onSend={sendBlueprint}
            onAdvance={goToStep6}
          />
        </div>
      </div>

      {step5Error ? (
        <div role="alert" className="p-6 rounded-xl space-y-4" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }}>
          <p className="m-0 flex items-center gap-2 text-sm font-semibold" style={{ color: "#ff8fa3" }}>
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            Concepts could not be generated
          </p>
          <p className="m-0 text-xs leading-relaxed" style={{ color: C.body }}>{step5Error}</p>
          <button type="button" onClick={() => handleSynthesizeStep5Ai(selectedCreator)} className="btn btn-primary px-4 py-2">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Try again</span>
          </button>
        </div>
      ) : showSkeleton ? (
        <Step5SkeletonLoader creatorName={creatorName} />
      ) : (
        <div className="space-y-5">
          <BrandColorBar
            creator={selectedCreator}
            avatarHex={baseBrand}
            colorInfo={colorInfo}
            isExtracting={isExtractingAvatarColor}
            uniformBrandColor={uniformBrandColor}
            onToggleUniform={setUniformBrandColor}
            onSetColor={handleSetCreatorBrandColor}
            getCreatorAvatar={getCreatorAvatar}
            generateCreatorAvatarSvg={generateCreatorAvatarSvg}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-sm" style={{ color: C.muted }}>
              Based on {creatorName}'s audience research ({selectedCreator.handle}). Click View landing page on any concept for the full breakdown.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Pill tone="ok" className="hidden sm:inline-flex py-1 px-3">All 3 are in the email</Pill>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {concepts.map((concept, index) => {
              const key = conceptKey(concept, index);
              return (
                <ConceptCard
                  key={key}
                  concept={concept}
                  index={index}
                  creator={selectedCreator}
                  colorInfo={colorInfo}
                  uniformBrandColor={uniformBrandColor}
                  onOpenLanding={() => openLandingModal(index, false)}
                  onEdit={() => openLandingModal(index, true)}
                  getCreatorAvatar={getCreatorAvatar}
                  generateCreatorAvatarSvg={generateCreatorAvatarSvg}
                />
              );
            })}
          </div>

          <div className="pt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4" style={{ borderTop: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" onClick={() => setActiveStep(4)} className="btn btn-quiet px-4 py-2">Back to step 4</button>
            </div>
            <AdvanceButton
              dispatched={isDispatched}
              isSending={isSendingPitch}
              sendBlocked={sendBlocked}
              onSend={sendBlueprint}
              onAdvance={goToStep6}
              size="h-10 px-5"
            />
          </div>
        </div>
      )}

      <ConceptLandingModal
        isOpen={Boolean(activeLandingConcept)}
        onClose={() => {
          setLandingModalIndex(null);
          setLandingModalEditing(false);
        }}
        concept={activeLandingConcept}
        conceptIndex={landingModalIndex}
        creator={selectedCreator}
        brandColor={activeLandingBrandColor}
        initialEditing={landingModalEditing}
        onSave={(updated) => handleSaveConcept?.(updated, landingModalIndex)}
        getCreatorAvatar={getCreatorAvatar}
        generateCreatorAvatarSvg={generateCreatorAvatarSvg}
      />
    </div>
  );
}
