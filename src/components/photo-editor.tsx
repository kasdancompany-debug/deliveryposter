"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  Save,
  Scan,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyAutoEnhance,
  applyBlurFromNormalizedRect,
  applyFilter,
  exportCanvasAsBlob,
  exportCanvasAsDataUrl,
  FILTER_PRESETS,
  imageToCanvas,
  loadImage,
  type FilterPresetId,
  type NormalizedRect,
} from "@/lib/image-processing";

export interface PhotoEditorSaveResult {
  editedUrl: string;
  blob: Blob;
}

export interface PhotoEditorProps {
  originalUrl: string;
  /** Current edited version; falls back to originalUrl */
  editedUrl?: string;
  onSave: (result: PhotoEditorSaveResult) => void;
  onCancel?: () => void;
  className?: string;
}

export function PhotoEditor({
  originalUrl,
  editedUrl: initialEditedUrl,
  onSave,
  onCancel,
  className,
}: PhotoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [original] = useState(originalUrl);
  const [currentUrl, setCurrentUrl] = useState(
    initialEditedUrl ?? originalUrl
  );
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [showBefore, setShowBefore] = useState(false);
  const [blurMode, setBlurMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterPresetId | "auto" | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selection, setSelection] = useState<NormalizedRect | null>(null);

  const displayUrl = showBefore ? original : currentUrl;

  useEffect(() => {
    setCurrentUrl(initialEditedUrl ?? originalUrl);
    loadImage(initialEditedUrl ?? originalUrl).then((img) => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    });
  }, [originalUrl, initialEditedUrl]);

  function pushUndo() {
    setUndoStack((s) => [...s.slice(-12), currentUrl]);
  }

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
      if (!blurMode) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const p = pointerToNorm(e.clientX, e.clientY);
      if (!p) return;
      setDragStart(p);
      setSelection({ x: p.x, y: p.y, w: 0, h: 0 });
    },
    [blurMode]
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

  async function handleApplyBlur() {
    if (!selection || selection.w < 0.02 || selection.h < 0.02) {
      toast.error("Drag a rectangle over the license plate");
      return;
    }
    const el = containerRef.current;
    if (!el || !imgSize.w) return;

    setProcessing(true);
    try {
      pushUndo();
      const next = await applyBlurFromNormalizedRect(
        currentUrl,
        selection,
        imgSize.w,
        imgSize.h,
        el.clientWidth,
        el.clientHeight
      );
      setCurrentUrl(next);
      setSelection(null);
      setBlurMode(false);
      toast.success("Plate area blurred");
    } catch {
      toast.error("Could not apply blur");
    } finally {
      setProcessing(false);
    }
  }

  async function handleApplyFilter(presetId: FilterPresetId) {
    setActiveFilter(presetId);
    setProcessing(true);
    try {
      pushUndo();
      const next = await applyFilter(currentUrl, presetId);
      setCurrentUrl(next);
    } catch {
      toast.error("Could not apply enhancement");
    } finally {
      setProcessing(false);
    }
  }

  async function handleAutoEnhance() {
    setActiveFilter("auto");
    setProcessing(true);
    try {
      pushUndo();
      const next = await applyAutoEnhance(currentUrl);
      setCurrentUrl(next);
      toast.success("Auto enhance applied");
    } catch {
      toast.error("Could not auto enhance");
    } finally {
      setProcessing(false);
    }
  }

  function handleUndo() {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setCurrentUrl(prev);
  }

  function handleReset() {
    pushUndo();
    setCurrentUrl(original);
    setActiveFilter(null);
    setSelection(null);
    toast.message("Reset to original");
  }

  async function handleSave() {
    setProcessing(true);
    try {
      const { canvas } = await imageToCanvas(currentUrl);
      const editedUrl = exportCanvasAsDataUrl(canvas);
      const blob = await exportCanvasAsBlob(canvas);
      onSave({ editedUrl, blob });
    } catch {
      toast.error("Could not save image");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Canvas preview area — image loaded for display; edits via offscreen canvas */}
      <div
        ref={containerRef}
        className={cn(
          "relative mx-auto w-full max-w-lg overflow-hidden rounded-xl bg-black ring-1 ring-amber-500/25",
          blurMode && "cursor-crosshair touch-none"
        )}
        style={{
          aspectRatio:
            imgSize.w && imgSize.h ? `${imgSize.w}/${imgSize.h}` : "4/5",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayUrl}
          alt="Photo editor preview"
          className="h-full w-full object-contain select-none"
          draggable={false}
        />
        {blurMode && selection && selection.w > 0 && selection.h > 0 && (
          <div
            className="pointer-events-none absolute border-2 border-amber-400 bg-amber-400/15"
            style={{
              left: `${selection.x * 100}%`,
              top: `${selection.y * 100}%`,
              width: `${selection.w * 100}%`,
              height: `${selection.h * 100}%`,
            }}
          />
        )}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={showBefore ? "default" : "outline"}
          className={showBefore ? "bg-amber-500 text-black" : ""}
          onClick={() => setShowBefore((b) => !b)}
        >
          {showBefore ? (
            <EyeOff className="mr-1.5 h-4 w-4" />
          ) : (
            <Eye className="mr-1.5 h-4 w-4" />
          )}
          Before / after
        </Button>
        <Button
          type="button"
          size="sm"
          variant={blurMode ? "default" : "outline"}
          className={blurMode ? "bg-amber-500 text-black" : "border-amber-500/40"}
          onClick={() => {
            setBlurMode((b) => !b);
            setSelection(null);
          }}
        >
          <Scan className="mr-1.5 h-4 w-4" />
          Blur plate
        </Button>
        {blurMode && (
          <Button
            type="button"
            size="sm"
            className="bg-amber-600 text-black hover:bg-amber-500"
            disabled={processing}
            onClick={handleApplyBlur}
          >
            Apply blur
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!undoStack.length || processing}
          onClick={handleUndo}
        >
          <Undo2 className="mr-1.5 h-4 w-4" />
          Undo
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={processing}
          onClick={handleReset}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full bg-amber-500 text-base font-semibold text-black hover:bg-amber-400"
          disabled={processing}
          onClick={handleAutoEnhance}
        >
          ✨ Auto Enhance
        </Button>
        <p className="text-xs text-muted-foreground">
          Balances brightness, contrast, and clarity from your photo — subtle
          dealership polish, not heavy filters.
        </p>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {FILTER_PRESETS.map((f) => (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={activeFilter === f.id ? "default" : "outline"}
              className={cn(
                activeFilter === f.id &&
                  "bg-amber-500 text-black hover:bg-amber-400"
              )}
              disabled={processing}
              onClick={() => handleApplyFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          className="ml-auto bg-amber-500 text-black hover:bg-amber-400"
          disabled={processing}
          onClick={handleSave}
        >
          <Save className="mr-2 h-4 w-4" />
          Save polished photo
        </Button>
      </div>
    </div>
  );
}
