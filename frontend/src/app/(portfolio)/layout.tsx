import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AvocadoChatButton from "@/components/AvocadoChatButton";
import MobileAvocadoFAB from "@/components/MobileAvocadoFAB";
import ScrollToTop from "@/components/ScrollToTop";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Animated avocado FAB — mobile */}
      <MobileAvocadoFAB />

      {/* Animated avocado chat button — desktop/iPad */}
      <AvocadoChatButton />

      {/* Scroll to top — bottom-left, avoids FAB */}
      <ScrollToTop />
    </>
  );
}
