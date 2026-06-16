import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/gradevitian/AuthForms";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  // useSearchParams (inside ResetPasswordForm) needs a Suspense boundary and keeps
  // the page statically exportable (token is read on the client).
  return (
    <Suspense fallback={<section className="mx-auto max-w-md px-4 py-14 text-fg-muted">Loading…</section>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
