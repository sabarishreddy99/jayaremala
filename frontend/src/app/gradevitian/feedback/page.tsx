import type { Metadata } from "next";
import CommentsWall from "@/components/gradevitian/CommentsWall";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = { title: "Feedback" };

export default function FeedbackPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
      <GVPageHeader
        eyebrow="We're listening"
        title="Feedback"
        subtitle="This is your product too — tell us what to build next. We read every single word."
      />
      <ScrollReveal delay={80} className="mt-10">
        <CommentsWall />
      </ScrollReveal>
    </section>
  );
}
