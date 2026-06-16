import type { Metadata } from "next";
import { LoginForm } from "@/components/gradevitian/AuthForms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <LoginForm />;
}
