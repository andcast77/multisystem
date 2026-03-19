/**
 * API client for Shopflow - auth endpoints and authenticated requests.
 */
import { ApiClient } from "@multisystem/shared";
import type { MeResponse } from "@multisystem/contracts";

export type { MeResponse };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const client = new ApiClient(API_URL);

export const authApi = {
  me: () => client.get<MeResponse>("/api/auth/me"),
};
