/**
 * CoLaunch — AI Generation Service
 *
 * Text:  Google Gemini 2.5 Flash  via /api/gemini proxy   (Gemini key: AIzaSy...)
 * Image: Together.ai FLUX Free    via /api/together proxy  (Together key: free at together.ai)
 *
 * Keys stored in localStorage — never sent to Forge servers.
 */

import { getProjectAudienceGrounding, enrichTasksWithGrounding } from "../utils/audienceGrounding";
import { parseConceptPricing } from "../utils/pricing";

// ── Key management ─────────────────────────────────────────────────────────────

let inMemoryAiKeys = {
  geminiKey: "",
  togetherKey: "",
  openaiKey: "",
  anthropicKey: "",
};

const failedKeys = new Set();

// Whether user has consented to save AI keys to DB
let aiKeysConsentGiven = false;

try {
  inMemoryAiKeys.geminiKey = localStorage.getItem("forge_gemini_api_key") || "";
  const storedOpenaiKey = localStorage.getItem("forge_openai_api_key") || "";
  inMemoryAiKeys.openaiKey = (storedOpenaiKey.endsWith("WOYA") || storedOpenaiKey.endsWith("jwwA"))
    ? (import.meta.env.VITE_OPENAI_API_KEY || "")
    : (storedOpenaiKey || import.meta.env.VITE_OPENAI_API_KEY || "");
  inMemoryAiKeys.anthropicKey = localStorage.getItem("forge_anthropic_api_key") || "";
  aiKeysConsentGiven = localStorage.getItem("forge_ai_keys_consent") === "true";
} catch (e) {
  console.warn("[Forge] Failed to load AI keys from localStorage:", e);
}

export async function ensureServerAiKeysLoaded(force = false) {
  const needsKeys =
    force ||
    !inMemoryAiKeys.geminiKey ||
    !inMemoryAiKeys.openaiKey ||
    failedKeys.has(inMemoryAiKeys.geminiKey) ||
    failedKeys.has(inMemoryAiKeys.openaiKey);

  if (needsKeys) {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.gemini_api_key && (!inMemoryAiKeys.geminiKey || failedKeys.has(inMemoryAiKeys.geminiKey) || force)) {
          inMemoryAiKeys.geminiKey = data.gemini_api_key;
          failedKeys.delete(data.gemini_api_key);
        }
        if (data.openai_api_key && (!inMemoryAiKeys.openaiKey || failedKeys.has(inMemoryAiKeys.openaiKey) || force)) {
          inMemoryAiKeys.openaiKey = data.openai_api_key;
          failedKeys.delete(data.openai_api_key);
        }
        if (data.anthropic_api_key && (!inMemoryAiKeys.anthropicKey || failedKeys.has(inMemoryAiKeys.anthropicKey) || force)) {
          inMemoryAiKeys.anthropicKey = data.anthropic_api_key;
          failedKeys.delete(data.anthropic_api_key);
        }
        if (data.active_ai_provider) {
          inMemoryAiKeys.activeProvider = data.active_ai_provider;
        }
      }
    } catch (e) {
      console.warn("[Forge AI] Could not auto-fetch server AI keys:", e);
    }
  }
  return inMemoryAiKeys;
}

// Auto-trigger loading of backend keys immediately on boot
try {
  ensureServerAiKeysLoaded().catch(() => {});
} catch (_) {}


export function loadAiKeys() {
  const envOpenai = (import.meta.env?.VITE_OPENAI_API_KEY || "").trim();
  const envGemini = (import.meta.env?.VITE_GEMINI_API_KEY || "").trim();
  const envTogether = (import.meta.env?.VITE_TOGETHER_API_KEY || "").trim();
  const envAnthropic = (import.meta.env?.VITE_ANTHROPIC_API_KEY || "").trim();

  return {
    geminiKey: inMemoryAiKeys.geminiKey || envGemini,
    togetherKey: inMemoryAiKeys.togetherKey || envTogether,
    openaiKey: inMemoryAiKeys.openaiKey || envOpenai,
    anthropicKey: inMemoryAiKeys.anthropicKey || envAnthropic,
    activeProvider: inMemoryAiKeys.activeProvider || "openai",
  };
}

export function saveAiKeys({
  geminiKey,
  togetherKey,
  openaiKey,
  anthropicKey,
}) {
  failedKeys.clear();
  if (geminiKey !== undefined) {
    inMemoryAiKeys.geminiKey = (geminiKey || "").trim();
    try {
      localStorage.setItem("forge_gemini_api_key", inMemoryAiKeys.geminiKey);
    } catch (e) { }
  }
  if (togetherKey !== undefined) {
    inMemoryAiKeys.togetherKey = (togetherKey || "").trim();
    try {
      localStorage.setItem(
        "forge_together_api_key",
        inMemoryAiKeys.togetherKey,
      );
    } catch (e) { }
  }

  if (openaiKey !== undefined) {
    const val = (openaiKey || "").trim();
    inMemoryAiKeys.openaiKey = (val.endsWith("jwwA") || val.endsWith("WOYA")) ? "" : val;
    try {
      if (inMemoryAiKeys.openaiKey) {
        localStorage.setItem("forge_openai_api_key", inMemoryAiKeys.openaiKey);
      } else {
        localStorage.removeItem("forge_openai_api_key");
      }
    } catch (e) { }
  }
  if (anthropicKey !== undefined) {
    inMemoryAiKeys.anthropicKey = (anthropicKey || "").trim();
    try {
      localStorage.setItem(
        "forge_anthropic_api_key",
        inMemoryAiKeys.anthropicKey,
      );
    } catch (e) { }
  }
}


export function hasGeminiKey() {
  const { geminiKey } = loadAiKeys();
  return !!geminiKey;
}

export function hasTogetherKey() {
  const { togetherKey } = loadAiKeys();
  return !!togetherKey;
}




// ── DB-persisted AI keys (user-consented) ──────────────────────────────────────

export function getAiKeysConsent() {
  return aiKeysConsentGiven;
}

export function setAiKeysConsent(value) {
  aiKeysConsentGiven = !!value;
  try {
    localStorage.setItem("forge_ai_keys_consent", String(aiKeysConsentGiven));
  } catch (e) { }
}

export async function saveAiKeysToDb(username) {
  if (!username) return;
  const keys = loadAiKeys();
  try {
    const res = await fetch("/api/auth/save-ai-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        ai_keys: {
          geminiKey: keys.geminiKey,
          togetherKey: keys.togetherKey,

          openaiKey: keys.openaiKey,
          anthropicKey: keys.anthropicKey,
        },
      }),
    });
    const data = await res.json();
    console.log("[Forge] saveAiKeysToDb response:", data);
    if (!res.ok) throw new Error("Failed to save AI keys");
    return true;
  } catch (err) {
    console.error("[Forge] Failed to save AI keys to DB:", err);
    return false;
  }
}

