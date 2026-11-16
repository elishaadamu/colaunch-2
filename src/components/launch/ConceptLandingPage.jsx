import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Monitor, Pencil, Plus, Smartphone, Trash2, X } from "lucide-react";
import { generateCreatorAvatarSvg as defaultGenerateAvatarSvg } from "../../utils/avatarColorExtractor";
import { formatConceptPricing } from "../../utils/pricing";
import { FeatureIcon, HeroIllustration, WorkflowArt, kindOf } from "./illustrations";
import { CONCEPT_ARCHETYPES } from "./conceptSchema";

const FALLBACK_BRAND = "#c81e3c";
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function cleanText(value) {
  if (value === null || value === undefined || typeof value === "object") return "";
  const str = String(value).trim();
  if (!str) return "";
  const lower = str.toLowerCase();
  if (lower === "undefined" || lower === "null") return "";
  return str;
}

function normalizeHex(input) {
  const raw = cleanText(input);
  if (!raw) return FALLBACK_BRAND;
  const full = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (full) return `#${full[1].toLowerCase()}`;
  const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(raw);
  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  }
  return FALLBACK_BRAND;
}

function hexToRgb(hex) {
  const clean = normalizeHex(hex).slice(1);
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixRgb(a, b, weightA) {
  const w = Math.max(0, Math.min(1, weightA));
  return [
    a[0] * w + b[0] * (1 - w),
    a[1] * w + b[1] * (1 - w),
    a[2] * w + b[2] * (1 - w),
  ];
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgbA, rgbB) {
  const la = relativeLuminance(rgbA);
  const lb = relativeLuminance(rgbB);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Derive all page colour tokens from a single brandColor hex while maintaining
 * dark surfaces and >= 4.5:1 WCAG AA contrast for every text colour.
 */
function deriveBrandPalette(brandColor) {
  const solid = normalizeHex(brandColor);
  const solidRgb = hexToRgb(solid);
  const pageRgb = [8, 9, 12];
  const surfaceRgb = [16, 19, 26];
  const raisedRgb = [23, 27, 36];

  const whiteContrast = contrastRatio([255, 255, 255], solidRgb);
  const blackContrast = contrastRatio([0, 0, 0], solidRgb);
  const onSolid = whiteContrast >= blackContrast ? "#ffffff" : "#000000";

  const mutedBgRgb = mixRgb(solidRgb, pageRgb, 0.07);
  const softBgRgb = mixRgb(solidRgb, surfaceRgb, 0.13);

  // Guarantee at least 5.5:1 against both the dark surface and the tinted band
  let tintRgb = solidRgb;
  for (let i = 0; i <= 20; i += 1) {
    const candidate = mixRgb([255, 255, 255], solidRgb, i / 20);
    if (
      contrastRatio(candidate, softBgRgb) >= 5.5 &&
      contrastRatio(candidate, raisedRgb) >= 5.5 &&
      contrastRatio(candidate, mutedBgRgb) >= 5.5
    ) {
      tintRgb = candidate;
      break;
    }
  }

  const borderRgb = mixRgb(solidRgb, surfaceRgb, 0.34);
  const strongBorderRgb = mixRgb(tintRgb, surfaceRgb, 0.45);
  const buttonBorder =
    contrastRatio(solidRgb, pageRgb) < 2.2
      ? "rgba(255, 255, 255, 0.34)"
      : rgbToHex(borderRgb);

  return {
    solid,
    onSolid,
    buttonBorder,
    tint: rgbToHex(tintRgb),
    border: rgbToHex(borderRgb),
    strongBorder: rgbToHex(strongBorderRgb),
    pageBg: "#08090c",
    surfaceBg: "#10131a",
    raisedBg: "#171b24",
    mutedBg: rgbToHex(mutedBgRgb),
    softBg: rgbToHex(softBgRgb),
    subtleLine: "rgba(255, 255, 255, 0.1)",
    textPrimary: "#f3f4f6",
    textBody: "#d3d7e0",
    textMuted: "#aeb5c2",
  };
}

function extractYouTubeIdFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : "";
}

function extractCreatorPostThumbnails(creator, cachedPosts = []) {
  if (!creator && (!Array.isArray(cachedPosts) || cachedPosts.length === 0)) return [];
  const candidateLists = [
    creator?.postThumbnails,
    creator?.thumbnails,
    creator?.recentPosts,
    creator?.recent_posts,
    creator?.topPosts,
    creator?.top_posts,
    creator?.videos,
    creator?.topVideos,
    creator?.top_videos,
    creator?.posts,
    creator?.contentSamples,
    creator?.content_samples,
    creator?.scrapedData?.recentPosts,
    creator?.scrapedData?.recent_posts,
    creator?.scrapedData?.videos,
    creator?.scraped_data?.recent_posts,
    cachedPosts,
  ];

  const creatorAvatar = cleanText(creator?.avatarUrl || creator?.avatar_url || creator?.avatar);
  const seen = new Set();
  const out = [];

  for (const list of candidateLists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (out.length >= 6) break;
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (
          trimmed &&
          trimmed !== creatorAvatar &&
          !seen.has(trimmed) &&
          /^(https?:\/\/|\/|data:image\/)/i.test(trimmed)
        ) {
          seen.add(trimmed);
          out.push({ url: trimmed, caption: "" });
        }
        continue;
      }
      if (!item || typeof item !== "object") continue;
      const vidId =
        cleanText(item.videoId || item.video_id) ||
        extractYouTubeIdFromUrl(item.url || item.content_url || item.videoUrl);
      const rawUrl =
        cleanText(item.thumbnail) ||
        cleanText(item.thumbnailUrl) ||
        cleanText(item.thumbnail_url) ||
        cleanText(item.videoThumbnail) ||
        cleanText(item.videoThumbnailUrl) ||
        cleanText(item.displayUrl) ||
        cleanText(item.display_url) ||
        cleanText(item.coverUrl) ||
        cleanText(item.thumbnail_src) ||
        cleanText(item.imageUrl) ||
        cleanText(item.img) ||
        (vidId ? `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg` : "");

      if (!rawUrl || seen.has(rawUrl)) continue;
      if (rawUrl === creatorAvatar && !vidId) continue;
      if (!/^(https?:\/\/|\/|data:image\/)/i.test(rawUrl)) continue;

      seen.add(rawUrl);
      const caption = cleanText(item.title || item.caption || item.text || "");
      out.push({ url: rawUrl, caption });
    }
  }
  return out;
}

function getCreatorName(creator) {
  return (
    cleanText(creator?.name) ||
    cleanText(creator?.display_name) ||
    cleanText(creator?.handle) ||
    "Creator"
  );
}

function getAvatarSrc(creator, getCreatorAvatar, generateCreatorAvatarSvg) {
  const creatorName = getCreatorName(creator);
  if (typeof getCreatorAvatar === "function" && creator) {
    const url = cleanText(getCreatorAvatar(creator));
    if (url) return url;
  }
  const direct =
    cleanText(creator?.avatar_url) ||
    cleanText(creator?.avatarUrl) ||
    cleanText(creator?.avatar) ||
    cleanText(creator?.image);
  if (direct) return direct;
  if (typeof generateCreatorAvatarSvg === "function") {
    return generateCreatorAvatarSvg(creatorName);
  }
  return defaultGenerateAvatarSvg(creatorName);
}

function formatFeatureDescription(rawTitle, index, productName) {
  const lowerStart = /^[A-Z0-9]{2,}\b/.test(rawTitle)
    ? rawTitle
    : rawTitle.charAt(0).toLowerCase() + rawTitle.slice(1);
  const workspaceName = productName || "your workspace";
  const templates = [
    `Includes built-in tooling for ${lowerStart} inside ${workspaceName}, ready for daily workflows.`,
    `Gives your members a structured flow for ${lowerStart} without juggling separate documents or scripts.`,
    `Organizes ${lowerStart} in one shared place so subscribers can act right away.`,
    `Streamlines ${lowerStart} into a repeatable process tailored to how your community works.`,
  ];
  return templates[index % templates.length];
}

