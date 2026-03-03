/**
 * API client for Shopflow - auth endpoints and authenticated requests.
 */

import { getTokenFromCookie } from "./auth";
import type { MeResponse } from "@multisystem/contracts";

export type { MeResponse };

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getTokenFromCookie();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { headers, credentials: "include", ...options });
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error || data?.message || `API Error: ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export const authApi = {
  me: () => request<MeResponse>("/api/auth/me"),
};
