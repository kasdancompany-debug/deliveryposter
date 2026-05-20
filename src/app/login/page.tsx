"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const ok =
    Boolean(url && key) &&
    !url.includes("placeholder") &&
    !key.includes("placeholder");
  return { ok };
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const authErrorParam = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(
    authErrorParam === "auth"
      ? "Sign-in could not be completed. Try again."
      : null
  );

  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ?? "Delivery Post Studio";
  const dealership =
    process.env.NEXT_PUBLIC_DEALERSHIP_NAME ?? "Dealership";
  const supabaseConfig = getSupabasePublicConfig();

  useEffect(() => {
    if (!supabaseConfig.ok) {
      setCheckingSession(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = redirect;
        return;
      }
      setCheckingSession(false);
    });
  }, [redirect, supabaseConfig.ok]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabaseConfig.ok) {
      setError(
        "Supabase is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy."
      );
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: email.trim(),
          password,
        }
      );

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError(
          "No session returned. In Supabase → Authentication → Email, disable “Confirm email” for staff accounts or confirm this user’s email."
        );
        setLoading(false);
        return;
      }

      window.location.href = redirect;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach Supabase. Check env vars and redeploy."
      );
      setLoading(false);
    }
  }

  if (checkingSession && supabaseConfig.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-600/10 ring-1 ring-amber-500/40">
          <Car className="h-7 w-7 text-amber-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{appName}</h1>
        <p className="text-sm text-muted-foreground">
          {dealership} · Staff portal
        </p>
      </div>

      <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-2xl shadow-black/40">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use the email and password from Supabase → Authentication → Users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marketing@saultnissan.ca"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-amber-500 text-black hover:bg-amber-400"
              disabled={loading || !supabaseConfig.ok}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {!supabaseConfig.ok && (
            <p className="text-sm text-amber-200">
              Missing Supabase keys on this build. Add them in Vercel and
              redeploy.
            </p>
          )}

          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">First-time setup</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Supabase → <strong>Authentication → URL Configuration</strong>:
                Site URL{" "}
                <code className="text-amber-300">
                  https://deliveryposter.vercel.app
                </code>
              </li>
              <li>
                Run SQL migrations in <code className="text-amber-300">supabase/migrations</code>{" "}
                and create the <code className="text-amber-300">delivery-photos</code>{" "}
                storage bucket
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
