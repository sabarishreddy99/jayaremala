import type { Metadata } from "next";
import GVLink from "@/components/gradevitian/GVLink";
import GVPageHeader from "@/components/gradevitian/GVPageHeader";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <GVPageHeader eyebrow="Your data" title="Privacy Policy" subtitle="What we store, what we don't, and how to reach us." />
      <div className="mt-8 flex flex-col gap-4 text-fg-muted leading-relaxed">
        <p>
          gradeVITian is a free set of academic calculators for VIT students. We keep data
          collection to the minimum needed to run the service.
        </p>
        <h2 className="mt-4 text-lg font-semibold text-fg">What we store</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong className="text-fg">Account details</strong> — your name, email and username, with your password stored only as a salted hash.</li>
          <li><strong className="text-fg">Saved calculations</strong> — only the results you explicitly choose to save.</li>
          <li><strong className="text-fg">Feedback comments</strong> — the name and message you submit on the feedback page.</li>
        </ul>
        <h2 className="mt-4 text-lg font-semibold text-fg">What we don&apos;t do</h2>
        <p>
          We never sell your data, and the calculators themselves run entirely in your browser —
          your inputs aren&apos;t sent anywhere unless you save a result while logged in.
        </p>
        <h2 className="mt-4 text-lg font-semibold text-fg">Email</h2>
        <p>
          We use your email only for account-related messages such as a welcome note and password
          resets. Password-reset links expire after one hour.
        </p>
        <h2 className="mt-4 text-lg font-semibold text-fg">Contact</h2>
        <p>
          Questions about your data? Reach out via the{" "}
          <GVLink className="text-accent hover:underline" href="/feedback">feedback page</GVLink>.
        </p>
      </div>
    </section>
  );
}
