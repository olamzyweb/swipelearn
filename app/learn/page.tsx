"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Check, X } from "lucide-react";
import { motion } from "framer-motion";

import { supabase } from "@/lib/supabase/client";
import type { Lesson, LessonAction } from "@/lib/types";
import { SwipeDeck } from "@/components/lesson/swipe-deck";
import { Button } from "@/components/ui/button";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function LearnPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.push("/auth");
        return;
      }
      setUserId(data.session.user.id);
    };

    void init();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const loadDeck = async () => {
      setLoading(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data: actions } = await supabase
        .from("user_lesson_actions")
        .select("lesson_id")
        .eq("user_id", userId)
        .gte("created_at", startOfDay.toISOString());

      const excludedIds = (actions ?? []).map((action) => action.lesson_id);

      let lessonsQuery = supabase.from("lessons").select("*").order("created_at", { ascending: false }).limit(10);

      if (excludedIds.length > 0) {
        const formatted = `(${excludedIds.map((id) => `"${id}"`).join(",")})`;
        lessonsQuery = lessonsQuery.not("id", "in", formatted);
      }

      const { data: lessonsData } = await lessonsQuery;
      setLessons((lessonsData as Lesson[]) ?? []);
      setLoading(false);
    };

    void loadDeck();
  }, [userId]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (!lessons.length) return;
      if (event.key === "ArrowLeft") {
        void handleAction(lessons[0], "skipped");
        setLessons((prev) => prev.slice(1));
      }
      if (event.key === "ArrowRight") {
        void handleAction(lessons[0], "learned");
        setLessons((prev) => prev.slice(1));
      }
      if (event.key === "ArrowUp") {
        router.push(`/lesson/${lessons[0].id}`);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lessons, router]);

  const deckTitle = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }, []);

  async function handleAction(lesson: Lesson, action: LessonAction) {
    if (!userId) return;
    setActionLoading(true);
    setActionMessage(action === "learned" ? "Saving learned..." : action === "saved" ? "Saving lesson..." : "Skipping...");
    await supabase.from("user_lesson_actions").upsert(
      {
        user_id: userId,
        lesson_id: lesson.id,
        action
      },
      { onConflict: "user_id,lesson_id,action" }
    );

    if (action === "learned") {
      await updateStreak(userId);
    }
    setActionLoading(false);
    setActionMessage(null);
  }

  async function updateStreak(currentUserId: string) {
    const today = getLocalDateString();
    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

    const { data: profile } = await supabase
      .from("user_profile")
      .select("streak_count,last_learned_date")
      .eq("user_id", currentUserId)
      .single();

    if (!profile) {
      await supabase.from("user_profile").insert({
        user_id: currentUserId,
        streak_count: 1,
        last_learned_date: today
      });
      return;
    }

    if (profile.last_learned_date === today) return;

    const nextCount = profile.last_learned_date === yesterday ? profile.streak_count + 1 : 1;

    await supabase
      .from("user_profile")
      .update({ streak_count: nextCount, last_learned_date: today })
      .eq("user_id", currentUserId);
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 pb-24 pt-16">
        <div className="mx-auto max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-soft">
          Loading your deck...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-6 w-full">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">Daily deck</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink-900">{deckTitle}</h1>
          <p className="mt-3 text-sm text-ink-700">
            Swipe right to mark learned, left to skip, up for a deep dive. Use arrow keys on desktop.
          </p>
        </div>

        <SwipeDeck
          lessons={lessons}
          onDeepDive={(lesson) => router.push(`/lesson/${lesson.id}`)}
          onAction={async (lesson, action) => {
            await handleAction(lesson, action);
            setLessons((prev) => prev.slice(1));
          }}
        />

        <div className="mt-8 flex items-center gap-4">
          <motion.div whileTap={{ scale: 0.92 }}>
            <Button
              size="icon"
              variant="secondary"
              onClick={() =>
                lessons[0] &&
                handleAction(lessons[0], "skipped").then(() => setLessons((prev) => prev.slice(1)))
              }
              aria-label="Skip lesson"
              disabled={actionLoading}
            >
              <X className="h-5 w-5 text-coral-600" />
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.92 }}>
            <Button
              size="icon"
              variant="soft"
              onClick={() =>
                lessons[0] &&
                handleAction(lessons[0], "saved").then(() => setLessons((prev) => prev.slice(1)))
              }
              aria-label="Save lesson"
              disabled={actionLoading}
            >
              <Bookmark className="h-5 w-5 text-ink-900" />
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.92 }}>
            <Button
              size="icon"
              onClick={() =>
                lessons[0] &&
                handleAction(lessons[0], "learned").then(() => setLessons((prev) => prev.slice(1)))
              }
              aria-label="Mark learned"
              disabled={actionLoading}
            >
              <Check className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
        {actionMessage ? <p className="mt-4 text-sm text-ink-700">{actionMessage}</p> : null}
      </div>
    </main>
  );
}
