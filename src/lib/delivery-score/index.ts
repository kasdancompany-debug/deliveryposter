import type { DeliveryScoreAnalyzer } from "./analyzer";
import { MockDeliveryScoreAnalyzer } from "./mock-analyzer";
import { VisionDeliveryScoreAnalyzer } from "./vision-analyzer";
import type { DeliveryScoreInput, DeliveryScoreResult } from "./types";

export * from "./types";
export * from "./analyzer";

export function getDeliveryScoreAnalyzer(
  mode: "mock" | "vision" = "mock"
): DeliveryScoreAnalyzer {
  switch (mode) {
    case "vision":
      return new VisionDeliveryScoreAnalyzer();
    case "mock":
    default:
      return new MockDeliveryScoreAnalyzer();
  }
}

/** Analyze delivery photos and return scores + suggestions. */
export async function analyzeDeliveryPhotos(
  input: DeliveryScoreInput
): Promise<DeliveryScoreResult> {
  const useVision =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_DELIVERY_SCORE_PROVIDER === "vision";
  const analyzer = getDeliveryScoreAnalyzer(useVision ? "vision" : "mock");
  return analyzer.analyze(input);
}
