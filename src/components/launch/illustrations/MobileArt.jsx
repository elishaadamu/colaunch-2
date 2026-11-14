import { normalizeArtLabels, rgba, truncateLabel } from "./helpers";

const FONT = "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

export default function MobileArt({ brand, labels = [], title = "" }) {
  const items = normalizeArtLabels(labels, [
    "Mobile Companion",
    "Instant Delivery",
    "Daily Prompts",
    "Offline Access",
  ]);
  const headerTitle = truncateLabel(title, 24) || items[0];
  const soft = rgba(brand, 0.16);
  const borderAccent = rgba(brand, 0.52);

  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      className="clp-svg"
      stroke="none"
      aria-label={`Mobile companion preview for ${headerTitle}`}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "480 / 300" }}
    >
      <rect width="480" height="300" rx="16" fill="#10131a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Left stacked feature cards */}
      <circle cx="32" cy="38" r="6" fill={brand} />
      <text x="46" y="43" fill="#f3f4f6" fontSize="13.5" fontWeight="600" fontFamily={FONT}>
        {headerTitle}
      </text>

      {items.slice(1, 4).map((label, idx) => {
        const y = 68 + idx * 70;
        const primary = idx === 0;
        return (
          <g key={idx} transform={`translate(24 ${y})`}>
            <rect
              width="216"
              height="56"
              rx="12"
              fill={primary ? soft : "#171b24"}
              stroke={primary ? borderAccent : "rgba(255,255,255,0.07)"}
              strokeWidth="1"
            />
            <circle cx="18" cy="28" r="6" fill={primary ? brand : "#3a4050"} />
            <text x="32" y="25" fill="#f3f4f6" fontSize="11" fontWeight="600" fontFamily={FONT}>
              {label}
            </text>
            <rect x="32" y="34" width="122" height="5" rx="2.5" fill={primary ? rgba(brand, 0.4) : "#2a3142"} />
          </g>
        );
      })}

      {/* Connector lines from feature cards to phone */}
      <path d="M240 96h18M240 166h18M240 236h18" stroke={rgba(brand, 0.45)} strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Right mobile device mockup */}
      <g transform="translate(260 18)">
        <rect width="196" height="264" rx="26" fill="#171b24" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
        <rect x="10" y="10" width="176" height="244" rx="18" fill="#0b0d12" />
        {/* Speaker notch */}
        <rect x="74" y="18" width="48" height="5" rx="2.5" fill="#2c3242" />

        {/* App top highlight card inside phone */}
        <rect x="22" y="38" width="152" height="62" rx="12" fill={soft} stroke={borderAccent} strokeWidth="1" />
        <rect x="34" y="50" width="28" height="8" rx="4" fill={brand} />
        <rect x="34" y="66" width="124" height="7" rx="3.5" fill="#f3f4f6" opacity="0.88" />
        <rect x="34" y="80" width="88" height="5" rx="2.5" fill={rgba(brand, 0.5)} />

        {/* Action tiles inside phone */}
        <rect x="22" y="112" width="72" height="54" rx="10" fill="#171b24" />
        <circle cx="38" cy="128" r="6" fill={brand} />
        <rect x="32" y="144" width="48" height="5" rx="2.5" fill="#475063" />

        <rect x="102" y="112" width="72" height="54" rx="10" fill="#171b24" />
        <circle cx="118" cy="128" r="6" fill={rgba(brand, 0.55)} />
        <rect x="112" y="144" width="48" height="5" rx="2.5" fill="#475063" />

        {/* Activity bars inside phone */}
        <rect x="22" y="176" width="152" height="44" rx="10" fill="#171b24" />
        {[12, 22, 16, 28, 20, 26, 14, 24, 18].map((h, i) => (
          <rect
            key={i}
            x={36 + i * 14}
            y={212 - h}
            width="7"
            height={h}
            rx="3.5"
            fill={i % 2 === 0 ? brand : "#3a4050"}
          />
        ))}

        {/* Bottom dock bar */}
        <rect x="66" y="236" width="64" height="5" rx="2.5" fill="#3a4050" />
      </g>
    </svg>
  );
}
