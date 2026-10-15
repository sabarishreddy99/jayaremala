import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["192.168.1.166"],

  /**
   * The build year, inlined as a literal into both the HTML and the client
   * bundle.
   *
   * `new Date()` inside a client component is a hydration hazard on a static
   * export: the HTML is rendered once at build time, but the component runs
   * again in the browser whenever someone visits. The two agree until the year
   * rolls over, and then every visitor gets a mismatch on "© 2026" and on any
   * "N years in business" counter.
   *
   * NEXT_PUBLIC_* values are substituted at build time, so both sides read the
   * same literal and the copy means "as of the last deploy", which is the
   * honest reading for a statically exported site anyway.
   */
  env: {
    NEXT_PUBLIC_BUILD_YEAR: String(new Date().getFullYear()),
    // The footer's "last edition" line. Same reasoning: the deploy date, not
    // the visitor's today (the old footer printed today's date as "Updated").
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
};

export default nextConfig;
