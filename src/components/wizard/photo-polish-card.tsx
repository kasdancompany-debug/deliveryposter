"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  applyAutoEnhance,
  applyBlurFromNormalizedRect,
  loadImageForProcessing,
  type NormalizedRect,
} from "@/lib/image-processing";
import {
  clampZoom,
  screenToNormalized,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  zoomTowardPoint,
  type PanOffset,
} from "@/lib/photo-editor-viewport";
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
  const [imgLoadError, setImgLoadError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panPointerStart, setPanPointerStart] = useState<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [altHeld, setAltHeld] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const displayUrl = getEditedUrl(photo);
  const protected_ = isPhotoPlateProtected(photo);
  const isZoomed = zoom > 1.001;

  const viewportTransform = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: "center center",
  };

  useEffect(() => {
    setImgLoadError(false);
    loadImageForProcessing(displayUrl)
      .then((img) => {
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      })
      .catch(() => {
        setImgSize({ w: 0, h: 0 });
        setImgLoadError(true);
      });
  }, [displayUrl]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Alt") setAltHeld(true);
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(true);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Alt") setAltHeld(false);
      if (e.code === "Space") setSpaceHeld(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    function onWheel(e: WheelEvent) {
      if (!e.altKey || !el) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((oldZoom) => {
        const next = clampZoom(oldZoom * (1 + delta));
        setPan((p) =>
          zoomTowardPoint(mx, my, rect.width, rect.height, p, oldZoom, next)
        );
        return next;
      });
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [disabled]);

  function resetViewport() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function pointerToNorm(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return null;
    return screenToNormalized(
      clientX,
      clientY,
      el.getBoundingClientRect(),
      pan,
      zoom
    );
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || processing) return;
      const el = containerRef.current;
      if (!el) return;

      const panInsteadOfBlur = (!blurMode && isZoomed) || (blurMode && spaceHeld);

      if (panInsteadOfBlur) {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setIsPanning(true);
        setPanPointerStart({
          x: e.clientX,
          y: e.clientY,
          panX: pan.x,
          panY: pan.y,
        });
        return;
      }

      if (!blurMode) return;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const p = pointerToNorm(e.clientX, e.clientY);
      if (!p) return;
      setDragStart(p);
      setSelection({ x: p.x, y: p.y, w: 0, h: 0 });
    },
    [blurMode, disabled, processing, isZoomed, spaceHeld, pan.x, pan.y, zoom]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning && panPointerStart) {
        setPan({
          x: panPointerStart.panX + (e.clientX - panPointerStart.x),
          y: panPointerStart.panY + (e.clientY - panPointerStart.y),
        });
        return;
      }

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
    [blurMode, dragStart, isPanning, panPointerStart, pan, zoom]
  );

  const handlePointerUp = useCallback(() => {
    setDragStart(null);
    setIsPanning(false);
    setPanPointerStart(null);
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
    if (!selection || selection.w < 0.015 || selection.h < 0.015) {
      toast.error("Draw a rectangle around the license plate");
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    if (!imgSize.w) {
      try {
        const img = await loadImageForProcessing(displayUrl);
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      } catch {
        toast.error(
          "Could not load this photo for editing. Try Reset, then blur again."
        );
        return;
      }
    }

    setProcessing(true);
    try {
      let w = imgSize.w;
      let h = imgSize.h;
      if (!w) {
        const img = await loadImageForProcessing(displayUrl);
        w = img.naturalWidth;
        h = img.naturalHeight;
        setImgSize({ w, h });
      }

      const editedUrl = await applyBlurFromNormalizedRect(
        displayUrl,
        selection,
        w,
        h,
        el.clientWidth,
        el.clientHeight,
        true,
        "cover"
      );
      onChange({
        ...photo,
        originalUrl: getOriginalUrl(photo),
        editedUrl,
        plateProtected: true,
      });
      exitBlurMode();
      toast.success("Plate protected");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not apply plate blur"
      );
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
    resetViewport();
    toast.message(`Photo ${index + 1} reset to original`);
  }

  function adjustZoom(delta: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    setZoom((oldZoom) => {
      const next = clampZoom(oldZoom + delta);
      setPan((p) =>
        zoomTowardPoint(mx, my, rect.width, rect.height, p, oldZoom, next)
      );
      return next;
    });
  }

  const selectionReady =
    selection && selection.w >= 0.015 && selection.h >= 0.015;
  const busy = processing || disabled;

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card/40">
        <div
          ref={containerRef}
          className={cn(
            "relative aspect-[4/3] overflow-hidden bg-black/40",
            blurMode && !spaceHeld && "cursor-crosshair touch-none",
            blurMode && spaceHeld && "cursor-grab",
            (!blurMode && isZoomed) && "cursor-grab",
            isPanning && "cursor-grabbing"
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="h-full w-full" style={viewportTransform}>
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

            {blurMode && selectionReady && selection && (
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
          </div>

          {blurMode && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
              <p className="rounded-lg bg-black/75 px-3 py-1.5 text-center text-xs font-medium text-amber-100">
                Draw around the license plate
                {isZoomed ? " · Alt + scroll to adjust zoom" : ""}
              </p>
            </div>
          )}

          {blurMode && selectionReady && (
            <div className="pointer-events-auto absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2 px-3">
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
            <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-md bg-emerald-600/95 px-2 py-1 text-[10px] font-semibold text-white shadow">
              🛡 Plate Protected
            </span>
          )}

          <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1">
            {(isZoomed || altHeld) && (
              <span className="rounded-md bg-black/75 px-2 py-1 text-[10px] font-medium text-amber-100">
                {Math.round(zoom * 100)}%
              </span>
            )}
            {altHeld && (
              <span className="rounded-md bg-black/75 px-2 py-0.5 text-[10px] text-white/80">
                Alt + scroll
              </span>
            )}
          </div>

          {(processing || (blurMode && !selectionReady)) && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-[5] flex items-center justify-center",
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Photo {index + 1}</span>
            {isZoomed && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground"
                disabled={busy}
                onClick={resetViewport}
              >
                Reset zoom
              </Button>
            )}
          </div>
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
              className="h-8 rounded-full px-2.5 text-xs"
              disabled={busy || blurMode || zoom >= ZOOM_MAX}
              title="Zoom in"
              onClick={() => adjustZoom(ZOOM_STEP)}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-2.5 text-xs"
              disabled={busy || blurMode || zoom <= ZOOM_MIN}
              title="Zoom out"
              onClick={() => adjustZoom(-ZOOM_STEP)}
            >
              <ZoomOut className="h-3.5 w-3.5" />
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
          <p className="text-xs text-muted-foreground">
            <strong>Alt + scroll</strong> to zoom. When zoomed, drag to pan
            {blurMode ? " (hold Space + drag while blurring)" : ""}.
          </p>
          {blurMode && !selectionReady && (
            <p className="text-xs text-muted-foreground">
              Drag a box over the plate, then tap <strong>Apply Blur</strong>.
            </p>
          )}
          {imgLoadError && (
            <p className="text-xs text-amber-300">
              Photo could not be loaded for editing — use Reset or re-upload.
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
