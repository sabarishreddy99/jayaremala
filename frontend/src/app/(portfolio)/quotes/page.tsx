import { quotes } from "@/data/quotes";
import QuotesClient from "@/components/QuotesClient";

export const metadata = {
  title: "Favorite Quotes — Jaya Sabarish Reddy Remala",
  description: "Words that shaped how I think, build, and live. Collected across books, talks, and late-night reading sessions.",
};

export default function QuotesPage() {
  return <QuotesClient quotes={quotes} />;
}
