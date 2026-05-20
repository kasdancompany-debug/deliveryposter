"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CaptionEditorProps {
  options: string[];
  selectedIndex: number | null;
  finalCaption: string;
  onSelectOption: (index: number) => void;
  onCaptionChange: (caption: string) => void;
  onGenerate: () => void;
  generating?: boolean;
  disabled?: boolean;
}

export function CaptionEditor({
  options,
  selectedIndex,
  finalCaption,
  onSelectOption,
  onCaptionChange,
  onGenerate,
  generating,
  disabled,
}: CaptionEditorProps) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg">Caption</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-500/30 text-amber-200"
          onClick={onGenerate}
          disabled={disabled || generating}
        >
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate 3 options
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              AI suggestions
            </p>
            <div className="grid gap-2">
              {options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectOption(index)}
                  className={cn(
                    "rounded-xl border p-3 text-left text-sm transition",
                    selectedIndex === index
                      ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                      : "border-border/60 bg-muted/20 hover:border-amber-500/30"
                  )}
                >
                  <span className="mb-1 block text-xs font-medium text-amber-400/80">
                    Option {index + 1}
                  </span>
                  <span className="line-clamp-3 text-muted-foreground">
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Final caption (editable)
          </p>
          <Textarea
            value={finalCaption}
            onChange={(e) => onCaptionChange(e.target.value)}
            rows={8}
            disabled={disabled}
            placeholder="Select an option or write your own caption…"
            className="resize-none font-normal leading-relaxed"
          />
          <p className="text-right text-xs text-muted-foreground">
            {finalCaption.length} characters
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
