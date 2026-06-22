import { ForgotPasswordForm } from "@/components/gradevitian/AuthForms";
import { gvMetadata } from "@/lib/gradevitian/seo";

export const metadata = gvMetadata({
  path: "/forgot-password",
  title: "Forgot password",
  description: "Reset your gradeVITian password.",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
