import type { Metadata } from "next";
import CommentsWall from "@/components/gradevitian/CommentsWall";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = { title: "Feedback" };

export default function FeedbackPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <GVPageHeader
        eyebrow="We're listening"
        title="Feedback"
        subtitle="Suggestions, bugs, or just a hello — we read everything."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CommentsWall />
      </ScrollReveal>
    </section>
  );
}
