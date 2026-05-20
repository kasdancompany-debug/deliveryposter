import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialConnectionCard } from "@/components/settings/social-connection-card";
import { isMetaOAuthConfigured } from "@/lib/social/meta-env";
import { isDemoMode } from "@/lib/supabase/middleware";

export default function SocialSettingsPage() {
  const demo = isDemoMode();
  const metaConfigured = isMetaOAuthConfigured();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" type="button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary ring-1 ring-border/60">
          <Share2 className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Social accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Meta connection for Facebook Page and Instagram Business publishing.
          </p>
        </div>
      </div>

      {!demo && !metaConfigured && (
        <p className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
          Add{" "}
          <code className="text-orange-200">META_APP_ID</code>,{" "}
          <code className="text-orange-200">META_APP_SECRET</code>, and{" "}
          <code className="text-orange-200">META_REDIRECT_URI</code> to enable
          live OAuth (e.g.{" "}
          <code className="text-orange-200">
            https://your-domain.com/api/meta/callback
          </code>
          ).
        </p>
      )}

      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
        }
      >
        <SocialConnectionCard />
      </Suspense>
    </div>
  );
}
