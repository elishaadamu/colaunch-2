import { useId } from "react";
import { normalizeArtLabels, rgba, truncateLabel } from "./helpers";

const FONT = "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

export default function DashboardArt({ brand, labels = [], title = "" }) {
  const gradId = useId();
  const items = normalizeArtLabels(labels, [
    "Workflow Hub",
    "Active Pipelines",
    "Ready Templates",
    "Client Delivery",
  ]);
  const headerTitle = truncateLabel(title, 24) || "Workspace Overview";
  const soft = rgba(brand, 0.16);
  const borderAccent = rgba(brand, 0.45);
  const barMuted = rgba(brand, 0.34);

  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      className="clp-svg"
      stroke="none"
      aria-label={`Software workspace dashboard showing ${headerTitle}`}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "480 / 300" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={rgba(brand, 0.28)} />
          <stop offset="100%" stopColor={rgba(brand, 0)} />
        </linearGradient>
      </defs>

      <rect width="480" height="300" rx="16" fill="#10131a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Seamless single-path window top bar (zero overlapping rects) */}
      <path d="M0 16 Q0 0 16 0 H464 Q480 0 480 16 V42 H0 Z" fill="#171b24" />
      <line x1="0" y1="42" x2="480" y2="42" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="22" cy="21" r="4" fill="#3a4050" />
      <circle cx="36" cy="21" r="4" fill="#3a4050" />
      <circle cx="50" cy="21" r="4" fill={brand} />
      <text x="66" y="25" fill="#f3f4f6" fontSize="12.5" fontWeight="600" fontFamily={FONT}>
        {headerTitle}
      </text>

      {/* Top right status capsule */}
      <rect x="372" y="13" width="88" height="16" rx="8" fill={soft} stroke={borderAccent} strokeWidth="1" />
      <circle cx="384" cy="21" r="3" fill={brand} />
      <rect x="393" y="19" width="54" height="4" rx="2" fill={rgba(brand, 0.65)} />

      {/* Left sidebar modules (204px wide) */}
      <rect x="18" y="54" width="204" height="228" rx="12" fill="#171b24" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {items.slice(0, 4).map((label, idx) => {
        const active = idx === 0;
        return (
          <g key={idx} transform={`translate(26 ${64 + idx * 52})`}>
            <rect
              width="188"
              height="42"
              rx="8"
              fill={active ? soft : "#10131a"}
              stroke={active ? borderAccent : "rgba(255,255,255,0.06)"}
              strokeWidth="1"
            />
            <circle cx="15" cy="21" r="4.5" fill={active ? brand : "#3d4558"} />
            <text x="27" y="25" fill="#f3f4f6" fontSize="10.5" fontWeight={active ? "600" : "500"} fontFamily={FONT}>
              {label}
            </text>
          </g>
        );
      })}

      {/* Right top workspace canvas with bars + trend curve */}
      <rect x="234" y="54" width="228" height="148" rx="12" fill="#171b24" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <text x="250" y="76" fill="#f3f4f6" fontSize="11.5" fontWeight="600" fontFamily={FONT}>
        {items[1]}
      </text>
      <rect x="412" y="66" width="34" height="12" rx="6" fill={soft} />
      <rect x="420" y="70" width="18" height="4" rx="2" fill={brand} />

      {/* Subtle gridlines */}
      {[104, 130, 156].map((gy) => (
        <line key={gy} x1="250" y1={gy} x2="446" y2={gy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      <line x1="250" y1="184" x2="446" y2="184" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

      {/* Activity bars + sparkline overlay */}
      {[34, 56, 44, 70, 52, 82, 68].map((h, i) => (
        <rect
          key={i}
          x={256 + i * 26}
          y={182 - h}
          width="17"
          height={h}
          rx="5"
          fill={i >= 5 ? brand : i >= 3 ? barMuted : "#262d3d"}
        />
      ))}
      <polygon
        points="264.5,144 290.5,122 316.5,134 342.5,108 368.5,126 394.5,96 420.5,110 420.5,182 264.5,182"
        fill={`url(#${gradId})`}
        opacity="0.35"
      />
      <polyline
        points="264.5,144 290.5,122 316.5,134 342.5,108 368.5,126 394.5,96 420.5,110"
        fill="none"
        stroke={brand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        [264.5, 144],
        [342.5, 108],
        [394.5, 96],
        [420.5, 110],
      ].map(([cx, cy], idx) => (
        <circle key={idx} cx={cx} cy={cy} r="3" fill="#10131a" stroke={brand} strokeWidth="2" />
      ))}

      {/* Bottom pipeline card showing distinct module */}
      <rect x="234" y="212" width="228" height="70" rx="12" fill="#171b24" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <rect x="248" y="226" width="14" height="14" rx="4" fill={soft} stroke={borderAccent} strokeWidth="1" />
      <path d="M252 233l2.2 2.2 4.3-4.3" fill="none" stroke={brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="270" y="237" fill="#f3f4f6" fontSize="11" fontWeight="600" fontFamily={FONT}>
        {items[2]}
      </text>
      <rect x="248" y="252" width="198" height="8" rx="4" fill="#10131a" />
      <rect x="248" y="252" width="140" height="8" rx="4" fill={brand} opacity="0.72" />
      <rect x="248" y="267" width="96" height="4" rx="2" fill="#2d3446" />
    </svg>
  );
}
