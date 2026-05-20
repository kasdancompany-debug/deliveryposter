"use client";

import {
  Camera,
  CircleHelp,
  ClipboardList,
  Rocket,
  Share2,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@/types/database";

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Upload delivery photos",
    description:
      "Add 1–10 photos from the handover. Pick a cover image for social previews.",
    icon: Upload,
    color: "text-amber-400",
    bg: "bg-amber-500/15 ring-amber-500/30",
  },
  {
    step: 2,
    title: "Polish photos and protect plates",
    description:
      "Auto-enhance lighting, blur license plates, and crop for a clean dealership look.",
    icon: Wand2,
    color: "text-sky-300",
    bg: "bg-sky-500/15 ring-sky-500/30",
  },
  {
    step: 3,
    title: "Enter delivery details",
    description:
      "Customer name, vehicle, salesperson, stock info, and publishing preferences.",
    icon: ClipboardList,
    color: "text-emerald-300",
    bg: "bg-emerald-500/15 ring-emerald-500/30",
  },
  {
    step: 4,
    title: "Generate and edit AI caption",
    description:
      "Pick a caption style, refine the text, and confirm customer consent.",
    icon: Sparkles,
    color: "text-violet-300",
    bg: "bg-violet-500/15 ring-violet-500/30",
  },
  {
    step: 5,
    title: "Review and publish",
    description:
      "Preview the post, mark it ready, then publish to Facebook and Instagram.",
    icon: Rocket,
    color: "text-orange-300",
    bg: "bg-orange-500/15 ring-orange-500/30",
  },
] as const;

const STATUS_LEGEND: {
  status: PostStatus;
  description: string;
}[] = [
  { status: "draft", description: "Still being built" },
  { status: "ready", description: "Reviewed and waiting to publish" },
  { status: "posted", description: "Published to social" },
  { status: "failed", description: "Needs attention — try again" },
];

interface HowItWorksModalProps {
  triggerClassName?: string;
}

export function HowItWorksModal({ triggerClassName }: HowItWorksModalProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("gap-2 border-border/60", triggerClassName)}
          />
        }
      >
        <CircleHelp className="h-4 w-4 shrink-0 text-amber-400/90" />
        <span>How it works</span>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-border/80 bg-zinc-950 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-xl">How Delivery Post Studio works</DialogTitle>
          <DialogDescription>
            A simple five-step flow from photos to Facebook and Instagram — built
            for dealership staff.
          </DialogDescription>
        </DialogHeader>

        <ol className="relative space-y-0">
          {WORKFLOW_STEPS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === WORKFLOW_STEPS.length - 1;
            return (
              <li key={item.step} className="relative flex gap-4 pb-8 last:pb-0">
                {!isLast && (
                  <span
                    className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-amber-500/40 to-border/30"
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                    item.bg
                  )}
                >
                  <Icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                    Step {item.step}
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  {item.step === 5 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Share2 className="h-3.5 w-3.5 text-blue-400" />
                      <Camera className="h-3.5 w-3.5 text-pink-400" />
                      <span>Facebook Page · Instagram Business</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Post status legend
          </p>
          <ul className="space-y-3">
            {STATUS_LEGEND.map(({ status, description }) => (
              <li
                key={status}
                className="flex items-center justify-between gap-3"
              >
                <StatusBadge status={status} />
                <span className="text-right text-sm text-muted-foreground">
                  {description}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Tip: Use filters on the dashboard to find drafts, ready posts, or
          anything that needs a follow-up.
        </p>
      </DialogContent>
    </Dialog>
  );
}
