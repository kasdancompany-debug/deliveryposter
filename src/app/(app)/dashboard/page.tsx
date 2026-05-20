import { DashboardPostsClient } from "@/components/dashboard-posts-client";
import { listPosts } from "@/app/actions/posts";
import type { DashboardPostRow } from "@/lib/dashboard-post-utils";
import type { PlatformChoice, PostStatus } from "@/types/database";

export default async function DashboardPage() {
  const posts = await listPosts();

  const rows: DashboardPostRow[] = posts.map((post) => {
    const photoList = [...(post.delivery_post_photos ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const thumb = photoList[0]?.public_url ?? null;
    return {
      id: post.id,
      customerName: post.customer_name,
      vehicleYear: post.vehicle_year,
      vehicleMake: post.vehicle_make,
      vehicleModel: post.vehicle_model,
      status: post.status as PostStatus,
      createdAt: post.created_at,
      thumbnailUrl: thumb,
      platforms: post.platforms as PlatformChoice,
    };
  });

  return <DashboardPostsClient initialPosts={rows} />;
}
