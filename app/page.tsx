"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles, Star, Timer, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [loadingTarget, setLoadingTarget] = useState<"auth" | "learn" | null>(null);

  function handleNav(target: "auth" | "learn") {
    setLoadingTarget(target);
    router.push(target === "auth" ? "/auth" : "/learn");
  }

  return (
    <main className="relative overflow-hidden bg-noise">
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-mint-500 gradient-blur" />
      <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-sun-500 gradient-blur" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-coral-500 gradient-blur" />

      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-24 pt-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-900 text-white">SL</span>
            SwipeLearn
          </div>
          <button
            type="button"
            onClick={() => handleNav("auth")}
            className="text-sm font-semibold text-ink-700"
            disabled={loadingTarget !== null}
          >
            Sign in
          </button>
        </header>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">
              <Sparkles className="h-4 w-4" />
              60 seconds a day
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
              Learn a little every day.
              <span className="block font-display text-5xl text-ink-800 sm:text-6xl">Swipe your way to mastery.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-700">
              SwipeLearn turns micro-lessons into a daily habit. Swipe to save, learn, or skip.
              Build streaks and explore new topics in under a minute.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => handleNav("auth")} disabled={loadingTarget !== null}>
                {loadingTarget === "auth" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading
                  </>
                ) : (
                  <>
                    Start Swiping <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleNav("learn")}
                disabled={loadingTarget !== null}
              >
                {loadingTarget === "learn" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading
                  </>
                ) : (
                  "Preview deck"
                )}
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-ink-700">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                10 lessons daily
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Swipe gestures + keyboard
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Premium card experience
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -right-6 -top-8 h-32 w-32 animate-float rounded-[40%] bg-mint-500/20" />
            <div className="absolute -left-8 bottom-12 h-24 w-24 animate-float rounded-[42%] bg-coral-500/20" />
            <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-6 shadow-soft backdrop-blur-lg">
              <div className="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
                  <span className="rounded-full border border-ink-900/10 px-3 py-1">ALGORITHMS</span>
                  <span>60s</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-ink-900">Memoization</h3>
                <p className="mt-3 text-sm text-ink-700">
                  Memoization caches function results to avoid repeated work. It turns exponential recursion into linear.
                </p>
                <div className="mt-6 flex items-center justify-between text-xs text-ink-700">
                  <span>Swipe right to learn</span>
                  <span className="rounded-full bg-ink-900/5 px-2 py-1">Tap to reveal</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-ink-700">
                <span>Streak: 6 days</span>
                <span>Saved: 14</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
