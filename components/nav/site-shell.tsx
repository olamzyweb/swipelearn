"use client";

import { usePathname } from "next/navigation";

import { InstallBanner } from "@/components/install/install-banner";
import { BottomNav } from "@/components/nav/bottom-nav";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/" || pathname === "/auth" || pathname === "/onboarding" || pathname.startsWith("/auth/");

  return (
    <div className="relative min-h-screen">
      {children}
      <InstallBanner hasBottomNav={!hideNav} />
      {!hideNav && <BottomNav />}
    </div>
  );
}
