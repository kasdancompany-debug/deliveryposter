import { DeliveryWizard } from "@/components/wizard/delivery-wizard";
import { isDemoMode } from "@/lib/supabase/middleware";
import { redirect } from "next/navigation";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isDemoMode()) {
    redirect(`/posts/${id}`);
  }

  return <DeliveryWizard postId={id} />;
}
