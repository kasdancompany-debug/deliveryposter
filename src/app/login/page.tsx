"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ?? "Delivery Post Studio";
  const dealership =
    process.env.NEXT_PUBLIC_DEALERSHIP_NAME ?? "Dealership";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      router.push("/dashboard");
      router.refresh();
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/10 ring-1 ring-amber-500/40">
          <Car className="h-7 w-7 text-amber-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{appName}</h1>
        <p className="text-sm text-muted-foreground">{dealership} · Staff portal</p>
      </div>

      <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-2xl shadow-black/40">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your dealership staff credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
            <Button
              type="button"
              className="w-full bg-amber-500 text-black hover:bg-amber-400"
              onClick={() => {
                router.push("/dashboard");
                router.refresh();
              }}
            >
              Continue in demo mode
            </Button>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dealership.com"
                required
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
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-amber-500 text-black hover:bg-amber-400"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
          {process.env.NEXT_PUBLIC_DEMO_MODE !== "true" && (
            <p className="text-center text-xs text-muted-foreground">
              For the full wizard without login, set{" "}
              <code className="text-amber-300">NEXT_PUBLIC_DEMO_MODE=true</code>{" "}
              in Vercel environment variables and redeploy.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
