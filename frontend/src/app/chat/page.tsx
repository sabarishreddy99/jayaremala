import Link from "next/link";
import ChatInterface from "@/components/chat/ChatInterface";
import AvocadoBg from "@/components/chat/AvocadoBg";
import ChatCloseButton from "@/components/chat/ChatCloseButton";

export const metadata = { title: "Chat with Avocado — Jaya's AI" };

export default function ChatPage() {
  return (
    <div className="relative flex flex-col h-[100dvh] bg-bg overflow-hidden">
      <AvocadoBg />

      {/* Nav */}
      <header className="relative z-10 shrink-0 px-4 sm:px-12 pt-4 sm:pt-5 pb-2 sm:pb-3">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-black tracking-tight text-fg hover:opacity-70 transition-opacity"
          >
            Jaya<span className="text-indigo-600 dark:text-indigo-400">.</span>
          </Link>
          {/* Mobile: simple text link */}
          <Link
            href="/"
            className="md:hidden inline-flex items-center gap-1 text-[11px] font-semibold text-fg-faint hover:text-fg transition-colors tracking-wide"
          >
            Portfolio
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Desktop/iPad: animated close button with Esc shortcut */}
          <ChatCloseButton />
        </div>
      </header>

      {/* Chat — fills remaining height; intro is now inside ChatInterface and collapses on first message */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <ChatInterface />
      </div>

    </div>
  );
}
