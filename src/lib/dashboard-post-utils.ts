import type { DemoDeliveryPost } from "@/lib/demo/types";
import type { PostStatus } from "@/types/database";

export type StatusFilter = "all" | PostStatus;
export type SortOption = "newest" | "oldest" | "status";

const STATUS_ORDER: Record<PostStatus, number> = { draft: 0, ready: 1, posted: 2, failed: 3 };

export function matchesStatusFilter(post: DemoDeliveryPost, filter: StatusFilter): boolean {
  return filter === "all" || post.status === filter;
}

export function matchesSearch(post: DemoDeliveryPost, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [post.customerName, post.salespersonName, post.vehicleMake, post.vehicleModel, String(post.vehicleYear), post.trim, post.stockNumber].join(" ").toLowerCase();
  return haystack.includes(q);
}

export function sortDemoPosts(posts: DemoDeliveryPost[], sort: SortOption): DemoDeliveryPost[] {
  const copy = [...posts];
  if (sort === "oldest") return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (sort === "status") return copy.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function filterAndSortPosts(posts: DemoDeliveryPost[], opts: { statusFilter: StatusFilter; search: string; sort: SortOption }): DemoDeliveryPost[] {
  return sortDemoPosts(posts.filter((p) => matchesStatusFilter(p, opts.statusFilter) && matchesSearch(p, opts.search)), opts.sort);
}

export const FILTER_EMPTY_STATES: Record<StatusFilter, { title: string; description: string }> = {
  all: { title: "No delivery posts yet", description: "Create your first post to celebrate a customer handover." },
  draft: { title: "No draft posts", description: "Drafts appear here while you are building a delivery post." },
  ready: { title: "No posts ready for approval", description: "Mark a post ready from the review page when it is complete." },
  posted: { title: "No published posts", description: "Posts move here after a successful mock or live publish." },
  failed: { title: "No failed publishes", description: "Failed publish attempts will show up in this filter." },
};

export const SEARCH_EMPTY = { title: "No matching posts", description: "Try a different customer name, salesperson, or vehicle." };
