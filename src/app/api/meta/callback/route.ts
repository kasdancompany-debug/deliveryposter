import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upsertSupabaseMetaAccount } from "@/lib/social/meta-account-service";
import {
  encryptAccessToken,
  exchangeCodeForToken,
  fetchMetaPages,
} from "@/lib/social/meta-oauth";

const STATE_COOKIE = "meta_oauth_state";
const SETTINGS_PATH = "/settings/social";

function settingsRedirect(
  params: Record<string, string>,
  extraCookies?: { name: string; value: string; maxAge?: number }[]
) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.META_REDIRECT_URI?.replace(/\/api\/meta\/callback\/?$/, "") ??
    "http://localhost:3000";
  const url = new URL(SETTINGS_PATH, base);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const response = NextResponse.redirect(url);
  for (const c of extraCookies ?? []) {
    response.cookies.set(c.name, c.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: c.maxAge ?? 0,
    });
  }
  return response;
}

/**
 * GET /api/meta/callback
 * OAuth redirect handler — exchanges code, stores tokens, redirects to settings.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jar = await cookies();
  const savedState = jar.get(STATE_COOKIE)?.value;
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const code = searchParams.get("code");

  const clearState = {
    name: STATE_COOKIE,
    value: "",
    maxAge: 0,
  };

  if (error) {
    return settingsRedirect({ meta_error: error }, [clearState]);
  }

  if (state && savedState && state !== savedState) {
    return settingsRedirect({ meta_error: "invalid_state" }, [clearState]);
  }

  if (!code) {
    return settingsRedirect({ meta_error: "missing_code" }, [clearState]);
  }

  const tokenResult = await exchangeCodeForToken(code);
  if (!tokenResult) {
    return settingsRedirect(
      { meta_error: "token_exchange_failed" },
      [clearState]
    );
  }

  const pages = await fetchMetaPages(tokenResult.accessToken);
  const page = pages[0];
  if (!page) {
    return settingsRedirect({ meta_error: "no_pages" }, [clearState]);
  }

  const expiresAt = new Date(
    Date.now() + tokenResult.expiresIn * 1000
  ).toISOString();

  await upsertSupabaseMetaAccount({
    page_id: page.id,
    page_name: page.name,
    instagram_business_account_id:
      page.instagram_business_account?.id ?? null,
    instagram_username: page.instagram_business_account?.username ?? null,
    access_token_encrypted: encryptAccessToken(page.access_token),
    token_expires_at: expiresAt,
  });

  return settingsRedirect({ meta_connected: "1" }, [clearState]);
}
