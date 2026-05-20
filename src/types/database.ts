export type PostStatus = "draft" | "ready" | "posted" | "failed";
export type PlatformChoice = "instagram" | "facebook" | "both";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "staff" | "manager" | "admin";
  dealership_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPost {
  id: string;
  created_by: string;
  customer_name: string;
  salesperson_name: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  trim: string | null;
  colour: string | null;
  story: string | null;
  consent_confirmed: boolean;
  platforms: PlatformChoice;
  status: PostStatus;
  caption_options: string[];
  selected_caption_index: number | null;
  final_caption: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPostPhoto {
  id: string;
  post_id: string;
  storage_path: string;
  public_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  platform: "meta" | "facebook" | "instagram";
  page_id: string | null;
  page_name: string | null;
  instagram_business_account_id: string | null;
  instagram_username: string | null;
  access_token_encrypted: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostLog {
  id: string;
  post_id: string;
  platform: string;
  action: string;
  status: "success" | "failure" | "pending";
  response: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

export interface DeliveryPostWithPhotos extends DeliveryPost {
  delivery_post_photos: DeliveryPostPhoto[];
}

export interface DeliveryFormValues {
  customerName: string;
  salespersonName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  trim?: string;
  colour?: string;
  story?: string;
  consentConfirmed: boolean;
  platforms: PlatformChoice;
}
