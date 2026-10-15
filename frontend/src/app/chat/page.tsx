import { Suspense } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import AvocadoBg from "@/components/chat/AvocadoBg";
import AvocadoCutClose from "@/components/chat/AvocadoCutClose";
import SeedAvatar from "@/components/chat/SeedAvatar";

export const metadata = {
  title: "Ask Avocado | Jaya's AI",
  description: "Ask Avocado anything about Jaya's work, projects, and experience. Powered by RAG + Gemini.",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return (
    // `portfolio` scopes the Avocado accent (globals.css) so Avocado
    // matches the homepage it is reached from. This route sits outside the
    // (portfolio) group, so it needs the class explicitly.
    <div className="portfolio relative flex flex-col h-[100dvh] bg-bg overflow-hidden">
      <AvocadoBg />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="relative z-[60] shrink-0 px-4 sm:px-8 pt-3.5 pb-2">
        <div className="mx-auto flex w-full max-w-2xl lg:max-w-3xl items-center justify-between">

          {/* Avocado identity — clear "who you're talking to" */}
          <div className="flex items-center gap-2.5">
            <SeedAvatar size={32} />
            <div>
              <p className="display-serif text-lg text-fg leading-none">Avocado</p>
              <p className="text-[10px] text-fg-faint leading-none mt-0.5">Jaya&apos;s AI · Ask me anything</p>
            </div>
          </div>

          {/* Close: a whole avocado; clicking it (or Esc) cuts it in half and leaves. */}
          <AvocadoCutClose />
        </div>
      </header>

      {/* ── Chat ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <Suspense>
          <ChatInterface />
        </Suspense>
      </div>
    </div>
  );
}
