import { DashboardPostsClient } from "@/components/dashboard-posts-client";
import { listPosts } from "@/app/actions/posts";
import { isDemoMode } from "@/lib/supabase/middleware";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardPostCard } from "@/components/dashboard-post-card";
import type { PostStatus } from "@/types/database";

export default async function DashboardPage() {
  if (isDemoMode()) {
    return <DashboardPostsClient />;
  }

  const posts = await listPosts();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Delivery posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft, approve, and publish customer delivery celebrations.
          </p>
        </div>
        <Link
          href="/posts/new"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-2.5 text-sm font-medium text-black transition hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          New delivery
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 px-8 py-16 text-center">
          <p className="text-lg font-medium">No delivery posts yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first post to celebrate a customer handover.
          </p>
          <Link
            href="/posts/new"
            className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-medium text-black hover:bg-amber-400"
          >
            Get started
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => {
            const photos = [...(post.delivery_post_photos ?? [])].sort(
              (a: { sort_order: number }, b: { sort_order: number }) =>
                a.sort_order - b.sort_order
            );
            const thumb = photos[0]?.public_url;
            const vehicleLabel = `${post.vehicle_year} ${post.vehicle_make} ${post.vehicle_model}`;

            return (
              <DashboardPostCard
                key={post.id}
                id={post.id}
                customerName={post.customer_name}
                vehicleLabel={vehicleLabel}
                status={post.status as PostStatus}
                createdAt={post.created_at}
                thumbnailUrl={thumb}
                platforms={post.platforms}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
