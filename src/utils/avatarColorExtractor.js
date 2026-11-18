/**
 * CoLaunch brand colour helpers.
 *
 * Avatar-based colour extraction was removed: CoLaunch keeps its own scheme
 * (black + #c81e3c crimson). These helpers build fallback avatars, convert/inspect
 * colours and derive distinct accents for the three Step 5 concepts.
 */


// Helper: Generate zero-network deterministic SVG avatar Data URI
export function generateCreatorAvatarSvg(nameOrHandle = "Creator") {
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#${theme.bg}"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="46" fill="#${theme.text}" dominant-baseline="middle" text-anchor="middle" letter-spacing="-0.5">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Helper: RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Helper: HSL to Hex
function hslToHex(h, s, l) {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Helper: RGB to Hex
function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`.toUpperCase();
}

// Helper: Hex to RGB
export function hexToRgb(hex) {
  if (!hex) return [22, 163, 74];
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16)
    ];
  }
  if (clean.length >= 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    ];
  }
  return [22, 163, 74];
}

// Helper: Hex to RGBA
export function hexToRgba(hex, alpha = 0.22) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Computes WCAG 2.1 Relative Luminance for an RGB color.
 */
export function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * AI Color & Contrast Engine:
 * Decides whether text on top of this background color should be rich black (#080C14)
 * or white (#FFFFFF) to guarantee maximum readability and WCAG AAA compliance.
 * Whenever the background has high luminance (cyans, sky-blues, ambers, limes, golds, pastels),
 * black text is selected.
 */
export function getContrastTextColor(hex) {
  if (!hex || typeof hex !== 'string') return '#FFFFFF';
  const [r, g, b] = hexToRgb(hex);
  const lum = getRelativeLuminance(r, g, b);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Mathematically, contrast with black exceeds contrast with white when lum > 0.179.
  // We also use YIQ >= 118 to ensure vibrant cyans and greens always get crisp black text.
  return (lum > 0.179 || yiq >= 118) ? '#080C14' : '#FFFFFF';
}

/**
 * Returns true if the background color requires black/dark text.
 */
export function isLightColor(hex) {
  return getContrastTextColor(hex) === '#080C14';
}

/**
 * Returns a human-friendly name for a given hex color
 */
export function getFriendlyColorName(hex) {
  if (!hex) return "Studio Emerald";
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);

  if (s < 12) {
    if (l < 25) return "Obsidian Slate";
    if (l > 75) return "Pure Steel";
    return "Industrial Slate";
  }

  if (h >= 345 || h < 15) return "Creator Crimson";
  if (h >= 15 && h < 45) return "Flame Orange";
  if (h >= 45 && h < 65) return "Venture Amber";
  if (h >= 65 && h < 100) return "Forge Lime";
  if (h >= 100 && h < 165) return "Studio Emerald";
  if (h >= 165 && h < 205) return "Ocean Cyan";
  if (h >= 205 && h < 240) return "Cobalt Blue";
  if (h >= 240 && h < 280) return "Royal Indigo";
  if (h >= 280 && h < 320) return "Venture Violet";
  return "Electric Rose";
}

const DISTINCT_ACCENTS = [
  { hex: "#10B981", h: 160 }, // Emerald
  { hex: "#06B6D4", h: 189 }, // Cyan
  { hex: "#6366F1", h: 239 }, // Indigo
  { hex: "#8B5CF6", h: 258 }, // Purple
  { hex: "#F59E0B", h: 38 },  // Amber
  { hex: "#C81E3C", h: 350 }, // Crimson
];

const hueDistance = (a, b) => {
  const diff = Math.abs((((a - b) % 360) + 360) % 360);
  return Math.min(diff, 360 - diff);
};

/**
 * Returns a set of 3 distinct, high-contrast concept colors derived from the creator's brand color
 * so Concept 1, Concept 2, and Concept 3 never collapse onto similar hues.
 */
export function getHarmoniousConceptColors(primaryHex) {
  let safeHex = primaryHex || "#c81e3c";
  const clean = safeHex.replace('#', '').toLowerCase().trim();
  if (['0f172a', '1e293b', '090b10', '0a0e17', '000000', '111827', '334155', '475569'].includes(clean)) {
    safeHex = "#06B6D4";
  }

  const [r, g, b] = hexToRgb(safeHex);
  const [h, s, l] = rgbToHsl(r, g, b);

  // Concept 1 is the signature color (boost lightness if too dark)
  const c1 = l < 35 ? hslToHex(h, Math.max(75, s), 50) : safeHex;

  // Choose two curated accents that maximize minimum hue separation across all 3 concepts.
  let bestPair = ["#10B981", "#6366F1"];
  let bestMinSep = -1;
  for (let i = 0; i < DISTINCT_ACCENTS.length; i += 1) {
    for (let j = i + 1; j < DISTINCT_ACCENTS.length; j += 1) {
      const a = DISTINCT_ACCENTS[i];
      const d = DISTINCT_ACCENTS[j];
      const minSep = Math.min(
        hueDistance(h, a.h),
        hueDistance(h, d.h),
        hueDistance(a.h, d.h),
      );
      if (minSep > bestMinSep) {
        bestMinSep = minSep;
        bestPair = [a.hex, d.hex];
      }
    }
  }

  return [c1, bestPair[0], bestPair[1]];
}

