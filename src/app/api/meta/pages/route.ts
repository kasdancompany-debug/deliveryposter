import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/middleware";
import {
  getMetaPages,
  getMockPageCatalog,
} from "@/lib/social/meta-account-service";

/**
 * GET /api/meta/pages
 * Returns connected account summary and available Facebook Pages (post-OAuth).
 */
export async function GET() {
  try {
    const { connection, pages } = await getMetaPages();

    // TODO: When OAuth completes but page not yet selected, return fetchMetaPages()
    // using stored user token and let client POST selected page_id.

    if (isDemoMode() && !connection.connected) {
      return NextResponse.json({
        connection,
        pages: [],
        availablePages: getMockPageCatalog(),
      });
    }

    return NextResponse.json({
      connection,
      pages,
      availablePages: connection.connected ? pages : [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Meta pages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
