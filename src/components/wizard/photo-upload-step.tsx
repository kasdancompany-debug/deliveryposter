"use client";

import { useCallback, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/validators/delivery-wizard";
import type { WizardPhoto } from "@/lib/delivery-post/types";
import { fileToStoredDataUrl } from "@/lib/delivery-post/image-utils";

interface PhotoUploadStepProps {
  photos: WizardPhoto[];
  coverPhotoId: string;
  onChange: (photos: WizardPhoto[], coverPhotoId: string) => void;
  disabled?: boolean;
}

export function PhotoUploadStep({
  photos,
  coverPhotoId,
  onChange,
  disabled,
}: PhotoUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || disabled) return;
      const remaining = MAX_PHOTOS - photos.length;
      const toAdd = Array.from(files).slice(0, remaining);
      if (!toAdd.length) return;

      setProcessing(true);
      const newPhotos: WizardPhoto[] = [];

      for (let i = 0; i < toAdd.length; i++) {
        const file = toAdd[i];
        try {
          const dataUrl = await fileToStoredDataUrl(file);
          newPhotos.push({
            id: crypto.randomUUID(),
            originalUrl: dataUrl,
            editedUrl: dataUrl,
            sortOrder: photos.length + i,
            plateProtected: false,
          });
        } catch {
          /* skip failed */
        }
      }

      const merged = [...photos, ...newPhotos].map((p, i) => ({
        ...p,
        sortOrder: i,
      }));
      const cover =
        coverPhotoId && merged.some((p) => p.id === coverPhotoId)
          ? coverPhotoId
          : merged[0]?.id ?? "";
      onChange(merged, cover);
      setProcessing(false);
    },
    [photos, coverPhotoId, onChange, disabled]
  );

  function removePhoto(id: string) {
    const next = photos.filter((p) => p.id !== id).map((p, i) => ({
      ...p,
      sortOrder: i,
    }));
    let cover = coverPhotoId;
    if (cover === id) cover = next[0]?.id ?? "";
    onChange(next, cover);
  }

  function movePhoto(id: string, dir: -1 | 1) {
    const idx = photos.findIndex((p) => p.id === id);
    const target = idx + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(
      next.map((p, i) => ({ ...p, sortOrder: i })),
      coverPhotoId
    );
  }

  function reorderDrag(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = photos.findIndex((p) => p.id === dragId);
    const to = photos.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(
      next.map((p, i) => ({ ...p, sortOrder: i })),
      coverPhotoId
    );
    setDragId(null);
  }

  const sorted = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Upload photos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add {MIN_PHOTOS}–{MAX_PHOTOS} delivery photos. Drag to reorder, star
          your cover shot.
        </p>
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 transition",
          dragging
            ? "border-amber-500 bg-amber-500/10"
            : "border-border/80 bg-card/40 hover:border-amber-500/40",
          photos.length >= MAX_PHOTOS && "pointer-events-none opacity-60"
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || processing || photos.length >= MAX_PHOTOS}
          className="flex w-full flex-col items-center gap-3 text-center"
        >
          {processing ? (
            <Loader2 className="h-12 w-12 animate-spin text-amber-400" />
          ) : (
            <Upload className="h-12 w-12 text-amber-400/90" />
          )}
          <span className="text-base font-medium">
            Drag & drop photos here
          </span>
          <span className="text-sm text-muted-foreground">
            or tap to browse · {photos.length}/{MAX_PHOTOS}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((photo, index) => {
            const isCover = photo.id === coverPhotoId;
            return (
              <div
                key={photo.id}
                draggable={!disabled}
                onDragStart={() => setDragId(photo.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorderDrag(photo.id)}
                className={cn(
                  "group relative overflow-hidden rounded-xl ring-2 transition",
                  isCover ? "ring-amber-500" : "ring-border/50"
                )}
              >
                <div className="aspect-square w-full bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.editedUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                {isCover && (
                  <span className="absolute left-2 top-2 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                    Cover
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <GripVertical className="h-4 w-4 text-white/50" />
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      title="Move earlier"
                      disabled={index === 0 || disabled}
                      onClick={() => movePhoto(photo.id, -1)}
                      className="rounded bg-black/50 p-1 text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Move later"
                      disabled={index === sorted.length - 1 || disabled}
                      onClick={() => movePhoto(photo.id, 1)}
                      className="rounded bg-black/50 p-1 text-white disabled:opacity-30"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Set as cover"
                      disabled={disabled}
                      onClick={() => onChange(photos, photo.id)}
                      className={cn(
                        "rounded p-1",
                        isCover ? "bg-amber-500 text-black" : "bg-black/50 text-white"
                      )}
                    >
                      <Star
                        className={cn("h-3.5 w-3.5", isCover && "fill-current")}
                      />
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      disabled={disabled}
                      onClick={() => removePhoto(photo.id)}
                      className="rounded bg-black/50 p-1 text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {sorted.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || processing}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground transition hover:border-amber-500/40 hover:text-amber-400"
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-xs font-medium">Add more</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
