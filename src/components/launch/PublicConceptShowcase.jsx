import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Mail, Sparkles, X } from "lucide-react";
import ConceptLandingPage from "./ConceptLandingPage";
import {
  generateCreatorAvatarSvg,
  getHarmoniousConceptColors,
} from "../../utils/avatarColorExtractor";
import { formatConceptPricing } from "../../utils/pricing";

const normalizeAlnum = (val) =>
  String(val || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const toSlug = (val) =>
  String(val || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "concept";

const sanitizeHex = (hex, fallback = "#c81e3c") => {
  const s = String(hex || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toUpperCase() : fallback;
};

const hexToRgbTuple = (hex) => {
  const clean = sanitizeHex(hex).slice(1);
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
};

const relLum = ([r, g, b]) => {
  const toLin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
};

const contrastRatioRgb = (a, b) => {
  const la = relLum(a);
  const lb = relLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const pickContrastInk = (hex) => {
  const rgb = hexToRgbTuple(hex);
  return contrastRatioRgb([255, 255, 255], rgb) >= contrastRatioRgb([11, 12, 16], rgb)
    ? "#ffffff"
    : "#0b0c10";
};

const pickReadableAccentOnDark = (hex) => {
  const base = hexToRgbTuple(hex);
  const darkSurface = [16, 19, 26];
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    const cand = [
      Math.round(base[0] * (1 - t) + 255 * t),
      Math.round(base[1] * (1 - t) + 255 * t),
      Math.round(base[2] * (1 - t) + 255 * t),
    ];
    if (contrastRatioRgb(cand, darkSurface) >= 5.0) {
      return `#${cand.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    }
  }
  return "#f3f4f6";
};

function readLocalBrandColor(creator) {
  try {
    const raw = localStorage.getItem("forge_creator_brand_color_map");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const entry = parsed[creator?.id] || parsed[creator?.handle] || null;
    if (!entry) return null;
    return typeof entry === "string" ? entry : entry.primaryHex || entry.colors?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Public 3-concept landing page showcase opened from creator pitch emails
 * (/preorder/:creatorSlug?concept=:conceptSlug or /concept/:creatorSlug).
 */
export default function PublicConceptShowcase({ slug }) {
  const [loading, setLoading] = useState(true);
  const [creatorRecord, setCreatorRecord] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chooseModalOpen, setChooseModalOpen] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("choose") === "1"
  );
  const [creatorEmailInput, setCreatorEmailInput] = useState("");
  const [creatorNote, setCreatorNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedChoice, setSubmittedChoice] = useState(null);

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams(window.location.search);
    const conceptParam = params.get("concept") || "";

    const loadShowcase = async () => {
      setLoading(true);
      try {
        const { getCreators, getProjectBySlug, getCoLaunchProjects } = await import(
          "../../services/opsApi"
        );
        let matchedCreator = null;

        try {
          const res = await getCreators();
          const list = Array.isArray(res) ? res : res?.creators || [];
          const cleanSlug = normalizeAlnum(slug);
          matchedCreator =
            list.find((c) => {
              const cHandle = normalizeAlnum(c.handle);
              const cName = normalizeAlnum(c.name || c.display_name);
              const cId = normalizeAlnum(c.id);
              return (
                cleanSlug &&
                (cHandle === cleanSlug || cName === cleanSlug || cId === cleanSlug)
              );
            }) || null;
        } catch (err) {
          console.warn("[ConceptShowcase] Creator lookup warning:", err);
        }

        let projectFallback = null;
        if (!matchedCreator && slug) {
          try {
            projectFallback = await getProjectBySlug(slug);
          } catch {
            try {
              const allProjects = await getCoLaunchProjects();
              const pList = Array.isArray(allProjects)
                ? allProjects
                : allProjects?.projects || [];
              const cleanSlug = normalizeAlnum(slug);
              projectFallback =
                pList.find(
                  (p) =>
                    normalizeAlnum(p.slug) === cleanSlug ||
                    normalizeAlnum(p.creatorHandle || p.creator_handle) === cleanSlug ||
                    normalizeAlnum(p.creatorName) === cleanSlug
                ) || null;
            } catch {
              projectFallback = null;
            }
          }
        }

        if (!mounted) return;

        let creatorObj = matchedCreator;
        if (!creatorObj && projectFallback) {
          creatorObj = {
            id: projectFallback.creatorId || projectFallback.id,
            name:
              projectFallback.creatorName ||
              projectFallback.title ||
              "Creator Partner",
            handle: projectFallback.creatorHandle || projectFallback.creator_handle || slug,
            avatar_url: projectFallback.creatorAvatar || projectFallback.creator_avatar,
            brand_color: projectFallback.brandColor || projectFallback.brand_color,
            niche: projectFallback.niche || "Creator Economy",
            productConcepts:
              projectFallback.concepts ||
              (projectFallback.selectedConcept ? [projectFallback.selectedConcept] : []),
          };
        }

        if (!creatorObj) {
          const prettyCreator =
            (slug || "Creator Partner")
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()) || "Creator Partner";
          creatorObj = {
            id: slug || "creator",
            name: prettyCreator,
            handle: slug || "creator",
            niche: "Creator Business",
            productConcepts: [],
          };
        }

        const rawConcepts =
          (Array.isArray(creatorObj.productConcepts) && creatorObj.productConcepts.length > 0
            ? creatorObj.productConcepts
            : Array.isArray(creatorObj.product_concepts)
            ? creatorObj.product_concepts
            : []) || [];

        const firstName = String(
          creatorObj.name || creatorObj.display_name || "Creator"
        )
          .trim()
          .split(/\s+/)[0];

        const fallbackConcepts =
          rawConcepts.length > 0
            ? rawConcepts
            : [
                {
                  id: "concept-1",
                  name:
                    conceptParam
                      ? conceptParam
                          .replace(/[-_]/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : `${firstName} OS`,
                  tagline: `The dedicated operating workspace built for ${firstName}'s community`,
                  problem:
                    "Followers scatter across spreadsheets, DMs, and static resources instead of executing inside one guided workflow.",
                  keyFeatures: [
                    "Guided Daily Execution Workspace",
                    "Automated Checklists & Progress Tracking",
                    "Curated Resource & Framework Library",
                    "Direct Community Feedback Loops",
                  ],
                  pricing: "$29/mo Starter • $79/mo Pro",
                  customer: `Dedicated ${creatorObj.niche || "community"} practitioners`,
                  mvpDifficulty: "5-Day Launch",
                },
              ];

        const primaryHex = sanitizeHex(
          creatorObj.brand_color ||
            creatorObj.brandColor ||
            readLocalBrandColor(creatorObj) ||
            fallbackConcepts[0]?.brandColor ||
            "#c81e3c"
        );
        const harmonized = getHarmoniousConceptColors(primaryHex);

        const enriched = fallbackConcepts.map((c, idx) => ({
          ...c,
          brandColor: sanitizeHex(
            c?.brandColor || harmonized[idx % harmonized.length] || harmonized[0] || primaryHex
          ),
        }));

        let initialIdx = 0;
        if (conceptParam) {
          const cleanTarget = normalizeAlnum(conceptParam);
          const slugTarget = toSlug(conceptParam);
          const foundIdx = enriched.findIndex((c) => {
            const cNameAlnum = normalizeAlnum(c?.name);
            const cIdAlnum = normalizeAlnum(c?.id);
            const cNameSlug = toSlug(c?.name);
            return (
              cNameSlug === slugTarget ||
              cNameAlnum === cleanTarget ||
              cIdAlnum === cleanTarget ||
              (cleanTarget && cNameAlnum.includes(cleanTarget)) ||
              (cNameAlnum && cleanTarget.includes(cNameAlnum))
            );
          });
          if (foundIdx >= 0) initialIdx = foundIdx;
        }

        setCreatorRecord(creatorObj);
        setCreatorEmailInput(creatorObj?.email_public || creatorObj?.email || "");
        setConcepts(enriched);
        setActiveIndex(initialIdx);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadShowcase();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const activeConcept = concepts[activeIndex] || concepts[0] || null;
  const activeBrandColor = activeConcept?.brandColor || "#c81e3c";
  const activeInk = pickContrastInk(activeBrandColor);
  const activeReadableAccent = pickReadableAccentOnDark(activeBrandColor);

  const creatorName =
    creatorRecord?.name || creatorRecord?.display_name || "Creator Partner";

  const conceptMailtoHref = useMemo(() => {
    if (!activeConcept) return "#";
    const subject = encodeURIComponent(
      `CoLaunch Selection: ${activeConcept.name} (${creatorName})`
    );
    const body = encodeURIComponent(
      [
        `Hi CoLaunch team,`,
        ``,
        `I reviewed the 3 concepts you built for ${creatorName} and want to move forward with:`,
        `- Selected Concept: ${activeConcept.name}`,
        `- Pricing Model: ${formatConceptPricing(activeConcept.pricing) || "$29/mo Starter"}`,
        `- Brand Accent: ${activeBrandColor}`,
        creatorNote.trim() ? `- Notes / Tweaks: ${creatorNote.trim()}` : "",
        ``,
        `Let's schedule our 15-minute kickoff!`,
      ]
        .filter(Boolean)
        .join("\n")
    );
    return `mailto:creatorforgeweb@gmail.com?subject=${subject}&body=${body}`;
  }, [activeConcept, activeBrandColor, creatorName, creatorNote]);

  const handleSelectTab = (idx) => {
    setActiveIndex(idx);
    const c = concepts[idx];
    if (c) {
      const url = new URL(window.location.href);
      url.searchParams.set("concept", toSlug(c.name || c.id || `concept-${idx + 1}`));
      window.history.replaceState({}, "", url.toString());
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmSelection = async () => {
    if (!activeConcept) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { submitConceptSelection } = await import("../../services/opsApi");
      const res = await submitConceptSelection({
        creator_id: creatorRecord?.id && creatorRecord.id !== slug ? creatorRecord.id : null,
        creator_slug: slug || creatorRecord?.handle || creatorName,
        creator_name: creatorName,
        creator_email: creatorEmailInput.trim() || creatorRecord?.email_public || creatorRecord?.email || null,
        concept_id: activeConcept.id || `concept-${activeIndex + 1}`,
        concept_name: activeConcept.name,
        concept_index: activeIndex,
        concept: activeConcept,
        notes: creatorNote.trim(),
      });
      setSubmittedChoice({
        name: activeConcept.name,
        emailSent: Boolean(res?.email_sent),
        emailError: res?.email_error || "",
      });
    } catch (err) {
      setSubmitError(err?.message || "Could not reach CoLaunch server. Please retry or use email directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#08090c",
          color: "#f3f4f6",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
          padding: "2rem",
        }}
      >
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.12)",
            borderTopColor: "#c81e3c",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ margin: 0, fontSize: "0.9375rem", color: "#9ba1ae" }}>
          Loading {slug ? `${slug}'s` : "your"} interactive product concepts…
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#08090c",
        color: "#f3f4f6",
        fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top 3-concept comparison switcher bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(8, 9, 12, 0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.09)",
          padding: "0.625rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: "75rem",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.625rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
            <img
              src="/images/colaunch_badge.png"
              alt="CoLaunch"
              width={28}
              height={28}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "#f3f4f6",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                CoLaunch Pitch · {creatorName}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#9ba1ae" }}>
                Compare all {concepts.length} bespoke concepts · $0 build fee · 50/50 split
              </div>
            </div>
          </div>

          {/* Concept tabs */}
          <div
            role="tablist"
            aria-label="Product concepts"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {concepts.map((c, idx) => {
              const isActive = idx === activeIndex;
              const dotHex = c.brandColor || "#c81e3c";
              return (
                <button
                  key={c.id || c.name || idx}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectTab(idx)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: isActive
                      ? `1px solid ${dotHex}`
                      : "1px solid rgba(255,255,255,0.12)",
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.09)"
                      : "rgba(16,19,26,0.9)",
                    color: isActive ? "#ffffff" : "#cdd1da",
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    maxWidth: "13rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      borderRadius: "50%",
                      backgroundColor: dotHex,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {idx + 1}. {c.name || `Concept ${idx + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setChooseModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 0.9rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: activeBrandColor,
              color: activeInk,
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Sparkles size={14} />
            Choose Concept {activeIndex + 1}
          </button>
        </div>
      </div>

      {/* Real shared ConceptLandingPage */}
      {activeConcept && (
        <ConceptLandingPage
          concept={activeConcept}
          conceptIndex={activeIndex}
          creator={creatorRecord}
          brandColor={activeBrandColor}
          mode="full"
          generateCreatorAvatarSvg={generateCreatorAvatarSvg}
        />
      )}

      {/* Concept selection drawer / modal */}
      {chooseModalOpen && activeConcept && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="choose-concept-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(4, 6, 10, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "30rem",
              backgroundColor: "#10131a",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "1rem",
              padding: "1.5rem",
              color: "#f3f4f6",
              boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: activeReadableAccent,
                  }}
                >
                  Concept {activeIndex + 1} Selected
                </div>
                <h2
                  id="choose-concept-title"
                  style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 700 }}
                >
                  {activeConcept.name}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setChooseModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.5rem",
                  color: "#9ba1ae",
                  width: "2rem",
                  height: "2rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: "0.75rem 0 1rem", fontSize: "0.875rem", color: "#cdd1da", lineHeight: 1.55 }}>
              CoLaunch designs, engineers, hosts, and supports the full MVP at $0 upfront cost in exchange for a 50/50 net revenue partnership.
            </p>

            <div
              style={{
                backgroundColor: "#0c0e13",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.625rem",
                padding: "0.75rem 0.9rem",
                fontSize: "0.8125rem",
                color: "#cdd1da",
                marginBottom: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Check size={14} color={activeReadableAccent} />
                <span>
                  <strong>Pricing:</strong>{" "}
                  {formatConceptPricing(activeConcept.pricing) || "$29/mo Starter • $79/mo Pro"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Check size={14} color={activeReadableAccent} />
                <span>
                  <strong>Build Timeline:</strong> {activeConcept.mvpDifficulty || "5-Day MVP Launch"}
                </span>
              </div>
            </div>

            <label
              htmlFor="creator-contact-email"
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#cdd1da",
                marginBottom: "0.375rem",
              }}
            >
              Your contact email (optional)
            </label>
            <input
              id="creator-contact-email"
              type="email"
              value={creatorEmailInput}
              onChange={(e) => setCreatorEmailInput(e.target.value)}
              placeholder="you@domain.com"
              style={{
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: "#0c0e13",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "0.5rem",
                color: "#f3f4f6",
                fontSize: "0.8125rem",
                padding: "0.55rem 0.75rem",
                marginBottom: "0.875rem",
                fontFamily: "inherit",
              }}
            />

            <label
              htmlFor="creator-concept-note"
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#cdd1da",
                marginBottom: "0.375rem",
              }}
            >
              Optional tweaks or feedback for this concept
            </label>
            <textarea
              id="creator-concept-note"
              rows={3}
              value={creatorNote}
              onChange={(e) => setCreatorNote(e.target.value)}
              placeholder="Any feature adjustments, domain ideas, or preferred launch timing..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: "#0c0e13",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "0.5rem",
                color: "#f3f4f6",
                fontSize: "0.8125rem",
                padding: "0.625rem 0.75rem",
                marginBottom: "1rem",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />

            {submitError && (
              <div
                role="alert"
                style={{
                  backgroundColor: "rgba(200, 30, 60, 0.14)",
                  border: "1px solid rgba(200, 30, 60, 0.4)",
                  color: "#fda4af",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 0.75rem",
                  fontSize: "0.8125rem",
                  marginBottom: "1rem",
                }}
              >
                {submitError}
              </div>
            )}

            {submittedChoice && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  backgroundColor: "rgba(111, 207, 155, 0.12)",
                  border: "1px solid rgba(111, 207, 155, 0.35)",
                  color: "#6fcf9b",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 0.75rem",
                  fontSize: "0.8125rem",
                  marginBottom: "1rem",
                  lineHeight: 1.45,
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div>
                    <strong>{submittedChoice.name}</strong> locked in and routed to CoLaunch Step 6!
                  </div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.2rem" }}>
                    {submittedChoice.emailSent
                      ? "Selection email dispatched to the CoLaunch partnership inbox."
                      : "Selection saved directly to CoLaunch Step 6."}{" "}
                    <a
                      href={conceptMailtoHref}
                      style={{ color: "#ffffff", textDecoration: "underline" }}
                    >
                      Also open in email app
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setChooseModalOpen(false)}
                style={{
                  padding: "0.55rem 0.95rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backgroundColor: "transparent",
                  color: "#cdd1da",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {submittedChoice ? "Done" : "Keep exploring"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSelection}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1.05rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: activeBrandColor,
                  color: activeInk,
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <Mail size={14} />
                {submitting
                  ? "Sending to CoLaunch..."
                  : submittedChoice
                    ? `Resend "${activeConcept.name}"`
                    : `Greenlight "${activeConcept.name}"`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
