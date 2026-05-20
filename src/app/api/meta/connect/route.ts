import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/supabase/middleware";
import { buildMetaOAuthUrl } from "@/lib/social/meta-oauth";
import { isMetaOAuthConfigured } from "@/lib/social/meta-env";

const STATE_COOKIE = "meta_oauth_state";

/**
 * GET /api/meta/connect
 * Starts Meta OAuth — redirects to Facebook login dialog.
 */
export async function GET() {
  const state = crypto.randomUUID();
  const jar = await cookies();

  if (isDemoMode()) {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.META_REDIRECT_URI?.replace(/\/api\/meta\/callback\/?$/, "") ??
      "http://localhost:3000";
    const url = new URL("/api/meta/callback", base);
    url.searchParams.set("demo", "1");
    url.searchParams.set("state", state);
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return response;
  }

  if (!isMetaOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Meta OAuth is not configured. Set META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI.",
      },
      { status: 503 }
    );
  }

  const authUrl = buildMetaOAuthUrl(state);
  if (!authUrl) {
    return NextResponse.json({ error: "Could not build OAuth URL" }, { status: 503 });
  }

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
