const PROD_FALLBACK_API = "http://localhost:3000";

const LOCAL_API_USE_PROXY = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function getBalanceApiBaseUrl(): string {
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
