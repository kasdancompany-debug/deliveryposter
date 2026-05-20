"use client";

import { Check, Circle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { TimelineStep } from "@/lib/demo/timeline";

export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => (
        <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < steps.length - 1 && (
            <span
              className={cn(
                "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px",
                step.state === "complete"
                  ? "bg-amber-500/50"
                  : "bg-border"
              )}
            />
          )}
          <span
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
              step.state === "complete" &&
                "border-amber-500 bg-amber-500 text-black",
              step.state === "current" &&
                "border-amber-500/60 bg-amber-500/15 text-amber-300",
              step.state === "upcoming" &&
                "border-border bg-muted/30 text-muted-foreground"
            )}
          >
            {step.state === "complete" ? (
              <Check className="h-4 w-4" />
            ) : step.state === "current" ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={cn(
                "font-medium",
                step.state === "upcoming"
                  ? "text-muted-foreground"
                  : "text-foreground"
              )}
            >
              {step.label}
            </p>
            {step.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {step.description}
              </p>
            )}
            {step.at && (
              <p className="mt-1 text-xs text-amber-400/70">
                {format(new Date(step.at), "MMM d, yyyy · h:mm a")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