export async function deleteAiKeysFromDb(username) {
  if (!username) return;
  try {
    const res = await fetch("/api/auth/delete-ai-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    console.log("[Forge] deleteAiKeysFromDb response:", data);
    aiKeysConsentGiven = false;
  } catch (err) {
    console.error("[Forge] Failed to delete AI keys from DB:", err);
  }
}


// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n) {
  n = parseInt(n) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// ── Gemini call ────────────────────────────────────────────────────────────────

// ── Gemini call ────────────────────────────────────────────────────────────────

async function geminiCall(
  prompt,
  systemPrompt,
  maxTokens = 8192,
  signal = undefined,
  jsonMode = true,
) {
  const { geminiKey } = loadAiKeys();
  if (!geminiKey) throw new Error("NO_GEMINI_KEY");

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.85,
    },
  };

  if (jsonMode) {
    body.generationConfig.responseMimeType = "application/json";
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, 45000);

  let activeSignal = timeoutController.signal;
  if (signal) {
    signal.addEventListener("abort", () => timeoutController.abort());
    if (signal.aborted) {
      timeoutController.abort();
    }
  }

  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];
  let lastErr = null;

  for (const model of candidateModels) {
    const url = `/api/gemini/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: activeSignal,
      });

      if (!res.ok) {
        const errText = await res.text();
        lastErr = new Error(`Gemini ${model} ${res.status}: ${errText.slice(0, 300)}`);
        // If 404 or 400 (e.g. model name not available in this region/key), try next candidate
        if (res.status === 404 || res.status === 400) {
          continue;
        }
        throw lastErr;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) throw new Error("Gemini returned empty response");

      clearTimeout(timeoutId);

      if (jsonMode) {
        const cleaned = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        try {
          return JSON.parse(cleaned);
        } catch (err) {
          console.error("[Forge] Gemini JSON parse failed. Raw response:", text);
          throw err;
        }
      }

      return text;
    } catch (err) {
      if (err.name === "AbortError") {
        clearTimeout(timeoutId);
        if (signal && signal.aborted) throw err;
        throw new Error("Gemini request timed out after 45s");
      }
      lastErr = err;
    }
  }

  clearTimeout(timeoutId);
  throw lastErr || new Error("All Gemini candidate models failed");
}

// ── Anthropic Call ─────────────────────────────────────────────────────────────

async function anthropicCall(
  prompt,
  systemPrompt,
  maxTokens = 4096,
  signal = undefined,
  jsonMode = true,
) {
  const { anthropicKey } = loadAiKeys();
  if (!anthropicKey) throw new Error("NO_ANTHROPIC_KEY");

  const url = "/api/anthropic/v1/messages";

  const body = {
    model: "claude-opus-4-6",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  if (jsonMode) {
    body.output_config = {
      format: {
        type: "json_schema",
        name: "GenericResponse",
        schema: {
          type: "object",
          additionalProperties: true,
        },
      },
    };
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, 45000);

  let activeSignal = timeoutController.signal;
  if (signal) {
    signal.addEventListener("abort", () => timeoutController.abort());
    if (signal.aborted) {
      timeoutController.abort();
    }
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: activeSignal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text || "";
    if (!text) throw new Error("Anthropic returned empty response");

    if (jsonMode) {
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      try {
        return JSON.parse(cleaned);
      } catch (err) {
        console.error(
          "[Forge] Anthropic JSON parse failed. Raw response:",
          text,
        );
        throw err;
      }
    }

    return text;
  } catch (err) {
    if (err.name === "AbortError") {
      if (signal && signal.aborted) {
        throw err;
      }
      throw new Error("Anthropic Claude request timed out after 45s");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── OpenAI Call ───────────────────────────────────────────────────────────────

async function openaiCall(
  prompt,
  systemPrompt,
  maxTokens = 4096,
  signal = undefined,
  jsonMode = true,
) {
  const { openaiKey } = loadAiKeys();
  if (!openaiKey) throw new Error("NO_OPENAI_KEY");

  const messages = [];
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }
  messages.push({
    role: "user",
    content: prompt,
  });

  const body = {
    model: "gpt-4o",
    messages: messages,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, 45000);

  let activeSignal = timeoutController.signal;
  if (signal) {
    signal.addEventListener("abort", () => timeoutController.abort());
    if (signal.aborted) {
      timeoutController.abort();
    }
  }

  try {
    const res = await fetch("/api/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(body),
      signal: activeSignal,
    });

    if (!res.ok) {
      const err = await res.text();
      // Fallback attempt with Responses API if chat/completions fails
      if (res.status === 404 || res.status === 400) {
        return await openaiResponsesCall(
          prompt,
          systemPrompt,
          maxTokens,
          signal,
          jsonMode,
        );
      }
      throw new Error(`OpenAI Chat API ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";

    if (!text) throw new Error("OpenAI returned empty response");

    if (jsonMode) {
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      try {
        return JSON.parse(cleaned);
      } catch (err) {
        console.error("[Forge] OpenAI JSON parse failed. Raw response:", text);
        throw err;
      }
    }

    return text;
  } catch (err) {
    if (err.name === "AbortError") {
      if (signal && signal.aborted) {
        throw err;
      }
      throw new Error("OpenAI request timed out after 45s");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function openaiResponsesCall(
  prompt,
  systemPrompt,
  maxTokens = 4096,
  signal = undefined,
  jsonMode = true,
) {
  const { openaiKey } = loadAiKeys();
  const input = [];
  if (systemPrompt)
    input.push({
      role: "system",
      content: [{ type: "input_text", text: systemPrompt }],
    });
  input.push({ role: "user", content: [{ type: "input_text", text: prompt }] });

  const body = { model: "gpt-5.5", input, max_output_tokens: maxTokens };
  if (jsonMode) body.text = { format: { type: "json_object" } };

  const res = await fetch("/api/openai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`OpenAI Responses API ${res.status}`);
  const data = await res.json();
  const text = data.output_text || data.output?.[0]?.content?.[0]?.text || "";
  if (!text) throw new Error("OpenAI Responses empty");
  return jsonMode
    ? JSON.parse(
      text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim(),
    )
    : text;
}

// ── AI Text Call Dispatcher (OpenAI -> Anthropic -> Gemini) ───────────────────

async function aiTextCall(
  prompt,
  systemPrompt,
  maxTokens = 8192,
  signal = undefined,
  jsonMode = true,
) {
  await ensureServerAiKeysLoaded();
  const { openaiKey, anthropicKey, geminiKey } = loadAiKeys();

  // 1. OpenAI (Primary for analysis)
  if (openaiKey && !failedKeys.has(openaiKey)) {
    try {
      return await openaiCall(
        prompt,
        systemPrompt,
        maxTokens,
        signal,
        jsonMode,
      );
    } catch (err) {
      if (err.name === "AbortError") throw err;
      if (err.message.includes("401") || err.message.includes("429")) {
        failedKeys.add(openaiKey);
      }
      console.warn("[Forge] OpenAI call failed, trying fallback:", err);
    }
  }

  // 2. Google Gemini (Fallback)
  if (geminiKey && !failedKeys.has(geminiKey)) {
    try {
      return await geminiCall(
        prompt,
        systemPrompt,
        maxTokens,
        signal,
        jsonMode,
      );
    } catch (err) {
      if (err.name === "AbortError") throw err;
      if (err.message.includes("401") || err.message.includes("429")) {
        failedKeys.add(geminiKey);
      }
      console.warn("[Forge] Gemini call failed, trying fallback:", err);
    }
  }

  // 3. Anthropic Claude (Tertiary)
  if (anthropicKey && !failedKeys.has(anthropicKey)) {
    try {
      return await anthropicCall(
        prompt,
        systemPrompt,
        maxTokens,
        signal,
        jsonMode,
      );
    } catch (err) {
      if (err.name === "AbortError") throw err;
      if (err.message.includes("401") || err.message.includes("429")) {
        failedKeys.add(anthropicKey);
      }
      console.warn(
        "[Forge] Anthropic Claude call failed, trying fallback:",
        err,
      );
    }
  }

  // Last resort: clear stale failedKeys, force-reload from server, retry Gemini once
  failedKeys.clear();
  await ensureServerAiKeysLoaded(true);
  const refreshed = loadAiKeys();
  if (refreshed.geminiKey) {
    try {
      return await geminiCall(prompt, systemPrompt, maxTokens, signal, jsonMode);
    } catch (retryErr) {
      if (retryErr.name === "AbortError") throw retryErr;
      console.warn("[Forge] Final Gemini retry after key refresh failed:", retryErr);
    }
  }
  if (refreshed.openaiKey) {
    try {
      return await openaiCall(prompt, systemPrompt, maxTokens, signal, jsonMode);
    } catch (retryErr) {
      if (retryErr.name === "AbortError") throw retryErr;
      console.warn("[Forge] Final OpenAI retry after key refresh failed:", retryErr);
    }
  }

  throw new Error("NO_ACTIVE_AI_KEY");
}


// ── Channel-Specific Image Prompt Builder ─────────────────────────────────────

export function buildChannelSpecificImagePrompt(creatorData, stylePreset = 'saas_dashboard', customColor = null) {
  const name = creatorData?.name || (creatorData?.handle || 'Creator').replace(/^@+/, '')
  const productName = creatorData?.productName || creatorData?.blueprint?.name || `${name} Pro Suite`
  const niche = (creatorData?.niche || 'creator community').toLowerCase()
  const brandColor = customColor || creatorData?.brandColor || '#c81e3c'

  const colorDirective = `Dominant brand accent color: ${brandColor} (RGB: 200, 30, 60). All UI telemetry graphs, illuminated action buttons, glow halos, and metric bars must strictly use this signature website color ${brandColor}. Deep obsidian matte black canvas (#09090c) and carbon finish. Crisp white typography. Strictly NO lime green, NO neon green.`

  if (stylePreset === 'multi_device') {
    return `Ultra-realistic commercial product photography of an Apple MacBook Pro and iPhone 16 Pro displaying "${productName}" by ${name} in ${niche}. Both screens feature a high-end dark mode interface with striking glowing ${brandColor} telemetry charts, revenue metrics, and interactive widgets. Sleek graphite desk, shallow depth of field, studio edge lighting. ${colorDirective} Photorealistic 8k commercial render.`
  }

  if (stylePreset === 'studio_desk') {
    return `Minimalist executive creator studio desk setup showcasing "${productName}" by ${name}. 32-inch high-resolution pro studio display presenting the software workspace with glowing ${brandColor} telemetry accents, custom keyboard with subtle ${brandColor} underglow, studio monitor speakers, and cinematic moody ambient lighting. ${colorDirective} Commercial product photography style, ultra-sharp 8k.`
  }

  if (stylePreset === 'isometric_3d') {
    return `Striking 3D isometric floating tech workspace and software ecosystem for "${productName}" by ${name} in ${niche}. Sleek glassmorphism cards, floating translucent UI panels, glowing ${brandColor} data streams, clean metric indicators, dark graphite baseplate, and volumetric laser illumination. ${colorDirective} Octane Render 8k, ultra-detailed 3D digital art.`
  }

  if (stylePreset === 'cyberpunk') {
    return `Futuristic dark cyberdeck control center for "${productName}" by ${name}. Ultra-high-contrast matte black interface with intense neon ${brandColor} accents, real-time live telemetry feeds, radar widgets, and high-frequency spark charts. ${colorDirective} Blade Runner aesthetic, ultra-sharp 8k UI render.`
  }

  // Default: saas_dashboard
  return `Ultra-high-resolution commercial product hero mockup and UI software screenshot for "${productName}" by ${name} in ${niche}. A cutting-edge digital workspace on a sleek matte black and deep graphite canvas with striking signature ${brandColor} accent lighting, glowing red interactive CTA buttons, clean developer dashboard panels, live telemetry streams, and crisp white typography. ${colorDirective} Premium modern aesthetic matching Marques Brownlee studio style, photorealistic, 8k render.`
}




// ── Channel-Calibrated Product Fallback Image ────────────────────────────────
export function getChannelHeroFallbackImage(creatorData) {
  const niche = (creatorData?.niche || '').toLowerCase();
  if (niche.includes('music') || niche.includes('worship')) {
    return '/images/hero_saas_macbook.jpg';
  }
  return '/images/saas_multi_device_showcase.jpg';
}


function featureTitle(f) {
  const raw = typeof f === "string" ? f : f?.title || f?.name || "";
  return String(raw).split(/:| - | — /)[0].trim().slice(0, 28);
}

export function buildProductScreenPrompt(project, { brandColor = "#c81e3c", direction = "", style = "screen" } = {}) {
  const concept = project?.selectedConcept || project || {};
  const productName = project?.productName || concept.productName || concept.name || "the product";
  const tagline = project?.productTagline || concept.tagline || "";
  const niche = Array.isArray(project?.niche) ? project.niche.join(", ") : (project?.niche || "");
  const customer = concept.customer || project?.targetAudience || "";
  const rawFeatures = concept.keyFeatures || project?.keyFeatures || project?.features || [];
  const titles = rawFeatures.map(featureTitle).filter(Boolean).slice(0, 4);
  const f = (i, fallback) => titles[i] || fallback;
  const idx = [concept.landingIndex, project?.conceptIndex, project?.selectedConceptIndex, concept.index].find(Number.isInteger);
  const archetype = concept.archetype || (idx === 1 ? "copilot" : idx === 2 ? "vault" : "workflow");

  // Main working area per concept type, filled with plausible sample content.
  const main = {
    workflow:
      `MAIN AREA: a pipeline board titled "${f(0, "Active workflow")}" with 4 columns ("To do", "In progress", "Review", "Done"). ` +
      `Each column holds 2-3 cards; every card has a short realistic task title, a small coloured tag, a due date like "Nov 24", a tiny progress bar and a circular avatar with initials. ` +
      `Above the board: a segmented control ("Board", "List", "Timeline") and a primary button "+ New ${f(0, "item").split(" ")[0]}".`,
    copilot:
      `MAIN AREA: an AI assistant workspace. A large prompt box at the bottom with a "Generate" button in the accent colour. ` +
      `Above it, one user question and a rich structured AI answer card: a bold heading, 3 bullet points with short real sentences, a small comparison table (3 rows, 3 columns), and source chips underneath. ` +
      `A right side panel titled "${f(1, "Saved insights")}" lists 5 saved items with dates.`,
    vault:
      `MAIN AREA: a members-only resource library. A search bar and filter chips ("All", "${f(0, "Playbooks")}", "${f(1, "Sessions")}", "${f(2, "Templates")}"). ` +
      `Below, a 3-column grid of 6 content cards, each with a cover thumbnail made of abstract gradient shapes, a title, a category tag, a duration or page count, a progress bar, and a bookmark icon. ` +
      `A right panel shows an "Upcoming live session" card with date, time and a "Join" button.`,
  }[archetype] || "";

  const screen =
    `High-fidelity UI design of a premium SaaS web app dashboard called "${productName}"` +
    (tagline ? ` — ${tagline}` : "") + (niche ? `, built for the ${niche} audience` : "") +
    (customer ? ` (users: ${customer})` : "") + ". " +
    `Desktop browser screen, 16:9, viewed perfectly straight-on, filling the whole frame, no device frame, no background scene. ` +
    `LAYOUT: ` +
    `TOP BAR: product wordmark "${productName}" with a small geometric logo mark on the left, a search field "Search…", a notification bell with a red dot, and a round user avatar with initials on the right. ` +
    `LEFT SIDEBAR: navigation with icons — "Dashboard" (active, highlighted in the accent colour), "${f(0, "Workflows")}", "${f(1, "Insights")}", "${f(2, "Library")}", "${f(3, "Community")}", "Settings"; a small upgrade card at the bottom. ` +
    `KPI ROW: 4 metric cards with realistic sample numbers, small trend arrows (green up, red down) and tiny sparklines — e.g. "Active members 1,284 +12%", "${f(0, "Sessions")} completed 3,942", "Avg. engagement 68%", "Retention 91%". ` +
    `CHART: a smooth area line chart "Last 30 days" with gridlines, axis labels and a hover tooltip, next to a small donut chart with a 3-item legend. ` +
    `${main} ` +
    `STYLE: modern, polished product UI in the quality of Linear, Vercel or Stripe dashboards. Near-black background (#0b0b0d), card surfaces #141417 with 1px subtle borders, ` +
    `crisp white and grey sans-serif typography (Inter-like) with clear hierarchy, accent colour ${brandColor} for the active nav item, primary buttons, chart line and highlights, ` +
    `secondary accents in soft emerald and amber for status tags. Dense but airy spacing, consistent 8px grid, subtle shadows, pixel-perfect alignment, retina-sharp. ` +
    `All text must be legible, correctly spelled English; spell "${productName}"${titles.length ? ` and ${titles.map((t) => `"${t}"`).join(", ")}` : ""} exactly. ` +
    `No lorem ipsum, no gibberish, no real brand logos, no watermark, no photos of real people.`;

  const base = screen; // product dashboard screen only (laptop/phone desk shot removed)
  const extra = direction && direction.trim() ? ` Creator direction (follow it): ${direction.trim().slice(0, 300)}.` : "";
  return `${base}${extra}`;
}

// ── OpenAI DALL-E 3 image generation ─────────────────────────────────────────

export async function generateProductImageWithOpenAI(
  creatorData,
  promptOverride = null,
  signal = undefined,
  imageOpts = {},
) {
  const { openaiKey } = loadAiKeys();
  if (!openaiKey) {
    throw new Error("NO_OPENAI_KEY: Please enter an active OpenAI API key in Settings to generate DALL-E images.");
  }

  const prompt = promptOverride || buildChannelSpecificImagePrompt(creatorData);

  // Preferred: GPT Sunburst image models (2.6, then 2.5). Fallbacks: gpt-image-1, then DALL-E 3.
  const candidateModels = ["gpt-image-2.6-sunburst", "gpt-image-2.5-sunburst", "gpt-image-1", "dall-e-3"];
  const wantsLandscape = String(imageOpts.size || "").startsWith("1792") || String(imageOpts.size || "").startsWith("1536");
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const payload = {
        model,
        prompt: prompt.slice(0, model === "dall-e-3" ? 4000 : 32000),
        n: 1,
      };
      if (model.startsWith("gpt-image")) {
        payload.size = wantsLandscape ? "1536x1024" : (imageOpts.size === "1024x1792" ? "1024x1536" : imageOpts.size || "1024x1024");
        payload.quality = imageOpts.quality === "hd" || imageOpts.quality === "high" ? "high" : (imageOpts.quality || "high");
      } else {
        payload.size = wantsLandscape ? "1792x1024" : (imageOpts.size || "1024x1024");
        payload.quality = imageOpts.quality === "high" || imageOpts.quality === "hd" ? "hd" : "standard";
        payload.style = "vivid";
      }

      const res = await fetch("/api/openai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.data?.[0]?.b64_json) {
          return `data:image/png;base64,${data.data[0].b64_json}`;
        }
        if (data?.data?.[0]?.url) {
          return data.data[0].url;
        }
      }

      let errMsg = `OpenAI status ${res.status}`;
      try {
        const errData = await res.json();
        if (errData?.error?.message) errMsg = errData.error.message;
      } catch (_) {
        try {
          const errText = await res.text();
          if (errText) errMsg = errText.slice(0, 200);
        } catch (__) {}
      }

      if (res.status === 401) {
        failedKeys.add(openaiKey);
        try {
          if (localStorage.getItem("forge_openai_api_key") === openaiKey) {
            localStorage.removeItem("forge_openai_api_key");
          }
          if (inMemoryAiKeys.openaiKey === openaiKey) {
            inMemoryAiKeys.openaiKey = "";
          }
        } catch (_) {}
        throw new Error(`OpenAI Key Expired: ${errMsg}`);
      }

      lastError = new Error(`OpenAI ${model} Error (${res.status}): ${errMsg}`);
    } catch (err) {
      if (err.name === "AbortError" || err.message?.includes("OpenAI Key Expired")) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate image with OpenAI");
}

async function saveImageToBackendMedia(imageResult) {
  if (!imageResult) return null;
  // If it's already a local static asset (e.g. /images/...), return immediately
  if (typeof imageResult === "string" && imageResult.startsWith("/images/")) {
    return imageResult;
  }
  try {
    const res = await fetch("/api/media/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_data: imageResult }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        console.log(
          "[Forge] Successfully saved generated image to backend:",
          data.url,
        );
        return data.url;
      }
    }
  } catch (err) {
    console.warn(
      "[Forge] Failed to save generated image to backend static media:",
      err,
    );
  }
  return imageResult;
}

