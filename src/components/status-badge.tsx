import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@/types/database";

const statusConfig: Record<
  PostStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/10",
  },
  ready: {
    label: "Ready",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10",
  },
  posted: {
    label: "Posted",
    className:
      "border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/10",
  },
  failed: {
    label: "Failed",
    className:
      "border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/10",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: PostStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("font-medium tracking-wide", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
