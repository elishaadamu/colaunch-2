import { normalizeArtLabels, rgba, truncateLabel } from "./helpers";

const FONT = "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

export default function PlannerArt({ brand, labels = [], title = "" }) {
  const items = normalizeArtLabels(labels, [
    "Weekly Planner",
    "Focus Blocks",
    "Guided Milestones",
    "Session Queue",
  ]);
  const headerTitle = truncateLabel(title, 24) || items[0];
  const soft = rgba(brand, 0.16);
  const borderAccent = rgba(brand, 0.5);

  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      className="clp-svg"
      stroke="none"
      aria-label={`Weekly planner interface showing ${headerTitle}`}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "480 / 300" }}
    >
      <rect width="480" height="300" rx="16" fill="#10131a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Top header */}
      <circle cx="32" cy="30" r="6" fill={brand} />
      <text x="48" y="35" fill="#f3f4f6" fontSize="14" fontWeight="600" fontFamily={FONT}>
        {headerTitle}
      </text>
      <rect x="358" y="20" width="98" height="20" rx="10" fill={soft} stroke={borderAccent} strokeWidth="1" />
      <circle cx="371" cy="30" r="3" fill={brand} />
      <rect x="380" y="28" width="62" height="4" rx="2" fill={rgba(brand, 0.8)} />

      {/* Subtle time guide lines across schedule grid */}
      {[102, 146, 190].map((y) => (
        <line key={y} x1="24" y1={y} x2="456" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}

      {/* 5 weekly columns */}
      {[0, 1, 2, 3, 4].map((i) => {
        const isFocus = i === 2;
        return (
          <g key={i} transform={`translate(${24 + i * 88} 56)`}>
            <rect
              width="76"
              height="162"
              rx="10"
              fill={isFocus ? soft : "#171b24"}
              stroke={isFocus ? borderAccent : "rgba(255,255,255,0.07)"}
              strokeWidth="1"
            />
            <rect x="10" y="12" width="32" height="6" rx="3" fill={isFocus ? brand : "#3a4050"} />
            <circle cx="62" cy="15" r="3" fill={isFocus ? brand : "#2c3344"} />
            <rect x="10" y="28" width="56" height={28 + (i % 3) * 8} rx="7" fill={brand} opacity={isFocus ? 0.95 : 0.4} />
            <rect x="16" y="35" width="28" height="3.5" rx="1.75" fill="#10131a" opacity="0.45" />
            <rect x="10" y={66 + (i % 3) * 8} width="56" height="28" rx="7" fill="#232938" />
            <rect x="16" y={74 + (i % 3) * 8} width="34" height="4" rx="2" fill="#465066" />
            <rect x="10" y="124" width="56" height="24" rx="7" fill={isFocus ? rgba(brand, 0.32) : "#1f2432"} />
          </g>
        );
      })}

      {/* Connected timeline wave across middle blocks */}
      <path
        d="M62 110 C110 92, 165 130, 238 104 C295 85, 355 126, 414 106"
        fill="none"
        stroke={rgba(brand, 0.6)}
        strokeWidth="1.75"
        strokeDasharray="4 3"
      />
      {[
        [62, 110],
        [238, 104],
        [414, 106],
      ].map(([cx, cy], idx) => (
        <circle key={idx} cx={cx} cy={cy} r="4" fill="#10131a" stroke={brand} strokeWidth="2" />
      ))}

      {/* Bottom feature chips */}
      <g transform="translate(24 232)">
        <rect width="208" height="48" rx="10" fill="#171b24" stroke={borderAccent} strokeWidth="1" />
        <rect x="12" y="14" width="20" height="20" rx="6" fill={soft} />
        <circle cx="22" cy="24" r="4" fill={brand} />
        <text x="40" y="28" fill="#f3f4f6" fontSize="11" fontWeight="500" fontFamily={FONT}>
          {items[1]}
        </text>
      </g>
      <g transform="translate(248 232)">
        <rect width="208" height="48" rx="10" fill="#171b24" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <rect x="12" y="14" width="20" height="20" rx="6" fill="#232938" />
        <circle cx="22" cy="24" r="4" fill={rgba(brand, 0.72)} />
        <text x="40" y="28" fill="#f3f4f6" fontSize="11" fontWeight="500" fontFamily={FONT}>
          {items[2]}
        </text>
      </g>
    </svg>
  );
}
