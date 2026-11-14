import { normalizeArtLabels, onBrandInk, rgba, truncateLabel } from "./helpers";

const FONT = "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

export default function TrackerArt({ brand, labels = [], title = "" }) {
  const items = normalizeArtLabels(labels, [
    "Daily Progress",
    "Action Checklist",
    "Habit Consistency",
    "Milestone Review",
  ]);
  const headerTitle = truncateLabel(title, 24) || items[0];
  const soft = rgba(brand, 0.16);
  const mid = rgba(brand, 0.45);
  const ink = onBrandInk(brand);

  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      className="clp-svg"
      stroke="none"
      aria-label={`Progress and checklist tracker preview for ${headerTitle}`}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "480 / 300" }}
    >
      <rect width="480" height="300" rx="16" fill="#10131a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Top bar */}
      <rect x="24" y="19" width="22" height="22" rx="6" fill={soft} stroke={mid} strokeWidth="1" />
      <path d="M30 30l3.5 3.5 6-6.5" fill="none" stroke={brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="56" y="35" fill="#f3f4f6" fontSize="14" fontWeight="600" fontFamily={FONT}>
        {headerTitle}
      </text>

      {/* Progress bar across header right */}
      <rect x="336" y="25" width="120" height="10" rx="5" fill="#171b24" />
      <rect x="336" y="25" width="88" height="10" rx="5" fill={brand} />

      {/* Left checklist panel (308px wide) */}
      <rect x="24" y="56" width="308" height="222" rx="12" fill="#171b24" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {items.slice(0, 4).map((label, idx) => {
        const done = idx < 2;
        const y = 70 + idx * 49;
        return (
          <g key={idx} transform={`translate(36 ${y})`}>
            <rect
              width="284"
              height="39"
              rx="8"
              fill={idx === 0 ? soft : "#10131a"}
              stroke={idx === 0 ? mid : "rgba(255,255,255,0.06)"}
              strokeWidth="1"
            />
            <rect
              x="10"
              y="10.5"
              width="18"
              height="18"
              rx="5"
              fill={done ? brand : "#171b24"}
              stroke={done ? brand : "#475063"}
              strokeWidth="1.5"
            />
            {done && (
              <path
                d="M14.5 19.5l3 3 5.5-5.5"
                fill="none"
                stroke={ink}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <text x="38" y="24" fill="#f3f4f6" fontSize="11.5" fontWeight="500" fontFamily={FONT}>
              {label}
            </text>
            <circle cx="268" cy="19.5" r="3.5" fill={done ? brand : "#2f3647"} />
          </g>
        );
      })}

      {/* Right cadence ring + heatmap grid (no invented numbers) */}
      <rect x="344" y="56" width="112" height="222" rx="12" fill="#171b24" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

      {/* Circular progress ring */}
      <circle cx="400" cy="96" r="24" fill="none" stroke="#232938" strokeWidth="6" />
      <circle
        cx="400"
        cy="96"
        r="24"
        fill="none"
        stroke={brand}
        strokeWidth="6"
        strokeDasharray="112 40"
        strokeLinecap="round"
        transform="rotate(-90 400 96)"
      />
      <circle cx="400" cy="96" r="6" fill={soft} stroke={brand} strokeWidth="2" />

      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3].map((col) => {
          const idx = row * 4 + col;
          const active = idx % 3 !== 2;
          const highlight = (row + col) % 4 === 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={360 + col * 21}
              y={138 + row * 21}
              width="15"
              height="15"
              rx="4"
              fill={highlight ? brand : active ? mid : "#232938"}
            />
          );
        }),
      )}

      <rect x="360" y="236" width="80" height="24" rx="7" fill={soft} stroke={mid} strokeWidth="1" />
      <rect x="372" y="246" width="56" height="4" rx="2" fill={brand} />
    </svg>
  );
}
