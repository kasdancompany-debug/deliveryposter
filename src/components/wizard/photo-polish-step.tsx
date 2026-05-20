"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeliveryScorePanel } from "@/components/delivery-score/delivery-score-panel";
import { PhotoPolishCard } from "@/components/wizard/photo-polish-card";
import { cn } from "@/lib/utils";
import {
  applyAutoEnhance,
  applyFilter,
  FILTER_PRESETS,
  type FilterPresetId,
} from "@/lib/image-processing";
import { getEditedUrl, getOriginalUrl } from "@/lib/demo/photo-urls";
import type { WizardPhoto } from "@/lib/demo/types";

interface PhotoPolishStepProps {
  photos: WizardPhoto[];
  coverPhotoId?: string;
  onChange: (photos: WizardPhoto[]) => void;
  disabled?: boolean;
}

export function PhotoPolishStep({
  photos,
  coverPhotoId,
  onChange,
  disabled,
}: PhotoPolishStepProps) {
  const [applyingAll, setApplyingAll] = useState(false);
  const [autoEnhancingAll, setAutoEnhancingAll] = useState(false);
  const [bulkFilter, setBulkFilter] = useState<FilterPresetId>("naturalPlus");

  function updatePhoto(updated: WizardPhoto) {
    onChange(photos.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function runOnAllPhotos(
    processor: (url: string) => Promise<string>,
    successMessage: string,
    errorMessage: string
  ) {
    if (!photos.length) return;
    try {
      const next = await Promise.all(
        photos.map(async (photo) => {
          const base = getEditedUrl(photo);
          const editedUrl = await processor(base);
          return {
            ...photo,
            originalUrl: getOriginalUrl(photo),
            editedUrl,
          };
        })
      );
      onChange(next);
      toast.success(successMessage);
    } catch {
      toast.error(errorMessage);
    }
  }

  async function handleAutoEnhanceAll() {
    setAutoEnhancingAll(true);
    await runOnAllPhotos(
      applyAutoEnhance,
      "Auto enhance applied to all photos",
      "Could not auto enhance photos"
    );
    setAutoEnhancingAll(false);
  }

  async function handleApplyPresetToAll() {
    setApplyingAll(true);
    const label = FILTER_PRESETS.find((f) => f.id === bulkFilter)?.label;
    await runOnAllPhotos(
      (url) => applyFilter(url, bulkFilter),
      `${label} applied to all photos`,
      "Could not apply preset to all photos"
    );
    setApplyingAll(false);
  }

  const busy = applyingAll || autoEnhancingAll;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Photo polish</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the chips under each photo to enhance, blur plates, or crop. Draw
          around each plate — you can protect multiple regions per image.
        </p>
      </div>

      <DeliveryScorePanel photos={photos} coverPhotoId={coverPhotoId} />

      <Card className="border-border/60 bg-card/40">
        <CardContent className="space-y-4 pt-6">
          <Button
            type="button"
            size="lg"
            className="h-12 w-full bg-amber-500 text-base font-semibold text-black hover:bg-amber-400"
            disabled={disabled || busy || !photos.length}
            onClick={handleAutoEnhanceAll}
          >
            {autoEnhancingAll ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <span className="mr-2">✨</span>
            )}
            Auto Enhance All
          </Button>

          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">
            Preset — apply to all photos
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTER_PRESETS.map((f) => (
              <Button
                key={f.id}
                type="button"
                size="sm"
                variant={bulkFilter === f.id ? "default" : "outline"}
                className={cn(
                  bulkFilter === f.id &&
                    "bg-amber-500 text-black hover:bg-amber-400"
                )}
                disabled={disabled || busy}
                onClick={() => setBulkFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full border-amber-500/30 sm:w-auto"
            disabled={disabled || busy || !photos.length}
            onClick={handleApplyPresetToAll}
          >
            {applyingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Apply preset to all photos
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <PhotoPolishCard
            key={photo.id}
            photo={photo}
            index={index}
            disabled={disabled}
            onChange={updatePhoto}
          />
        ))}
      </div>
    </div>
  );
}
