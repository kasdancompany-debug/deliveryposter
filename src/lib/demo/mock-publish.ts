import type { PostStatus } from "@/types/database";
import type { DemoDeliveryPost } from "./types";

export interface MockPublishResult {
  status: PostStatus;
  publishedAt: string | null;
  message: string;
}

function platformLabel(post: DemoDeliveryPost): string {
  const parts: string[] = [];
  if (post.publishInstagram) parts.push("Instagram");
  if (post.publishFacebook) parts.push("Facebook");
  return parts.length ? parts.join("/") : "social";
}

export async function mockPublishPost(
  post: DemoDeliveryPost
): Promise<MockPublishResult> {
  await new Promise((r) => setTimeout(r, 900));
  if (process.env.NEXT_PUBLIC_MOCK_PUBLISH_FAIL === "true") {
    return { status: "failed", publishedAt: null, message: "Mock publish failed." };
  }
  const label = platformLabel(post);
  if (typeof window !== "undefined") {
    const { addDemoMockPublishLog } = await import("@/lib/demo/post-logs-store");
    addDemoMockPublishLog(post.id, post.publishInstagram, post.publishFacebook);
  }
  return {
    status: "posted",
    publishedAt: new Date().toISOString(),
    message: `Mock published to ${label}`,
  };
}
