import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/gradevitian/AuthForms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
