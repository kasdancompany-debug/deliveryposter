import type { PlatformChoice, PostStatus } from "@/types/database";

export interface WizardPhoto {
  id: string;
  /** Set after first save to Supabase storage. */
  storagePhotoId?: string;
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

export interface DeliveryPostWizardState {
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
  photos: WizardPhoto[];
  coverPhotoId: string;
  captionOptions: string[];
  selectedCaptionIndex: number | null;
  finalCaption: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}

export function resolvePlatforms(
  ig: boolean,
  fb: boolean
): PlatformChoice {
  if (ig && fb) return "both";
  if (ig) return "instagram";
  return "facebook";
}

export function platformsToFlags(platforms: PlatformChoice): {
  publishInstagram: boolean;
  publishFacebook: boolean;
} {
  return {
    publishInstagram: platforms === "instagram" || platforms === "both",
    publishFacebook: platforms === "facebook" || platforms === "both",
  };
}

export function platformsLabelFromChoice(platforms: PlatformChoice): string {
  if (platforms === "both") return "Instagram & Facebook";
  if (platforms === "instagram") return "Instagram";
  return "Facebook";
}
