"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Photos" },
  { id: 2, label: "Polish" },
  { id: 3, label: "Details" },
  { id: 4, label: "Caption" },
  { id: 5, label: "Preview" },
] as const;

export function WizardProgress({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between gap-0.5 sm:gap-2">
        {STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          const clickable = onStepClick && (done || active);

          return (
            <li key={step.id} className="flex flex-1 items-center min-w-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(step.id)}
                className={cn(
                  "flex w-full min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-1.5",
                  clickable && "cursor-pointer",
                  !clickable && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold sm:h-8 sm:w-8 sm:text-xs",
                    done && "bg-amber-500 text-black",
                    active &&
                      "bg-amber-500/20 text-amber-300 ring-2 ring-amber-500",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : step.id}
                </span>
                <span
                  className={cn(
                    "truncate text-[9px] font-medium uppercase tracking-wide sm:text-xs",
                    active ? "text-amber-300" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-0.5 hidden h-px w-2 shrink-0 sm:mx-1 sm:block sm:flex-1",
                    done ? "bg-amber-500/50" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
