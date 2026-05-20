import { NextResponse } from "next/server";
import { publishPost } from "@/app/actions/posts";

/**
 * POST /api/posts/publish
 * Body: { postId: string }
 */
export async function POST(request: Request) {
  let body: { postId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const postId = body.postId;
  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const result = await publishPost(postId);

  if ("error" in result) {
    return NextResponse.json(
      {
        status: "failed" as const,
        publishedAt: null,
        message: result.error,
        error: result.error,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    status: "posted" as const,
    publishedAt: new Date().toISOString(),
    message: "Published successfully",
  });
}
