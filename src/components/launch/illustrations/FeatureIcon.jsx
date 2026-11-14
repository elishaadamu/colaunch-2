import { resolveFeatureIconKind } from "./helpers";

/**
 * Small inline vector icon chosen by feature keywords (calendar, checklist,
 * chart, chat bubble, book, bell; default check).
 */
export default function FeatureIcon({ title, color = "#c81e3c", size = 18 }) {
  const kind = resolveFeatureIconKind(title);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="clp-icon-svg"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block" }}
    >
      {kind === "calendar" && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18" />
          <path d="M8 14h2M13 14h3" />
        </>
      )}
      {kind === "checklist" && (
        <>
          <path d="M9 7h11M9 12h11M9 17h11" />
          <path d="M4 7l1.2 1.2L7 6M4 12l1.2 1.2L7 11M4 17l1.2 1.2L7 16" />
        </>
      )}
      {kind === "chart" && (
        <>
          <path d="M4 20h16" />
          <path d="M7 16v-4M12 16V8M17 16V5" />
        </>
      )}
      {kind === "chat" && (
        <>
          <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-5 4V6z" />
          <path d="M8.5 9h7M8.5 12.5h4.5" />
        </>
      )}
      {kind === "book" && (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22V5.5z" />
          <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5A2.5 2.5 0 0 1 20 22V5.5z" />
        </>
      )}
      {kind === "bell" && (
        <>
          <path d="M6 10a6 6 0 1 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </>
      )}
      {kind === "check" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.2l2.3 2.3 4.8-4.8" />
        </>
      )}
    </svg>
  );
}
