/**
 * Public web app URL for every link we share or email (landing pages, pre-order,
 * creator portal, workspaces). Paths and ids are appended by callers, e.g.
 *   `${PUBLIC_APP_URL}/concept/<creator>?concept=<slug>`
 * Override with VITE_PUBLIC_APP_URL. Never uses window.location.origin, so emails sent
 * while running on localhost still contain the live links.
 */
export const PUBLIC_APP_URL = String(
  import.meta.env?.VITE_PUBLIC_APP_URL || "https://colaunch-2.vercel.app"
).replace(/\/$/, "");

export const getPublicAppUrl = () => PUBLIC_APP_URL;
