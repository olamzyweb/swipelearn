"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        router.replace("/onboarding");
      } else {
        router.replace("/auth");
      }
    };

    void run();
  }, [router]);

  return (
    <main className="min-h-screen bg-noise px-6 pb-24 pt-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/60 bg-white/80 p-8 shadow-soft">
        Confirming your email...
      </div>
    </main>
  );
}
