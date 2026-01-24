"use client";

import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/nav/bottom-nav";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/" || pathname === "/auth" || pathname === "/onboarding" || pathname.startsWith("/auth/");

  return (
    <div className="relative min-h-screen">
      {children}
      {!hideNav && <BottomNav />}
    </div>
  );
}
