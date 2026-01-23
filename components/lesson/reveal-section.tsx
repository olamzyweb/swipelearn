"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type RevealSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function RevealSection({ title, children }: RevealSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((prev) => !prev)}
      className="w-full rounded-2xl border border-ink-900/10 bg-white/70 px-4 py-3 text-left shadow-sm transition hover:bg-white"
      aria-expanded={open}
    >
      <div className="flex items-center justify-between text-sm font-semibold text-ink-900">
        {title}
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </div>
      {open && <div className="mt-2 text-sm text-ink-700">{children}</div>}
    </button>
  );
}
