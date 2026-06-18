"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// The browser-fired install event (not in TS's lib DOM types).
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PlatformId = "ios" | "android" | "macos" | "windows";

const PLATFORMS: { id: PlatformId; label: string; steps: string[] }[] = [
  {
    id: "ios",
    label: "iPhone / iPad",
    steps: [
      "Open gradeVITian in Safari.",
      "Tap the Share button (the square with an up arrow).",
      "Scroll down and choose “Add to Home Screen”.",
      "Tap “Add” — the app icon lands on your home screen.",
    ],
  },
  {
    id: "android",
    label: "Android",
    steps: [
      "Open gradeVITian in Chrome.",
      "Tap “Install app” below, or the ⋮ menu (top-right).",
      "Choose “Install app” / “Add to Home screen”.",
      "Confirm — it installs like a native app.",
    ],
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      "In Safari, click Share → “Add to Dock”.",
      "Or in Chrome / Edge, click the install icon in the address bar.",
      "Launch gradeVITian any time from your Dock.",
    ],
  },
  {
    id: "windows",
    label: "Windows",
    steps: [
      "Open gradeVITian in Chrome or Edge.",
      "Click “Install app” below, or the install icon in the address bar.",
      "Or open the ⋮ menu → “Install gradeVITian”.",
      "It opens in its own window, like a desktop app.",
    ],
  },
];

function detectPlatform(): PlatformId {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/android/.test(ua)) return "android";
  if (/macintosh|mac os x/.test(ua)) return "macos";
  return "windows";
}

function DownloadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}

export default function GVInstall({
  variant = "nav",
  prominent = false,
  onTrigger,
}: {
  variant?: "nav" | "mobile" | "hero";
  /** When true (hero variant), renders as the filled primary call-to-action. */
  prominent?: boolean;
  onTrigger?: () => void;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<PlatformId>("windows");

  useEffect(() => {
    setMounted(true);
    setTab(detectPlatform());

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);

    const onBIP = (e: Event) => {
      e.preventDefault(); // stash it so we can trigger the prompt on our own button
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setShowHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Lock background scroll while the help modal is open.
  useEffect(() => {
    if (!showHelp) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowHelp(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [showHelp]);

  if (installed) return null;

  async function nativeInstall() {
    if (!deferred) return false;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setDeferred(null);
    setShowHelp(false);
    return true;
  }

  async function handleClick() {
    onTrigger?.();
    // If the browser gave us a native prompt, use it directly; otherwise guide them.
    if (!(await nativeInstall())) setShowHelp(true);
  }

  const trigger =
    variant === "hero" ? (
      prominent ? (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition-all duration-200 hover:bg-accent-hover hover:shadow-md active:scale-[0.97]"
        >
          <DownloadIcon />
          Install the app
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition-all duration-200 hover:bg-surface-raised active:scale-[0.97]"
        >
          <DownloadIcon />
          Install the app
        </button>
      )
    ) : variant === "mobile" ? (
      <button
        onClick={handleClick}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted transition hover:bg-surface-raised hover:text-fg"
      >
        <DownloadIcon />
        Install app
      </button>
    ) : (
      <button
        onClick={handleClick}
        title="Install gradeVITian as an app"
        className="hidden items-center gap-1.5 rounded-full border border-border-subtle bg-surface/60 px-3 py-1.5 text-sm font-semibold text-fg-muted backdrop-blur transition hover:border-border-strong hover:text-fg md:inline-flex"
      >
        <DownloadIcon />
        Install
      </button>
    );

  const active = PLATFORMS.find((p) => p.id === tab) ?? PLATFORMS[3];

  return (
    <>
      {trigger}

      {mounted &&
        showHelp &&
        createPortal(
          <div
            className="animate-gv-fade fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:items-center sm:p-4"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="animate-gv-pop w-full max-w-md overflow-hidden rounded-t-3xl border border-border-subtle bg-surface shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Install gradeVITian"
            >
              {/* Header */}
              <div className="flex items-start gap-3 border-b border-border-subtle p-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg">
                  <DownloadIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-fg">Install gradeVITian</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
                    Add the app to your home screen or dock — free, fast, and works offline.
                  </p>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  aria-label="Close"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-fg-muted transition hover:bg-surface-raised hover:text-fg"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Platform tabs */}
              <div className="flex gap-1 overflow-x-auto px-4 pt-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setTab(p.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      tab === p.id ? "bg-accent-light text-accent" : "text-fg-subtle hover:text-fg"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Steps */}
              <ol className="space-y-3 p-5">
                {active.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-raised text-xs font-bold text-accent">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-sm leading-relaxed text-fg-muted">{step}</span>
                  </li>
                ))}
              </ol>

              {/* Native install shortcut when the browser supports it */}
              {deferred && (tab === "android" || tab === "windows") && (
                <div className="px-5 pb-5">
                  <button
                    onClick={nativeInstall}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/25 transition hover:bg-accent-hover active:scale-[0.98]"
                  >
                    <DownloadIcon />
                    Install now
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
