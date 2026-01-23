"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, GraduationCap, Home, Sparkles, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/learn", label: "Learn", icon: Sparkles },
  { href: "/library/saved", label: "Saved", icon: BookMarked },
  { href: "/library/learned", label: "Learned", icon: GraduationCap },
  { href: "/profile", label: "Profile", icon: UserCircle }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-full border border-white/60 bg-white/80 px-4 py-2 shadow-soft backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition",
            pathname === "/" ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-cloud-100"
          )}
          aria-label="Home"
        >
          <Home className="h-5 w-5" />
        </Link>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition",
                active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-cloud-100"
              )}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
