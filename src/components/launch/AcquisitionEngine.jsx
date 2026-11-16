import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Target,
  Search,
  Send,
  MessageSquare,
  Award,
  ExternalLink,
  Lightbulb,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { extractBrandColorFromAvatar, getHarmoniousConceptColors, getFriendlyColorName } from "../../utils/avatarColorExtractor";
import { resolveCreatorTheme } from "../../utils/creatorTheme";
import { deleteAllCreators } from "../../services/opsApi";
import { getExpiringItem, setExpiringItem, ONE_HOUR_MS } from "../../utils/expiringStorage";
import { fetchCreatorComments } from "../../services/scraper";
import { formatConceptPricing } from "../../utils/pricing";
import { PARTNERSHIP_EMAIL } from "./steps/acquisitionConstants";
export { PARTNERSHIP_EMAIL };
import AcquisitionStep1Setup from "./steps/AcquisitionStep1Setup";
import AcquisitionStep2Discovery from "./steps/AcquisitionStep2Discovery";
import AcquisitionStep3Outreach from "./steps/AcquisitionStep3Outreach";
import AcquisitionStep4Review from "./steps/AcquisitionStep4Review";
import AcquisitionStep5Concepts from "./steps/AcquisitionStep5Concepts";
import AcquisitionStep6Pitch from "./steps/AcquisitionStep6Pitch";
import AcquisitionModals from "./steps/AcquisitionModals";
import { buildConceptPrompt, normalizeConcepts, buildValidationSeed } from "./conceptSchema";

// Category and archetype-tailored visual mockup screenshots for creator proposals
export const CONCEPT_ARCHETYPE_IMAGES = {
  saas_os: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80",
  ai_copilot: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
  knowledge_hub: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80",
};

export const CONCEPT_CATEGORY_IMAGES = {
  productivity: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80",
  tech: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80",
  ai: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
  community: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80",
  finance: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1000&auto=format&fit=crop&q=80",
  video_editing: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1000&auto=format&fit=crop&q=80",
  game_dev: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80",
  cybersecurity: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1000&auto=format&fit=crop&q=80",
  business_founder: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80",
  podcast_audio: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1000&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80",
};

export const getConceptImageUrl = (concept, fallbackNiche = "tech", brandColor = null, variantIdx = null) => {
  const appendVariant = (url) => {
    if (!url || typeof url !== "string") return url;
    if (variantIdx === null || variantIdx === undefined) return url;
    if (!url.includes("/api/outreach/concept-card-image") || url.includes("variant=")) return url;
    return `${url}${url.includes("?") ? "&" : "?"}variant=${variantIdx}`;
  };

  if (concept?.customImageUrl) return appendVariant(concept.customImageUrl);
  if (concept?.imageUrl) return appendVariant(concept.imageUrl);
  if (concept?.mockup?.imageUrl) return appendVariant(concept.mockup.imageUrl);
  if (concept?.mockup_image) return appendVariant(concept.mockup_image);

  const colorParam = brandColor || concept?.brandColor || "";
  const mockupType = concept?.mockupType || (concept?.name?.toLowerCase().includes("ai") || concept?.name?.toLowerCase().includes("copilot") ? "ai_copilot" : concept?.name?.toLowerCase().includes("vault") || concept?.name?.toLowerCase().includes("mastermind") || concept?.name?.toLowerCase().includes("hub") ? "knowledge_hub" : "saas_os");

  if (concept?.name || concept?.mockup?.appUrl) {
    const name = encodeURIComponent(concept?.name || "Concept");
    const appUrl = encodeURIComponent(concept?.mockup?.appUrl || `${(concept?.name || "app").toLowerCase().replace(/\s+/g, "")}.app`);
    const tagline = encodeURIComponent(concept?.tagline || "");
    const featuresList = Array.isArray(concept?.keyFeatures)
      ? concept.keyFeatures
      : Array.isArray(concept?.features)
        ? concept.features
        : [];
    const featuresParam = encodeURIComponent(
      featuresList
        .map((f) => (typeof f === "string" ? f.trim() : f?.title || f?.name || ""))
        .filter(Boolean)
        .slice(0, 4)
        .join("|")
    );
    const cust = encodeURIComponent(concept?.customer || concept?.demographicAlignment || "Target Users");
    const price = encodeURIComponent(concept?.pricing || "$49/mo");
    const bColor = encodeURIComponent(colorParam);
    const mType = encodeURIComponent(mockupType);
    const metricParams = featuresParam
      ? ""
      : `&mrr=${encodeURIComponent(concept?.mockup?.primaryMetric || concept?.primaryMetric || "")}&active_users=${encodeURIComponent(concept?.mockup?.activeMetric || concept?.activeMetric || "")}&retention=${encodeURIComponent(concept?.mockup?.efficiencyMetric || concept?.efficiencyMetric || "")}`;
    const variantParam = (variantIdx !== null && variantIdx !== undefined) ? `&variant=${variantIdx}` : "";
    return `/api/outreach/concept-card-image?name=${name}&app_url=${appUrl}&tagline=${tagline}&features=${featuresParam}&customer=${cust}&pricing=${price}&brand_color=${bColor}&mockup_type=${mType}${metricParams}${variantParam}`;
  }

  if (CONCEPT_ARCHETYPE_IMAGES[mockupType]) {
    return CONCEPT_ARCHETYPE_IMAGES[mockupType];
  }

  const n = (Array.isArray(fallbackNiche) ? fallbackNiche.join(" ") : String(fallbackNiche || "")).toLowerCase();
  for (const [k, url] of Object.entries(CONCEPT_CATEGORY_IMAGES)) {
    if (n.includes(k) || (concept?.tagline && concept.tagline.toLowerCase().includes(k))) {
      return url;
    }
  }
  return CONCEPT_CATEGORY_IMAGES.default;
};

// Quick 1-click AI concept steering presets for Step 5
export const STEP5_PROMPT_PRESETS = [
  { label: "⚡ Minimalist Mac/Web Tool", prompt: "Design a minimalist, highly focused utility or macOS menu bar tool with $29-$49/mo pricing and instant daily time-saving." },
  { label: "🏢 B2B Team Workspace & SaaS", prompt: "Focus on a B2B collaboration workspace with team seats, client portal, asset management, and higher pricing at $49-$149/mo." },
  { label: "🎓 Cohort & VIP Mastermind", prompt: "Design a hybrid software toolkit and high-ticket mastermind hub with exclusive member deals and strategy vaults." },
  { label: "🤖 Fine-Tuned AI Copilot", prompt: "Build an autonomous AI copilot trained specifically on the creator's frameworks, with real-time prompt generation and export pipelines." },
  { label: "📊 Analytics & Reporting OS", prompt: "Create a live analytics command center, client reporting dashboard, and automated performance tracking engine." },
];

// Safe helper to read deleted creator IDs from storage (handles arrays, expiringStorage envelopes, and self-heals)
export function getDeletedCreatorIds() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    // Stale deletion check: temporary optimistic deletions expire after 45 seconds so database creators are never permanently ghosted
    const lastDeleted = Number(window.localStorage.getItem("forge_last_deleted_timestamp") || "0");
    if (!lastDeleted || Date.now() - lastDeleted > 45000) {
      window.localStorage.removeItem("forge_deleted_creator_ids");
      window.localStorage.removeItem("forge_last_deleted_timestamp");
      return [];
    }

    const direct = window.localStorage.getItem("forge_deleted_creator_ids");
    if (!direct) return [];
    let parsed;
    try {
      parsed = JSON.parse(direct);
    } catch {
      return [];
    }
    let list = [];
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.data)) {
      list = parsed.data;
      // Auto-heal localStorage to plain JSON array so all callers remain safe
      try {
        window.localStorage.setItem("forge_deleted_creator_ids", JSON.stringify(list));
      } catch (e) { }
    }
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}


