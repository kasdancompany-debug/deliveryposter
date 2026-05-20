import type { DemoPhoto } from "./types";
import type { WizardPhoto } from "./types";

/** Legacy localStorage shape (pre originalUrl / editedUrl) */
interface LegacyPhoto {
  id: string;
  sortOrder: number;
  originalUrl?: string;
  editedUrl?: string;
  originalDataUrl?: string;
  dataUrl?: string;
}

function isLegacyPhoto(photo: WizardPhoto | LegacyPhoto): photo is LegacyPhoto {
  return "originalDataUrl" in photo || ("dataUrl" in photo && !("editedUrl" in photo && photo.editedUrl));
}

function resolveOriginalUrl(photo: WizardPhoto | LegacyPhoto): string {
  if (photo.originalUrl) return photo.originalUrl;
  if (isLegacyPhoto(photo)) {
    return photo.originalDataUrl ?? photo.dataUrl ?? photo.editedUrl ?? "";
  }
  return photo.editedUrl ?? "";
}

function resolveEditedUrl(photo: WizardPhoto | LegacyPhoto): string {
  if (photo.editedUrl) return photo.editedUrl;
  if (isLegacyPhoto(photo)) {
    return photo.dataUrl ?? photo.originalDataUrl ?? photo.originalUrl ?? "";
  }
  return photo.originalUrl ?? "";
}

/** URL for Instagram/Facebook previews and publish. */
export function getEditedUrl(photo: WizardPhoto | DemoPhoto): string {
  return resolveEditedUrl(photo);
}

export function getOriginalUrl(photo: WizardPhoto | DemoPhoto): string {
  return resolveOriginalUrl(photo);
}

export function isPhotoEdited(photo: WizardPhoto | DemoPhoto): boolean {
  const orig = getOriginalUrl(photo);
  const edited = getEditedUrl(photo);
  return !!orig && orig !== edited;
}

export function wizardPhotoToDemo(photo: WizardPhoto, sortOrder: number): DemoPhoto {
  return {
    id: photo.id,
    originalUrl: photo.originalUrl,
    editedUrl: photo.editedUrl,
    sortOrder,
    plateProtected: photo.plateProtected,
  };
}

export function demoPhotoToWizard(photo: DemoPhoto | LegacyPhoto): WizardPhoto {
  const originalUrl = resolveOriginalUrl(photo);
  const editedUrl = resolveEditedUrl(photo);
  const plateProtected =
    "plateProtected" in photo && photo.plateProtected !== undefined
      ? photo.plateProtected
      : false;
  return {
    id: photo.id,
    originalUrl,
    editedUrl,
    sortOrder: photo.sortOrder,
    plateProtected,
  };
}

export function normalizeDemoPhoto(photo: LegacyPhoto): DemoPhoto {
  const normalized = {
    id: photo.id,
    originalUrl: resolveOriginalUrl(photo),
    editedUrl: resolveEditedUrl(photo),
    sortOrder: photo.sortOrder,
    plateProtected:
      "plateProtected" in photo ? Boolean(photo.plateProtected) : false,
  };
  return normalized;
}
