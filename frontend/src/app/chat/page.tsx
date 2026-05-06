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

      {/* Intro */}
      <div className="relative z-10 shrink-0 px-4 sm:px-6 text-center pb-3 sm:pb-5 pt-1 sm:pt-3">
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-fg-faint">
            Avocado · Live
          </span>
        </div>
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-fg">
          Chat with Avocado 🥑
        </h1>
        <p className="mt-0.5 text-[11px] font-medium text-accent tracking-wide">
          Jaya&apos;s personal AI chatbot
        </p>
        <p className="hidden sm:block mt-2 text-sm text-fg-subtle max-w-sm mx-auto leading-relaxed">
          Ask anything about his work, projects, skills, or background.
        </p>
        <div className="mx-auto mt-3 sm:mt-5 w-8 h-px bg-border" />
      </div>

      {/* Chat — open, fills remaining height */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <ChatInterface />
      </div>

    </div>
  );
}