export async function generateProductImage(creatorData, optionsOrSignal = {}) {
  try {
    await ensureServerAiKeysLoaded();
  } catch (_) {}

  const isSignal = optionsOrSignal && typeof optionsOrSignal === 'object' && 'aborted' in optionsOrSignal;
  const options = isSignal ? {} : (optionsOrSignal || {});
  const signal = isSignal ? optionsOrSignal : options.signal;

  const brandColor = options.brandColor || creatorData?.brandColor || '#c81e3c';
  const customPrompt = options.prompt || '';
  const stylePreset = options.style || 'saas_dashboard';

  const finalPrompt = (customPrompt && customPrompt.trim())
    ? (customPrompt.includes(brandColor) ? customPrompt : `${customPrompt}. Dominant brand accent color: ${brandColor}. Dark obsidian UI, crisp white typography, strictly no lime green.`)
    : buildChannelSpecificImagePrompt(creatorData, stylePreset, brandColor);

  let rawImage = null;

  // Strictly OpenAI DALL-E 3 image generation
  try {
    rawImage = await generateProductImageWithOpenAI(creatorData, finalPrompt, signal, {
      size: options.size,
      quality: options.quality,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('[Forge] OpenAI DALL-E generation notice:', err);
    throw err;
  }

  if (!rawImage) {
    rawImage = getChannelHeroFallbackImage(creatorData);
  }

  return await saveImageToBackendMedia(rawImage);
}

// ── askForgeChat ───────────────────────────────────────────────────────────────

export async function askForgeChat(message, history, creatorData) {
  const niche = creatorData.niche || "content creation";
  const productName = creatorData.productName || "Creator Academy";
  const name =
    creatorData.name || creatorData.handle?.replace("@", "") || "creator";
  const handle = creatorData.handle || "@creator";
  const followers = creatorData.followers
    ? fmt(creatorData.followers)
    : "growing";
  const platform = creatorData.platform || "social media";

  const systemPrompt = `You are "Forge", an elite, sharp, and highly strategic AI cofounder for creators. 
You are chatting with ${name} (${handle}), a ${niche} creator on ${platform} with ${followers} followers. 
Their main product is "${productName}".

Keep your responses direct, highly tactical, actionable, and conversational (never overly polite or verbose). 
Use formatting like bullet points or bold tags (**phrase**) to highlight critical insights. 
Ensure you sound like a trusted partner who knows the creator economy inside out.

Do NOT output JSON. Output raw text with markdown formatting (using **bold** for emphasis, but no headers like ###).`;

  const formattedHistory = history
    .map(
      (msg) =>
        `${msg.role === "forge" || msg.role === "coach" ? "Coach" : "User"}: ${msg.content || msg.text || ""}`,
    )
    .join("\n\n");
  const finalPrompt = `Conversation History:\n\n${formattedHistory}\n\nUser: ${message}\n\nCoach:`;

  return aiTextCall(finalPrompt, systemPrompt, 8192, undefined, false);
}

// ── generateStudioContent ──────────────────────────────────────────────────────

export async function generateStudioContent(
  contentType,
  inputContext,
  creatorData,
  tone = "Confident",
  signal = undefined,
) {
  const name =
    creatorData.name || creatorData.handle?.replace("@", "") || "this creator";
  const handle = creatorData.handle || "@creator";
  const platform = creatorData.platform || "social media";
  const followers = creatorData.followers
    ? fmt(creatorData.followers)
    : "growing";
  const engRate = creatorData.engagementRate
    ? `${creatorData.engagementRate}%`
    : "solid";
  const niche = creatorData.niche || "content creation";
  const productName = creatorData.productName || "Creator Academy";
  const blueprint = creatorData.blueprint;
  const productDesc = blueprint?.description || `a premium ${niche} platform`;
  const bio = creatorData.description
    ? `\nBio: "${creatorData.description.slice(0, 150)}"`
    : "";

  const cleanHandle = (creatorData.handle || 'creator').replace(/^@+/, '')
  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/member/${cleanHandle}`
    : `https://colaunch-2.vercel.app/member/${cleanHandle}`

  const system = `You are an elite creator economy copywriter. You write highly engaging, high-conversion copy for creators. Return ONLY a JSON object containing a "content" field with the generated copy text.`;

  const prompt = `Write a piece of copy with the following requirements:
Content Type: ${contentType.label} (${contentType.platform})
Tone: ${tone}
Creator Name: ${name} (${handle})
Platform: ${platform} (${followers} followers, ${engRate} engagement)
Niche: ${niche}${bio}
Product Launching: "${productName}" — ${productDesc}
Live Member Portal Link: ${portalUrl}
${inputContext ? `Additional Context/Instructions: ${inputContext}` : ""}

Write native, high-impact, authentic copy for this specific content type. Avoid generic templates, make it sound like a real creator on that platform. Use line breaks and emojis where appropriate for the platform.
CRITICAL: If you include a link or call-to-action, use strictly the Live Member Portal Link: ${portalUrl}. NEVER output bracketed placeholders like [Link to your documentation/GitHub/blog post here] or [Link to ...].

Return exactly this JSON:
{
  "content": "the generated copy here, with formatting, line breaks, or paragraphs if needed"
}`;

  try {
    const data = await aiTextCall(prompt, system, 8192, signal, true);
    let content = data.content || "";
    if (content) {
      content = content
        .replace(/\[Link to your documentation\/GitHub\/blog post here\]/gi, portalUrl)
        .replace(/\[Link to Documentation\/GitHub\/Landing Page\]/gi, portalUrl)
        .replace(/\[Link to [^\]]+\]/gi, portalUrl)
        .replace(/\[(?:Link|your link|link to waitlist|link to product|link to github|link to documentation)[^\]]*\]/gi, portalUrl)
        .replace(/\[(?:https?:\/\/)?[^\]]*(?:link|url|github|documentation|blog|landing|waitlist)[^\]]*\]/gi, portalUrl);
    }
    return content;
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(`AI generation failed: ${err.message}`);
  }
}

export function extractCalendarArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
    for (const key of Object.keys(data)) {
      if (data[key] && typeof data[key] === "object") {
        const nested = extractCalendarArray(data[key]);
        if (nested) return nested;
      }
    }
  }
  return null;
}




/**
 * Robust follower parsing that handles numeric values and strings like "455K", "1.2M", "10,500".
 */
export function parseFollowerCount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  if (!val) return 0;
  const s = String(val).replace(/,/g, '').trim().toLowerCase();
  const m = s.match(/([\d.]+)\s*([kmb])?/);
  if (m) {
    const num = parseFloat(m[1]) || 0;
    const unit = m[2];
    if (unit === 'b') return Math.round(num * 1_000_000_000);
    if (unit === 'm') return Math.round(num * 1_000_000);
    if (unit === 'k') return Math.round(num * 1_000);
    return Math.round(num);
  }
  return parseInt(s) || 0;
}



export async function generateValidationPlanAI(
  projectData,
  signal = undefined,
) {
  const chosen = projectData?.selectedConcept || projectData?.selected_concept || {}
  const product =
    chosen.name || projectData?.productName || projectData?.title || "the SaaS product";
  const creator =
    projectData?.creatorName ||
    projectData?.handle?.replace("@", "") ||
    "Creator";
  const niche =
    projectData?.niche || projectData?.category || "Tech & Creator Economy";
  const tagline =
    chosen.tagline ||
    projectData?.productTagline ||
    projectData?.description ||
    "High-leverage product";
  const problem =
    chosen.problem ||
    projectData?.problem ||
    "Fragmented manual workflows and lost efficiency";
  const audience =
    chosen.customer ||
    chosen.demographicAlignment ||
    projectData?.targetAudience ||
    projectData?.customer ||
    `${creator}'s audience and ${niche} professionals`;
  const model =
    chosen.pricing ||
    projectData?.revenueModel ||
    projectData?.pricingModel ||
    projectData?.pricing ||
    "$89/yr founding access";
  const followers = projectData?.followers || projectData?.followerStr || "250K";
  const difficulty = chosen.mvpDifficulty || projectData?.mvpDifficulty || "not estimated yet";

  const system = `You are an elite product incubator strategist specializing in creator co-launches and pre-sale validation gates. You generate concrete, quantified, and realistic validation plan specifications. 
CRITICAL RULE: DO NOT use static or default numbers for target revenue or validation period. You MUST analyze the creator's audience scale (${followers}), unit price (${model}), and MVP complexity (${difficulty}) to compute a custom revenue threshold and optimal sprint timeline.
Return ONLY a valid JSON object matching the requested schema with no surrounding text or markdown outside the JSON.`;

  const prompt = `Generate a comprehensive, customized validation plan specification for this co-launch product:
Product Name: ${product}
Tagline: ${tagline}
Core Problem Solved: ${problem}
Creator Co-Founder: ${creator}
Audience / Reach: ${followers} Followers
Niche: ${niche}
Target Audience: ${audience}
Proposed Pricing/Model: ${model}
MVP Difficulty/Complexity: ${difficulty}

CALCULATION INSTRUCTIONS:
1. "threshold": Compute a mathematically sound revenue milestone (e.g. for 250K followers @ $89 = $12,500 or 140 paid reservations; for 50K followers @ $29 = $2,500 or 80 reservations).
2. "period": Determine the exact validation sprint days (e.g. '10 days', '14 days', '18 days', or '21 days') based on product complexity and creator video publishing cadence.

Return a valid JSON object with the following exact keys:
{
  "customer": "Specific description of the exact high-intent sub-segment who will pay first (2-3 sentences)",
  "problem": "The acute, expensive, and frustrating pain point this product solves immediately (2-3 sentences)",
  "offer": "Founding member pre-sale offer including perks, early alpha access, discount, and onboarding guarantee (2-3 sentences)",
  "pricing": "Exact price point for pre-order and reservation deposit terms (e.g. '$89 founding annual pass with a $18 refundable reservation deposit')",
  "testMethod": "Exact 3-step test methodology: 1) Creator announcement & video CTA, 2) Direct interviews with 10 qualified leads, 3) Targeted founding member pre-sale window collecting real money, not just email opt-ins (3-4 sentences)",
  "period": "AI-calculated optimal sprint timeline (e.g. '18 days' or '10 days')",
  "threshold": "AI-calculated quantified success threshold criteria based on audience size (e.g. '$12,500 collected or 140 paid reservations from qualified prospects')"
}

Ensure all fields are realistic, concrete, and tailored specifically to "${product}" and "${creator}".`;

  try {
    const data = await aiTextCall(prompt, system, 4096, signal, true);
    let resObj = null;
    if (typeof data === "string") {
      const cleaned = data
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      resObj = JSON.parse(cleaned);
    } else if (data && typeof data === "object") {
      resObj = data.validationPlan || data.plan || data;
    }

    if (resObj && (resObj.customer || resObj.problem || resObj.offer)) {
      const missing = ["customer", "problem", "offer", "pricing", "testMethod", "period", "threshold"].filter((k) => !String(resObj[k] || "").trim());
      if (missing.length) throw new Error(`The AI left out: ${missing.join(", ")}. Try again.`);
      return {
        customer: String(resObj.customer),
        problem: String(resObj.problem),
        offer: String(resObj.offer),
        pricing: String(resObj.pricing),
        testMethod: String(resObj.testMethod),
        period: String(resObj.period),
        threshold: String(resObj.threshold),
      };
    }
    throw new Error("Incomplete validation plan schema");
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.warn("[Forge AI] Validation plan generation failed:", err);
    throw err;
  }
}


