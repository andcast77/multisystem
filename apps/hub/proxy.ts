import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Session JWTs are httpOnly on the API host (`ms_session` / `ms_refresh`), so the Hub origin
 * cannot read them here. Auth for `/dashboard/*` is enforced client-side (see DashboardLayout)
 * via `/v1/auth/me` with credentials. This proxy is a placeholder for future edge checks
 * (e.g. shared parent domain cookies) or redirects.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
