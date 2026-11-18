/**
 * Single source of truth for the "approved concept landing page".
 *
 * Step 5 renders each concept with <ConceptLandingPage conceptIndex={i} brandColor={...} />.
 * The layout variant (workflow / copilot / vault) comes from the concept index and the
 * colour from the CoLaunch base palette (#c81e3c + distinct accents for concepts 2 & 3).
 * Section 2 and the public /preorder page must use the exact same inputs, so we freeze
 * them onto the selected concept when the project is created and resolve them here.
 */
import { getHarmoniousConceptColors } from "./avatarColorExtractor";

export const COLAUNCH_BASE_BRAND = "#c81e3c";
const ARCHETYPE_INDEX = { workflow: 0, copilot: 1, vault: 2 };
const LEGACY_MOCKUP_INDEX = { saas_os: 0, ai_copilot: 1, knowledge_hub: 2 };
const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RETIRED_ACCENTS = new Set(["#8b5cf6", "#6366f1", "#a78bfa", "#38bdf8"]);

function normalizeHex(value) {
  if (typeof value !== "string" || !HEX_RE.test(value.trim())) return null;
  const raw = value.trim();
  return raw.startsWith("#") ? raw : `#${raw}`;
}

/** Same rule Step 5 uses (resolveConceptBrandHex, non-uniform mode). */
export function resolveConceptLandingColor(concept, index, basePrimary = COLAUNCH_BASE_BRAND) {
  if (concept?.isCustomColor) {
    const custom = normalizeHex(concept.brandColor);
    if (custom) return custom;
  }
  const palette = getHarmoniousConceptColors(basePrimary || COLAUNCH_BASE_BRAND);
  const safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  return palette[safeIndex % palette.length] || COLAUNCH_BASE_BRAND;
}

function resolveIndex(concept, conceptsList) {
  if (Number.isInteger(concept?.landingIndex)) return concept.landingIndex;
  if (Array.isArray(conceptsList) && concept) {
    const idx = conceptsList.findIndex(
      (c) => (concept.id && c?.id === concept.id) || (concept.name && c?.name === concept.name)
    );
    if (idx >= 0) return idx;
  }
  if (concept?.archetype && ARCHETYPE_INDEX[concept.archetype] !== undefined) {
    return ARCHETYPE_INDEX[concept.archetype];
  }
  if (concept?.mockupType && LEGACY_MOCKUP_INDEX[concept.mockupType] !== undefined) {
    return LEGACY_MOCKUP_INDEX[concept.mockupType];
  }
  return 0;
}

/**
 * Resolve the approved landing page inputs for a Section 2 project.
 * @returns {{ concept: object, conceptIndex: number, brandColor: string, creator: object }}
 */
export function resolveProjectLanding(project, overrideConcept = null) {
  const conceptsList =
    (Array.isArray(project?.concepts) && project.concepts.length && project.concepts) ||
    (Array.isArray(project?.productConcepts) && project.productConcepts.length && project.productConcepts) ||
    (Array.isArray(project?.product_concepts) && project.product_concepts.length && project.product_concepts) ||
    [];

  const base =
    overrideConcept ||
    project?.selectedConcept ||
    project?.selected_concept ||
    conceptsList.find((c) => c?.selected) ||
    conceptsList[0] ||
    {};

  // Fill gaps from project-level fields so older projects still render a complete page.
  const concept = {
    ...base,
    name: base.name || project?.productName || project?.title || "New product",
    tagline: base.tagline || project?.productTagline || project?.product_tagline || "",
    problem: base.problem || project?.problem || "",
    customer: base.customer || project?.targetAudience || project?.customer || "",
    pricing: base.pricing || project?.pricing || "",
    keyFeatures:
      (Array.isArray(base.keyFeatures) && base.keyFeatures.length && base.keyFeatures) ||
      (Array.isArray(project?.keyFeatures) && project.keyFeatures.length && project.keyFeatures) ||
      (Array.isArray(base.features) && base.features) ||
      [],
  };

  const conceptIndex = resolveIndex(base, conceptsList);
  // Projects created before the Ember palette froze an "AI" violet/indigo for Concept 3 — recompute those.
  const frozen = normalizeHex(base.landingBrandColor);
  const isRetiredAccent = frozen && RETIRED_ACCENTS.has(frozen.toLowerCase()) && !base.isCustomColor;
  const brandColor = (!isRetiredAccent && frozen) || resolveConceptLandingColor(base, conceptIndex);

  const creator = {
    id: project?.creatorId || project?.creator_id,
    name: project?.creatorName || project?.creator_name || "",
    display_name: project?.creatorName || project?.creator_name || "",
    handle: project?.creatorHandle || project?.creator_handle || "",
    avatar_url: project?.creatorAvatar || project?.creator_avatar || "",
    niche: project?.niche,
    recentPosts: project?.recentPosts || project?.recent_posts,
    videos: project?.videos,
  };

  return { concept, conceptIndex, brandColor, creator };
}
