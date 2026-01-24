"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Flame, Layers3, Share2, Trophy } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import type { Lesson } from "@/lib/types";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;
      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("user_profile")
        .select("streak_count,preferred_categories")
        .eq("user_id", user.id)
        .single();
      setStreak(profile?.streak_count ?? 0);
      if (Array.isArray(profile?.preferred_categories)) {
        setSelectedCategories(profile?.preferred_categories);
      }

      const { data: lessonCategories } = await supabase.from("lessons").select("category");
      const uniqueCategories = Array.from(
        new Set((lessonCategories ?? []).map((item) => item.category).filter(Boolean))
      );
      setAllCategories(uniqueCategories);

      const { data: learned } = await supabase
        .from("user_lesson_actions")
        .select("lesson:lessons(category)")
        .eq("user_id", user.id)
        .eq("action", "learned");
      const { data: saved } = await supabase
        .from("user_lesson_actions")
        .select("id")
        .eq("user_id", user.id)
        .eq("action", "saved");

      setLearnedCount(learned?.length ?? 0);
      setSavedCount(saved?.length ?? 0);

      const learnedCategories = (learned ?? [])
        .map((row: { lesson?: Array<{ category?: unknown }> }) => {
          const category = row.lesson?.[0]?.category;
          return typeof category === "string" ? category : null;
        })
        .filter((category): category is string => Boolean(category));

      setCategories(Array.from(new Set(learnedCategories)));
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    const storedEnabled = localStorage.getItem("swipelearn.reminder.enabled");
    const storedTime = localStorage.getItem("swipelearn.reminder.time");
    if (storedEnabled) setReminderEnabled(storedEnabled === "true");
    if (storedTime) setReminderTime(storedTime);
    if (typeof Notification !== "undefined") {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("swipelearn.reminder.enabled", String(reminderEnabled));
    localStorage.setItem("swipelearn.reminder.time", reminderTime);
  }, [reminderEnabled, reminderTime]);

  async function handleEnablePush() {
    if (!("serviceWorker" in navigator)) {
      setPushStatus("Service worker not supported.");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setPushStatus("Missing VAPID public key.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushStatus("Permission denied.");
      setPushEnabled(false);
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setPushStatus("Sign in to save subscription.");
      return;
    }

    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      subscription
    });

    if (error) {
      setPushStatus(error.message);
    } else {
      setPushEnabled(true);
      setPushStatus("Push enabled.");
      setTimeout(() => setPushStatus(null), 2500);
    }
  }

  async function handleDisablePush() {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const existing = await registration?.pushManager.getSubscription();
    await existing?.unsubscribe();

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (user) {
      await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
    }

    setPushEnabled(false);
    setPushStatus("Push disabled.");
    setTimeout(() => setPushStatus(null), 2000);
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
      output[i] = raw.charCodeAt(i);
    }
    return output;
  }

  async function handleShareStreak() {
    const text = `I am on a ${streak}-day SwipeLearn streak.`;
    const url = `${window.location.origin}/learn`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "SwipeLearn Streak", text, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareStatus("Streak copied.");
        setTimeout(() => setShareStatus(null), 2000);
      } else {
        window.prompt("Copy this text:", `${text} ${url}`);
      }
    } catch {
      // ignore share cancel
    }
  }

  const stats = useMemo(
    () => [
      { label: "Streak", value: `${streak} days`, icon: Flame },
      { label: "Learned", value: `${learnedCount} lessons`, icon: Trophy },
      { label: "Saved", value: `${savedCount} lessons`, icon: BarChart3 },
      { label: "Categories", value: categories.length ? categories.join(", ") : "None yet", icon: Layers3 }
    ],
    [streak, learnedCount, savedCount, categories]
  );

  async function handleSavePreferences() {
    setPrefsSaving(true);
    setPrefsMessage(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setPrefsMessage("Sign in to update preferences.");
      setPrefsSaving(false);
      return;
    }

    const { error } = await supabase.from("user_profile").upsert({
      user_id: user.id,
      preferred_categories: selectedCategories
    });

    if (error) {
      setPrefsMessage(error.message);
    } else {
      setPrefsMessage("Preferences updated.");
      setTimeout(() => setPrefsMessage(null), 2000);
    }
    setPrefsSaving(false);
  }

  return (
    <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-ink-900">Your progress</h1>
        <p className="mt-2 text-sm text-ink-700">Track streaks, saved lessons, and topics you have learned.</p>
        {email ? (
          <div className="mt-3 inline-flex rounded-full border border-ink-900/10 bg-white px-4 py-2 text-xs font-semibold text-ink-700">
            {email}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">{stat.label}</p>
                  <p className="mt-3 text-lg font-semibold text-ink-900">{stat.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900/5 text-ink-900">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Your categories</h2>
          <p className="mt-2 text-sm text-ink-700">Update your learning focus anytime.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {allCategories.map((category) => {
              const active = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategories((prev) =>
                      prev.includes(category)
                        ? prev.filter((item) => item !== category)
                        : [...prev, category]
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSavePreferences}
              className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-sm transition hover:bg-cloud-100"
              disabled={prefsSaving}
            >
              {prefsSaving ? "Saving..." : "Save preferences"}
            </button>
            {prefsMessage ? <span className="text-sm text-ink-700">{prefsMessage}</span> : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleShareStreak}
            className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-sm transition hover:bg-cloud-100"
          >
            <Share2 className="h-4 w-4" /> Share streak
          </button>
          {shareStatus ? <span className="text-sm text-ink-700">{shareStatus}</span> : null}
        </div>

        <div className="mt-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Daily reminder</h2>
          <p className="mt-2 text-sm text-ink-700">We will remind you in-app once per day when you open SwipeLearn.</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-ink-900">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(event) => setReminderEnabled(event.target.checked)}
                className="h-5 w-5 rounded border border-ink-900/20"
              />
              Enable reminder
            </label>
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <span>Time</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                className="h-10 rounded-xl border border-ink-900/10 bg-white px-3 text-sm text-ink-900"
                disabled={!reminderEnabled}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Push notifications</h2>
          <p className="mt-2 text-sm text-ink-700">
            Enable push reminders on your installed PWA (iOS 16.4+ or Android/Chrome).
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={pushEnabled ? handleDisablePush : handleEnablePush}
              className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-sm transition hover:bg-cloud-100"
            >
              {pushEnabled ? "Disable push" : "Enable push"}
            </button>
            {pushStatus ? <span className="text-sm text-ink-700">{pushStatus}</span> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
