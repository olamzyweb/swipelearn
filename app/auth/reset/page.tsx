"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function parseHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash.replace(/^#/, "");
  return new URLSearchParams(hash);
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const canSubmit = useMemo(() => {
    return password.length >= 6 && password === confirm;
  }, [password, confirm]);

  useEffect(() => {
    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hashParams = parseHashParams();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) {
          setMessage(error.message);
        }
        setReady(true);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
        }
        setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setReady(true);
        return;
      }

      setMessage("Reset link is invalid or expired. Request a new one.");
      setReady(false);
    };

    void init();
  }, []);

  async function handleReset() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setMessage("Password updated. Please log in again.");
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <main className="min-h-screen bg-noise px-6 pb-24 pt-16">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-soft backdrop-blur-lg">
        <h1 className="text-3xl font-semibold text-ink-900">Reset password</h1>
        <p className="mt-2 text-sm text-ink-700">Choose a new password for your Swiple account.</p>

        {!ready ? (
          <div className="mt-6 rounded-2xl border border-ink-900/10 bg-white px-4 py-3 text-sm text-ink-700">
            {message ?? "Checking your reset link..."}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New password</Label>
              <Input
                id="reset-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm">Confirm password</Label>
              <Input
                id="reset-confirm"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repeat your password"
              />
            </div>
            <Button className="w-full" onClick={handleReset} disabled={!canSubmit || loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
            {message ? <p className="text-sm text-ink-700">{message}</p> : null}
          </div>
        )}
      </div>
    </main>
  );
}
