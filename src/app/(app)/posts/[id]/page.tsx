import { PostReviewView } from "@/components/post-review/post-review-view";
import { DeliveryWizard } from "@/components/wizard/delivery-wizard";
import { isDemoMode } from "@/lib/supabase/middleware";
import { notFound } from "next/navigation";
import { getPost } from "@/app/actions/posts";
import { PostWorkflow } from "@/components/post-workflow";
import { createClient } from "@/lib/supabase/server";
import type { DeliveryPostWithPhotos } from "@/types/database";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isDemoMode()) {
    return <PostReviewView postId={id} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const raw = await getPost(id);
  if (!raw) notFound();

  const post: DeliveryPostWithPhotos = {
    ...raw,
    caption_options: (raw.caption_options as string[]) ?? [],
    delivery_post_photos: raw.delivery_post_photos ?? [],
  };

  return <PostWorkflow mode="edit" post={post} userId={user.id} />;
}
