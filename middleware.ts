import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Single-password gate for /interviewer-guide and /admin.
// Protocol: HTTP Basic Auth (because browsers handle the prompt natively),
// but the username is ignored — only BASIC_AUTH_PASS is checked.
// If BASIC_AUTH_PASS is missing in local dev, we let everything through (with a console warn).

const PROTECTED_PREFIXES = ["/interviewer-guide", "/admin", "/api/admin"];
const REALM = "recruitment-test-2026";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const pass = process.env.BASIC_AUTH_PASS;
  if (!pass) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[middleware] BASIC_AUTH_PASS not set — protected route is open in dev mode."
      );
      return NextResponse.next();
    }
    return new NextResponse("Server misconfigured (no BASIC_AUTH_PASS)", { status: 500 });
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    const p = idx >= 0 ? decoded.slice(idx + 1) : decoded;
    if (p === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      // 401 のボディが HTML 扱いされて、CSV 等の download リクエストが
      // "export.html" として保存されるのを防ぐ。
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export const config = {
  matcher: ["/interviewer-guide/:path*", "/admin/:path*", "/api/admin/:path*"],
};
