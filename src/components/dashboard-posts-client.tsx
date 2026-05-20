"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardPostCard } from "@/components/dashboard-post-card";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { DeletePostDialog } from "@/components/dashboard/delete-post-dialog";
import { HowItWorksModal } from "@/components/dashboard/how-it-works-modal";
import {
  deleteDeliveryPost,
  duplicateDeliveryPost,
} from "@/app/actions/wizard";
import {
  FILTER_EMPTY_STATES,
  SEARCH_EMPTY,
  filterAndSortPosts,
  type DashboardPostRow,
  type SortOption,
  type StatusFilter,
} from "@/lib/dashboard-post-utils";
import type { PostStatus } from "@/types/database";

interface DashboardPostsClientProps {
  initialPosts: DashboardPostRow[];
}

export function DashboardPostsClient({
  initialPosts,
}: DashboardPostsClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: posts.length,
      draft: 0,
      ready: 0,
      posted: 0,
      failed: 0,
    };
    for (const p of posts) c[p.status as PostStatus]++;
    return c;
  }, [posts]);

  const filtered = useMemo(
    () => filterAndSortPosts(posts, { statusFilter, search, sort }),
    [posts, statusFilter, search, sort]
  );

  async function handleDuplicate(id: string) {
    const copy = await duplicateDeliveryPost(id);
    if ("error" in copy) {
      toast.error(copy.error);
      return;
    }
    toast.success("Post duplicated");
    router.push(`/posts/${copy.id}/edit`);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteDeliveryPost(deleteId);
    setDeleting(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== deleteId));
    toast.success("Post deleted");
    setDeleteId(null);
  }

  const isSearchEmpty =
    search.trim() && filtered.length === 0 && posts.length > 0;
  const emptyState =
    isSearchEmpty
      ? SEARCH_EMPTY
      : statusFilter !== "all"
        ? FILTER_EMPTY_STATES[statusFilter]
        : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Delivery posts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft, approve, and publish customer delivery celebrations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HowItWorksModal />
          <Link
            href="/posts/new"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-2.5 text-sm font-medium text-black transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            New delivery
          </Link>
        </div>
      </div>

      <DashboardToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        counts={counts}
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 px-8 py-16 text-center">
          <p className="text-lg font-medium">
            {emptyState?.title ?? "No delivery posts yet"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {emptyState?.description ??
              "Create your first post to celebrate a customer handover."}
          </p>
          {!emptyState && (
            <Link
              href="/posts/new"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-medium text-black hover:bg-amber-400"
            >
              Get started
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((post) => {
            const vehicleLabel = `${post.vehicleYear} ${post.vehicleMake} ${post.vehicleModel}`;
            return (
              <DashboardPostCard
                key={post.id}
                id={post.id}
                customerName={post.customerName}
                vehicleLabel={vehicleLabel}
                status={post.status}
                createdAt={post.createdAt}
                thumbnailUrl={post.thumbnailUrl}
                platforms={post.platforms}
                onDuplicate={() => handleDuplicate(post.id)}
                onDelete={() => setDeleteId(post.id)}
              />
            );
          })}
        </div>
      )}

      <DeletePostDialog
        open={Boolean(deleteId)}
        deleting={deleting}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
