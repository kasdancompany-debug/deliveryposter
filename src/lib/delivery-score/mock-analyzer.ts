import { loadImage } from "@/lib/image-processing";
import type {
  DeliveryScoreInput,
  DeliveryScoreResult,
  PhotoMetricBreakdown,
  PlateSafetyStatus,
} from "./types";
import type { DeliveryScoreAnalyzer } from "./analyzer";

interface ImageStats {
  avgLuminance: number;
  contrast: number;
  edgeDensity: number;
  width: number;
  height: number;
}

async function sampleImageStats(url: string): Promise<ImageStats> {
  const img = await loadImage(url);
  const w = Math.min(img.naturalWidth, 320);
  const h = Math.min(img.naturalHeight, 320);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let sum = 0;
  let sumSq = 0;
  let edges = 0;
  const pixels = w * h;

  for (let i = 0; i < data.length; i += 4) {
    const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    sum += lum;
    sumSq += lum * lum;
  }

  const avgLuminance = sum / pixels;
  const variance = sumSq / pixels - avgLuminance * avgLuminance;
  const contrast = Math.sqrt(Math.max(0, variance));

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const lum =
        (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const iR = (y * w + (x + 1)) * 4;
      const lumR =
        (0.299 * data[iR] + 0.587 * data[iR + 1] + 0.114 * data[iR + 2]) / 255;
      if (Math.abs(lum - lumR) > 0.12) edges++;
    }
  }

  const edgeDensity = edges / pixels;

  return {
    avgLuminance,
    contrast,
    edgeDensity,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

function scoreLighting(avg: number): number {
  const ideal = 0.48;
  const dist = Math.abs(avg - ideal);
  return Math.round(Math.max(0, Math.min(100, 100 - dist * 180)));
}

function scoreContrast(c: number): number {
  return Math.round(Math.max(0, Math.min(100, c * 320)));
}

function scoreFraming(w: number, h: number): number {
  const ratio = w / h;
  const idealRatios = [4 / 5, 4 / 3, 1, 16 / 9];
  const best = Math.min(...idealRatios.map((r) => Math.abs(ratio - r)));
  const ratioScore = Math.max(0, 100 - best * 120);
  const resScore = Math.min(100, (Math.min(w, h) / 800) * 100);
  return Math.round(ratioScore * 0.55 + resScore * 0.45);
}

function scoreVehicleVisibility(stats: ImageStats): number {
  const landscapeBonus = stats.width >= stats.height ? 12 : 0;
  const edge = Math.min(100, stats.edgeDensity * 900);
  const contrast = scoreContrast(stats.contrast);
  return Math.round(
    Math.min(100, contrast * 0.45 + edge * 0.35 + landscapeBonus + 20)
  );
}

function scoreHumanVisibility(stats: ImageStats, index: number): number {
  const seed = (stats.width + stats.height + index * 17) % 100;
  const brightnessOk = stats.avgLuminance > 0.32 && stats.avgLuminance < 0.72;
  const base = 52 + seed * 0.35;
  return Math.round(
    Math.min(100, Math.max(35, base + (brightnessOk ? 18 : -12) + stats.contrast * 80))
  );
}

function resolvePlateSafety(
  photos: DeliveryScoreInput["photos"]
): PlateSafetyStatus {
  const hasFlags = photos.some((p) => p.plateProtected !== undefined);
  if (hasFlags) {
    const protectedCount = photos.filter((p) => p.plateProtected).length;
    if (protectedCount === photos.length) return "safe";
    if (protectedCount > 0) return "attention";
    return "needs_blur";
  }
  const unedited = photos.filter((p) => p.originalUrl === p.editedUrl);
  if (unedited.length === 0) return "safe";
  if (unedited.length === photos.length) return "needs_blur";
  return "attention";
}

function buildSuggestions(
  result: Pick<
    DeliveryScoreResult,
    | "socialImpactScore"
    | "plateSafety"
    | "lightingScore"
    | "vehicleVisibilityScore"
    | "humanVisibilityScore"
    | "framingScore"
    | "contrastScore"
  >
): string[] {
  const tips: string[] = [];

  if (result.plateSafety === "needs_blur") {
    tips.push("Blur license plates on all photos before publishing.");
  } else if (result.plateSafety === "attention") {
    tips.push("Some photos still show plates — open Photo Polish and blur remaining plates.");
  }

  if (result.lightingScore < 65) {
    tips.push("Try Natural+ or Auto Enhance for a subtle brightness lift.");
  }

  if (result.contrastScore < 60) {
    tips.push("Apply High Contrast or Showroom Pop for a sharper social feed look.");
  }

  if (result.vehicleVisibilityScore < 70) {
    tips.push("Reframe photos so the full vehicle is visible — wide shots perform best.");
  }

  if (result.humanVisibilityScore < 65) {
    tips.push("Include clear faces in at least one photo — customers connect with people.");
  }

  if (result.framingScore < 65) {
    tips.push("Crop to a clean 4:5 or 4:3 frame; avoid cutting off the vehicle or subjects.");
  }

  if (result.socialImpactScore >= 85 && tips.length === 0) {
    tips.push("Strong delivery set — ready for caption studio and approval.");
  }

  if (tips.length === 0 && result.socialImpactScore < 85) {
    tips.push("Polish cover photo first, then apply a filter across all images.");
  }

  return tips.slice(0, 5);
}

/**
 * Mock analyzer — uses canvas pixel sampling (demo).
 * Replace with VisionDeliveryScoreAnalyzer when AI vision is ready.
 */
export class MockDeliveryScoreAnalyzer implements DeliveryScoreAnalyzer {
  async analyze(input: DeliveryScoreInput): Promise<DeliveryScoreResult> {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));

    const breakdown: PhotoMetricBreakdown[] = [];

    for (let i = 0; i < input.photos.length; i++) {
      const photo = input.photos[i];
      const url = photo.editedUrl || photo.originalUrl;
      const stats = await sampleImageStats(url);

      breakdown.push({
        photoId: photo.id,
        lighting: scoreLighting(stats.avgLuminance),
        vehicleVisibility: scoreVehicleVisibility(stats),
        humanVisibility: scoreHumanVisibility(stats, i),
        framing: scoreFraming(stats.width, stats.height),
        contrast: scoreContrast(stats.contrast),
      });
    }

    const avg = (key: keyof PhotoMetricBreakdown) => {
      if (key === "photoId") return 0;
      const vals = breakdown.map((b) => b[key] as number);
      return vals.length
        ? Math.round(vals.reduce((a, v) => a + v, 0) / vals.length)
        : 0;
    };

    const plateSafety = resolvePlateSafety(input.photos);
    const plateBonus =
      plateSafety === "safe" ? 12 : plateSafety === "attention" ? 4 : 0;

    const lightingScore = avg("lighting");
    const vehicleVisibilityScore = avg("vehicleVisibility");
    const humanVisibilityScore = avg("humanVisibility");
    const framingScore = avg("framing");
    const contrastScore = avg("contrast");

    const socialImpactScore = Math.round(
      Math.min(
        100,
        lightingScore * 0.18 +
          contrastScore * 0.15 +
          vehicleVisibilityScore * 0.28 +
          humanVisibilityScore * 0.22 +
          framingScore * 0.12 +
          plateBonus
      )
    );

    const partial = {
      socialImpactScore,
      plateSafety,
      lightingScore,
      vehicleVisibilityScore,
      humanVisibilityScore,
      framingScore,
      contrastScore,
      photoBreakdown: breakdown,
    };

    return {
      ...partial,
      suggestions: buildSuggestions(partial),
      analyzedAt: new Date().toISOString(),
      provider: "mock",
    };
  }
}
