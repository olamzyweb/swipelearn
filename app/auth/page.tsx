"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      router.push("/learn");
    }
    setLoading(false);
  }

  async function handleRegister() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm your account.");
      router.push("/learn");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-noise px-6 pb-24 pt-16">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-soft backdrop-blur-lg">
        <h1 className="text-3xl font-semibold text-ink-900">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-700">Sign in or create a new SwipeLearn account.</p>

        <Tabs defaultValue="login" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@swipelearn.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="register">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@swipelearn.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
                />
              </div>
              <Button className="w-full" onClick={handleRegister} disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        {message ? <p className="mt-6 text-sm text-ink-700">{message}</p> : null}
      </div>
    </main>
  );
}