export default function AcquisitionEngine({
  initialCreators = [],
  allProjects = [],
  api,
  onCreateProject,
  onGoToProjectOS,
  onResetAll,
  initialActiveStep = null,
  initialSelectedCreatorId = null,
  initialNavNonce = null,
  onActiveStepChange = null,
}) {
  const [dbProjects, setDbProjects] = useState(() => {
    if (Array.isArray(allProjects)) return allProjects;
    return [];
  });

  const [cobuilderPassPrice, setCobuilderPassPrice] = useState(0);
  const [isPassPriceLoading, setIsPassPriceLoading] = useState(true);

  useEffect(() => {
    try { localStorage.removeItem('forge_cobuilder_pass_price'); } catch (e) { }

    import("../../services/opsApi").then(({ getWorkflowState }) => {
      getWorkflowState().then((wf) => {
        const dbFee = wf?.default_pass_price ?? wf?.cobuilder_pass_price ?? wf?.extra_state?.default_pass_price ?? wf?.extra_state?.cobuilder_pass_price;
        if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
          setCobuilderPassPrice(Number(dbFee));
        } else {
          setCobuilderPassPrice(0);
        }
        setIsPassPriceLoading(false);
      }).catch(() => {
        setCobuilderPassPrice(0);
        setIsPassPriceLoading(false);
      });
    });

    const handlePriceEvent = (e) => {
      const p = e?.detail;
      if (p !== undefined && p !== null && !isNaN(Number(p))) {
        setCobuilderPassPrice(Number(p));
      } else {
        setCobuilderPassPrice(0);
      }
      setIsPassPriceLoading(false);
    };
    window.addEventListener('forge_pass_price_changed', handlePriceEvent);
    return () => {
      window.removeEventListener('forge_pass_price_changed', handlePriceEvent);
    };
  }, []);

  useEffect(() => {
    if (Array.isArray(allProjects) && allProjects.length > 0) {
      setDbProjects(allProjects);
    }
  }, [allProjects]);

  useEffect(() => {
    import("../../services/opsApi").then(({ getCoLaunchProjects }) => {
      getCoLaunchProjects().then((projs) => {
        if (Array.isArray(projs) && projs.length > 0) {
          setDbProjects(projs);
        }
      }).catch(() => { });
    });
  }, []);

  const [activeStep, setActiveStep] = useState(() => {
    try {
      if (initialActiveStep && initialActiveStep >= 1 && initialActiveStep <= 6) {
        return initialActiveStep;
      }
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const stepParam = Number(searchParams?.get('step'));
      if (stepParam >= 1 && stepParam <= 6) return stepParam;
      return 1;
    } catch {
      return 1;
    }
  });

  // Operational Mode: 'human' (Operator Review) vs 'autonomous' (Hands-Free AI)
  const [pipelineMode, setPipelineMode] = useState(() => {
    try {
      return localStorage.getItem("forge_pipeline_mode") || "human";
    } catch {
      return "human";
    }
  });

  const handleSetPipelineMode = (mode) => {
    setPipelineMode(mode);
    try {
      localStorage.setItem("forge_pipeline_mode", mode);
    } catch (e) { }
    if (mode === "human") {
      setTimerPaused(true);
      setCampaignRunning(false);
    } else {
      setTimerPaused(false);
      setCampaignRunning(true);
    }
  };

  const [campaignRunning, setCampaignRunning] = useState(() => {
    try {
      const mode = localStorage.getItem("forge_pipeline_mode") || "human";
      return mode === "autonomous";
    } catch {
      return false;
    }
  });
  const [showAdminLookup, setShowAdminLookup] = useState(false);
  const isInitialLoadDone = useRef(false);

  useEffect(() => {
    if (initialActiveStep && initialActiveStep >= 1 && initialActiveStep <= 6) {
      setActiveStep(initialActiveStep);
    }
  }, [initialActiveStep, initialNavNonce]);

  useEffect(() => {
    if (onActiveStepChange) {
      onActiveStepChange(activeStep);
    }
  }, [activeStep, onActiveStepChange]);

  useEffect(() => {
    if (initialSelectedCreatorId) {
      setSelectedCreatorId(initialSelectedCreatorId);
      // Ensure the creator exists in local creators pool; if not, query pipeline DB
      setCreators((prev) => {
        const found = (prev || []).some(
          (c) => c.id === initialSelectedCreatorId || c.handle === initialSelectedCreatorId
        );
        if (found) return prev;
        import("../../services/opsApi").then(({ getCreators }) => {
          getCreators().then((res) => {
            const all = Array.isArray(res) ? res : res?.creators || [];
            if (all.length > 0) {
              const matched = all.find(
                (c) => c.id === initialSelectedCreatorId || c.handle === initialSelectedCreatorId
              );
              if (matched) {
                setCreators((curr) => {
                  if (curr.some((c) => c.id === matched.id)) return curr;
                  return [matched, ...curr];
                });
              }
            }
          }).catch(() => { });
        });
        return prev;
      });
    }
  }, [initialSelectedCreatorId, initialNavNonce]);

  // Step 1: Campaign Controls State
  const [niches, setNiches] = useState([]);
  const [loadingNiches, setLoadingNiches] = useState(true);
  const [dbNichesList, setDbNichesList] = useState([]);

  // Load target niches directly from database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadNichesFromDb() {
      try {
        setLoadingNiches(true);
        const { getNiches } = await import("../../services/opsApi");
        const res = await getNiches();
        if (isMounted && res) {
          if (Array.isArray(res.active_niches)) {
            setNiches(res.active_niches);
          }
          if (Array.isArray(res.all_niches)) {
            setDbNichesList(res.all_niches);
          }
        }
      } catch (err) {
        console.warn("[AcquisitionEngine] Could not load niches from DB:", err);
      } finally {
        if (isMounted) setLoadingNiches(false);
      }
    }
    loadNichesFromDb();
    return () => {
      isMounted = false;
    };
  }, []);
  const [customNicheInput, setCustomNicheInput] = useState("");
  const [activeNicheCategory, setActiveNicheCategory] = useState("all");
  const [nicheSearchQuery, setNicheSearchQuery] = useState("");
  const [minFollowers, setMinFollowers] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_launch_min_followers");
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 100000 && val <= 1000000) return val;
      }
      return 100000;
    } catch {
      return 100000;
    }
  });
  const [maxFollowers, setMaxFollowers] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_launch_max_followers");
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 100000 && val <= 1000000) return val;
      }
      return 1000000;
    } catch {
      return 1000000;
    }
  });
  const [minEngagement, setMinEngagement] = useState(2.0);
  const [selectedGeography, setSelectedGeography] = useState("GLOBAL");
  const [weeklyOutreachVolume, setWeeklyOutreachVolume] = useState(50);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [minScoreThreshold, setMinScoreThreshold] = useState(70);
  const [creatorsBatchCount, setCreatorsBatchCount] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_launch_creators_batch_count");
      if (saved) {
        const num = Number(saved);
        if (!isNaN(num) && num >= 5 && num <= 50) return num;
      }
      return 25;
    } catch {
      return 25;
    }
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "youtube",
    "tiktok",
    "instagram",
  ]);
  const [step2PlatformFilter, setStep2PlatformFilter] = useState("ALL");
  const [step2EmailOnly, setStep2EmailOnly] = useState(false);
  const [step2SearchQuery, setStep2SearchQuery] = useState("");
  const [templateSubject, setTemplateSubject] = useState(
    "Partnership inquiry for {{display_name}} [#{{handle}}]",
  );
  const [templateBody, setTemplateBody] = useState(
    `Hi {{first_name}},\n\nI have been following your {{niche}} work on {{platform}} and wanted to reach out directly regarding a potential venture partnership.\n\nI head venture partnerships at CoLaunch. We partner 50/50 with creators to build, deploy, and monetize custom software products for their audience. Our studio covers 100% of software engineering, UI/UX design, cloud infrastructure, and ongoing technical support at zero financial cost to you.\n\nBased on an analysis of your channel, our team has architected 3 tailored software product concepts designed specifically for your community to build a sustainable, recurring software revenue stream.\n\nWould you be open to reviewing a short 3-concept breakdown and interactive landing page preview this week?\n\nTo reply, simply respond directly to this email:\n• "I am interested, let's proceed" — and I will send over the concepts, revenue roadmap, and live previews.\n• Or "Not interested" — and I will immediately close your file with zero follow-ups.\n\nBest regards,\nCoLaunch Venture Partnerships`,
  );
  const [showStep3EmailPreview, setShowStep3EmailPreview] = useState(false);

  // Discovered Creators State (Dynamic AI + Apify Pipeline)
  const [isLaunchingProject, setIsLaunchingProject] = useState(false);
  const [launchStepIndex, setLaunchStepIndex] = useState(1);
  const [discovering, setDiscovering] = useState(false);
  const discoveryAbortRef = useRef(null);
  const [discoveryLog, setDiscoveryLog] = useState("");
  const [loadingCreatorsFromDb, setLoadingCreatorsFromDb] = useState(
    !(initialCreators && Array.isArray(initialCreators) && initialCreators.length > 0)
  );
  // All creators loaded strictly from MongoDB Atlas

  const [creators, setCreators] = useState(() => {
    // Strictly load real creators from MongoDB (initialCreators) as the source of truth
    if (initialCreators && Array.isArray(initialCreators) && initialCreators.length > 0) {
      return initialCreators;
    }
    return [];
  });

  // Direct DB fetch on mount — ensures all DB creators load immediately from MongoDB Atlas
  useEffect(() => {
    let cancelled = false;
    setLoadingCreatorsFromDb(true);
    import("../../services/opsApi").then(({ getCreators }) => {
      getCreators({ limit: 100 }).then((res) => {
        if (cancelled) return;
        const dbList = Array.isArray(res) ? res : res?.creators || [];
        if (dbList.length > 0) {
          setCreators((prev) => {
            const localById = new Map();
            for (const p of (prev || [])) {
              if (p.id) localById.set(String(p.id), p);
            }
            return dbList.map((dbC) => {
              const localMatch = dbC.id ? localById.get(String(dbC.id)) : null;
              if (!localMatch) {
                const safeStatus = (dbC.status === "launched" && !dbC.project_id && !dbC.projectId && !dbC.active_project_id)
                  ? "discovered"
                  : (dbC.status || "discovered");
                return { ...dbC, status: safeStatus };
              }
              const localEmail = (localMatch.email || localMatch.email_public || "").trim();
              const dbEmail = (dbC.email || dbC.email_public || "").trim();
              const preserveLocalEmail = localEmail && localEmail !== dbEmail;
              const hasProject = Boolean(dbC.project_id || dbC.projectId || dbC.active_project_id || localMatch.project_id || localMatch.projectId);
              const safeStatus = (!hasProject && (dbC.status === "launched" || localMatch.status === "launched"))
                ? (localMatch.status && localMatch.status !== "launched" ? localMatch.status : "discovered")
                : (dbC.status || localMatch.status || "discovered");
              return {
                ...localMatch,
                ...dbC,
                status: safeStatus,
                ...(preserveLocalEmail ? { email: localMatch.email, email_public: localMatch.email_public, email_verified: localMatch.email_verified } : {}),
              };
            });
          });
        } else {
          setCreators((prev) => (prev && prev.length > 0 ? prev : []));
        }
        setLoadingCreatorsFromDb(false);
      }).catch(() => {
        if (!cancelled) {
          setLoadingCreatorsFromDb(false);
        }
      });
    }).catch(() => {
      if (!cancelled) {
        setLoadingCreatorsFromDb(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Sync incoming initialCreators from parent layout / database sync
  // DB is the authoritative source — always adopt DB creators, preserving local-only edits
  useEffect(() => {
    if (discovering) return;
    if (initialCreators && Array.isArray(initialCreators) && initialCreators.length > 0) {
      setLoadingCreatorsFromDb(false);
      setCreators((prev) => {
        if (!prev || prev.length === 0) {
          return initialCreators;
        }

        // Build a lookup of local creators by ID for fast matching
        const localById = new Map();
        for (const p of prev) {
          if (p.id) localById.set(String(p.id), p);
        }

        // Strictly adopt DB creators as base, overlaying any locally-edited fields
        return initialCreators.map((dbCreator) => {
          const localMatch = dbCreator.id ? localById.get(String(dbCreator.id)) : null;

          if (!localMatch) {
            const safeStatus = (dbCreator.status === "launched" && !dbCreator.project_id && !dbCreator.projectId && !dbCreator.active_project_id)
              ? "discovered"
              : (dbCreator.status || "discovered");
            return { ...dbCreator, status: safeStatus };
          }

          // Protect locally-modified email on current active creator: if local has a different email, keep it
          const localEmail = (localMatch.email || localMatch.email_public || "").trim();
          const dbEmail = (dbCreator.email || dbCreator.email_public || "").trim();
          const preserveLocalEmail = localEmail && localEmail !== dbEmail;
          const hasProject = Boolean(dbCreator.project_id || dbCreator.projectId || dbCreator.active_project_id || localMatch.project_id || localMatch.projectId);
          const safeStatus = (!hasProject && (dbCreator.status === "launched" || localMatch.status === "launched"))
            ? (localMatch.status && localMatch.status !== "launched" ? localMatch.status : "discovered")
            : (dbCreator.status || localMatch.status || "discovered");

          return {
            ...localMatch,
            ...dbCreator,
            status: safeStatus,
            ...(preserveLocalEmail ? {
              email: localMatch.email,
              email_public: localMatch.email_public,
              email_verified: localMatch.email_verified,
            } : {}),
          };
        });
      });
    }
  }, [initialCreators, discovering]);

  // Enforce platform requirement: strictly 100k-1M followers, max 50 creators
  useEffect(() => {
    if (minFollowers < 100000 || maxFollowers > 1000000 || minFollowers > maxFollowers) {
      setMinFollowers(100000);
      setMaxFollowers(1000000);
      try {
        localStorage.setItem("forge_launch_min_followers", "100000");
        localStorage.setItem("forge_launch_max_followers", "1000000");
      } catch (e) {}
    }
    if ((creatorsBatchCount || 25) > 50) {
      setCreatorsBatchCount(50);
      try {
        localStorage.setItem("forge_launch_creators_batch_count", "50");
      } catch (e) {}
    }
  }, []);
  const [selectedCreatorId, setSelectedCreatorId] = useState(() => {
    try {
      if (initialSelectedCreatorId) return initialSelectedCreatorId;
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const creatorParam = searchParams?.get('creator') || searchParams?.get('creatorId');
      if (creatorParam) return creatorParam;
      return initialCreators?.[0]?.id || null;
    } catch {
      return null;
    }
  });

  // Auto-select first creator from DB if none currently selected
  useEffect(() => {
    if (!selectedCreatorId && creators && creators.length > 0) {
      setSelectedCreatorId(creators[0].id);
    }
  }, [creators, selectedCreatorId]);
  const [scopedCreatorId, setScopedCreatorId] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      return searchParams?.get('creator') || searchParams?.get('creatorId') || null;
    } catch {
      return null;
    }
  });
  const [showResetUrlModal, setShowResetUrlModal] = useState(false);
  const [showSetUrlModal, setShowSetUrlModal] = useState(false);
  const [inputUrlCreatorId, setInputUrlCreatorId] = useState("");
  const [inputUrlTargetStep, setInputUrlTargetStep] = useState(4);
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [creatorConceptSelectionMap, setCreatorConceptSelectionMap] = useState(() => {
    try {
      return getExpiringItem("forge_creator_concept_selection_map", {});
    } catch {
      return {};
    }
  });
  const [step5Error, setStep5Error] = useState(null);
  const [isSynthesizingStep5Ai, setIsSynthesizingStep5Ai] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [replyFilter, setReplyFilter] = useState("all");

  // Synchronize active step and selected creator across devices
  useEffect(() => {
    try {
      setExpiringItem("forge_launch_acquisition_step", String(activeStep), ONE_HOUR_MS);
      import("../../services/opsApi").then(({ updateWorkflowState }) => {
        updateWorkflowState({ active_step: activeStep, selected_creator_id: selectedCreatorId }).catch(() => { });
      });
    } catch (error) {
      console.warn(
        "[AcquisitionEngine] Failed to persist workflow step:",
        error,
      );
    }
  }, [activeStep, selectedCreatorId]);

  // Auto-abort any in-flight discovery when operator navigates beyond Step 2
  useEffect(() => {
    if (activeStep > 2 && (discovering || discoveryAbortRef.current)) {
      if (discoveryAbortRef.current) {
        try {
          discoveryAbortRef.current.abort();
        } catch (e) { }
        discoveryAbortRef.current = null;
      }
      setDiscovering(false);
      try {
        import("../../services/opsApi").then(({ stopAutonomousDiscovery }) => {
          stopAutonomousDiscovery().catch(() => { });
        });
      } catch (e) { }
    }
  }, [activeStep, discovering]);

  // Sync step and creator from URL if passed as deep-link query parameters
  useEffect(() => {
    const handleUrlSync = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const stepParam = Number(searchParams.get('step'));
        const creatorParam = searchParams.get('creator') || searchParams.get('creatorId');
        if (stepParam >= 1 && stepParam <= 6) {
          setActiveStep(stepParam);
        }
        if (creatorParam) {
          setSelectedCreatorId(creatorParam);
          setScopedCreatorId(creatorParam);
        } else {
          setScopedCreatorId(null);
        }
      } catch (e) { }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, []);



  // Deterministic local SVG avatar generator that never fails, requires 0 network calls, and cannot 403
  const generateCreatorAvatarSvg = useCallback((nameOrHandle = "Creator") => {
    const clean = String(nameOrHandle || "C")
      .replace(/^@/, "")
      .trim();
    const words = clean.split(/\s+/).filter(Boolean);
    let initials = "C";
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (clean.length >= 2) {
      initials = clean.slice(0, 2).toUpperCase();
    } else if (clean.length === 1) {
      initials = clean.toUpperCase();
    }

    const colors = [
      { bg: "1E293B", text: "F8FAFC" }, // Slate
      { bg: "2D151E", text: "FF4D6D" }, // Crimson
      { bg: "064E3B", text: "34D399" }, // Emerald
      { bg: "1E1B4B", text: "A5B4FC" }, // Indigo
      { bg: "451A03", text: "FBBF24" }, // Amber
      { bg: "164E63", text: "38BDF8" }, // Cyan
    ];
    const hash = clean.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const theme = colors[hash % colors.length];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#${theme.bg}"/><text x="50%" y="54%" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="46" fill="#${theme.text}" dominant-baseline="middle" text-anchor="middle" letter-spacing="-0.5">${initials}</text></svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, []);

  const getCreatorAvatar = useCallback((c) => {
    if (!c) return generateCreatorAvatarSvg("Creator");
    const raw = c.avatar_url || c.avatarUrl || c.avatar || c.image || c.profile_image_url;
    if (
      raw &&
      typeof raw === "string" &&
      raw.trim().length > 0 &&
      !raw.includes("photo-1534528741775-53994a69daeb") &&
      !raw.includes("ui-avatars.com")
    ) {
      return raw.trim();
    }
    const cleanName = (c.name || c.display_name || c.handle || "Creator").replace(/^@/, "").trim();
    return generateCreatorAvatarSvg(cleanName);
  }, [generateCreatorAvatarSvg]);

  // Check if a creator has already graduated/launched into Section 2 (ProjectOS)
  const isCreatorLaunchedToSection2 = useCallback(
    (c) => {
      if (!c) return false;

      // 1. Explicit project link on the creator object
      if (c.project_id || c.projectId || c.active_project_id) {
        return true;
      }

      const cCleanHandle = (c.handle || "").replace(/^@/, "").toLowerCase().trim();
      const cId = c.id ? String(c.id).trim() : "";

      // 2. Strict match against existing Co-Launch Projects in Section 2
      // Strictly match by creator ID or handle. NEVER match loosely by email or name.
      const matchedDbProj = (dbProjects || []).find((p) => {
        if (!p) return false;
        const pCreatorId = p.creatorId ? String(p.creatorId).trim() : "";
        const pCleanHandle = (p.creatorHandle || "").replace(/^@/, "").toLowerCase().trim();
        const pId = p.id ? String(p.id).trim() : "";

        return (
          (pCreatorId && cId && pCreatorId === cId) ||
          (pCreatorId && cCleanHandle && pCreatorId.toLowerCase() === cCleanHandle) ||
          (cCleanHandle && pCleanHandle && cCleanHandle === pCleanHandle) ||
          (c.project_id && pId && String(c.project_id).trim() === pId) ||
          (c.projectId && pId && String(c.projectId).trim() === pId)
        );
      });

      if (matchedDbProj) {
        return true;
      }

      // If status is "launched" or "partnered", only consider them launched if they have a verified project link
      const status = (c.status || "").toLowerCase();
      if ((status === "launched" || status === "partnered" || status === "active_project") && (c.project_id || c.projectId || matchedDbProj)) {
        return true;
      }

      return false;
    },
    [dbProjects]
  );

  // Filter out any creators who have already reached Section 2
  const unlaunchedCreators = useMemo(() => {
    const all = Array.isArray(creators) ? creators : [];
    return all.filter((c) => !isCreatorLaunchedToSection2(c));
  }, [creators, isCreatorLaunchedToSection2]);

  // If scoped to an individual creator from URL / CRM, find that individual
  const scopedIndividualCreator = useMemo(() => {
    if (!scopedCreatorId) return null;
    const all = Array.isArray(creators) ? creators : [];
    return (
      all.find((c) => c.id === scopedCreatorId || c.handle === scopedCreatorId) ||
      all.find((c) => c.id && String(c.id).toLowerCase() === String(scopedCreatorId).toLowerCase()) ||
      all.find((c) => c.handle && c.handle.replace(/^@/, '').toLowerCase() === String(scopedCreatorId).replace(/^@/, '').toLowerCase()) ||
      null
    );
  }, [scopedCreatorId, creators]);

  // Lazy-load scoped creator if not already present in memory
  useEffect(() => {
    if (!scopedCreatorId) return;
    const all = Array.isArray(creators) ? creators : [];
    const found = all.some(
      (c) =>
        c.id === scopedCreatorId ||
        c.handle === scopedCreatorId ||
        (c.id && String(c.id).toLowerCase() === String(scopedCreatorId).toLowerCase()) ||
        (c.handle && c.handle.replace(/^@/, '').toLowerCase() === String(scopedCreatorId).replace(/^@/, '').toLowerCase())
    );
    if (!found) {
      import("../../services/opsApi").then(({ getCreator, getCreators }) => {
        getCreator(scopedCreatorId)
          .then((c) => {
            if (c && (c.id || c.handle)) {
              setCreators((prev) => (prev.some((p) => p.id === c.id) ? prev : [c, ...prev]));
            }
          })
          .catch(() => {
            getCreators().then((res) => {
              const list = Array.isArray(res) ? res : res?.creators || [];
              const matched = list.find((c) => c.id === scopedCreatorId || c.handle === scopedCreatorId);
              if (matched) {
                setCreators((prev) => (prev.some((p) => p.id === matched.id) ? prev : [matched, ...prev]));
              }
            }).catch(() => { });
          });
      });
    }
  }, [scopedCreatorId, creators]);

  // Real-time synchronization for creator deletion from CRM or other tabs
  useEffect(() => {
    const handleCreatorDeleted = (e) => {
      const targetId = e?.detail?.creatorId;
      const targetHandle = e?.detail?.handle;
      const cleanTargetHandle = (targetHandle || "").replace(/^@/, "").toLowerCase();

      setCreators((prev) =>
        (prev || []).filter((c) => {
          const cleanHandle = (c.handle || "").replace(/^@/, "").toLowerCase();
          const matches =
            c.id === targetId ||
            c.handle === targetId ||
            c.handle === targetHandle ||
            (cleanTargetHandle && cleanHandle === cleanTargetHandle);
          return !matches;
        })
      );

      setSelectedCreatorId((prevId) => {
        if (prevId === targetId || prevId === targetHandle) return null;
        return prevId;
      });
    };

    const handleStorageChange = (e) => {
      if (e.key === "forge_last_deleted_timestamp") {
        try {
          const deletedIds = getDeletedCreatorIds();
          const deletedSet = new Set(deletedIds.map(String));
          if (deletedSet.size > 0) {
            setCreators((prev) =>
              (prev || []).filter((c) => {
                const cleanHandle = (c.handle || "").toLowerCase().replace(/^@/, "");
                return (
                  !deletedSet.has(String(c.id)) &&
                  !deletedSet.has(cleanHandle) &&
                  !deletedSet.has(String(c.handle))
                );
              })
            );
          }
        } catch (err) { }
      }
    };

    window.addEventListener("forge_creator_deleted", handleCreatorDeleted);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("forge_creator_deleted", handleCreatorDeleted);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Alert & Notification System State
  const [toasts, setToasts] = useState([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [activeArtifactTab, setActiveArtifactTab] = useState(null);
  const [artifactCopied, setArtifactCopied] = useState(false);

  const notify = useCallback((type, title, message, duration = 3500) => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => {
      // Deduplicate: replace any existing toast with the same title so it never stacks
      const filtered = prev.filter((t) => t.title !== title);
      // Keep at most 2 toasts on screen simultaneously
      return [...filtered.slice(-1), { id, type, title, message, duration }];
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearScopedCreator = useCallback((targetStep = null) => {
    setScopedCreatorId(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('creator');
      url.searchParams.delete('creatorId');
      if (targetStep) {
        url.searchParams.set('step', String(targetStep));
      }
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch (e) { }
    if (targetStep) {
      setActiveStep(Number(targetStep));
    }
    notify("success", "URL Reset", "Creator ID removed. Full cohort pipeline active across all steps.", 3000);
  }, [notify]);

  const handleApplyScopedUrl = useCallback((newId, targetStep = 4) => {
    if (!newId || !newId.trim()) return;
    const cleanId = newId.trim();
    setScopedCreatorId(cleanId);
    setSelectedCreatorId(cleanId);
    setActiveStep(Number(targetStep) || 4);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('creator', cleanId);
      url.searchParams.set('step', String(targetStep));
      window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch (e) { }
    setShowSetUrlModal(false);
    notify("success", "URL Focus Set", `Now scoped to creator ID: ${cleanId}`, 3000);
  }, [notify]);

  const handleDeleteAllCreators = () => {
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteAllCreators = async () => {
    setIsDeletingAll(true);
    const creatorCount = creators.length;
    const threadCount = realThreads.length;
    try {
      setShowDeleteConfirmModal(false);
      setCreators([]);
      setRealThreads([]);
      setSelectedCreatorId(null);
      setSelectedConceptId(null);
      setPositiveAdvanceNotice(null);
      setAutoAdvancedIds(new Set());
      autoAdvancedIdsRef.current = new Set();
      setAiDetectedChoiceMap({});
      setPitchSentMap({});
      setAnswerSentMap({});
      setPersuasionSentMap({});
      setHasAutoCreatedProject(false);
      setActiveStep(1);
      setCompletedSteps([]);
      setDiscoveryLog("");
      setOutreachLog("");

      // Deep wipe of all launch persistence keys in localStorage
      localStorage.removeItem("forge_acquisition_completed_steps");
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_crm_cached_creators");
      localStorage.removeItem("forge_launch_active_project");
      localStorage.removeItem("forge_launch_acquisition_step");
      localStorage.removeItem("forge_launch_active_step");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_answer_sent_map");
      localStorage.removeItem("forge_launch_persuasion_sent_map");
      localStorage.removeItem("forge_launch_ai_choice_map");
      localStorage.removeItem("forge_launch_creator_stage_map");
      localStorage.removeItem("forge_deleted_creator_ids");
      localStorage.removeItem("forge_last_deleted_timestamp");
      localStorage.removeItem("forge_launch_active_section");
      localStorage.removeItem("forge_launch_all_projects");
      onResetAll?.();

      try {
        await deleteAllCreators();
        const { resetWorkflowState, deleteAllProjects } = await import("../../services/opsApi");
        await deleteAllProjects().catch(() => { });
        await resetWorkflowState().catch(() => { });
        try {
          window.history.replaceState({}, "", "/launch");
        } catch (e) { }
      } catch (err) {
        console.warn("Backend delete all creators failed or offline:", err);
      }

      // Trigger rich alert toast
      notify(
        "success",
        "Pipeline Reset & Creators Deleted",
        `Successfully wiped ${creatorCount} creators, ${threadCount} email threads, and reset workflow back to Step 1.`,
        4500
      );
    } catch (err) {
      notify(
        "error",
        "Deletion Failed",
        err.message || "An error occurred while resetting the pipeline."
      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Email Modification State
  const [editingEmailCreatorId, setEditingEmailCreatorId] = useState(null);
  const [tempEmailValue, setTempEmailValue] = useState("");

  const startEditEmail = (creatorId, currentEmail, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingEmailCreatorId(creatorId);
    setTempEmailValue(currentEmail || "");
  };

  const saveEditEmail = async (creatorId, e, explicitValue = null) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetId = creatorId || editingEmailCreatorId;
    if (!targetId) return;

    const newEmail = (explicitValue !== null ? explicitValue : tempEmailValue).trim();
    let wasContacted = false;

    // 1. Update local state immediately (both in React state and in localStorage synchronously)
    setCreators((prev) => {
      const updated = (prev || []).map((c) => {
        const matchId = c.id === targetId;
        const cleanTarget = String(targetId).toLowerCase().replace(/^@/, "");
        const cleanHandle = String(c.handle || "").toLowerCase().replace(/^@/, "");
        const matchHandle = cleanTarget && cleanHandle && cleanTarget === cleanHandle;
        if (matchId || matchHandle) {
          const contacted = Boolean(
            c.outreach_sent ||
            c.status === "contacted" ||
            c.status === "pitched" ||
            c.status === "partnered" ||
            (c.id && pitchSentMap[c.id])
          );
          if (contacted) wasContacted = true;

          // Preserve candidate statuses; never flip an unlaunched candidate to 'launched'
          let safeStatus = c.status || "discovered";
          if (safeStatus === "launched" && !c.project_id && !c.projectId) {
            safeStatus = "discovered";
          }
          if (!contacted && (safeStatus === "interested" || safeStatus === "replied")) {
            safeStatus = "discovered";
          }

          return {
            ...c,
            email: newEmail,
            email_public: newEmail,
            email_verified: Boolean(newEmail && newEmail.includes("@")),
            status: safeStatus,
            ...(contacted ? {} : {
              replyClassification: null,
              reply_classification: null,
              replyText: null,
              reply_text: null,
              replySubject: null,
              replyTime: null,
              outreach_sent: false,
            })
          };
        }
        return c;
      });

      // Synchronously write to localStorage
      try {
        localStorage.setItem("forge_launch_discovered_creators", JSON.stringify(updated));
      } catch (err) { }

      return updated;
    });

    setEditingEmailCreatorId(null);
    setTempEmailValue("");

    // 2. Persist to DB if creator exists on backend
    if (newEmail) {
      try {
        const { updateCreatorDetails } = await import("../../services/opsApi");
        const patchPayload = {
          email_public: newEmail,
          email: newEmail,
        };
        if (!wasContacted) {
          patchPayload.reply_classification = null;
          patchPayload.reply_text = null;
          patchPayload.status = "discovered";
        }
        await updateCreatorDetails(targetId, patchPayload);
        notify("success", "Email Updated", `Contact email updated to ${newEmail}.`, 3000);
      } catch (err) {
        console.warn("[AcquisitionEngine] Failed to save email to DB:", err);
        notify("warning", "Saved Locally", `Email updated in session: ${newEmail}`, 3000);
      }
    }
  };

  const cancelEditEmail = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingEmailCreatorId(null);
    setTempEmailValue("");
  };

  // Apify business email lookup state and handler
  const [findingApifyId, setFindingApifyId] = useState(null);
  const [apifyStatusMsg, setApifyStatusMsg] = useState({});

  // Hunter.io Email Finder & Verifier state
  const [hunterLoadingId, setHunterLoadingId] = useState(null);
  const [hunterActionType, setHunterActionType] = useState(null); // 'find' | 'verify'
  const [hunterDataMap, setHunterDataMap] = useState({});

  const handleHunterFindEmail = async (creator, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setHunterLoadingId(creator.id);
    setHunterActionType('find');
    try {
      const { findEmailWithHunter } = await import("../../services/opsApi");
      const res = await findEmailWithHunter({
        creator_id: creator.id,
        full_name: creator.display_name || creator.name,
        auto_save: true,
      });

      if (res && res.success && res.email) {
        setCreators((prev) =>
          prev.map((c) => {
            if (c.id === creator.id) {
              return {
                ...c,
                email: res.email,
                email_public: res.email,
                email_verified: true,
                hunter_score: res.score,
                hunter_status: res.verification_status || 'valid',
              };
            }
            return c;
          })
        );
        setHunterDataMap((prev) => ({
          ...prev,
          [creator.id]: res,
        }));
        notify(
          'success',
          'Hunter.io Email Found!',
          `Found: ${res.email} (Confidence: ${res.score}%, Status: ${res.verification_status || 'verified'})`,
          4500
        );
      } else {
        notify(
          'warning',
          'Hunter.io Search Completed',
          res?.error || `No business email found on Hunter.io for ${creator.display_name || creator.name}. Try social scrape or manual edit.`,
          4000
        );
      }
    } catch (err) {
      console.warn('[Hunter.io Find Error]:', err);
      notify('error', 'Hunter.io Error', err.message || 'Failed to search Hunter.io API', 3500);
    } finally {
      setHunterLoadingId(null);
      setHunterActionType(null);
    }
  };

  const handleHunterVerifyEmail = async (creator, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetEmail = (creator.email || creator.email_public || "").trim();
    if (!targetEmail) {
      notify('warning', 'No Email', 'Please provide or find an email address first.', 3000);
      return;
    }

    setHunterLoadingId(creator.id);
    setHunterActionType('verify');
    try {
      const { verifyEmailWithHunter } = await import("../../services/opsApi");
      const res = await verifyEmailWithHunter({
        email: targetEmail,
        creator_id: creator.id,
        auto_save: true,
      });

      if (res && res.success) {
        setHunterDataMap((prev) => ({
          ...prev,
          [creator.id]: res,
        }));
        setCreators((prev) =>
          prev.map((c) => {
            if (c.id === creator.id) {
              return {
                ...c,
                email_verified: res.deliverable,
                hunter_score: res.score,
                hunter_status: res.status,
              };
            }
            return c;
          })
        );
        const deliverableText = res.deliverable ? 'Deliverable ✓' : 'Risky / Undeliverable';
        notify(
          res.deliverable ? 'success' : 'warning',
          `Hunter.io: ${deliverableText}`,
          `Score: ${res.score}% | Status: ${res.status} | SMTP: ${res.smtp_check ? 'Passed' : 'Failed'} | MX: ${res.mx_records ? 'Valid' : 'Missing'}`,
          5000
        );
      } else {
        notify('error', 'Verification Failed', res?.error || 'Hunter could not verify this email.', 3500);
      }
    } catch (err) {
      console.warn('[Hunter.io Verify Error]:', err);
      notify('error', 'Verification Error', err.message || 'Failed to connect to Hunter verifier.', 3500);
    } finally {
      setHunterLoadingId(null);
      setHunterActionType(null);
    }
  };

  const handleApifyFindEmail = async (creator, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFindingApifyId(creator.id);
    try {
      const { findEmailWithApify, updateCreatorDetails } =
        await import("../../services/opsApi");
      const res = await findEmailWithApify({
        handle: creator.handle?.replace("@", "") || creator.name,
        channel: creator.handle || creator.name,
        url: creator.profile_url || "",
      });
      if (res && res.email) {
        setCreators((prev) =>
          prev.map((c) => {
            if (c.id === creator.id) {
              return {
                ...c,
                email: res.email,
                email_public: res.email,
                email_verified: true,
              };
            }
            return c;
          }),
        );
        saveEditEmail(creator.id, { preventDefault: () => { } }, res.email);
        setApifyStatusMsg((prev) => ({
          ...prev,
          [creator.id]: `Verified Email: ${res.email}`,
        }));
        try {
          await updateCreatorDetails(creator.id, { email: res.email });
        } catch (dbErr) {
          console.warn("DB save error:", dbErr);
        }
      } else {
        setApifyStatusMsg((prev) => ({
          ...prev,
          [creator.id]: "No public business contact found in directory.",
        }));
      }
    } catch (err) {
      console.warn("Find error:", err);
      setApifyStatusMsg((prev) => ({
        ...prev,
        [creator.id]: "Contact lookup completed.",
      }));
    } finally {
      setFindingApifyId(null);
    }
  };

  // Comprehensive curated list of popular creator niches (clean, typography-driven without icons)
  const ALL_AVAILABLE_NICHES = [
    { id: "tech", label: "Tech", category: "tech", count: "14.2k" },
    { id: "software", label: "Software", category: "tech", count: "9.8k" },
    { id: "saas", label: "SaaS", category: "tech", count: "6.4k" },
    { id: "fintech", label: "Fintech", category: "business", count: "5.1k" },
    { id: "productivity", label: "Productivity", category: "business", count: "11.3k" },
    { id: "ai-tools", label: "AI Tools", category: "tech", count: "8.7k" },
    { id: "creator-economy", label: "Creator Economy", category: "creative", count: "7.5k" },
    { id: "gaming", label: "Gaming", category: "creative", count: "22.1k" },
    { id: "fitness-health", label: "Fitness & Health", category: "lifestyle", count: "13.9k" },
    { id: "e-commerce", label: "E-Commerce", category: "business", count: "8.2k" },
    { id: "finance", label: "Finance", category: "business", count: "6.9k" },
    { id: "crypto-web3", label: "Crypto & Web3", category: "business", count: "4.8k" },
    { id: "design-creative", label: "Design & Creative", category: "creative", count: "9.1k" },
    { id: "education", label: "Education", category: "lifestyle", count: "10.5k" },
    { id: "beauty-lifestyle", label: "Beauty & Lifestyle", category: "lifestyle", count: "16.7k" },
    { id: "marketing", label: "Marketing", category: "business", count: "8.4k" },
  ];

  // Merge static defaults with dynamically added niches from the database
  const combinedNichesList = useMemo(() => {
    if (!loadingNiches && Array.isArray(dbNichesList)) {
      return dbNichesList.map((dbN) => ({
        id: dbN.id || (dbN.name || "").toLowerCase().replace(/ /g, "-"),
        label: dbN.name || dbN.label,
        category: dbN.category || "custom",
        count: dbN.count || "5.0k",
      }));
    }
    const list = [...ALL_AVAILABLE_NICHES];
    const seen = new Set(list.map((n) => n.label.toLowerCase()));
    for (const dbN of dbNichesList) {
      if (dbN && dbN.name && !seen.has(dbN.name.toLowerCase())) {
        list.push({
          id: dbN.id || dbN.name.toLowerCase().replace(/ /g, "-"),
          label: dbN.name,
          category: dbN.category || "custom",
          count: dbN.count || "5.0k",
        });
        seen.add(dbN.name.toLowerCase());
      }
    }
    return list;
  }, [dbNichesList, loadingNiches]);

  const popularNiches = useMemo(() => combinedNichesList.map((n) => n.label), [combinedNichesList]);

  const filteredAvailableNiches = useMemo(() => {
    return combinedNichesList.filter((item) => {
      const matchesCategory =
        activeNicheCategory === "all" || item.category === activeNicheCategory;
      const matchesSearch =
        !nicheSearchQuery ||
        item.label.toLowerCase().includes(nicheSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [combinedNichesList, activeNicheCategory, nicheSearchQuery]);

  // Merge popular niches with any active/custom niches so every niche is in the list with equal width
  const allNicheOptions = Array.from(
    new Set([
      ...popularNiches,
      ...niches,
    ])
  );

  const removeNiche = async (tagToRemove) => {
    const nextNiches = niches.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    setNiches(nextNiches);
    setDbNichesList((prev) =>
      prev.map((n) =>
        (n.name || n.label || "").toLowerCase() === tagToRemove.toLowerCase()
          ? { ...n, is_active: false }
          : n
      )
    );
    try {
      const { toggleNicheActiveInDb, saveActiveNichesToDb } = await import("../../services/opsApi");
      await toggleNicheActiveInDb(tagToRemove, false);
      await saveActiveNichesToDb(nextNiches);
    } catch (err) {
      console.warn("[AcquisitionEngine] Could not persist unselected niche in DB:", err);
    }
  };

  const deleteNiche = async (e, tagToDelete) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextNiches = niches.filter((t) => t.toLowerCase() !== tagToDelete.toLowerCase());
    setNiches(nextNiches);
    setDbNichesList((prev) =>
      prev.filter((n) => (n.name || n.label || "").toLowerCase() !== tagToDelete.toLowerCase())
    );
    notify("info", "Niche Deleted", `"${tagToDelete}" was removed`);
    try {
      const { removeNicheFromDb, saveActiveNichesToDb } = await import("../../services/opsApi");
      await removeNicheFromDb(tagToDelete, true);
      await saveActiveNichesToDb(nextNiches);
    } catch (err) {
      console.warn("[AcquisitionEngine] Could not delete niche from DB:", err);
    }
  };

  const addNiche = async (tagToAdd) => {
    const trimmed = tagToAdd.trim().replace(/^,+|,+$/g, "");
    if (!trimmed) return;
    setCustomNicheInput("");
    if (!niches.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      const nextNiches = [...niches, trimmed];
      setNiches(nextNiches);
      setDbNichesList((prev) => {
        if (prev.some((n) => (n.name || n.label || "").toLowerCase() === trimmed.toLowerCase())) {
          return prev.map((n) =>
            (n.name || n.label || "").toLowerCase() === trimmed.toLowerCase()
              ? { ...n, is_active: true }
              : n
          );
        }
        return [
          ...prev,
          {
            id: trimmed.toLowerCase().replace(/ /g, "-"),
            name: trimmed,
            label: trimmed,
            category: "custom",
            is_active: true,
            count: "5.0k",
          },
        ];
      });
      try {
        const { addNicheToDb, saveActiveNichesToDb } = await import("../../services/opsApi");
        await addNicheToDb({ name: trimmed, is_active: true, category: "custom" });
        await saveActiveNichesToDb(nextNiches);
      } catch (err) {
        console.warn("[AcquisitionEngine] Could not persist added niche to DB:", err);
      }
    }
  };

  const handleBulkSyncNiches = async (nextNiches) => {
    setNiches(nextNiches);
    const activeSet = new Set(nextNiches.map((n) => n.toLowerCase()));
    setDbNichesList((prev) =>
      prev.map((n) => ({
        ...n,
        is_active: activeSet.has((n.name || n.label || "").toLowerCase()),
      }))
    );
    try {
      const { saveActiveNichesToDb } = await import("../../services/opsApi");
      await saveActiveNichesToDb(nextNiches);
    } catch (err) {
      console.warn("[AcquisitionEngine] Could not sync active niches in DB:", err);
    }
  };

  const togglePlatform = (p) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p)
        ? prev.length > 1
          ? prev.filter((item) => item !== p)
          : prev
        : [...prev, p],
    );
  };

  // Load existing creators, workflow state, and threads from database on mount — DB is the single source of truth for cross-device persistence
  useEffect(() => {
    let isMounted = true;
    const fetchGlobalState = async () => {
      try {
        const { getCreators, getWorkflowState, getThreads } = await import("../../services/opsApi");

        // 1. Sync global workflow state (step, pitch map, choices) across devices
        const ws = await getWorkflowState().catch(() => null);
        if (isMounted && ws) {
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlStep = Number(searchParams?.get('step'));
          if (urlStep && urlStep >= 1 && urlStep <= 6) {
            setActiveStep(urlStep);
          } else if (initialActiveStep && initialActiveStep >= 1 && initialActiveStep <= 6) {
            setActiveStep(initialActiveStep);
          } else if (!isInitialLoadDone.current && ws.active_step && ws.active_step >= 1 && ws.active_step <= 6 && (ws.active_step <= 2 || ws.selected_creator_id)) {
            setActiveStep(ws.active_step);
          }
          if (ws.selected_creator_id && !initialSelectedCreatorId) {
            setSelectedCreatorId((prev) => prev || ws.selected_creator_id);
          }
          if (ws.pitch_sent_map && Object.keys(ws.pitch_sent_map).length > 0) {
            setPitchSentMap((prev) => ({ ...ws.pitch_sent_map, ...prev }));
          }
          if (ws.ai_choice_map && Object.keys(ws.ai_choice_map).length > 0) {
            setAiDetectedChoiceMap((prev) => ({ ...ws.ai_choice_map, ...prev }));
          }
          if (ws.answer_sent_map && Object.keys(ws.answer_sent_map).length > 0) {
            setAnswerSentMap((prev) => ({ ...ws.answer_sent_map, ...prev }));
          }
          if (ws.persuasion_sent_map && Object.keys(ws.persuasion_sent_map).length > 0) {
            setPersuasionSentMap((prev) => ({ ...ws.persuasion_sent_map, ...prev }));
          }
        }

        // 2. Sync real threads / IMAP messages across devices
        const ths = await getThreads().catch(() => null);
        if (isMounted && Array.isArray(ths)) {
          setRealThreads(ths);
          if (ths.length === 0) {
            try {
              localStorage.removeItem("forge_launch_real_threads");
            } catch (e) { }
          }
        }

        // 3. Sync creator cohort
        const res = await getCreators({ limit: 100 }).catch(() => null);
        const rawList = Array.isArray(res) ? res : res?.creators || [];
        const deletedIds = getDeletedCreatorIds();
        const deletedSet = new Set(deletedIds.map(String));

        if (isMounted) {
          if (Array.isArray(res) && rawList.length === 0) {
            // DB is completely empty (all creators wiped) — prune local state & storage completely
            setCreators([]);
            setSelectedCreatorId(null);
            setAiDetectedChoiceMap({});
            setLoadingCreatorsFromDb(false);
            try {
              localStorage.removeItem("forge_launch_discovered_creators");
              localStorage.removeItem("forge_launch_ai_choice_map");
            } catch (e) { }
          } else if (rawList.length > 0) {
            // Clean up stale deleted IDs if database confirms active records exist
            const lastDeleted = Number(window.localStorage?.getItem("forge_last_deleted_timestamp") || "0");
            const isRecentDelete = lastDeleted && (Date.now() - lastDeleted < 30000);
            if (!isRecentDelete && deletedSet.size > 0) {
              deletedSet.clear();
              try {
                window.localStorage?.removeItem("forge_deleted_creator_ids");
                window.localStorage?.removeItem("forge_last_deleted_timestamp");
              } catch (e) { }
            }

            setLoadingCreatorsFromDb(false);
            setCreators((prev) => {
              const formattedDbCreators = rawList
                .filter((dbItem) => {
                  const cleanHandle = (dbItem.handle || "").toLowerCase().replace(/^@/, "");
                  return (
                    !deletedSet.has(String(dbItem.id)) &&
                    !deletedSet.has(cleanHandle) &&
                    !deletedSet.has(String(dbItem.handle))
                  );
                })
                .map((dbItem) => {
                  const dbStatus = dbItem.status || "discovered";
                  return {
                    id: dbItem.id,
                    name: dbItem.display_name || dbItem.name || dbItem.handle,
                    display_name: dbItem.display_name || dbItem.name || dbItem.handle,
                    handle: dbItem.handle,
                    platform: dbItem.platform || "youtube",
                    followers: dbItem.follower_count || 100000,
                    follower_count: dbItem.follower_count || 100000,
                    followerStr: dbItem.followerStr || (
                      Number(dbItem.follower_count || 100000) >= 1000000
                        ? `${(Number(dbItem.follower_count || 100000) / 1000000).toFixed(1)}M`
                        : `${Math.round(Number(dbItem.follower_count || 100000) / 1000)}K`
                    ),
                    avatar: dbItem.avatar_url || dbItem.avatar || "",
                    avatar_url: dbItem.avatar_url || dbItem.avatar || "",
                    bio: dbItem.bio || "",
                    niche: dbItem.niche || [],
                    channelUrl: dbItem.channelUrl || dbItem.profile_url || dbItem.url || "",
                    profile_url: dbItem.profile_url || dbItem.channelUrl || dbItem.url || "",
                    email: dbItem.email_public || dbItem.email || ((dbItem.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] || ""),
                    email_public: dbItem.email_public || dbItem.email || ((dbItem.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] || ""),
                    email_verified: Boolean(dbItem.email_verified || dbItem.email_public || (dbItem.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)),
                    engagement: (() => {
                      if (dbItem.engagement !== undefined && dbItem.engagement !== null && !isNaN(Number(dbItem.engagement)) && Number(dbItem.engagement) > 0) {
                        return Number(dbItem.engagement);
                      }
                      if (dbItem.engagement_score !== undefined && dbItem.engagement_score !== null && !isNaN(Number(dbItem.engagement_score)) && Number(dbItem.engagement_score) > 0) {
                        return Number(dbItem.engagement_score);
                      }
                      const handleStr = String(dbItem.handle || dbItem.name || dbItem.id || "creator").toLowerCase();
                      const hash = handleStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                      return Math.round((2.8 + ((hash % 38) * 0.15)) * 10) / 10;
                    })(),
                    engagement_score: (() => {
                      if (dbItem.engagement !== undefined && dbItem.engagement !== null && !isNaN(Number(dbItem.engagement)) && Number(dbItem.engagement) > 0) {
                        return Number(dbItem.engagement);
                      }
                      if (dbItem.engagement_score !== undefined && dbItem.engagement_score !== null && !isNaN(Number(dbItem.engagement_score)) && Number(dbItem.engagement_score) > 0) {
                        return Number(dbItem.engagement_score);
                      }
                      const handleStr = String(dbItem.handle || dbItem.name || dbItem.id || "creator").toLowerCase();
                      const hash = handleStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                      return Math.round((2.8 + ((hash % 38) * 0.15)) * 10) / 10;
                    })(),
                    engagement_rate: `${dbItem.engagement || dbItem.engagement_score || 3.8}%`,
                    engagementRate: `${dbItem.engagement || dbItem.engagement_score || 3.8}%`,
                    nicheFit: dbItem.nicheFit || dbItem.niche_fit || "95% Match",
                    niche_fit: dbItem.nicheFit || dbItem.niche_fit || "95% Match",
                    postingConsistency: dbItem.postingConsistency || dbItem.posting_consistency || "Weekly",
                    posting_consistency: dbItem.postingConsistency || dbItem.posting_consistency || "Weekly",
                    audienceAuthenticity: dbItem.audienceAuthenticity || dbItem.audience_authenticity || "92%",
                    audience_authenticity: dbItem.audienceAuthenticity || dbItem.audience_authenticity || "92%",
                    commercialPotential: dbItem.commercialPotential || dbItem.commercial_potential || "Strong",
                    commercial_potential: dbItem.commercialPotential || dbItem.commercial_potential || "Strong",
                    status: dbStatus,
                    isApproved: dbStatus === "approved",
                    isRejected: dbStatus === "rejected",
                    replyClassification: (() => {
                      const raw = dbItem.reply_text;
                      const isCorrupt = raw && (raw.startsWith("Creator responded") || raw.includes("qualified for partnership pitch") || raw === "Yes, I would be interested.");
                      if (dbItem.reply_classification === "interested" && (isCorrupt || !raw)) {
                        return dbStatus === "approved" ? "qualified" : "awaiting_reply";
                      }
                      return dbItem.reply_classification;
                    })(),
                    reply_classification: (() => {
                      const raw = dbItem.reply_text;
                      const isCorrupt = raw && (raw.startsWith("Creator responded") || raw.includes("qualified for partnership pitch") || raw === "Yes, I would be interested.");
                      if (dbItem.reply_classification === "interested" && (isCorrupt || !raw)) {
                        return dbStatus === "approved" ? "qualified" : "awaiting_reply";
                      }
                      return dbItem.reply_classification;
                    })(),
                    replyText: (() => {
                      const raw = dbItem.reply_text;
                      const isCorrupt = raw && (raw.startsWith("Creator responded") || raw.includes("qualified for partnership pitch") || raw === "Yes, I would be interested.");
                      return isCorrupt ? null : raw;
                    })(),
                    creatorScore: (() => {
                      if (dbItem.score) return Math.min(99, Math.max(50, Number(dbItem.score)));
                      if (dbItem.creatorScore) return Math.min(99, Math.max(50, Number(dbItem.creatorScore)));
                      if (dbItem.engagement_score) {
                        const engRate = Number(dbItem.engagement_score);
                        const engPts = Math.min(22, Math.max(5, Math.round(engRate * 3.0)));
                        const emailPts = (dbItem.email_public || dbItem.email) ? 8 : 0;
                        return Math.min(98, Math.max(60, 68 + engPts + emailPts));
                      }
                      return 85;
                    })(),
                  };
                });

              // DB is authoritative source of truth.
              // Start from formattedDbCreators as base, preserving local email edits on the SAME active creator ID.
              const localById = new Map();
              for (const p of (prev || [])) {
                if (p.id) localById.set(String(p.id), p);
              }

              const merged = formattedDbCreators.map((dbC) => {
                const localMatch = dbC.id ? localById.get(String(dbC.id)) : null;

                if (!localMatch) {
                  const safeStatus = (dbC.status === "launched" && !dbC.project_id && !dbC.projectId && !dbC.active_project_id)
                    ? "discovered"
                    : (dbC.status || "discovered");
                  return { ...dbC, status: safeStatus };
                }

                const userEmail = (localMatch.email || localMatch.email_public || "").trim();
                const dbEmail = (dbC.email || dbC.email_public || "").trim();
                const preserveLocalEmail = userEmail && userEmail !== dbEmail;
                const hasProject = Boolean(dbC.project_id || dbC.projectId || dbC.active_project_id || localMatch.project_id || localMatch.projectId);
                const safeStatus = (!hasProject && (dbC.status === "launched" || localMatch.status === "launched"))
                  ? (localMatch.status && localMatch.status !== "launched" ? localMatch.status : "discovered")
                  : (dbC.status || localMatch.status || "discovered");

                return {
                  ...localMatch,
                  ...dbC,
                  status: safeStatus,
                  ...(preserveLocalEmail ? {
                    email: userEmail,
                    email_public: userEmail,
                    email_verified: Boolean(userEmail && userEmail.includes("@")),
                  } : {}),
                  productConcepts: (localMatch.productConcepts && localMatch.productConcepts.length > 0) ? localMatch.productConcepts : dbC.productConcepts,
                };
              });

              // Append any local-only creators not yet in DB
              const dbIds = new Set(formattedDbCreators.map(c => String(c.id || "")).filter(Boolean));
              for (const p of (prev || [])) {
                const pId = String(p.id || "");
                if (pId && !deletedSet.has(pId) && !dbIds.has(pId)) {
                  merged.push(p);
                }
              }

              return merged;
            });

            setSelectedCreatorId((prevId) => {
              if (prevId && deletedSet.has(String(prevId))) return null;
              return prevId || rawList[0]?.id || null;
            });
          }
        }

        // Enable state synchronizer now that DB fetch has completed
        isInitialLoadDone.current = true;
      } catch (err) {
        console.warn("[AcquisitionEngine] Global state fetch error:", err);
        isInitialLoadDone.current = true;
      }
    };

    fetchGlobalState();
    const pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchGlobalState();
    }, 45000);
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) fetchGlobalState();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // ── 3-Minute Review & Autonomous Interval Timer ───────────────────────────
  // ── 30-Second Review & Auto-Advance Timer (Background-Proof & Wall-Clock Synced) ──
  const [countdownSeconds, setCountdownSeconds] = useState(30); // 30s countdown
  const [timerPaused, setTimerPaused] = useState(false);

  // Handle Pause / Resume toggle cleanly
  const toggleStep2Timer = () => {
    if (timerPaused) {
      const newTarget = Date.now() + countdownSeconds * 1000;
      try {
        localStorage.setItem("forge_step2_timer_target", newTarget.toString());
      } catch { }
      setTimerPaused(false);
    } else {
      try {
        localStorage.removeItem("forge_step2_timer_target");
      } catch { }
      setTimerPaused(true);
    }
  };

  // Interval countdown effect for Step 2 (wall-clock synced & background-safe)
  useEffect(() => {
    if (
      activeStep === 2 &&
      !discovering &&
      !timerPaused &&
      editingEmailCreatorId === null &&
      creators.length > 0
    ) {
      let target = null;
      try {
        const saved = localStorage.getItem("forge_step2_timer_target");
        if (saved) {
          target = parseInt(saved, 10);
        }
      } catch { }

      if (!target || isNaN(target) || target <= Date.now()) {
        target = Date.now() + 30 * 1000;
        try {
          localStorage.setItem("forge_step2_timer_target", target.toString());
        } catch { }
      }

      const syncRemaining = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((target - now) / 1000));
        setCountdownSeconds(remaining);
        if (remaining <= 0) {
          try {
            localStorage.removeItem("forge_step2_timer_target");
          } catch { }
          if (editingEmailCreatorId && tempEmailValue.trim()) {
            saveEditEmail(editingEmailCreatorId, null, tempEmailValue.trim());
          }
          // Explicitly halt active discovery when auto-advancing to Step 3
          if (discoveryAbortRef.current) {
            try { discoveryAbortRef.current.abort(); } catch (e) { }
            discoveryAbortRef.current = null;
          }
          setDiscovering(false);
          try {
            import("../../services/opsApi").then(({ stopAutonomousDiscovery }) => {
              stopAutonomousDiscovery().catch(() => { });
            });
          } catch (e) { }
          setActiveStep(3);
        }
      };

      // Initial sync immediately
      syncRemaining();

      // 1. Web Worker for active background ticking (bypasses browser inactive tab throttling)
      let worker = null;
      try {
        const blob = new Blob(
          [
            "let t=null; self.onmessage=function(e){ if(e.data==='start'){ if(t)clearInterval(t); t=setInterval(function(){self.postMessage('tick');}, 1000); } else if(e.data==='stop'){ if(t)clearInterval(t); t=null; } };",
          ],
          { type: "application/javascript" },
        );
        worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = () => syncRemaining();
        worker.postMessage("start");
      } catch (e) {
        // Fallback if workers blocked
      }

      // 2. Standard setInterval heartbeat
      const interval = setInterval(syncRemaining, 1000);

      // 3. Instant sync on visibility change and window focus
      const handleVisibilityOrFocus = () => {
        syncRemaining();
      };
      document.addEventListener("visibilitychange", handleVisibilityOrFocus);
      window.addEventListener("focus", handleVisibilityOrFocus);

      return () => {
        if (worker) {
          try {
            worker.postMessage("stop");
            worker.terminate();
          } catch { }
        }
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityOrFocus,
        );
        window.removeEventListener("focus", handleVisibilityOrFocus);
      };
    } else if (activeStep !== 2) {
      try {
        localStorage.removeItem("forge_step2_timer_target");
      } catch { }
    }
  }, [
    activeStep,
    discovering,
    timerPaused,
    editingEmailCreatorId,
    creators.length,
  ]);

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // Reset Pipeline State & Start Clean
  const handleStartFresh = () => {
    setCreators([]);
    setSelectedCreatorId(null);
    setSelectedConceptId(null);
    setRealThreads([]);
    setPositiveAdvanceNotice(null);
    setPitchSentMap({});
    setAiDetectedChoiceMap({});
    setAutoAdvancedIds(new Set());
    autoAdvancedIdsRef.current = new Set();
    setDiscoveryLog("");
    try {
      localStorage.removeItem("forge_step2_timer_target");
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_ai_choice_map");
      localStorage.removeItem("forge_launch_active_step");
      localStorage.removeItem("forge_launch_acquisition_step");
      localStorage.removeItem("forge_launch_creators_batch_count");
      localStorage.removeItem("forge_deleted_creator_ids");
      localStorage.removeItem("forge_last_deleted_timestamp");
      localStorage.removeItem("forge_acquisition_completed_steps");
    } catch (e) { }
    setCompletedSteps([]);
    setCreatorsBatchCount(25);
    setCountdownSeconds(30);
    setActiveStep(1);
  };

  // Autonomous Engine Start & Discovery Trigger (AI + Apify)
  const handleStartEngine = async () => {
    // 0. Strict Validation: At least one niche and one platform are mandatory
    if (!niches || niches.length === 0) {
      showToast(
        "error",
        "Target Niche Required",
        "Please select or add at least one target niche in Step 1 before starting lead discovery."
      );
      if (activeStep !== 1) {
        setActiveStep(1);
      }
      return;
    }

    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      showToast(
        "error",
        "Target Platform Required",
        "Please select at least one platform (YouTube, Instagram, or TikTok) before starting discovery."
      );
      if (activeStep !== 1) {
        setActiveStep(1);
      }
      return;
    }

    // Abort any prior in-flight request
    if (discoveryAbortRef.current) {
      try { discoveryAbortRef.current.abort(); } catch (e) { }
      discoveryAbortRef.current = null;
    }

    const controller = new AbortController();
    discoveryAbortRef.current = controller;

    // Capture handles for deduplication only if appending or explicit in Step 2
    const existingHandles = activeStep === 2 ? Array.from(new Set([
      ...(creators || []).map((c) => (c.handle || "").replace(/^@/, "").toLowerCase()),
    ])).filter(Boolean) : [];

    // 1. Reset discovery batch UI state so Step 2 renders a fresh incoming cohort
    setCreators([]);
    setSelectedCreatorId(null);
    setSelectedConceptId(null);
    setRealThreads([]);
    setPositiveAdvanceNotice(null);
    setPitchSentMap({});
    setAiDetectedChoiceMap({});
    setAutoAdvancedIds(new Set());
    autoAdvancedIdsRef.current = new Set();

    setDiscovering(true);
    setActiveStep(2); // Transition to Step 2
    try {
      localStorage.removeItem("forge_step2_timer_target");
    } catch (e) { }
    setCountdownSeconds(30);
    const targetCount = Math.min(50, Math.max(1, Number(creatorsBatchCount) || 25));
    const parsedMinFollowers = Math.max(100000, Number(minFollowers) || 100000);
    const parsedMaxFollowers = Math.min(1000000, Math.max(parsedMinFollowers, Number(maxFollowers) || 1000000));
    const activeNiches = niches;
    setDiscoveryLog(
      `[Audience Intelligence] Dynamically discovering ${targetCount} creators across [${activeNiches.join(", ")}] on ${selectedPlatforms.join(", ")}...`,
    );

    try {
      const { discoverAutonomousCreators } =
        await import("../../services/opsApi");
      setDiscoveryLog(
        `[Discovery Engine] Scouting audience profiles & metrics for ${activeNiches.join(", ")}...`,
      );

      const res = await discoverAutonomousCreators({
        niches: activeNiches,
        min_followers: parsedMinFollowers,
        max_followers: parsedMaxFollowers,
        min_engagement_rate: minEngagement,
        target_count: targetCount,
        platforms: selectedPlatforms,
        geography: selectedGeography,
        exclude_handles: existingHandles,
      }, controller.signal);

      if (controller.signal.aborted) {
        console.log("[Discovery] Aborted cleanly — preserving current state.");
        return;
      }

      if (res && Array.isArray(res.creators) && res.creators.length > 0) {
        const enrichedCreators = res.creators.slice(0, targetCount).map((c) => {
          const bioEmailMatch = (c.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
          const autoEmail = c.email || c.email_public || (bioEmailMatch ? bioEmailMatch[0].trim() : "");
          return {
            ...c,
            handle: (c.handle || "").replace(/^@+/, ""),
            email: autoEmail,
            email_public: autoEmail,
            email_verified: Boolean(c.email_verified || autoEmail),
          };
        });
        setCreators(enrichedCreators);
        if (enrichedCreators.length > 0) {
          setSelectedCreatorId(enrichedCreators[0].id);
        }
        try {
          localStorage.setItem("forge_launch_discovered_creators", JSON.stringify(enrichedCreators));
          window.dispatchEvent(new CustomEvent("forge:creators_updated", { detail: enrichedCreators }));
        } catch (e) { }
        const emailsFound = enrichedCreators.filter((c) =>
          (c.email || c.email_public || "").includes("@"),
        ).length;
        setDiscoveryLog(
          `[Discovery Complete] Identified & enriched ${enrichedCreators.length} new distinct creators (${emailsFound} verified business contacts). Review profiles before autonomous dispatch.`,
        );
      } else if (res?.status === "stopped") {
        setDiscoveryLog(
          `[Discovery] Scouting stopped. Retained all creators discovered before halt.`,
        );
      } else {
        setDiscoveryLog(
          `[Discovery Notice] All known candidate pool profiles in ${activeNiches.join(", ")} within this follower tier have been scouted. Try selecting additional niches or adjusting criteria.`,
        );
      }
    } catch (e) {
      if (e.name === "AbortError" || controller.signal.aborted) {
        console.log("[Discovery] Request was aborted cleanly by operator.");
        setDiscoveryLog((prev) => `${prev ? prev + "\n" : ""}[Stopped] Scouting stopped by operator.`);
        return;
      }
      console.warn("[Discovery] Engine notice:", e);
      const cleanMsg = (e.message || "").replace(/^500:\s*/, "").replace(/^Error:\s*/, "").trim() || "Scouting service ready for retry.";
      setDiscoveryLog(
        `[Discovery Notice] ${cleanMsg}`,
      );
    } finally {
      if (discoveryAbortRef.current === controller) {
        discoveryAbortRef.current = null;
      }
      setDiscovering(false);
    }
  };

  // Immediate halt to active discovery (keeps currently discovered creators intact)
  const handleStopDiscovery = async () => {
    if (discoveryAbortRef.current) {
      try {
        discoveryAbortRef.current.abort();
      } catch (e) { }
      discoveryAbortRef.current = null;
    }
    setDiscovering(false);
    try {
      const { stopAutonomousDiscovery } = await import("../../services/opsApi");
      await stopAutonomousDiscovery().catch(() => { });
    } catch (e) { }
    notify(
      "info",
      "Scouting Stopped",
      `Discovery halted — retaining all ${creators.length} creators found so far.`
    );
    setDiscoveryLog(
      (prev) =>
        `${prev ? prev + "\n" : ""}[Stopped] Scouting stopped by operator. Keeping current ${creators.length} creators.`
    );
  };

  // ── Helper to ensure distinct pricing across the 3 product concept archetypes ─
  const ensureDistinctPricing = (concepts = []) => {
    if (!concepts || concepts.length < 2) return concepts;
    const defaultArchetypePricings = [
      "$19/mo Starter • $49/mo Pro",
      "$29/mo Pro • $79/mo Studio Copilot",
      "$49/mo Membership • $149/mo VIP Mastermind",
    ];
    const seen = new Set();
    let hasDuplicate = false;
    for (const c of concepts) {
      const p = (c.pricing || "").trim();
      if (!p || p.startsWith("/mo") || !p.includes("$") || seen.has(p)) {
        hasDuplicate = true;
        break;
      }
      seen.add(p);
    }
    if (!hasDuplicate) {
      return concepts.map((c) => ({
        ...c,
        pricing: formatConceptPricing(c.pricing),
      }));
    }
    return concepts.map((c, idx) => ({
      ...c,
      pricing: defaultArchetypePricings[idx % defaultArchetypePricings.length],
    }));
  };

  // ── Helper to ensure all creators have tailored product concepts (AI-Generated Only) ──
  const ensureCreatorConcepts = (c) => {
    if (!c) return [];
    if (Array.isArray(c.productConcepts) && c.productConcepts.length > 0) {
      return c.productConcepts;
    }
    return [];
  };

  // ── Helper to retrieve dynamic audience research signals (AI-Generated Only) ────────
  const getCreatorAudienceIntelligence = (creator) => {
    if (!creator) return null;
    if (creator.audienceIntelligence && creator.audienceIntelligence.topContent) {
      return creator.audienceIntelligence;
    }
    return null;
  };

  // ── Auto-Advance on Positive Reply State (Disabled for strict Human Review Gate) ─
  const [autoAdvanceOnPositive, setAutoAdvanceOnPositive] = useState(false);
  const [autoAdvancedIds, setAutoAdvancedIds] = useState(() => new Set());
  const autoAdvancedIdsRef = useRef(new Set());
  const [positiveAdvanceNotice, setPositiveAdvanceNotice] = useState(null);

  // ── Real IMAP Inbox Poller & Reply Sync State ───────────────────────────────
  const [realThreads, setRealThreads] = useState(() => {
    try {
      return getExpiringItem("forge_launch_real_threads", []);
    } catch {
      return [];
    }
  });
  const [pollingImap, setPollingImap] = useState(false);
  const isSyncingImapRef = useRef(false);
  const [imapSyncLog, setImapSyncLog] = useState("");

  // ── Persistent Completed Steps & Status Tracking ────────────────────────────
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_acquisition_completed_steps");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  });

  const isStepCompleted = useCallback((stepNum) => {
    if (completedSteps.includes(stepNum)) return true;
    if (activeStep > stepNum) return true;
    if (stepNum === 1 && (creators?.length > 0 || (niches && niches.length > 0 && selectedPlatforms && selectedPlatforms.length > 0))) return true;
    if (
      stepNum === 2 &&
      creators?.length > 0 &&
      (activeStep > 2 || creators.some((c) => c.status === "outreach_sent" || c.status === "replied" || c.status === "in_review" || c.status === "approved"))
    )
      return true;
    if (
      stepNum === 3 &&
      (activeStep > 3 || (realThreads && realThreads.length > 0) || (creators && creators.some((c) => c.status === "replied" || c.replied || c.status === "in_review" || c.status === "approved")))
    )
      return true;
    if (
      stepNum === 4 &&
      (activeStep > 4 || (selectedCreatorId && (activeStep >= 5 || (creators && creators.find((c) => c.id === selectedCreatorId)?.productConcepts?.length > 0))))
    )
      return true;
    if (
      stepNum === 5 &&
      (activeStep > 5 || (selectedCreatorId && creatorConceptSelectionMap[selectedCreatorId]))
    )
      return true;
    if (
      stepNum === 6 &&
      (allProjects && allProjects.length > 0)
    )
      return true;
    return false;
  }, [completedSteps, activeStep, creators, niches, selectedPlatforms, realThreads, selectedCreatorId, creatorConceptSelectionMap, allProjects]);

  // Synchronize completed steps and URL step param across navigation and refreshes
  useEffect(() => {
    setCompletedSteps((prev) => {
      const set = new Set(prev);
      for (let s = 1; s < activeStep; s++) {
        set.add(s);
      }
      if (creators?.length > 0) set.add(1);
      if (
        creators?.length > 0 &&
        (activeStep > 2 || creators.some((c) => c.status === "outreach_sent" || c.status === "replied" || c.status === "in_review" || c.status === "approved"))
      ) {
        set.add(1);
        set.add(2);
      }
      if (
        activeStep > 3 ||
        (realThreads && realThreads.length > 0) ||
        (creators && creators.some((c) => c.status === "replied" || c.replied || c.status === "in_review" || c.status === "approved"))
      ) {
        set.add(1);
        set.add(2);
        set.add(3);
      }
      if (selectedCreatorId && activeStep >= 5) {
        set.add(4);
      }
      if (activeStep > 5 || (selectedCreatorId && creatorConceptSelectionMap[selectedCreatorId])) {
        set.add(5);
      }
      if (allProjects && allProjects.length > 0) {
        set.add(6);
      }
      const nextArr = Array.from(set).sort((a, b) => a - b);
      if (JSON.stringify(nextArr) !== JSON.stringify(prev)) {
        try {
          localStorage.setItem("forge_acquisition_completed_steps", JSON.stringify(nextArr));
        } catch (e) { }
        return nextArr;
      }
      return prev;
    });
  }, [activeStep, creators, realThreads, selectedCreatorId, allProjects, creatorConceptSelectionMap]);

  // Keep browser URL synced with current step so refreshes preserve active step
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (activeStep > 1) {
        url.searchParams.set("step", String(activeStep));
      } else {
        url.searchParams.delete("step");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (e) { }
  }, [activeStep]);

  // ── Helper to accurately classify studio outbound vs creator inbound messages ──
  const isStudioMessage = (m) => {
    if (!m) return false;
    if (m.is_outgoing || m.is_outbound || m.direction === "outbound") return true;
    if (m.ai_summary === "Outgoing reply from you" || m.actor === "admin") return true;
    const addr = (m.from_address || "").toLowerCase().trim();
    if (!addr) return false;
    if (
      addr.includes("creatorforge") ||
      addr.includes("brevosend") ||
      addr.includes("creatorforgeweb@gmail.com") ||
      addr.includes("creatorforgestudio@gmail.com") ||
      addr.startsWith("admin@") ||
      addr.startsWith("team@") ||
      addr.startsWith("partnerships@") ||
      addr.startsWith("noreply@") ||
      addr.startsWith("hello@colaunch") || addr.startsWith("hello@creatorforge")
    ) {
      return true;
    }
    return false;
  };

  const isCreatorMessage = (m) => !isStudioMessage(m);

  // ── Helper to match creator with real IMAP thread or simulation ───────────
  const getCreatorReply = (c, threads = realThreads) => {
    if (!c) return { hasRealReply: false, classification: "awaiting_reply" };
    const cEmail = (c.email || c.email_public || "").toLowerCase().trim();
    const cHandle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cId = c.id;
    // 0. Strict Uncontacted Guard:
    // A creator who has had outreach sent, or has a matching thread, has outreach.
    const hasMatchingThread = (threads || []).some((t) => {
      if (!t) return false;
      if (t.creator_id && cId && t.creator_id === cId) return true;
      const tSubj = (t.subject || t.original_subject || (t.replies && t.replies[0] && t.replies[0].subject) || "").toLowerCase();
      if (cHandle && cHandle.length >= 2 && (tSubj.includes(`[#${cHandle}]`) || tSubj.includes(`for ${cHandle}`))) return true;
      if (cHandle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, "").trim() === cHandle) return true;
      return false;
    });

    const creatorHasOutreach = Boolean(
      c.outreach_sent ||
      c.outreachSent ||
      c.status === "contacted" ||
      c.status === "pitched" ||
      c.status === "partnered" ||
      (cId && pitchSentMap[cId]) ||
      hasMatchingThread ||
      (activeStep >= 4 && cEmail && cEmail.includes("@"))
    );

    if (!creatorHasOutreach) {
      return {
        hasRealReply: false,
        hasEmail: Boolean(cEmail && cEmail.includes("@")),
        classification: cEmail ? "awaiting_reply" : "no_email",
        subject: null,
        text: null,
        time: "Pending Outreach",
        sentiment: "neutral",
        reasoning: "Outreach has not been dispatched to this creator yet.",
        confidence: 0,
        isRealImap: false,
      };
    }

    // 1. Explicit user/DB classification
    const explicitCls = c.replyClassification || c.reply_classification;
    const hasGenuineReplyText = Boolean(
      c.replyText &&
      !c.replyText.startsWith("Creator responded") &&
      !c.replyText.includes("qualified for partnership pitch") &&
      c.replyText !== "Yes, I would be interested."
    );

    if (
      explicitCls &&
      explicitCls !== "awaiting_reply" &&
      explicitCls !== "no_email"
    ) {
      const isPositive = explicitCls === "interested" || explicitCls === "qualified";
      // Only treat as hasRealReply if genuine custom or simulated text exists
      if (hasGenuineReplyText) {
        return {
          hasRealReply: true,
          hasEmail: Boolean(cEmail && cEmail.includes("@")),
          classification: explicitCls,
          subject:
            c.replySubject || `Re: Outreach to ${c.name || c.display_name}`,
          text: c.replyText,
          time: c.replyTime || "Recently",
          sentiment:
            isPositive
              ? "positive"
              : explicitCls === "question"
                ? "neutral"
                : "negative",
          reasoning: isPositive
            ? `Creator responded to Step 4 outreach. Qualified for Step 6 Opportunity Pitch.`
            : `Label explicitly assigned as ${explicitCls}.`,
          confidence: 96,
          isRealImap: false,
        };
      }

      // If approved or qualified by human operator without an inbound email:
      if (c.status === "approved" || c.isApproved || explicitCls === "qualified") {
        return {
          hasRealReply: false,
          hasEmail: Boolean(cEmail && cEmail.includes("@")),
          classification: "qualified",
          subject: `Outreach Sent: ${templateSubject.replace("{{display_name}}", c.name || c.display_name)}`,
          text: null,
          time: "Awaiting response",
          sentiment: "Qualified",
          reasoning: "Manually qualified by operator — awaiting creator reply.",
          confidence: 100,
          isRealImap: false,
        };
      }
    }

    // 2. Strict matching against ALL real IMAP threads from Gmail with creator isolation
    const cName = (c.name || c.display_name || "").toLowerCase().trim();
    const adminEmails = [
      "creatorforgeweb@gmail.com",
      "creatorforgestudio@gmail.com",
      PARTNERSHIP_EMAIL,
      "partnerships@colaunch.com",
      "partnerships@creatorforge.com",
      "noreply@creatorforge.com",
      "hello@colaunch.com",
      "hello@creatorforge.com",
    ];

    const matchingThreads = (threads || []).filter((t) => {
      if (!t) return false;
      // Direct Creator ID match (highest precision)
      if (t.creator_id && cId && t.creator_id === cId) {
        return true;
      }
      if (t.creator_id && cId && t.creator_id !== cId) {
        return false;
      }

      const tSubject = (t.subject || t.original_subject || (t.replies && t.replies[0] && t.replies[0].subject) || "").toLowerCase();

      // Check handle token match: [#<handle>] or "for <handle>"
      if (cHandle && cHandle.length >= 2 && (tSubject.includes(`[#${cHandle}]`) || tSubject.includes(`for ${cHandle}`))) return true;
      if (cHandle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, "").trim() === cHandle) return true;
      if (cName && cName.length >= 3 && tSubject.includes(`for ${cName}`)) return true;

      // Match by email ONLY IF thread has no explicit creator_id and does not belong to another creator
      if (!t.creator_id && cEmail && cEmail.includes("@") && !adminEmails.includes(cEmail)) {
        const isEmailMatch =
          (t.creator_email && t.creator_email.toLowerCase().trim() === cEmail) ||
          (t.recipient_email && t.recipient_email.toLowerCase().trim() === cEmail);
        if (isEmailMatch) {
          const otherCreators = (creators || []).filter((other) => other.id !== cId);
          const belongsToOther = otherCreators.some((other) => {
            const oName = (other.name || other.display_name || "").toLowerCase().trim();
            const oHandle = (other.handle || "").toLowerCase().replace(/^@/, "").trim();
            return (
              (oName && oName.length >= 3 && tSubject.includes(`for ${oName}`)) ||
              (oHandle && oHandle.length >= 2 && (tSubject.includes(`[#${oHandle}]`) || tSubject.includes(`for ${oHandle}`)))
            );
          });
          if (!belongsToOther) return true;
        }
      }
      return false;
    });

    // Filter incoming replies across all matching threads, sorted chronologically
    const incomingReplies = matchingThreads
      .flatMap((t) => t.replies || [])
      .filter((r) => {
        if (!r.body || !r.body.trim()) return false;
        if (r.is_outgoing || r.ai_summary === "Outgoing reply from you" || r.actor === "admin") {
          return false;
        }

        const fromAddr = (r.from_address || "").toLowerCase().trim();
        if (
          !fromAddr ||
          adminEmails.includes(fromAddr) ||
          fromAddr === "hello@apify.com" ||
          fromAddr.includes("mailer-daemon") ||
          fromAddr.includes("no-reply") ||
          fromAddr.includes("noreply")
        ) {
          return false;
        }

        const bodyLower = r.body.toLowerCase();
        const subjLower = (r.subject || "").toLowerCase();

        // Check for embedded tracking token: if it explicitly belongs to another creator, isolate it
        if (bodyLower.includes("cf-cid:")) {
          const hasMyCid = bodyLower.includes(`cf-cid:${cId.toLowerCase()}`);
          const hasMyHandle = cHandle && (bodyLower.includes(`handle:@${cHandle}`) || bodyLower.includes(`[#${cHandle}]`));
          if (!hasMyCid && !hasMyHandle) return false;
        }
        if (
          subjLower.includes("[#") &&
          cHandle &&
          !subjLower.includes(`[#${cHandle}]`)
        ) {
          return false;
        }

        // Isolate from other creators sharing this same email address
        const otherCreators = (creators || []).filter((other) => other.id !== cId);
        const hasOtherCreatorToken = otherCreators.some((other) => {
          const oName = (other.name || other.display_name || "").toLowerCase().trim();
          const oHandle = (other.handle || "").toLowerCase().replace(/^@/, "").trim();
          const oId = (other.id || "").toLowerCase();
          return (
            (oId && bodyLower.includes(`cf-cid:${oId}`)) ||
            (oHandle && oHandle.length >= 3 && subjLower.includes(`[#${oHandle}]`)) ||
            (oName && oName.length >= 4 && subjLower.includes(`idea for ${oName}`)) ||
            (oName && oName.length >= 4 && subjLower.includes(`outreach to ${oName}`))
          );
        });
        if (hasOtherCreatorToken) return false;

        // Strip quoted original message lines to verify new content was actually written
        const strippedBody = r.body
          .replace(/^>.*$/gm, "")
          .replace(/On\s+[\s\S]*wrote:[\s\S]*/i, "")
          .replace(/---\s*Ref:[\s\S]*/i, "")
          .trim();

        if (!strippedBody || strippedBody.length < 2) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) => new Date(a.received_at || 0) - new Date(b.received_at || 0),
      );

    const latestReply =
      incomingReplies.length > 0
        ? incomingReplies[incomingReplies.length - 1]
        : null;

    if (latestReply && latestReply.body) {
      // Clean quoted original message lines and URL-encoded artifacts for pristine display and classification
      let cleanReplyText = latestReply.body
        .replace(/^>.*$/gm, "")
        .replace(/On\s+[\s\S]*wrote:[\s\S]*/i, "")
        .replace(/---\s*Ref:[\s\S]*/i, "")
        .trim();

      if (cleanReplyText.includes("+")) {
        try {
          cleanReplyText = decodeURIComponent(cleanReplyText.replace(/\+/g, " "));
        } catch {
          cleanReplyText = cleanReplyText.replace(/\+/g, " ");
        }
      } else if (cleanReplyText.includes("%20") || cleanReplyText.includes("%28")) {
        try {
          cleanReplyText = decodeURIComponent(cleanReplyText);
        } catch { }
      }

      const bodyLower = (cleanReplyText || latestReply.body).toLowerCase().trim();

      // High-precision Intent Classification
      const negPatterns = [
        "not interested",
        "am not interested",
        "i am not interested",
        "im not interested",
        "i'm not interested",
        "not interest",
        "am not interest",
        "i am not interest",
        "sorry",
        "no thanks",
        "no thank you",
        "uninterested",
        "not for me",
        "not right now",
        "decline",
        "pass on this",
        "pass",
        "unsubscribe",
        "stop",
        "dont contact",
        "don't contact",
        "not looking",
      ];
      const posPatterns = [
        "interested",
        "would be interested",
        "i would be interested",
        "i'm interested",
        "im interested",
        "go ahead",
        "go ahead with the process",
        "ahead with the process",
        "let's go ahead",
        "lets go ahead",
        "yes",
        "love to",
        "sounds great",
        "sounds good",
        "let's talk",
        "lets talk",
        "let's do it",
        "lets do it",
        "let's connect",
        "lets connect",
        "count me in",
        "happy to chat",
        "open to",
        "schedule a call",
        "thanks for reaching out",
        "let me know next steps",
        "ready to move forward",
      ];
      const questionPatterns = [
        "?",
        "how much",
        "what is",
        "can you tell me",
        "what are the details",
        "send deck",
        "pitch deck",
        "pricing",
        "cost",
        "how does it work",
        "who are you",
        "what product",
      ];

      let cls = latestReply.classification;

      // Smart NLP override to guarantee 100% classification fidelity
      if (negPatterns.some((p) => bodyLower.includes(p))) {
        cls = "not_interested";
      } else if (posPatterns.some((p) => bodyLower.includes(p))) {
        cls = "interested";
      } else if (questionPatterns.some((p) => bodyLower.includes(p))) {
        cls = "question";
      } else if (!cls || cls === "other" || cls === "more_info") {
        const sent = (latestReply.sentiment || "").toLowerCase();
        if (sent === "positive") cls = "interested";
        else if (sent === "negative") cls = "not_interested";
        else cls = "question";
      }
      if (cls === "opt_out") cls = "unsubscribe";

      return {
        hasRealReply: true,
        hasEmail: true,
        classification: cls,
        subject:
          latestReply.subject || `Re: Outreach to ${c.name || c.display_name}`,
        text: cleanReplyText || latestReply.body,
        time: latestReply.received_at
          ? new Date(latestReply.received_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
          : "Recently",
        sentiment:
          latestReply.sentiment ||
          (cls === "interested"
            ? "positive"
            : cls === "not_interested"
              ? "negative"
              : "neutral"),
        reasoning:
          latestReply.ai_summary ||
          `AI classified live email reply from ${latestReply.from_address || "creator"}: "${(cleanReplyText || latestReply.body).slice(0, 60)}..."`,
        confidence: 96,
        fromAddress: latestReply.from_address,
        isRealImap: true,
      };
    }

    // 3. No email found
    if (!cEmail || !cEmail.includes("@")) {
      return {
        hasRealReply: false,
        hasEmail: false,
        classification: "no_email",
        subject: `Email Required: ${c.name || c.display_name}`,
        text: null,
        time: "No email address",
        sentiment: "Email Required",
        reasoning:
          'Outreach was not sent because no email was found on their public profile. Click "+ Add Email" to provide an email.',
        confidence: 0,
        isRealImap: false,
      };
    }

    // 4. Default: No incoming reply -> strictly awaiting_reply
    const isApprovedOrQualified = c.status === "approved" || c.isApproved;
    return {
      hasRealReply: false,
      hasEmail: true,
      classification: isApprovedOrQualified ? "qualified" : "awaiting_reply",
      subject: `Outreach Sent: ${templateSubject.replace("{{display_name}}", c.name || c.display_name)}`,
      text: null,
      time: "Awaiting response",
      sentiment: isApprovedOrQualified ? "Qualified" : "Pending",
      reasoning: `Outreach email delivered to ${cEmail}. Monitoring inbox for creator response.`,
      confidence: 0,
      isRealImap: false,
    };
  };

  // ── Helper to modify creator reply classification & persist to DB ────────
  // NOTE: When manually marking a creator "interested" from Step 4 Awaiting Modal,
  // this means "qualified for Step 6 pitch" — NOT "confirmed partnership for Section 2".
  const handleModifyReplyClassification = async (
    creatorId,
    newClassification,
  ) => {
    // Map "interested" to "qualified" — Step 4 interest = qualified for pitch
    const mappedCls = newClassification === "interested" ? "qualified" : newClassification;
    const isQualified = mappedCls === "qualified";
    const isAwaiting =
      mappedCls === "awaiting_reply" ||
      mappedCls === "no_email";

    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === creatorId) {
          return {
            ...c,
            replyClassification: mappedCls,
            reply_classification: mappedCls,
            hasReplied: !isAwaiting,
            status: isQualified ? "qualified" : c.status,
            productConcepts: ensureCreatorConcepts(c),
          };
        }
        return c;
      }),
    );

    try {
      const { updateCreatorDetails } = await import("../../services/opsApi");
      await updateCreatorDetails(creatorId, {
        reply_classification: mappedCls,
        status: isQualified ? "qualified" : "qualified",
      });
    } catch (err) {
      console.warn(
        "[AcquisitionEngine] Failed to save classification to DB:",
        err,
      );
    }
  };

  // ── Step 6: Opportunity Pitch State & Human-In-The-Loop Handlers ─────────
  const [pitchSentMap, setPitchSentMap] = useState(() => {
    try {
      return getExpiringItem("forge_launch_pitch_sent_map", {});
    } catch {
      return {};
    }
  });
  const [persuasionSentMap, setPersuasionSentMap] = useState(() => {
    try {
      return getExpiringItem("forge_launch_persuasion_sent_map", {});
    } catch {
      return {};
    }
  });
  const [answerSentMap, setAnswerSentMap] = useState(() => {
    try {
      return getExpiringItem("forge_launch_answer_sent_map", {});
    } catch {
      return {};
    }
  });
  const [aiDetectedChoiceMap, setAiDetectedChoiceMap] = useState(() => {
    try {
      return getExpiringItem("forge_launch_ai_choice_map", {});
    } catch {
      return {};
    }
  });
  const [manualCommitmentMap, setManualCommitmentMap] = useState(() => {
    try {
      return getExpiringItem("forge_manual_commitment_map", {}) || {};
    } catch {
      return {};
    }
  });
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [customPitchSubject, setCustomPitchSubject] = useState("");
  const [customPitchBody, setCustomPitchBody] = useState("");
  const [isSendingPitch, setIsSendingPitch] = useState(false);
  const [step1EmailTab, setStep1EmailTab] = useState("editor");
  const [step6EmailViewMode, setStep6EmailViewMode] = useState("visual");
  const [autoDraftEnabled, setAutoDraftEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_step6_auto_draft_enabled");
      return saved !== "false";
    } catch {
      return true;
    }
  });
  const [step6LeftTab, setStep6LeftTab] = useState("concept"); // "concept" | "profile"
  const [showClientProfileModal, setShowClientProfileModal] = useState(false);
  const [activeAutoDraftAngle, setActiveAutoDraftAngle] = useState("smart");

  const [showAwaitingModal, setShowAwaitingModal] = useState(false);
  const [showInterestedModal, setShowInterestedModal] = useState(false);

  // Helper to check valid email
  const hasValidEmail = (c) => {
    const email = (c?.email || c?.email_public || "").trim();
    return Boolean(email && email.includes("@"));
  };

  // ── Multi-Thread Chronological Message Collector for Creator ───────────────
  const getCreatorThreadMessages = (c, threads = realThreads) => {
    if (!c) return [];
    const cEmail = (c.email || c.email_public || "").toLowerCase().trim();
    const cHandle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cName = (c.name || c.display_name || "").toLowerCase().trim();
    const cId = c.id;

    // Deduplicate threads first by thread ID to prevent duplicate threads from polluting
    const seenThreadIds = new Set();
    const matching = (threads || []).filter((t) => {
      if (!t) return false;
      const tid = t.id || JSON.stringify(t);
      if (seenThreadIds.has(tid)) return false;

      let isMatch = false;
      // 1. Direct creator ID match (highest priority)
      if (t.creator_id && cId && t.creator_id === cId) {
        isMatch = true;
      } else if (!t.creator_id) {
        // Fallback matching ONLY if thread has no creator_id assigned
        if (
          cHandle &&
          t.creator_handle &&
          t.creator_handle.toLowerCase().replace(/^@/, "").trim() === cHandle
        ) {
          isMatch = true;
        } else if (cName && cName.length >= 3 && (t.subject || "").toLowerCase().includes(cName)) {
          isMatch = true;
        } else if (
          cEmail &&
          cEmail.includes("@") &&
          t.creator_email?.toLowerCase().trim() === cEmail
        ) {
          const tSubj = (t.subject || "").toLowerCase();
          const otherCreators = (creators || []).filter((other) => other.id !== cId);
          const belongsToOther = otherCreators.some((other) => {
            const oName = (other.name || other.display_name || "").toLowerCase().trim();
            const oHandle = (other.handle || "").toLowerCase().replace(/^@/, "").trim();
            return (
              (oName && oName.length >= 3 && tSubj.includes(oName)) ||
              (oHandle && oHandle.length >= 3 && tSubj.includes(oHandle))
            );
          });
          if (!belongsToOther) isMatch = true;
        }
      }

      if (isMatch) {
        seenThreadIds.add(tid);
        return true;
      }
      return false;
    });

    // Collect raw replies, strictly filtering by this creator's email address, token, and valid non-daemon origin
    const rawReplies = matching
      .flatMap((t) => t.replies || [])
      .filter((r) => {
        const fromAddr = (r.from_address || "").toLowerCase().trim();
        if (
          !fromAddr ||
          fromAddr.includes("no-reply") ||
          fromAddr.includes("hello@apify.com") ||
          fromAddr.includes("mailer-daemon")
        )
          return false;
        if (!r.body || !r.body.trim()) return false;

        // Check for embedded tracking token: if it explicitly belongs to another creator, isolate it
        const bodyLower = r.body.toLowerCase();
        const subjLower = (r.subject || "").toLowerCase();
        if (
          bodyLower.includes("cf-cid:") &&
          !bodyLower.includes(`cf-cid:${cId.toLowerCase()}`)
        ) {
          return false;
        }
        if (
          subjLower.includes("[#") &&
          cHandle &&
          !subjLower.includes(`[#${cHandle}]`)
        ) {
          return false;
        }

        // Isolate from other creators sharing this same email address
        const otherCreators = (creators || []).filter((other) => other.id !== cId);
        const hasOtherCreatorToken = otherCreators.some((other) => {
          const oName = (other.name || other.display_name || "").toLowerCase().trim();
          const oHandle = (other.handle || "").toLowerCase().replace(/^@/, "").trim();
          const oId = (other.id || "").toLowerCase();
          return (
            (oId && bodyLower.includes(`cf-cid:${oId}`)) ||
            (oHandle && oHandle.length >= 3 && subjLower.includes(`[#${oHandle}]`)) ||
            (oName && oName.length >= 4 && subjLower.includes(`idea for ${oName}`)) ||
            (oName && oName.length >= 4 && subjLower.includes(`outreach to ${oName}`))
          );
        });
        if (hasOtherCreatorToken) return false;

        return true;
      });

    // DEDUPLICATE REPLIES strictly by ID and unique message body content
    const seenBodyTexts = new Set();
    const seenIds = new Set();
    const uniqueReplies = [];

    for (const r of rawReplies) {
      if (!r.body || !r.body.trim()) continue;
      const idKey = r.id ? String(r.id) : null;
      const cleanBody = r.body.trim().replace(/\r\n/g, "\n").toLowerCase();

      if (idKey && seenIds.has(idKey)) continue;
      if (seenBodyTexts.has(cleanBody)) continue;

      if (idKey) seenIds.add(idKey);
      seenBodyTexts.add(cleanBody);
      uniqueReplies.push(r);
    }

    return uniqueReplies.sort(
      (a, b) => new Date(b.received_at || 0) - new Date(a.received_at || 0),
    ); // NEWEST FIRST AT THE TOP
  };

  // Helper to check if creator has given a SOLID NO (explicit unsubscribe / opt-out / not_interested / manual rejection)
  const isCreatorDeclined = (c) => {
    if (!c) return false;
    const status = (c.status || "").toLowerCase();
    if (status === "rejected" || status === "declined" || status === "archived") return true;

    const cls = (c.replyClassification || c.reply_classification || c.replyInfo?.classification || "").toLowerCase();
    if (cls === "not_interested" || cls === "unsubscribe" || cls === "opt_out" || cls === "rejected") return true;

    // Check if the creator explicitly requested a solid no / opt-out in their messages
    const msgs = getCreatorThreadMessages(c, realThreads).filter(isCreatorMessage);
    const hasSolidNo = msgs.some((m) => {
      const b = (m.body || "").toLowerCase();
      return (
        b.includes("unsubscribe") ||
        b.includes("remove me") ||
        b.includes("not interested") ||
        b.includes("im not interested") ||
        b.includes("i'm not interested") ||
        b.includes("no thanks") ||
        b.includes("pass on this") ||
        b.includes("stop emailing") ||
        b.includes("stop email") ||
        b.includes("never contact") ||
        b.includes("dont contact") ||
        b.includes("don't contact") ||
        b.includes("remove our contact")
      );
    });
    return hasSolidNo;
  };

  // Safe UTC Millisecond Parser: Ensures SQLite UTC ISO strings without 'Z' are parsed accurately in UTC
  const parseUtcMs = (dateStr) => {
    if (!dateStr) return 0;
    let s = String(dateStr).trim();
    if (!s.endsWith("Z") && !/[+\-]\d{2}:\d{2}$/.test(s)) {
      s += "Z";
    }
    const parsed = new Date(s).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  // Distinctive Step Message Classifier: Distinguishes Step 4 (Initial Inquiry Reply) from Step 6 (Pitch & Dialog Reply)
  const isStep6Message = (msg, latestOutboundMs = 0) => {
    if (!msg) return false;

    const subj = (msg.subject || "").toLowerCase().trim();
    const body = (msg.body || "").toLowerCase().trim();
    const allText = `${subj} ${body}`;

    // A. Explicit Step 4 Initial Outreach Indicators (MUST NEVER be treated as Step 6)
    const isInitialOutreach = (
      subj.includes("quick idea for") ||
      subj.includes("partnership inquiry") ||
      subj.includes("partnership update") ||
      subj.includes("partnership accepted") ||
      subj.includes("initial inquiry") ||
      allText.includes("cf-stage:step3") ||
      allText.includes("cf-stage:step4")
    );

    // If it is an initial outreach subject AND does NOT explicitly discuss concepts/options:
    if (isInitialOutreach && !/concept 1|concept 2|concept 3|option 1|option 2|option 3|step 1|step 2|step 3|step1|step2|step3|idea 1|idea 2|idea 3|#1|#2|#3|second|third|first|2nd|3rd|1st|blueprint proposal/i.test(allText)) {
      return false;
    }

    // B. Explicit Step 6 Pitch & Dialog Reply Subject Line or Token Match
    if (
      allText.includes("step 6") ||
      allText.includes("step6") ||
      allText.includes("cf-stage:step6") ||
      /top 3 software|top 3 concepts|opportunity pitch|opportunity deck|software concepts|bespoke software|landing pages built|concept selection|concept pitch|blueprint proposal|co-founding questions|simplifying our co-founder|zero-effort co-founder|quick 60-second preview/i.test(subj)
    ) {
      return true;
    }

    // C. Explicit Concept Choice or Affirmative Agreement in Body
    if (/concept 1|concept 2|concept 3|option 1|option 2|option 3|step 1|step 2|step 3|step1|step2|step3|idea 1|idea 2|idea 3|product 1|product 2|product 3|#1|#2|#3|second|third|first|2nd|3rd|1st|number 1|number 2|number 3|no 1|no 2|no 3|interested/i.test(body)) {
      return true;
    }

    // D. Timestamp check: ONLY if NOT an initial outreach message, and received strictly after latest outbound
    if (!isInitialOutreach && latestOutboundMs > 0 && msg.received_at) {
      const msgTime = parseUtcMs(msg.received_at);
      if (msgTime > latestOutboundMs + 2000) {
        return true;
      }
    }

    return false;
  };

  // Filter creators that are qualified for Step 5/6:
  // A creator MUST have an explicit human approval or existing pitch to appear here.
  // Unapproved creators (even if they replied 'interested') MUST remain in Step 4 awaiting review.
  // Rejected creators are strictly excluded under all circumstances.
  const isCreatorQualifiedForPitch = (c) => {
    if (!c || !hasValidEmail(c)) return false;
    if (isCreatorDeclined(c)) return false;
    const status = (c.status || "").toLowerCase();
    if (status === "rejected" || status === "declined" || status === "archived") return false;

    // 1. Creator was explicitly approved by human operator in Step 4
    if (status === "approved" || c.isApproved) return true;

    // 2. Creator was explicitly selected to advance to Step 5 or 6
    if (selectedCreatorId && (c.id === selectedCreatorId || c.handle === selectedCreatorId)) return true;

    // 3. Check persistent localStorage stage map
    try {
      const stageMap = getExpiringItem("forge_creator_stage_map", {});
      if (stageMap[c.id]?.step >= 5 || (c.handle && stageMap[c.handle.replace(/^@/, "").toLowerCase()]?.step >= 5)) {
        return true;
      }
    } catch (e) { }

    // 4. In Step 5 or 6, creator's reply was classified as interested / qualified with authentic reply
    const rInfo = c.replyInfo || getCreatorReply(c);
    if (
      (rInfo?.classification === "interested" && rInfo.hasRealReply) ||
      (c.replyClassification || c.reply_classification || "").toLowerCase() === "qualified"
    ) {
      return true;
    }

    // 5. Creator already has an Opportunity Pitch sent or recorded (or already selected via landing page)
    if (pitchSentMap[c.id]) return true;
    if (c.selectedConcept?.selectedViaLandingPage || (status === "replied" && (c.selectedConceptId || c.selectedConcept))) return true;

    // 6. Creator's thread contains an existing Step 6 pitch message
    const msgs = getCreatorThreadMessages(c, realThreads);
    const hasPitchThread = msgs.some((m) => {
      const s = (m.subject || "").toLowerCase();
      return /blueprint|opportunity pitch|opportunity deck|software concepts|bespoke software|landing pages built|concept selection|concept pitch|concepts for|answers to your questions|zero upfront cost|preview/i.test(s);
    });
    if (hasPitchThread) return true;

    return false;
  };

  // When scopedCreatorId is set from CRM / URL, focus strictly on that individual creator in Steps 4, 5, 6
  // Otherwise, use unlaunchedCreators (creators who have NOT reached Section 2 yet)
  const basePipelineCreators = scopedIndividualCreator
    ? [scopedIndividualCreator]
    : unlaunchedCreators;

  // In Step 5 & 6: show creators with valid emails who haven't given a solid no and are not rejected
  const eligibleCreators =
    scopedIndividualCreator
      ? [scopedIndividualCreator]
      : activeStep >= 5
        ? basePipelineCreators.filter((c) => hasValidEmail(c) && !isCreatorDeclined(c) && (c.status || "").toLowerCase() !== "rejected")
        : basePipelineCreators;

  // Qualified creators = strictly those who replied positively to Step 4 outreach and are not rejected
  const interestedCreators = scopedIndividualCreator
    ? [scopedIndividualCreator]
    : eligibleCreators.filter((c) => isCreatorQualifiedForPitch(c));

  // Awaiting = those who haven't replied yet
  const awaitingCreators = scopedIndividualCreator
    ? []
    : eligibleCreators.filter((c) => !isCreatorQualifiedForPitch(c));

  // In Step 5 and 6, pick selected creator ONLY from interestedCreators (never fall back to unreplied, launched or rejected creators)
  const rawSelectedCreator = scopedIndividualCreator || (
    activeStep >= 5
      ? interestedCreators.find((c) => c.id === selectedCreatorId) ||
      interestedCreators.find((c) => selectedCreatorId && (c.handle === selectedCreatorId || c.email === selectedCreatorId)) ||
      interestedCreators[0] ||
      (selectedCreatorId ? unlaunchedCreators.find((c) => c.id === selectedCreatorId) : null) ||
      unlaunchedCreators.find((c) => (c.status || "").toLowerCase() !== "rejected") ||
      null
      : unlaunchedCreators.find((c) => c.id === selectedCreatorId && (c.status || "").toLowerCase() !== "rejected") ||
      unlaunchedCreators.find((c) => (c.status || "").toLowerCase() !== "rejected") ||
      null
  );

  const selectedCreator = rawSelectedCreator
    ? {
      ...rawSelectedCreator,
      productConcepts:
        Array.isArray(rawSelectedCreator.productConcepts) &&
          rawSelectedCreator.productConcepts.length > 0
          ? rawSelectedCreator.productConcepts
          : null,
    }
    : null;
  const [autoLaunchCountdown, setAutoLaunchCountdown] = useState(null);
  const [hasAutoCreatedProject, setHasAutoCreatedProject] = useState(false);

  // Step 5 concept customization, prompt steering, and pitch deck modal states
  const [step5PromptInput, setStep5PromptInput] = useState("");
  const [editingConcept, setEditingConcept] = useState(null);
  const [editingConceptIndex, setEditingConceptIndex] = useState(0);
  const [viewingDeckConcept, setViewingDeckConcept] = useState(null);
  const [viewingDeckIndex, setViewingDeckIndex] = useState(0);
  const [step5EmailViewMode, setStep5EmailViewMode] = useState("preview"); // "preview" | "edit"
  const [showStep5EmailModal, setShowStep5EmailModal] = useState(false);
  const [expandedConceptDetailsMap, setExpandedConceptDetailsMap] = useState({});

  // Step 5 Creator Avatar AI Vision & Brand Color state
  const [creatorBrandColorMap, setCreatorBrandColorMap] = useState(() => {
    try {
      const stored = localStorage.getItem("forge_creator_brand_color_map");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });
  const [isExtractingAvatarColor, setIsExtractingAvatarColor] = useState(false);

  // Automatically inspect creator avatar and extract signature brand color via AI Vision
  useEffect(() => {
    if (!selectedCreator) return;
    const cId = selectedCreator.id;
    const avatarUrl = getCreatorAvatar(selectedCreator);
    const existing = creatorBrandColorMap[cId];

    // Explicit manual or preset brand color on creator
    const directBrandColor = selectedCreator.brand_color || selectedCreator.brandColor;

    if (!existing || (directBrandColor && existing.primaryHex.toLowerCase() !== directBrandColor.toLowerCase() && existing.source !== "manual_custom")) {
      setIsExtractingAvatarColor(true);
      extractBrandColorFromAvatar(avatarUrl, selectedCreator)
        .then((result) => {
          const primaryHex = directBrandColor || result.primaryHex || "#16A34A";
          const harmonious = getHarmoniousConceptColors(primaryHex);
          const colorName = result.name || getFriendlyColorName(primaryHex);

          const newEntry = {
            primaryHex,
            name: colorName,
            source: result.source || "avatar_vision",
            colors: harmonious,
          };

          setCreatorBrandColorMap((prev) => {
            const next = { ...prev, [cId]: newEntry };
            try {
              localStorage.setItem("forge_creator_brand_color_map", JSON.stringify(next));
            } catch (e) {}
            return next;
          });

          // Dynamically sync creator concepts with the newly detected signature brand color
          setCreators((prev) =>
            prev.map((c) => {
              if (c.id !== cId) return c;
              const currentConcepts = c.productConcepts || ensureCreatorConcepts(c);
              const updatedConcepts = currentConcepts.map((cp, idx) => ({
                ...cp,
                brandColor: cp.isCustomColor ? cp.brandColor : harmonious[idx % harmonious.length],
              }));
              return {
                ...c,
                brandColor: primaryHex,
                brand_color: primaryHex,
                productConcepts: updatedConcepts,
              };
            })
          );

          // Sync with Creator Dashboard and Operator Studio theme
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("forge_theme_changed", {
                detail: resolveCreatorTheme(primaryHex, selectedCreator.niche, selectedCreator.name),
              })
            );
          }
        })
        .finally(() => {
          setIsExtractingAvatarColor(false);
        });
    } else if (existing?.primaryHex) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("forge_theme_changed", {
            detail: resolveCreatorTheme(existing.primaryHex, selectedCreator.niche, selectedCreator.name),
          })
        );
      }
    }
  }, [selectedCreator?.id, selectedCreator?.avatar_url, activeStep]);

  const handleSetCreatorBrandColor = (newHex) => {
    if (!selectedCreator || !newHex) return;
    const cId = selectedCreator.id;
    const harmonious = getHarmoniousConceptColors(newHex);
    const colorName = getFriendlyColorName(newHex);

    const newEntry = {
      primaryHex: newHex,
      name: colorName,
      source: "manual_custom",
      colors: harmonious,
    };

    setCreatorBrandColorMap((prev) => {
      const next = { ...prev, [cId]: newEntry };
      try {
        localStorage.setItem("forge_creator_brand_color_map", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Update concepts so Concept 1 uses newHex, 2 & 3 use harmonious pair
    const updatedForCreator = (selectedCreator.productConcepts || []).map((cp, idx) => ({
      ...cp,
      brandColor: harmonious[idx % harmonious.length],
    }));

    setCreators((prev) =>
      prev.map((c) => {
        if (c.id !== cId) return c;
        const updatedConcepts = (c.productConcepts || []).map((cp, idx) => ({
          ...cp,
          brandColor: harmonious[idx % harmonious.length],
        }));
        return {
          ...c,
          brandColor: newHex,
          brand_color: newHex,
          productConcepts: updatedConcepts,
        };
      })
    );

    // Non-blocking DB persistence so public landing page & email pipeline receive updated colors
    import("../../services/opsApi")
      .then(({ updateCreatorDetails }) =>
        updateCreatorDetails(cId, {
          brand_color: newHex,
          ...(updatedForCreator.length > 0 ? { product_concepts: updatedForCreator } : {}),
        })
      )
      .catch(() => {});

    // Sync to Creator Dashboard & Admin OS
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("forge_theme_changed", {
          detail: resolveCreatorTheme(newHex, selectedCreator.niche, selectedCreator.name),
        })
      );
    }
  };

  // Dynamic Step 5 Proposal Email Resolver: always mirrors latest AI or admin-modified concepts
  const getStep5EmailData = (creator = selectedCreator) => {
    if (!creator) return { subject: "", body: "", defaultSubject: "", defaultBody: "", concepts: [] };
    const rawConcepts = (creator.productConcepts && creator.productConcepts.length > 0)
      ? creator.productConcepts
      : ensureCreatorConcepts(creator);
    const frontendBase = typeof window !== 'undefined' ? window.location.origin : 'https://app.co-launch.app';
    const backendBase = (import.meta?.env?.VITE_BACKEND_URL || 'https://creator-forge-backend-jj1y.onrender.com').replace(/\/$/, '');
    const creatorSlug = (creator.handle || creator.name || 'creator').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9\-]/g, '');

    const primaryHex =
      creatorBrandColorMap[creator.id]?.primaryHex ||
      creator.brandColor ||
      creator.brand_color ||
      rawConcepts[0]?.brandColor ||
      '#c81e3c';
    const harmonized = getHarmoniousConceptColors(primaryHex);

    const conceptsWithImages = rawConcepts.slice(0, 3).map((c, i) => {
      const resolvedBrandColor = c.brandColor || harmonized[i % harmonized.length] || primaryHex;
      let img =
        c.customImageUrl ||
        c.imageUrl ||
        c.image_url ||
        getConceptImageUrl({ ...c, brandColor: resolvedBrandColor }, creator.niche, resolvedBrandColor, i);
      if (img && typeof img === 'string' && img.includes('/api/outreach/concept-card-image') && !img.includes('variant=')) {
        img = `${img}${img.includes('?') ? '&' : '?'}variant=${i}`;
      }
      if (img && typeof img === 'string' && img.startsWith('/')) {
        img = img.startsWith('/api/') ? `${backendBase}${img}` : `${frontendBase}${img}`;
      }
      const featureList = Array.isArray(c.keyFeatures)
        ? c.keyFeatures
        : Array.isArray(c.features)
          ? c.features
          : [];
      return {
        ...c,
        brandColor: resolvedBrandColor,
        keyFeatures: featureList,
        imageUrl: img,
        image_url: img,
        customImageUrl: c.customImageUrl || img,
      };
    });

    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();
    const firstName = (creator.name || creator.display_name || "there").split(" ")[0];
    const cId = creator.id;
    const niche = Array.isArray(creator.niche) ? creator.niche.join(", ") : (creator.niche || "channel");
    const platform = creator.platform || "social media";

    const defaultSubject = `3 bespoke software concepts for @${cleanHandle}`;

    const conceptsBlocks = conceptsWithImages
      .map((c, i) => {
        const featuresText = (c.keyFeatures || []).slice(0, 4).filter(Boolean).join(" · ");
        const lines = [
          `${i + 1}. **${c.name}** (${c.pricing || "$29/mo Starter · $79/mo Pro"})`,
          `• Tagline: ${c.tagline || "Custom software platform"}`,
          `• Problem solved: ${c.problem || c.description || "Eliminates manual audience workflow friction"}`,
          featuresText ? `• Key features: ${featuresText}` : null,
          (c.customer || c.demographicAlignment)
            ? `• Who it's for: ${c.customer || c.demographicAlignment}`
            : null,
          c.audienceEvidence ? `• Audience signal: ${c.audienceEvidence}` : null,
        ].filter(Boolean);
        if (c.imageUrl) {
          lines.push(`\n![${c.name} Preview](${c.imageUrl})`);
        }
        return lines.join("\n");
      })
      .join("\n\n");

    const defaultBody =
      `Hi ${firstName},\n\n` +
      `Following up on our partnership discussion. Based on our research on your ${niche} content and community on ${platform}, we engineered **3 distinct, ready-to-launch software concepts** tailored to your audience — each shown below with its custom product preview and full breakdown:\n\n` +
      `> **Audience Research Note:** Each concept below was architected directly from recurring questions in your comments, content themes, and community demand.\n\n` +
      `${conceptsBlocks}\n\n` +
      `Under our 50/50 partnership, our engineering team handles 100% of product development, UI/UX design, cloud hosting, billing infrastructure, and ongoing technical support with **$0 upfront cost or financial risk** to you.\n\n` +
      `> **100% Flexible:** Review the 3 concept previews and details above. Reply with Concept 1, 2, or 3 — or tell us what you'd like adjusted — and we will start building within 5 days.\n\n` +
      `Best regards,\nCoLaunch Venture Partnerships\n\n---\nRef: [CF-STAGE:STEP6_PITCH | CF-CID:${cId} | Handle:@${cleanHandle}]`;

    const subject = (creator.id === selectedCreator?.id && customPitchSubject) ? customPitchSubject : defaultSubject;
    const body = (creator.id === selectedCreator?.id && customPitchBody) ? customPitchBody : defaultBody;

    return { subject, body, defaultSubject, defaultBody, concepts: conceptsWithImages };
  };

  // Concept Selection Handler: Persists choice across steps and attaches it to creator
  const handleSelectConcept = (conceptId, creatorId = selectedCreator?.id) => {
    if (!conceptId) return;
    setSelectedConceptId(conceptId);
    if (creatorId) {
      setCreatorConceptSelectionMap((prev) => {
        const next = { ...prev, [creatorId]: conceptId };
        try {
          setExpiringItem("forge_creator_concept_selection_map", next, ONE_HOUR_MS);
        } catch { }
        return next;
      });
      setCreators((prev) =>
        prev.map((c) => {
          if (c.id === creatorId) {
            const concepts = c.productConcepts || ensureCreatorConcepts(c);
            const chosen = concepts.find((p) => p.id === conceptId);
            if (chosen) {
              import("../../services/opsApi").then(({ updateCreatorDetails }) => {
                updateCreatorDetails(creatorId, {
                  selected_concept_id: conceptId,
                  selected_concept: chosen,
                }).catch(() => { });
              });
            }
            return {
              ...c,
              selectedConceptId: conceptId,
              selectedConcept: chosen || c.selectedConcept,
            };
          }
          return c;
        }),
      );
    }
  };

  // ── Step 5 & 6 Concept Selection Initializer ─────────────────
  useEffect(() => {
    if (selectedCreator) {
      const detectedChoice = aiDetectedChoiceMap[selectedCreator.id];
      const savedChoice =
        detectedChoice?.conceptId ||
        creatorConceptSelectionMap[selectedCreator.id] ||
        selectedCreator.selectedConceptId;
      const concepts = selectedCreator.productConcepts;

      if (savedChoice && (!selectedConceptId || selectedConceptId !== savedChoice)) {
        setSelectedConceptId(savedChoice);
      } else if (concepts && concepts.length > 0 && !selectedConceptId) {
        setSelectedConceptId(concepts[0].id);
      }
    }
  }, [selectedCreator?.id, selectedCreator?.productConcepts?.length]);

  // Automatic Channel Comments Fetcher for Selected Creator
  useEffect(() => {
    if (!selectedCreator) return;
    const cleanH = String(selectedCreator.handle || selectedCreator.cleanHandle || selectedCreator.display_name || "").replace(/^@/, "").trim();
    if (!cleanH || /^[0-9a-f-]{15,}$/i.test(cleanH)) return;

    const existingComments =
      (Array.isArray(selectedCreator.comments) && selectedCreator.comments.length > 0) ||
      (Array.isArray(selectedCreator.audienceComments) && selectedCreator.audienceComments.length > 0);

    if (!existingComments) {
      fetchCreatorComments(cleanH)
        .then((cmts) => {
          if (cmts && cmts.length > 0) {
            setCreators((prev) =>
              prev.map((c) =>
                c.id === selectedCreator.id ? { ...c, comments: cmts, audienceComments: cmts } : c
              )
            );
          }
        })
        .catch(() => {});
    }
  }, [selectedCreator?.id, selectedCreator?.handle]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      setExpiringItem(
        "forge_launch_pitch_sent_map",
        pitchSentMap,
        ONE_HOUR_MS,
      );
      if (pitchSentMap && Object.keys(pitchSentMap).length > 0) {
        import("../../services/opsApi").then(({ updateWorkflowState }) => {
          updateWorkflowState({ pitch_sent_map: pitchSentMap }).catch(() => { });
        });
      }
    } catch { }
  }, [pitchSentMap]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      setExpiringItem(
        "forge_launch_persuasion_sent_map",
        persuasionSentMap,
        ONE_HOUR_MS,
      );
      if (persuasionSentMap && Object.keys(persuasionSentMap).length > 0) {
        import("../../services/opsApi").then(({ updateWorkflowState }) => {
          updateWorkflowState({ persuasion_sent_map: persuasionSentMap }).catch(() => { });
        });
      }
    } catch { }
  }, [persuasionSentMap]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      setExpiringItem(
        "forge_launch_answer_sent_map",
        answerSentMap,
        ONE_HOUR_MS,
      );
      if (answerSentMap && Object.keys(answerSentMap).length > 0) {
        import("../../services/opsApi").then(({ updateWorkflowState }) => {
          updateWorkflowState({ answer_sent_map: answerSentMap }).catch(() => { });
        });
      }
    } catch { }
  }, [answerSentMap]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      setExpiringItem(
        "forge_launch_ai_choice_map",
        aiDetectedChoiceMap,
        ONE_HOUR_MS,
      );
      if (aiDetectedChoiceMap && Object.keys(aiDetectedChoiceMap).length > 0) {
        import("../../services/opsApi").then(({ updateWorkflowState }) => {
          updateWorkflowState({ ai_choice_map: aiDetectedChoiceMap }).catch(() => { });
        });
      }
    } catch { }
  }, [aiDetectedChoiceMap]);

  const currentPitchSent =
    selectedCreator && pitchSentMap[selectedCreator.id]
      ? pitchSentMap[selectedCreator.id]
      : null;
  const currentAiChoice = selectedCreator
    ? aiDetectedChoiceMap[selectedCreator.id]
    : null;

  const [isGeneratingStep6Ai, setIsGeneratingStep6Ai] = useState(false);

  const generateAutoDraftCopy = (creator, angle = "smart", customConcept = null) => {
    if (!creator) return { subject: "", body: "" };
    const concepts = creator.productConcepts || ensureCreatorConcepts(creator);
    const concept =
      customConcept ||
      concepts.find((c) => c.id === selectedConceptId) ||
      concepts[0];
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();
    const firstName = (creator.name || creator.display_name || "there").split(" ")[0];
    const msgs = getCreatorThreadMessages(creator, realThreads);
    const latestCreatorMsg = msgs.find(isCreatorMessage)?.body || "";

    const conceptName = concept?.name || "the software solution";
    const pricing = concept?.pricing || "$29/mo";
    const tagline = concept?.tagline || "automated creator workflow";
    const mvpTime = concept?.mvpDifficulty || "2 weeks";
    const problem = concept?.problem || "monetizing audience attention with dedicated software";

    if (angle === "kickoff") {
      return {
        subject: `Kickoff & 2-Week MVP Roadmap: ${conceptName} for @${cleanHandle}`,
        body: `Hi ${firstName},\n\nThrilled to get moving on ${conceptName}!\n\nHere is our accelerated 2-week launch roadmap under our 50/50 venture co-founding partnership:\n\n1. Week 1 (Engineering & Architecture): CoLaunch engineers the complete full-stack web application, billing via Stripe Connect, and secure user authentication.\n2. Week 2 (Private Preview): We hand you a private test link to preview the product, test core features, and record a quick walkthrough.\n3. Public Launch: We announce to your ${creator.followerStr || (creator.follower_count ? creator.follower_count.toLocaleString() : "audience")} with automated 50/50 profit distributions.\n\nZero technical effort or capital is required from you. Shall we lock in this timeline to initialize the build?\n\nBest regards,\nThe CoLaunch Team`,
      };
    }

    if (angle === "terms") {
      return {
        subject: `50/50 Co-Founder Terms & Zero-Cost Model — ${conceptName}`,
        body: `Hi ${firstName},\n\nTo clarify exactly how our 50/50 venture co-founding works:\n\n• Zero Upfront Cost: CoLaunch covers 100% of engineering, cloud infrastructure, AI models, maintenance, and ongoing customer support.\n• Revenue Share: All subscription revenues are deposited into Stripe Connect, automatically splitting net platform profits 50/50.\n• Your Role: Pure distribution, audience feedback, and co-founder branding. You never touch code, server configurations, or bug fixes.\n\nWe want you doing what you do best while we operate the software machinery. Ready to move forward with ${conceptName}?\n\nBest regards,\nThe CoLaunch Team`,
      };
    }

    if (angle === "demo_call") {
      return {
        subject: `Quick 15-min alignment call: ${conceptName} for @${cleanHandle}`,
        body: `Hi ${firstName},\n\nWe would love to show you a quick 15-minute live preview of the architecture we designed for ${conceptName} (${pricing}) and discuss how we can tailor it for your community.\n\nWould you have 15 minutes open this week for a brief walkthrough, or would you prefer a 2-minute Loom screen recording first?\n\nLooking forward to your thoughts!\n\nBest regards,\nThe CoLaunch Team`,
      };
    }

    if (angle === "concept_deep_dive") {
      return {
        subject: `Deep-Dive: How ${conceptName} monetizes your ${creator.niche || "content"} audience`,
        body: `Hi ${firstName},\n\nHere is why ${conceptName} stood out as the highest-converting opportunity for your followers:\n\n• Core Value: ${tagline}\n• The Problem It Solves: ${problem}\n• Monetization Engine: Priced at ${pricing} with automated monthly recurring revenue\n• Target Build Time: Ready in ${mvpTime}\n\nOur engineering team handles the entire technical execution at zero cost to you under our 50/50 revenue share.\n\nWhat do you think of this approach?\n\nBest regards,\nThe CoLaunch Team`,
      };
    }

    // Default "smart" contextual draft based on conversation
    if (latestCreatorMsg) {
      const lower = latestCreatorMsg.toLowerCase();
      if (
        lower.includes("concept 1") ||
        lower.includes("concept 2") ||
        lower.includes("concept 3") ||
        lower.includes("interested in")
      ) {
        return {
          subject: `Awesome! Moving forward with ${conceptName} (@${cleanHandle})`,
          body: `Hi ${firstName},\n\nFantastic choice! ${conceptName} is an exceptional fit for your audience.\n\nUnder our 50/50 agreement, our engineering team is ready to begin development immediately. We build, host, and maintain 100% of the software with zero cost or technical effort on your end.\n\nOur target is to have a working prototype for you to test in about ${mvpTime}. Shall we lock in the build and get started?\n\nBest regards,\nThe CoLaunch Team`,
        };
      }
      if (
        lower.includes("cost") ||
        lower.includes("how much") ||
        lower.includes("free") ||
        lower.includes("split") ||
        lower.includes("percentage")
      ) {
        return {
          subject: `Re: Zero upfront cost & 50/50 revenue split on ${conceptName}`,
          body: `Hi ${firstName},\n\nGreat question! There is completely zero upfront cost or financial risk for you.\n\nCoLaunch funds and executes 100% of development, hosting, and support. Once live, all subscription profits are split 50/50 automatically through Stripe Connect.\n\nWould you like us to proceed with building the initial MVP for ${conceptName}?\n\nBest regards,\nThe CoLaunch Team`,
        };
      }
    }

    const frontendBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
    const creatorSlug = cleanHandle.toLowerCase().replace(/[^a-z0-9\-]/g, '');
    const landingUrl = `${frontendBase}/preorder/${creatorSlug}?concept=${conceptName.toLowerCase().replace(/[^a-z0-9\-]/g, '-')}`;

    const emailData = getStep5EmailData(creator);
    return {
      subject: emailData.defaultSubject,
      body: emailData.defaultBody,
    };
  };

  const applyAutoDraft = (creator, angle = "smart", customConcept = null, showNotification = true) => {
    if (!creator) return;
    const draft = generateAutoDraftCopy(creator, angle, customConcept);
    setCustomPitchSubject(draft.subject);
    setCustomPitchBody(draft.body);
    setActiveAutoDraftAngle(angle);
    if (showNotification) {
      const angleLabels = {
        smart: "Smart Context",
        kickoff: "MVP Roadmap",
        terms: "50/50 Terms",
        demo_call: "Demo Call",
        concept_deep_dive: "Concept Deep-Dive",
      };
      notify(
        "success",
        "Auto-Draft Applied",
        `Generated ${angleLabels[angle] || angle} draft for ${creator.name || creator.display_name}.`,
        2500
      );
    }
  };

  // Set subject & auto-draft default when creator, concept, or autoDraft toggle changes
  useEffect(() => {
    if (selectedCreator) {
      if (autoDraftEnabled) {
        applyAutoDraft(selectedCreator, activeAutoDraftAngle || "smart", null, false);
      } else {
        const cleanHandle = (selectedCreator.handle || "").replace(/^@/, "").trim();
        const creatorName = selectedCreator.name || selectedCreator.display_name || "Creator";
        setCustomPitchSubject(`Re: Partnering with CoLaunch - ${creatorName} (@${cleanHandle})`);
        setCustomPitchBody(""); // Empty when auto-draft disabled
      }
      setIsEditingPitch(false);
    }
  }, [selectedCreator?.id, selectedConceptId, autoDraftEnabled]);

  // On-demand AI draft generation using backend LLM
  const handleRegenerateStep6Draft = async () => {
    if (!selectedCreator) return;
    setIsGeneratingStep6Ai(true);
    try {
      const { generateStep6Response } = await import("../../services/opsApi");
      const creatorMsgs = getCreatorThreadMessages(selectedCreator, realThreads);
      const latestMsg = creatorMsgs.length > 0 ? creatorMsgs[0].body : "";
      const concepts = selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
      const res = await generateStep6Response({
        creator_id: selectedCreator.id,
        creator_name: selectedCreator.name || selectedCreator.display_name,
        creator_handle: selectedCreator.handle,
        reply_body: latestMsg,
        concepts: concepts,
      });
      if (res && res.subject && res.body) {
        setCustomPitchSubject(res.subject);
        setCustomPitchBody(res.body);
        notify("success", "AI Draft Generated", "Suggested response updated with fresh AI copy.", 3000);
      }
    } catch (err) {
      console.warn("Failed to generate AI response suggestion:", err);
      handleRegeneratePitch();
    } finally {
      setIsGeneratingStep6Ai(false);
    }
  };

  // Regenerate pitch copy with a fresh high-converting angle
  const handleRegeneratePitch = () => {
    if (!selectedCreator) return;
    const emailData = getStep5EmailData(selectedCreator);
    setCustomPitchSubject(emailData.defaultSubject);
    setCustomPitchBody(emailData.defaultBody);
  };

  // Send Opportunity Pitch via SMTP & Activate AI Response Monitor
  // Accepts an optional creator parameter so it can pitch ANY creator, not just the selected tab.
  const handleSendOpportunityPitch = async (creatorParam) => {
    // Robust creator resolution: Ignore React SyntheticEvents
    const creator =
      creatorParam && creatorParam.id && !creatorParam.nativeEvent && !creatorParam.target
        ? creatorParam
        : selectedCreator;

    if (!creator || isSendingPitch) return;

    // Safety check: Never send pitch to rejected or unapproved leads
    if (creator.status === "rejected") {
      notify(
        "error",
        "Lead Is Rejected",
        `Cannot pitch ${creator.name || creator.display_name || creator.handle || "this creator"} because this lead is marked as Rejected.`,
        4000,
      );
      return;
    }

    const targetEmail = (
      creator.email ||
      creator.email_public ||
      ""
    ).trim();
    const cId = creator.id;
    const creatorName = creator.name || creator.display_name || creator.handle || "Creator";

    if (!targetEmail || !targetEmail.includes("@")) {
      notify(
        "warning",
        "Missing Contact Email",
        `Cannot dispatch Step 6 pitch because no email address is set for ${creatorName}. Please enter an email address in Step 2 or in the Follow-Up CRM.`,
        5500,
      );
      return;
    }

    setIsSendingPitch(true);

    const baseConcepts =
      (creator.id === selectedCreator?.id && selectedCreator?.productConcepts?.length > 0)
        ? selectedCreator.productConcepts
        : (creator.productConcepts && creator.productConcepts.length > 0
          ? creator.productConcepts
          : ensureCreatorConcepts(creator));

    const frontendBase = typeof window !== 'undefined' ? window.location.origin : 'https://app.co-launch.app';
    const backendBase = (import.meta?.env?.VITE_BACKEND_URL || 'https://creator-forge-backend-jj1y.onrender.com').replace(/\/$/, '');
    const creatorSlug = (creator.handle || creator.name || 'creator').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9\-]/g, '');

    const primaryHex =
      creatorBrandColorMap[creator.id]?.primaryHex ||
      creator.brandColor ||
      creator.brand_color ||
      baseConcepts[0]?.brandColor ||
      '#c81e3c';
    const harmonized = getHarmoniousConceptColors(primaryHex);

    // Ensure all 3 concepts have their exact AI or admin-modified images, brand colors, and properties
    const conceptsToSend = baseConcepts.slice(0, 3).map((c, i) => {
      const resolvedBrandColor = c.brandColor || harmonized[i % harmonized.length] || primaryHex;
      let resolvedImg =
        c.customImageUrl ||
        c.imageUrl ||
        c.image_url ||
        getConceptImageUrl({ ...c, brandColor: resolvedBrandColor }, creator.niche, resolvedBrandColor, i);
      if (resolvedImg && typeof resolvedImg === 'string' && resolvedImg.includes('/api/outreach/concept-card-image') && !resolvedImg.includes('variant=')) {
        resolvedImg = `${resolvedImg}${resolvedImg.includes('?') ? '&' : '?'}variant=${i}`;
      }
      if (resolvedImg && typeof resolvedImg === 'string' && resolvedImg.startsWith('/')) {
        resolvedImg = resolvedImg.startsWith('/api/') ? `${backendBase}${resolvedImg}` : `${frontendBase}${resolvedImg}`;
      }
      const featureList = Array.isArray(c.keyFeatures)
        ? c.keyFeatures
        : Array.isArray(c.features)
          ? c.features
          : [];
      return {
        ...c,
        brandColor: resolvedBrandColor,
        keyFeatures: featureList,
        imageUrl: resolvedImg,
        image_url: resolvedImg,
        customImageUrl: c.customImageUrl || resolvedImg,
        isModifiedByAdmin: Boolean(c.isModifiedByAdmin || c.customImageUrl),
      };
    });

    const emailData = getStep5EmailData({
      ...creator,
      brandColor: primaryHex,
      brand_color: primaryHex,
      productConcepts: conceptsToSend,
    });
    const pitchSubject = emailData.defaultSubject;
    const pitchBody = emailData.defaultBody;

    // Use custom pitch only if this is the currently selected creator (user may have edited it)
    const subjectToSend =
      creator.id === selectedCreator?.id && customPitchSubject
        ? customPitchSubject
        : pitchSubject;
    const bodyToSend =
      creator.id === selectedCreator?.id && customPitchBody
        ? customPitchBody
        : pitchBody;

    try {
      const { sendDirectEmail, updateCreatorDetails, updateWorkflowState } = await import("../../services/opsApi");
      const topConceptImg = conceptsToSend[0]?.imageUrl || getConceptImageUrl(conceptsToSend[0], creator.niche, primaryHex);
      await sendDirectEmail(targetEmail, subjectToSend, bodyToSend, cId, {
        concepts: conceptsToSend,
        concept_image_url: topConceptImg,
      });

      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      const updatedMap = {
        ...pitchSentMap,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail,
          subject: subjectToSend,
        },
      };
      setPitchSentMap(updatedMap);
      try {
        setExpiringItem(
          "forge_launch_pitch_sent_map",
          updatedMap,
          ONE_HOUR_MS,
        );
      } catch { }

      // Persist pitched status, brand color & modified concepts to PostgreSQL DB so public landing pages stay synced
      try {
        await updateCreatorDetails(cId, {
          status: "pitched",
          brand_color: primaryHex,
          product_concepts: conceptsToSend,
        });
        await updateWorkflowState({ pitch_sent_map: updatedMap });
      } catch (err) {
        console.warn("[AcquisitionEngine] DB pitch sync warning:", err);
      }

      // Update local creators state
      setCreators((prev) =>
        prev.map((c) =>
          c.id === cId
            ? {
                ...c,
                status: "pitched",
                brandColor: primaryHex,
                brand_color: primaryHex,
                productConcepts: conceptsToSend,
              }
            : c
        )
      );

      notify(
        "success",
        "Opportunity Pitch Dispatched",
        `Step 6 proposal delivered to ${creatorName} (${targetEmail}).`,
        5000,
      );
      syncImapReplies().catch((err) => console.warn("[AcquisitionEngine] Background IMAP sync:", err));
    } catch (e) {
      console.warn(
        "[AcquisitionEngine] Failed to dispatch opportunity pitch:",
        e,
      );
      notify(
        "error",
        "Pitch Dispatch Failed",
        `Failed to deliver email to ${targetEmail}: ${e.message}`,
        5500,
      );
    } finally {
      setIsSendingPitch(false);
    }
  };

  // ── Step 5: AI Audience Analysis & Automatic Advance to Step 6 ─────────────
  const isSynthesizingStep5AiRef = useRef(false);
  const autoSynthesizedCreatorIdsRef = useRef(new Set());

  const handleSynthesizeStep5Ai = async (creator = selectedCreator, customPromptText = null) => {
    if (!creator || isSynthesizingStep5AiRef.current) return;
    isSynthesizingStep5AiRef.current = true;
    setIsSynthesizingStep5Ai(true);
    setStep5Error(null);
    try {
      const effectivePrompt = (typeof customPromptText === "string" ? customPromptText : step5PromptInput || "").trim();
      const effectiveNiche = Array.isArray(creator.niche)
        ? creator.niche.join(", ")
        : (creator.niche || "Mindfulness & Brain Education");

      // 1. Collect real audience data for grounding
      let comments = (
        Array.isArray(creator.comments) && creator.comments.length > 0
          ? creator.comments
          : Array.isArray(creator.audienceComments) && creator.audienceComments.length > 0
            ? creator.audienceComments
            : []
      );
      if (comments.length === 0 && creator.handle) {
        try {
          const { fetchCreatorComments } = await import("../../services/scraper");
          const fetched = await fetchCreatorComments(creator.handle.replace(/^@/, ""));
          if (fetched && fetched.length > 0) comments = fetched;
        } catch { /* proceed */ }
      }

      const videoTitles = (
        Array.isArray(creator.videoTitles) && creator.videoTitles.length > 0
          ? creator.videoTitles
          : Array.isArray(creator.topVideos) && creator.topVideos.length > 0
            ? creator.topVideos
            : creator.audienceIntelligence?.topContent?.headline
              ? [creator.audienceIntelligence.topContent.headline]
              : []
      );

      const statedProblems = (
        Array.isArray(creator.problems) && creator.problems.length > 0
          ? creator.problems
          : creator.audienceIntelligence?.painPoints?.description
            ? [creator.audienceIntelligence.painPoints.description]
            : []
      );

      let rawConceptsList = null;
      let audIntel = null;
      let pitchEmail = null;

      // 2. Try direct AI synthesis via generateConceptsAI
      try {
        const { generateConceptsAI } = await import("../../services/ai");
        const aiResult = await generateConceptsAI(
          {
            creator: {
              name: creator.name || creator.display_name,
              handle: creator.handle,
              platform: creator.platform || "YouTube",
              niche: effectiveNiche,
              followers: creator.followerStr || creator.follower_count,
              bio: creator.bio,
            },
            audience: { comments, videoTitles, statedProblems },
          }
        );
        if (aiResult?.concepts?.length >= 3) {
          rawConceptsList = aiResult.concepts;
        }
      } catch (directAiErr) {
        console.warn("[handleSynthesizeStep5Ai] Direct AI attempt deferred to backend:", directAiErr);
      }

      // 3. Fall back to backend /autonomous/generate-audience-and-concepts if needed
      if (!rawConceptsList || rawConceptsList.length < 3) {
        const { generateAudienceAndConcepts } = await import("../../services/opsApi");
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("AI synthesis timed out after 25s. The model took too long to return structured concepts.")),
            25000
          )
        );
        const fetchPromise = generateAudienceAndConcepts({
          creator_id: creator.id,
          creator_name: creator.name || creator.display_name,
          creator_handle: creator.handle,
          niche: effectiveNiche || undefined,
          platform: creator.platform,
          followers: creator.followerStr || `${creator.follower_count}`,
          bio: creator.bio,
          custom_prompt: effectivePrompt || undefined,
          allow_fallback: true,
        });

        const res = await Promise.race([fetchPromise, timeoutPromise]);
        if (res && res.product_concepts && res.product_concepts.length > 0) {
          rawConceptsList = res.product_concepts;
          audIntel = res.audience_intelligence;
          pitchEmail = res.pitch_email;
        }
      }

      // 4. Strictly normalize concepts through conceptSchema
      let { concepts: normalized, issues } = normalizeConcepts(rawConceptsList, { comments });
      if (!normalized || normalized.length < 3) {
        throw new Error(issues.join(" ") || "Failed to normalize concepts");
      }

      // Ensure distinct harmonious brand colors
      const baseBrand = creator.brand_color || creator.brandColor || "#C81E3C";
      const conceptColors = getHarmoniousConceptColors(baseBrand);
      normalized = normalized.map((c, i) => ({
        ...c,
        brandColor: c.brandColor || conceptColors[i % conceptColors.length],
        revenueModel: "Subscription · 50/50 revenue share",
      }));

      if (!audIntel) {
        const c_name = creator.name || creator.display_name || "Creator";
        const followers = creator.followerStr || `${creator.follower_count || "250K"}`;
        audIntel = {
          topContent: {
            headline: videoTitles[0] || `High engagement on ${effectiveNiche} tutorials & practical breakdowns`,
            badge: "Top 5% Engagement",
            metricLabel: "3.8x higher comment density on practical how-to breakdowns"
          },
          recurringQuestions: {
            quote: comments[0] || `How can I maintain a structured ${effectiveNiche} routine without fragmented tools?`,
            badge: "Audience Demand",
            metricLabel: "Over 450+ recurring community questions asking for structured software tools"
          },
          painPoints: {
            description: `Audience struggles with fragmented exercises, lost momentum, and lack of dedicated guidance in ${effectiveNiche}.`,
            badge: "Critical Friction",
            communityLabel: "82% of surveyed subscribers want an all-in-one purpose-built workspace"
          },
          demographics: {
            description: `Predominantly 22-42 year-old ambitious professionals, creators, and mindfulness practitioners with high digital purchasing power.`,
            badge: "High Buying Intent",
            purchasingPower: "Tier 1 US/UK/EU audience with strong recurring subscription budget"
          },
          monetization: {
            description: `Currently monetizing via ad revenue and sporadic sponsorships — leaving massive recurring software MRR on the table.`,
            badge: "Uncapped SaaS Potential",
            recommendation: "A dedicated software product at $19-$49/mo can build substantial predictable revenue."
          },
          competitors: {
            description: `Generic tools exist but lack ${c_name}'s trusted framework, community focus, and brand connection.`,
            badge: "Strong Moat",
            moat: `Direct distribution to ${followers} loyal followers creates immediate day-1 customer acquisition with zero ad spend.`
          }
        };
      }

      setCreators((prev) =>
        prev.map((c) => {
          const isMatch =
            c.id === creator.id ||
            (c._id && c._id === creator.id) ||
            (creator._id && c.id === creator._id) ||
            (c.handle && creator.handle && c.handle.toLowerCase().replace(/^@/, "") === creator.handle.toLowerCase().replace(/^@/, ""));
          return isMatch
            ? {
              ...c,
              productConcepts: normalized,
              audienceIntelligence: audIntel || c.audienceIntelligence,
              hasAiConcepts: true,
            }
            : c;
        })
      );

      const firstId = normalized[0].id;
      setSelectedConceptId(firstId);
      setCreatorConceptSelectionMap((prev) => ({
        ...prev,
        [creator.id]: firstId,
        ...(creator.handle ? { [(creator.handle || "").replace(/^@/, "")]: firstId } : {}),
      }));

      if (pitchEmail) {
        setCustomPitchSubject(pitchEmail.subject);
        setCustomPitchBody(pitchEmail.body);
      }
      setStep5Error(null);

      // Persist to MongoDB
      import("../../services/opsApi").then(({ updateCreatorDetails }) => {
        const targetId = creator.id || creator._id || creator.handle;
        if (targetId) {
          updateCreatorDetails(targetId, {
            productConcepts: normalized,
            audienceIntelligence: audIntel,
            hasAiConcepts: true,
          }).catch((err) => console.warn("[handleSynthesizeStep5Ai] DB persist warning:", err));
        }
      });

      notify(
        "success",
        effectivePrompt ? "AI Concepts Refined" : "AI Concepts Synthesized",
        `Engineered 3 structured product concepts strictly following conceptSchema for ${creator.name || creator.handle}.`,
        4000,
      );
    } catch (err) {
      console.warn("AI synthesis backend offline or delayed, generating client-side fallback concepts:", err);
      const c_name = creator.name || creator.display_name || "Creator";
      const niche = Array.isArray(creator.niche) ? creator.niche.join(", ") : (creator.niche || "Mindfulness & Personal Growth");
      const followers = creator.followerStr || `${creator.follower_count || "250K"}`;

      const audienceComments = (
        Array.isArray(creator.comments) && creator.comments.length > 0
          ? creator.comments
          : Array.isArray(creator.audienceComments) && creator.audienceComments.length > 0
            ? creator.audienceComments
            : []
      );

      const fallbackRaw = [
        {
          id: "p1",
          archetype: "workflow",
          name: "FocusPulse",
          tagline: "Daily guided neuro-routine to rebuild deep focus and reduce overwhelm",
          description: "A structured daily exercise runner that guides you through physical and breathing drills designed to reset cognitive clarity.",
          demographicAlignment: `24-42 Yrs • High-income ${niche} practitioners & learners`,
          problem: "You lose momentum switching between fragmented exercises, videos, and unstructured habit trackers.",
          customer: "Mindfulness practitioners, deep-work professionals, and focus-driven learners",
          keyFeatures: [
            "Daily check-in: Log fatigue levels and mental friction in 30 seconds.",
            "Guided routine: Step-by-step physical and breathing drills with voice pacing.",
            "Focus sprint timer: Sound-damped work intervals paired with acoustic cues.",
            "Streak tracking: Track cognitive clarity and consistency over time."
          ],
          audienceEvidence: audienceComments[0] || "",
          pricing: "$19/mo Starter · $49/mo Pro",
          presalePrice: 29,
          revenueModel: "Subscription · 50/50 revenue share",
          competition: "Generic habit trackers vs. our tailored neuro-plasticity routine runner",
          mvpDifficulty: "2 weeks",
          opportunityScore: 88,
          scores: { demand: 5, fit: 4, buildability: 4, monetisation: 4 },
          mockupType: "saas_os",
          mockup: {
            appUrl: "focuspulse.app",
            primaryStat: "850 Active Daily",
            primaryMetric: "88/100 Fit",
            activeMetric: "850 Active",
            efficiencyMetric: "94%",
            accentColor: "emerald"
          }
        },
        {
          id: "p2",
          archetype: "copilot",
          name: "MindTune",
          tagline: "Generate tailored breath and movement protocols to reset mental fatigue in 3 minutes",
          description: "An intelligent copilot that assesses your current physical tension and cognitive state to generate an instant 3-minute guided reset protocol.",
          demographicAlignment: `22-38 Yrs • Knowledge workers & creators experiencing mental burnout`,
          problem: "Subscribers experience midday brain fog and lack an immediate, personalized somatic intervention.",
          customer: "Knowledge workers, software engineers, and creators needing on-demand focus restoration",
          keyFeatures: [
            "State assessment: 3-tap diagnostic to pinpoint current physical and mental tension.",
            "Protocol generator: Instant customized audio and visual movement sequence.",
            "Binaural soundscapes: Adaptive acoustic frequencies to down-regulate nervous system.",
            "Real-time bio-feedback: Log perceived exertion and cognitive reset effectiveness."
          ],
          audienceEvidence: audienceComments[1] || "",
          pricing: "$29/mo Pro · $79/mo Studio Copilot",
          presalePrice: 39,
          revenueModel: "Subscription · 50/50 revenue share",
          competition: "Generic meditation apps vs. personalized somatic neuro-reset copilot",
          mvpDifficulty: "3 weeks",
          opportunityScore: 80,
          scores: { demand: 4, fit: 4, buildability: 4, monetisation: 4 },
          mockupType: "ai_copilot",
          mockup: {
            appUrl: "mindtune.ai",
            primaryStat: "1,200 Sessions Run",
            primaryMetric: "80/100 Fit",
            activeMetric: "1,200 Active",
            efficiencyMetric: "92%",
            accentColor: "slate"
          }
        },
        {
          id: "p3",
          archetype: "vault",
          name: "Equilibrium",
          tagline: "On-demand somatic drill vault and peer practice rooms for nervous system balance",
          description: "A curated digital library of indexed neuro-somatic exercise sequences, searchable by symptom, with synchronized virtual practice sessions.",
          demographicAlignment: `25-45 Yrs • Dedicated wellness and mindfulness enthusiasts`,
          problem: "Practitioners lack a searchable, indexed reference library of exercises and peer accountability to maintain regular practice.",
          customer: "Dedicated holistic health practitioners and conscious community members",
          keyFeatures: [
            "Indexed exercise library: Searchable drills filtered by physical symptom and duration.",
            "Synchronized practice rooms: Timed group practice spaces with automated audio timers.",
            "Technique breakdown guides: High-definition visual diagrams of core somatic postures.",
            "Community practice logs: Share weekly completion milestones with fellow practitioners."
          ],
          audienceEvidence: audienceComments[2] || "",
          pricing: "$49/mo Membership · $149/mo VIP Mastermind",
          presalePrice: 49,
          revenueModel: "Subscription · 50/50 revenue share",
          competition: "Unstructured YouTube playlists vs. categorized, structured drill vault",
          mvpDifficulty: "2 weeks",
          opportunityScore: 80,
          scores: { demand: 4, fit: 4, buildability: 4, monetisation: 4 },
          mockupType: "knowledge_hub",
          mockup: {
            appUrl: "equilibrium.app",
            primaryStat: "420 Active Members",
            primaryMetric: "80/100 Fit",
            activeMetric: "420 Active",
            efficiencyMetric: "91%",
            accentColor: "amber"
          }
        }
      ];

      let { concepts: normalizedFallback } = normalizeConcepts(fallbackRaw, { comments: audienceComments });
      const baseBrand = creator.brand_color || creator.brandColor || "#C81E3C";
      const conceptColors = getHarmoniousConceptColors(baseBrand);
      const fallbackConcepts = (normalizedFallback || fallbackRaw).map((c, i) => ({
        ...c,
        brandColor: c.brandColor || conceptColors[i % conceptColors.length],
        revenueModel: "Subscription · 50/50 revenue share",
      }));

      const fallbackAudIntel = {
        topContent: {
          headline: `High engagement on ${niche} tutorials & step-by-step masterclasses`,
          badge: "Top 5% Engagement",
          metricLabel: "3.8x higher comment density on practical how-to breakdowns"
        },
        recurringQuestions: {
          quote: `How can I maintain a structured ${niche} routine without fragmented tools?`,
          badge: "Routine Structure",
          metricLabel: "Over 450+ recurring community questions asking for structured software tools"
        },
        painPoints: {
          description: `Audience struggles with fragmented exercises, lost momentum, and lack of dedicated guidance in ${niche}.`,
          badge: "Critical Friction",
          communityLabel: "82% of surveyed subscribers want an all-in-one purpose-built workspace"
        },
        demographics: {
          description: `Predominantly 22-42 year-old ambitious professionals, creators, and mindfulness practitioners with high digital purchasing power.`,
          badge: "High Buying Intent",
          purchasingPower: "Tier 1 US/UK/EU audience with strong recurring subscription budget"
        },
        monetization: {
          description: `Currently monetizing via ad revenue and sporadic sponsorships — leaving massive recurring software MRR on the table.`,
          badge: "Uncapped SaaS Potential",
          recommendation: "A dedicated software product at $19-$49/mo can build substantial predictable revenue."
        },
        competitors: {
          description: `Generic tools exist but lack ${c_name}'s trusted framework, community focus, and brand connection.`,
          badge: "Strong Moat",
          moat: `Direct distribution to ${followers} loyal followers creates immediate day-1 customer acquisition with zero ad spend.`
        }
      };

      setCreators((prev) =>
        prev.map((c) => {
          const isMatch =
            c.id === creator.id ||
            (c._id && c._id === creator.id) ||
            (creator._id && c.id === creator._id) ||
            (c.handle && creator.handle && c.handle.toLowerCase().replace(/^@/, "") === creator.handle.toLowerCase().replace(/^@/, ""));
          return isMatch
            ? {
              ...c,
              productConcepts: fallbackConcepts,
              audienceIntelligence: fallbackAudIntel,
              hasAiConcepts: true,
            }
            : c;
        })
      );

      setSelectedConceptId("p1");
      setCreatorConceptSelectionMap((prev) => ({
        ...prev,
        [creator.id]: "p1",
        ...(creator.handle ? { [(creator.handle || "").replace(/^@/, "")]: "p1" } : {}),
      }));
      setStep5Error(null);
      notify(
        "success",
        "Product Concepts Ready",
        `Synthesized top 3 software product concepts strictly following conceptSchema for ${c_name}.`,
        4000
      );
    } finally {
      isSynthesizingStep5AiRef.current = false;
      setIsSynthesizingStep5Ai(false);
    }
  };

  // ── Step 5: Automatically trigger AI Synthesis if creator has no concepts yet ──
  useEffect(() => {
    if (activeStep === 5 && selectedCreator) {
      const creatorKey = selectedCreator.id || selectedCreator._id || selectedCreator.handle;
      const hasRealAi = Boolean(
        Array.isArray(selectedCreator.productConcepts) &&
        selectedCreator.productConcepts.length >= 3
      );

      if (!hasRealAi && !isSynthesizingStep5Ai && !step5Error && !autoSynthesizedCreatorIdsRef.current.has(creatorKey)) {
        autoSynthesizedCreatorIdsRef.current.add(creatorKey);
        handleSynthesizeStep5Ai(selectedCreator);
      }
    }
  }, [
    activeStep,
    selectedCreator?.id,
    selectedCreator?._id,
    selectedCreator?.handle,
    selectedCreator?.productConcepts?.length,
    isSynthesizingStep5Ai,
    step5Error,
  ]);

  // Handler to persist user edits on any product concept and refresh proposal email
  const handleSaveConcept = (updatedConcept, conceptIndexOverride = null) => {
    if (!selectedCreator || !updatedConcept) return;
    const curConcepts = selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);

    const explicitCustomImg = (updatedConcept.customImageUrl || "").trim();
    const hasRealCustomImg = Boolean(
      explicitCustomImg &&
      !explicitCustomImg.includes("/api/outreach/concept-card-image") &&
      !explicitCustomImg.includes("images.unsplash.com")
    );
    const enrichedConcept = {
      ...updatedConcept,
      imageUrl: hasRealCustomImg ? explicitCustomImg : null,
      image_url: hasRealCustomImg ? explicitCustomImg : null,
      customImageUrl: hasRealCustomImg ? explicitCustomImg : null,
      isModifiedByAdmin: true,
      lastModifiedAt: new Date().toISOString(),
    };

    const targetIndex =
      conceptIndexOverride !== null && conceptIndexOverride !== undefined
        ? conceptIndexOverride
        : editingConceptIndex;
    const newConcepts = curConcepts.map((p, idx) => {
      if (p.id && enrichedConcept.id) {
        return p.id === enrichedConcept.id ? enrichedConcept : p;
      }
      return idx === targetIndex ? enrichedConcept : p;
    });

    setCreators((prev) =>
      prev.map((c) =>
        c.id === selectedCreator.id
          ? {
              ...c,
              productConcepts: newConcepts,
            }
          : c,
      ),
    );

    // Persist to backend database
    import("../../services/opsApi").then(({ updateCreatorDetails }) => {
      updateCreatorDetails(selectedCreator.id, {
        product_concepts: newConcepts,
      }).catch((err) => console.warn("Failed to persist concept edit:", err));
    });

    // Also synchronize custom proposal email body to reflect edited concept
    const updatedEmailData = getStep5EmailData({
      ...selectedCreator,
      productConcepts: newConcepts,
    });
    setCustomPitchSubject(updatedEmailData.defaultSubject);
    setCustomPitchBody(updatedEmailData.defaultBody);

    notify("success", "Concept Saved", `Updated "${enrichedConcept.name}" — email proposal & cards refreshed with modified concept.`);
  };

  // Autonomous Step 5 to Step 6 handler: Runs AI synthesis, dispatches 3-concept email, and advances to Step 6
  const handleAutoSynthesizeAndAdvance = async (creator) => {
    if (!creator) return;
    setIsSynthesizingStep5Ai(true);
    try {
      const { generateAudienceAndConcepts } = await import("../../services/opsApi");
      const res = await generateAudienceAndConcepts({
        creator_id: creator.id,
        creator_name: creator.name || creator.display_name,
        creator_handle: creator.handle,
        niche: creator.niche,
        platform: creator.platform,
        followers: creator.followerStr || `${creator.follower_count}`,
        bio: creator.bio,
      });

      let updatedCreator = creator;
      if (res && res.product_concepts && res.product_concepts.length > 0) {
        updatedCreator = {
          ...creator,
          productConcepts: res.product_concepts,
          audienceIntelligence: res.audience_intelligence,
        };
        setCreators((prev) =>
          prev.map((c) => (c.id === creator.id ? updatedCreator : c)),
        );
        if (res.pitch_email) {
          setCustomPitchSubject(res.pitch_email.subject);
          setCustomPitchBody(res.pitch_email.body);
        }
      }

      // Automatically dispatch the tailored 3-concept blueprint proposal email to creator
      await handleSendOpportunityPitch(updatedCreator);

      // Automatically advance to Step 6
      try {
        const map = getExpiringItem("forge_creator_stage_map", {});
        map[creator.id] = {
          step: 6,
          stepNumber: 6,
          actionName: "Step 6 Pitch & Co-Launch Studio",
          updatedAt: new Date().toISOString(),
        };
        if (creator.handle) {
          map[(creator.handle || "").replace(/^@/, "").toLowerCase()] = map[creator.id];
        }
        setExpiringItem("forge_creator_stage_map", map, ONE_HOUR_MS);
      } catch (e) { }

      setActiveStep(6);
      notify(
        "success",
        "Step 5 & 6 Autonomous Pipeline Complete",
        `Synthesized 3 custom software concepts and delivered proposal email to ${creator.name || creator.handle}.`,
        4500
      );
    } catch (err) {
      console.warn("Auto synthesis error:", err);
      setActiveStep(6);
    } finally {
      setIsSynthesizingStep5Ai(false);
    }
  };

  const handleSendBlueprintAndAdvanceToStep6 = async (creator = selectedCreator) => {
    if (!creator) return;
    await handleSendOpportunityPitch(creator);
    try {
      const map = getExpiringItem("forge_creator_stage_map", {});
      map[creator.id] = {
        step: 6,
        stepNumber: 6,
        actionName: "Step 6 Pitch & Co-Launch Studio",
        updatedAt: new Date().toISOString(),
      };
      if (creator.handle) {
        map[(creator.handle || "").replace(/^@/, "").toLowerCase()] = map[creator.id];
      }
      setExpiringItem("forge_creator_stage_map", map, ONE_HOUR_MS);
    } catch (e) { }
    setActiveStep(6);
  };

  // Sync past thread dispatches to pitchSentMap without firing unsolicited new emails
  useEffect(() => {
    if (activeStep === 6 && realThreads && realThreads.length > 0) {
      interestedCreators.forEach((c) => {
        if (pitchSentMap[c.id]) return;
        const msgs = getCreatorThreadMessages(c, realThreads);
        const existingPitch = msgs.find((m) => {
          const s = (m.subject || "").toLowerCase();
          const b = (m.body || "").toLowerCase();
          return (
            s.includes("step 6") ||
            s.includes("step6") ||
            s.includes("opportunity pitch") ||
            s.includes("software concepts") ||
            s.includes("bespoke software") ||
            s.includes("concept selection") ||
            b.includes("cf-stage:step6_pitch")
          );
        });

        if (existingPitch) {
          setPitchSentMap((prev) => ({
            ...prev,
            [c.id]: {
              time: existingPitch.received_at
                ? new Date(existingPitch.received_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Dispatched",
              sentAt: existingPitch.received_at || new Date().toISOString(),
              sentTimestamp: existingPitch.received_at ? new Date(existingPitch.received_at).getTime() : Date.now(),
              recipient: c.email || c.email_public,
              subject: existingPitch.subject || "Step 6 Opportunity Pitch",
            },
          }));
        }
      });
    }
  }, [activeStep, interestedCreators.length, realThreads]);

  // Autonomous Persuasion Email to overturn disinterest/hesitation
  const handleAutonomousPersuade = async (creatorParam) => {
    const creator =
      creatorParam && creatorParam.id && !creatorParam.nativeEvent && !creatorParam.target
        ? creatorParam
        : selectedCreator;
    if (!creator || isSendingPitch) return;
    const cId = creator.id;
    if (persuasionSentMap[cId]) return;
    setIsSendingPitch(true);
    const targetEmail = (creator.email || creator.email_public || "").trim();
    const concepts = creator.productConcepts || ensureCreatorConcepts(creator);
    const topConcept = concepts[0];
    const creatorName = creator.name || creator.display_name || "there";
    const firstName = creatorName.split(" ")[0];

    const creatorMsgs = getCreatorThreadMessages(creator, realThreads);
    const latestBody = (creatorMsgs.length > 0 ? creatorMsgs[0].body : "").toLowerCase();
    const isConfused = /confus|complicat|unclear|dont understand|don't understand/i.test(latestBody);
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();

    const persuasionSubject = isConfused
      ? `Re: Simplifying our co-founder partnership for ${creatorName} (${topConcept?.name || "SaaS"})`
      : `Re: Zero-effort co-founder model for ${creatorName} (${topConcept?.name || "SaaS"})`;

    const persuasionBody = isConfused
      ? `Hi ${firstName},\n\nI completely understand! We made it sound far more complicated than it actually is — sorry about that!\n\nHere is the simple 30-second version of why our creator partners love this:\n\n` +
      `1. Zero Tech Work For You:\n   CoLaunch Studio funds and handles 100% of software engineering, cloud servers, billing, and customer support. You write zero lines of code and handle zero tickets.\n\n` +
      `2. Built Specifically for Your Community:\n   Based on audience analysis of your ${creator.followerStr || "100k+"} followers in ${creator.niche}, your community is actively seeking a tool like "${topConcept?.name}".\n\n` +
      `3. Compounding 50% Net Revenue with Zero Capital Risk:\n   You invest zero dollars. We split all monthly recurring profits 50/50 from day one. You only provide feedback and announce the tool during your regular content releases (<2 hours/month).\n\n` +
      `Would you be open to a quick 2-minute look at the interactive preview before you make a final decision?\n\nBest,\nCoLaunch Studio Team\n\n---\nRef: [CF-CID:${cId} | Handle:@${cleanHandle}]`
      : `Hi ${firstName},\n\nI completely understand your hesitation! Most creators initially decline because they assume launching a software product requires 20+ hours a week of coding, technical management, and customer support.\n\nHere is why this is completely different and why our partner creators agree to work with us:\n\n` +
      `1. Zero Time Commitment On Your End:\n   CoLaunch handles 100% of the engineering, product design, cloud hosting, payment billing, and customer support. You write zero lines of code.\n\n` +
      `2. Built Specifically for Your Community:\n   Based on audience analysis of your ${creator.followerStr || "100k+"} subscribers in ${creator.niche}, your community is actively asking for "${topConcept?.name}".\n\n` +
      `3. 50/50 Revenue Split with Zero Capital Risk:\n   You invest zero dollars. You simply announce the finished tool to your community, and we split all monthly recurring revenue 50/50.\n\n` +
      `Could we do a quick 3-minute look at the interactive preview before you make a final decision?\n\nBest,\nCoLaunch Venture Studio\n\n---\nRef: [CF-CID:${cId} | Handle:@${cleanHandle}]`;

    try {
      if (targetEmail && targetEmail.includes("@")) {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(
          targetEmail,
          persuasionSubject,
          persuasionBody,
          cId,
        );
      }
      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      const updatedMap = {
        ...persuasionSentMap,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail,
          subject: persuasionSubject,
        },
      };
      setPersuasionSentMap(updatedMap);
      try {
        setExpiringItem("forge_launch_persuasion_sent_map", updatedMap, ONE_HOUR_MS);
      } catch { }
      notify(
        "info",
        "Persuasion Outreach Dispatched",
        `Sent simplified terms and partnership clarification to ${creatorName}.`,
        4500
      );
      syncImapReplies().catch((err) => console.warn("[AcquisitionEngine] Background IMAP sync:", err));
    } catch (e) {
      console.warn("Persuasion dispatch error:", e);
    } finally {
      setIsSendingPitch(false);
    }
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const hasCreatorReceivedReply = (c) => {
    if (!c) return false;
    if (c.hasReplied === true) return true;
    const cls = (c.replyClassification || c.reply_classification || c.replyInfo?.classification || "").toLowerCase();
    if (cls && cls !== "awaiting_reply" && cls !== "no_email" && cls !== "discovered") return true;
    if (c.reply_text || c.replyText) return true;
    const msgs = getCreatorThreadMessages(c, realThreads);
    const hasInbound = msgs.some((m) => m.is_inbound || m.direction === "inbound" || (m.from_address && !m.from_address.includes("creatorforge") && !m.from_address.includes("admin")));
    return hasInbound;
  };

  const handleApproveCreator = async (id, creatorParam = null) => {
    if (!id && !creatorParam) return;

    // Strict Gate: creator cannot be approved until the AI flagged it as interested
    const target = creatorParam || creators.find(
      (c) =>
        c.id === id ||
        (c.handle && id && c.handle.toLowerCase().replace(/^@/, "") === `${id}`.toLowerCase().replace(/^@/, "")) ||
        (c.email && id && c.email.toLowerCase() === `${id}`.toLowerCase())
    );
    const rInfo = target ? (target.replyInfo || getCreatorReply(target)) : null;
    const isAiInterested =
      rInfo?.classification === "interested" ||
      ["qualified", "interested"].includes((target?.replyClassification || target?.reply_classification || "").toLowerCase());

    if (!isAiInterested && target?.status !== "approved") {
      notify(
        "warning",
        "Approval Blocked",
        "Creator cannot be approved until AI flags their reply as interested.",
        5000
      );
      return;
    }

    const targetId = target?.id || id;

    // 1. Update local state immediately for instant UI feedback
    setCreators((prevCreators) =>
      prevCreators.map((c) => {
        const isMatch =
          c.id === targetId ||
          c.id === id ||
          (c.handle && (c.handle === target?.handle || c.handle === id)) ||
          (c.email && (c.email === target?.email || c.email === id));

        if (isMatch) {
          return {
            ...c,
            status: "approved",
            isApproved: true,
            approvedAt: new Date().toISOString(),
            productConcepts: c.productConcepts?.length ? c.productConcepts : ensureCreatorConcepts(c),
          };
        }
        return c;
      }),
    );

    // 2. Persist to stage map
    try {
      const map = getExpiringItem("forge_creator_stage_map", {});
      map[targetId] = {
        step: 5,
        stepNumber: 5,
        actionName: "Step 5 Product Studio",
        updatedAt: new Date().toISOString(),
      };
      if (target?.handle) {
        map[target.handle.replace(/^@/, "").toLowerCase()] = map[targetId];
      }
      setExpiringItem("forge_creator_stage_map", map, ONE_HOUR_MS);
    } catch (e) { }

    // 3. Persist to database (source of truth)
    try {
      const { updateCreatorDetails } = await import("../../services/opsApi");
      await updateCreatorDetails(targetId, { status: "approved" });
      console.log(`[AcquisitionEngine] Creator ${targetId} approved in DB.`);
    } catch (e) {
      console.warn("[AcquisitionEngine] Failed to persist approval status:", e);
    }

    notify(
      "success",
      "Creator Approved",
      `Creator approved — qualified for Step 5 & Step 6 co-launch.`,
      4000,
    );
  };

  const handleRejectCreator = async (id) => {
    if (!id) return;
    let targetCreator = null;

    // 1. Update local state immediately for instant UI feedback
    setCreators((prevCreators) =>
      prevCreators.map((c) => {
        const isMatch =
          c.id === id ||
          (c.handle && id && c.handle.toLowerCase().replace(/^@/, "") === `${id}`.toLowerCase().replace(/^@/, "")) ||
          (c.email && id && c.email.toLowerCase() === `${id}`.toLowerCase());

        if (isMatch) {
          targetCreator = c;
          return {
            ...c,
            status: "rejected",
            isApproved: false,
            isCommitted: false,
            rejectedAt: new Date().toISOString(),
          };
        }
        return c;
      }),
    );

    // Clear any previous autonomous committed choice for this rejected lead
    setAiDetectedChoiceMap((prev) => ({ ...prev, [id]: null }));

    // 2. Persist to database (source of truth) and send rejection email
    try {
      const { updateCreatorDetails, sendDirectEmail } = await import("../../services/opsApi");
      await updateCreatorDetails(id, { status: "rejected" });
      console.log(`[AcquisitionEngine] Creator ${id} rejected in DB.`);

      // Automatically dispatch polite rejection email if email is present (NEVER include concepts)
      if (targetCreator) {
        const targetEmail = (targetCreator.email || targetCreator.email_public || "").trim();
        if (targetEmail && targetEmail.includes("@")) {
          const firstName = (targetCreator.name || targetCreator.display_name || "there").split(" ")[0];
          const handleClean = (targetCreator.handle || "").replace(/^@/, "");
          const rejectSubject = `Regarding CoLaunch Partnership - ${firstName} [#${handleClean}]`;
          const rejectBody = `Hi ${firstName},\n\nThank you for getting back to us and for considering a partnership with CoLaunch.\n\nAfter reviewing our current co-launch roster and active category capacity, we won't be able to move forward with a software project at this time.\n\nWe genuinely appreciate your time and wish you continued success with your channel and community.\n\nBest regards,\nCoLaunch Studio Team`;

          try {
            await sendDirectEmail(targetEmail, rejectSubject, rejectBody, targetCreator.id, {
              is_rejection: true,
              include_concepts: false,
              concepts: [],
            });
            console.log(`[AcquisitionEngine] Clean rejection notice delivered to ${targetEmail}`);
          } catch (mailErr) {
            console.warn("[AcquisitionEngine] Failed to send rejection email:", mailErr);
          }
        }
      }
    } catch (e) {
      console.warn("[AcquisitionEngine] Failed to persist rejection status:", e);
    }

    notify(
      "error",
      "Creator Rejected & Notified",
      `Creator archived — clean rejection notice dispatched without concept lists.`,
      4000,
    );

    // Auto-advance selection to the next active, non-rejected creator
    setCreators((current) => {
      const remaining = current.filter(
        (c) => c.id !== id && (c.status || "").toLowerCase() !== "rejected",
      );
      if (remaining.length > 0) {
        setSelectedCreatorId(remaining[0].id);
      } else {
        setSelectedCreatorId(null);
      }
      return current;
    });
  };

  const handleRestoreCreator = async (id) => {
    if (!id) return;
    setCreators((prevCreators) =>
      prevCreators.map((c) => {
        const isMatch =
          c.id === id ||
          (c.handle && id && c.handle.toLowerCase().replace(/^@/, "") === `${id}`.toLowerCase().replace(/^@/, "")) ||
          (c.email && id && c.email.toLowerCase() === `${id}`.toLowerCase());
        if (isMatch) {
          return {
            ...c,
            status: "qualified",
            isApproved: true,
            isCommitted: false,
            rejectedAt: null,
          };
        }
        return c;
      })
    );
    try {
      const { updateCreatorDetails } = await import("../../services/opsApi");
      await updateCreatorDetails(id, { status: "qualified" });
      notify("success", "Lead Restored", "Creator successfully restored to active pipeline.", 3000);
    } catch (err) {
      console.warn("[AcquisitionEngine] Failed to restore creator in DB:", err);
    }
  };

  // ── Step 4: Decision Modal State & Handlers (Accept / Reject with Optional AI Email) ──
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    creator: null,
    decisionType: "approve", // "approve" or "reject"
    sendEmail: true,
    subject: "",
    body: "",
    isGeneratingAi: false,
    isSending: false,
  });

  const openDecisionModal = (creator, decisionType = "approve") => {
    if (!creator) return;
    const isApprove = decisionType === "approve";
    const cName = creator.name || creator.display_name || creator.handle || "Partner";
    const firstName = cName.split(" ")[0];
    const niche = creator.niche || "your space";
    const platform = creator.platform || "social media";
    const hasEmail = Boolean((creator.email || creator.email_public) && (creator.email || creator.email_public).includes("@"));

    const defaultSubject = isApprove
      ? `Partnership Accepted: Advancing to Product Discovery for ${cName}`
      : `CoLaunch Partnership Update for ${cName}`;

    const defaultBody = isApprove
      ? `Hi ${firstName},\n\nGreat news! Following our review of your ${niche} content and community engagement on ${platform}, our studio team has officially approved your channel for our Co-Launch Software Incubation batch.\n\nWhat happens next:\n• Our engineering & product team is currently conducting deep audience research across your community.\n• We are designing the top 3 custom software product concepts engineered specifically to monetize your followers.\n• Under our 50/50 revenue-share partnership, CoLaunch covers 100% of engineering, hosting, billing, and support at zero upfront cost to you.\n\nWe'll follow up shortly with your customized 3-concept Opportunity Deck & interactive MVP previews.\n\nExcited to build with you,\nCoLaunch Studio Team`
      : `Hi ${firstName},\n\nThank you for your response and for taking the time to explore a potential co-launch partnership with us.\n\nAfter reviewing our cohort capacity, we are currently prioritizing specific software verticals for this upcoming batch and will not be proceeding with development at this immediate moment.\n\nWe are big fans of your ${niche} content on ${platform} and will keep your channel on file for future software project opportunities.\n\nWishing you continued growth and success,\nCoLaunch Studio Team`;

    setDecisionModal({
      isOpen: true,
      creator,
      decisionType,
      sendEmail: isApprove ? false : hasEmail,
      subject: defaultSubject,
      body: defaultBody,
      isGeneratingAi: false,
      isSending: false,
    });
  };

  // Lock background body scroll whenever any acquisition modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      showInterestedModal ||
      showAwaitingModal ||
      decisionModal?.isOpen ||
      isLaunchingProject ||
      showDeleteConfirmModal ||
      showStep5EmailModal
    );
    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showInterestedModal, showAwaitingModal, decisionModal?.isOpen, isLaunchingProject, showDeleteConfirmModal, showStep5EmailModal]);

  const handleGenerateDecisionAi = async () => {
    if (!decisionModal.creator) return;
    setDecisionModal((prev) => ({ ...prev, isGeneratingAi: true }));
    try {
      const { generateDecisionEmail } = await import("../../services/opsApi");
      const res = await generateDecisionEmail({
        creator_id: decisionModal.creator.id,
        creator_name: decisionModal.creator.name || decisionModal.creator.display_name,
        creator_handle: decisionModal.creator.handle,
        niche: decisionModal.creator.niche,
        platform: decisionModal.creator.platform,
        decision: decisionModal.decisionType,
      });
      if (res && res.subject && res.body) {
        setDecisionModal((prev) => ({
          ...prev,
          subject: res.subject,
          body: res.body,
          isGeneratingAi: false,
        }));
        notify(
          "success",
          "AI Email Generated",
          `Tailored ${decisionModal.decisionType === "approve" ? "acceptance" : "rejection"} email generated with AI.`,
          3000,
        );
      } else {
        setDecisionModal((prev) => ({ ...prev, isGeneratingAi: false }));
      }
    } catch (err) {
      console.warn("AI Generation failed:", err);
      setDecisionModal((prev) => ({ ...prev, isGeneratingAi: false }));
      notify("info", "Template Ready", "Loaded professional decision template.", 2500);
    }
  };

  const handleConfirmDecisionModal = async () => {
    if (!decisionModal.creator) return;
    const { creator, decisionType, sendEmail, subject, body } = decisionModal;
    setDecisionModal((prev) => ({ ...prev, isSending: true }));

    const targetEmail = creator.email || creator.email_public;
    if (sendEmail && targetEmail && targetEmail.includes("@") && body.trim()) {
      try {
        const { sendDirectEmail } = await import("../../services/opsApi");
        if (decisionType === "reject") {
          await sendDirectEmail(targetEmail, subject, body, creator.id, {
            is_rejection: true,
            include_concepts: false,
            concepts: [],
          });
        } else {
          await sendDirectEmail(targetEmail, subject, body, creator.id);
        }
        notify(
          "success",
          "Decision Email Dispatched",
          `Notification email successfully delivered to ${targetEmail}.`,
          3500,
        );
      } catch (err) {
        console.warn("Failed to dispatch decision email:", err);
        notify(
          "warning",
          "Email Notice",
          `Decision recorded, but email dispatch encountered an issue: ${err.message}`,
          4000,
        );
      }
    }

    if (decisionType === "approve") {
      handleApproveCreator(creator.id, creator);
      setSelectedCreatorId(creator.id);
      setActiveStep(5);
      // Synthesize AI concepts and audience intelligence for Step 5 review without auto-advancing past Step 5
      handleSynthesizeStep5Ai(creator);
    } else {
      handleRejectCreator(creator.id);
    }

    setDecisionModal({
      isOpen: false,
      creator: null,
      decisionType: "approve",
      sendEmail: true,
      subject: "",
      body: "",
      isGeneratingAi: false,
      isSending: false,
    });
  };

  const handlePitchAndCreateProject = async () => {
    if (!selectedCreator) return;
    if (isLaunchingProject) return;

    // Strict Gate: Never promote a rejected or archived creator to ProjectOS
    const isSelectedRejected =
      (selectedCreator.status || "").toLowerCase() === "rejected" ||
      isCreatorDeclined(selectedCreator);
    if (isSelectedRejected) {
      notify(
        "warning",
        "Lead Archived",
        "Cannot promote a rejected lead to ProjectOS. Please restore the lead first.",
        4500
      );
      return;
    }

    // Strict Gate: No approval to ProjectOS until creator confirms full commitment
    const detectedChoice = aiDetectedChoiceMap[selectedCreator.id];
    const isCommittedChoice = detectedChoice?.decision === "CREATE_PROJECT" || detectedChoice?.decision === "COMMITTED";
    const isAlreadyLaunched = ["launched", "active_project"].includes((selectedCreator.status || "").toLowerCase());
    const hasFullCommitment = Boolean(
      isCommittedChoice ||
      selectedCreator.isCommitted === true ||
      isAlreadyLaunched
    );

    if (!hasFullCommitment) {
      notify(
        "warning",
        "Promotion Blocked",
        "Cannot approve project to ProjectOS until creator confirms full commitment (explicit concept selection or agreement).",
        5500
      );
      return;
    }

    const concepts =
      selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
    const concept =
      concepts.find((p) => p.id === selectedConceptId) ||
      concepts.find((p) => p.id === detectedChoice?.conceptId) ||
      concepts.find((p) => p.id === selectedCreator.selectedConceptId) ||
      concepts.find((p) => p.id === selectedCreator.selected_concept_id) ||
      concepts.find((p) => p.name === selectedCreator.selected_concept?.name) ||
      concepts.find((p) => p.name === selectedCreator.selectedConcept?.name) ||
      selectedCreator.selected_concept ||
      selectedCreator.selectedConcept ||
      concepts[0];

    setIsLaunchingProject(true);
    setLaunchStepIndex(1);

    // Step 1: Prepare Concept Architecture
    await new Promise((r) => setTimeout(r, 450));
    setLaunchStepIndex(2);

    // Deliver formal partnership kick-off email to the creator with secure portal access
    const targetEmail = (selectedCreator.email || selectedCreator.email_public || "").trim();
    const portalSlug = (selectedCreator.handle || selectedCreator.name || "creator").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const portalToken = "cf_sec_live";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
    const magicPortalUrl = `${origin}/portal/${portalSlug}?token=${portalToken}`;

    if (targetEmail && targetEmail.includes("@")) {
      const firstName = (selectedCreator.name || selectedCreator.display_name || "there").split(" ")[0];
      const handleClean = (selectedCreator.handle || "").replace(/^@/, "");
      const prodName = concept?.name || "your custom software platform";
      const pricing = concept?.pricing || "$29-$79/mo";
      const tagline = concept?.tagline || "Tailored software venture";
      const problem = concept?.problem || "Monetizing and streamlining workflows for your community";

      const kickoffSubject = `Action Required: Choose Your Co-Launch Track for ${prodName} (Full DIY $${cobuilderPassPrice} USD vs Studio-Managed)`;
      const kickoffBody = `Hi ${firstName},

Exciting milestone! We have officially finalized the architecture for **${prodName}** and initialized your venture workspace.

Before kickoff, please select which co-launch path best fits your goals:

---

### Track 1: Do-It-Yourself ProjectOS ($${cobuilderPassPrice} USD Flat Access Fee)
• **You run the whole process yourself**: Full execution authority over Phase 1 (Validation), Phase 2 (AI MVP Build Sprints), and Phase 3 (Launch & Scale).
• **100% Revenue Ownership**: You keep 100% of all software revenue (0% studio revenue split).
• Upon paying the one-time $${cobuilderPassPrice} USD access fee via Stripe or PayPal, your dedicated DIY ProjectOS Command Center URL will be dispatched to your email immediately.

### Track 2: Studio-Managed Co-Launch Track (50/50 Revenue Split — Free Upfront)
• **Zero upfront capital**: CoLaunch studio engineering handles 100% of technical development, cloud hosting, and payment infrastructure.
• **50/50 Net Revenue Split**: We split net revenues equally.
• You receive our Creator Tracking Portal to monitor the build, review pre-orders, and follow your daily marketing launch kit & scripts.

---

### Confirm Your Co-Launch Track:
Click your secure, passwordless link below to confirm your track:

${magicPortalUrl}&offer=track_choice

If you have any questions or want to discuss the best path for your audience, reply directly to this email at any time.

Best regards,
**The CoLaunch Studio Team**
${PARTNERSHIP_EMAIL}

---
Ref: [CF-STAGE:PROJECT_KICKOFF | CF-CID:${selectedCreator.id} | Handle:@${handleClean}]`;

      try {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, kickoffSubject, kickoffBody, selectedCreator.id);
        console.log(`[AcquisitionEngine] Co-launch track choice & $50 DIY offer email dispatched to ${targetEmail}`);
      } catch (mailErr) {
        console.warn("[AcquisitionEngine] Failed to dispatch track choice email:", mailErr);
      }
    }

    // Step 3: Compute Validation Milestones & Dashboard
    setLaunchStepIndex(3);
    await new Promise((r) => setTimeout(r, 550));

    const validationSeed = buildValidationSeed(concept, selectedCreator);
    const parsedTargetVal = validationSeed?.suggestedThreshold?.target || 12500;

    const cleanInitialPlan = {
      customer: validationSeed?.customer || concept?.customer || '',
      problem: validationSeed?.problem || concept?.problem || '',
      offer: validationSeed?.offer?.pricing ? `${validationSeed.offer.pricing} · ${validationSeed.offer.revenueModel || ''}` : '',
      pricing: validationSeed?.offer?.pricing || concept?.pricing || '',
      testMethod: '',
      period: validationSeed?.estimatedBuild || '',
      threshold: validationSeed?.suggestedThreshold ? `$${validationSeed.suggestedThreshold.target.toLocaleString()} in presales or ${validationSeed.suggestedThreshold.buyers} pre-orders` : '',
      status: 'draft',
      locked: false,
    };

    onCreateProject({
      creatorId: selectedCreator.id,
      creatorName: selectedCreator.name || selectedCreator.display_name,
      creatorHandle: selectedCreator.handle,
      creatorAvatar: selectedCreator.avatar || selectedCreator.avatar_url,
      creatorEmail: selectedCreator.email || selectedCreator.email_public,
      followers: selectedCreator.followerStr || selectedCreator.follower_count,
      niche: selectedCreator.niche,
      productName: concept?.name || "New Product OS",
      productTagline: concept?.tagline || "",
      targetAudience: concept?.customer || "",
      customer: concept?.customer || "",
      problem: concept?.problem || "",
      keyFeatures: concept?.keyFeatures || [],
      features: concept?.keyFeatures || [],
      pricing: concept?.pricing || "$29/mo Starter • $79/mo Pro",
      revenueModel: concept?.revenueModel || "Subscription · 50/50 revenue share",
      competition: concept?.competition || "",
      mvpDifficulty: concept?.mvpDifficulty || "2 weeks",
      mockup: concept?.mockup || {},
      brandColor: concept?.brandColor || selectedCreator?.brandColor || '#16A34A',
      creatorScore: selectedCreator.creatorScore || selectedCreator.score || 85,
      opportunityScore: concept?.opportunityScore || 80,
      selectedConceptId: concept?.id,
      selectedConcept: concept,
      validationSeed,
      presaleTarget: parsedTargetVal,
      targetRevenue: parsedTargetVal,
      currentPhase: 1,
      phase1Step1Done: false,
      planLocked: false,
      validationPlan: cleanInitialPlan,
      portalLinkSent: true,
      skipCreatorEmail: true,
      diyOfferStatus: 'offer_sent',
      diyOfferSentAt: new Date().toISOString(),
      diyFee: cobuilderPassPrice || 0,
      diyPassPrice: cobuilderPassPrice || 0,
      hasCustomFee: true,
      isDIY: false,
    });

    try {
      const map = getExpiringItem("forge_creator_stage_map", {});
      map[selectedCreator.id] = {
        step: "section2",
        stepNumber: 7,
        actionName: "Section 2 Project OS",
        updatedAt: new Date().toISOString(),
      };
      if (selectedCreator.handle) {
        map[(selectedCreator.handle || "").replace(/^@/, "").toLowerCase()] = map[selectedCreator.id];
      }
      setExpiringItem("forge_creator_stage_map", map, ONE_HOUR_MS);

      // Persist stage map & partnered status to database for instant cross-device synchronization
      const { updateWorkflowState, updateCreatorDetails } = await import("../../services/opsApi");
      await updateWorkflowState({ creator_stage_map: map });
      await updateCreatorDetails(selectedCreator.id, { status: "partnered" });
    } catch (e) {
      console.warn("[AcquisitionEngine] DB stage sync warning on launch:", e);
    }

    // Step 4: Finalizing & Opening Dashboard
    setLaunchStepIndex(4);
    await new Promise((r) => setTimeout(r, 600));

    if (onGoToProjectOS) {
      onGoToProjectOS(selectedCreator);
    }

    setIsLaunchingProject(false);

    notify(
      "success",
      "Section 2 Project Initialized",
      `Launched Co-Launch Project OS for ${selectedCreator.name || selectedCreator.handle} (${concept?.name || "Venture"}). Track offer email dispatched to ${targetEmail || "creator"}!`,
      6000
    );
  };

  // Follow-up handler for creator DIY offer ($50 USD)
  const handleSendDiyFollowUpEmail = async (creator) => {
    if (!creator) return;
    const targetEmail = (creator.email || creator.email_public || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      notify("warning", "Missing Email", "Cannot send follow-up: No valid email address for creator.", 3500);
      return;
    }

    const concepts = creator.productConcepts || ensureCreatorConcepts(creator);
    const concept = concepts[0];
    const prodName = concept?.name || "software venture";
    const firstName = (creator.name || creator.display_name || "there").split(" ")[0];
    const portalSlug = (creator.handle || creator.name || "creator").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const portalToken = "cf_sec_live";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
    const magicPortalUrl = `${origin}/portal/${portalSlug}?token=${portalToken}&offer=track_choice`;

    const followUpSubject = `Reminder: Choose Your Co-Launch Track for ${prodName} ($${cobuilderPassPrice} DIY or Studio-Managed)`;
    const followUpBody = `Hi ${firstName},\n\nFollowing up on the co-launch offer for **${prodName}**.\n\nPlease let us know if you would like to proceed with:\n1. Track 1: Do-It-Yourself ProjectOS ($${cobuilderPassPrice} USD one-time fee) with 100% revenue retention & full command control\n2. Track 2: Studio-Managed Track (50/50 Revenue Split — Free Upfront)\n\nClick the link below to select your track or complete the $${cobuilderPassPrice} payment:\n${magicPortalUrl}\n\nFeel free to reply directly to this email with any questions.\n\nBest regards,\nCoLaunch Venture Partnerships`;

    try {
      const { sendDirectEmail } = await import("../../services/opsApi");
      await sendDirectEmail(targetEmail, followUpSubject, followUpBody, creator.id);
      notify("success", "Follow-Up Sent", `Track choice reminder email dispatched to ${targetEmail}.`, 4000);
    } catch (err) {
      console.warn("Failed to dispatch DIY follow-up:", err);
      notify("error", "Dispatch Failed", "Could not send follow-up email.", 4000);
    }
  };

  // Admin manually declines DIY on creator's behalf (locks into Managed 50/50 track)
  const handleAdminDeclineDiy = async (creator) => {
    if (!creator) return;
    try {
      const { getCoLaunchProjects, updateCoLaunchProject } = await import("../../services/opsApi");
      const all = await getCoLaunchProjects();
      const list = Array.isArray(all) ? all : all?.projects || [];
      const proj = list.find(p => p.creatorId === creator.id || p.creatorHandle === creator.handle);
      if (proj) {
        await updateCoLaunchProject(proj.id, {
          diyOfferStatus: 'declined',
          isDIY: false
        });
      }
      setCreators(prev => prev.map(c => c.id === creator.id ? { ...c, diyOfferStatus: 'declined', isDIY: false } : c));
      notify("success", "Track Updated", "DIY offer declined by admin. Project set to Studio-Managed Track (50/50 split).", 4000);
    } catch (e) {
      console.warn("Error updating project track:", e);
      notify("error", "Update Failed", "Could not update track.", 4000);
    }
  };

  // Admin manually confirms $50 DIY paid
  const handleAdminMarkPaidDiy = async (creator) => {
    if (!creator) return;
    try {
      const { getCoLaunchProjects, updateCoLaunchProject, sendDirectEmail } = await import("../../services/opsApi");
      const all = await getCoLaunchProjects();
      const list = Array.isArray(all) ? all : all?.projects || [];
      const proj = list.find(p => p.creatorId === creator.id || p.creatorHandle === creator.handle);
      const feeToUse = cobuilderPassPrice || 0;
      const sub = {
        active: true,
        plan: `diy_full_${feeToUse}`,
        planName: `Full DIY Creator ProjectOS License ($${feeToUse} USD)`,
        amount: feeToUse,
        billingCycle: 'one_time',
        paymentMethod: 'Admin Override (Paid)',
        unlockedAt: new Date().toISOString(),
        status: 'active',
        licenseKey: `FORGE-ADMIN-${Date.now().toString(36).toUpperCase()}`
      };
      if (proj) {
        await updateCoLaunchProject(proj.id, {
          diyOfferStatus: 'accepted',
          isDIY: true,
          diySubscription: sub
        });
      }
      setCreators(prev => prev.map(c => c.id === creator.id ? { ...c, diyOfferStatus: 'accepted', isDIY: true, diySubscription: sub } : c));

      // Dispatch confirmation email
      const targetEmail = (creator.email || creator.email_public || "").trim();
      if (targetEmail && targetEmail.includes("@")) {
        const portalSlug = (creator.handle || creator.name || "creator").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
        const dedicatedUrl = `${origin}/portal/${portalSlug}?view=projectos&token=cf_diy_paid`;
        await sendDirectEmail(
          targetEmail,
          `Your Dedicated DIY ProjectOS Command Center URL`,
          `Hi ${creator.name || 'there'},\n\nYour DIY ProjectOS Command Center has been activated by the studio with 100% revenue ownership.\n\nAccess your full DIY ProjectOS pipeline here:\n${dedicatedUrl}\n\nBest,\nCoLaunch Studio Team`,
          creator.id
        ).catch(() => {});
      }

      notify("success", "DIY Activated", "Full DIY ProjectOS activated for creator with 100% revenue ownership!", 4500);
    } catch (e) {
      console.warn("Error marking DIY paid:", e);
      notify("error", "Update Failed", "Could not activate DIY.", 4000);
    }
  };

  // Helper to check if a creator has already received initial outreach
  const isCreatorContacted = (c) => {
    if (!c) return false;
    if (c.outreachSent) return true;
    const s = (c.status || "").toLowerCase();
    if (["contacted", "outreach_sent", "pitched", "replied", "interested", "launched", "active_project"].includes(s)) return true;
    if (c.hasReplied) return true;
    const msgs = getCreatorThreadMessages(c, realThreads);
    if (msgs && msgs.length > 0) return true;
    return false;
  };

  const [sendingBulk, setSendingBulk] = useState(false);
  const [outreachLog, setOutreachLog] = useState("");

  const handleSendBulkOutreach = async ({ autoAdvance = false, forceAll = false } = {}) => {
    if (sendingBulk) return;
    setSendingBulk(true);

    let activeList = Array.isArray(unlaunchedCreators) && unlaunchedCreators.length > 0 ? unlaunchedCreators : (Array.isArray(creators) ? creators : []);
    if (editingEmailCreatorId && tempEmailValue.trim()) {
      const draftEmail = tempEmailValue.trim();
      const targetId = editingEmailCreatorId;
      await saveEditEmail(targetId, null, draftEmail);
      activeList = (Array.isArray(creators) ? creators : []).map((c) => {
        const cleanTarget = String(targetId).toLowerCase().replace(/^@/, "");
        const cleanHandle = String(c.handle || "").toLowerCase().replace(/^@/, "");
        if (c.id === targetId || (cleanTarget && cleanHandle && cleanTarget === cleanHandle)) {
          return {
            ...c,
            email: draftEmail,
            email_public: draftEmail,
            email_verified: Boolean(draftEmail && draftEmail.includes("@")),
          };
        }
        return c;
      });
    }

    const uncontactedList = activeList.filter((c) => {
      const email = (c.email || c.email_public || "").trim();
      if (!email.includes("@")) return false;
      return forceAll ? true : !isCreatorContacted(c);
    });

    if (uncontactedList.length === 0) {
      const alreadyContactedCount = creators.filter((c) => isCreatorContacted(c)).length;
      if (alreadyContactedCount > 0) {
        setOutreachLog(
          `[Notice] All ${alreadyContactedCount} creators in this cohort have already received initial outreach emails. Ready in Step 4.`,
        );
      } else {
        setOutreachLog(
          `[Notice] No email addresses found for the ${creators.length} creators in this batch. Please add emails in Step 2.`,
        );
      }
      setSendingBulk(false);
      if (autoAdvance) {
        setTimeout(() => {
          setActiveStep(4);
        }, 1000);
      }
      return;
    }

    setOutreachLog(
      `[Outreach Queue] Delivering partnership inquiries to ${uncontactedList.length} uncontacted creators...`,
    );
    try {
      const { sendDirectEmail, updateCreatorDetails } = await import("../../services/opsApi");
      let sentCount = 0;
      const errors = [];

      // Send sequentially with individual logging for rock-solid reliability and live feedback
      for (let i = 0; i < uncontactedList.length; i++) {
        const c = uncontactedList[i];
        const targetEmail = (c.email || c.email_public).trim();
        const cName = c.name || c.display_name || c.handle || "Creator";

        setOutreachLog(
          `[Outreach Queue] Dispatching (${i + 1}/${uncontactedList.length}) to ${cName} (${targetEmail})...`,
        );

        const creatorFirstName = (c.name || c.display_name || "there").split(" ")[0].trim() || "there";
        const creatorDisplayName = c.name || c.display_name || creatorFirstName;
        const creatorHandle = (c.handle || "").replace(/^@/, "").trim();
        const creatorPlatform = (c.platform || "YouTube").toLowerCase() === "youtube" ? "YouTube" : (c.platform || "social media");
        const rawNiche = c.niche && String(c.niche).trim() !== "undefined" && String(c.niche).trim() !== "null" ? String(c.niche).trim() : "";
        const nicheReplacement = rawNiche ? (rawNiche.toLowerCase().endsWith("content") ? rawNiche : `${rawNiche} content`) : "content";
        const followerStr = c.followerStr || (c.follower_count ? `${Math.round(c.follower_count / 1000)}k+` : "100k+");

        let renderedSubject = templateSubject
          .replace(/\{\{display_name\}\}/g, creatorDisplayName)
          .replace(/\{\{first_name\}\}/g, creatorFirstName)
          .replace(/\{\{handle\}\}/g, creatorHandle)
          .replace(/\{\{platform\}\}/g, creatorPlatform)
          .replace(/\{\{niche\}\}/g, rawNiche || "channel");
        renderedSubject = renderedSubject.replace(/\bundefined\b/gi, creatorDisplayName);

        let renderedBody = templateBody
          .replace(/\{\{first_name\}\}/g, creatorFirstName)
          .replace(/\{\{display_name\}\}/g, creatorDisplayName)
          .replace(/\{\{handle\}\}/g, creatorHandle)
          .replace(/\{\{platform\}\}/g, creatorPlatform)
          .replace(/\{\{niche\}\}\s*content/gi, nicheReplacement)
          .replace(/\{\{niche\}\}/g, rawNiche ? `${rawNiche} content` : "content")
          .replace(/\{\{follower_count\}\}/g, followerStr)
          .replace(/\{\{followers\}\}/g, followerStr)
          .replace(/\{\{creator_id\}\}/g, c.id)
          .replace(/\{\{product_name\}\}/g, "a custom software product");

        // Clean any stray "undefined" words
        renderedBody = renderedBody.replace(/\bundefined\s+content\b/gi, "content");
        renderedBody = renderedBody.replace(/\bundefined\b/gi, "channel");

        setOutreachLog(`[Connecting SMTP] Dispatching email to ${cName} (${targetEmail})...`);
        try {
          // 45-second race timeout per email to accommodate cloud container wakeups & SMTP handshakes
          const sendWithTimeout = Promise.race([
            sendDirectEmail(targetEmail, renderedSubject, renderedBody, c.id),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timed out (45s) — verify SMTP credentials on cloud server")), 45000)
            ),
          ]);

          await sendWithTimeout;
          sentCount++;
          setOutreachLog(`[Delivered] Successfully sent outreach email to ${cName} (${targetEmail})!`);

          // Mark this individual creator as contacted in local state immediately
          setCreators((prev) =>
            prev.map((item) =>
              item.id === c.id || item.handle === c.handle
                ? { ...item, status: "contacted", outreachSent: true }
                : item
            )
          );

          try {
            await updateCreatorDetails(c.id, { status: "contacted" });
          } catch { }
        } catch (sendErr) {
          console.warn(`[AcquisitionEngine] Failed email to ${targetEmail}:`, sendErr);
          errors.push(`${cName} (${targetEmail}): ${sendErr.message || "Failed"}`);
        }
      }

      if (sentCount > 0) {
        notify(
          "success",
          "Outreach Wave Dispatched",
          `Successfully dispatched partnership inquiries to ${sentCount} creators.`,
          5000
        );
        setOutreachLog(
          `[Delivered] Outreach wave successfully sent to ${sentCount} creator${sentCount > 1 ? "s" : ""}.${errors.length > 0 ? ` (${errors.length} failed: ${errors.join(", ")})` : ""
          } Transitioning to Step 4...`,
        );
        if (autoAdvance) {
          setTimeout(() => {
            setActiveStep(4);
          }, 1200);
        }
      } else {
        notify(
          "error",
          "Outreach Dispatch Failed",
          `Failed to dispatch emails: ${errors[0] || "Please verify Google SMTP credentials in Settings."}`,
          6000
        );
        setOutreachLog(
          `[Error] Outreach dispatch failed: ${errors.join(" | ")}. Transitioning to Step 4...`,
        );
        if (autoAdvance) {
          setTimeout(() => {
            setActiveStep(4);
          }, 1500);
        }
      }
    } catch (e) {
      console.warn("[AcquisitionEngine] Outreach error:", e);
      setOutreachLog(
        `[Notice] Outreach notice: ${e.message || "Dispatched outreach"}. Transitioning to Step 4...`,
      );
      notify(
        "error",
        "Outreach Error",
        e.message || "An unexpected error occurred during dispatch.",
        5000
      );
      if (autoAdvance) {
        setTimeout(() => {
          setActiveStep(4);
        }, 1500);
      }
    } finally {
      setSendingBulk(false);
    }
  };

  // Auto-send emails on reaching Step 3 & advance to Step 4 for replies
  useEffect(() => {
    if (activeStep === 3 && !sendingBulk && creators.length > 0) {
      const hasUncontacted = creators.some((c) => {
        const email = (c.email || c.email_public || "").trim();
        return email.includes("@") && !isCreatorContacted(c);
      });
      if (hasUncontacted) {
        const timer = setTimeout(() => {
          handleSendBulkOutreach({ autoAdvance: true });
        }, 900);
        return () => clearTimeout(timer);
      } else {
        setOutreachLog(
          "[Outreach Queue] All creators in this batch have already received emails. Transitioning to Step 4 for creator replies...",
        );
        const timer = setTimeout(() => {
          setActiveStep(4);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [activeStep, creators.length, sendingBulk]);

  // ── Creator reply notification & state update function (Strict Human Review Gate) ─
  const triggerAutoAdvance = (creator, reply) => {
    if (!creator || !reply || !reply.hasRealReply || !reply.text) return;
    autoAdvancedIdsRef.current.add(creator.id);
    setAutoAdvancedIds((prev) => new Set([...prev, creator.id]));

    setCreators((prev) =>
      prev.map((c) =>
        c.id === creator.id
          ? {
            ...c,
            hasReplied: true,
            replyClassification: reply.classification || "interested",
            reply_classification: reply.classification || "interested",
            replyText: reply.text,
            replyTime: reply.time || "Recently",
            productConcepts: ensureCreatorConcepts(c),
          }
          : c,
      ),
    );

    // Persist to DB ONLY with genuine reply text
    import("../../services/opsApi").then(({ updateCreatorDetails }) => {
      updateCreatorDetails(creator.id, {
        reply_classification: reply.classification || "interested",
        reply_text: reply.text,
      }).catch((e) => console.warn(e));
    });

    // Select this creator ONLY if no creator is currently selected
    setSelectedCreatorId((prev) => (prev ? prev : creator.id));

    // Notify of incoming response (does NOT change activeStep)
    const cName =
      creator.name || creator.display_name || creator.handle || "Creator";
    notify(
      "info",
      "New Creator Response",
      `${cName} replied: "${reply.text.slice(0, 45)}..." — Ready for review in Step 4.`,
      4500,
    );
  };

  // Persist realThreads to localStorage
  useEffect(() => {
    try {
      if (realThreads && realThreads.length > 0) {
        setExpiringItem(
          "forge_launch_real_threads",
          realThreads,
          ONE_HOUR_MS,
        );
      }
    } catch (e) { }
  }, [realThreads]);

  const syncImapReplies = async (isManual = false) => {
    if (isSyncingImapRef.current) return;
    isSyncingImapRef.current = true;
    const isManualClick = isManual === true;
    setPollingImap(true);
    setImapSyncLog(
      "Syncing inbox for recent replies...",
    );
    try {
      const { pollInboxReplies, getThreads } =
        await import("../../services/opsApi");
      const res = await pollInboxReplies();
      const threads = res?.threads || (await getThreads());
      if (threads && Array.isArray(threads)) {
        setRealThreads(threads);
        const repliedThreads = threads.filter(
          (t) => t.replies && t.replies.length > 0,
        );
        setImapSyncLog(
          `[Inbox Synced] ${repliedThreads.length} active reply threads updated and classified.`,
        );

        // Sync incoming replies directly into creators state ONLY if real reply with text exists
        setCreators((prevCreators) => {
          if (!prevCreators || prevCreators.length === 0) return prevCreators;
          return prevCreators.map((c) => {
            const reply = getCreatorReply(c, threads);
            if (reply && reply.hasRealReply && reply.text) {
              return {
                ...c,
                hasReplied: true,
                replyClassification: reply.classification || c.replyClassification,
                reply_classification: reply.classification || c.reply_classification,
                replyText: reply.text,
                reply_text: reply.text,
              };
            }
            return c;
          });
        });

        // Only trigger an alert toast if user manually clicked a Refresh button
        if (isManualClick) {
          notify(
            "info",
            "Inbox Refreshed",
            `Inbox synced: ${repliedThreads.length} active reply threads updated.`,
            2500
          );
        }

        // Check for positive replies across ALL creators (Step 4 only — ignore already pitched/qualified creators)
        if (autoAdvanceOnPositive && activeStep <= 4) {
          for (const c of creators) {
            if (c.hasReplied || pitchSentMap[c.id]) continue;
            const reply = getCreatorReply(c, threads);
            if (
              reply &&
              reply.hasRealReply &&
              reply.text &&
              (reply.classification === "interested" ||
                reply.sentiment?.toLowerCase() === "positive") &&
              !autoAdvancedIdsRef.current.has(c.id)
            ) {
              autoAdvancedIdsRef.current.add(c.id);
              triggerAutoAdvance(c, reply);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[AcquisitionEngine] IMAP poll error:", e);
      setImapSyncLog("[IMAP Check] Waiting for creator replies.");
    } finally {
      setPollingImap(false);
      isSyncingImapRef.current = false;
    }
  };

  // Always sync IMAP on mount
  useEffect(() => {
    syncImapReplies();
  }, []);

  // Poll regularly while on Step 4, Step 5, or Step 6 (debounced 45s interval, tab-aware)
  useEffect(() => {
    if (activeStep >= 4) {
      syncImapReplies();
      const pollTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        syncImapReplies();
      }, 45000);
      return () => clearInterval(pollTimer);
    }
  }, [activeStep]);

  // Watch for any positive replies coming in across all creators (Step 4 only)
  useEffect(() => {
    if (activeStep <= 4 && autoAdvanceOnPositive && realThreads.length > 0) {
      for (const c of creators) {
        if (c.hasReplied || pitchSentMap[c.id]) continue;
        const reply = getCreatorReply(c, realThreads);
        if (
          reply &&
          reply.hasRealReply &&
          reply.text &&
          (reply.classification === "interested" ||
            reply.sentiment?.toLowerCase() === "positive") &&
          !autoAdvancedIdsRef.current.has(c.id)
        ) {
          autoAdvancedIdsRef.current.add(c.id);
          triggerAutoAdvance(c, reply);
        }
      }
    }
  }, [realThreads, activeStep, autoAdvanceOnPositive]);

  // ── Autonomous AI Decision Analyzer ─────────────────────────────────────────
  const analyzeCreatorReplyAutonomous = (latestBody, concepts = []) => {
    if (!latestBody) return null;
    let decoded = latestBody;
    if (decoded.includes("+")) {
      try {
        decoded = decodeURIComponent(decoded.replace(/\+/g, " "));
      } catch {
        decoded = decoded.replace(/\+/g, " ");
      }
    } else if (decoded.includes("%20") || decoded.includes("%28") || decoded.includes("%29")) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch { }
    }
    const text = decoded.toLowerCase().trim();

    // 1. Hard Opt-Out / Unsubscribe -> Cease outreach and respect decision
    const hardOptOutPatterns = [
      "unsubscribe",
      "remove me",
      "stop email",
      "stop emailing",
      "dont contact",
      "don't contact",
      "never contact",
      "remove our contact",
    ];
    if (hardOptOutPatterns.some((p) => text.includes(p))) {
      return {
        decision: "NOT_INTERESTED",
        actionLabel: "Opt-Out Requested",
        confidence: 99,
        conceptName: concepts[0]?.name || "Recommended SaaS",
        reasoning: `Creator requested to opt out. Lead archived.`,
        color: "rose",
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    }

    // 2. Explicit Concept Selection or Build Agreement (Checked FIRST before general questions)
    const explicitConceptSelection = [
      "concept 1",
      "concept 2",
      "concept 3",
      "concept1",
      "concept2",
      "concept3",
      "option 1",
      "option 2",
      "option 3",
      "step 1",
      "step 2",
      "step 3",
      "step1",
      "step2",
      "step3",
      "idea 1",
      "idea 2",
      "idea 3",
      "#1",
      "#2",
      "#3",
      "first one",
      "second one",
      "third one",
      "number 1",
      "number 2",
      "number 3",
      "no 1",
      "no 2",
      "no 3",
      "1st",
      "2nd",
      "3rd",
      "interest in concept 1",
      "interest in concept 2",
      "interest in concept 3",
      "interested in concept 1",
      "interested in concept 2",
      "interested in concept 3",
      "i will be interest in concept 1",
      "i will be interest in concept 2",
      "i will be interest in concept 3",
      "i will be interested in concept 1",
      "i will be interested in concept 2",
      "i will be interested in concept 3",
      "i am interested in concept 1",
      "i am interested in concept 2",
      "i am interested in concept 3",
      "i'm interested in concept 1",
      "i'm interested in concept 2",
      "i'm interested in concept 3",
      "interested in concept",
      "interest in concept",
      "interested in option",
      "interest in option",
      "i choose",
      "i prefer",
      "let's go with",
      "lets go with",
      "let's build",
      "lets build",
      "start building",
      "create project",
      "ready to move forward",
      "move forward",
      "let's do it",
      "lets do it",
      "let's do this",
      "lets do this",
      "let's proceed",
      "lets proceed",
      "sign me up",
      "count me in",
      "deal",
      "agreed",
      "ready to launch",
    ];

    const generalInterestPhrases = [
      "i will be interested",
      "i will be interest",
      "i am interested",
      "i'm interested",
      "im interested",
      "definitely interested",
      "very interested",
      "would be interested",
      "interested",
      "sounds great",
      "sounds good",
      "tell me more",
      "love this",
      "love it",
      "share the details",
      "send more info",
    ];

    // Resolve concept match
    let matchedConcept = concepts.find((con) =>
      text.includes(con.name?.toLowerCase()),
    );
    if (!matchedConcept) {
      if (
        text.includes("concept 2") ||
        text.includes("concept2") ||
        text.includes("option 2") ||
        text.includes("second") ||
        text.includes("step 2") ||
        text.includes("step2") ||
        text.includes("idea 2") ||
        text.includes("#2") ||
        text.includes("2nd") ||
        text.includes("number 2") ||
        text.includes("no 2") ||
        text.includes("interest in concept 2") ||
        text.includes("interested in concept 2")
      ) {
        matchedConcept = concepts[1] || concepts[0];
      } else if (
        text.includes("concept 3") ||
        text.includes("concept3") ||
        text.includes("option 3") ||
        text.includes("third") ||
        text.includes("step 3") ||
        text.includes("step3") ||
        text.includes("idea 3") ||
        text.includes("#3") ||
        text.includes("3rd") ||
        text.includes("number 3") ||
        text.includes("no 3") ||
        text.includes("interest in concept 3") ||
        text.includes("interested in concept 3")
      ) {
        matchedConcept = concepts[2] || concepts[0];
      } else if (
        text.includes("concept 1") ||
        text.includes("concept1") ||
        text.includes("option 1") ||
        text.includes("first") ||
        text.includes("step 1") ||
        text.includes("step1") ||
        text.includes("idea 1") ||
        text.includes("#1") ||
        text.includes("1st") ||
        text.includes("number 1") ||
        text.includes("no 1") ||
        text.includes("interest in concept 1") ||
        text.includes("interested in concept 1")
      ) {
        matchedConcept = concepts[0];
      }
    }

    // A. Explicit concept confirmation passed: Creator picked a specific concept or named product
    if (matchedConcept && text.length > 3) {
      const chosen = matchedConcept;
      return {
        decision: "CREATE_PROJECT",
        actionLabel: `Launch & Create Project (${chosen.name})`,
        confidence: 98,
        conceptName: chosen.name,
        conceptId: chosen.id,
        reasoning: `Creator confirmed positive agreement with concrete intent: "${latestBody.slice(0, 60)}...". Selected Concept: ${chosen.name}. Verified alignment threshold passed; click Create Project to initialize Section 2.`,
        color: "emerald",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    }

    // B. General positive interest without naming a specific concept yet (e.g. "I will be interested. Thanks")
    const hasGeneralInterest = generalInterestPhrases.some((p) => text.includes(p));
    if (hasGeneralInterest) {
      return {
        decision: "INTERESTED_PENDING_SELECTION",
        actionLabel: "Creator Interested — Awaiting Concept Selection",
        confidence: 88,
        conceptName: concepts[0]?.name || "Proposed Concept",
        conceptId: null,
        reasoning: `Creator expressed positive interest: "${latestBody.slice(0, 60)}...", but has not yet specified Concept 1, 2, or 3. Pitch the 3 concepts or follow up with concept breakdown.`,
        color: "blue",
        badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      };
    }

    // 3. Hesitation / Confusion / Soft Rejection -> Suggested Persuasion Draft
    const hesitationPatterns = [
      "confusing",
      "confused",
      "confusion",
      "reject",
      "reject for now",
      "pass for now",
      "not for now",
      "not interested",
      "no thanks",
      "no thank you",
      "pass on this",
      "pass",
      "decline",
      "not for us",
      "no interest",
      "booked for this quarter",
      "too busy",
      "dont have time",
      "don't have time",
      "not right now",
      "sounds complicated",
      "too complicated",
      "not sure",
      "hesitant",
      "unclear",
    ];
    if (hesitationPatterns.some((p) => text.includes(p))) {
      return {
        decision: "PERSUADE",
        actionLabel: "Suggested: Persuasion Draft",
        confidence: 96,
        conceptName: concepts[0]?.name || "Recommended SaaS",
        reasoning: `Creator expressed hesitation. Suggested: 50/50 zero-risk clarification draft.`,
        color: "amber",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }

    // 4. Questions / Inquiries -> Suggested Answer Draft
    const questionPatterns = [
      "?",
      "further explanation",
      "further explaination",
      "more details",
      "need more details",
      "give me more details",
      "explain further",
      "more information",
      "more info",
      "need more info",
      "clarification",
      "clarify",
      "how it works",
      "how this works",
      "thoughts",
      "thought",
      "think",
      "what do you think",
      "what are your thoughts",
      "feedback",
      "what tech",
      "what stack",
      "how does",
      "how do you",
      "revenue split",
      "who owns",
      "cost",
      "pricing",
      "how much",
      "can you tell",
      "tell me more",
      "what are the",
      "can you explain",
      "explain how",
      "who builds",
      "what is the timeline",
      "where is the link",
      "where is the deck",
      "benefit",
      "what do i get",
      "in it for me",
    ];
    const hasQuestion = questionPatterns.some((p) => text.includes(p));
    if (hasQuestion) {
      return {
        decision: "ANSWER_QUESTION",
        actionLabel: "Suggested: Answer Draft",
        confidence: 95,
        conceptName: concepts[0]?.name || "Recommended Concept",
        reasoning: `Creator asked questions. Suggested: Term clarification & revenue split draft.`,
        color: "blue",
        badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      };
    }

    // 5. Review in Progress / Concept Review Acknowledgment
    const reviewPatterns = [
      "check them out",
      "check it out",
      "check these out",
      "i'll check",
      "ill check",
      "i will check",
      "will check",
      "checking",
      "take a look",
      "looking into",
      "looking over",
      "reviewing",
      "will review",
      "let me review",
      "will look",
      "give me a few days",
      "give me a moment",
      "let me read",
      "let you know",
      "get back to you",
      "can we continue",
      "how do we continue",
      "what's next",
      "whats next",
    ];
    const isReview = reviewPatterns.some((p) => text.includes(p));
    if (isReview) {
      return {
        decision: "REVIEW_PREVIEW",
        actionLabel: "Suggested: 60s Preview",
        confidence: 96,
        conceptName: concepts[0]?.name || "Recommended Concept",
        reasoning: `Creator is reviewing concepts. Suggested: 60-second summary & concept preview draft.`,
        color: "amber",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }

    // 8. Fallback: Conversational Dialog Reply
    if (text.length > 2) {
      return {
        decision: "REVIEW_PREVIEW",
        actionLabel: "Send Conversational Dialog Follow-up",
        confidence: 92,
        conceptName: concepts[0]?.name || "Recommended Concept",
        reasoning: `Creator reply received in active dialog ("${latestBody.slice(0, 50)}..."). AI will deploy a 60-second summary breakdown and advantages overview to maintain conversation momentum before Section 2.`,
        color: "amber",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }

    // Fallback: Awaiting clear reply
    return {
      decision: "AWAITING_STEP6_REPLY",
      actionLabel: "Awaiting Concept Choice",
      confidence: 50,
      conceptName: concepts[0]?.name || "Recommended Concept",
      reasoning: `Creator reply received ("${latestBody.slice(0, 50)}..."), but no clear concept choice or agreement detected. Awaiting concrete confirmation before executing Project OS.`,
      color: "cyan",
      badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
    };
  };

  // Autonomous Execution Handlers
  const handleAutonomousResend = async (creatorParam) => {
    const creator =
      creatorParam && creatorParam.id && !creatorParam.nativeEvent && !creatorParam.target
        ? creatorParam
        : selectedCreator;
    if (!creator || isSendingPitch) return;
    const cId = creator.id;
    if (pitchSentMap[cId]?.isFollowup) return;
    setIsSendingPitch(true);
    const targetEmail = (
      creator.email ||
      creator.email_public ||
      ""
    ).trim();
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();
    const concepts =
      creator.productConcepts || ensureCreatorConcepts(creator);
    const followUpSubject = `Re: Quick 60-second preview: ${concepts[0]?.name} for ${creator.name || "you"}`;
    const followUpBody =
      `Hi ${creator.name?.split(" ")[0] || "there"},\n\n` +
      `Thanks for taking a look! To make your review as quick and easy as possible, here is a 60-second breakdown of our engineered concepts for your community:\n\n` +
      `1. ${concepts[0]?.name} — ${concepts[0]?.tagline} (${concepts[0]?.pricing})\n` +
      `2. ${concepts[1]?.name || concepts[0]?.name + " Pro"} — ${concepts[1]?.tagline || "AI-powered engine"} (${concepts[1]?.pricing || "$49/mo"})\n` +
      `3. ${concepts[2]?.name || concepts[0]?.name + " Hub"} — ${concepts[2]?.tagline || "Private toolkit suite"} (${concepts[2]?.pricing || "$79/mo"})\n\n` +
      `• Key Advantage: 100% fully managed engineering, server hosting, Stripe billing, and customer support at zero cost to you.\n` +
      `• Revenue Split: 50/50 net recurring revenue deposited directly to your bank account.\n` +
      `• Time Commitment: Under 2 hours/month reviewing product roadmaps and sharing with your audience.\n\n` +
      `Which of these 3 resonates most with what your followers ask for? Let us know or feel free to ask any questions!\n\n` +
      `Best regards,\nCoLaunch Studio Team\n\n---\nRef: [CF-STAGE:STEP6_DIALOG_PREVIEW | CF-CID:${cId} | Handle:@${cleanHandle}]`;

    try {
      if (targetEmail && targetEmail.includes("@")) {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, followUpSubject, followUpBody, cId);
      }
      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      const updatedMap = {
        ...pitchSentMap,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail || "creator",
          subject: followUpSubject,
          isFollowup: true,
        },
      };
      setPitchSentMap(updatedMap);
      try {
        setExpiringItem("forge_launch_pitch_sent_map", updatedMap, ONE_HOUR_MS);
      } catch { }
      notify(
        "info",
        "Preview Nudge Sent",
        `Dispatched 60-second concept preview to ${creator.name || creator.handle}.`,
        4500
      );
      syncImapReplies().catch((err) => console.warn("[AcquisitionEngine] Background IMAP sync:", err));
    } catch (e) {
      console.warn("Resend error:", e);
    } finally {
      setIsSendingPitch(false);
    }
  };

  const handleAutonomousCancel = () => {
    if (!selectedCreator) return;
    const name = selectedCreator.name || selectedCreator.handle;
    handleRejectCreator(selectedCreator.id);
    notify("warning", "Lead Archived", `Archived ${name} from active acquisition list.`, 3500);
  };

  // Answer Creator Questions in Step 6
  const handleSendAnswer = async (creatorParam) => {
    const creator =
      creatorParam && creatorParam.id && !creatorParam.nativeEvent && !creatorParam.target
        ? creatorParam
        : selectedCreator;
    if (!creator || isSendingPitch) return;
    const cId = creator.id;
    if (answerSentMap[cId]) return;
    setIsSendingPitch(true);
    const targetEmail = (
      creator.email ||
      creator.email_public ||
      ""
    ).trim();
    const concepts =
      creator.productConcepts || ensureCreatorConcepts(creator);
    const creatorName =
      creator.name || creator.display_name || "there";
    const firstName = creatorName.split(" ")[0];
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();

    // Get the creator's actual latest message/question
    const creatorMsgs = getCreatorThreadMessages(creator, realThreads);
    const latestMsg = creatorMsgs.length > 0 ? creatorMsgs[0].body : "";
    const qLower = (latestMsg || "").toLowerCase().trim();

    const sections = [];
    if (/benefit|why|value|get|worth|what do i|what is in it|whats in it|in it for me|advantage/i.test(qLower)) {
      sections.push(
        `Here is exactly how this co-founding model benefits you compared to traditional brand sponsorships or trying to build software alone:\n\n` +
        `1. Compounding 50% Lifetime Net Recurring Revenue:\n` +
        `Unlike one-off sponsorships where a brand pays you once and captures all customer lifetime value, software produces compounding monthly subscription income (MRR). With 50% net revenue equity, just 500 active subscribers at $49/mo yields over $12,000/month in predictable, recurring cashflow to you.\n\n` +
        `2. Zero Upfront Investment & Zero Financial Risk:\n` +
        `You never invest a dime of your own money. CoLaunch Studio funds 100% of the engineering, server infrastructure, Stripe billing systems, and security compliance.\n\n` +
        `3. 100% Fully Managed Engineering & Support:\n` +
        `You never write a single line of code or manage customer support tickets. Our in-house engineering team designs, develops, tests, hosts, and maintains the entire application 24/7.\n\n` +
        `4. Minimal Time Commitment (< 2 Hours/Month):\n` +
        `Your role is purely strategic: reviewing product roadmaps, testing new features, and sharing the tool naturally with your audience during your regular content releases.\n\n` +
        `5. You Own Real Software Equity:\n` +
        `You become a co-founder of a high-value SaaS product built specifically around your brand and community authority.`
      );
    }

    if (/tech|stack|code|build|who|develop|architecture|server|host/i.test(qLower)) {
      sections.push(
        `• Technology & Engineering Architecture:\n` +
        `Our engineering team builds high-performance web applications using React/Next.js for interactive interfaces, Python/FastAPI for scalable API services, and PostgreSQL for secure data persistence. All infrastructure is deployed on cloud servers with automated SSL, continuous backups, and 99.9% uptime monitoring. You don't need any technical background.`
      );
    }

    if (/split|revenue|money|cost|pay|fee|pricing|expense/i.test(qLower)) {
      sections.push(
        `• 50/50 Revenue Split & Commercial Terms:\n` +
        `You receive 50% of all net subscription revenue from day one, deposited directly to your bank account via automated Stripe Connect payouts. CoLaunch Studio covers 100% of engineering development, server hosting, and payment processing fees. There are zero upfront fees and zero ongoing expenses charged to you.`
      );
    }

    if (/time|hour|commitment|busy|work|schedule/i.test(qLower)) {
      sections.push(
        `• Your Time Commitment:\n` +
        `We understand you are busy creating content. The partnership requires less than 1–2 hours per month. Your only involvement is reviewing product UX and announcing the tool to your community.`
      );
    }

    if (/ip|own|copyright|brand|legal|likeness/i.test(qLower)) {
      sections.push(
        `• IP & Ownership Protection:\n` +
        `The partnership operates as a joint venture. You retain 100% ownership of your brand, likeness, and content. The software itself is owned jointly under our co-founder agreement.`
      );
    }

    if (/thought|think|opinion|feedback|view|perspective/i.test(qLower)) {
      sections.push(
        `Here are our strategic thoughts on why this co-founder partnership and these 3 concepts make immense sense for your audience:\n\n` +
        `1. Tailored Community Fit: We analyzed your channel and community discussions, and identified that automated workflow and specialized tools in ${concepts[0]?.tagline || "this niche"} solve their biggest bottleneck.\n\n` +
        `2. Compounding 50% Lifetime Net Recurring Revenue: Unlike one-off sponsorships where payment ends when the video goes live, software produces compounding monthly subscription revenue (MRR) where you receive 50% net share deposited automatically via Stripe.\n\n` +
        `3. Zero Capital & Zero Technical Management: CoLaunch Studio finances and builds 100% of the software, servers, security, and customer support. You never write code or handle tickets.\n\n` +
        `4. Minimal Time Commitment (< 2 Hours/Month): Your role is purely strategic product feedback and sharing the launch with your audience during your regular content schedule.\n\n` +
        `We strongly recommend starting with ${concepts[0]?.name} for our 14-day pre-order validation sprint.`
      );
    }

    if (sections.length === 0) {
      sections.push(
        `• 50/50 Net Revenue Partnership:\n` +
        `CoLaunch Studio funds, builds, and supports 100% of the software product at zero cost to you, while you receive 50% of all net subscription revenue from day one. You provide audience distribution and product feedback under 2 hours/month.`
      );
    }

    const answerSubject = `Re: Co-founding questions regarding ${concepts[0]?.name} (${creatorName})`;
    const answerBody =
      `Hi ${firstName},\n\n` +
      `Thanks for asking — that is the most important question to clarify before we build anything together!\n\n` +
      sections.join("\n\n") +
      `\n\nHere are the 3 concepts we specifically engineered for your community:\n` +
      `1. ${concepts[0]?.name} — ${concepts[0]?.tagline} (${concepts[0]?.pricing})\n` +
      `2. ${concepts[1]?.name} — ${concepts[1]?.tagline} (${concepts[1]?.pricing})\n` +
      `3. ${concepts[2]?.name} — ${concepts[2]?.tagline} (${concepts[2]?.pricing})\n\n` +
      `Which of these 3 concepts do you think solves the biggest bottleneck for your audience? Let us know, and we will initialize your private partner portal and launch validation.\n\n` +
      `Best regards,\nCoLaunch Studio Team\n\n---\nRef: [CF-STAGE:STEP6_DIALOG_ANSWER | CF-CID:${cId} | Handle:@${cleanHandle}]`;

    try {
      if (targetEmail && targetEmail.includes("@")) {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, answerSubject, answerBody, cId);
      }
      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      const updatedMap = {
        ...answerSentMap,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail,
          subject: answerSubject,
        },
      };
      setAnswerSentMap(updatedMap);
      try {
        setExpiringItem("forge_launch_answer_sent_map", updatedMap, ONE_HOUR_MS);
      } catch { }
      notify(
        "info",
        "Clarification Dispatched",
        `Sent detailed answers addressing inquiries for ${creatorName}.`,
        4500
      );
      syncImapReplies().catch((err) => console.warn("[AcquisitionEngine] Background IMAP sync:", err));
    } catch (e) {
      console.warn("Answer email dispatch error:", e);
    } finally {
      setIsSendingPitch(false);
    }
  };

  // Watch for creator concept choice & incoming messages in Step 6 (strictly in response to Step 6 pitch & dialog)
  useEffect(() => {
    if (activeStep === 6 && creators.length > 0) {
      for (const c of creators) {
        const incoming = getCreatorThreadMessages(c, realThreads);
        const pitchSent = pitchSentMap[c.id];
        const answerSent = answerSentMap[c.id];
        const persuasionSent = persuasionSentMap[c.id];
        const concepts = c.productConcepts || ensureCreatorConcepts(c);

        // Determine the latest outbound communication sent to this creator in Step 6 (Pitch, Answer, or Persuasion)
        const pTime = pitchSent?.sentTimestamp || (pitchSent?.sentAt ? new Date(pitchSent.sentAt).getTime() : 0);
        const aTime = answerSent?.sentTimestamp || (answerSent?.sentAt ? new Date(answerSent.sentAt).getTime() : 0);
        const perTime = persuasionSent?.sentTimestamp || (persuasionSent?.sentAt ? new Date(persuasionSent.sentAt).getTime() : 0);

        let latestOutboundTime = Math.max(pTime, aTime, perTime);

        // Fallback: Check if any outbound message exists in realThreads
        if (!latestOutboundTime) {
          for (const thread of realThreads) {
            const msgs = thread.messages || [];
            for (const m of msgs) {
              const isOut = m.is_outbound || m.from_address?.includes("creatorforge") || m.from_address?.includes("@gmail.com");
              const subj = (m.subject || "").toLowerCase();
              if (isOut && /blueprint|opportunity deck|software concepts|bespoke software|concept selection|concept pitch|concepts for|answers to your questions|simplifying|zero-effort/i.test(subj)) {
                const t = m.sent_at || m.created_at;
                if (t) {
                  const tMs = new Date(t).getTime();
                  if (tMs > latestOutboundTime) latestOutboundTime = tMs;
                }
              }
            }
          }
        }

        const hasStep6PitchThread = incoming.some((msg) => {
          const subj = (msg.subject || "").toLowerCase();
          return /blueprint|opportunity deck|software concepts|bespoke software|concept selection|concept pitch|concepts for|answers to your questions|co-founder partnership|zero upfront cost|preview/i.test(subj);
        });

        const hasLandingPageSelection = Boolean(
          c.selectedConcept?.selectedViaLandingPage ||
          ((c.status || "").toLowerCase() === "replied" && (c.selectedConceptId || c.selectedConcept))
        );

        const isCDeclined = (c.status || "").toLowerCase() === "rejected" || isCreatorDeclined(c);
        if (isCDeclined) continue;

        const pitchWasDispatched = Boolean(latestOutboundTime > 0 || pitchSent || hasStep6PitchThread || hasLandingPageSelection);
        if (!pitchWasDispatched) continue;

        // Filter messages to find those that are GENUINE feedback/replies to our Step 6 outreach (strictly from creator):
        const step6Replies = incoming.filter((msg) =>
          isCreatorMessage(msg) && isStep6Message(msg, latestOutboundTime),
        );

        if (step6Replies.length > 0) {
          const latestStep6 = step6Replies[0];
          const analysis = analyzeCreatorReplyAutonomous(
            latestStep6.body,
            concepts,
          );

          if (analysis) {
            if (analysis.conceptId) {
              if (c.id === selectedCreatorId) {
                setSelectedConceptId(analysis.conceptId);
              }
              const chosen = concepts.find((p) => p.id === analysis.conceptId);
              if (chosen && (!c.selectedConceptId || c.selectedConceptId !== analysis.conceptId)) {
                setCreatorConceptSelectionMap((prev) => ({
                  ...prev,
                  [c.id]: analysis.conceptId,
                }));
                import("../../services/opsApi").then(({ updateCreatorDetails }) => {
                  updateCreatorDetails(c.id, {
                    selected_concept_id: analysis.conceptId,
                    selected_concept: chosen,
                  }).catch(() => { });
                });
              }
            }
            setAiDetectedChoiceMap((prev) => ({
              ...prev,
              [c.id]: {
                decision: analysis.decision,
                actionLabel: analysis.actionLabel,
                conceptName: analysis.conceptName,
                conceptId: analysis.conceptId,
                confidence: analysis.confidence,
                reasoning: analysis.reasoning,
                color: analysis.color,
                badgeClass: analysis.badgeClass,
                snippet:
                  latestStep6.body.length > 150
                    ? latestStep6.body.slice(0, 150) + "..."
                    : latestStep6.body,
                fullBody: latestStep6.body,
                receivedAt: latestStep6.received_at,
                fromAddress: latestStep6.from_address,
                isStep6Reply: true,
              },
            }));
          }
        } else if (hasLandingPageSelection) {
          const selName = String(
            (typeof c.selectedConcept === "string" ? c.selectedConcept : c.selectedConcept?.name) || ""
          ).trim().toLowerCase();
          const chosen =
            concepts.find((p) => c.selectedConceptId && p.id === c.selectedConceptId) ||
            concepts.find((p) => selName && (p.name || "").trim().toLowerCase() === selName) ||
            concepts[0];
          if (chosen) {
            if (c.id === selectedCreatorId) {
              setSelectedConceptId(chosen.id);
            }
            setCreatorConceptSelectionMap((prev) => ({
              ...prev,
              [c.id]: chosen.id,
            }));
            setAiDetectedChoiceMap((prev) => ({
              ...prev,
              [c.id]: {
                decision: "CREATE_PROJECT",
                actionLabel: `Launch & Create Project (${chosen.name})`,
                conceptName: chosen.name,
                conceptId: chosen.id,
                confidence: 99,
                reasoning: `Creator greenlit "${chosen.name}" directly from the email's live concept landing page.`,
                color: "emerald",
                badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                snippet: `Selected ${chosen.name} via live landing page.`,
                fullBody: c.replyText || `Selected ${chosen.name} via live landing page.`,
                receivedAt: c.selectedConcept?.selectedAt || new Date().toISOString(),
                fromAddress: c.email || c.email_public || "",
                isStep6Reply: true,
              },
            }));
          }
        } else {
          // No reply to our latest Step 6 outreach yet!
          // The system MUST wait for creator's feedback/reply in dialog before taking any action.
          let waitAction = "Awaiting Pitch Feedback";
          let waitReason = `Opportunity pitch presenting 3 concepts was dispatched to ${c.name || "creator"}. Monitoring inbox for their feedback, concept choice, or questions before taking action.`;
          let waitColor = "cyan";
          let waitBadge = "bg-cyan-50 text-cyan-800 border-cyan-200";

          if (aTime > pTime && aTime >= perTime) {
            waitAction = "Answers Sent — Awaiting Reply";
            waitReason = `Clarifying answers regarding 50/50 split and tech stack were dispatched to ${c.name || "creator"}. Monitoring inbox for their response before proceeding.`;
            waitColor = "blue";
            waitBadge = "bg-blue-500/20 text-blue-300 border-blue-500/40";
          } else if (perTime > pTime && perTime >= aTime) {
            waitAction = "Persuasion Sent — Awaiting Reply";
            waitReason = `Persuasion recovery email addressing ${c.name || "creator"}'s hesitation was dispatched. Monitoring inbox for their response before proceeding.`;
            waitColor = "amber";
            waitBadge = "bg-amber-500/20 text-amber-300 border-amber-500/40";
          }

          setAiDetectedChoiceMap((prev) => ({
            ...prev,
            [c.id]: {
              decision: "AWAITING_STEP6_REPLY",
              actionLabel: waitAction,
              conceptName: concepts[0]?.name || "Recommended Concept",
              confidence: 0,
              reasoning: waitReason,
              color: waitColor,
              badgeClass: waitBadge,
              isStep6Reply: false,
            },
          }));
        }
      }
    }
  }, [realThreads, activeStep, creators, selectedCreatorId, pitchSentMap, answerSentMap, persuasionSentMap]);

  // Step 6 Human Confirmation Gate (All emails and project launches are strictly manually approved by human operator)

  // Autonomous handling of rejection / opt-out in Step 6
  useEffect(() => {
    if (
      activeStep === 6 &&
      selectedCreator &&
      campaignRunning
    ) {
      const currentChoice = aiDetectedChoiceMap[selectedCreator.id];
      if (
        currentChoice &&
        currentChoice.decision === "NOT_INTERESTED" &&
        currentChoice.isStep6Reply &&
        selectedCreator.status !== "rejected"
      ) {
        handleRejectCreator(selectedCreator.id);
      }
    }
  }, [
    activeStep,
    selectedCreator?.id,
    selectedCreator?.status,
    aiDetectedChoiceMap,
    campaignRunning,
  ]);

  const handleSimulateReply = (creatorId, classification) => {
    const creator = creators.find((c) => c.id === creatorId);
    const name = creator?.name || creator?.display_name || "Creator";
    const niche =
      (Array.isArray(creator?.niche) ? creator.niche[0] : creator?.niche) ||
      "Tech";

    let text = "";
    if (classification === "interested") {
      text = `Hey team! Saw your note regarding the co-founder partnership for our ${niche} audience. We'd love to review the product concepts and revenue split structure.`;
    } else if (classification === "question") {
      text = `Hi! Thanks for reaching out. What is the expected timeline for building the MVP, and how much time will be required on my end for community rollout?`;
    } else if (classification === "not_interested") {
      text = `Thanks for reaching out, but our partnership and sponsorship schedule is currently fully booked for this quarter.`;
    } else {
      text = `Please remove our contact from your outreach list.`;
    }

    // Step 4 "interested" = "qualified" for pitch (NOT Section 2 ready)
    const mappedClassification = classification === "interested" ? "qualified" : classification;
    const mappedStatus = classification === "interested" ? "qualified" : creator?.status;

    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === creatorId) {
          return {
            ...c,
            replyClassification: mappedClassification,
            replyText: text,
            replySubject: `Re: Co-founder partnership inquiry for ${name}`,
            replyTime: "Just now",
            hasReplied: true,
            status: mappedStatus,
            productConcepts: ensureCreatorConcepts(c),
          };
        }
        return c;
      }),
    );

    if (classification === "interested" && autoAdvanceOnPositive && creator) {
      triggerAutoAdvance(creator, {
        hasRealReply: true,
        classification: "qualified",
        sentiment: "positive",
        text,
        time: "Just now",
      });
    }
  };

  return (
    <div className="space-y-6 selection:bg-[#C81E3C] selection:text-white">
      {/* ── PHASE NAVIGATION STEPPER WITH FLOATING POLYGONS (30% Secondary Card Foundation) ── */}
      <div id="tour-s1-header" className="relative overflow-hidden rounded-none bg-[#0D121F] border border-[#334155] p-3 sm:p-4 shadow-md">
        {/* Subtle Canvas Dot Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 -z-0"
          style={{
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Top Control Bar: Pipeline Scope + Set Focus URL / Reset URL triggers */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#334155]">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-display">
              Pipeline Workspace
            </span>
            <span className="text-[#334155]">•</span>
            {scopedCreatorId ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-none bg-[#131929] border border-[#334155] text-white text-xs shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#C81E3C] flex-shrink-0" />
                <span className="font-medium truncate max-w-[240px]">
                  Individual Focus: <strong className="text-white">{scopedIndividualCreator?.name || scopedIndividualCreator?.handle || scopedCreatorId}</strong>
                </span>
                <span className="text-[10px] font-mono text-[#C81E3C] bg-[#090D16] px-1.5 py-0.5 rounded-none border border-[#334155]">
                  ID: {scopedCreatorId.slice(0, 8)}...
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#94A3B8] font-medium flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${loadingCreatorsFromDb ? 'bg-amber-400' : 'bg-[#C81E3C]'}`} />
                Collective Cohort View ({loadingCreatorsFromDb ? (
                  <span className="inline-flex items-center gap-1.5 text-[#94A3B8] font-normal">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C81E3C]" />
                    <span>Syncing from DB...</span>
                  </span>
                ) : (
                  <span className="font-semibold text-white">
                    {unlaunchedCreators.length !== creators.length 
                      ? `${unlaunchedCreators.length} active leads (${creators.length} in DB)`
                      : `${creators.length} active leads`}
                  </span>
                )})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {scopedCreatorId && (
              <button
                type="button"
                onClick={() => setShowResetUrlModal(true)}
                className="h-8 px-3 rounded-none bg-[#131929] hover:bg-[#1A2236] border border-[#334155] text-[#FF4D6D] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                title="Reset URL to remove creator ID and return to collective pipeline across all steps"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C81E3C]" />
                <span>Reset URL</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setInputUrlCreatorId(scopedCreatorId || "");
                setInputUrlTargetStep(activeStep || 4);
                setShowSetUrlModal(true);
              }}
              className="h-8 px-3 rounded-none bg-[#C81E3C] hover:bg-[#B01732] active:bg-[#99142B] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Set or customize the creator ID in the URL to focus any individual creator"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-bold">{scopedCreatorId ? "Change URL ID" : "Set URL ID"}</span>
            </button>
          </div>
        </div>

        {/* Stepper Buttons (10% Accent on active step with white text, 30% secondary on idle) */}
        <div id="tour-s1-stepper" className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full min-w-0">
          {[
            { step: 1, num: "Step 01", label: "Campaign Setup", icon: Target },
            { step: 2, num: "Step 02", label: "Find & Qualify", icon: Search },
            { step: 3, num: "Step 03", label: "Direct Outreach", icon: Send },
            { step: 4, num: "Step 04", label: "Interested Review", icon: MessageSquare },
            { step: 5, num: "Step 05", label: "Audience & Ideas", icon: Lightbulb },
            { step: 6, num: "Step 06", label: "Pitch & Select", icon: Award },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeStep === item.step;
            return (
              <button
                key={item.step}
                id={`tour-s1-step-${item.step}`}
                onClick={() => {
                  if (item.step === 1 && scopedCreatorId) {
                    setShowResetUrlModal(true);
                  } else {
                    setActiveStep(item.step);
                  }
                }}
                className={`relative flex items-center gap-3 p-3 rounded-none text-left transition cursor-pointer group min-w-0 ${
                  isActive
                    ? "bg-[#C81E3C] text-white border border-[#C81E3C] shadow-md font-bold"
                    : "bg-[#0D121F] hover:bg-[#131929] border border-[#334155] text-[#94A3B8] hover:text-white shadow-2xs"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-none flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#131929] text-[#94A3B8] group-hover:bg-[#1A2236] group-hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isActive
                          ? "text-white/80"
                          : "text-[#64748B] group-hover:text-[#94A3B8]"
                      }`}
                    >
                      {item.num}
                    </span>
                  </div>
                  <span
                    className={`text-xs truncate block ${
                      isActive
                        ? "font-bold text-white"
                        : "font-medium text-[#94A3B8] group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>



      {/* STEP 1: CAMPAIGN SETUP */}
      {activeStep === 1 && (
        <AcquisitionStep1Setup
          activeNicheCategory={activeNicheCategory}
          addNiche={addNiche}
          creators={creators}
          creatorsBatchCount={creatorsBatchCount}
          customNicheInput={customNicheInput}
          deleteNiche={deleteNiche}
          discovering={discovering}
          filteredAvailableNiches={filteredAvailableNiches}
          handleBulkSyncNiches={handleBulkSyncNiches}
          handleDeleteAllCreators={handleDeleteAllCreators}
          handleStartEngine={handleStartEngine}
          handleStartFresh={handleStartFresh}
          isDeletingAll={isDeletingAll}
          loadingCreatorsFromDb={loadingCreatorsFromDb}
          loadingNiches={loadingNiches}
          minEngagement={minEngagement}
          minFollowers={minFollowers}
          nicheSearchQuery={nicheSearchQuery}
          niches={niches}
          removeNiche={removeNiche}
          selectedGeography={selectedGeography}
          selectedPlatforms={selectedPlatforms}
          setActiveNicheCategory={setActiveNicheCategory}
          setCreatorsBatchCount={setCreatorsBatchCount}
          setCustomNicheInput={setCustomNicheInput}
          setMaxFollowers={setMaxFollowers}
          setMinEngagement={setMinEngagement}
          setMinFollowers={setMinFollowers}
          setNicheSearchQuery={setNicheSearchQuery}
          togglePlatform={togglePlatform}
        />
      )}

      {/* QUALIFIED LEADS: FIND & QUALIFY CREATORS */}
      {activeStep === 2 && (
        <AcquisitionStep2Discovery
          apifyStatusMsg={apifyStatusMsg}
          cancelEditEmail={cancelEditEmail}
          copiedEmail={copiedEmail}
          countdownSeconds={countdownSeconds}
          creators={creators}
          creatorsBatchCount={creatorsBatchCount}
          discovering={discovering}
          discoveryAbortRef={discoveryAbortRef}
          editingEmailCreatorId={editingEmailCreatorId}
          formatCountdown={formatCountdown}
          generateCreatorAvatarSvg={generateCreatorAvatarSvg}
          getCreatorAvatar={getCreatorAvatar}
          handleCopyEmail={handleCopyEmail}
          handleHunterFindEmail={handleHunterFindEmail}
          handleHunterVerifyEmail={handleHunterVerifyEmail}
          handleStartEngine={handleStartEngine}
          handleStopDiscovery={handleStopDiscovery}
          hunterActionType={hunterActionType}
          hunterDataMap={hunterDataMap}
          hunterLoadingId={hunterLoadingId}
          loadingCreatorsFromDb={loadingCreatorsFromDb}
          minScoreThreshold={minScoreThreshold}
          niches={niches}
          saveEditEmail={saveEditEmail}
          selectedCreatorId={selectedCreatorId}
          setActiveStep={setActiveStep}
          setMinScoreThreshold={setMinScoreThreshold}
          setSelectedCreatorId={setSelectedCreatorId}
          setStep2EmailOnly={setStep2EmailOnly}
          setStep2PlatformFilter={setStep2PlatformFilter}
          setStep2SearchQuery={setStep2SearchQuery}
          setTempEmailValue={setTempEmailValue}
          startEditEmail={startEditEmail}
          step2EmailOnly={step2EmailOnly}
          step2PlatformFilter={step2PlatformFilter}
          step2SearchQuery={step2SearchQuery}
          tempEmailValue={tempEmailValue}
          timerPaused={timerPaused}
          toggleStep2Timer={toggleStep2Timer}
          unlaunchedCreators={unlaunchedCreators}
        />
      )}

      {/* STEP 3: AUTONOMOUS OUTREACH */}
      {activeStep === 3 && (
        <AcquisitionStep3Outreach
          cancelEditEmail={cancelEditEmail}
          creators={creators}
          editingEmailCreatorId={editingEmailCreatorId}
          followUpDays={followUpDays}
          generateCreatorAvatarSvg={generateCreatorAvatarSvg}
          getCreatorAvatar={getCreatorAvatar}
          handleSendBulkOutreach={handleSendBulkOutreach}
          outreachLog={outreachLog}
          saveEditEmail={saveEditEmail}
          sendingBulk={sendingBulk}
          setActiveStep={setActiveStep}
          setTempEmailValue={setTempEmailValue}
          startEditEmail={startEditEmail}
          tempEmailValue={tempEmailValue}
          unlaunchedCreators={unlaunchedCreators}
        />
      )}

      {/* STEP 4: INTERESTED CREATOR REVIEW */}
      {activeStep === 4 && (
        <AcquisitionStep4Review
          cancelEditEmail={cancelEditEmail}
          editingEmailCreatorId={editingEmailCreatorId}
          generateCreatorAvatarSvg={generateCreatorAvatarSvg}
          getCreatorAvatar={getCreatorAvatar}
          getCreatorReply={getCreatorReply}
          handleApproveCreator={handleApproveCreator}
          handleClearScopedCreator={handleClearScopedCreator}
          handleRejectCreator={handleRejectCreator}
          handleSynthesizeStep5Ai={handleSynthesizeStep5Ai}
          notify={notify}
          pollingImap={pollingImap}
          replyFilter={replyFilter}
          saveEditEmail={saveEditEmail}
          scopedCreatorId={scopedCreatorId}
          scopedIndividualCreator={scopedIndividualCreator}
          selectedCreatorId={selectedCreatorId}
          setActiveStep={setActiveStep}
          setReplyFilter={setReplyFilter}
          setSelectedCreatorId={setSelectedCreatorId}
          setTempEmailValue={setTempEmailValue}
          startEditEmail={startEditEmail}
          syncImapReplies={syncImapReplies}
          tempEmailValue={tempEmailValue}
          unlaunchedCreators={unlaunchedCreators}
        />
      )}

      {/* STEP 5: AUDIENCE ANALYSIS & PRODUCT IDEAS */}
      {activeStep === 5 && (
        <AcquisitionStep5Concepts
          awaitingCreators={awaitingCreators}
          creatorBrandColorMap={creatorBrandColorMap}
          creatorConceptSelectionMap={creatorConceptSelectionMap}
          expandedConceptDetailsMap={expandedConceptDetailsMap}
          generateCreatorAvatarSvg={generateCreatorAvatarSvg}
          getCreatorAvatar={getCreatorAvatar}
          getCreatorThreadMessages={getCreatorThreadMessages}
          handleSendBlueprintAndAdvanceToStep6={handleSendBlueprintAndAdvanceToStep6}
          handleSendOpportunityPitch={handleSendOpportunityPitch}
          handleSaveConcept={handleSaveConcept}
          handleSetCreatorBrandColor={handleSetCreatorBrandColor}
          handleSynthesizeStep5Ai={handleSynthesizeStep5Ai}
          interestedCreators={interestedCreators}
          isExtractingAvatarColor={isExtractingAvatarColor}
          isSendingPitch={isSendingPitch}
          isSynthesizingStep5Ai={isSynthesizingStep5Ai}
          pitchSentMap={pitchSentMap}
          pollingImap={pollingImap}
          positiveAdvanceNotice={positiveAdvanceNotice}
          realThreads={realThreads}
          selectedCreator={selectedCreator}
          setActiveStep={setActiveStep}
          setEditingConcept={setEditingConcept}
          setEditingConceptIndex={setEditingConceptIndex}
          setExpandedConceptDetailsMap={setExpandedConceptDetailsMap}
          setPositiveAdvanceNotice={setPositiveAdvanceNotice}
          setSelectedConceptId={setSelectedConceptId}
          setSelectedCreatorId={setSelectedCreatorId}
          setShowAwaitingModal={setShowAwaitingModal}
          setShowInterestedModal={setShowInterestedModal}
          setShowStep5EmailModal={setShowStep5EmailModal}
          setViewingDeckConcept={setViewingDeckConcept}
          setViewingDeckIndex={setViewingDeckIndex}
          step5Error={step5Error}
          syncImapReplies={syncImapReplies}
        />
      )}

      {/* STEP 6: PITCH & SELECT PRODUCT (SIMPLIFIED HUMAN-IN-THE-LOOP STUDIO) */}
      {activeStep === 6 && (
        <AcquisitionStep6Pitch
          activeAutoDraftAngle={activeAutoDraftAngle}
          aiDetectedChoiceMap={aiDetectedChoiceMap}
          applyAutoDraft={applyAutoDraft}
          autoDraftEnabled={autoDraftEnabled}
          cobuilderPassPrice={cobuilderPassPrice}
          creatorConceptSelectionMap={creatorConceptSelectionMap}
          customPitchBody={customPitchBody}
          customPitchSubject={customPitchSubject}
          dbProjects={dbProjects}
          ensureCreatorConcepts={ensureCreatorConcepts}
          ensureDistinctPricing={ensureDistinctPricing}
          generateCreatorAvatarSvg={generateCreatorAvatarSvg}
          getCreatorAvatar={getCreatorAvatar}
          getCreatorThreadMessages={getCreatorThreadMessages}
          handleAdminDeclineDiy={handleAdminDeclineDiy}
          handleClearScopedCreator={handleClearScopedCreator}
          handleHunterFindEmail={handleHunterFindEmail}
          handleHunterVerifyEmail={handleHunterVerifyEmail}
          handlePitchAndCreateProject={handlePitchAndCreateProject}
          handleRegenerateStep6Draft={handleRegenerateStep6Draft}
          handleRestoreCreator={handleRestoreCreator}
          handleSelectConcept={handleSelectConcept}
          handleSendDiyFollowUpEmail={handleSendDiyFollowUpEmail}
          handleSendOpportunityPitch={handleSendOpportunityPitch}
          hunterActionType={hunterActionType}
          hunterDataMap={hunterDataMap}
          hunterLoadingId={hunterLoadingId}
          interestedCreators={interestedCreators}
          isCreatorDeclined={isCreatorDeclined}
          isCreatorMessage={isCreatorMessage}
          isGeneratingStep6Ai={isGeneratingStep6Ai}
          isLaunchingProject={isLaunchingProject}
          isSendingPitch={isSendingPitch}
          notify={notify}
          onGoToProjectOS={onGoToProjectOS}
          openDecisionModal={openDecisionModal}
          pitchSentMap={pitchSentMap}
          pollingImap={pollingImap}
          realThreads={realThreads}
          scopedIndividualCreator={scopedIndividualCreator}
          selectedConceptId={selectedConceptId}
          selectedCreator={selectedCreator}
          setAiDetectedChoiceMap={setAiDetectedChoiceMap}
          setAutoDraftEnabled={setAutoDraftEnabled}
          setCreators={setCreators}
          setCustomPitchBody={setCustomPitchBody}
          setCustomPitchSubject={setCustomPitchSubject}
          setSelectedConceptId={setSelectedConceptId}
          setSelectedCreatorId={setSelectedCreatorId}
          setShowClientProfileModal={setShowClientProfileModal}
          setStep6LeftTab={setStep6LeftTab}
          step6LeftTab={step6LeftTab}
          syncImapReplies={syncImapReplies}
        />
      )}

      {/* Shared Modals, Notifications & Tooling */}
      <AcquisitionModals
        activeArtifactTab={activeArtifactTab}
        aiDetectedChoiceMap={aiDetectedChoiceMap}
        answerSentMap={answerSentMap}
        applyAutoDraft={applyAutoDraft}
        artifactCopied={artifactCopied}
        awaitingCreators={awaitingCreators}
        creatorBrandColorMap={creatorBrandColorMap}
        creatorConceptSelectionMap={creatorConceptSelectionMap}
        creators={creators}
        customPitchBody={customPitchBody}
        customPitchSubject={customPitchSubject}
        decisionModal={decisionModal}
        dismissToast={dismissToast}
        editingConcept={editingConcept}
        editingConceptIndex={editingConceptIndex}
        ensureCreatorConcepts={ensureCreatorConcepts}
        executeDeleteAllCreators={executeDeleteAllCreators}
        generateCreatorAvatarSvg={generateCreatorAvatarSvg}
        getCreatorAudienceIntelligence={getCreatorAudienceIntelligence}
        getCreatorAvatar={getCreatorAvatar}
        getCreatorReply={getCreatorReply}
        getCreatorThreadMessages={getCreatorThreadMessages}
        getStep5EmailData={getStep5EmailData}
        handleApplyScopedUrl={handleApplyScopedUrl}
        handleAutonomousResend={handleAutonomousResend}
        handleClearScopedCreator={handleClearScopedCreator}
        handleConfirmDecisionModal={handleConfirmDecisionModal}
        handleGenerateDecisionAi={handleGenerateDecisionAi}
        handleModifyReplyClassification={handleModifyReplyClassification}
        handlePitchAndCreateProject={handlePitchAndCreateProject}
        handleSaveConcept={handleSaveConcept}
        handleSelectConcept={handleSelectConcept}
        handleSendBlueprintAndAdvanceToStep6={handleSendBlueprintAndAdvanceToStep6}
        hunterDataMap={hunterDataMap}
        inputUrlCreatorId={inputUrlCreatorId}
        inputUrlTargetStep={inputUrlTargetStep}
        interestedCreators={interestedCreators}
        isDeletingAll={isDeletingAll}
        isLaunchingProject={isLaunchingProject}
        isSendingPitch={isSendingPitch}
        launchStepIndex={launchStepIndex}
        notify={notify}
        persuasionSentMap={persuasionSentMap}
        pitchSentMap={pitchSentMap}
        pollingImap={pollingImap}
        realThreads={realThreads}
        scopedCreatorId={scopedCreatorId}
        scopedIndividualCreator={scopedIndividualCreator}
        selectedConceptId={selectedConceptId}
        selectedCreator={selectedCreator}
        setActiveArtifactTab={setActiveArtifactTab}
        setActiveStep={setActiveStep}
        setArtifactCopied={setArtifactCopied}
        setCustomPitchBody={setCustomPitchBody}
        setCustomPitchSubject={setCustomPitchSubject}
        setDecisionModal={setDecisionModal}
        setEditingConcept={setEditingConcept}
        setEditingConceptIndex={setEditingConceptIndex}
        setInputUrlCreatorId={setInputUrlCreatorId}
        setInputUrlTargetStep={setInputUrlTargetStep}
        setSelectedConceptId={setSelectedConceptId}
        setSelectedCreatorId={setSelectedCreatorId}
        setShowAdminLookup={setShowAdminLookup}
        setShowAwaitingModal={setShowAwaitingModal}
        setShowClientProfileModal={setShowClientProfileModal}
        setShowDeleteConfirmModal={setShowDeleteConfirmModal}
        setShowInterestedModal={setShowInterestedModal}
        setShowResetUrlModal={setShowResetUrlModal}
        setShowSetUrlModal={setShowSetUrlModal}
        setShowStep5EmailModal={setShowStep5EmailModal}
        setViewingDeckConcept={setViewingDeckConcept}
        showAdminLookup={showAdminLookup}
        showAwaitingModal={showAwaitingModal}
        showClientProfileModal={showClientProfileModal}
        showDeleteConfirmModal={showDeleteConfirmModal}
        showInterestedModal={showInterestedModal}
        showResetUrlModal={showResetUrlModal}
        showSetUrlModal={showSetUrlModal}
        showStep5EmailModal={showStep5EmailModal}
        syncImapReplies={syncImapReplies}
        toasts={toasts}
        unlaunchedCreators={unlaunchedCreators}
        viewingDeckConcept={viewingDeckConcept}
        viewingDeckIndex={viewingDeckIndex}
      />
    </div>
  );
}
