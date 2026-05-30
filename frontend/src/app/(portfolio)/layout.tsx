import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AvocadoChatButton from "@/components/AvocadoChatButton";
import MobileAvocadoFAB from "@/components/MobileAvocadoFAB";
import ScrollToTop from "@/components/ScrollToTop";
import SearchModal from "@/components/SearchModal";
import { getAllPosts } from "@/lib/blog";
import { projects } from "@/data/projects";
import { quotes } from "@/data/quotes";
import { skills } from "@/data/skills";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const searchData = {
    posts:    getAllPosts().map(({ slug, title, description, tags }) => ({ slug, title, description, tags })),
    projects: projects.map(({ title, description, tags }) => ({ title, description, tags })),
    quotes:   quotes.map(({ text, author, category }) => ({ text, author, category })),
    skills:   skills.map(({ category, items }) => ({ category, items })),
  };

  return (
    <>
      <Nav />
      <SearchModal data={searchData} />
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
