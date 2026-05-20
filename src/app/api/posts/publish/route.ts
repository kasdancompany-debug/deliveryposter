import { NextResponse } from "next/server";
import type { DemoDeliveryPost } from "@/lib/demo/types";
import { publishDeliveryPostMeta } from "@/lib/publish-delivery-post.server";
import { isDemoMode } from "@/lib/supabase/middleware";
/**
 * POST /api/posts/publish
 * Publishes a delivery post via Meta Graph API (production).
 */
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(
      { error: "Use client mock publish in demo mode" },
      { status: 400 }
    );
  }

  let body: { post?: DemoDeliveryPost };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const post = body.post;
  if (!post?.id || !post.photos?.length) {
    return NextResponse.json(
      { error: "post with photos is required" },
      { status: 400 }
    );
  }

  if (post.status !== "ready") {
    return NextResponse.json(
      { error: "Post must be marked Ready before publishing" },
      { status: 400 }
    );
  }

  const result = await publishDeliveryPostMeta(post);
  return NextResponse.json(result, {
    status: result.status === "posted" ? 200 : 502,
  });
}
