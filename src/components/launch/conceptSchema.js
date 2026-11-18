/**
 * conceptSchema.js
 *
 * Single source of truth for "a product concept":
 *   1. the prompt + JSON schema the AI must follow,
 *   2. a normaliser that turns raw model output into the exact fields
 *      ConceptLandingPage reads (and never invents numbers or quotes),
 *   3. buildValidationSeed(), which hands the chosen concept to Phase 1 Step 1.
 *
 * Fields ConceptLandingPage reads today:
 *   name, tagline, problem, keyFeatures[], pricing, customer, audienceEvidence,
 *   revenueModel, mvpDifficulty   (+ opportunityScore on the Step 5 card)
 * Layout variant is chosen by concept INDEX: 0 = workflow, 1 = copilot, 2 = vault.
 */

/* ───────────────────────────── 1. Archetypes ───────────────────────────── */

// Order matters: ConceptLandingPage picks its layout from the concept's index.
export const CONCEPT_ARCHETYPES = [
  {
    key: "workflow",
    label: "Workflow Operating System",
    brief:
      "A tool the audience runs again and again to get a repeatable job done (planner, tracker, checklist engine, template system). Features read like stages of one workflow.",
    featureHint: "Features are the stages of the workflow, in the order a user meets them.",
  },
  {
    key: "copilot",
    label: "AI Intelligence Copilot",
    brief:
      "A tool where the user gives an input and the AI generates, analyses or recommends. The landing page shows the tagline inside a command bar with a Generate button, so the tagline must read like something a user would ask for.",
    featureHint: "Feature 1 is the main thing the AI produces. The rest are supporting outputs.",
  },
  {
    key: "vault",
    label: "Member Vault & Private Cohort",
    brief:
      "A members-only library plus community built on the creator's method (playbooks, live sessions, peer directory). Features read like modules inside the vault.",
    featureHint: "Each feature is a module or resource type inside the vault.",
  },
];

/* ───────────────────────────── 2. Prompt ───────────────────────────────── */

export const SYSTEM_PROMPT = `You are a product strategist at CoLaunch, a studio that co-builds software companies with creators on a 50/50 basis.

Your job: read one creator's audience data and propose exactly 3 software products their audience would pay for. Each product must solve a problem the audience has actually voiced.

HARD RULES
1. Ground everything in the audience data you are given. Never invent comments, statistics, follower counts, testimonials or market sizes.
2. "audienceEvidence" must be ONE comment copied word for word from the supplied comments. If no supplied comment supports the concept, return an empty string. An empty string is better than a paraphrase.
3. The 3 concepts must solve 3 DIFFERENT audience problems. Do not return three variations of one idea.
4. Return the concepts in this exact order and shape, because each one is rendered with a fixed landing-page layout:
   - Concept 1, archetype "workflow": ${CONCEPT_ARCHETYPES[0].brief}
   - Concept 2, archetype "copilot": ${CONCEPT_ARCHETYPES[1].brief}
   - Concept 3, archetype "vault": ${CONCEPT_ARCHETYPES[2].brief}
5. Software only. No courses, e-books, merch, or services that need a human to deliver.
6. It must be buildable as a first version in 2 to 8 weeks by a small team.

COPY RULES (this text is shown on a real landing page)
- name: 1 to 3 words, easy to say aloud, does not contain the creator's name.
- tagline: the outcome the customer gets, 4 to 10 words, plain language. No "AI-powered", "revolutionary", "next-generation", "unlock", or "supercharge".
- problem: 1 to 2 sentences, at most 180 characters, written to the customer ("You..."), describing the frustration in their own terms.
- customer: one line naming who it is for, at most 90 characters.
- keyFeatures: exactly 4 strings in the form "Feature title: what it does for the user". The title is 3 to 28 characters and contains no colon or dash. The description is 15 to 110 characters. The FIRST feature is the one the landing page highlights.
- pricing: one line in the form "$X/mo Starter · $Y/mo Pro". Price for what this audience can afford; do not default to $29/$79.
- Use sentence case. No emojis. No exclamation marks.

SCORING (integers 1 to 5, be honest, use the full range)
- demand: how strongly the supplied data shows people want this
- fit: how well it matches this creator's audience and expertise
- buildability: 5 = very easy to build, 1 = very hard
- monetisation: how clearly the audience would pay

Return JSON only, matching the schema. No prose before or after.`;

