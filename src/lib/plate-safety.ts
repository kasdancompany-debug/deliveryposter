import type { WizardPhoto } from "@/lib/demo/types";
import type { PlateSafetyStatus } from "@/lib/delivery-score/types";

export function isPhotoPlateProtected(photo: WizardPhoto): boolean {
  return photo.plateProtected === true;
}

export function computePlateSafetyFromPhotos(
  photos: WizardPhoto[]
): PlateSafetyStatus {
  if (!photos.length) return "needs_blur";
  const protectedCount = photos.filter(isPhotoPlateProtected).length;
  if (protectedCount === photos.length) return "safe";
  if (protectedCount > 0) return "attention";
  return "needs_blur";
}

export function plateSafetySummaryLabel(status: PlateSafetyStatus): string {
  switch (status) {
    case "safe":
      return "Protected";
    case "attention":
      return "Partial";
    default:
      return "Action needed";
  }
}
