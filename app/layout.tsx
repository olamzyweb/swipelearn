import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";

import "./globals.css";
import { SiteShell } from "@/components/nav/site-shell";

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces"
});

export const metadata: Metadata = {
  title: "SwipeLearn - Micro learning with a swipe",
  description: "Swipe through 60-second lessons daily. Save, learn, and build streaks.",
  manifest: "/manifest.json",
  themeColor: "#0b0f1a",
  icons: [{ rel: "icon", url: "/icons/icon.svg" }]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${fraunces.variable}`}>
      <body className="bg-cloud-50 text-ink-900">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