export function buildConceptPrompt({ creator = {}, audience = {} }) {
  const comments = (audience.comments || []).slice(0, 60).map((c, i) => ({
    id: `c${i + 1}`,
    text: typeof c === "string" ? c : c.text,
    likes: typeof c === "object" ? c.likes ?? null : null,
    video: typeof c === "object" ? c.videoTitle ?? null : null,
  }));

  const user = {
    creator: {
      name: creator.name || creator.display_name || creator.handle || null,
      handle: creator.handle || null,
      platform: creator.platform || null,
      niche: creator.niche || creator.category || null,
      followers: creator.followers ?? creator.followerCount ?? null,
      bio: creator.bio || null,
    },
    audience: {
      topVideoTitles: (audience.videoTitles || []).slice(0, 20),
      comments,
      statedProblems: audience.problems || [],
    },
    archetypeOrder: CONCEPT_ARCHETYPES.map((a, i) => ({ concept: i + 1, archetype: a.key, hint: a.featureHint })),
  };

  return { system: SYSTEM_PROMPT, user: JSON.stringify(user, null, 2), schema: CONCEPT_JSON_SCHEMA };
}

export const CONCEPT_JSON_SCHEMA = {
  type: "object",
  required: ["concepts"],
  additionalProperties: false,
  properties: {
    concepts: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "archetype", "name", "tagline", "problem", "customer", "keyFeatures", "pricing",
          "presalePrice", "audienceEvidence", "evidenceCommentId", "assumptions", "buildWeeks", "scores",
        ],
        properties: {
          archetype: { enum: ["workflow", "copilot", "vault"] },
          name: { type: "string" },
          tagline: { type: "string" },
          problem: { type: "string" },
          customer: { type: "string" },
          keyFeatures: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
          pricing: { type: "string" },
          presalePrice: { type: "number", description: "One-time or first-period price in USD a customer pays to reserve." },
          audienceEvidence: { type: "string", description: "Verbatim comment, or empty string." },
          evidenceCommentId: { type: "string", description: "id of the comment quoted, or empty string." },
          assumptions: {
            type: "array", minItems: 2, maxItems: 4, items: { type: "string" },
            description: "Things that must be true for people to pay. Each one is testable.",
          },
          buildWeeks: { type: "integer", minimum: 2, maximum: 8 },
          scores: {
            type: "object",
            additionalProperties: false,
            required: ["demand", "fit", "buildability", "monetisation"],
            properties: {
              demand: { type: "integer", minimum: 1, maximum: 5 },
              fit: { type: "integer", minimum: 1, maximum: 5 },
              buildability: { type: "integer", minimum: 1, maximum: 5 },
              monetisation: { type: "integer", minimum: 1, maximum: 5 },
            },
          },
        },
      },
    },
  },
};

/* ───────────────────────────── 3. Normaliser ───────────────────────────── */

