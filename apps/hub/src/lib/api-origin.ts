/**
 * Dev default: '' so fetch/EventSource use same origin and Next rewrites `/v1` → API (avoids CORS).
 * Set `NEXT_PUBLIC_API_URL` to an absolute URL when the API is on another host (e.g. production).
 *
 * In dev, `NEXT_PUBLIC_API_URL=http://localhost:3000` (legacy .env) is treated like empty so traffic
 * still goes through the Next rewrite on :3001.
 */
const PROD_FALLBACK_API = "http://localhost:3000";

const LOCAL_API_USE_PROXY = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function getHubApiBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_URL;
  if (typeof v === "string" && v.trim() !== "") {
    const trimmed = v.trim().replace(/\/$/, "");
    if (process.env.NODE_ENV === "development" && LOCAL_API_USE_PROXY.has(trimmed)) {
      return "";
    }
    return trimmed;
  }
  return process.env.NODE_ENV === "development" ? "" : PROD_FALLBACK_API;
}

/** WebSocket base (same host as page when API base is empty + dev rewrite). */
export function getHubWsBaseUrl(): string {
  const base = getHubApiBaseUrl();
  if (base === "") {
    if (typeof window === "undefined") return "ws://localhost";
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }
  return base.replace(/^http/, "ws");
}
