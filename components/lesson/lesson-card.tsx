"use client";

import { useState } from "react";
import { Code, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevealSection } from "@/components/lesson/reveal-section";
import type { Lesson } from "@/lib/types";

const difficultyTone: Record<Lesson["difficulty"], string> = {
  beginner: "bg-mint-500/15 text-mint-600 border-mint-500/30",
  intermediate: "bg-sun-500/15 text-ink-800 border-sun-500/40",
  advanced: "bg-coral-500/15 text-coral-600 border-coral-500/30"
};

type LessonCardProps = {
  lesson: Lesson;
};

export function LessonCard({ lesson }: LessonCardProps) {
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  async function handleShare() {
    const url = `${window.location.origin}/lesson/${lesson.id}`;
    const text = `Swiple: ${lesson.title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: lesson.title, text, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied.");
        setTimeout(() => setShareMessage(null), 2000);
      } else {
        window.prompt("Copy this link:", url);
      }
    } catch {
      // ignore share cancel
    }
  }

  return (
    <Card className="glass-card relative h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge>{lesson.category}</Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-700">{lesson.duration_seconds}s</span>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-900/10 bg-white text-ink-700 transition hover:bg-cloud-100"
              aria-label="Share lesson"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <CardTitle className="text-xl font-semibold text-ink-900">
          {lesson.title}
        </CardTitle>
        <span
          className={`mt-2 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${difficultyTone[lesson.difficulty]}`}
        >
          {lesson.difficulty}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-ink-700">
        <p>{lesson.body}</p>
        {shareMessage ? <span className="text-xs font-semibold text-ink-700">{shareMessage}</span> : null}
        {lesson.code_snippet ? (
          <div className="rounded-2xl border border-ink-900/10 bg-ink-900/5 p-3 text-xs text-ink-900">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-700">
              <Code className="h-3 w-3" />
              Code snapshot
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed">{lesson.code_snippet}</pre>
          </div>
        ) : null}
        <div className="grid gap-3">
          <RevealSection title="Key idea">{lesson.key_idea}</RevealSection>
          <RevealSection title="Example">{lesson.example}</RevealSection>
          <RevealSection title="Quick quiz">
            <div className="space-y-2">
              <div className="font-semibold text-ink-900">{lesson.quiz_question}</div>
              <ul className="list-disc space-y-1 pl-4">
                {lesson.quiz_choices.map((choice, index) => (
                  <li key={choice + index}>{choice}</li>
                ))}
              </ul>
            </div>
          </RevealSection>
        </div>
      </CardContent>
    </Card>
  );
}
