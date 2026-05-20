"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoCarouselProps {
  urls: string[];
  coverUrl?: string | null;
  alt?: string;
  size?: "default" | "large";
}

export function PhotoCarousel({ urls, coverUrl, alt = "Delivery photo", size = "default" }: PhotoCarouselProps) {
  const isLarge = size === "large";
  const [index, setIndex] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        No photos
      </div>
    );
  }

  const current = urls[index];
  const isCover = coverUrl === current;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-black/40 ring-1 ring-amber-500/10">
        <div className={cn("relative w-full", isLarge ? "aspect-[16/10] min-h-[280px] sm:min-h-[360px]" : "aspect-[4/3] sm:aspect-[16/10]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt={`${alt} ${index + 1}`}
            className="h-full w-full object-cover"
          />
          {isCover && (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
              <Star className="h-3 w-3 fill-current" />
              Cover
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
            <p className="text-sm font-medium text-white">
              {index + 1} / {urls.length}
            </p>
          </div>
        </div>

        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition hover:bg-black/80"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % urls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition hover:bg-black/80"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-20 sm:w-20",
                i === index ? "ring-amber-500" : "ring-transparent opacity-60 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
