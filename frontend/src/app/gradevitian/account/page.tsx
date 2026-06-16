import type { Metadata } from "next";
import AccountDashboard from "@/components/gradevitian/AccountDashboard";

export const metadata: Metadata = { title: "Your account" };

export default function AccountPage() {
  return <AccountDashboard />;
}
