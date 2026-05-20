import type {
  PublishPayload,
  PublishResult,
  PublishSummary,
  SocialPublisher,
} from "./types";
import { resolvePlatforms } from "./types";

/**
 * Mock publisher for development. Simulates Meta API latency and responses.
 * Replace with MetaPublisher when Graph API credentials are available.
 */
export class MockSocialPublisher implements SocialPublisher {
  constructor(
    private readonly options: {
      forceFailure?: boolean;
      failureRate?: number;
      delayMs?: number;
    } = {}
  ) {}

  async publish(payload: PublishPayload): Promise<PublishSummary> {
    const platforms = resolvePlatforms(payload.platforms);
    const delay = this.options.delayMs ?? 800 + Math.random() * 700;

    await new Promise((r) => setTimeout(r, delay));

    const forceFail =
      this.options.forceFailure ??
      process.env.MOCK_PUBLISHER_FORCE_FAILURE === "true";

    const results: PublishResult[] = platforms.map((platform) => {
      const shouldFail =
        forceFail ||
        (this.options.failureRate !== undefined &&
          Math.random() < this.options.failureRate);

      if (shouldFail) {
        return {
          platform,
          success: false,
          errorMessage: `Mock ${platform} API error: rate limit exceeded (simulated)`,
          rawResponse: {
            error: { code: 4, message: "Application request limit reached" },
            mock: true,
          },
        };
      }

      return {
        platform,
        success: true,
        externalPostId: `mock_${platform}_${payload.postId.slice(0, 8)}_${Date.now()}`,
        rawResponse: {
          id: `mock_${platform}_${Date.now()}`,
          status: "published",
          mock: true,
        },
      };
    });

    return {
      results,
      allSucceeded: results.every((r) => r.success),
    };
  }
}
