import type { PlatformChoice } from "@/types/database";

export type SocialPlatform = "instagram" | "facebook";

export interface PublishPayload {
  postId: string;
  caption: string;
  imageUrls: string[];
  platforms: PlatformChoice;
}

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  externalPostId?: string;
  errorMessage?: string;
  rawResponse?: Record<string, unknown>;
}

export interface PublishSummary {
  results: PublishResult[];
  allSucceeded: boolean;
}

export interface SocialPublisher {
  publish(payload: PublishPayload): Promise<PublishSummary>;
}

export function resolvePlatforms(choice: PlatformChoice): SocialPlatform[] {
  if (choice === "both") return ["instagram", "facebook"];
  return [choice];
}
