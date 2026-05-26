import { Suspense } from "react";
import Link from "next/link";
import ChatInterface from "@/components/chat/ChatInterface";
import AvocadoBg from "@/components/chat/AvocadoBg";
import ChatCloseButton from "@/components/chat/ChatCloseButton";
import { profile } from "@/data/profile";

export const metadata = {
  title: "Chat with Avocado — Jaya's AI",
  description: "Ask Avocado anything about Jaya's work, projects, and experience. Powered by RAG + Gemini.",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return (
    <div className="relative flex flex-col h-[100dvh] bg-bg overflow-hidden">
      <AvocadoBg />

      {/* Nav */}
      <header className="relative z-10 shrink-0 px-4 sm:px-12 pt-4 sm:pt-5 pb-2 sm:pb-3">
        <div className="mx-auto flex w-full max-w-2xl lg:max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-black tracking-tight text-fg hover:opacity-70 transition-opacity"
          >
            Jaya<span className="text-indigo-600 dark:text-indigo-400">.</span>
          </Link>

          {/* Close button — × circle on mobile, "← Portfolio [esc]" pill on desktop */}
          <ChatCloseButton />
        </div>
      </header>

      {/* Chat — fills remaining height; intro is now inside ChatInterface and collapses on first message */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <Suspense>
          <ChatInterface />
        </Suspense>
      </div>

      {/* Social sidebar — desktop only, fixed to right edge, vertically centred */}
      <div className="hidden lg:flex fixed right-6 xl:right-8 inset-y-0 z-20 flex-col items-center justify-center pointer-events-none">
        {/* Top line */}
        <div className="w-px flex-1 max-h-28 bg-gradient-to-b from-transparent to-border/70" />

        {/* Links */}
        <div className="flex flex-col items-center gap-5 py-6 pointer-events-auto">
          {/* LinkedIn */}
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
            className="group text-fg-faint hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-150"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>

          {/* GitHub */}
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="text-fg-faint hover:text-fg transition-colors duration-150"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
          </a>

          {/* Email */}
          <a
            href={`mailto:${profile.email}`}
            aria-label="Email"
            title={profile.email}
            className="text-fg-faint hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-150"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </a>

          {/* Resume */}
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Resume"
            title="View Resume"
            className="text-fg-faint hover:text-violet-500 dark:hover:text-violet-400 transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </a>
        </div>

        {/* Bottom line */}
        <div className="w-px flex-1 max-h-28 bg-gradient-to-t from-transparent to-border/70" />
      </div>

    </div>
  );
}
