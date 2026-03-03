import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["*"];

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.includes("*")) return origin || "*";
  return ALLOWED_ORIGINS.includes(origin) ? origin : "";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Proteção de rotas /admin (exceto login) ──────────────────
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/api/admin/auth")
  ) {
    const adminToken = request.cookies.get("imobierp_admin_token")?.value;

    if (!adminToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validação básica do JWT (formato válido, não expirado)
    // A verificação completa da assinatura é feita nas API routes
    try {
      const parts = adminToken.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT");
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error("Token expired");
      }
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── Proteção de API admin (exceto auth) ──────────────────────
  if (
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/auth")
  ) {
    const adminToken =
      request.cookies.get("imobierp_admin_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!adminToken) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  // ─── CORS para rotas de API ───────────────────────────────────
  if (pathname.startsWith("/api")) {
    const corsOrigin = getCorsOrigin(request);

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Cron-Secret, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = NextResponse.next();
    if (corsOrigin) {
      response.headers.set("Access-Control-Allow-Origin", corsOrigin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Cron-Secret, X-Requested-With"
      );
    }

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  }

  // ─── Security headers para demais rotas ───────────────────────
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
