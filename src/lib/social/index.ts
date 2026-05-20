import { MockSocialPublisher } from "./mock-publisher";
import { MetaSocialPublisher } from "./meta-publisher";
import type { SocialPublisher } from "./types";

export type PublisherMode = "mock" | "meta";

export function getSocialPublisher(mode: PublisherMode = "mock"): SocialPublisher {
  switch (mode) {
    case "meta":
      return new MetaSocialPublisher();
    case "mock":
    default:
      return new MockSocialPublisher({
        forceFailure: process.env.MOCK_PUBLISHER_FORCE_FAILURE === "true",
      });
  }
}

export { resolvePublisherMode } from "./publisher-mode";
export * from "./types";
