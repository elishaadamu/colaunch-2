import { normalizeArtLabels, onBrandInk, rgba, truncateLabel } from "./helpers";

const FONT = "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

export default function LibraryArt({ brand, labels = [], title = "" }) {
  const items = normalizeArtLabels(labels, [
    "Resource Vault",
    "Ready Templates",
    "Asset Library",
    "Action Playbooks",
  ]);
  const headerTitle = truncateLabel(title, 24) || items[0];
  const soft = rgba(brand, 0.16);
  const borderAccent = rgba(brand, 0.52);
  const ink = onBrandInk(brand);

  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      className="clp-svg"
      stroke="none"
      aria-label={`Templates and asset library preview for ${headerTitle}`}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "480 / 300" }}
    >
      <rect width="480" height="300" rx="16" fill="#10131a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Top search/title header */}
      <rect x="24" y="18" width="432" height="34" rx="10" fill="#171b24" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="42" cy="35" r="5" fill="none" stroke={brand} strokeWidth="2" />
      <line x1="46" y1="39" x2="50" y2="43" stroke={brand} strokeWidth="2" strokeLinecap="round" />
      <text x="60" y="40" fill="#f3f4f6" fontSize="13" fontWeight="600" fontFamily={FONT}>
        {headerTitle}
      </text>
      <rect x="378" y="27" width="66" height="16" rx="8" fill={soft} stroke={borderAccent} strokeWidth="1" />
      <rect x="392" y="33" width="38" height="4" rx="2" fill={brand} />

      {/* 2x2 library asset cards */}
      {items.slice(0, 4).map((label, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 24 + col * 224;
        const y = 66 + row * 108;
        const active = idx === 0;
        return (
          <g key={idx} transform={`translate(${x} ${y})`}>
            <rect
              width="208"
              height="96"
              rx="12"
              fill={active ? soft : "#171b24"}
              stroke={active ? borderAccent : "rgba(255,255,255,0.07)"}
              strokeWidth="1"
            />
            {/* Document/book glyph with folded corner */}
            <rect x="14" y="14" width="26" height="26" rx="7" fill={active ? brand : "#232938"} />
            <rect x="20" y="21" width="14" height="3" rx="1.5" fill={active ? ink : brand} opacity={active ? 0.72 : 0.85} />
            <rect x="20" y="27" width="10" height="3" rx="1.5" fill={active ? ink : "#6c7280"} opacity={active ? 0.55 : 1} />

            {/* Decorative bookmark lines top-right */}
            <rect x="148" y="18" width="46" height="10" rx="5" fill={active ? rgba(brand, 0.35) : "#222837"} />
            <rect x="158" y="21.5" width="26" height="3" rx="1.5" fill={active ? brand : "#556078"} />

            {/* Card title */}
            <text x="14" y="61" fill="#f3f4f6" fontSize="11.5" fontWeight="600" fontFamily={FONT}>
              {label}
            </text>
            <rect x="14" y="72" width="140" height="5" rx="2.5" fill="#2d3446" />
            <rect x="14" y="81" width="98" height="5" rx="2.5" fill="#232938" />
          </g>
        );
      })}
    </svg>
  );
}
