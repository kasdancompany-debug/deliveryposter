import { PostReviewView } from "@/components/post-review/post-review-view";
import { getWizardPost, listPostLogs } from "@/app/actions/wizard";
import { notFound } from "next/navigation";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getWizardPost(id);
  if ("error" in post) notFound();
  const logs = await listPostLogs(id);

  return <PostReviewView initialPost={post} initialLogs={logs} />;
}
