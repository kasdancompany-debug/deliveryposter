export type MetaPlatform = "meta";

export type MetaTokenStatus = "valid" | "expiring_soon" | "expired" | "missing";

/** Row shape for social_accounts (platform = meta). */
export interface SocialAccountRow {
  id: string;
  platform: MetaPlatform;
  page_id: string | null;
  page_name: string | null;
  instagram_business_account_id: string | null;
  instagram_username: string | null;
  access_token_encrypted: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/** API / UI view — no secrets. */
export interface MetaConnectionView {
  connected: boolean;
  facebookPageConnected: boolean;
  instagramBusinessConnected: boolean;
  pageName: string | null;
  instagramUsername: string | null;
  tokenStatus: MetaTokenStatus;
  pageId: string | null;
  instagramBusinessAccountId: string | null;
  tokenExpiresAt: string | null;
}

export interface MetaPageOption {
  id: string;
  name: string;
  instagramBusinessAccountId: string | null;
  instagramUsername: string | null;
}

export const DEMO_META_PAGE: MetaPageOption = {
  id: "demo_page_sault_nissan",
  name: "Sault Nissan",
  instagramBusinessAccountId: "demo_ig_business_178414",
  instagramUsername: "saultnissan",
};
