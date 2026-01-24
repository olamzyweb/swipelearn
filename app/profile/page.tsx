"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Flame, Layers3, Trophy } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import type { Lesson } from "@/lib/types";

export default function ProfilePage() {
  const [streak, setStreak] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profile")
        .select("streak_count")
        .eq("user_id", user.id)
        .single();
      setStreak(profile?.streak_count ?? 0);

      const { data: learned } = await supabase
        .from("user_lesson_actions")
        .select("lesson:lessons(category)")
        .eq("user_id", user.id)
        .eq("action", "learned");
      const { data: saved } = await supabase
        .from("user_lesson_actions")
        .select("id")
        .eq("user_id", user.id)
        .eq("action", "saved");

      setLearnedCount(learned?.length ?? 0);
      setSavedCount(saved?.length ?? 0);

      const learnedCategories = (learned ?? []).flatMap((row: { lesson?: { category?: unknown } }) => {
        const category = row.lesson?.category;
        return typeof category === "string" && category.length ? [category] : [];
      });

      setCategories(Array.from(new Set(learnedCategories)));
    };

    void loadProfile();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Streak", value: `${streak} days`, icon: Flame },
      { label: "Learned", value: `${learnedCount} lessons`, icon: Trophy },
      { label: "Saved", value: `${savedCount} lessons`, icon: BarChart3 },
      { label: "Categories", value: categories.length ? categories.join(", ") : "None yet", icon: Layers3 }
    ],
    [streak, learnedCount, savedCount, categories]
  );

  return (
    <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-ink-900">Your progress</h1>
        <p className="mt-2 text-sm text-ink-700">Track streaks, saved lessons, and topics you have learned.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">{stat.label}</p>
                  <p className="mt-3 text-lg font-semibold text-ink-900">{stat.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900/5 text-ink-900">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
