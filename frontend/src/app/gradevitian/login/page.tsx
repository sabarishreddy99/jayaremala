import { LoginForm } from "@/components/gradevitian/AuthForms";
import { gvMetadata } from "@/lib/gradevitian/seo";

export const metadata = gvMetadata({
  path: "/login",
  title: "Log in",
  description: "Log in to gradeVITian to save your GPA & CGPA calculations, plan semesters, track goals and sync across devices.",
});

export default function LoginPage() {
  return <LoginForm />;
}
