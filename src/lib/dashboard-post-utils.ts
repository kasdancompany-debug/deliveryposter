import type { PlatformChoice, PostStatus } from "@/types/database";

export type StatusFilter = "all" | PostStatus;
export type SortOption = "newest" | "oldest" | "customer" | "vehicle" | "status";

export interface DashboardPostRow {
  id: string;
  customerName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  status: PostStatus;
  createdAt: string;
  thumbnailUrl: string | null;
  platforms: PlatformChoice;
}

export const FILTER_EMPTY_STATES: Record<
  Exclude<StatusFilter, "all">,
  { title: string; description: string }
> = {
  draft: {
    title: "No drafts",
    description: "Start a new delivery to create a draft.",
  },
  ready: {
    title: "Nothing ready to publish",
    description: "Mark a draft as ready when captions and photos are set.",
  },
  posted: {
    title: "No published posts yet",
    description: "Published deliveries will appear here.",
  },
  failed: {
    title: "No failed publishes",
    description: "Failed publish attempts will show here.",
  },
};

export const SEARCH_EMPTY = {
  title: "No matches",
  description: "Try a different search term or clear filters.",
};

export function matchesStatusFilter(
  post: DashboardPostRow,
  filter: StatusFilter
): boolean {
  return filter === "all" || post.status === filter;
}

export function matchesSearch(post: DashboardPostRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const vehicle = `${post.vehicleYear} ${post.vehicleMake} ${post.vehicleModel}`.toLowerCase();
  return (
    post.customerName.toLowerCase().includes(q) ||
    vehicle.includes(q) ||
    post.id.toLowerCase().includes(q)
  );
}

export function sortPosts(
  posts: DashboardPostRow[],
  sort: SortOption
): DashboardPostRow[] {
  const copy = [...posts];
  if (sort === "newest")
    return copy.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  if (sort === "oldest")
    return copy.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  if (sort === "customer")
    return copy.sort((a, b) =>
      a.customerName.localeCompare(b.customerName)
    );
  if (sort === "status")
    return copy.sort((a, b) => a.status.localeCompare(b.status));
  return copy.sort((a, b) => {
    const va = `${a.vehicleYear} ${a.vehicleMake} ${a.vehicleModel}`;
    const vb = `${b.vehicleYear} ${b.vehicleMake} ${b.vehicleModel}`;
    return va.localeCompare(vb);
  });
}

export function filterAndSortPosts(
  posts: DashboardPostRow[],
  opts: { statusFilter: StatusFilter; search: string; sort: SortOption }
): DashboardPostRow[] {
  return sortPosts(
    posts.filter(
      (p) =>
        matchesStatusFilter(p, opts.statusFilter) &&
        matchesSearch(p, opts.search)
    ),
    opts.sort
  );
}
