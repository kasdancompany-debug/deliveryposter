import type { DeliveryScoreInput, DeliveryScoreResult } from "./types";
import type { DeliveryScoreAnalyzer } from "./analyzer";
import { MockDeliveryScoreAnalyzer } from "./mock-analyzer";

/**
 * Future: OpenAI Vision / custom model endpoint.
 *
 * TODO:
 * - POST edited image URLs to vision API
 * - Parse structured JSON: faces, plates, vehicle bbox, lighting
 * - Map to DeliveryScoreResult
 */
export class VisionDeliveryScoreAnalyzer implements DeliveryScoreAnalyzer {
  async analyze(input: DeliveryScoreInput): Promise<DeliveryScoreResult> {
    if (!process.env.DELIVERY_SCORE_VISION_ENABLED) {
      return new MockDeliveryScoreAnalyzer().analyze(input);
    }

    throw new Error(
      "Vision delivery score not configured. Set DELIVERY_SCORE_VISION_ENABLED and implement API call."
    );
  }
}
