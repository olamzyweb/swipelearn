"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Lesson } from "@/lib/types";

const emptyLesson = {
  title: "",
  category: "",
  difficulty: "beginner" as Lesson["difficulty"],
  duration_seconds: 60,
  body: "",
  key_idea: "",
  example: "",
  code_snippet: "",
  quiz_question: "",
  quiz_choices: "",
  quiz_answer_index: 0,
  deep_dive: ""
};

type LessonFormState = typeof emptyLesson;

type ImportResult = {
  inserted: number;
  failed: number;
};

function parseChoices(input: string) {
  return input
    .split(/\n|,/)
    .map((choice) => choice.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const router = useRouter();
  const [form, setForm] = useState<LessonFormState>(emptyLesson);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [usersList, setUsersList] = useState<Array<{ id: string; email: string | null; created_at: string }>>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [lessonsCount, setLessonsCount] = useState<number | null>(null);
  const [signupSeries, setSignupSeries] = useState<Array<{ label: string; value: number }>>([]);
  const [lessonSeries, setLessonSeries] = useState<Array<{ label: string; value: number }>>([]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsAdmin(Boolean(adminRow));
    };

    void init();
  }, [router]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin) return;
      setUsersLoading(true);
      setUsersError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setUsersError("Missing session token.");
        setUsersLoading(false);
        return;
      }

      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        setUsersError("Failed to load users.");
        setUsersLoading(false);
        return;
      }
      const payload = (await response.json()) as {
        total: number;
        users: Array<{ id: string; email: string | null; created_at: string }>;
      };
      setUsersCount(payload.total);
      setUsersList(payload.users);

      const last7: Array<{ label: string; value: number }> = [];
      const now = new Date();
      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = date.toLocaleDateString("en-US", { weekday: "short" });
        last7.push({ label, value: 0 });
      }
      for (const user of payload.users) {
        const created = new Date(user.created_at);
        const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays <= 6) {
          const index = 6 - diffDays;
          last7[index].value += 1;
        }
      }
      setSignupSeries(last7);

      const { data: lessons, count } = await supabase.from("lessons").select("category", { count: "exact" });
      setLessonsCount(count ?? null);
      const byCategory: Record<string, number> = {};
      for (const row of lessons ?? []) {
        const category = row.category ?? "Other";
        byCategory[category] = (byCategory[category] ?? 0) + 1;
      }
      const lessonSeriesData = Object.entries(byCategory)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setLessonSeries(lessonSeriesData);
      setUsersLoading(false);
    };

    void loadUsers();
  }, [isAdmin]);

  const canSubmit = useMemo(() => {
    return (
      form.title &&
      form.category &&
      form.body &&
      form.key_idea &&
      form.example &&
      form.quiz_question &&
      form.quiz_choices &&
      form.deep_dive
    );
  }, [form]);

  async function handleSubmit() {
    setLoading(true);
    setStatus(null);

    const quizChoices = parseChoices(form.quiz_choices);

    if (quizChoices.length < 2) {
      setStatus("Provide at least two quiz choices.");
      setLoading(false);
      return;
    }

    if (form.quiz_answer_index < 0 || form.quiz_answer_index >= quizChoices.length) {
      setStatus("Quiz answer index must match one of the choices.");
      setLoading(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      difficulty: form.difficulty,
      duration_seconds: Number(form.duration_seconds) || 60,
      body: form.body.trim(),
      key_idea: form.key_idea.trim(),
      example: form.example.trim(),
      code_snippet: form.code_snippet?.trim() || null,
      quiz_question: form.quiz_question.trim(),
      quiz_choices: quizChoices,
      quiz_answer_index: Number(form.quiz_answer_index) || 0,
      deep_dive: form.deep_dive.trim()
    };

    const { error } = await supabase.from("lessons").insert(payload);

    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Lesson created.");
      setForm(emptyLesson);
    }

    setLoading(false);
  }

  async function handleImport() {
    setLoading(true);
    setStatus(null);
    setImportResult(null);

    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        setStatus("Import JSON must be an array of lessons.");
        setLoading(false);
        return;
      }

      const normalized = parsed.map((item) => ({
        title: String(item.title ?? "").trim(),
        category: String(item.category ?? "").trim(),
        difficulty: item.difficulty ?? "beginner",
        duration_seconds: Number(item.duration_seconds ?? 60),
        body: String(item.body ?? "").trim(),
        key_idea: String(item.key_idea ?? "").trim(),
        example: String(item.example ?? "").trim(),
        code_snippet: item.code_snippet ? String(item.code_snippet) : null,
        quiz_question: String(item.quiz_question ?? "").trim(),
        quiz_choices: Array.isArray(item.quiz_choices) ? item.quiz_choices : [],
        quiz_answer_index: Number(item.quiz_answer_index ?? 0),
        deep_dive: String(item.deep_dive ?? "").trim()
      }));

      const { error } = await supabase.from("lessons").insert(normalized);
      if (error) {
        setStatus(error.message);
      } else {
        setImportResult({ inserted: normalized.length, failed: 0 });
        setImportText("");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invalid JSON.");
    }

    setLoading(false);
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-noise px-6 pb-24 pt-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-white/60 bg-white/80 p-8 shadow-soft">
          <h1 className="text-2xl font-semibold text-ink-900">Admin access required</h1>
          <p className="mt-2 text-sm text-ink-700">
            Ask an admin to add your user ID to the admin list in Supabase.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Admin dashboard</h1>
            <p className="mt-2 text-sm text-ink-700">Manage lessons and monitor your learning community.</p>
          </div>
          <div className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-xs font-semibold text-ink-700">
            SwipeLearn Studio
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">Users</p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{usersCount ?? "—"}</p>
            <p className="mt-2 text-sm text-ink-700">Total accounts</p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">Lessons</p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{lessonsCount ?? "—"}</p>
            <p className="mt-2 text-sm text-ink-700">In the library</p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">Imports</p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{importResult?.inserted ?? 0}</p>
            <p className="mt-2 text-sm text-ink-700">Latest batch</p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">Status</p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{usersLoading ? "Syncing" : "Healthy"}</p>
            <p className="mt-2 text-sm text-ink-700">Supabase</p>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink-900">Signups (7 days)</h2>
            <p className="mt-2 text-sm text-ink-700">New users by day.</p>
            <div className="mt-4 grid grid-cols-7 items-end gap-3">
              {signupSeries.map((point) => (
                <div key={point.label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-8 rounded-full bg-mint-500/60"
                    style={{ height: `${Math.max(12, point.value * 18)}px` }}
                  />
                  <span className="text-[11px] font-semibold text-ink-700">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink-900">Lessons by category</h2>
            <p className="mt-2 text-sm text-ink-700">Top categories in your library.</p>
            <div className="mt-4 space-y-3">
              {lessonSeries.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-ink-900/10">
                    <div
                      className="h-2 rounded-full bg-ink-900"
                      style={{ width: `${Math.min(100, item.value * 12)}%` }}
                    />
                  </div>
                </div>
              ))}
              {!lessonSeries.length && <p className="text-sm text-ink-700">No lessons yet.</p>}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Create a lesson</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as Lesson["difficulty"] })}
                className="flex h-11 w-full rounded-xl border border-ink-900/10 bg-white px-4 text-sm text-ink-900 shadow-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={form.duration_seconds}
                onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="min-h-[90px] w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyIdea">Key idea</Label>
              <textarea
                id="keyIdea"
                value={form.key_idea}
                onChange={(e) => setForm({ ...form, key_idea: e.target.value })}
                className="min-h-[70px] w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="example">Example</Label>
              <textarea
                id="example"
                value={form.example}
                onChange={(e) => setForm({ ...form, example: e.target.value })}
                className="min-h-[70px] w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code snippet (optional)</Label>
              <textarea
                id="code"
                value={form.code_snippet}
                onChange={(e) => setForm({ ...form, code_snippet: e.target.value })}
                className="min-h-[90px] w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-3 font-mono text-xs text-ink-900 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quizQuestion">Quiz question</Label>
              <Input
                id="quizQuestion"
                value={form.quiz_question}
                onChange={(e) => setForm({ ...form, quiz_question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quizChoices">Quiz choices (comma or new line separated)</Label>
              <textarea
                id="quizChoices"
                value={form.quiz_choices}
                onChange={(e) => setForm({ ...form, quiz_choices: e.target.value })}
                className="min-h-[90px] w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quizAnswer">Quiz answer index (0-based)</Label>
              <Input
                id="quizAnswer"
                type="number"
                value={form.quiz_answer_index}
                onChange={(e) => setForm({ ...form, quiz_answer_index: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deepDive">Deep dive</Label>
              <textarea
                id="deepDive"
                value={form.deep_dive}
                onChange={(e) => setForm({ ...form, deep_dive: e.target.value })}
                className="min-h-[100px] w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
              {loading ? "Saving..." : "Publish lesson"}
            </Button>
            {status ? <span className="text-sm text-ink-700">{status}</span> : null}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Import JSON</h2>
          <p className="mt-2 text-sm text-ink-700">
            Paste an array of lesson objects that match the lesson schema.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="mt-4 min-h-[160px] w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-xs text-ink-900 shadow-sm"
            placeholder='[{ "title": "...", "category": "...", "difficulty": "beginner", ... }]'
          />
          <div className="mt-4 flex items-center gap-3">
            <Button variant="secondary" onClick={handleImport} disabled={loading || !importText.trim()}>
              {loading ? "Importing..." : "Import lessons"}
            </Button>
            {importResult ? (
              <span className="text-sm text-ink-700">Imported {importResult.inserted} lessons.</span>
            ) : null}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Users</h2>
          <p className="mt-2 text-sm text-ink-700">Total registered users and recent signups.</p>
          <div className="mt-4 text-sm text-ink-700">
            {usersLoading && "Loading users..."}
            {!usersLoading && usersError && usersError}
            {!usersLoading && !usersError && usersCount !== null && (
              <span>Total users: {usersCount}</span>
            )}
          </div>
          {!usersLoading && usersList.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-ink-900/10">
              <div className="grid grid-cols-[1.6fr_1fr] gap-2 bg-ink-900/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-700">
                <span>Email</span>
                <span>Joined</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {usersList.map((user) => (
                  <div key={user.id} className="grid grid-cols-[1.6fr_1fr] gap-2 border-t border-ink-900/5 px-4 py-2 text-sm text-ink-900">
                    <span>{user.email ?? "No email"}</span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
