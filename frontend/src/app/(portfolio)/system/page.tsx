import type { Metadata } from "next";
import SystemDashboard from "@/components/SystemDashboard";

const SITE_URL = "https://jayaremala.com";

export const metadata: Metadata = {
  title: "System — Live observability | Jaya Sabarish Reddy Remala",
  description:
    "Live observability for this site's AI backend: end-to-end latency percentiles, per-stage RAG pipeline timing, model fallback rate, and health.",
  alternates: { canonical: `${SITE_URL}/system` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/system`,
    title: "System — Live observability",
    description:
      "Real-time metrics for Avocado's hybrid RAG pipeline — latency percentiles, stage breakdown, model fallback, and health.",
    siteName: "Jaya Sabarish Reddy Remala",
  },
};

export default function SystemPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
          Live observability
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
          How this site performs, in real time
        </h1>
        <p className="mt-3 text-sm text-fg-muted leading-relaxed max-w-2xl">
          Avocado runs a hybrid retrieval pipeline — HyDE query expansion, dense (BAAI/bge-base) plus
          BM25 lexical search merged with Reciprocal Rank Fusion, a 1-hop knowledge graph, and a
          model-fallback chain. These numbers are read live from the production backend on every page
          load.
        </p>
      </header>

      <SystemDashboard />
    </div>
  );
}
