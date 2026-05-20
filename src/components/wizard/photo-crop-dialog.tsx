"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  applyCenterCrop,
  type CropAspectPreset,
} from "@/lib/image-processing";

const CROP_OPTIONS: { id: CropAspectPreset; label: string }[] = [
  { id: "4:3", label: "4:3 Delivery" },
  { id: "1:1", label: "1:1 Square" },
  { id: "16:9", label: "16:9 Wide" },
];

interface PhotoCropDialogProps {
  open: boolean;
  previewUrl: string;
  onClose: () => void;
  onApply: (editedUrl: string) => void;
}

export function PhotoCropDialog({
  open,
  previewUrl,
  onClose,
  onApply,
}: PhotoCropDialogProps) {
  const [aspect, setAspect] = useState<CropAspectPreset>("4:3");
  const [processing, setProcessing] = useState(false);

  async function handleApply() {
    setProcessing(true);
    try {
      const editedUrl = await applyCenterCrop(previewUrl, aspect);
      onApply(editedUrl);
      onClose();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-border/80 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop photo</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Center crop — original file is unchanged in storage
          </p>
        </DialogHeader>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Crop preview"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CROP_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              size="sm"
              variant={aspect === opt.id ? "default" : "outline"}
              className={cn(
                aspect === opt.id && "bg-amber-500 text-black hover:bg-amber-400"
              )}
              disabled={processing}
              onClick={() => setAspect(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-amber-500 text-black hover:bg-amber-400"
            disabled={processing}
            onClick={handleApply}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Apply crop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
