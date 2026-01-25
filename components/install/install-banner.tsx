"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, X } from "lucide-react";

import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "swipelearn.pwaInstall.dismissed";

export function InstallBanner({ hasBottomNav }: { hasBottomNav: boolean }) {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const iOSDevice =
      /iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const safari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;

    setIsIOS(iOSDevice);
    setIsSafari(safari);
    setIsStandalone(Boolean(standalone));
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const shouldShow = useMemo(() => {
    if (isStandalone || dismissed) return false;
    return isIOS || canInstall;
  }, [isStandalone, dismissed, isIOS, canInstall]);

  const handleInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setIsStandalone(true);
    }
    deferredPromptRef.current = null;
    setCanInstall(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        "fixed left-1/2 z-40 w-[92%] max-w-2xl -translate-x-1/2",
        hasBottomNav ? "bottom-24" : "bottom-6"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="region"
      aria-label="Install Swiple app"
    >
      <div className="glass-card flex flex-col gap-4 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-900">Install Swiple for faster daily swipes.</p>
          {isIOS ? (
            <div className="text-xs text-ink-700">
              <span className="font-medium text-ink-900">iOS:</span> Tap Share, then "Add to Home Screen."
              {!isSafari && <span className="ml-2 text-ink-600">Open in Safari for the install option.</span>}
            </div>
          ) : (
            <p className="text-xs text-ink-700">One tap install on Android for offline-ready learning.</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isIOS && (
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink-800"
            >
              <Download className="h-4 w-4" />
              Install
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/70 text-ink-600 transition hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
