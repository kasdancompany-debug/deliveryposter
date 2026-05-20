"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  applyAutoEnhance,
  applyBlurFromNormalizedRect,
  loadImage,
  type NormalizedRect,
} from "@/lib/image-processing";
import { getEditedUrl, getOriginalUrl } from "@/lib/delivery-post/photo-urls";
import { isPhotoPlateProtected } from "@/lib/plate-safety";
import type { WizardPhoto } from "@/lib/delivery-post/types";
import { PhotoCropDialog } from "./photo-crop-dialog";

interface PhotoPolishCardProps {
  photo: WizardPhoto;
  index: number;
  disabled?: boolean;
  onChange: (photo: WizardPhoto) => void;
}

export function PhotoPolishCard({
  photo,
  index,
  disabled,
  onChange,
}: PhotoPolishCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processing, setProcessing] = useState(false);
  const [blurMode, setBlurMode] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selection, setSelection] = useState<NormalizedRect | null>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const displayUrl = getEditedUrl(photo);
  const protected_ = isPhotoPlateProtected(photo);

  useEffect(() => {
    loadImage(displayUrl).then((img) => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    });
  }, [displayUrl]);

  function pointerToNorm(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!blurMode || disabled || processing) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const p = pointerToNorm(e.clientX, e.clientY);
      if (!p) return;
      setDragStart(p);
      setSelection({ x: p.x, y: p.y, w: 0, h: 0 });
    },
    [blurMode, disabled, processing]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!blurMode || !dragStart) return;
      const p = pointerToNorm(e.clientX, e.clientY);
      if (!p) return;
      setSelection({
        x: Math.min(dragStart.x, p.x),
        y: Math.min(dragStart.y, p.y),
        w: Math.abs(p.x - dragStart.x),
        h: Math.abs(p.y - dragStart.y),
      });
    },
    [blurMode, dragStart]
  );

  const handlePointerUp = useCallback(() => {
    setDragStart(null);
  }, []);

  function exitBlurMode() {
    setBlurMode(false);
    setSelection(null);
    setDragStart(null);
  }

  async function handleAutoEnhance() {
    setProcessing(true);
    try {
      const editedUrl = await applyAutoEnhance(displayUrl);
      onChange({
        ...photo,
        originalUrl: getOriginalUrl(photo),
        editedUrl,
      });
      toast.success(`Photo ${index + 1} enhanced`);
    } catch {
      toast.error("Could not enhance photo");
    } finally {
      setProcessing(false);
    }
  }

  async function handleApplyBlur() {
    if (!selection || selection.w < 0.02 || selection.h < 0.02) {
      toast.error("Draw a rectangle around the license plate");
      return;
    }
    const el = containerRef.current;
    if (!el || !imgSize.w) return;

    setProcessing(true);
    try {
      const editedUrl = await applyBlurFromNormalizedRect(
        displayUrl,
        selection,
        imgSize.w,
        imgSize.h,
        el.clientWidth,
        el.clientHeight,
        true
      );
      onChange({
        ...photo,
        originalUrl: getOriginalUrl(photo),
        editedUrl,
        plateProtected: true,
      });
      exitBlurMode();
      toast.success("Plate protected");
    } catch {
      toast.error("Could not apply plate blur");
    } finally {
      setProcessing(false);
    }
  }

  function handleReset() {
    onChange({
      ...photo,
      originalUrl: getOriginalUrl(photo),
      editedUrl: getOriginalUrl(photo),
      plateProtected: false,
    });
    exitBlurMode();
    toast.message(`Photo ${index + 1} reset to original`);
  }

  const selectionReady =
    selection && selection.w >= 0.02 && selection.h >= 0.02;
  const busy = processing || disabled;

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card/40">
        <div
          ref={containerRef}
          className={cn(
            "relative aspect-[4/3] bg-black/40",
            blurMode && "cursor-crosshair touch-none"
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt={`Photo ${index + 1}`}
            className={cn(
              "h-full w-full object-cover select-none",
              blurMode && "pointer-events-none"
            )}
            draggable={false}
          />

          {blurMode && !selectionReady && (
            <div
              className="pointer-events-none absolute inset-0 bg-black/45"
              aria-hidden
            />
          )}

          {blurMode && selectionReady && (
            <div
              className="pointer-events-none absolute border-2 border-amber-400 bg-amber-400/10"
              style={{
                left: `${selection.x * 100}%`,
                top: `${selection.y * 100}%`,
                width: `${selection.w * 100}%`,
                height: `${selection.h * 100}%`,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              }}
            />
          )}

          {blurMode && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
              <p className="rounded-lg bg-black/75 px-3 py-1.5 text-center text-xs font-medium text-amber-100">
                Draw around the license plate
              </p>
            </div>
          )}

          {blurMode && selectionReady && (
            <div className="pointer-events-auto absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 px-3">
              <Button
                type="button"
                size="sm"
                className="bg-amber-500 text-black hover:bg-amber-400"
                disabled={processing}
                onClick={handleApplyBlur}
              >
                Apply Blur
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/30 bg-black/70 text-white hover:bg-black/90"
                disabled={processing}
                onClick={exitBlurMode}
              >
                Cancel
              </Button>
            </div>
          )}

          {protected_ && !blurMode && (
            <span className="absolute right-2 top-2 rounded-md bg-emerald-600/95 px-2 py-1 text-[10px] font-semibold text-white shadow">
              🛡 Plate Protected
            </span>
          )}

          {(processing || (blurMode && !selectionReady)) && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                processing && "bg-black/40"
              )}
            >
              {processing && (
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              )}
            </div>
          )}
        </div>

        <CardContent className="space-y-3 py-3">
          <span className="text-sm font-medium">Photo {index + 1}</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              disabled={busy || blurMode}
              onClick={handleAutoEnhance}
            >
              ✨ Auto Enhance
            </Button>
            <Button
              type="button"
              size="sm"
              variant={blurMode ? "default" : "outline"}
              className={cn(
                "h-8 rounded-full px-3 text-xs",
                blurMode && "bg-amber-500 text-black hover:bg-amber-400"
              )}
              disabled={busy}
              onClick={() => {
                if (blurMode) exitBlurMode();
                else {
                  setBlurMode(true);
                  setSelection(null);
                }
              }}
            >
              🛡 Blur Plate
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              disabled={busy || blurMode}
              onClick={() => setCropOpen(true)}
            >
              ✂ Crop
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              disabled={busy || blurMode}
              onClick={handleReset}
            >
              ↺ Reset
            </Button>
          </div>
          {blurMode && !selectionReady && (
            <p className="text-xs text-muted-foreground">
              Drag a box over the plate. You can add more regions after applying.
            </p>
          )}
        </CardContent>
      </Card>

      <PhotoCropDialog
        open={cropOpen}
        previewUrl={displayUrl}
        onClose={() => setCropOpen(false)}
        onApply={(editedUrl) => {
          onChange({
            ...photo,
            originalUrl: getOriginalUrl(photo),
            editedUrl,
          });
          toast.success(`Photo ${index + 1} cropped`);
        }}
      />
    </>
  );
}
