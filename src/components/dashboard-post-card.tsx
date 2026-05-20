"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Copy, Eye, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import type { PostStatus } from "@/types/database";

interface DashboardPostCardProps {
  id: string;
  customerName: string;
  vehicleLabel: string;
  status: PostStatus;
  createdAt: string;
  thumbnailUrl?: string | null;
  platforms: string;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DashboardPostCard(props: DashboardPostCardProps) {
  const router = useRouter();
  const { id, customerName, vehicleLabel, status, createdAt, thumbnailUrl, platforms, onDuplicate, onDelete } = props;

  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 hover:border-amber-500/30">
      <button type="button" className="flex w-full text-left" onClick={() => router.push(`/posts/${id}`)}>
        <div className="h-28 w-28 shrink-0 bg-muted sm:h-32 sm:w-36">
          {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No photo</div>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div className="flex justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{customerName}</p>
              <p className="truncate text-sm text-muted-foreground">{vehicleLabel}</p>
            </div>
            <StatusBadge status={status} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{formatDistanceToNow(new Date(createdAt), { addSuffix: true })} · {platforms}</p>
        </div>
      </button>
      <div className="flex flex-wrap gap-1 border-t border-border/50 px-2 py-2">
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => router.push(`/posts/${id}`)}><Eye className="mr-1 h-3.5 w-3.5" />Review</Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => router.push(`/posts/${id}/edit`)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
        {onDuplicate && <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => onDuplicate(id)}><Copy className="mr-1 h-3.5 w-3.5" />Duplicate</Button>}
        {onDelete && <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => onDelete(id)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>}
      </div>
    </Card>
  );
}
