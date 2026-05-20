export type PlateSafetyStatus = "safe" | "attention" | "needs_blur";

export type ScoreProvider = "mock" | "vision";

export interface DeliveryPhotoInput {
  id: string;
  originalUrl: string;
  editedUrl: string;
  plateProtected?: boolean;
}

export interface PhotoMetricBreakdown {
  photoId: string;
  lighting: number;
  vehicleVisibility: number;
  humanVisibility: number;
  framing: number;
  contrast: number;
}

export interface DeliveryScoreResult {
  socialImpactScore: number;
  plateSafety: PlateSafetyStatus;
  lightingScore: number;
  vehicleVisibilityScore: number;
  humanVisibilityScore: number;
  framingScore: number;
  contrastScore: number;
  suggestions: string[];
  photoBreakdown: PhotoMetricBreakdown[];
  analyzedAt: string;
  provider: ScoreProvider;
}

export interface DeliveryScoreInput {
  photos: DeliveryPhotoInput[];
  coverPhotoId?: string;
}
