import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Subdomain routing for gradeVITian.
 *
 * The gradeVITian app lives under the `app/gradevitian/**` route segment so it can
 * coexist with the chatbot at `app/page.tsx` (a route group can't own `/`). When a
 * request arrives on the gradeVITian host, we rewrite the clean path the visitor
 * sees (`/gpa`) to the internal segment (`/gradevitian/gpa`). On the main domain,
 * `/gradevitian/*` keeps working unchanged.
 *
 * (Next.js 16 renamed Middleware → Proxy; same functionality.)
 *
 * IMPORTANT: this site builds with `output: "export"` (static), which DISABLES
 * proxy/middleware in production. This file only runs under `next dev` — it lets you
 * preview clean subdomain URLs locally at http://gradevitian.localhost:3000. In
 * production the equivalent is done by nginx pointing the subdomain's document root
 * at the exported `out/gradevitian/` folder. See frontend/GRADEVITIAN.md.
 */
const GV_HOSTS = new Set([
  "gradevitian.jayaremala.com",
  "gradevitian.localhost", // local dev: visit http://gradevitian.localhost:3000
]);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!GV_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Already pointing at the segment (or an internal asset) — leave it alone.
  if (pathname.startsWith("/gradevitian")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/gradevitian${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes, and any path with a file extension (static assets).
  matcher: ["/((?!_next/|api/|.*\\.[\\w]+$).*)"],
};
