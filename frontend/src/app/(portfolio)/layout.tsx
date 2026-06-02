import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AvocadoChatButton from "@/components/AvocadoChatButton";
import MobileAvocadoFAB from "@/components/MobileAvocadoFAB";
import ScrollToTop from "@/components/ScrollToTop";
import SearchModal from "@/components/SearchModal";
import IntroScreen from "@/components/IntroScreen";
import ScrollAtmosphere from "@/components/ScrollAtmosphere";
import SectionIndicator from "@/components/SectionIndicator";
import PageTransition from "@/components/PageTransition";
import { getSearchIndex } from "@/lib/searchIndex";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntroScreen />
      <ScrollAtmosphere />
      <SectionIndicator />
      <Nav />
      <SearchModal items={getSearchIndex()} />
      <main className="flex-1"><PageTransition>{children}</PageTransition></main>
      <Footer />
      <MobileAvocadoFAB />
      <AvocadoChatButton />
      <ScrollToTop />
    </>
  );
}