export function getBaseAppOrigin() {
  const envUrl = import.meta.env?.VITE_FRONTEND_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return 'https://colaunch-frontend.vercel.app'
}


export async function generateValidationCampaignKitAI(
  projectData,
  optionsOrSignal = {},
  maybeSignal = undefined,
) {
  let options = {};
  let signal = undefined;

  if (optionsOrSignal instanceof AbortSignal) {
    signal = optionsOrSignal;
  } else if (optionsOrSignal && typeof optionsOrSignal === "object") {
    options = optionsOrSignal;
    signal = options.signal || maybeSignal;
  } else {
    signal = maybeSignal;
  }

  const product = projectData?.productName || projectData?.title || "Product";
  const creator =
    projectData?.creatorName ||
    projectData?.handle?.replace("@", "") ||
    "Creator";
  const niche =
    projectData?.niche || projectData?.category || "Content Creation";
  const tagline =
    projectData?.productTagline ||
    projectData?.description ||
    "High leverage tool";
  const slug = (projectData?.slug || product).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const origin = getBaseAppOrigin();

  const channelBio = projectData?.channelDescription || projectData?.creatorBio || projectData?.bio || projectData?.description || "";
  const rawPosts = (
    (Array.isArray(projectData?.recentPosts) && projectData.recentPosts.length > 0 ? projectData.recentPosts : null) ||
    (Array.isArray(projectData?.videos) && projectData.videos.length > 0 ? projectData.videos : null) ||
    (Array.isArray(projectData?.scrapedData?.recentPosts) && projectData.scrapedData.recentPosts.length > 0 ? projectData.scrapedData.recentPosts : null) ||
    []
  );
  const recentVideosSummary = rawPosts.slice(0, 4).map(p => `- "${p.title}" (${p.views ? `${p.views} views` : 'views unknown'}): ${p.description ? p.description.slice(0, 100) : 'Channel content topic'}`).join('\n');

  const pacing = options.pacing || projectData?.pacing || projectData?.campaignKit?.pacingMode || 'low_burden';
  const targetMilestoneCount = pacing === 'intensive' ? 7 : pacing === 'balanced' ? 5 : 4;
  const pacingLabel = pacing === 'intensive' ? 'Sprint (7 posts)' : pacing === 'balanced' ? 'Balanced (5 posts)' : 'Low-Burden (4 posts)';
  const postingFrequency = options.postingFrequency || projectData?.postingFrequency || projectData?.campaignKit?.postingFrequency || '1 video per week (Standard YouTube)';
  const customPrompt = options.customPrompt || options.prompt || projectData?.campaignKit?.customPrompt || "based on creator's normal posting frequency, what you think will hit the next phase goal, what will be enough but not burden the creator...";
  const promptNotes = (Array.isArray(options.promptNotes) ? options.promptNotes : (projectData?.campaignKit?.promptNotes || []))
    .map((n) => String(n || "").trim()).filter(Boolean).slice(0, 20);
  const foundingLine = options.foundingPrice
    ? `Real pricing: founding price $${options.foundingPrice}${options.depositPrice ? `, refundable deposit $${options.depositPrice}` : ""}. Use these exact numbers.\n`
    : "";
  const socialEntries = Object.entries(options.socialLinks || projectData?.campaignKit?.socialLinks || {}).filter(([, v]) => v);
  const socialLine = socialEntries.length ? `Creator's channels: ${socialEntries.map(([k, v]) => `${k} ${v}`).join(", ")}.\n` : "";
  const goalLine = options.presaleTarget
    ? `Reach $${Number(options.presaleTarget).toLocaleString()} in pre-sales.`
    : "Acquire the first founding member pre-orders.";

  const normalizeUrls = (text) => {
    if (!text || typeof text !== "string") return text;
    return text
      .replace(/https?:\/\/[a-zA-Z0-9\-_.]+\.creatorforge\.app\/preorder/gi, `${origin}/preorder/${slug}`)
      .replace(/https?:\/\/[a-zA-Z0-9\-_.]+\.creatorforge\.app\/launch/gi, `${origin}/p/${slug}`)
      .replace(/https?:\/\/localhost:\d+\/preorder\/[a-zA-Z0-9\-_]+/gi, `${origin}/preorder/${slug}`)
      .replace(/https?:\/\/localhost:\d+\/preorder/gi, `${origin}/preorder/${slug}`)
      .replace(/https?:\/\/localhost:\d+\/p\/[a-zA-Z0-9\-_]+/gi, `${origin}/p/${slug}`)
      .replace(/https?:\/\/localhost:\d+/gi, origin);
  };

  const normalizeDraftString = (val, fallbackVal) => {
    if (!val) return fallbackVal || "";
    if (typeof val === "string") return normalizeUrls(val.trim());
    if (Array.isArray(val)) {
      return normalizeUrls(
        val
          .map((item, idx) => {
            if (typeof item === "string") {
              return item.startsWith("STORY") || item.startsWith("Story")
                ? item
                : `STORY ${idx + 1}:\n${item}`;
            }
            if (typeof item === "object" && item !== null) {
              const title = item.title || item.step || `STORY ${idx + 1}`;
              const visual = item.visual ? `\nVisual: ${item.visual}` : "";
              const text = item.text || item.copy || item.caption || item.description || "";
              const sticker = item.sticker ? `\n[STICKER: ${item.sticker}]` : "";
              return `${title}${visual}\nText: "${text}"${sticker}`;
            }
            return String(item);
          })
          .join("\n\n")
      );
    }
    if (typeof val === "object" && val !== null) {
      if (val.subject || val.body || val.content) {
        const subj = val.subject ? `Subject: ${val.subject}\n\n` : "";
        const body = val.body || val.content || val.message || val.text || "";
        return normalizeUrls(`${subj}${body}`.trim());
      }
      return normalizeUrls(
        Object.entries(val)
          .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
          .join("\n")
      );
    }
    return normalizeUrls(String(val));
  };

  const system = `You are an elite creator launch strategist and direct-response copywriter.
You write authentic, high-converting launch assets tailored specifically to the creator's real channel information, recent video topics, and community discussions.

CRITICAL LAUNCH PRINCIPLES:
1. CUSTOMIZED TO CREATOR: Ingest their channel bio and recent video topics. Directly cite their video themes and audience pain points in scripts and posts. NEVER write generic AI boilerplate.
2. PACING REQUIREMENT: You MUST generate EXACTLY ${targetMilestoneCount} milestones in the "postingSchedule" array (Milestone 1 through Milestone ${targetMilestoneCount}) to match the ${pacingLabel} cadence. Each action must require <15 minutes of creator effort.
3. ZERO FAKE TIMESTAMPS: Do not invent fake timestamps or fabricated drop-off claims. Use organic mid-roll integrations tied naturally to the topic of their videos.
4. VALIDATION TARGET: Everything should drive toward the Phase 1 goal (acquiring the first 50 Founding Members / $1,000 revenue target) with 50% lifetime perks and a low deposit.
5. FORMATTING: All copy fields (announcementPost, storySequence, videoScript, newsletterDraft, directMessageScript) must be full, rich formatted text strings.
Return ONLY valid JSON.`;

  const prompt = `Generate a fully customized validation campaign kit and milestone roadmap for:
Product: ${product}
Creator: ${creator}
Niche: ${niche}
Tagline: ${tagline}
Target Pre-Order URL: ${origin}/preorder/${slug}

Creator Channel Profile:
Channel Description / Bio: ${channelBio || 'not available'}
Normal Creator Posting Frequency: ${postingFrequency}
Pacing Mode: ${pacing} (${pacingLabel} — EXACTLY ${targetMilestoneCount} milestones required)
Recent Channel Video Uploads / Topics:
${recentVideosSummary || '- No recent uploads available'}

Strategic Operator Guidance:
"${customPrompt}"
${promptNotes.length ? `
ADDITIONAL INSTRUCTIONS FROM THE OPERATOR (every one is mandatory and overrides the defaults above):
${promptNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}
` : ""}${foundingLine}${socialLine}
Target Validation Goal: ${goalLine}

Return JSON with exact keys:
{
  "announcementPost": "Full social announcement post for Twitter/YouTube Community with hook rooted in channel topics, problem, value, and reservation link (${origin}/preorder/${slug}?ref=twitter_post)",
  "storySequence": "Complete 3-story Instagram/TikTok sequence with Story 1 (poll sticker), Story 2 (product reveal), Story 3 (link sticker CTA with ${origin}/preorder/${slug}?ref=instagram_story)",
  "videoScript": "60-second TikTok/Reels/Shorts script with visual cues, hook citing recent channel video topic, problem, solution, and CTA (${origin}/preorder/${slug}?ref=tiktok_video)",
  "newsletterDraft": "Complete 1:1 plain-text founder letter with Subject line, real video context, 50-member founding perks, and reservation link (${origin}/preorder/${slug}?ref=newsletter)",
  "directMessageScript": "Personal 1-on-1 DM template for high-value follower outreach (${origin}/preorder/${slug}?ref=dm_outreach)",
  "postingSchedule": [
    {
      "id": "milestone-1",
      "day": 1,
      "milestoneNumber": 1,
      "title": "Title for Milestone 1",
      "channel": "Channel name (e.g. Twitter / Community / Stories)",
      "effort": "~10 mins",
      "isToday": true,
      "done": false,
      "draftKey": "storySequence",
      "description": "Specific non-burdensome task description"
    }
  ],
  "landingPageCopy": {
    "headline": "Punchy 6-10 word high-converting landing page headline",
    "subheadline": "Compelling 15-20 word subheadline explaining the transformation",
    "bulletPoints": [
      "Key feature/benefit 1",
      "Key feature/benefit 2",
      "Key feature/benefit 3"
    ],
    "ctaText": "Claim Founding Access ($99)",
    "reservationText": "Reserve with $19 Deposit",
    "guarantee": "100% money-back guarantee if validation goals are not met."
  }
}
NOTE: "postingSchedule" MUST contain EXACTLY ${targetMilestoneCount} milestone objects spaced across 12-14 days.`;

  try {
    const data = await aiTextCall(prompt, system, 4096, signal, true);
    let resObj = null;
    if (typeof data === "string") {
      const cleaned = data
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      resObj = JSON.parse(cleaned);
    } else if (data && typeof data === "object") {
      resObj = data.campaignKit || data.campaign || data;
    }

    if (
      resObj &&
      (resObj.announcementPost || resObj.videoScript || resObj.landingPageCopy || resObj.postingSchedule)
    ) {
      let schedule = Array.isArray(resObj.postingSchedule) ? resObj.postingSchedule : [];
      if (!schedule.length) throw new Error("The AI returned no posting schedule. Try again.");
      if (schedule.length > targetMilestoneCount && targetMilestoneCount > 0) schedule = schedule.slice(0, targetMilestoneCount);
      const draft = (v) => normalizeDraftString(v, "");
      schedule = schedule.map((item, idx) => ({
        id: String(item.id || `milestone-${idx + 1}`),
        day: Number(item.day || (idx === 0 ? 1 : idx * 2)),
        milestoneNumber: Number(item.milestoneNumber || idx + 1),
        title: String(item.title || item.name || `Milestone ${idx + 1}`),
        channel: String(item.channel || "All Channels"),
        effort: String(item.effort || "~10 mins"),
        isToday: idx === 0,
        done: Boolean(item.done),
        draftKey: item.draftKey || (idx === 0 ? "storySequence" : idx === 1 ? "announcementPost" : idx === 2 ? "videoScript" : "newsletterDraft"),
        description: String(item.description || item.summary || "")
      }));

      return {
        pacingMode: pacing,
        postingFrequency,
        customPrompt,
        pricingConfig: resObj.pricingConfig || (options.foundingPrice ? { foundingPrice: options.foundingPrice, depositPrice: options.depositPrice } : undefined),
        announcementPost: draft(resObj.announcementPost),
        storySequence: draft(resObj.storySequence),
        videoScript: draft(resObj.videoScript),
        newsletterDraft: draft(resObj.newsletterDraft),
        directMessageScript: draft(resObj.directMessageScript),
        landingPageCopy: resObj.landingPageCopy || null,
        postingSchedule: enrichTasksWithGrounding(schedule, projectData),
        audienceGrounding: resObj.audienceGrounding || getProjectAudienceGrounding(projectData),
      };
    }
    throw new Error("Incomplete campaign kit schema");
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.warn("[Forge AI] Campaign kit generation failed:", err);
    throw err;
  }
}