const str = (v) => (typeof v === "string" ? v.trim() : "");
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);
const norm = (s) => str(s).toLowerCase().replace(/[\s“”"'’]+/g, " ").trim();
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Landing page parses "Title: description" (title 3–28 chars, no colon/dash). */
function normaliseFeature(raw) {
  const s = str(typeof raw === "object" && raw ? `${raw.title || raw.name || ""}: ${raw.description || ""}` : raw);
  if (!s) return "";
  const m = s.match(/^([^:]{3,64}?)\s*:\s*(.{10,})$/) || s.match(/^([^—–\-]{3,64}?)\s+[—–-]\s+(.{10,})$/);
  if (m) return `${clip(m[1].trim(), 28)}: ${clip(m[2].trim(), 110)}`;
  const title = s.replace(/[:—–]+/g, " ").replace(/\s+/g, " ").trim();
  return title.length >= 3 ? clip(title, 28) : ""; // landing page writes its own description
}

/** A quote only survives if it really appears in the supplied comments. */
export function verifyQuote(quote, comments = []) {
  const q = norm(quote);
  if (q.length < 12) return false;
  return comments.some((c) => norm(typeof c === "string" ? c : c?.text).includes(q));
}

/** Score out of 100 from four 1–5 sub-scores. Returns null when scores are missing. */
export function opportunityScoreFrom(scores) {
  if (!scores) return null;
  const vals = ["demand", "fit", "buildability", "monetisation"].map((k) => Number(scores[k]));
  if (vals.some((v) => !Number.isFinite(v) || v < 1 || v > 5)) return null;
  const weighted = vals[0] * 0.35 + vals[1] * 0.25 + vals[2] * 0.15 + vals[3] * 0.25; // out of 5
  return Math.round((weighted / 5) * 100);
}

export function normalizeConcept(raw, index, { comments = [] } = {}) {
  const archetype = CONCEPT_ARCHETYPES[index] || CONCEPT_ARCHETYPES[0];
  const features = (Array.isArray(raw?.keyFeatures) ? raw.keyFeatures : []).map(normaliseFeature).filter(Boolean).slice(0, 4);

  const quote = str(raw?.audienceEvidence);
  const quoteOk = quote && verifyQuote(quote, comments);

  const weeks = Number(raw?.buildWeeks);
  const presalePrice = Number(raw?.presalePrice);
  const score = opportunityScoreFrom(raw?.scores);

  return {
    id: str(raw?.id) || `concept-${index + 1}`,
    archetype: archetype.key,
    // ── fields ConceptLandingPage reads ──
    name: clip(str(raw?.name), 40),
    tagline: clip(str(raw?.tagline), 120),
    problem: clip(str(raw?.problem), 180),
    customer: clip(str(raw?.customer), 90),
    keyFeatures: features,
    pricing: str(raw?.pricing),
    audienceEvidence: quoteOk ? quote : "",
    revenueModel: "Subscription · 50/50 revenue share",
    mvpDifficulty: Number.isFinite(weeks)
      ? `${clamp(Math.round(weeks), 2, 8)} weeks`
      : str(raw?.mvpDifficulty).replace(/\s*to ship\b/i, "").replace(/^(low|medium|high)\s*\((.*?)\)$/i, "$2") || "2 weeks",
    // ── shown on the Step 5 card; null means "not scored" ──
    opportunityScore: score !== null ? score : (Number.isFinite(Number(raw?.opportunityScore)) ? Number(raw?.opportunityScore) : null),
    // ── carried into Phase 1 ──
    presalePrice: Number.isFinite(presalePrice) && presalePrice > 0 ? presalePrice : null,
    assumptions: (Array.isArray(raw?.assumptions) ? raw.assumptions : []).map(str).filter(Boolean).slice(0, 4),
    evidence: quoteOk ? [{ quote, commentId: str(raw?.evidenceCommentId) || null }] : [],
    scores: raw?.scores || null,
  };
}

/** Returns { concepts, issues }. Issues are human-readable and safe to show in the UI. */
export function normalizeConcepts(rawResponse, { comments = [] } = {}) {
  const list = Array.isArray(rawResponse) ? rawResponse : rawResponse?.concepts;
  const issues = [];
  if (!Array.isArray(list) || list.length < 3) {
    return { concepts: [], issues: ["The AI returned fewer than 3 concepts. Generate again."] };
  }
  const concepts = list.slice(0, 3).map((c, i) => normalizeConcept(c, i, { comments }));
  concepts.forEach((c, i) => {
    const n = i + 1;
    if (!c.name) issues.push(`Concept ${n} has no name.`);
    if (!c.tagline) issues.push(`Concept ${n} has no tagline.`);
    if (c.keyFeatures.length < 3) issues.push(`Concept ${n} has fewer than 3 features.`);
    if (!c.pricing) issues.push(`Concept ${n} has no pricing.`);
    if (list[i]?.audienceEvidence && !c.audienceEvidence) {
      issues.push(`Concept ${n}: the quoted comment was not found in the audience data, so it was removed.`);
    }
  });
  if (new Set(concepts.map((c) => norm(c.name))).size < 3) issues.push("Two concepts share a name.");
  return { concepts, issues };
}

/* ───────────────────────────── 4. Hand-off to Phase 1 ──────────────────── */

/**
 * A starting estimate only. Reach × realistic conversion × price, clamped.
 * The plan screen must show it as editable, with the assumptions beside it.
 */
export function suggestThreshold({ followers, price, conversion = 0.0025 }) {
  const f = Number(followers);
  const p = Number(price);
  if (!Number.isFinite(f) || f <= 0 || !Number.isFinite(p) || p <= 0) return null;
  const buyers = Math.max(10, Math.round(f * conversion));
  const target = clamp(Math.round((buyers * p) / 500) * 500, 1000, 100000);
  return { buyers, target, conversion, basis: `${f.toLocaleString()} followers × ${(conversion * 100).toFixed(2)}% × $${p}` };
}

/**
 * Freeze the chosen concept into the seed Phase 1 Step 1 reads.
 * Call this once, on "Create project". Later edits to the concept do not change a running test.
 */
/** "437K" / "1.2M" / 437000 / "437,000" → number (null when unknown). */
export function parseFollowerCount(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  const m = String(value).replace(/,/g, "").trim().match(/^([\d.]+)\s*([kmb])?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[2] || "").toLowerCase()] || 1;
  const out = Math.round(n * mult);
  return out > 0 ? out : null;
}

/**
 * Founding presale price from a concept pricing string, matching the landing-page offer
 * (one year at 50% off): "$7/mo Starter · $12/mo Pro" → 42, "$99/yr" → 49.5, "$49 one-time" → 49.
 * Uses the cheapest tier. Returns null when no price is found.
 */
export function derivePresalePrice(pricing) {
  const str = String(pricing || "");
  const re = /\$\s*([\d,]+(?:\.\d+)?)\s*(\/\s*(mo|month|monthly|yr|year|annual|annually))?/gi;
  const prices = [];
  let m;
  while ((m = re.exec(str))) {
    const amount = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const period = (m[3] || "").toLowerCase();
    if (period.startsWith("mo")) prices.push(amount * 12 * 0.5);
    else if (period) prices.push(amount * 0.5);
    else prices.push(amount);
  }
  if (!prices.length) return null;
  return Math.round(Math.min(...prices) * 100) / 100;
}

export function buildValidationSeed(concept, creator = {}) {
  const followers =
    parseFollowerCount(creator.followers) ??
    parseFollowerCount(creator.followerCount) ??
    parseFollowerCount(creator.follower_count) ??
    parseFollowerCount(creator.followerStr);
  const price = concept.presalePrice ?? derivePresalePrice(concept.pricing);
  const th = suggestThreshold({ followers, price });
  return {
    frozenAt: new Date().toISOString(),
    conceptId: concept.id,
    product: { name: concept.name, tagline: concept.tagline, archetype: concept.archetype },
    customer: concept.customer,
    problem: concept.problem,
    offer: { pricing: concept.pricing, presalePrice: price, revenueModel: concept.revenueModel },
    features: concept.keyFeatures,
    evidence: concept.evidence,
    assumptionsToTest: concept.assumptions,
    suggestedThreshold: th, // null when followers or price are unknown, so the plan asks the human
    estimatedBuild: concept.mvpDifficulty || null,
    landingPageSource: { conceptId: concept.id, brandColor: concept.brandColor || null },
  };
}

export default {
  CONCEPT_ARCHETYPES,
  SYSTEM_PROMPT,
  CONCEPT_JSON_SCHEMA,
  buildConceptPrompt,
  verifyQuote,
  opportunityScoreFrom,
  normalizeConcept,
  normalizeConcepts,
  suggestThreshold,
  buildValidationSeed,
};
