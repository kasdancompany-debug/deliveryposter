import type { PlatformChoice, PostStatus } from "@/types/database";

export interface DemoPhoto {
  id: string;
  /** Unedited upload — never overwritten. */
  originalUrl: string;
  /** Edited version used in previews and social publish. */
  editedUrl: string;
  sortOrder: number;
  /** True after license plate pixelation was applied. */
  plateProtected?: boolean;
}

export interface DemoDeliveryPost {
  id: string;
  customerName: string;
  salespersonName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  trim: string;
  colour: string;
  stockNumber: string;
  vinLast6: string;
  story: string;
  customerConsentConfirmed: boolean;
  publishInstagram: boolean;
  publishFacebook: boolean;
  platforms: PlatformChoice;
  photos: DemoPhoto[];
  coverPhotoId: string;
  captionOptions: string[];
  selectedCaptionIndex: number | null;
  finalCaption: string;
  status: PostStatus;
  captionGeneratedAt: string | null;
  markedReadyAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WizardPhoto {
  id: string;
  originalUrl: string;
  editedUrl: string;
  sortOrder: number;
  plateProtected?: boolean;
}

export interface DeliveryDetailsValues {
  customerName: string;
  salespersonName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  trim: string;
  colour: string;
  stockNumber: string;
  vinLast6: string;
  story: string;
  customerConsentConfirmed: boolean;
  publishInstagram: boolean;
  publishFacebook: boolean;
}

export function resolvePlatforms(
  ig: boolean,
  fb: boolean
): PlatformChoice {
  if (ig && fb) return "both";
  if (ig) return "instagram";
  return "facebook";
}