export async function generateDiscoverySurveyAI(
  projectData,
  signal = undefined,
) {
  const product = projectData?.productName || "Software Tool";
  const creator = projectData?.creatorName || "Creator";
  const niche = projectData?.niche || "Content Creation";

  const system = `You are a product discovery research expert. You formulate 4 high-leverage customer discovery questions for an early stage software product. Return ONLY valid JSON.`;
  const prompt = `Generate 4 tailored customer discovery survey questions for:
Product: ${product}
Creator Co-Founder: ${creator}
Niche: ${niche}

Generate exact 4 questions:
1. Pain Point question
2. Current Spend question
3. Pricing Validation question ($99 founding pass)
4. Feature Wishlist question

Return JSON with exact keys:
{
  "questions": [
    {
      "id": "q1",
      "category": "Pain Point",
      "question": "Specific question asking audience about their biggest daily bottleneck...",
      "responseCount": 0,
      "topInsight": "Awaiting responses."
    },
    {
      "id": "q2",
      "category": "Current Spend",
      "question": "Question asking what tools they currently pay for and monthly spend...",
      "responseCount": 0,
      "topInsight": "Awaiting responses."
    },
    {
      "id": "q3",
      "category": "Pricing Validation",
      "question": "Question testing willingness to pay $99 founding price...",
      "responseCount": 0,
      "topInsight": "Awaiting responses."
    },
    {
      "id": "q4",
      "category": "Feature Wishlist",
      "question": "Question asking for the #1 must-have capability on day one...",
      "responseCount": 0,
      "topInsight": "Awaiting responses."
    }
  ]
}`;

  try {
    const data = await aiTextCall(prompt, system, 2048, signal, true);
    let resObj = null;
    if (typeof data === "string") {
      const cleaned = data
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      resObj = JSON.parse(cleaned);
    } else if (data && typeof data === "object") {
      resObj = data.surveyData || data.survey || data;
    }

    if (
      resObj &&
      Array.isArray(resObj.questions) &&
      resObj.questions.length > 0
    ) {
      return {
        summary: resObj.summary || "",
        keyTakeaways: resObj.keyTakeaways || [],
        questions: resObj.questions.map((q, idx) => ({
          id: q.id || `q-${idx + 1}`,
          category: q.category || "Discovery",
          question: q.question,
          responseCount: 0,
          topInsight: "Awaiting responses.",
        })),
      };
    }
    throw new Error("Incomplete discovery survey schema");
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.warn("[Forge AI] Survey generation failed:", err);
    throw err;
  }
}

// ── Analyze Collected Survey Responses with AI & Compute Score ────────────────

export async function analyzeSurveyResponsesAI(
  projectData,
  responses = [],
  signal = undefined,
) {
  const product = projectData?.productName || "Software Product";
  const creator = projectData?.creatorName || "Creator";
  const niche = projectData?.niche || "Software";

  if (!responses || responses.length === 0) {
    return {
      overallScore: 0,
      marketDemandScore: 0,
      pricingViabilityScore: 0,
      recommendation: "NEEDS_DATA",
      executiveSummary:
        "No audience survey responses collected yet. Share the survey link with the creator audience to begin collecting validation data.",
      keyFindings: [],
      topPainPoints: [],
      mustHaveFeatures: [],
    };
  }

  const system = `You are an expert venture capitalist and product validation analyst. You analyze qualitative customer discovery feedback, calculate empirical readiness scores (0-100), and provide strategic recommendations for early-stage software. Return ONLY valid JSON.`;

  const prompt = `Analyze these ${responses.length} customer discovery survey responses for:
Product: "${product}"
Creator: "${creator}"
Niche: "${niche}"

RESPONSES DATA:
${JSON.stringify(
    responses.map((r) => ({
      respondent: r.name || "Anonymous",
      email: r.email || "",
      intentRating: r.rating || 8,
      answers: r.answers || {},
    })),
    null,
    2,
  )}

Return JSON with exact keys:
{
  "overallScore": "<0-100, from how strongly the answers show pain and willingness to pay>",
  "marketDemandScore": 92,
  "pricingViabilityScore": 84,
  "recommendation": "<PROCEED | PIVOT | STOP, from the answers>",
  "scoreVerdict": "High Validation Signal — Strong Willingness to Pay",
  "executiveSummary": "2-3 sentence executive synthesis of the responses...",
  "keyFindings": [
    "Key finding 1 with percentage/data",
    "Key finding 2 on pricing feedback",
    "Key finding 3 on workflow friction"
  ],
  "topPainPoints": ["Top pain point 1", "Top pain point 2"],
  "mustHaveFeatures": ["Feature 1", "Feature 2"],
  "scoredResponses": [
    {
      "respondent": "Name",
      "intentScore": 90,
      "intentLevel": "High Intent",
      "insight": "Short summary of their need"
    }
  ]
}`;

  try {
    const data = await aiTextCall(prompt, system, 3072, signal, true);
    let resObj = null;
    if (typeof data === "string") {
      const cleaned = data
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      resObj = JSON.parse(cleaned);
    } else if (data && typeof data === "object") {
      resObj = data.analysis || data;
    }

    if (resObj && typeof resObj.overallScore === "number") {
      return {
        overallScore: Math.min(
          100,
          Math.max(0, Math.round(resObj.overallScore)),
        ),
        marketDemandScore: Math.min(
          100,
          Math.max(
            0,
            Math.round(resObj.marketDemandScore || resObj.overallScore),
          ),
        ),
        pricingViabilityScore: Math.min(
          100,
          Math.max(
            0,
            Math.round(resObj.pricingViabilityScore || resObj.overallScore),
          ),
        ),
        recommendation: resObj.recommendation || null,
        scoreVerdict: resObj.scoreVerdict || null,
        executiveSummary: String(
          resObj.executiveSummary ||
          "Customer discovery responses indicate positive product-market demand.",
        ),
        keyFindings: Array.isArray(resObj.keyFindings)
          ? resObj.keyFindings
          : [],
        topPainPoints: Array.isArray(resObj.topPainPoints)
          ? resObj.topPainPoints
          : [],
        mustHaveFeatures: Array.isArray(resObj.mustHaveFeatures)
          ? resObj.mustHaveFeatures
          : [],
        scoredResponses: Array.isArray(resObj.scoredResponses)
          ? resObj.scoredResponses
          : [],
      };
    }
    throw new Error("Incomplete survey analysis schema");
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.warn("[Forge AI] Survey analysis failed:", err);
    throw err;
  }
}


export async function analyzeAndGenerateExperimentsAI(
  projectData,
  signal = undefined,
) {
  const product = projectData?.productName || "Product";
  const creator = projectData?.creatorName || "Creator";
  const niche = projectData?.niche || "Software Workflows";
  const visitors = Number(projectData?.visitors || 0);
  const presales = Number(projectData?.currentPresales || 0);
  const convRate = Number(projectData?.conversionRate || 0);
  const surveyCount = Array.isArray(projectData?.surveyResponses)
    ? projectData.surveyResponses.length
    : 0;

  const system = `You are an expert growth engineer, conversion rate optimization (CRO) specialist, and launch strategist. You analyze validation telemetry and construct 4 high-impact experiments (messaging, pricing, landing page, creator content). Return ONLY valid JSON.`;
  const prompt = `Analyze validation campaign performance and generate optimization experiments for:
Product: ${product}
Creator Co-Founder: ${creator}
Niche: ${niche}
Current Telemetry:
- Unique Visitors: ${visitors}
- Presales Revenue: $${presales}
- Conversion Rate: ${convRate}%
- Discovery Survey Responses: ${surveyCount}
${projectData?._metrics ? `
FULL VALIDATION DATA (use these exact numbers; base every experiment on them):
${JSON.stringify(projectData._metrics, null, 2)}

RULES:
- "control" must quote the CURRENT copy/price above, not an invented one.
- Pricing experiments must use concrete dollar amounts relative to the current founding price ($${projectData._metrics.foundingPrice}) and the survey price answers.
- If visitors < 100, say traffic is the bottleneck and keep conversion claims modest.
- primaryBottleneck must name the weakest funnel stage from the data (traffic, interest, or payment).
` : ""}
Return JSON with exact structure:
{
  "performanceAudit": {
    "conversionHealth": "Healthy or Needs Optimization",
    "primaryBottleneck": "Brief 3-6 word bottleneck description",
    "summary": "Actionable 2-sentence executive performance summary"
  },
  "experiments": [
    {
      "id": "exp-1",
      "category": "messaging",
      "title": "Clear experiment title",
      "hypothesis": "Clear measurable hypothesis",
      "control": "Current copy/approach",
      "variant": "New proposed high-converting variant copy",
      "expectedUplift": "+XX% CTR or +XX% Conversion",
      "status": "ready",
      "targetField": "announcementPost"
    },
    {
      "id": "exp-2",
      "category": "pricing",
      "title": "Clear pricing experiment title",
      "hypothesis": "Pricing hypothesis testing deposit vs annual",
      "control": "Standard price",
      "variant": "Tested price variant",
      "expectedUplift": "+XX% Revenue",
      "status": "ready",
      "targetField": "pricingTier"
    },
    {
      "id": "exp-3",
      "category": "landing_page",
      "title": "Landing page experiment title",
      "hypothesis": "CRO hypothesis for headline/hero/CTA",
      "control": "Current landing page element",
      "variant": "Optimized variant element",
      "expectedUplift": "+XX% Conversion",
      "status": "active",
      "targetField": "landingPageHero"
    },
    {
      "id": "exp-4",
      "category": "creator_content",
      "title": "Creator content experiment title",
      "hypothesis": "Hypothesis for creator story/video/poll",
      "control": "Standard content",
      "variant": "High-urgency viral variant",
      "expectedUplift": "+XX% Engagement",
      "status": "ready",
      "targetField": "storySequence"
    }
  ]
}`;

  try {
    const data = await aiTextCall(prompt, system, 4096, signal, true);
    let resObj = null;
    if (typeof data === "string") {
      const cleaned = data
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      resObj = JSON.parse(cleaned);
    } else if (data && typeof data === "object") {
      resObj = data.experimentsData || data;
    }

    if (
      resObj &&
      Array.isArray(resObj.experiments) &&
      resObj.experiments.length > 0
    ) {
      return {
        performanceAudit: resObj.performanceAudit || null,
        experiments: resObj.experiments,
      };
    }
    throw new Error("Incomplete experiments schema");
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.warn("[Forge AI] Experiment analysis failed:", err);
    throw err;
  }
}


