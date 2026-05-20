import { NextResponse } from "next/server";
import { disconnectMetaAccount } from "@/lib/social/meta-account-service";

/**
 * POST /api/meta/disconnect
 * Revokes local connection and clears stored tokens.
 */
export async function POST() {
  try {
    await disconnectMetaAccount();
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Disconnect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
