"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Code } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import type { Lesson } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function LessonDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const loadLesson = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.push("/auth");
        return;
      }
      const { data } = await supabase.from("lessons").select("*").eq("id", params.id).single();
      setLesson((data as Lesson) ?? null);
      setCheckingAuth(false);
    };

    void loadLesson();
  }, [params.id, router]);

  if (checkingAuth || !lesson) {
    return (
      <main className="min-h-screen px-6 pb-24 pt-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/60 bg-white/80 p-8 shadow-soft">
          Loading lesson...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/learn" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-700">
          <ArrowLeft className="h-4 w-4" /> Back to deck
        </Link>
        <div className="mt-6 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-soft">
          <div className="flex items-center justify-between">
            <Badge>{lesson.category}</Badge>
            <span className="text-xs font-semibold text-ink-700">{lesson.duration_seconds}s</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-ink-900">{lesson.title}</h1>
          <p className="mt-4 text-lg text-ink-700">{lesson.body}</p>
          <div className="mt-6 rounded-2xl border border-ink-900/10 bg-ink-900/5 p-5 text-sm text-ink-800">
            {lesson.deep_dive}
          </div>
          {lesson.code_snippet ? (
            <div className="mt-6 rounded-2xl border border-ink-900/10 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-700">
                <Code className="h-4 w-4" /> Code snippet
              </div>
              <pre className="whitespace-pre-wrap text-xs text-ink-900">{lesson.code_snippet}</pre>
            </div>
          ) : null}
          <div className="mt-8 grid gap-4 text-sm text-ink-700">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Key idea</h3>
              <p className="mt-2">{lesson.key_idea}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Example</h3>
              <p className="mt-2">{lesson.example}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Quick quiz</h3>
              <p className="mt-2">{lesson.quiz_question}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {lesson.quiz_choices.map((choice, index) => (
                  <li key={choice + index}>{choice}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
