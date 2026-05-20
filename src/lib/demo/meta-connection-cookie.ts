import { cookies } from "next/headers";
import type { SocialAccountRow } from "@/lib/social/meta-types";
import { DEMO_META_PAGE } from "@/lib/social/meta-types";
import { encryptAccessToken } from "@/lib/social/meta-oauth";

const COOKIE_NAME = "dps_demo_meta_connection";

export interface DemoMetaCookiePayload {
  page_id: string;
  page_name: string;
  instagram_business_account_id: string;
  instagram_username: string;
  token_expires_at: string;
}

export async function readDemoMetaCookie(): Promise<DemoMetaCookiePayload | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoMetaCookiePayload;
  } catch {
    return null;
  }
}

export function demoCookieToRow(payload: DemoMetaCookiePayload): SocialAccountRow {
  const now = new Date().toISOString();
  return {
    id: "demo-meta-connection",
    platform: "meta",
    page_id: payload.page_id,
    page_name: payload.page_name,
    instagram_business_account_id: payload.instagram_business_account_id,
    instagram_username: payload.instagram_username,
    access_token_encrypted: encryptAccessToken("demo_meta_access_token"),
    token_expires_at: payload.token_expires_at,
    created_at: now,
    updated_at: now,
  };
}

export function buildDemoConnectedPayload(): DemoMetaCookiePayload {
  const expires = new Date();
  expires.setDate(expires.getDate() + 60);
  return {
    page_id: DEMO_META_PAGE.id,
    page_name: DEMO_META_PAGE.name,
    instagram_business_account_id: DEMO_META_PAGE.instagramBusinessAccountId!,
    instagram_username: DEMO_META_PAGE.instagramUsername!,
    token_expires_at: expires.toISOString(),
  };
}

export function demoMetaCookieOptions(payload: DemoMetaCookiePayload | null) {
  if (!payload) {
    return { name: COOKIE_NAME, value: "", maxAge: 0, path: "/" };
  }
  return {
    name: COOKIE_NAME,
    value: JSON.stringify(payload),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  };
}
