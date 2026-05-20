"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratedCaption } from "@/lib/captions";
import { cn } from "@/lib/utils";

interface CaptionStudioStepProps {
  captions: GeneratedCaption[];
  selectedIndex: number | null;
  finalCaption: string;
  generating: boolean;
  onGenerateAll: () => void;
  onSelect: (index: number) => void;
  onRegenerate: (index: number) => Promise<void>;
  onCaptionChange: (caption: string) => void;
}

export function CaptionStudioStep({
  captions,
  selectedIndex,
  finalCaption,
  generating,
  onGenerateAll,
  onSelect,
  onRegenerate,
  onCaptionChange,
}: CaptionStudioStepProps) {
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(
    null
  );

  async function handleRegenerate(index: number) {
    setRegeneratingIndex(index);
    try {
      await onRegenerate(index);
      toast.success("Caption regenerated");
    } catch {
      toast.error("Could not regenerate caption");
    } finally {
      setRegeneratingIndex(null);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }

  const hasSelection = selectedIndex !== null;
  const showEditor = hasSelection || finalCaption.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Caption studio</h2>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            AI-style delivery captions for Sault Nissan. Generate four tones, pick
            one, then fine-tune before preview.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="shrink-0 bg-amber-500 text-black hover:bg-amber-400"
          onClick={onGenerateAll}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate captions
            </>
          )}
        </Button>
      </div>

      {/* Loading skeleton */}
      {generating && captions.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-48 animate-pulse rounded-xl border border-border/40 bg-muted/20"
            />
          ))}
        </div>
      )}

      {/* Caption cards */}
      {captions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {captions.map((caption, index) => {
            const isSelected = selectedIndex === index;
            const isRegenerating = regeneratingIndex === index;

            return (
              <Card
                key={`${caption.style}-${index}`}
                className={cn(
                  "flex flex-col border-border/60 bg-card/40 transition",
                  isSelected &&
                    "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30"
                )}
              >
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <span className="text-amber-300/90">{caption.label}</span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                        <Check className="h-3 w-3" />
                        Selected
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                  <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                    {caption.text}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className={cn(
                        "flex-1 sm:flex-none",
                        isSelected
                          ? "bg-amber-500 text-black hover:bg-amber-400"
                          : "border-amber-500/30 bg-transparent text-amber-100 hover:bg-amber-500/10"
                      )}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onSelect(index)}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isRegenerating || generating}
                      onClick={() => handleRegenerate(index)}
                    >
                      {isRegenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="sr-only sm:not-sr-only sm:ml-1.5">
                        Regenerate
                      </span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(caption.text)}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-1.5">
                        Copy
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!generating && captions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-14 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-amber-500/40" />
          <p className="mt-4 text-sm font-medium">No captions yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap Generate captions to create four ready-to-post options.
          </p>
        </div>
      )}

      {/* Final caption editor */}
      {showEditor && (
        <Card className="border-amber-500/20 bg-card/50 ring-1 ring-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Final caption</CardTitle>
            <p className="text-xs text-muted-foreground">
              Edit your selected caption before preview and publish.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={finalCaption}
              onChange={(e) => onCaptionChange(e.target.value)}
              rows={10}
              className="resize-none border-border/60 bg-background/50 text-base leading-relaxed"
              placeholder="Select a caption above or write your own…"
            />
            <p className="mt-2 text-right text-xs text-muted-foreground">
              {finalCaption.length} characters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
