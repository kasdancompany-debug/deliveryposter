import type { DeliveryScoreInput, DeliveryScoreResult } from "./types";

/** Pluggable analyzer — swap mock for vision when ready. */
export interface DeliveryScoreAnalyzer {
  analyze(input: DeliveryScoreInput): Promise<DeliveryScoreResult>;
}
