import AccountDashboard from "@/components/gradevitian/AccountDashboard";
import { gvMetadata } from "@/lib/gradevitian/seo";

export const metadata = gvMetadata({
  path: "/account",
  title: "Your account",
  description: "Your gradeVITian dashboard — saved calculations, goals, badges and streak.",
  noindex: true,
});

export default function AccountPage() {
  return <AccountDashboard />;
}
