"use client";

import {
  CheckCircle2,
  Loader2,
  Rocket,
  Save,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostPreviewCard } from "@/components/post-preview-card";
import { StatusBadge } from "@/components/status-badge";
import { getDealershipName } from "@/lib/captions";
import type { PlateSafetyStatus } from "@/lib/delivery-score/types";
import {
  plateSafetySummaryLabel,
} from "@/lib/plate-safety";
import { cn } from "@/lib/utils";
import type { PlatformChoice, PostStatus } from "@/types/database";

interface PreviewApprovalStepProps {
  caption: string;
  imageUrls: string[];
  platforms: PlatformChoice;
  status: PostStatus;
  plateSafety: PlateSafetyStatus;
  saving: boolean;
  onSaveDraft: () => void;
  onMarkReady: () => void;
  onApprovePublish: () => void;
  readOnly?: boolean;
}

const PLATE_SUMMARY_STYLES: Record<
  PlateSafetyStatus,
  { row: string; value: string }
> = {
  safe: {
    row: "border-emerald-500/30 bg-emerald-500/5",
    value: "text-emerald-300",
  },
  attention: {
    row: "border-amber-500/30 bg-amber-500/5",
    value: "text-amber-300",
  },
  needs_blur: {
    row: "border-orange-500/30 bg-orange-500/5",
    value: "text-orange-300",
  },
};

export function PreviewApprovalStep({
  caption,
  imageUrls,
  platforms,
  status,
  plateSafety,
  saving,
  onSaveDraft,
  onMarkReady,
  onApprovePublish,
  readOnly,
}: PreviewApprovalStepProps) {
  const locked = status === "posted" || readOnly;
  const plateStyles = PLATE_SUMMARY_STYLES[plateSafety];
  const plateLabel = plateSafetySummaryLabel(plateSafety);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Preview & approval
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review how your post will look before publishing.
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <Card className={cn("border", plateStyles.row)}>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40">
              <Shield className={cn("h-5 w-5", plateStyles.value)} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Delivery summary
              </p>
              <p className="text-sm text-foreground">
                Plate Safety:{" "}
                <span className={cn("font-semibold", plateStyles.value)}>
                  {plateLabel}
                </span>
              </p>
            </div>
          </div>
          {plateSafety === "safe" && (
            <span className="shrink-0 text-lg" aria-hidden>
              🛡
            </span>
          )}
        </CardContent>
      </Card>

      <PostPreviewCard
        caption={caption}
        imageUrls={imageUrls}
        platform={platforms}
        accountName={getDealershipName()}
      />

      {!locked && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-auto min-h-12 flex-col gap-1 py-4 sm:flex-row sm:py-3"
            onClick={onSaveDraft}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>Save draft</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-auto min-h-12 flex-col gap-1 border-emerald-500/40 py-4 text-emerald-200 sm:flex-row sm:py-3"
            onClick={onMarkReady}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <span>Mark ready</span>
          </Button>

          <Button
            type="button"
            size="lg"
            className="h-auto min-h-12 flex-col gap-1 bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-black hover:from-amber-400 hover:to-orange-400 sm:flex-row sm:py-3"
            onClick={onApprovePublish}
            disabled={saving || status !== "ready"}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Rocket className="h-5 w-5" />
            )}
            <span>Approve & publish</span>
          </Button>
        </div>
      )}

      {status !== "ready" && !locked && (
        <p className="text-center text-xs text-muted-foreground">
          Mark the post <strong className="text-emerald-300">Ready</strong> before
          {" publishing."}
        </p>
      )}

      {status === "posted" && (
        <p className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-center text-sm text-sky-200">
          This post was published.
        </p>
      )}

      {status === "failed" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
          Last publish attempt failed. Edit the post and try publishing again.
        </p>
      )}
    </div>
  );
}
