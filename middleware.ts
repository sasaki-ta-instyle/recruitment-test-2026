import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Basic auth for /interviewer-guide and /admin (both pages and APIs reading the data).
// Credentials read from env: BASIC_AUTH_USER / BASIC_AUTH_PASS.
// If either env var is missing in local dev, we let everything through (with a console warn).

const PROTECTED_PREFIXES = ["/interviewer-guide", "/admin"];
const REALM = "recruitment-test-2026";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;
  if (!user || !pass) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[middleware] BASIC_AUTH_USER/PASS not set — protected route is open in dev mode."
      );
      return NextResponse.next();
    }
    return new NextResponse("Server misconfigured (no BASIC_AUTH)", { status: 500 });
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    if (idx >= 0) {
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (u === user && p === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

export const config = {
  matcher: ["/interviewer-guide/:path*", "/admin/:path*"],
};
