#!/usr/bin/env node
/**
 * Make every <h1>–<h6> in frontend-2 use the "Instrument Serif" font family.
 *
 * Usage (from the frontend-2 folder):
 *   node scripts/apply-heading-font.mjs            # apply (safe to run repeatedly)
 *   node scripts/apply-heading-font.mjs --revert   # remove everything this script added
 *   node scripts/apply-heading-font.mjs --dry-run  # show what would change, write nothing
 *
 * How it works
 *   1. index.html — makes sure the Google Fonts stylesheet for Instrument Serif is loaded.
 *   2. src/index.css — appends one marked rule: h1…h6 { font-family: "Instrument Serif" … !important }
 *      A stylesheet `!important` rule beats Tailwind font classes and inline `style={{ fontFamily }}`
 *      values, so every heading switches without editing individual components.
 *
 * Everything the script writes sits between BEGIN/END marker comments, so re-running it
 * never duplicates anything and --revert removes exactly what it added.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HTML_PATH = join(ROOT, "index.html");
const CSS_PATH = join(ROOT, "src", "index.css");

const args = new Set(process.argv.slice(2));
const REVERT = args.has("--revert");
const DRY = args.has("--dry-run");

const CSS_BEGIN = "/* BEGIN heading-font: Instrument Serif (managed by scripts/apply-heading-font.mjs) */";
const CSS_END = "/* END heading-font */";
const HTML_BEGIN = "<!-- BEGIN heading-font: Instrument Serif (managed by scripts/apply-heading-font.mjs) -->";
const HTML_END = "<!-- END heading-font -->";

const CSS_BLOCK = `${CSS_BEGIN}
h1, h2, h3, h4, h5, h6 {
  font-family: "Instrument Serif", Georgia, "Times New Roman", serif !important;
  /* Instrument Serif ships a single (400) weight — avoid browser faux-bold. */
  font-weight: 400 !important;
  letter-spacing: -0.01em;
  font-synthesis: none;
}
${CSS_END}`;

const HTML_BLOCK = `    ${HTML_BEGIN}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
    ${HTML_END}`;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const blockRe = (begin, end) => new RegExp(`\\n?[ \\t]*${escapeRe(begin)}[\\s\\S]*?${escapeRe(end)}\\n?`, "g");

function update(path, transform, label) {
  if (!existsSync(path)) {
    console.error(`✗ ${label}: not found at ${path}`);
    process.exitCode = 1;
    return;
  }
  const before = readFileSync(path, "utf8");
  const after = transform(before);
  if (after === before) {
    console.log(`• ${label}: no change needed`);
    return;
  }
  if (DRY) {
    console.log(`~ ${label}: would be updated (dry run)`);
    return;
  }
  writeFileSync(path, after);
  console.log(`✓ ${label}: updated`);
}

// ── index.css ────────────────────────────────────────────────────────────────
update(
  CSS_PATH,
  (css) => {
    // Remove exactly what apply adds: "\n" + block + "\n" (keeps the original file byte-for-byte).
    const ownBlock = new RegExp(`\\n${escapeRe(CSS_BEGIN)}[\\s\\S]*?${escapeRe(CSS_END)}\\n?`, "g");
    const stripped = css.replace(ownBlock, "");
    if (REVERT) return stripped;
    const base = stripped.endsWith("\n") ? stripped : `${stripped}\n`;
    return `${base}\n${CSS_BLOCK}\n`;
  },
  "src/index.css heading rule",
);

// ── index.html ───────────────────────────────────────────────────────────────
update(
  HTML_PATH,
  (html) => {
    const stripped = html.replace(blockRe(HTML_BEGIN, HTML_END), "\n");
    if (REVERT) return stripped;
    // Font already loaded by an existing <link>? Then leave index.html alone.
    if (/fonts\.googleapis\.com\/css2\?[^"']*family=Instrument\+Serif/i.test(stripped)) return stripped;
    return stripped.replace(/[ \t]*<\/head>/i, `${HTML_BLOCK}\n  </head>`);
  },
  "index.html font link",
);

console.log(
  REVERT
    ? "Done — headings are back to their previous fonts."
    : "Done — all h1–h6 now use Instrument Serif. Restart `npm run dev` (or rebuild) to see it.",
);
