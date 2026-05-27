import QuotesFeed from "@/components/QuotesFeed";
import { quotes as staticQuotes } from "@/data/quotes";

export const metadata = {
  title: "Favorite Quotes — Jaya Sabarish Reddy Remala",
  description: "Words that shaped how I think, build, and live. Collected across books, talks, and late-night reading sessions.",
};

export default function QuotesPage() {
  return <QuotesFeed staticQuotes={staticQuotes} />;
}
