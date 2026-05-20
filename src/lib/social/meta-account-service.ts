import { isDemoMode } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";
import {
  buildDemoConnectedPayload,
  demoCookieToRow,
  demoMetaCookieOptions,
  readDemoMetaCookie,
  type DemoMetaCookiePayload,
} from "@/lib/demo/meta-connection-cookie";
import { resolveTokenStatus } from "./meta-token-status";
import type {
  MetaConnectionView,
  MetaPageOption,
  SocialAccountRow,
} from "./meta-types";
import { DEMO_META_PAGE } from "./meta-types";
import { decryptAccessToken } from "./meta-oauth";

export interface MetaPublishCredentials {
  pageId: string;
  pageAccessToken: string;
  instagramBusinessAccountId: string | null;
}

function rowToView(row: SocialAccountRow | null): MetaConnectionView {
  if (!row?.page_id || !row.access_token_encrypted) {
    return {
      connected: false,
      facebookPageConnected: false,
      instagramBusinessConnected: false,
      pageName: null,
      instagramUsername: null,
      tokenStatus: "missing",
      pageId: null,
      instagramBusinessAccountId: null,
      tokenExpiresAt: null,
    };
  }

  const tokenStatus = resolveTokenStatus(
    !!row.access_token_encrypted,
    row.token_expires_at
  );

  return {
    connected: true,
    facebookPageConnected: !!row.page_id,
    instagramBusinessConnected: !!row.instagram_business_account_id,
    pageName: row.page_name,
    instagramUsername: row.instagram_username,
    tokenStatus,
    pageId: row.page_id,
    instagramBusinessAccountId: row.instagram_business_account_id,
    tokenExpiresAt: row.token_expires_at,
  };
}

async function getSupabaseMetaRow(): Promise<SocialAccountRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_accounts")
    .select(
      "id, platform, page_id, page_name, instagram_business_account_id, instagram_username, access_token_encrypted, token_expires_at, created_at, updated_at"
    )
    .eq("platform", "meta")
    .maybeSingle();

  if (error || !data) return null;
  return data as SocialAccountRow;
}

export async function getMetaConnection(): Promise<MetaConnectionView> {
  if (isDemoMode()) {
    const cookie = await readDemoMetaCookie();
    if (!cookie) return rowToView(null);
    return rowToView(demoCookieToRow(cookie));
  }

  const row = await getSupabaseMetaRow();
  return rowToView(row);
}

export async function getMetaPages(): Promise<{
  connection: MetaConnectionView;
  pages: MetaPageOption[];
}> {
  const connection = await getMetaConnection();

  if (!connection.connected) {
    return { connection, pages: [] };
  }

  return {
    connection,
    pages: [
      {
        id: connection.pageId!,
        name: connection.pageName ?? "Connected Page",
        instagramBusinessAccountId: connection.instagramBusinessAccountId,
        instagramUsername: connection.instagramUsername,
      },
    ],
  };
}

/** Demo: persist mock connection in httpOnly cookie. */
export async function saveDemoMetaConnection(): Promise<DemoMetaCookiePayload> {
  return buildDemoConnectedPayload();
}

export function getDemoCookieSetOptions(payload: DemoMetaCookiePayload) {
  return demoMetaCookieOptions(payload);
}

export function getDemoCookieClearOptions() {
  return demoMetaCookieOptions(null);
}

/**
 * Persist Meta connection to Supabase after OAuth + page selection.
 * TODO: Call from callback after exchangeCodeForToken + fetchMetaPages + user picks page.
 */
export async function upsertSupabaseMetaAccount(
  _row: Omit<
    SocialAccountRow,
    "id" | "platform" | "created_at" | "updated_at"
  >
): Promise<void> {
  // const supabase = await createClient();
  // await supabase.from("social_accounts").upsert({ platform: "meta", ... });
}

/** Remove Meta connection. */
export async function disconnectMetaAccount(): Promise<void> {
  if (isDemoMode()) return;

  const supabase = await createClient();
  // TODO: Revoke token via DELETE graph.facebook.com/{user-id}/permissions
  await supabase.from("social_accounts").delete().eq("platform", "meta");
}

export function getMockPageCatalog(): MetaPageOption[] {
  return [DEMO_META_PAGE];
}

async function getMetaRowForPublish(): Promise<SocialAccountRow | null> {
  if (isDemoMode()) {
    const cookie = await readDemoMetaCookie();
    return cookie ? demoCookieToRow(cookie) : null;
  }
  return getSupabaseMetaRow();
}

/** Page + IG credentials for Graph API publish (server-only). */
export async function getMetaPublishCredentials(): Promise<MetaPublishCredentials | null> {
  const row = await getMetaRowForPublish();
  if (!row?.page_id || !row.access_token_encrypted) return null;

  return {
    pageId: row.page_id,
    pageAccessToken: decryptAccessToken(row.access_token_encrypted),
    instagramBusinessAccountId: row.instagram_business_account_id,
  };
}
