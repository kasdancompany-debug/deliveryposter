import { NextResponse } from "next/server";
import { getMetaPages } from "@/lib/social/meta-account-service";

/**
 * GET /api/meta/pages
 * Returns connected account summary and available Facebook Pages (post-OAuth).
 */
export async function GET() {
  try {
    const { connection, pages } = await getMetaPages();

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
