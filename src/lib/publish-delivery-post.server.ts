import { getOrderedPhotoUrls } from "@/lib/demo/posts-store";
import type { DemoDeliveryPost } from "@/lib/demo/types";
import { getSocialPublisher } from "@/lib/social";
import { resolvePublisherMode } from "@/lib/social/publisher-mode";
import { resolvePlatforms } from "@/lib/social/types";
import type { MockPublishResult } from "@/lib/demo/mock-publish";

/**
 * Server-only publish via Meta Graph API (production).
 */
export async function publishDeliveryPostMeta(
  post: DemoDeliveryPost
): Promise<MockPublishResult> {
  const imageUrls = getOrderedPhotoUrls(post);
  if (!imageUrls.length) {
    return {
      status: "failed",
      publishedAt: null,
      message: "At least one photo is required to publish.",
    };
  }

  if (!post.finalCaption?.trim()) {
    return {
      status: "failed",
      publishedAt: null,
      message: "Caption is required before publishing.",
    };
  }

  try {
    const publisher = getSocialPublisher(resolvePublisherMode());
    const summary = await publisher.publish({
      postId: post.id,
      caption: post.finalCaption,
      imageUrls,
      platforms: post.platforms,
    });

    if (summary.allSucceeded) {
      const platforms = resolvePlatforms(post.platforms).join(" & ");
      return {
        status: "posted",
        publishedAt: new Date().toISOString(),
        message: `Published to ${platforms} via Meta.`,
      };
    }

    const failed = summary.results
      .filter((r) => !r.success)
      .map((r) => `${r.platform}: ${r.errorMessage ?? "failed"}`)
      .join("; ");

    return {
      status: "failed",
      publishedAt: null,
      message: `Publish failed: ${failed}`,
    };
  } catch (e) {
    return {
      status: "failed",
      publishedAt: null,
      message: e instanceof Error ? e.message : "Publish failed",
    };
  }
}
