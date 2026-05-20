"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/validators/delivery-post";

export interface LocalPhoto {
  id: string;
  file?: File;
  previewUrl: string;
  storagePath?: string;
  publicUrl?: string;
  dbId?: string;
  sortOrder: number;
}

interface PhotoUploaderProps {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  onUpload?: (file: File, sortOrder: number) => Promise<{
    storagePath: string;
    publicUrl: string;
  }>;
  disabled?: boolean;
  className?: string;
}

export function PhotoUploader({
  photos,
  onChange,
  onUpload,
  disabled,
  className,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || disabled) return;

      const remaining = MAX_PHOTOS - photos.length;
      const toAdd = Array.from(files).slice(0, remaining);

      if (toAdd.length === 0) return;

      setUploading(true);
      const newPhotos: LocalPhoto[] = [];

      for (let i = 0; i < toAdd.length; i++) {
        const file = toAdd[i];
        const previewUrl = URL.createObjectURL(file);
        const sortOrder = photos.length + newPhotos.length;

        let storagePath: string | undefined;
        let publicUrl: string | undefined;

        if (onUpload) {
          try {
            const result = await onUpload(file, sortOrder);
            storagePath = result.storagePath;
            publicUrl = result.publicUrl;
          } catch (e) {
            console.error(e);
            URL.revokeObjectURL(previewUrl);
            continue;
          }
        }

        newPhotos.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: publicUrl ?? previewUrl,
          storagePath,
          publicUrl,
          sortOrder,
        });
      }

      onChange([...photos, ...newPhotos]);
      setUploading(false);
    },
    [photos, onChange, onUpload, disabled]
  );

  function removePhoto(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (photo?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    const next = photos
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, sortOrder: i }));
    onChange(next);
    if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1));
  }

  const active = photos[activeIndex];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20 ring-1 ring-amber-500/10">
        {active ? (
          <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.publicUrl ?? active.previewUrl}
              alt={`Photo ${activeIndex + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-sm font-medium text-white">
                Photo {activeIndex + 1} of {photos.length}
              </p>
              <p className="text-xs text-white/70">
                {photos.length}/{MAX_PHOTOS} · Tap thumbnails to switch
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 p-8 text-muted-foreground transition hover:bg-muted/30 sm:aspect-[3/4]"
          >
            {uploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
            ) : (
              <ImagePlus className="h-12 w-12 text-amber-400/80" />
            )}
            <span className="text-center text-sm font-medium">
              Add delivery photos
            </span>
            <span className="text-center text-xs">
              {MIN_PHOTOS}–{MAX_PHOTOS} images · JPG, PNG, WebP
            </span>
          </button>
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={cn(
                "group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition",
                index === activeIndex
                  ? "ring-amber-400"
                  : "ring-transparent opacity-70 hover:opacity-100"
              )}
            >
              <button
                type="button"
                className="h-full w-full"
                onClick={() => setActiveIndex(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.publicUrl ?? photo.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1 top-1 rounded-md bg-black/60 p-1 opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 text-muted-foreground hover:border-amber-500/40 hover:text-amber-400"
            >
              <ImagePlus className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

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

      {photos.length > 0 && photos.length < MAX_PHOTOS && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-amber-500/20"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-4 w-4" />
              Add more photos
            </>
          )}
        </Button>
      )}
    </div>
  );
}
