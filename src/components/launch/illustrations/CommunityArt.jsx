import { normalizeArtLabels, rgba, truncateLabel } from "./helpers";

const FONT = "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

export default function CommunityArt({ brand, labels = [], title = "" }) {
  const items = normalizeArtLabels(labels, [
    "Member Circle",
    "Weekly Q&A Threads",
    "Peer Feedback Room",
    "Shared Office Hours",
  ]);
  const headerTitle = truncateLabel(title, 24) || items[0];
  const soft = rgba(brand, 0.16);
  const mid = rgba(brand, 0.45);
  const strong = rgba(brand, 0.72);

  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      className="clp-svg"
      stroke="none"
      aria-label={`Member community threads and channels for ${headerTitle}`}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "480 / 300" }}
    >
      <rect width="480" height="300" rx="16" fill="#10131a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Top member group header */}
      <g transform="translate(24 18)">
        <circle cx="14" cy="14" r="11" fill={brand} />
        <circle cx="30" cy="14" r="11" fill={strong} stroke="#10131a" strokeWidth="2" />
        <circle cx="46" cy="14" r="11" fill="#3a4050" stroke="#10131a" strokeWidth="2" />
        <text x="68" y="19" fill="#f3f4f6" fontSize="14" fontWeight="600" fontFamily={FONT}>
          {headerTitle}
        </text>
      </g>

      {/* Threaded connector spine */}
      <path d="M58 124 V220" stroke={rgba(brand, 0.28)} strokeWidth="1.5" strokeDasharray="3 3" />

      {/* 3 wide community thread cards */}
      {items.slice(0, 3).map((label, idx) => {
        const y = 60 + idx * 75;
        const highlighted = idx === 0;
        return (
          <g key={idx} transform={`translate(24 ${y})`}>
            <rect
              width="432"
              height="63"
              rx="12"
              fill={highlighted ? soft : "#171b24"}
              stroke={highlighted ? mid : "rgba(255,255,255,0.07)"}
              strokeWidth="1"
            />
            <rect x="0" y="12" width="4" height="39" rx="2" fill={highlighted ? brand : "#3a4050"} />

            {/* Avatar emblem */}
            <circle cx="34" cy="31.5" r="16" fill={highlighted ? mid : "#232938"} />
            <circle cx="34" cy="27" r="5" fill={highlighted ? brand : "#6c7280"} />
            <path
              d="M25 40.5c2-4 16-4 18 0"
              fill="none"
              stroke={highlighted ? brand : "#6c7280"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {highlighted && <circle cx="46" cy="43" r="4" fill={brand} stroke="#10131a" strokeWidth="1.5" />}

            {/* Topic text */}
            <text x="64" y="28" fill="#f3f4f6" fontSize="12.5" fontWeight="600" fontFamily={FONT}>
              {label}
            </text>
            <rect x="64" y="39" width="184" height="5.5" rx="2.75" fill={highlighted ? rgba(brand, 0.36) : "#2a3142"} />
            <rect x="256" y="39" width="68" height="5.5" rx="2.75" fill="#232938" />
            <rect x="358" y="22.5" width="56" height="18" rx="9" fill={highlighted ? rgba(brand, 0.24) : "#232938"} stroke={highlighted ? mid : "none"} strokeWidth="1" />
            <rect x="372" y="29.5" width="28" height="4" rx="2" fill={highlighted ? brand : "#556078"} />
          </g>
        );
      })}
    </svg>
  );
}
