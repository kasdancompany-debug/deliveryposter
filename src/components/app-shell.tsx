"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Car,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  userName?: string | null;
}

export function AppShell({ children, userEmail, userName }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ?? "Delivery Post Studio";
  const dealership =
    process.env.NEXT_PUBLIC_DEALERSHIP_NAME ?? "Dealership";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = [
    { href: "/dashboard", label: "Posts", icon: LayoutDashboard },
    { href: "/posts/new", label: "New delivery", icon: Plus },
    { href: "/settings/social", label: "Social", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/5 ring-1 ring-amber-500/30">
              <Car className="h-5 w-5 text-amber-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none tracking-tight">
                {appName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {dealership}
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 text-muted-foreground",
                    pathname === href || pathname.startsWith(href + "/")
                      ? "bg-secondary text-foreground"
                      : ""
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-right md:block">
              <p className="text-xs font-medium">{userName ?? "Staff"}</p>
              <p className="text-[11px] text-muted-foreground">{userEmail}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-amber-600/5 blur-3xl" />
        <Sparkles className="absolute right-8 top-24 h-4 w-4 text-amber-500/20" />
      </div>
    </div>
  );
}
