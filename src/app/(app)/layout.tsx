import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/middleware";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isDemoMode()) {
    return (
      <AppShell userEmail="demo@dealership.com" userName="Demo Staff">
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          <strong>Demo mode</strong> — UI preview only. Add real Supabase keys in{" "}
          <code className="text-amber-200">.env.local</code> and set{" "}
          <code className="text-amber-200">NEXT_PUBLIC_DEMO_MODE=false</code> to
          enable login and data.
        </div>
        {children}
      </AppShell>
    );
  }

  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      userEmail={profile?.email ?? user.email}
      userName={profile?.full_name}
    >
      {children}
    </AppShell>
  );
}
