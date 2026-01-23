"use client";

import { useMemo, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { Lesson, LessonAction } from "@/lib/types";
import { LessonCard } from "@/components/lesson/lesson-card";
import { cn } from "@/lib/utils";

const swipeThreshold = 120;
const swipeUpThreshold = -120;

type SwipeDeckProps = {
  lessons: Lesson[];
  onAction: (lesson: Lesson, action: LessonAction) => Promise<void> | void;
  onDeepDive: (lesson: Lesson) => void;
};

type SwipeCardProps = {
  lesson: Lesson;
  isTop: boolean;
  offset: number;
  scale: number;
  onDecision: (lesson: Lesson, action: LessonAction) => void;
  onDeepDive: (lesson: Lesson) => void;
};

function SwipeCard({ lesson, isTop, offset, scale, onDecision, onDeepDive }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const rightOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);
  const leftOpacity = useTransform(x, [-swipeThreshold, 0], [1, 0]);
  const upOpacity = useTransform(y, [swipeUpThreshold, -40], [1, 0]);

  return (
    <motion.div
      className={cn("absolute inset-0", !isTop && "pointer-events-none")}
      style={{
        y: isTop ? y : 0,
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0
      }}
      animate={{
        scale,
        y: offset,
        opacity: 1
      }}
      drag={isTop ? true : false}
      dragElastic={0.15}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (!isTop) return;
        if (info.offset.x > swipeThreshold) {
          onDecision(lesson, "learned");
        } else if (info.offset.x < -swipeThreshold) {
          onDecision(lesson, "skipped");
        } else if (info.offset.y < swipeUpThreshold) {
          onDeepDive(lesson);
        } else {
          x.set(0);
          y.set(0);
        }
      }}
      whileTap={isTop ? { scale: 1.02 } : undefined}
    >
      {isTop && (
        <>
          <motion.div
            style={{ opacity: rightOpacity }}
            className="pointer-events-none absolute left-6 top-6 rounded-full border border-mint-500/30 bg-mint-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-mint-600"
          >
            Learned
          </motion.div>
          <motion.div
            style={{ opacity: leftOpacity }}
            className="pointer-events-none absolute right-6 top-6 rounded-full border border-coral-500/30 bg-coral-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-coral-600"
          >
            Skip
          </motion.div>
          <motion.div
            style={{ opacity: upOpacity }}
            className="pointer-events-none absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-full border border-ink-900/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink-900"
          >
            Deep Dive <ArrowUpRight className="h-3 w-3" />
          </motion.div>
        </>
      )}
      <LessonCard lesson={lesson} />
    </motion.div>
  );
}

export function SwipeDeck({ lessons, onAction, onDeepDive }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const current = lessons[index];

  const stack = useMemo(() => lessons.slice(index, index + 3), [lessons, index]);

  async function handleDecision(lesson: Lesson, action: LessonAction) {
    await onAction(lesson, action);
    setIndex((prev) => Math.min(prev + 1, lessons.length));
  }

  if (!current) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-3xl border border-dashed border-ink-900/20 bg-white/70 p-10 text-center">
        <div>
          <h3 className="text-xl font-semibold text-ink-900">You are all caught up</h3>
          <p className="mt-2 text-sm text-ink-700">Come back tomorrow for a fresh deck.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[560px] w-full max-w-md">
      {stack
        .map((lesson, stackIndex) => {
          const isTop = stackIndex === 0;
          const offset = stackIndex * 12;
          const scale = 1 - stackIndex * 0.04;

          return (
            <SwipeCard
              key={lesson.id}
              lesson={lesson}
              isTop={isTop}
              offset={offset}
              scale={scale}
              onDecision={(target, action) => void handleDecision(target, action)}
              onDeepDive={onDeepDive}
            />
          );
        })
        .reverse()}
    </div>
  );
}