export async function generateMVPProductBuildPlanAI(
  projectData,
  signal = undefined,
) {
  const product = projectData?.productName || "Product";
  const creator = projectData?.creatorName || "Creator";
  const niche = projectData?.niche || "Software Workflow";
  const presales = Number(projectData?.currentPresales || 0);
  const backers = Array.isArray(projectData?.reservations)
    ? projectData.reservations.length
    : 0;
  const customer =
    projectData?.validationPlan?.customer ||
    projectData?.campaignKit?.targetAudience ||
    projectData?.targetAudience ||
    "(not defined in Phase 1)";
  const problem =
    projectData?.validationPlan?.problem ||
    projectData?.campaignKit?.problemAgitation ||
    projectData?.problemStatement ||
    "(not defined in Phase 1)";
  const solution =
    projectData?.validationPlan?.solution ||
    projectData?.validationPlan?.offer ||
    "";
  const problemAgitation = projectData?.campaignKit?.problemAgitation || "";
  const offer =
    projectData?.campaignKit?.headline ||
    projectData?.validationPlan?.offer ||
    projectData?.productTagline ||
    "(not defined in Phase 1)";

  // Real Phase 1 pricing tiers & features
  const pricingTiers = Array.isArray(projectData?.campaignKit?.pricingTiers) && projectData.campaignKit.pricingTiers.length > 0
    ? projectData.campaignKit.pricingTiers.map(t => `${t.name || t.title}: $${t.price} (${t.description || ''})`).join('; ')
    : "";
  const pricing =
    pricingTiers ||
    projectData?.selectedConcept?.pricing ||
    projectData?.pricing ||
    projectData?.validationPlan?.pricing ||
    projectData?.validation_plan?.pricing ||
    "(not defined in Phase 1)";

  const validatedFeatures = Array.isArray(projectData?.campaignKit?.features) && projectData.campaignKit.features.length > 0
    ? projectData.campaignKit.features.map(f => typeof f === 'string' ? f : `${f.name || f.title}: ${f.description || ''}`).join('; ')
    : (Array.isArray(projectData?.features) ? projectData.features.join('; ') : "");

  const takeaways = (projectData?.surveyData?.keyTakeaways || []).join("; ") || projectData?.surveyAnalysis?.summary || "";
  // Phase 1 evidence: what real people said and paid for
  const surveyRs = Array.isArray(projectData?.surveyResponses) ? projectData.surveyResponses : [];
  const surveyQs = projectData?.surveyData?.questions || [];
  const qLabel = (id) => (surveyQs.find((q) => String(q.id) === String(id)) || {}).question || "Answer";
  const voice = surveyRs.flatMap((r) => Object.entries(r.answers || {}).map(([k, a]) => `"${String(a).slice(0, 180)}" (${qLabel(k)})`)).slice(0, 14).join("\n- ");
  const supportSplit = ["yes", "maybe", "no"].map((k) => `${k}: ${surveyRs.filter((r) => r?.support?.decision === k).length}`).join(", ");
  const pricePts = Object.entries(surveyRs.reduce((a, r) => { const p = r?.support?.pricePoint; if (p) a[p] = (a[p] || 0) + 1; return a; }, {})).map(([k, n]) => `${k} (${n})`).join(", ");
  const tierMix = Object.entries((projectData?.reservations || []).reduce((a, r) => { const t = r.tier || r.passType || "Pre-order"; a[t] = (a[t] || 0) + 1; return a; }, {})).map(([k, n]) => `${k}: ${n}`).join(", ");
  const appliedExps = (projectData?.experimentsData?.experiments || projectData?.experiments || []).filter((e) => e.status === "applied").map((e) => `${e.category}: ${e.variant}`).join("; ");

  const evidenceBlock = [
    `Product: ${product}${projectData?.productTagline ? ` — ${projectData.productTagline}` : ""}`,
    `Creator: ${creator} · Niche: ${niche}`,
    `Customer (validated): ${customer}`,
    `Problem (validated): ${problem}`,
    problemAgitation ? `Problem detail: ${problemAgitation}` : "",
    solution ? `Solution direction: ${solution}` : "",
    `Offer: ${offer}`,
    validatedFeatures ? `Features customers were sold in Phase 1: ${validatedFeatures}` : "",
    projectData?.selectedConcept?.description ? `Concept: ${projectData.selectedConcept.description}` : "",
    Array.isArray(projectData?.selectedConcept?.keyFeatures) ? `Concept features: ${projectData.selectedConcept.keyFeatures.map((f) => (typeof f === "string" ? f : f.title || f.name)).join("; ")}` : "",
    `Pricing: ${pricing}`,
    `Demand: $${presales} from ${backers} backers.${tierMix ? ` Tier mix: ${tierMix}.` : ""}`,
    surveyRs.length ? `Survey (${surveyRs.length}): would support ${supportSplit}${pricePts ? ` · price answers ${pricePts}` : ""}` : "",
    voice ? `What customers said:\n- ${voice}` : "",
    appliedExps ? `Winning experiments: ${appliedExps}` : "",
    takeaways ? `Survey takeaways: ${takeaways}` : "",
  ].filter(Boolean).join("\n");

  const parse = (data) => {
    if (typeof data === "string") return JSON.parse(data.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim());
    return data?.buildPlan || data;
  };

  // ── Pass 1: product spec + scope (what the product is) ─────────────────────────────────
  const specSystem = `You are the founding product manager for ONE specific product. You write a precise MVP spec for that product only, using its real customer evidence. Generic SaaS boilerplate is a failure. Return ONLY valid JSON.`;
  const specPrompt = `Write the MVP product spec for this product.

${evidenceBlock}

Rules:
- Everything must be specific to ${product} and its domain. Name real domain objects (what ${customer} actually works with), not "items", "projects" or "workspaces".
- At most 5 "P0 - Must Have" features; any others are "P1 - High Priority". Each feature solves part of the validated problem; cite the evidence in "why".
- userFlows: the first-session journey, 4-7 steps, each a concrete user action and what the product shows back.
- screens: every screen the flows need (4-8), each listing its main components.
- integrations: only real third-party services this product needs (data sources, APIs, email, etc.), with purpose. Empty array if none.
- scope: what is in the MVP vs explicitly left out, with a one-line reason for each exclusion.

JSON shape (describe, don't copy these placeholder words):
{
  "productSpec": {
    "targetCustomer": "<who exactly, from the evidence>",
    "coreProblem": "<the validated problem in one sentence>",
    "valueProposition": "<one sentence>",
    "features": [{ "name": "<domain-specific feature>", "description": "<what it does>", "priority": "P0 - Must Have | P1 - High Priority", "why": "<evidence>" }],
    "userFlows": [{ "step": "<n. short name>", "action": "<user action → product response>" }],
    "screens": [{ "name": "<screen>", "description": "<main components>" }],
    "integrations": [{ "name": "<service>", "purpose": "<why>" }],
    "payments": { "provider": "<provider>", "model": "<plans and prices from the evidence>", "flow": "<checkout and entitlement flow>" },
    "authentication": { "method": "<method>", "security": "<roles/permissions this product needs>" },
    "analytics": { "engine": "<tool>", "trackedEvents": ["<snake_case event specific to this product's activation>"] }
  },
  "scopeBoundaries": {
    "includedInMVP": ["<item>"],
    "excludedFromMVP": [{ "item": "<item>", "reason": "<why it waits>" }]
  }
}`;

  // ── Pass 2: technical plan derived from the spec (how to build it) ─────────────────────
  const techSystem = `You are the founding engineer for ONE specific product. You design the smallest sound architecture for its spec and break it into buildable tasks. Every table and task must trace back to a feature or screen in the spec. Return ONLY valid JSON.`;
  const techPrompt = (spec, feedback = "") => `Design the technical plan for ${product} from this spec:
${JSON.stringify(spec, null, 2)}

Rules:
- techStack: pick what suits THIS product (data volume, integrations, realtime needs); give a one-line reason in "rationale".
- database: tables for this product's domain entities (derived from the features and screens), each with typed columns "name type" and the feature(s) it serves. A users table alone is not enough.
- engineeringTasks: 8-14 tasks. Each title names the specific feature, screen or integration it builds (no generic "scaffold UI" or "CRUD APIs" titles). Each has 2-4 testable acceptanceCriteria, dependsOn (ids), feature (the spec feature name or "Platform"), and assignedTo: "AI Agent" for UI/CRUD/API work, "Human Engineer" for architecture, third-party integrations, security, payments and hard data problems.
- milestones group the tasks in build order.
${feedback ? `\nYOUR PREVIOUS ANSWER WAS REJECTED: ${feedback}\nFix exactly that.` : ""}

JSON shape (describe, don't copy these placeholder words):
{
  "architecture": "<how the pieces fit for this product, 3-5 sentences>",
  "techStack": { "frontend": "<>", "backend": "<>", "database": "<>", "hosting": "<>", "aiInference": "<or none>", "rationale": "<>" },
  "database": [{ "table": "<domain_entity>", "columns": "id uuid, <name type>, ...", "serves": "<feature names>" }],
  "engineeringTasks": [{ "id": "t1", "title": "<specific>", "feature": "<spec feature or Platform>", "category": "Frontend | Backend | Data | Integration | Payments | Security / Auth | Infrastructure", "assignedTo": "AI Agent | Human Engineer", "estimate": "<e.g. 1 Day>", "acceptanceCriteria": ["<testable>"], "dependsOn": ["t?"], "milestone": "<milestone name>", "notes": "<key detail>" }],
  "dependencies": ["<library or service>"],
  "acceptanceCriteria": ["<MVP-level definition of done>"],
  "milestones": [{ "name": "<>", "duration": "<e.g. Days 1-3>", "status": "Ready" }]
}`;

  // Reject boilerplate so the model has to follow THIS product
  const GENERIC = [/scaffold ui canvas/i, /workspace components/i, /implement postgresql db models & crud apis/i, /oauth jwt session rotation/i, /stripe webhook signature verification & entitlements/i, /^setup (fastapi|backend)/i];
  const problems = (tech, spec) => {
    const out = [];
    const tasks = Array.isArray(tech?.engineeringTasks) ? tech.engineeringTasks : [];
    const tables = Array.isArray(tech?.database) ? tech.database : [];
    const featureNames = (spec?.features || []).map((f) => String(f.name || "").toLowerCase()).filter(Boolean);
    if (tasks.length < 6) out.push(`only ${tasks.length} tasks; write 8-14`);
    const copied = tasks.filter((t) => GENERIC.some((re) => re.test(t.title || "")));
    if (copied.length) out.push(`generic task titles: ${copied.map((t) => `"${t.title}"`).join(", ")}`);
    const unmapped = tasks.filter((t) => !t.feature || (t.feature !== "Platform" && !featureNames.some((f) => String(t.feature).toLowerCase().includes(f) || f.includes(String(t.feature).toLowerCase()))));
    if (featureNames.length && unmapped.length > tasks.length / 2) out.push(`${unmapped.length} tasks don't map to a spec feature`);
    const domainTables = tables.filter((t) => !/^(users?|accounts?|sessions?|feedback|settings)$/i.test(String(t.table || "").trim()));
    if (domainTables.length < 2) out.push(`database has no real domain tables (got ${tables.map((t) => t.table).join(", ") || "none"})`);
    if (tasks.some((t) => !Array.isArray(t.acceptanceCriteria) || t.acceptanceCriteria.length < 2)) out.push("some tasks have fewer than 2 acceptance criteria");
    return out;
  };

  try {
    const specRes = parse(await aiTextCall(specPrompt, specSystem, 6000, signal, true));
    const productSpec = specRes?.productSpec;
    if (!productSpec || !Array.isArray(productSpec.features) || !productSpec.features.length) throw new Error("The AI returned an incomplete product spec. Try again.");
    let tech = parse(await aiTextCall(techPrompt(productSpec), techSystem, 8000, signal, true));
    let issues = problems(tech, productSpec);
    if (issues.length) {
      // One corrective retry with the exact problems
      const retry = parse(await aiTextCall(techPrompt(productSpec, issues.join("; ")), techSystem, 8000, signal, true));
      if (retry?.engineeringTasks) { tech = retry; issues = problems(tech, productSpec); }
    }
    if (!tech?.engineeringTasks?.length) throw new Error("The AI returned an incomplete technical plan. Try again.");
    tech.engineeringTasks = tech.engineeringTasks.map((t, i) => ({ ...t, id: String(t.id || `t${i + 1}`), status: "Ready" }));
    tech.qualityWarnings = issues;
    return {
      productSpec,
      technicalPlan: tech,
      scopeBoundaries: {
        includedInMVP: (specRes.scopeBoundaries?.includedInMVP || []).map((x) => (typeof x === "string" ? x : x.item || x.name || "")).filter(Boolean),
        excludedFromMVP: (specRes.scopeBoundaries?.excludedFromMVP || []).map((x) => (typeof x === "string" ? x : `${x.item || x.name}${x.reason ? ` — ${x.reason}` : ""}`)).filter(Boolean),
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.warn("[Forge AI] MVP build plan error:", err);
    throw err;
  }
}


export async function analyzeAndClusterBetaFeedbackAI(feedbackItems, projectData, signal = undefined) {
  if (!feedbackItems || !Array.isArray(feedbackItems) || feedbackItems.length === 0) {
    throw new Error('No customer feedback items provided to cluster. Collect real customer feedback first.')
  }
  const product = projectData?.productName || 'Product'
  const creator = projectData?.creatorName || 'Creator'
  const niche = projectData?.niche || 'Software'
  const rawList = feedbackItems.map((f, i) => `#${i} [${f.category || f.type || 'Feedback'}] "${f.text || f.message}" (${f.email || f.author || 'User'})`).join('\n')

  const system = `You are a Principal Product Manager and QA Lead. You analyze raw customer beta feedback, bugs, support tickets, and objections, grouping them into quantified, recurring thematic clusters with clear counts and severity. Return ONLY valid JSON.`
  const prompt = `Analyze and group recurring beta feedback for:
Product: ${product} (${niche}) × ${creator}

Incoming Raw Feedback Items (${feedbackItems.length} total, numbered):
${rawList}

RULES:
- Group items that describe the same underlying issue. Every cluster MUST list "itemIndexes": the # numbers of the items in it.
- Title each cluster as what users experienced, e.g. "confused by onboarding", "requested CSV export", "hit a crash on save".
- category is one of: Bug, Feature request, Objection, Support question, Onboarding / UX, Praise.
- severity: High (blocks use, loses data, or many users), Medium, Low.
- Do not invent items or counts; only use the items above.

Return JSON with exact structure:
{
  "summary": "Brief 1-2 sentence executive overview of beta cohort sentiment",
  "clusters": [
    {
      "id": "cluster-1",
      "title": "Short descriptive title of recurring issue",
      "itemIndexes": [0, 3, 7],
      "category": "Onboarding / UX",
      "severity": "Medium",
      "description": "Clear explanation of what users experienced",
      "exampleQuote": "Representative direct user quote",
      "recommendedAction": "Concrete engineering or product fix",
      "status": "Open"
    }
  ]
}`

  try {
    const data = await aiTextCall(prompt, system, 4096, signal, true)
    let resObj = null
    if (typeof data === 'string') {
      const cleaned = data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      resObj = JSON.parse(cleaned)
    } else if (data && typeof data === 'object') {
      resObj = data
    }

    if (resObj && Array.isArray(resObj.clusters) && resObj.clusters.length > 0) {
      // Counts come from the actual reports in each cluster (distinct people), never from the model
      resObj.clusters = resObj.clusters.map((c, ci) => {
        const idx = (Array.isArray(c.itemIndexes) ? c.itemIndexes : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < feedbackItems.length)
        const items = idx.map((n) => feedbackItems[n])
        const people = new Set(items.map((f) => String(f.email || f.author || f.id || '').toLowerCase()))
        return { ...c, id: c.id || `cluster-${ci + 1}`, itemIds: items.map((f) => f.id), count: items.length ? people.size : Math.min(Number(c.count) || 1, feedbackItems.length), reports: items.length || 1, status: 'Open', exampleQuote: c.exampleQuote || items[0]?.message || '' }
      })
      return {
        summary: resObj.summary || 'AI clustered recurring beta feedback into prioritized action items.',
        clusters: resObj.clusters
      }
    }
    throw new Error('Incomplete clusters schema returned by AI')
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('[Forge AI] Feedback clustering error:', err)
    throw err
  }
}

export async function executeAICodingTaskAI(task, projectData, signal = undefined) {
  const product = projectData?.productName || 'Product'
  const techStack = projectData?.mvpBuildPlan?.technicalPlan?.techStack || {}

  const system = `You are a Senior Autonomous AI Software Engineer. You write clean, production-grade, tested code for a specific sprint task in an MVP build pipeline. Return ONLY valid JSON.`
  const prompt = `Implement the engineering task:
Title: ${task.title}
Category: ${task.category}
Product: ${product}
Tech Stack: Frontend: ${techStack.frontend}, Backend: ${techStack.backend}

Return JSON with exact structure:
{
  "taskId": "${task.id}",
  "status": "Completed",
  "implementationNotes": "Summary of architecture and code written",
  "filesScaffolded": [
    {
      "filePath": "src/services/app.js",
      "codeSnippet": "Key code lines implemented"
    }
  ],
  "automatedTests": {
    "testFramework": "PyTest / Vitest",
    "passed": true,
    "coverage": "<only if you ran tests; otherwise omit>",
    "testOutput": "✓ All unit & integration tests passed successfully"
  }
}`

  try {
    const data = await aiTextCall(prompt, system, 4096, signal, true)
    let resObj = null
    if (typeof data === 'string') {
      const cleaned = data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      resObj = JSON.parse(cleaned)
    } else if (data && typeof data === 'object') {
      resObj = data
    }

    if (resObj && resObj.status) {
      return resObj
    }
    throw new Error('Incomplete coding task result returned by AI')
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('[Forge AI] AI Coding task error:', err)
    throw err
  }
}

export async function editOrGenerateCodeFileAI(fileName, fileLanguage, currentContent, userPrompt, projectData, signal = undefined) {
  const product = projectData?.productName || 'Product'
  const spec = projectData?.mvpBuildPlan?.productSpec || {}
  const tech = projectData?.mvpBuildPlan?.technicalPlan || {}
  const techStack = tech.techStack || {}

  const system = `You are an Elite Principal Software Engineer and Architect. You write complete, comprehensive, highly detailed, beautifully structured, production-grade code.
CRITICAL FORMATTING & SYNTAX RULES:
1. Return ONLY the complete raw source code for the file.
2. Do NOT wrap in markdown \`\`\` code fences.
3. Do NOT compress or minify code into a single line. Always use clean multi-line formatting with proper 2-space indentation and real newlines.
4. If writing HTML or index.html: Include full <!DOCTYPE html>, <head>, Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>), and standard semantic HTML structure. If using JavaScript inside HTML, embed inside clean <script> tags so it executes seamlessly.
5. If writing React / JSX / JS: Write complete React functional components with Tailwind CSS utility classes and real interactivity.
6. Never use placeholders like 'TODO', '...', or 'add content here'. Implement full real logic.
7. CRITICAL DESIGN & COLOR RULES:
   - Primary Brand Accent: Bold signature crimson red (#c81e3c / rgb(200, 30, 60)). All primary CTA buttons, active tabs, highlight borders, and badges must use #c81e3c.
   - Text Color on Red: All text and icons on red (#c81e3c) backgrounds MUST ALWAYS be crisp pure white (#ffffff / text-white). Never use dark or muted text on red.
   - Canvas: Matte black and deep graphite surfaces (#090b0e, #0c0e14, #0a0c12).
   - Border Radius: Strict zero border radius (rounded-none / border-radius: 0px) across all cards, buttons, badges, modals, and containers. Do NOT use rounded-xl, rounded-2xl, or rounded-full.
   - Never default to generic blue or green.`

  const prompt = `File: ${fileName} (${fileLanguage || 'code'})
Product Name: ${product}
Target Customer: ${spec.targetCustomer || 'Users'}
Core Problem: ${spec.coreProblem || '(not specified)'}
Tech Stack: ${techStack.frontend || techStack.backend ? `Frontend: ${techStack.frontend || 'not chosen'}, Backend: ${techStack.backend || 'not chosen'}` : 'not chosen yet: follow the existing code'}

Instruction from Developer:
${userPrompt || 'Build complete, rich, highly-detailed code for this file.'}

${currentContent && currentContent.trim() ? `Existing Code to modify/enhance:\n${currentContent}` : `Please generate the full, detailed implementation for ${fileName}.`}

Return the full, beautiful, multi-line source code now:`

  try {
    const data = await aiTextCall(prompt, system, 8192, signal, false)
    if (typeof data === 'string' && data.trim()) {
      let cleaned = data.trim()
      // Strip markdown code fences if model accidentally included them
      cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      return cleaned
    }
    throw new Error('No code returned by AI model')
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('[Forge AI] AI Edit file error:', err)
    throw err
  }
}


export async function generateCompleteMVPCodebaseAI(projectData, signal = undefined) {
  const product = projectData?.productName || 'Product'
  const spec = projectData?.mvpBuildPlan?.productSpec || {}
  const tech = projectData?.mvpBuildPlan?.technicalPlan || {}
  const techStack = tech.techStack || {}

  const system = `You are a Principal Full-Stack Autonomous AI Software Architect. You write clean, functional, production-ready code files for a newly initiated MVP software product. Every file must contain complete, high-quality code. Return ONLY valid JSON.
CRITICAL DESIGN & THEME SYSTEM MANDATE:
1. Primary Brand Accent: Bold signature crimson red (#c81e3c / rgb(200, 30, 60)).
2. Background Surfaces: Deep matte black and graphite canvas (#090b0e, #0c0e14, #0a0c12).
3. Text on Red Elements: Crisp pure white (#ffffff / text-white). Never use dark or muted text on red buttons/badges.
4. Border Radius: Strict zero border radius (rounded-none / border-radius: 0px) across all buttons, cards, containers, badges, and modals.
5. Do NOT use generic blue or green themes.`
  const prompt = `Generate a full multi-file initial codebase for:
Product Name: ${product}
Target Customer: ${spec.targetCustomer || projectData?.validationPlan?.customer || 'Core Users'}
Core Problem: ${spec.coreProblem || projectData?.validationPlan?.problem || 'Automating workflows'}
Value Proposition: ${spec.valueProposition || 'High-performance software MVP'}
Tech Stack: ${techStack.frontend || techStack.backend ? `Frontend: ${techStack.frontend || 'not chosen'}, Backend: ${techStack.backend || 'not chosen'}, Database: ${techStack.database || 'not chosen'}` : 'not chosen yet: follow the existing code'}
Core MVP Features: ${(spec.features || []).map(f => f.name + ': ' + f.description).join('; ')}

Return a valid JSON object with the following exact structure:
{
  "files": [
    {
      "path": "src/App.jsx",
      "name": "App.jsx",
      "folder": "src",
      "category": "Frontend",
      "language": "javascript",
      "content": "// Full functional React App component"
    },
    {
      "path": "src/components/Workspace.jsx",
      "name": "Workspace.jsx",
      "folder": "src/components",
      "category": "Frontend",
      "language": "javascript",
      "content": "// Full functional interactive workspace component"
    },
    {
      "path": "backend/main.py",
      "name": "main.py",
      "folder": "backend",
      "category": "Backend",
      "language": "python",
      "content": "# Full FastAPI backend service"
    },
    {
      "path": "backend/routers/auth.py",
      "name": "auth.py",
      "folder": "backend/routers",
      "category": "Security / Auth",
      "language": "python",
      "content": "# Hardened JWT authentication & OAuth"
    },
    {
      "path": "backend/routers/webhooks.py",
      "name": "webhooks.py",
      "folder": "backend/routers",
      "category": "Security / Auth",
      "language": "python",
      "content": "# Stripe webhook verification & licensing"
    },
    {
      "path": "tests/test_suite.py",
      "name": "test_suite.py",
      "folder": "tests",
      "category": "QA / Testing",
      "language": "python",
      "content": "# Unit and integration tests"
    },
    {
      "path": "package.json",
      "name": "package.json",
      "folder": "root",
      "category": "Config",
      "language": "json",
      "content": "{\\n  \\"name\\": \\"${product.toLowerCase().replace(/[^a-z0-9]/g, '-')}-mvp\\",\\n  \\"version\\": \\"0.1.0\\"\\n}"
    },
    {
      "path": "README.md",
      "name": "README.md",
      "folder": "root",
      "category": "Docs",
      "language": "markdown",
      "content": "# ${product} Codebase"
    }
  ]
}`

  try {
    const data = await aiTextCall(prompt, system, 8192, signal, true)
    let resObj = null
    if (typeof data === 'string') {
      const cleaned = data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      resObj = JSON.parse(cleaned)
    } else if (data && typeof data === 'object') {
      resObj = data
    }

    if (resObj && Array.isArray(resObj.files) && resObj.files.length > 0) {
      return resObj.files
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('[Forge AI] Codebase generation failed:', err)
    throw err
  }
  throw new Error('The AI returned no files. Try again.')
}


export async function generateProductReadinessReportAI(projectData, signal = undefined) {
  const product = projectData?.productName || 'Product'
  const creator = projectData?.creatorName || 'Creator'
  const niche = projectData?.niche || 'Software'
  const presales = Number(projectData?.currentPresales || 0)
  const backers = Array.isArray(projectData?.reservations) ? projectData.reservations.length : 0
  const tasks = projectData?.engineeringTasks || []
  const completed = tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length
  const clusters = projectData?.feedbackClusters || []

  const system = `You are a Principal Software Architect, VP of Product, and VC Launch Auditor. You evaluate whether an early-stage MVP has achieved technical stability, market validation, and user satisfaction to graduate to general public release. Return ONLY valid JSON.`
  const prompt = `Generate an Executive Product-Readiness Report for:
Product: ${product} (${niche}) × ${creator}
Validated Demand: $${presales} from ${backers} founding backers.
Engineering Tasks: ${completed}/${tasks.length || 6} completed.
Beta Clusters Addressed: ${clusters.length} recurring feedback items analyzed.

Return JSON with exact structure:
{
  "score": "<0-100 from the numbers above>",
  "verdict": "<one line>",
  "confidence": "<High|Medium|Low>",
  "summary": "Executive summary of readiness and stability",
  "pillars": [
    { "name": "<pillar>", "score": "<0-100 from the numbers>", "status": "<Passed|Needs work|Failing>", "detail": "<evidence>" }
  ],
  "blockers": [],
  "recommendedDecision": "<Launch|Continue Beta|Kill>"
}`

  try {
    const data = await aiTextCall(prompt, system, 4096, signal, true)
    let resObj = null
    if (typeof data === 'string') {
      const cleaned = data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      resObj = JSON.parse(cleaned)
    } else if (data && typeof data === 'object') {
      resObj = data
    }

    if (resObj && resObj.verdict && Array.isArray(resObj.pillars)) {
      return resObj
    }
    throw new Error('Incomplete readiness report schema returned by AI')
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('[Forge AI] Readiness report error:', err)
    throw err
  }
}

export async function autoImplementFixesAI(issuesList, projectData, signal = undefined) {
  const product = projectData?.productName || 'Product'
  const system = `You are an Autonomous AI Code Patch Engineer. You generate and apply targeted hotfixes to resolve prioritized beta bugs and onboarding issues. Return ONLY valid JSON.`
  const prompt = `Generate code patches and verify fixes for:
Product: ${product}
Open Issues:
${(issuesList || []).map(i => `- [${i.severity || 'Medium'}] ${i.title || i.name}: ${i.description || i.recommendedAction}`).join('\n')}

Return JSON with exact structure:
{
  "patchesApplied": [
    {
      "issueTitle": "Title of resolved issue",
      "fixSummary": "What was patched in code",
      "filesModified": ["app/auth.py", "src/components/Onboarding.jsx"],
      "verified": true
    }
  ],
  "postFixTestResults": {
    "unitPassed": 34,
    "integrationPassed": 18,
    "allPassed": true
  }
}`

  try {
    const data = await aiTextCall(prompt, system, 4096, signal, true)
    let resObj = null
    if (typeof data === 'string') {
      const cleaned = data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      resObj = JSON.parse(cleaned)
    } else if (data && typeof data === 'object') {
      resObj = data
    }

    if (resObj && Array.isArray(resObj.patchesApplied)) {
      return resObj
    }
    throw new Error('Incomplete fix schema returned by AI')
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('[Forge AI] Auto-fix error:', err)
    throw err
  }
}


/**
 * AI-Powered Task & Code Testing Inspector
 * Verifies if the codebase satisfies a specific engineering task or custom test prompt.
 */
export async function verifyProjectTaskWithAI({ taskTitle, testPrompt, files = [], project = {}, signal = null }) {
  const codeSummaries = (files || [])
    .filter(f => f && f.name && !f.name.match(/\.(png|jpg|jpeg|webp|gif|ico)$/i))
    .map(f => `--- FILE: ${f.name} (${f.language || 'text'}) ---\n${(f.content || '').slice(0, 4000)}`)
    .join('\n\n')

  const prompt = `You are a Senior QA Automation & Code Review Engineer.
Evaluate whether the project's actual codebase files satisfy the following task / test prompt criteria.

PROJECT NAME: ${project?.productName || project?.name || 'Software Project'}
TASK TITLE: ${taskTitle || 'Custom Verification'}
TEST PROMPT / CRITERIA:
"${testPrompt || taskTitle || 'Verify code structure, syntax, and functionality.'}"

ACTUAL PROJECT CODE FILES:
${codeSummaries || 'No code files available yet.'}

Evaluate the code objectively against the criteria.
Return ONLY a valid JSON object in this exact schema:
{
  "passed": "<true only if every criterion is clearly met in the code>",
  "score": "<0-100>",
  "summary": "Clear 1-sentence verdict on whether this task is done and functioning.",
  "checks": [
    {
      "name": "Check title (e.g. Hero Component Presence)",
      "status": "Passed",
      "detail": "Explanation of what was found in the actual code."
    }
  ],
  "issues": [
    "List of specific issues if any"
  ],
  "recommendation": "Concrete next step or how to fix."
}`

  const system = `You are an expert QA and code auditing engineer. You review real source code against task requirements and return ONLY JSON.`

  try {
    const data = await aiTextCall(prompt, system, 3000, signal, true)
    let resObj = null
    if (typeof data === 'string') {
      const cleaned = data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      resObj = JSON.parse(cleaned)
    } else if (data && typeof data === 'object') {
      resObj = data
    }

    if (resObj && typeof resObj.passed === 'boolean' && Array.isArray(resObj.checks)) {
      return resObj
    }
    throw new Error('Invalid QA evaluation schema')
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.warn('[Forge AI] Task verification could not run:', err)
    // Never report a pass when the check itself failed
    return {
      passed: false,
      unverified: true,
      score: 0,
      summary: 'Verification could not run (AI service unavailable). Retry before counting this task as done.',
      checks: [],
      issues: [err?.message || 'Verification service error'],
      recommendation: 'Retry the QA run.'
    }
  }
}

/**
 * Generate 3 software product concepts strictly grounded in audience data using conceptSchema.
 */
export async function generateConceptsAI({ creator = {}, audience = {} }, signal = undefined) {
  const { buildConceptPrompt, normalizeConcepts } = await import("../components/launch/conceptSchema");
  const promptData = buildConceptPrompt({ creator, audience });
  const raw = await aiTextCall(promptData.user, promptData.system, 4096, signal, true);
  let parsed = null;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    try { parsed = JSON.parse(cleaned); } catch {}
  } else if (raw && typeof raw === "object") {
    parsed = raw;
  }
  const comments = audience.comments || [];
  return normalizeConcepts(parsed, { comments });
}



// ── Phase 3 · Launch (grounded in real Phase 1 + 2 evidence) ───────────────────────────────
function parseAiJson(data) {
  if (typeof data === 'string') {
    return JSON.parse(data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim())
  }
  return data
}

export async function generateLaunchPlanAI(projectData, evidence = {}, signal = undefined) {
  const product = projectData?.productName || 'the product'
  const creator = projectData?.creatorName || 'the creator'
  const audience = projectData?.selectedConcept?.customer || projectData?.targetAudience || projectData?.niche || 'the audience'
  const base = (evidence.publicUrl || '').replace(/\/$/, '')
  const system = 'You are a launch strategist for creator-led software products. You plan launches from real evidence only and write ready-to-post creator content. Return ONLY valid JSON.'
  const prompt = `Plan the public launch of ${product} (built with ${creator} for ${audience}).

REAL EVIDENCE (base every choice on it; do not invent numbers):
${JSON.stringify(evidence, null, 2)}

Rules:
- Launch price: use evidence.launchPrice. Founding/pre-order customers already paid; reward them, don't re-sell to them.
- Channel order follows evidence.channels (visits and pre-orders per channel from validation). Say why using the numbers.
- Messaging answers the objections in evidence.objections and uses the language in evidence.customerQuotes.
- Every schedule item is a real post the creator will receive by email: write the COMPLETE copy in "content" and include the tracking link ${base}/preorder/${evidence.slug}?ref=launch_<channel>.
- 5 to 8 schedule items across launch day (day 0) to day 7.
- FAQs answer real questions from evidence.supportQuestions and evidence.objections first.

Return JSON:
{
  "launchDate": "YYYY-MM-DD",
  "summary": "2 sentences: the launch in plain words",
  "channels": [{ "channel": "instagram|video|x|newsletter|dm", "why": "evidence-based reason", "role": "what it does in the launch" }],
  "offers": [{ "name": "Offer name", "price": 0, "terms": "Who it's for and what they get", "deadline": "e.g. 72 hours" }],
  "messaging": [{ "angle": "Angle", "hook": "Opening line", "objection": "Objection it answers" }],
  "schedule": [{ "day": 0, "time": "09:00", "channel": "instagram", "title": "Short title", "draftKey": "storySequence|videoScript|announcementPost|newsletterDraft|directMessageScript", "content": "Full ready-to-post copy with the tracking link" }],
  "creatorChecklist": [{ "title": "Task for ${creator}", "when": "Day -2" }],
  "opsChecklist": [{ "title": "Task for the Co-Launch team", "when": "Day -1" }],
  "faqs": [{ "q": "Question", "a": "Answer" }],
  "onboarding": { "subject": "Welcome email subject", "body": "Welcome email using {{first_name}}, {{product}}, {{link}}, {{first_step}}, {{creator}}", "firstStep": "The single first action a new customer should take" }
}`
  const data = await aiTextCall(prompt, system, 6000, signal, true)
  const res = parseAiJson(data)
  if (!res || !Array.isArray(res.schedule) || !res.schedule.length) throw new Error('The AI returned an incomplete launch plan. Try again.')
  return res
}

export async function writeLaunchActionAI(signalItem, projectData, context = {}, signal = undefined) {
  const product = projectData?.productName || 'the product'
  const creator = projectData?.creatorName || 'the creator'
  if (signalItem.kind === 'creator') {
    const system = 'You write short, natural creator posts that drive sales. Return ONLY valid JSON.'
    const prompt = `Write one ${signalItem.channel} post for ${creator} about ${product}.
Why now: ${signalItem.why}
Evidence: ${signalItem.evidence}
Offer: ${context.offer || 'current launch price'}
Tracking link (must appear exactly): ${context.link}
Customer language to reuse: ${(context.quotes || []).slice(0, 4).join(' | ') || 'none'}
Return JSON: { "title": "Task title for the creator", "content": "Complete ready-to-post copy" }`
    return parseAiJson(await aiTextCall(prompt, system, 1200, signal, true))
  }
  const system = 'You are an engineering lead turning production signals into precise tasks. Return ONLY valid JSON.'
  const prompt = `Signal from the live product ${product}: ${signalItem.title}
Evidence: ${signalItem.evidence}
Likely cause: ${signalItem.why}
Return JSON: { "title": "Engineering task title", "category": "Bug fix|Frontend|Backend|Payments|Onboarding", "assignedTo": "AI Agent|Human Engineer", "acceptanceCriteria": ["testable", "testable"], "notes": "What to check first" }`
  return parseAiJson(await aiTextCall(prompt, system, 900, signal, true))
}

export async function summarizeLaunchReportAI(report, projectData, signal = undefined) {
  const system = 'You are a launch analyst. You summarise real results plainly and draw specific learnings. Never invent numbers. Return ONLY valid JSON.'
  const prompt = `Summarise the launch of ${projectData?.productName || 'the product'} from these computed results:
${JSON.stringify(report, null, 2)}
Return JSON: { "summary": "3 sentences", "learnings": ["specific learning with a number", "..."], "creatorPerformance": "1-2 sentences", "productUsage": "1-2 sentences", "feedbackThemes": ["theme", "..."] }`
  return parseAiJson(await aiTextCall(prompt, system, 1500, signal, true))
}
