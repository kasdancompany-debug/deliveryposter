import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/middleware";
import { getDemoCookieClearOptions } from "@/lib/social/meta-account-service";
import { disconnectMetaAccount } from "@/lib/social/meta-account-service";

/**
 * POST /api/meta/disconnect
 * Revokes local connection and clears stored tokens.
 */
export async function POST() {
  try {
    if (isDemoMode()) {
      const opts = getDemoCookieClearOptions();
      const response = NextResponse.json({ success: true });
      response.cookies.set(opts.name, opts.value, {
        httpOnly: opts.httpOnly,
        secure: opts.secure,
        sameSite: opts.sameSite,
        path: opts.path,
        maxAge: opts.maxAge,
      });
      return response;
    }

    // TODO: Call Meta Graph API to revoke permissions before delete
    await disconnectMetaAccount();

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Disconnect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
