import { mockPublishPost, type MockPublishResult } from "@/lib/demo/mock-publish";
import type { DemoDeliveryPost } from "@/lib/demo/types";

function isClientDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/**
 * Publish a delivery post.
 * Demo mode: client-side mock. Production: POST /api/posts/publish (Meta Graph API).
 */
export async function publishDeliveryPost(
  post: DemoDeliveryPost
): Promise<MockPublishResult> {
  if (isClientDemoMode()) {
    return mockPublishPost(post);
  }

  const res = await fetch("/api/posts/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post }),
  });

  const data = (await res.json().catch(() => ({}))) as MockPublishResult & {
    error?: string;
  };

  if (!res.ok) {
    return {
      status: "failed",
      publishedAt: null,
      message: data.error ?? data.message ?? "Publish request failed",
    };
  }

  return {
    status: data.status ?? "failed",
    publishedAt: data.publishedAt ?? null,
    message: data.message ?? "Publish completed",
  };
}
