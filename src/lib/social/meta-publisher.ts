import {
  publishToFacebookPage,
  publishToInstagram,
} from "@/lib/meta-publisher";
import { getMetaPublishCredentials } from "./meta-account-service";
import type {
  PublishPayload,
  PublishResult,
  PublishSummary,
  SocialPublisher,
} from "./types";
import { resolvePlatforms } from "./types";

/**
 * Publishes delivery posts via Meta Graph API using stored Page / IG credentials.
 */
export class MetaSocialPublisher implements SocialPublisher {
  async publish(payload: PublishPayload): Promise<PublishSummary> {
    const credentials = await getMetaPublishCredentials();

    if (!credentials) {
      throw new Error(
        "Meta account not connected. Connect Facebook & Instagram in Settings → Social."
      );
    }

    const imageUrl = payload.imageUrls[0];
    if (!imageUrl) {
      throw new Error("At least one public image URL is required to publish.");
    }

    // TODO: Multi-image carousels — Facebook multi-photo / IG carousel containers
    const platforms = resolvePlatforms(payload.platforms);
    const results: PublishResult[] = [];

    for (const platform of platforms) {
      if (platform === "facebook") {
        const fb = await publishToFacebookPage({
          pageId: credentials.pageId,
          pageAccessToken: credentials.pageAccessToken,
          imageUrl,
          caption: payload.caption,
        });
        results.push({
          platform: "facebook",
          success: fb.success,
          externalPostId: fb.externalPostId,
          errorMessage: fb.errorMessage,
          rawResponse: fb.rawResponse,
        });
        continue;
      }

      if (!credentials.instagramBusinessAccountId) {
        results.push({
          platform: "instagram",
          success: false,
          errorMessage:
            "No Instagram Business account linked to the connected Facebook Page.",
        });
        continue;
      }

      const ig = await publishToInstagram({
        instagramBusinessAccountId: credentials.instagramBusinessAccountId,
        accessToken: credentials.pageAccessToken,
        imageUrl,
        caption: payload.caption,
      });
      results.push({
        platform: "instagram",
        success: ig.success,
        externalPostId: ig.externalPostId,
        errorMessage: ig.errorMessage,
        rawResponse: ig.rawResponse,
      });
    }

    return {
      results,
      allSucceeded: results.every((r) => r.success),
    };
  }
}
