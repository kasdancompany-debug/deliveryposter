import { DeliveryWizard } from "@/components/wizard/delivery-wizard";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeliveryWizard postId={id} />;
}
