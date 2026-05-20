import { publishPost } from "@/app/actions/posts";

export interface PublishResult {
  status: "posted" | "failed";
  publishedAt: string | null;
  message: string;
}

/**
 * Publish a ready delivery post by id (server-backed).
 */
export async function publishDeliveryPost(
  postId: string
): Promise<PublishResult> {
  const result = await publishPost(postId);

  if ("error" in result) {
    return {
      status: "failed",
      publishedAt: null,
      message: result.error,
    };
  }

  return {
    status: "posted",
    publishedAt: new Date().toISOString(),
    message: "Published successfully",
  };
}
