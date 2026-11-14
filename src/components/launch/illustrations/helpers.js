const DEFAULT_BRAND = "#c81e3c";

export function normalizeBrandHex(input) {
  if (!input || typeof input !== "string") return DEFAULT_BRAND;
  const trimmed = input.trim();
  const full = /^#?([0-9a-f]{6})$/i.exec(trimmed);
  if (full) return `#${full[1].toLowerCase()}`;
  const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(trimmed);
  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  }
  return DEFAULT_BRAND;
}

export function hexToRgbTuple(input) {
  const hex = normalizeBrandHex(input).slice(1);
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

export function rgba(hex, alpha = 1) {
  const [r, g, b] = hexToRgbTuple(hex);
  const clamped = Math.max(0, Math.min(1, Number(alpha) || 0));
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}

export function onBrandInk(hex) {
  const [r, g, b] = hexToRgbTuple(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.36 ? "#08090c" : "#ffffff";
}

export function truncateLabel(value, maxLen = 24) {
  if (value === null || value === undefined || typeof value === "object") return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxLen) return text;
  const budget = Math.max(1, maxLen - 1);
  let cut = text.slice(0, budget);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace >= Math.floor(maxLen * 0.52)) {
    cut = cut.slice(0, lastSpace);
  }
  cut = cut.replace(/[&\s\-—,/|+]+$/g, "").trimEnd();
  if (!cut) cut = text.slice(0, budget).trimEnd();
  return `${cut}…`;
}

export function normalizeArtLabels(
  labels = [],
  fallback = ["Core Workspace", "Automated Setup", "Ready Templates", "Guided Workflow"],
) {
  const out = [];
  if (Array.isArray(labels)) {
    for (const item of labels) {
      const cleaned = truncateLabel(item, 24);
      if (cleaned) out.push(cleaned);
    }
  }
  for (let i = 0; out.length < 4 && i < fallback.length; i += 1) {
    out.push(truncateLabel(fallback[i], 24));
  }
  while (out.length < 4) {
    out.push(truncateLabel(fallback[out.length % fallback.length] || "Workspace Module", 24));
  }
  return out;
}

const TEMPLATE_PATTERNS = [
  {
    kind: "Community",
    re: /\b(community|cohort|forum|member|group|peer|club|mastermind|circle|coaching|q\s*&\s*a|discussion)\b/i,
  },
  {
    kind: "Planner",
    re: /\b(plan|planner|schedule|calendar|roadmap|curriculum|agenda|timeline|sprint|booking|itinerary)\b/i,
  },
  {
    kind: "Tracker",
    re: /\b(track|tracker|habit|check[\s-]?in|streak|milestone|progress|checklist|goal|journal|audit|scorecard)\b/i,
  },
  {
    kind: "Library",
    re: /\b(library|vault|template|asset|pack|playbook|prompt|archive|swipe|resource|directory|toolkit)\b/i,
  },
  {
    kind: "Mobile",
    re: /\b(mobile|companion|ios|android|pocket|notification|reminder|alert|sms|daily[\s-]?ping)\b/i,
  },
  {
    kind: "Dashboard",
    re: /\b(dashboard|analytics|copilot|workflow|automation|pipeline|operating\s*system|os|studio|engine|crm|portal|hub)\b/i,
  },
];

export function kindOf(concept) {
  if (!concept || typeof concept !== "object") return "Dashboard";
  const featureTexts = Array.isArray(concept.keyFeatures)
    ? concept.keyFeatures
        .map((f) => {
          if (typeof f === "string") return f;
          if (f && typeof f === "object") return f.title || f.name || f.label || "";
          return "";
        })
        .filter(Boolean)
    : [];

  const primaryCorpus = [concept.name, concept.tagline].filter(Boolean).join(" ");
  for (const { kind, re } of TEMPLATE_PATTERNS) {
    if (re.test(primaryCorpus)) return kind;
  }

  const fullCorpus = [primaryCorpus, ...featureTexts].filter(Boolean).join(" ");
  for (const { kind, re } of TEMPLATE_PATTERNS) {
    if (re.test(fullCorpus)) return kind;
  }

  return "Dashboard";
}

export function resolveFeatureIconKind(featureTitle) {
  const text = String(featureTitle || "");
  if (/\b(calendar|schedule|plan|planner|agenda|booking|session|week|roadmap)\b/i.test(text)) return "calendar";
  if (/\b(checklist|checklists|workflow|pipeline|automat|task|step|delivery|system|onboarding|setup|streak|habit)\b/i.test(text)) return "checklist";
  if (/\b(chart|analytics|metric|dashboard|insight|report|tracking|tracker|progress|revenue|score)\b/i.test(text)) return "chart";
  if (/\b(chat|comment|community|coaching|collaborat|feedback|forum|group|peer|q\s*&\s*a|mastermind|cohort)\b/i.test(text)) return "chat";
  if (/\b(book|library|vault|template|asset|playbook|guide|course|lesson|resource|swipe|prompt|notion)\b/i.test(text)) return "book";
  if (/\b(bell|alert|notify|notification|reminder|ping|digest|update|email)\b/i.test(text)) return "bell";
  return "check";
}
