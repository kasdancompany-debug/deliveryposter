import type { DeliveryPostPhoto } from "@/types/database";
import type { WizardPhoto } from "./types";

export function getEditedUrl(photo: WizardPhoto): string {
  return photo.editedUrl;
}

export function getOriginalUrl(photo: WizardPhoto): string {
  return photo.originalUrl;
}

export function isPhotoEdited(photo: WizardPhoto): boolean {
  return photo.editedUrl !== photo.originalUrl;
}

export function dbPhotoToWizard(photo: DeliveryPostPhoto): WizardPhoto {
  const original =
    photo.original_public_url ?? photo.public_url ?? "";
  const edited = photo.public_url ?? original;
  return {
    id: photo.id,
    storagePhotoId: photo.id,
    originalUrl: original,
    editedUrl: edited,
    sortOrder: photo.sort_order,
    plateProtected: Boolean(
      (photo as DeliveryPostPhoto & { plate_protected?: boolean })
        .plate_protected
    ),
  };
}

export function getOrderedPhotoUrls(
  photos: WizardPhoto[],
  coverPhotoId: string
): string[] {
  const sorted = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
  const cover = sorted.find((p) => p.id === coverPhotoId) ?? sorted[0];
  const rest = sorted.filter((p) => p.id !== cover?.id);
  return [cover, ...rest]
    .filter(Boolean)
    .map((p) => getEditedUrl(p!));
}

export function getCoverUrl(
  photos: WizardPhoto[],
  coverPhotoId: string
): string | null {
  const cover = photos.find((p) => p.id === coverPhotoId) ?? photos[0];
  return cover ? getEditedUrl(cover) : null;
}
