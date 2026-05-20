"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardPostCard } from "@/components/dashboard-post-card";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { DeletePostDialog } from "@/components/dashboard/delete-post-dialog";
import { HowItWorksModal } from "@/components/dashboard/how-it-works-modal";
import {
  FILTER_EMPTY_STATES,
  SEARCH_EMPTY,
  filterAndSortPosts,
  type SortOption,
  type StatusFilter,
} from "@/lib/dashboard-post-utils";
import { deleteDemoPostLogs } from "@/lib/demo/post-logs-store";
import { deleteDemoPost, duplicateDemoPost, getCoverUrl, listAllDemoPosts } from "@/lib/demo/posts-store";
import type { DemoDeliveryPost } from "@/lib/demo/types";
import type { PostStatus } from "@/types/database";

export function DashboardPostsClient() {
  const router = useRouter();
  const [posts, setPosts] = useState<DemoDeliveryPost[]>([]);
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(() => setPosts(listAllDemoPosts()), []);

  useEffect(() => {
    refresh();
    setMounted(true);
    const handler = () => refresh();
    window.addEventListener("dps-posts-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("dps-posts-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: posts.length, draft: 0, ready: 0, posted: 0, failed: 0 };
    for (const p of posts) c[p.status as PostStatus]++;
    return c;
  }, [posts]);

  const filtered = useMemo(
    () => filterAndSortPosts(posts, { statusFilter, search, sort }),
    [posts, statusFilter, search, sort]
  );

  function handleDuplicate(id: string) {
    const copy = duplicateDemoPost(id);
    if (copy) {
      toast.success("Post duplicated");
      router.push(`/posts/${copy.id}/edit`);
    } else toast.error("Could not duplicate");
  }

  function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    deleteDemoPost(deleteId);
    deleteDemoPostLogs(deleteId);
    toast.success("Post deleted");
    setDeleteId(null);
    setDeleting(false);
    refresh();
  }

  if (!mounted) return <div className="h-32 animate-pulse rounded-2xl bg-muted/30" />;

  const isSearchEmpty = search.trim() && filtered.length === 0 && posts.length > 0;
  const isFilterEmpty = !search.trim() && filtered.length === 0;
  const empty = isSearchEmpty ? SEARCH_EMPTY : FILTER_EMPTY_STATES[statusFilter];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Delivery posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Draft, approve, and publish customer delivery celebrations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HowItWorksModal />
          <Link
            href="/posts/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-black hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            New delivery
          </Link>
        </div>
      </div>

      {posts.length > 0 && (
        <DashboardToolbar statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} search={search} onSearchChange={setSearch} sort={sort} onSortChange={setSort} counts={counts} />
      )}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 px-8 py-16 text-center">
          <p className="text-lg font-medium">{FILTER_EMPTY_STATES.all.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{FILTER_EMPTY_STATES.all.description}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/posts/new"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-medium text-black hover:bg-amber-400"
            >
              Get started
            </Link>
            <HowItWorksModal triggerClassName="h-10" />
          </div>
        </div>
      ) : isFilterEmpty || isSearchEmpty ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 px-8 py-16 text-center">
          <p className="text-lg font-medium">{empty.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{empty.description}</p>
          {isSearchEmpty && <ButtonResetSearch onReset={() => setSearch("")} />}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((post) => (
            <DashboardPostCard
              key={post.id}
              id={post.id}
              customerName={post.customerName || "Untitled delivery"}
              vehicleLabel={`${post.vehicleYear} ${post.vehicleMake} ${post.vehicleModel}`.trim()}
              status={post.status as PostStatus}
              createdAt={post.createdAt}
              thumbnailUrl={getCoverUrl(post)}
              platforms={post.platforms}
              onDuplicate={handleDuplicate}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <DeletePostDialog open={!!deleteId} deleting={deleting} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={confirmDelete} />
    </div>
  );
}

function ButtonResetSearch({ onReset }: { onReset: () => void }) {
  return (
    <button type="button" onClick={onReset} className="mt-4 text-sm text-amber-400 hover:underline">Clear search</button>
  );
}