function parseFeatureItems(rawFeatures, productName) {
  if (!Array.isArray(rawFeatures)) return [];
  const parsed = [];
  for (let i = 0; i < rawFeatures.length; i += 1) {
    const entry = rawFeatures[i];
    if (entry && typeof entry === "object") {
      const title = cleanText(entry.title || entry.name || entry.label);
      if (!title) continue;
      const desc =
        cleanText(entry.description || entry.detail) ||
        formatFeatureDescription(title, parsed.length, productName);
      parsed.push({ title, description: desc });
      continue;
    }
    const str = cleanText(entry);
    if (!str) continue;
    const match = str.match(/^([^:—\-]{3,64}?)(?:\s*:\s*|\s+—\s+|\s+-\s+)(.{12,})$/);
    if (match) {
      parsed.push({ title: match[1].trim(), description: match[2].trim() });
    } else {
      parsed.push({
        title: str,
        description: formatFeatureDescription(str, parsed.length, productName),
      });
    }
  }
  return parsed;
}

function resolvePriceText(rawPricing) {
  if (rawPricing && typeof rawPricing === "object") {
    const parts = [
      cleanText(rawPricing.starter),
      cleanText(rawPricing.pro),
      cleanText(rawPricing.price),
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" • ");
    const fallbackVals = Object.values(rawPricing).map(cleanText).filter(Boolean);
    return fallbackVals.length > 0 ? fallbackVals.join(" • ") : "";
  }
  const raw = cleanText(rawPricing);
  if (!raw) return "";
  return formatConceptPricing(typeof rawPricing === "number" ? `$${rawPricing}` : raw);
}

const LANDING_CSS = `
.clp-root {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0;
  color: #f3f4f6;
  background-color: #08090c;
  -webkit-font-smoothing: antialiased;
}
.clp-root *, .clp-root *::before, .clp-root *::after {
  box-sizing: border-box;
}
.clp-root button, .clp-root a, .clp-root input, .clp-root select {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0;
}
.clp-root .clp-serif {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.clp-root button {
  cursor: pointer;
}
.clp-root button:focus-visible, .clp-root a:focus-visible, .clp-root input:focus-visible, .clp-root textarea:focus-visible {
  outline: 2px solid var(--clp-tint, #f3f4f6);
  outline-offset: 2px;
}
.clp-edit-field {
  width: 100%;
  font-family: inherit;
  color: #f3f4f6;
  background-color: rgba(8, 9, 12, 0.72);
  border: 1px dashed rgba(255, 255, 255, 0.32);
  border-radius: 0.5rem;
  padding: 0.45rem 0.65rem;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.clp-edit-field:hover {
  border-color: rgba(255, 255, 255, 0.52);
}
.clp-edit-field:focus {
  border-style: solid;
  border-color: var(--clp-tint, #f3f4f6);
  background-color: rgba(8, 9, 12, 0.92);
}
.clp-edit-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #aeb5c2;
  margin-bottom: 0.3rem;
}
.clp-container {
  container-type: inline-size;
  width: 100%;
}
.clp-inner {
  max-width: 1120px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}
.clp-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.125rem;
  padding-bottom: 1.125rem;
}
.clp-nav-login {
  display: none;
}
.clp-hero {
  padding-top: 2.25rem;
  padding-bottom: 2.25rem;
}
.clp-hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  align-items: center;
}
.clp-steps-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.clp-step-arrow-down {
  display: flex;
  justify-content: center;
}
.clp-step-arrow-right {
  display: none;
}
.clp-thumbs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.clp-h1 {
  margin: 0;
  font-size: 2.35rem;
  line-height: 1.08;
}
.clp-h2 {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1.15;
}
.clp-h3 {
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.35;
  font-weight: 600;
}
.clp-sub {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
}
.clp-section {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}
.clp-win-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.clp-features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.clp-features-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.clp-features-deck {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.clp-studio-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.clp-vault-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.875rem;
}
.clp-hero-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
}
.clp-audience-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.clp-plan-row {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.clp-footer-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@container (min-width: 720px) {
  .clp-inner {
    padding-left: 3rem;
    padding-right: 3rem;
  }
  .clp-nav-login {
    display: inline-flex;
  }
  .clp-hero {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }
  .clp-hero-grid {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 2.5rem;
  }
  .clp-hero-grid-reversed {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    gap: 2.5rem;
  }
  .clp-hero-reversed-fig {
    order: -1;
  }
  .clp-studio-grid {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    gap: 1.25rem;
    align-items: stretch;
  }
  .clp-vault-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .clp-features-deck {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
  .clp-steps-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 0.75rem;
    align-items: center;
  }
  .clp-step-arrow-down {
    display: none;
  }
  .clp-step-arrow-right {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .clp-thumbs-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }
  .clp-h1 {
    font-size: 2.85rem;
    line-height: 1.06;
  }
  .clp-h2 {
    font-size: 2.35rem;
    line-height: 1.12;
  }
  .clp-sub {
    font-size: 1.125rem;
  }
  .clp-section {
    padding-top: 3.25rem;
    padding-bottom: 3.25rem;
  }
  .clp-win-body {
    grid-template-columns: 240px 1fr;
    gap: 1.25rem;
  }
  .clp-features-grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
  }
  .clp-audience-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
  }
  .clp-plan-row {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
  .clp-footer-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

dialog.clp-dialog {
  margin: 0;
  padding: 0;
  border: 0;
  width: 100vw;
  max-width: none;
  height: 100vh;
  height: 100dvh;
  max-height: none;
  background: #08090c;
  color: #f3f4f6;
  overscroll-behavior: contain;
}
dialog.clp-dialog[open] {
  display: flex;
  flex-direction: column;
}
dialog.clp-dialog::backdrop {
  background: rgba(5, 6, 9, 0.88);
  overflow: hidden;
  overscroll-behavior: contain;
}
.clp-modal-btn:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .clp-root *, .clp-dialog * {
    animation: none !important;
    transition: none !important;
  }
}

.clp-root svg.clp-svg {
  stroke: none;
}
`;

