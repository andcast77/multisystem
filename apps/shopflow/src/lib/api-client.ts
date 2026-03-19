/**
 * API client for Shopflow - auth endpoints and authenticated requests.
 */
import { ApiClient } from "@multisystem/shared";
import type { MeResponse } from "@multisystem/contracts";

export type { MeResponse };

const viteApiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
const legacyNextApiUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined;
const API_URL = viteApiUrl || legacyNextApiUrl || "http://localhost:3000";

const client = new ApiClient(API_URL);

export const authApi = {
  me: () => client.get<MeResponse>("/api/auth/me"),
};
