import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AvocadoChatButton from "@/components/AvocadoChatButton";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Avocado FAB — mobile only */}
      <Link
        href="/chat"
        className="md:hidden fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
      >
        <span className="text-base leading-none">🥑</span>
        <span>✦</span>
      </Link>

      {/* Animated avocado chat button — desktop/iPad only */}
      <AvocadoChatButton />
    </>
  );
}
