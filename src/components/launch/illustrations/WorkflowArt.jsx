import { normalizeArtLabels, rgba, truncateLabel } from "./helpers";

const FONT = "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Connected workflow pipeline SVG illustration shown inside the workspace showcase
 * section — maps real concept features into linked visual stages without invented metrics.
 */
export default function WorkflowArt({ brand, labels = [], title = "" }) {
  const items = normalizeArtLabels(labels, [
    "Workflow Setup",
    "Template Vault",
    "Member Delivery",
    "Analytics Review",
  ]);
  const headerTitle = truncateLabel(title, 28) || "Connected Workspace";
  const soft = rgba(brand, 0.16);
  const borderAccent = rgba(brand, 0.5);

  return (
    <svg
      viewBox="0 0 880 250"
      role="img"
      className="clp-svg"
      stroke="none"
      aria-label={`Connected workflow map for ${headerTitle}`}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "880 / 250" }}
    >
      <rect width="880" height="250" rx="16" fill="#10131a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Top chrome strip */}
      <path d="M0 16 Q0 0 16 0 H864 Q880 0 880 16 V40 H0 Z" fill="#171b24" />
      <line x1="0" y1="40" x2="880" y2="40" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="22" cy="20" r="4" fill="#3a4050" />
      <circle cx="36" cy="20" r="4" fill="#3a4050" />
      <circle cx="50" cy="20" r="4" fill={brand} />
      <text x="68" y="24.5" fill="#f3f4f6" fontSize="13" fontWeight="600" fontFamily={FONT}>
        {headerTitle}
      </text>
      <rect x="752" y="12" width="104" height="16" rx="8" fill={soft} stroke={borderAccent} strokeWidth="1" />
      <circle cx="765" cy="20" r="3" fill={brand} />
      <rect x="774" y="18" width="68" height="4" rx="2" fill={rgba(brand, 0.8)} />

      {/* Flowing curved connector rails between Stage 1 -> Stage 2 -> Stage 3 */}
      <path
        d="M276 112 C308 112, 310 92, 336 92"
        fill="none"
        stroke={brand}
        strokeWidth="2.2"
        strokeDasharray="5 4"
      />
      <path
        d="M276 172 C308 172, 310 186, 336 186"
        fill="none"
        stroke={rgba(brand, 0.55)}
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <path
        d="M578 138 C606 138, 608 138, 636 138"
        fill="none"
        stroke={brand}
        strokeWidth="2.2"
        strokeDasharray="5 4"
      />
      <polygon points="330,87 338,92 330,97" fill={brand} />
      <polygon points="330,181 338,186 330,191" fill={rgba(brand, 0.7)} />
      <polygon points="630,133 638,138 630,143" fill={brand} />

      {/* Left column: Input workflows */}
      <g transform="translate(24 62)">
        <rect width="252" height="72" rx="12" fill={soft} stroke={borderAccent} strokeWidth="1" />
        <rect x="14" y="14" width="24" height="24" rx="7" fill={brand} opacity="0.9" />
        <circle cx="26" cy="26" r="4.5" fill="#10131a" />
        <text x="48" y="30" fill="#f3f4f6" fontSize="12" fontWeight="600" fontFamily={FONT}>
          {items[0]}
        </text>
        <rect x="14" y="48" width="184" height="6" rx="3" fill={rgba(brand, 0.42)} />
      </g>

      <g transform="translate(24 148)">
        <rect width="252" height="72" rx="12" fill="#171b24" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <rect x="14" y="14" width="24" height="24" rx="7" fill="#232938" />
        <circle cx="26" cy="26" r="4.5" fill={brand} />
        <text x="48" y="30" fill="#f3f4f6" fontSize="12" fontWeight="600" fontFamily={FONT}>
          {items[1]}
        </text>
        <rect x="14" y="48" width="156" height="6" rx="3" fill="#2b3244" />
      </g>

      {/* Center hub card */}
      <g transform="translate(338 62)">
        <rect width="240" height="158" rx="14" fill="#171b24" stroke={borderAccent} strokeWidth="1.2" />
        <rect x="16" y="16" width="208" height="32" rx="8" fill={soft} />
        <circle cx="32" cy="32" r="5" fill={brand} />
        <text x="45" y="36" fill="#f3f4f6" fontSize="11.5" fontWeight="600" fontFamily={FONT}>
          {items[2]}
        </text>

        {/* Mini signal bars */}
        {[24, 38, 30, 48, 36, 56].map((h, i) => (
          <rect
            key={i}
            x={26 + i * 32}
            y={128 - h}
            width="20"
            height={h}
            rx="5"
            fill={i >= 4 ? brand : i >= 2 ? rgba(brand, 0.38) : "#262d3d"}
          />
        ))}
        <rect x="16" y="138" width="132" height="5" rx="2.5" fill="#2d3446" />
      </g>

      {/* Right output delivery card */}
      <g transform="translate(638 62)">
        <rect width="218" height="158" rx="14" fill="#171b24" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        <rect x="16" y="16" width="186" height="36" rx="9" fill={soft} stroke={borderAccent} strokeWidth="1" />
        <text x="28" y="38" fill="#f3f4f6" fontSize="11.5" fontWeight="600" fontFamily={FONT}>
          {items[3]}
        </text>
        <rect x="16" y="66" width="186" height="22" rx="7" fill="#10131a" />
        <circle cx="29" cy="77" r="4" fill={brand} />
        <rect x="41" y="74.5" width="112" height="5" rx="2.5" fill="#465066" />
        <rect x="16" y="96" width="186" height="22" rx="7" fill="#10131a" />
        <circle cx="29" cy="107" r="4" fill={rgba(brand, 0.55)} />
        <rect x="41" y="104.5" width="94" height="5" rx="2.5" fill="#3a4255" />
        <rect x="16" y="130" width="186" height="12" rx="6" fill={soft} />
        <rect x="16" y="130" width="132" height="12" rx="6" fill={brand} opacity="0.82" />
      </g>
    </svg>
  );
}

