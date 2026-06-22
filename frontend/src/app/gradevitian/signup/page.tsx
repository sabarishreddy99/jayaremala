import { SignupForm } from "@/components/gradevitian/AuthForms";
import { gvMetadata } from "@/lib/gradevitian/seo";

export const metadata = gvMetadata({
  path: "/signup",
  title: "Sign up",
  description: "Create a free gradeVITian account to save your calculations, plan your semester, chase a CGPA goal and earn milestone badges.",
});

export default function SignupPage() {
  return <SignupForm />;
}
