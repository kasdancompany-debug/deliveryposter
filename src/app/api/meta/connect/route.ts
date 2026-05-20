import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildMetaOAuthUrl } from "@/lib/social/meta-oauth";
import { isMetaOAuthConfigured } from "@/lib/social/meta-env";

const STATE_COOKIE = "meta_oauth_state";

/**
 * GET /api/meta/connect
 * Starts Meta OAuth — redirects to Facebook login dialog.
 */
export async function GET() {
  const state = crypto.randomUUID();

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
    return NextResponse.json(
      { error: "Could not build OAuth URL" },
      { status: 503 }
    );
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
