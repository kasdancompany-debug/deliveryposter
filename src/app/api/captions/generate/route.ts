import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCaptionsForPost } from "@/app/actions/posts";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const postId = body.postId as string;

  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  const result = await generateCaptionsForPost(postId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ captions: result.captions });
}
