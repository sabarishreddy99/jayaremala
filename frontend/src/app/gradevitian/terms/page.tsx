import type { Metadata } from "next";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <GVPageHeader eyebrow="The fine print" title="Terms & Conditions" subtitle="Free, as-is, and built to help VITians — here's the deal." />
      <div className="mt-8 flex flex-col gap-4 text-fg-muted leading-relaxed">
        <p>
          By using gradeVITian you agree to these terms. The service is provided free of charge,
          as-is, for the convenience of VIT students.
        </p>
        <h2 className="mt-4 text-lg font-semibold text-fg">Accuracy</h2>
        <p>
          The calculators follow VIT&apos;s published grading and attendance schemes to the best of our
          knowledge, but results are estimates. Always confirm official figures with VTOP and your
          faculty. gradeVITian is not affiliated with or endorsed by VIT.
        </p>
        <h2 className="mt-4 text-lg font-semibold text-fg">Your account</h2>
        <p>
          You&apos;re responsible for keeping your login credentials secure and for the content you post
          to the feedback wall. We may remove content that is abusive, spammy, or unlawful.
        </p>
        <h2 className="mt-4 text-lg font-semibold text-fg">Liability</h2>
        <p>
          We aren&apos;t liable for academic decisions made based on these tools. Use them as a helpful
          guide, not an official record.
        </p>
        <h2 className="mt-4 text-lg font-semibold text-fg">Changes</h2>
        <p>These terms may be updated over time; continued use means you accept the latest version.</p>
      </div>
    </section>
  );
}
