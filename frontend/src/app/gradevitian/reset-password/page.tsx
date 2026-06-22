import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/gradevitian/AuthForms";
import { gvMetadata } from "@/lib/gradevitian/seo";

export const metadata = gvMetadata({
  path: "/reset-password",
  title: "Reset password",
  description: "Set a new gradeVITian password.",
  noindex: true,
});

export default function ResetPasswordPage() {
  // useSearchParams (inside ResetPasswordForm) needs a Suspense boundary and keeps
  // the page statically exportable (token is read on the client).
  return (
    <Suspense fallback={<section className="mx-auto max-w-md px-5 py-16 sm:py-24 text-fg-muted">Loading…</section>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