function LandingPageSurface({
  concept,
  conceptIndex = null,
  creator,
  palette,
  isThumb,
  isEditing = false,
  onFieldChange,
  onFeatureChange,
  onAddFeature,
  onRemoveFeature,
  getCreatorAvatar,
  generateCreatorAvatarSvg,
}) {
  const layoutVariant = Number.isInteger(conceptIndex)
    ? ((conceptIndex % 3) + 3) % 3
    : concept?.archetype === "copilot"
      ? 1
      : concept?.archetype === "vault"
        ? 2
        : 0;
  const archetypeEyebrow =
    CONCEPT_ARCHETYPES[layoutVariant]?.label || "Workflow Operating System";
  const [previewNote, setPreviewNote] = useState("");
  const [newFeatureDraft, setNewFeatureDraft] = useState("");
  const [cachedPosts, setCachedPosts] = useState([]);
  const [failedThumbUrls, setFailedThumbUrls] = useState(() => new Set());
  const editable = isEditing && !isThumb;
  const productName = cleanText(concept?.name);
  const tagline = cleanText(concept?.tagline);
  const problem = cleanText(concept?.problem) || cleanText(concept?.description);
  const creatorName = getCreatorName(creator);
  const avatarSrc = getAvatarSrc(creator, getCreatorAvatar, generateCreatorAvatarSvg);
  const generateFallback = generateCreatorAvatarSvg || defaultGenerateAvatarSvg;
  const fallbackAvatarSrc = useMemo(() => generateFallback(creatorName), [generateFallback, creatorName]);

  const rawFeatures = Array.isArray(concept?.keyFeatures) ? concept.keyFeatures : [];
  const features = useMemo(
    () => parseFeatureItems(concept?.keyFeatures, productName),
    [concept?.keyFeatures, productName],
  );
  const featureLabelsForArt = useMemo(() => features.map((f) => f.title), [features]);
  const priceText = resolvePriceText(concept?.pricing);
  const customerFit = cleanText(concept?.customer) || cleanText(concept?.demographicAlignment);
  const evidenceQuote = cleanText(concept?.audienceEvidence) || cleanText(concept?.rationale);
  const revenueModel = cleanText(concept?.revenueModel);
  const mvpDifficulty = cleanText(concept?.mvpDifficulty);

  useEffect(() => {
    setFailedThumbUrls(new Set());
    const cleanHandle = cleanText(creator?.creatorHandle || creator?.creator_handle || creator?.handle || creatorName)
      .replace(/^@/, "")
      .toLowerCase();
    if (!cleanHandle || typeof window === "undefined") {
      setCachedPosts([]);
      return;
    }
    try {
      const raw =
        window.sessionStorage?.getItem(`forge_creator_videos_${cleanHandle}`) ||
        window.localStorage?.getItem(`forge_creator_videos_${cleanHandle}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCachedPosts(Array.isArray(parsed) ? parsed : []);
        return;
      }
    } catch {
      // Ignore storage errors
    }
    setCachedPosts([]);
  }, [creator?.id, creator?.handle, creatorName]);

  const extractedThumbs = useMemo(
    () => extractCreatorPostThumbnails(creator, cachedPosts),
    [creator, cachedPosts],
  );
  const visibleThumbs = useMemo(
    () => extractedThumbs.filter((item) => !failedThumbUrls.has(item.url)).slice(0, 3),
    [extractedThumbs, failedThumbUrls],
  );

  const displayTitle = productName || `${creatorName} Software`;
  const heroHeadline = tagline || productName || `Built with ${creatorName}`;
  const logoLetter = (productName || creatorName || "C").charAt(0).toUpperCase();
  const hasAudienceSection = Boolean(editable || customerFit || evidenceQuote || problem);
  const hasPricingSection = Boolean(editable || priceText);
  const ctaHeadline = tagline || (productName ? `Start with ${productName}` : `Built with ${creatorName}`);

  const howItWorksSteps = useMemo(() => {
    const firstFeature = features[0]?.title || "Guided setup";
    const secondFeature = features[1]?.title || `${displayTitle} workspace`;
    return [
      {
        num: "1",
        title: "Join early access",
        detail: priceText
          ? `Start on ${priceText} built with ${creatorName}.`
          : `Claim early access inside ${displayTitle}.`,
      },
      {
        num: "2",
        title: `Open ${firstFeature}`,
        detail: `Follow the ready-made flow inside ${displayTitle}.`,
      },
      {
        num: "3",
        title: `Use ${secondFeature}`,
        detail: `Put ${creatorName}'s method to work right away.`,
      },
    ];
  }, [features, priceText, creatorName, displayTitle]);

  const commitNewFeature = () => {
    const trimmed = newFeatureDraft.trim();
    if (!trimmed) return;
    onAddFeature?.(trimmed);
    setNewFeatureDraft("");
  };

  const tabIndexProp = isThumb ? { tabIndex: -1 } : {};
  const triggerPreviewNote = (actionLabel) => {
    if (isThumb) return;
    setPreviewNote(`${actionLabel} opens after launch when your checkout is connected.`);
  };

  return (
    <div
      className="clp-root clp-container"
      style={{
        "--clp-tint": palette.tint,
        backgroundColor: palette.pageBg,
        color: palette.textPrimary,
      }}
    >
      {/* a. Navigation */}
      <header
        style={{
          backgroundColor: palette.mutedBg,
          borderBottom: `1px solid ${palette.subtleLine}`,
        }}
      >
        <div className="clp-inner clp-nav-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
            <span
              aria-hidden="true"
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.5rem",
                backgroundColor: palette.solid,
                color: palette.onSolid,
                border: `1px solid ${palette.buttonBorder}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.9375rem",
                flexShrink: 0,
              }}
            >
              {logoLetter}
            </span>
            {editable ? (
              <input
                type="text"
                aria-label="Product name"
                value={concept?.name ?? ""}
                placeholder="Product name"
                onChange={(e) => onFieldChange?.("name", e.target.value)}
                className="clp-edit-field"
                style={{
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  width: "min(22rem, 48vw)",
                  padding: "0.3rem 0.6rem",
                }}
              />
            ) : (
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: palette.textPrimary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayTitle}
              </span>
            )}
          </div>

          <nav aria-label="Landing page navigation" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            <button
              type="button"
              {...tabIndexProp}
              onClick={() => triggerPreviewNote("Member login")}
              className="clp-nav-login"
              style={{
                background: "transparent",
                border: `1px solid ${palette.subtleLine}`,
                borderRadius: "0.5rem",
                color: palette.textBody,
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "0.5rem 0.875rem",
                minHeight: "2.25rem",
                alignItems: "center",
              }}
            >
              Log in
            </button>
            <button
              type="button"
              {...tabIndexProp}
              onClick={() => triggerPreviewNote("Early access signup")}
              style={{
                backgroundColor: palette.solid,
                color: palette.onSolid,
                border: `1px solid ${palette.buttonBorder}`,
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "0.5rem 1rem",
                minHeight: "2.25rem",
                whiteSpace: "nowrap",
              }}
            >
              Get early access
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* b. Hero — 3 distinct layouts by concept variant */}
        <section style={{ backgroundColor: palette.mutedBg, borderBottom: `1px solid ${palette.subtleLine}` }}>
          <div
            className={
              layoutVariant === 1
                ? "clp-inner clp-hero clp-hero-centered"
                : layoutVariant === 2
                  ? "clp-inner clp-hero clp-hero-grid clp-hero-grid-reversed"
                  : "clp-inner clp-hero clp-hero-grid"
            }
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: layoutVariant === 1 ? "center" : "flex-start",
                gap: "1.25rem",
                minWidth: 0,
                maxWidth: layoutVariant === 1 ? "46rem" : "none",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.28rem 0.72rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  backgroundColor: palette.softBg,
                  color: palette.tint,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: "0.45rem", height: "0.45rem", borderRadius: "9999px", backgroundColor: palette.solid }}
                />
                {archetypeEyebrow}
              </span>

              {editable ? (
                <div style={{ width: "100%" }}>
                  <label htmlFor="clp-hero-tagline" className="clp-edit-label">
                    Hero headline (tagline)
                  </label>
                  <textarea
                    id="clp-hero-tagline"
                    rows={2}
                    value={concept?.tagline ?? ""}
                    placeholder="Clear outcome headline for the landing page..."
                    onChange={(e) => onFieldChange?.("tagline", e.target.value)}
                    className="clp-edit-field clp-serif"
                    style={{
                      fontSize: "clamp(1.65rem, 3vw, 2.5rem)",
                      lineHeight: 1.15,
                      resize: "vertical",
                    }}
                  />
                </div>
              ) : (
                <h1 className="clp-serif clp-h1" style={{ color: palette.textPrimary }}>
                  {heroHeadline}
                </h1>
              )}

              {editable ? (
                <div style={{ width: "100%" }}>
                  <label htmlFor="clp-hero-problem" className="clp-edit-label">
                    Problem it solves (sub-headline)
                  </label>
                  <textarea
                    id="clp-hero-problem"
                    rows={2}
                    value={concept?.problem ?? concept?.description ?? ""}
                    placeholder="Describe the core frustration this product eliminates..."
                    onChange={(e) => onFieldChange?.("problem", e.target.value)}
                    className="clp-edit-field"
                    style={{
                      fontSize: "1rem",
                      lineHeight: 1.5,
                      maxWidth: "40rem",
                      resize: "vertical",
                    }}
                  />
                </div>
              ) : (
                problem && (
                  <p className="clp-sub" style={{ color: palette.textBody, maxWidth: "40rem" }}>
                    {problem}
                  </p>
                )
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: layoutVariant === 1 ? "center" : "flex-start",
                  flexWrap: "wrap",
                  gap: "1rem",
                  paddingTop: "0.25rem",
                }}
              >
                <button
                  type="button"
                  {...tabIndexProp}
                  onClick={() => triggerPreviewNote("Early access")}
                  style={{
                    backgroundColor: palette.solid,
                    color: palette.onSolid,
                    border: `1px solid ${palette.buttonBorder}`,
                    borderRadius: layoutVariant === 2 ? "9999px" : "0.625rem",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    padding: "0.75rem 1.375rem",
                    minHeight: "2.75rem",
                  }}
                >
                  {layoutVariant === 1 ? "Launch workspace" : layoutVariant === 2 ? "Join member vault" : "Get early access"}
                </button>
                {editable ? (
                  <input
                    type="text"
                    aria-label="Pricing summary"
                    value={typeof concept?.pricing === "string" ? concept.pricing : priceText}
                    placeholder="$29/mo Starter · $79/mo Pro"
                    onChange={(e) => onFieldChange?.("pricing", e.target.value)}
                    className="clp-edit-field"
                    style={{ width: "min(20rem, 100%)", fontSize: "0.9375rem", fontWeight: 500 }}
                  />
                ) : (
                  priceText && (
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: palette.textBody }}>
                      {priceText}
                    </span>
                  )
                )}
              </div>

              {previewNote && !isThumb && (
                <p
                  role="status"
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: palette.tint,
                  }}
                >
                  {previewNote}
                </p>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", paddingTop: "0.5rem" }}>
                <img
                  src={avatarSrc}
                  alt=""
                  width={28}
                  height={28}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackAvatarSrc;
                  }}
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "9999px",
                    objectFit: "cover",
                    border: `1px solid ${palette.strongBorder}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.875rem", color: palette.textMuted }}>
                  Made with {creatorName}
                </span>
              </div>
            </div>

            <figure
              className={layoutVariant === 2 ? "clp-hero-reversed-fig" : undefined}
              style={{
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
                minWidth: 0,
                width: layoutVariant === 1 ? "min(46rem, 100%)" : "auto",
              }}
            >
              <div
                style={{
                  backgroundColor: palette.surfaceBg,
                  border: `1px solid ${palette.border}`,
                  borderRadius: "1.125rem",
                  padding: "0.5rem",
                  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.35)",
                }}
              >
                <HeroIllustration
                  concept={concept}
                  conceptIndex={conceptIndex}
                  brandColor={palette.solid}
                  labels={featureLabelsForArt}
                  title={displayTitle}
                />
              </div>
              <figcaption style={{ fontSize: "0.8125rem", color: palette.textMuted, textAlign: "center" }}>
                Sample data, for illustration
              </figcaption>
            </figure>
          </div>
        </section>

        {/* c. Product visual (from keyFeatures, neutral software window) */}
        {features.length > 0 && (
          <section className="clp-section" style={{ borderBottom: `1px solid ${palette.subtleLine}` }}>
            <div className="clp-inner" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem" }}>
                <h2 className="clp-serif clp-h2" style={{ color: palette.textPrimary }}>
                  Inside {displayTitle}
                </h2>
                <span style={{ fontSize: "0.8125rem", color: palette.textMuted }}>
                  Sample data, for illustration
                </span>
              </div>

              <div
                style={{
                  backgroundColor: palette.surfaceBg,
                  border: `1px solid ${palette.subtleLine}`,
                  borderRadius: "1rem",
                  overflow: "hidden",
                }}
              >
                {/* Neutral window header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: palette.raisedBg,
                    borderBottom: `1px solid ${palette.subtleLine}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                    <span aria-hidden="true" style={{ display: "inline-flex", gap: "0.35rem", flexShrink: 0 }}>
                      <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.22)" }} />
                      <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.22)" }} />
                      <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.22)" }} />
                    </span>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: palette.textBody,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {displayTitle}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: palette.textMuted, flexShrink: 0 }}>
                    Sample data, for illustration
                  </span>
                </div>

                {/* Product interior — distinct architecture per concept variant */}
                <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {layoutVariant === 1 ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          padding: "0.65rem 0.875rem",
                          borderRadius: "0.625rem",
                          backgroundColor: palette.pageBg,
                          border: `1px solid ${palette.border}`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                          <span style={{ color: palette.tint, fontWeight: 700, fontSize: "0.875rem" }}>&gt;</span>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              color: palette.textPrimary,
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {tagline || `Run ${displayTitle} generation workflow`}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "0.25rem 0.625rem",
                            borderRadius: "0.45rem",
                            backgroundColor: palette.solid,
                            color: palette.onSolid,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          Generate
                        </span>
                      </div>

                      <div className="clp-studio-grid">
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {features.slice(0, 4).map((feat, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "0.65rem 0.85rem",
                                borderRadius: "0.625rem",
                                backgroundColor: idx === 0 ? palette.softBg : palette.pageBg,
                                border: `1px solid ${idx === 0 ? palette.solid : palette.subtleLine}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.5rem",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: idx === 0 ? palette.tint : palette.textMuted }}>
                                  0{idx + 1}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: palette.textPrimary,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {feat.title}
                                </span>
                              </div>
                              <span style={{ fontSize: "0.6875rem", color: palette.tint, flexShrink: 0 }}>
                                {idx === 0 ? "Active" : "Ready"}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            padding: "1rem",
                            borderRadius: "0.75rem",
                            backgroundColor: "#0c0f15",
                            border: `1px solid ${palette.subtleLine}`,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "0.875rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: palette.textPrimary }}>
                              {features[0]?.title || displayTitle} Output
                            </span>
                            <span style={{ fontSize: "0.6875rem", color: palette.tint }}>Live synthesis</span>
                          </div>
                          <svg viewBox="0 0 360 120" role="img" aria-label="Copilot trajectory preview" className="clp-svg" style={{ width: "100%", height: "auto" }}>
                            <rect width="360" height="120" rx="10" fill="#10131a" />
                            <rect x="16" y="16" width="140" height="10" rx="5" fill={palette.softBg} />
                            <rect x="16" y="34" width="210" height="8" rx="4" fill="#232938" />
                            <polyline
                              fill="none"
                              stroke={palette.solid}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points="20,98 84,84 148,88 212,64 276,56 340,32"
                            />
                            <circle cx="340" cy="32" r="5" fill="#ffffff" />
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : layoutVariant === 2 ? (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {["All Modules", "Playbooks", "Live Sessions", "Peer Directory"].map((tab, tIdx) => (
                          <span
                            key={tab}
                            style={{
                              padding: "0.3rem 0.7rem",
                              borderRadius: "0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: tIdx === 0 ? 600 : 500,
                              backgroundColor: tIdx === 0 ? palette.softBg : palette.pageBg,
                              color: tIdx === 0 ? palette.tint : palette.textMuted,
                              border: `1px solid ${tIdx === 0 ? palette.solid : palette.subtleLine}`,
                            }}
                          >
                            {tab}
                          </span>
                        ))}
                      </div>
                      <div className="clp-vault-grid">
                        {features.slice(0, 4).map((feat, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "1rem",
                              borderRadius: "0.75rem",
                              backgroundColor: idx === 0 ? palette.softBg : palette.pageBg,
                              border: `1px solid ${idx === 0 ? palette.solid : palette.subtleLine}`,
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.45rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                              <span
                                style={{
                                  width: "2rem",
                                  height: "0.25rem",
                                  borderRadius: "9999px",
                                  backgroundColor: palette.solid,
                                }}
                              />
                              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: palette.tint }}>
                                0{idx + 1} · Vault
                              </span>
                            </div>
                            <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: palette.textPrimary }}>
                              {feat.title}
                            </div>
                            <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.45, color: palette.textMuted }}>
                              {feat.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: "100%",
                          borderRadius: "0.75rem",
                          overflow: "hidden",
                          border: `1px solid ${palette.subtleLine}`,
                          backgroundColor: "#10131a",
                        }}
                      >
                        <WorkflowArt
                          brand={palette.solid}
                          labels={featureLabelsForArt}
                          title={displayTitle}
                        />
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
                          gap: "0.5rem",
                        }}
                      >
                        {features.slice(0, 4).map((feat, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "0.55rem 0.75rem",
                              borderRadius: "0.5rem",
                              backgroundColor: palette.pageBg,
                              border: `1px solid ${palette.subtleLine}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "0.5rem",
                              minWidth: 0,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                              <span
                                aria-hidden="true"
                                style={{
                                  width: "0.45rem",
                                  height: "0.45rem",
                                  borderRadius: "9999px",
                                  backgroundColor: idx === 0 ? palette.tint : "rgba(255,255,255,0.3)",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.8125rem",
                                  fontWeight: idx === 0 ? 600 : 500,
                                  color: idx === 0 ? palette.textPrimary : palette.textBody,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {feat.title}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "0.6875rem",
                                fontWeight: 500,
                                color: palette.tint,
                                backgroundColor: palette.softBg,
                                border: `1px solid ${palette.border}`,
                                borderRadius: "9999px",
                                padding: "0.1rem 0.45rem",
                                flexShrink: 0,
                              }}
                            >
                              Included
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* d. Features */}
        {(editable || features.length > 0) && (
          <section className="clp-section" style={{ borderBottom: `1px solid ${palette.subtleLine}` }}>
            <div className="clp-inner" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h2 className="clp-serif clp-h2" style={{ color: palette.textPrimary }}>
                What you get inside
              </h2>

              <div
                className={
                  editable
                    ? "clp-features-grid"
                    : layoutVariant === 1
                      ? "clp-features-list"
                      : layoutVariant === 2
                        ? "clp-features-deck"
                        : "clp-features-grid"
                }
              >
                {editable ? (
                  <>
                    {rawFeatures.map((rawTitle, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: palette.surfaceBg,
                          border: `1px solid ${palette.subtleLine}`,
                          borderRadius: "0.875rem",
                          padding: "1rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                          <span className="clp-edit-label" style={{ margin: 0 }}>
                            Feature {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveFeature?.(idx)}
                            aria-label={`Remove feature ${idx + 1}`}
                            style={{
                              background: "transparent",
                              border: 0,
                              color: "#aeb5c2",
                              padding: "0.25rem",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <Trash2 aria-hidden="true" style={{ width: "0.9375rem", height: "0.9375rem" }} />
                          </button>
                        </div>
                        <input
                          type="text"
                          aria-label={`Feature ${idx + 1} name`}
                          value={rawTitle ?? ""}
                          onChange={(e) => onFeatureChange?.(idx, e.target.value)}
                          className="clp-edit-field"
                          style={{ fontSize: "0.9375rem", fontWeight: 600 }}
                        />
                        {features[idx]?.description && (
                          <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.5, color: palette.textMuted }}>
                            {features[idx].description}
                          </p>
                        )}
                      </div>
                    ))}
                    <div
                      style={{
                        backgroundColor: palette.mutedBg,
                        border: `1px dashed ${palette.border}`,
                        borderRadius: "0.875rem",
                        padding: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        justifyContent: "center",
                      }}
                    >
                      <label htmlFor="clp-add-feature" className="clp-edit-label">
                        Add another feature
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          id="clp-add-feature"
                          type="text"
                          value={newFeatureDraft}
                          placeholder="e.g. Live cohort Q&A"
                          onChange={(e) => setNewFeatureDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitNewFeature();
                            }
                          }}
                          className="clp-edit-field"
                          style={{ fontSize: "0.875rem" }}
                        />
                        <button
                          type="button"
                          onClick={commitNewFeature}
                          style={{
                            backgroundColor: palette.solid,
                            color: palette.onSolid,
                            border: `1px solid ${palette.buttonBorder}`,
                            borderRadius: "0.5rem",
                            padding: "0 0.75rem",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            flexShrink: 0,
                          }}
                        >
                          <Plus aria-hidden="true" style={{ width: "0.875rem", height: "0.875rem" }} />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : layoutVariant === 1 ? (
                  features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: palette.surfaceBg,
                        border: `1px solid ${palette.subtleLine}`,
                        borderLeft: `3px solid ${palette.solid}`,
                        borderRadius: "0.75rem",
                        padding: "1rem 1.25rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "1rem",
                      }}
                    >
                      <span
                        style={{
                          width: "2.25rem",
                          height: "2.25rem",
                          borderRadius: "0.5rem",
                          backgroundColor: palette.softBg,
                          border: `1px solid ${palette.border}`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FeatureIcon title={feat.title} color={palette.tint} size={18} />
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
                        <h3 className="clp-h3" style={{ color: palette.textPrimary }}>
                          {feat.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.55, color: palette.textBody }}>
                          {feat.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : layoutVariant === 2 ? (
                  features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: palette.surfaceBg,
                        border: `1px solid ${palette.subtleLine}`,
                        borderTop: `3px solid ${palette.solid}`,
                        borderRadius: "0.875rem",
                        padding: "1.15rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.55rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: palette.tint }}>
                          MODULE 0{idx + 1}
                        </span>
                        <FeatureIcon title={feat.title} color={palette.tint} size={16} />
                      </div>
                      <h3 className="clp-h3" style={{ color: palette.textPrimary }}>
                        {feat.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5, color: palette.textBody }}>
                        {feat.description}
                      </p>
                    </div>
                  ))
                ) : (
                  features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: palette.surfaceBg,
                        border: `1px solid ${palette.subtleLine}`,
                        borderRadius: "0.875rem",
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                        <span
                          style={{
                            width: "2rem",
                            height: "2rem",
                            borderRadius: "0.5rem",
                            backgroundColor: palette.softBg,
                            border: `1px solid ${palette.border}`,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FeatureIcon title={feat.title} color={palette.tint} size={18} />
                        </span>
                        <h3 className="clp-h3" style={{ color: palette.textPrimary, paddingTop: "0.18rem" }}>
                          {feat.title}
                        </h3>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.55, color: palette.textBody }}>
                        {feat.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* How it works: 3-step connected flow */}
        <section className="clp-section" style={{ borderBottom: `1px solid ${palette.subtleLine}` }}>
          <div className="clp-inner" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 className="clp-serif clp-h2" style={{ color: palette.textPrimary }}>
              How it works
            </h2>

            <div className="clp-steps-grid">
              {howItWorksSteps.map((step, idx) => (
                <Fragment key={step.num}>
                  <div
                    style={{
                      backgroundColor: palette.surfaceBg,
                      border: `1px solid ${idx === 0 ? palette.border : palette.subtleLine}`,
                      borderRadius: "0.875rem",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.625rem",
                      minWidth: 0,
                      height: "100%",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <svg className="clp-svg" stroke="none" viewBox="0 0 36 36" width="32" height="32" aria-hidden="true" style={{ flexShrink: 0 }}>
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill={idx === 0 ? palette.solid : palette.softBg}
                          stroke={palette.border}
                          strokeWidth="1.5"
                        />
                        <text
                          x="18"
                          y="22.5"
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="700"
                          fontFamily="'Roboto', sans-serif"
                          fill={idx === 0 ? palette.onSolid : palette.tint}
                        >
                          {step.num}
                        </text>
                      </svg>
                      <h3 className="clp-h3" style={{ color: palette.textPrimary }}>
                        {step.title}
                      </h3>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.55, color: palette.textBody }}>
                      {step.detail}
                    </p>
                  </div>

                  {idx < howItWorksSteps.length - 1 && (
                    <>
                      <div className="clp-step-arrow-right" aria-hidden="true">
                        <svg className="clp-icon-svg" viewBox="0 0 36 20" width="36" height="20" fill="none">
                          <line x1="2" y1="10" x2="28" y2="10" stroke={palette.tint} strokeWidth="2" strokeDasharray="3 3" />
                          <polygon points="27,5 35,10 27,15" fill={palette.tint} />
                        </svg>
                      </div>
                      <div className="clp-step-arrow-down" aria-hidden="true">
                        <svg className="clp-icon-svg" viewBox="0 0 20 26" width="20" height="26" fill="none">
                          <line x1="10" y1="2" x2="10" y2="19" stroke={palette.tint} strokeWidth="2" strokeDasharray="3 3" />
                          <polygon points="5,18 10,25 15,18" fill={palette.tint} />
                        </svg>
                      </div>
                    </>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Built from your community's questions (creator post thumbnails; hidden when none load) */}
        {visibleThumbs.length > 0 && (
          <section className="clp-section" style={{ borderBottom: `1px solid ${palette.subtleLine}` }}>
            <div className="clp-inner" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h2 className="clp-serif clp-h2" style={{ color: palette.textPrimary }}>
                Built from your community's questions
              </h2>
              <div className="clp-thumbs-grid">
                {visibleThumbs.map((thumb, idx) => (
                  <div
                    key={thumb.url}
                    style={{
                      backgroundColor: palette.surfaceBg,
                      border: `1px solid ${palette.subtleLine}`,
                      borderRadius: "0.875rem",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <img
                      src={thumb.url}
                      alt={thumb.caption || `${creatorName} post ${idx + 1}`}
                      decoding="async"
                      onError={() => {
                        setFailedThumbUrls((prev) => {
                          if (prev.has(thumb.url)) return prev;
                          const next = new Set(prev);
                          next.add(thumb.url);
                          return next;
                        });
                      }}
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 9",
                        objectFit: "cover",
                        display: "block",
                        backgroundColor: palette.pageBg,
                      }}
                    />
                    {thumb.caption && (
                      <p
                        style={{
                          margin: 0,
                          padding: "0.75rem 0.875rem",
                          fontSize: "0.8125rem",
                          lineHeight: 1.4,
                          color: palette.textBody,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {thumb.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* e. Who it's for */}
        {hasAudienceSection && (
          <section className="clp-section" style={{ borderBottom: `1px solid ${palette.subtleLine}` }}>
            <div className="clp-inner" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h2 className="clp-serif clp-h2" style={{ color: palette.textPrimary }}>
                Who it is built for
              </h2>

              <div className="clp-audience-grid">
                {(editable || customerFit || problem) && (
                  <div
                    style={{
                      backgroundColor: palette.surfaceBg,
                      border: `1px solid ${palette.subtleLine}`,
                      borderRadius: "0.875rem",
                      padding: "1.375rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.875rem",
                    }}
                  >
                    {editable ? (
                      <>
                        <div>
                          <label htmlFor="clp-target-audience" className="clp-edit-label">
                            Target audience
                          </label>
                          <textarea
                            id="clp-target-audience"
                            rows={2}
                            value={concept?.demographicAlignment ?? concept?.customer ?? ""}
                            placeholder="Who is this software built for?"
                            onChange={(e) => {
                              onFieldChange?.("demographicAlignment", e.target.value);
                              onFieldChange?.("customer", e.target.value);
                            }}
                            className="clp-edit-field"
                            style={{ fontSize: "0.9375rem", lineHeight: 1.5, resize: "vertical" }}
                          />
                        </div>
                        <div style={{ paddingTop: "0.5rem", borderTop: `1px solid ${palette.subtleLine}` }}>
                          <label htmlFor="clp-audience-problem" className="clp-edit-label">
                            Problem it solves
                          </label>
                          <textarea
                            id="clp-audience-problem"
                            rows={2}
                            value={concept?.problem ?? concept?.description ?? ""}
                            placeholder="What manual pain or friction does it fix?"
                            onChange={(e) => onFieldChange?.("problem", e.target.value)}
                            className="clp-edit-field"
                            style={{ fontSize: "0.9375rem", lineHeight: 1.5, resize: "vertical" }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {customerFit && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                            <h3 className="clp-h3" style={{ color: palette.textPrimary }}>
                              Target audience
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.6, color: palette.textBody }}>
                              {customerFit}
                            </p>
                          </div>
                        )}
                        {problem && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.375rem",
                              paddingTop: customerFit ? "0.875rem" : 0,
                              borderTop: customerFit ? `1px solid ${palette.subtleLine}` : "none",
                            }}
                          >
                            <h3 className="clp-h3" style={{ color: palette.textPrimary }}>
                              Problem it solves
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.6, color: palette.textBody }}>
                              {problem}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {(editable || evidenceQuote) && (
                  <div
                    style={{
                      backgroundColor: palette.mutedBg,
                      border: `1px solid ${palette.border}`,
                      borderRadius: "0.875rem",
                      padding: "1.375rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <h3 className="clp-h3" style={{ color: palette.tint }}>
                      Why {creatorName}'s community wants it
                    </h3>
                    {editable ? (
                      <textarea
                        aria-label={`Why ${creatorName}'s community wants it`}
                        rows={4}
                        value={concept?.audienceEvidence ?? concept?.rationale ?? ""}
                        placeholder="Recurring community comment or research signal..."
                        onChange={(e) => onFieldChange?.("audienceEvidence", e.target.value)}
                        className="clp-edit-field"
                        style={{ fontSize: "0.9375rem", lineHeight: 1.55, resize: "vertical" }}
                      />
                    ) : (
                      <blockquote
                        style={{
                          margin: 0,
                          fontSize: "0.9375rem",
                          lineHeight: 1.6,
                          color: palette.textPrimary,
                          fontStyle: "italic",
                        }}
                      >
                        “{evidenceQuote}”
                      </blockquote>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* f. Pricing */}
        {hasPricingSection && (
          <section className="clp-section" style={{ borderBottom: `1px solid ${palette.subtleLine}` }}>
            <div className="clp-inner" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h2 className="clp-serif clp-h2" style={{ color: palette.textPrimary }}>
                Pricing
              </h2>

              <div
                style={{
                  backgroundColor: palette.surfaceBg,
                  border: `1px solid ${palette.border}`,
                  borderRadius: "1rem",
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                <div className="clp-plan-row">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                    <h3 className="clp-h3" style={{ color: palette.textPrimary }}>
                      {productName ? `${productName} Membership` : "Early Access Plan"}
                    </h3>
                    {editable ? (
                      <div style={{ display: "grid", gap: "0.625rem", maxWidth: "34rem" }}>
                        <div>
                          <label htmlFor="clp-pricing-line" className="clp-edit-label">
                            Pricing tiers
                          </label>
                          <input
                            id="clp-pricing-line"
                            type="text"
                            value={typeof concept?.pricing === "string" ? concept.pricing : priceText}
                            placeholder="$29/mo Starter · $79/mo Pro"
                            onChange={(e) => onFieldChange?.("pricing", e.target.value)}
                            className="clp-edit-field"
                            style={{ fontSize: "1.125rem", fontWeight: 700 }}
                          />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.625rem" }}>
                          <div>
                            <label htmlFor="clp-revenue-model" className="clp-edit-label">
                              Revenue model
                            </label>
                            <input
                              id="clp-revenue-model"
                              type="text"
                              value={concept?.revenueModel ?? ""}
                              placeholder="SaaS Subscription · 50/50 Revenue Share"
                              onChange={(e) => onFieldChange?.("revenueModel", e.target.value)}
                              className="clp-edit-field"
                              style={{ fontSize: "0.875rem" }}
                            />
                          </div>
                          <div>
                            <label htmlFor="clp-mvp-difficulty" className="clp-edit-label">
                              Launch estimate
                            </label>
                            <input
                              id="clp-mvp-difficulty"
                              type="text"
                              value={concept?.mvpDifficulty ?? ""}
                              placeholder="2 weeks"
                              onChange={(e) => onFieldChange?.("mvpDifficulty", e.target.value)}
                              className="clp-edit-field"
                              style={{ fontSize: "0.875rem" }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          className="clp-serif"
                          style={{ margin: 0, fontSize: "2.125rem", lineHeight: 1.15, color: palette.textPrimary }}
                        >
                          {priceText}
                        </p>
                        {revenueModel && (
                          <p style={{ margin: 0, fontSize: "0.875rem", color: palette.textMuted }}>
                            {revenueModel}
                          </p>
                        )}
                        {mvpDifficulty && (
                          <p style={{ margin: 0, fontSize: "0.875rem", color: palette.textMuted }}>
                            Launch estimate: {mvpDifficulty}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    {...tabIndexProp}
                    onClick={() => triggerPreviewNote("Plan selection")}
                    style={{
                      backgroundColor: palette.solid,
                      color: palette.onSolid,
                      border: `1px solid ${palette.buttonBorder}`,
                      borderRadius: "0.625rem",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      padding: "0.75rem 1.375rem",
                      minHeight: "2.75rem",
                      alignSelf: "flex-start",
                    }}
                  >
                    Get early access
                  </button>
                </div>

                {features.length > 0 && (
                  <ul
                    style={{
                      margin: 0,
                      padding: "1rem 0 0 0",
                      listStyle: "none",
                      borderTop: `1px solid ${palette.subtleLine}`,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "0.625rem 1.25rem",
                    }}
                  >
                    {features.slice(0, 4).map((feat, idx) => (
                      <li
                        key={idx}
                        style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: palette.textBody }}
                      >
                        <Check aria-hidden="true" style={{ width: "1rem", height: "1rem", color: palette.tint, flexShrink: 0, marginTop: "0.15rem" }} />
                        <span>{feat.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {/* g. Final call to action */}
        <section style={{ backgroundColor: palette.mutedBg }}>
          <div className="clp-inner clp-section">
            <div
              style={{
                backgroundColor: palette.surfaceBg,
                border: `1px solid ${palette.border}`,
                borderRadius: "1rem",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <h2 className="clp-serif clp-h2" style={{ color: palette.textPrimary, maxWidth: "40rem" }}>
                {ctaHeadline}
              </h2>
              {problem && (
                <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.6, color: palette.textBody, maxWidth: "38rem" }}>
                  {problem}
                </p>
              )}
              <button
                type="button"
                {...tabIndexProp}
                onClick={() => triggerPreviewNote("Waitlist registration")}
                style={{
                  backgroundColor: palette.solid,
                  color: palette.onSolid,
                  border: `1px solid ${palette.buttonBorder}`,
                  borderRadius: "0.625rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  padding: "0.75rem 1.375rem",
                  minHeight: "2.75rem",
                }}
              >
                Get early access
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: palette.pageBg, borderTop: `1px solid ${palette.subtleLine}` }}>
        <div className="clp-inner clp-footer-row" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <img
              src={avatarSrc}
              alt=""
              width={24}
              height={24}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackAvatarSrc;
              }}
              style={{
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "9999px",
                objectFit: "cover",
                border: `1px solid ${palette.border}`,
              }}
            />
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: palette.textBody }}>
              {displayTitle} with {creatorName}
            </span>
          </div>
          <span style={{ fontSize: "0.8125rem", color: palette.textMuted }}>
            Co-founded with {creatorName}
          </span>
        </div>
      </footer>
    </div>
  );
}

const QUICK_EDIT_COLORS = [
  { name: "Crimson", hex: "#c81e3c" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Indigo", hex: "#6366f1" },
];

function cloneConceptForEdit(src) {
  if (!src) return null;
  const rawList = Array.isArray(src.keyFeatures) ? src.keyFeatures : [];
  const keyFeatures = rawList
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return cleanText(item.title || item.name || item.label);
      return "";
    })
    .filter(Boolean);
  return {
    ...src,
    keyFeatures,
    pricing: typeof src.pricing === "string" ? src.pricing : resolvePriceText(src.pricing),
  };
}

/**
 * Shared product landing page component used across Step 5 thumbnails, full-page modal,
 * customized pitch deck, and proposal email preview.
 */
export default function ConceptLandingPage({
  concept,
  conceptIndex = null,
  creator,
  brandColor,
  mode = "full",
  isEditing = false,
  onFieldChange,
  onFeatureChange,
  onAddFeature,
  onRemoveFeature,
  getCreatorAvatar,
  generateCreatorAvatarSvg,
}) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  const palette = useMemo(() => deriveBrandPalette(brandColor), [brandColor]);
  const isThumb = mode === "thumb";

  useIsomorphicLayoutEffect(() => {
    if (!isThumb) return undefined;
    const el = wrapRef.current;
    if (!el) return undefined;

    el.inert = true;

    const measure = () => {
      const width = el.clientWidth;
      if (width > 0) {
        const nextScale = width / 1200;
        setScale((prev) => (Math.abs(prev - nextScale) > 0.001 ? nextScale : prev));
      }
    };
    measure();

    let rafId = 0;
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (!width) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const nextScale = width / 1200;
        setScale((prev) => (Math.abs(prev - nextScale) > 0.001 ? nextScale : prev));
      });
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [isThumb]);

  if (isThumb) {
    return (
      <div
        ref={wrapRef}
        aria-hidden="true"
        style={{
          position: "relative",
          width: "100%",
          height: "420px",
          overflow: "hidden",
          borderRadius: "0.75rem",
          backgroundColor: palette.pageBg,
          border: `1px solid ${palette.subtleLine}`,
          pointerEvents: "none",
          userSelect: "none",
          contain: "strict",
        }}
      >
        <style>{LANDING_CSS}</style>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <LandingPageSurface
            concept={concept}
            conceptIndex={conceptIndex}
            creator={creator}
            palette={palette}
            isThumb={true}
            getCreatorAvatar={getCreatorAvatar}
            generateCreatorAvatarSvg={generateCreatorAvatarSvg}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: palette.pageBg, width: "100%" }}>
      <style>{LANDING_CSS}</style>
      <LandingPageSurface
        concept={concept}
        conceptIndex={conceptIndex}
        creator={creator}
        palette={palette}
        isThumb={false}
        isEditing={isEditing}
        onFieldChange={onFieldChange}
        onFeatureChange={onFeatureChange}
        onAddFeature={onAddFeature}
        onRemoveFeature={onRemoveFeature}
        getCreatorAvatar={getCreatorAvatar}
        generateCreatorAvatarSvg={generateCreatorAvatarSvg}
      />
    </div>
  );
}

/**
 * Full-screen native <dialog> modal hosting <ConceptLandingPage mode="full" />
 * with desktop/mobile width toggle, direct inline landing-page editing, Escape handling,
 * native top-layer inertness, and automatic focus restoration to the invoking button.
 */
export function ConceptLandingModal({
  isOpen,
  onClose,
  concept,
  conceptIndex = null,
  creator,
  brandColor,
  initialEditing = false,
  onSave,
  onEdit,
  getCreatorAvatar,
  generateCreatorAvatarSvg,
}) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const invokerRef = useRef(null);
  const titleId = useId();
  const [viewport, setViewport] = useState("desktop");
  const [isEditing, setIsEditing] = useState(Boolean(initialEditing && onSave));
  const [draft, setDraft] = useState(() => cloneConceptForEdit(concept));
  const [colorChanged, setColorChanged] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(cloneConceptForEdit(concept));
    }
  }, [concept, isEditing]);

  useIsomorphicLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (isOpen && !dialog.open) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && !dialog.contains(active)) {
        invokerRef.current = active;
      }
      setViewport("desktop");
      setDraft(cloneConceptForEdit(concept));
      setIsEditing(Boolean(initialEditing && onSave));
      setColorChanged(false);
      setSavedNotice(false);
      dialog.showModal();
      closeBtnRef.current?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
    return undefined;
  }, [isOpen]);

  const restoreFocusToInvoker = () => {
    const target = invokerRef.current;
    if (!target || !target.isConnected) return;
    requestAnimationFrame(() => {
      if (document.activeElement !== target && target.isConnected) {
        target.focus();
      }
    });
  };

  const handleClose = () => {
    setIsEditing(false);
    setColorChanged(false);
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    } else {
      restoreFocusToInvoker();
      onClose?.();
    }
  };

  const handleFieldChange = (field, value) => {
    setSavedNotice(false);
    setDraft((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const handleFeatureChange = (idx, value) => {
    setSavedNotice(false);
    setDraft((prev) => {
      const base = prev || {};
      const nextFeatures = [...(Array.isArray(base.keyFeatures) ? base.keyFeatures : [])];
      nextFeatures[idx] = value;
      return { ...base, keyFeatures: nextFeatures };
    });
  };

  const handleAddFeature = (value) => {
    setSavedNotice(false);
    setDraft((prev) => {
      const base = prev || {};
      const nextFeatures = [...(Array.isArray(base.keyFeatures) ? base.keyFeatures : []), value];
      return { ...base, keyFeatures: nextFeatures };
    });
  };

  const handleRemoveFeature = (idx) => {
    setSavedNotice(false);
    setDraft((prev) => {
      const base = prev || {};
      const nextFeatures = (Array.isArray(base.keyFeatures) ? base.keyFeatures : []).filter((_, i) => i !== idx);
      return { ...base, keyFeatures: nextFeatures };
    });
  };

  const handleColorSelect = (hex) => {
    const normalized = normalizeHex(hex);
    setSavedNotice(false);
    setColorChanged(true);
    setDraft((prev) => ({ ...(prev || {}), brandColor: normalized }));
  };

  const handleStartEditing = () => {
    setDraft(cloneConceptForEdit(concept));
    setColorChanged(false);
    setSavedNotice(false);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraft(cloneConceptForEdit(concept));
    setColorChanged(false);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!draft || !onSave) return;
    const cleanedFeatures = (Array.isArray(draft.keyFeatures) ? draft.keyFeatures : [])
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    const nextConcept = {
      ...draft,
      name: cleanText(draft.name) || cleanText(concept?.name),
      keyFeatures: cleanedFeatures,
      ...(colorChanged ? { brandColor: normalizeHex(draft.brandColor), isCustomColor: true } : {}),
    };
    onSave(nextConcept);
    setDraft(cloneConceptForEdit(nextConcept));
    setIsEditing(false);
    setColorChanged(false);
    setSavedNotice(true);
  };

  const displayedConcept = draft || concept;
  const effectiveBrandColor = colorChanged
    ? normalizeHex(draft?.brandColor || brandColor)
    : brandColor || draft?.brandColor;
  const titleName = cleanText(displayedConcept?.name) || "Landing page preview";
  const creatorName = getCreatorName(creator);

  return (
    <dialog
      ref={dialogRef}
      className="clp-dialog"
      aria-labelledby={titleId}
      onClose={() => {
        setIsEditing(false);
        setColorChanged(false);
        restoreFocusToInvoker();
        onClose?.();
      }}
    >
      <style>{LANDING_CSS}</style>
      {isOpen && displayedConcept && (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.75rem 1.25rem",
              backgroundColor: "#10131a",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              flexShrink: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                id={titleId}
                style={{
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "#f3f4f6",
                  fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                {titleName}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#aeb5c2" }}>
                {isEditing
                  ? `Editing landing page inline for ${creatorName}`
                  : savedNotice
                    ? `Saved changes for ${creatorName}`
                    : `Full landing page for ${creatorName}`}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <div
                role="group"
                aria-label="Preview width"
                style={{
                  display: "inline-flex",
                  padding: "0.2rem",
                  borderRadius: "0.625rem",
                  backgroundColor: "#08090c",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  gap: "0.25rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewport("desktop")}
                  aria-pressed={viewport === "desktop"}
                  className="clp-modal-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: 0,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: viewport === "desktop" ? "#c81e3c" : "transparent",
                    color: viewport === "desktop" ? "#ffffff" : "#cdd1da",
                    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  <Monitor aria-hidden="true" style={{ width: "0.875rem", height: "0.875rem" }} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  aria-pressed={viewport === "mobile"}
                  className="clp-modal-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: 0,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: viewport === "mobile" ? "#c81e3c" : "transparent",
                    color: viewport === "mobile" ? "#ffffff" : "#cdd1da",
                    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  <Smartphone aria-hidden="true" style={{ width: "0.875rem", height: "0.875rem" }} />
                  <span>Mobile</span>
                </button>
              </div>

              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="clp-modal-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "0.625rem",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                      backgroundColor: "#171b24",
                      color: "#cdd1da",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="clp-modal-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 0.95rem",
                      borderRadius: "0.625rem",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      backgroundColor: "#c81e3c",
                      color: "#ffffff",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    <Check aria-hidden="true" style={{ width: "0.875rem", height: "0.875rem" }} />
                    <span>Save changes</span>
                  </button>
                </>
              ) : onSave ? (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="clp-modal-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.625rem",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    backgroundColor: "#171b24",
                    color: "#f3f4f6",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  <Pencil aria-hidden="true" style={{ width: "0.8125rem", height: "0.8125rem" }} />
                  <span>Edit landing page</span>
                </button>
              ) : onEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onEdit();
                  }}
                  className="clp-modal-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.625rem",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    backgroundColor: "#171b24",
                    color: "#f3f4f6",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  <Pencil aria-hidden="true" style={{ width: "0.8125rem", height: "0.8125rem" }} />
                  <span>Edit concept</span>
                </button>
              ) : null}

              <button
                ref={closeBtnRef}
                type="button"
                onClick={handleClose}
                aria-label="Close landing page preview"
                className="clp-modal-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "0.625rem",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  backgroundColor: "#171b24",
                  color: "#f3f4f6",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                <X aria-hidden="true" style={{ width: "0.9375rem", height: "0.9375rem" }} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {isEditing && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.55rem 1.25rem",
                backgroundColor: "#0c0e13",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ba1ae" }}>
                  Page accent
                </span>
                {QUICK_EDIT_COLORS.map((swatch) => {
                  const active = normalizeHex(effectiveBrandColor) === swatch.hex;
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => handleColorSelect(swatch.hex)}
                      title={`${swatch.name} (${swatch.hex})`}
                      aria-label={`Set landing page accent to ${swatch.name}`}
                      aria-pressed={active}
                      className="clp-modal-btn"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.25rem 0.55rem",
                        borderRadius: "0.45rem",
                        border: active ? `1px solid ${swatch.hex}` : "1px solid rgba(255,255,255,0.12)",
                        backgroundColor: active ? "#171b24" : "transparent",
                        color: active ? "#ffffff" : "#cdd1da",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: "0.625rem",
                          height: "0.625rem",
                          borderRadius: "9999px",
                          backgroundColor: swatch.hex,
                        }}
                      />
                      <span>{swatch.name}</span>
                    </button>
                  );
                })}
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.45rem",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backgroundColor: "#171b24",
                    fontSize: "0.72rem",
                    color: "#cdd1da",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="color"
                    aria-label="Custom accent colour"
                    value={normalizeHex(effectiveBrandColor)}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    style={{
                      width: "1rem",
                      height: "1rem",
                      border: 0,
                      padding: 0,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  />
                  <span>{normalizeHex(effectiveBrandColor).toUpperCase()}</span>
                </label>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#9ba1ae" }}>
                Edit any text or feature directly on the page below, then Save changes.
              </span>
            </div>
          )}

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overscrollBehavior: "contain",
              backgroundColor: "#050608",
              padding: viewport === "mobile" ? "1.25rem 0.75rem" : "0",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: viewport === "mobile" ? "390px" : "100%",
                margin: "0 auto",
                borderRadius: viewport === "mobile" ? "1rem" : "0",
                border: viewport === "mobile" ? "1px solid rgba(255, 255, 255, 0.16)" : "none",
                overflow: viewport === "mobile" ? "hidden" : "visible",
              }}
            >
              <ConceptLandingPage
                concept={displayedConcept}
                conceptIndex={conceptIndex}
                creator={creator}
                brandColor={effectiveBrandColor}
                mode="full"
                isEditing={isEditing}
                onFieldChange={handleFieldChange}
                onFeatureChange={handleFeatureChange}
                onAddFeature={handleAddFeature}
                onRemoveFeature={handleRemoveFeature}
                getCreatorAvatar={getCreatorAvatar}
                generateCreatorAvatarSvg={generateCreatorAvatarSvg}
              />
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}

export { ConceptLandingPage, kindOf };
