"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: lessons } = await supabase.from("lessons").select("category");
      const unique = Array.from(new Set((lessons ?? []).map((item) => item.category).filter(Boolean)));
      setCategories(unique);

      const { data: profile } = await supabase
        .from("user_profile")
        .select("preferred_categories")
        .eq("user_id", user.id)
        .single();

      if (profile?.preferred_categories && Array.isArray(profile.preferred_categories)) {
        setSelected(profile.preferred_categories);
      }

      setLoading(false);
    };

    void load();
  }, [router]);

  const canContinue = useMemo(() => selected.length > 0, [selected.length]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      router.push("/auth");
      return;
    }

    const { error } = await supabase.from("user_profile").upsert({
      user_id: user.id,
      preferred_categories: selected
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/learn");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-noise px-6 pb-24 pt-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-white/60 bg-white/80 p-8 shadow-soft">
          Loading preferences...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-ink-900">Pick your focus</h1>
        <p className="mt-2 text-sm text-ink-700">Choose categories to personalize your daily deck.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => {
            const active = selected.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setSelected((prev) =>
                    prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
                  )
                }
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-900/10 bg-white text-ink-900 hover:bg-cloud-100"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Button onClick={handleSave} disabled={!canContinue || saving}>
            {saving ? "Saving..." : "Continue"}
          </Button>
          {message ? <span className="text-sm text-ink-700">{message}</span> : null}
        </div>
      </div>
    </main>
  );
}
