"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase/client";
import type { Lesson } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function SavedLibraryPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    const loadSaved = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const { data } = await supabase
        .from("user_lesson_actions")
        .select("lesson:lessons(*)")
        .eq("user_id", user.id)
        .eq("action", "saved")
        .order("created_at", { ascending: false });

      const mapped = (data ?? []).map((row) => row.lesson as Lesson).filter(Boolean);
      setLessons(mapped);
    };

    void loadSaved();
  }, []);

  return (
    <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-ink-900">Saved lessons</h1>
        <p className="mt-2 text-sm text-ink-700">Revisit the lessons you bookmarked.</p>

        <div className="mt-8 grid gap-4">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/lesson/${lesson.id}`}
              className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-card transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <Badge>{lesson.category}</Badge>
                <span className="text-xs font-semibold text-ink-700">{lesson.duration_seconds}s</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">{lesson.title}</h3>
              <p className="mt-2 text-sm text-ink-700">{lesson.body}</p>
            </Link>
          ))}
          {!lessons.length && (
            <div className="rounded-3xl border border-dashed border-ink-900/20 bg-white/70 p-8 text-center text-sm text-ink-700">
              No saved lessons yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
