"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Contrast,
  Lightbulb,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  analyzeDeliveryPhotos,
  type DeliveryScoreResult,
  type PlateSafetyStatus,
} from "@/lib/delivery-score";
import type { WizardPhoto } from "@/lib/delivery-post/types";
import { getEditedUrl, getOriginalUrl } from "@/lib/delivery-post/photo-urls";
import { ScoreRing } from "./score-ring";

interface DeliveryScorePanelProps {
  photos: WizardPhoto[];
  coverPhotoId?: string;
  className?: string;
}

const PLATE_LABELS: Record<
  PlateSafetyStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  safe: {
    label: "Plates protected",
    className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    icon: CheckCircle2,
  },
  attention: {
    label: "Some plates visible",
    className: "text-amber-300 border-amber-500/30 bg-amber-500/10",
    icon: AlertTriangle,
  },
  needs_blur: {
    label: "Blur plates required",
    className: "text-orange-300 border-orange-500/30 bg-orange-500/10",
    icon: Shield,
  },
};

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const color =
    value >= 75 ? "text-emerald-400" : value >= 55 ? "text-amber-400" : "text-orange-400";

  return (
    <Card className="border-border/50 bg-card/30">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-lg font-semibold tabular-nums", color)}>
            {value}
            <span className="text-xs font-normal text-muted-foreground">/100</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DeliveryScorePanel({
  photos,
  coverPhotoId,
  className,
}: DeliveryScorePanelProps) {
  const [result, setResult] = useState<DeliveryScoreResult | null>(null);
  const [loading, setLoading] = useState(false);

  const photoKey = photos
    .map((p) => `${p.id}:${p.editedUrl}:${p.plateProtected}`)
    .join("|");

  async function runAnalysis() {
    if (!photos.length) {
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const score = await analyzeDeliveryPhotos({
        photos: photos.map((p) => ({
          id: p.id,
          originalUrl: getOriginalUrl(p),
          editedUrl: getEditedUrl(p),
          plateProtected: p.plateProtected,
        })),
        coverPhotoId,
      });
      setResult(score);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey, coverPhotoId]);

  if (!photos.length) return null;

  const plate = result ? PLATE_LABELS[result.plateSafety] : null;
  const PlateIcon = plate?.icon ?? Shield;

  return (
    <Card
      className={cn(
        "overflow-hidden border-amber-500/20 bg-gradient-to-br from-card/80 to-zinc-950/80",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold tracking-tight">Delivery score</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={runAnalysis}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {loading && !result ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : result ? (
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center gap-3">
              <ScoreRing score={result.socialImpactScore} size={168} />
              {plate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                    plate.className
                  )}
                >
                  <PlateIcon className="h-3.5 w-3.5" />
                  {plate.label}
                </span>
              )}
              <p className="text-center text-[10px] text-muted-foreground">
                Demo analysis · {result.provider} provider
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Lighting"
                  value={result.lightingScore}
                  icon={Lightbulb}
                />
                <MetricCard
                  label="Vehicle visibility"
                  value={result.vehicleVisibilityScore}
                  icon={Car}
                />
                <MetricCard
                  label="People & faces"
                  value={result.humanVisibilityScore}
                  icon={Users}
                />
                <MetricCard
                  label="Framing"
                  value={result.framingScore}
                  icon={Sparkles}
                />
                <MetricCard
                  label="Contrast"
                  value={result.contrastScore}
                  icon={Contrast}
                />
                <Card className={cn("border-border/50 bg-card/30", plate?.className)}>
                  <CardContent className="flex h-full items-center gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/20">
                      <PlateIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs opacity-80">Plate safety</p>
                      <p className="text-sm font-semibold">{plate?.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {result.suggestions.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-400/90">
                    Suggested improvements
                  </p>
                  <ul className="space-y-2">
                    {result.suggestions.map((tip, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
