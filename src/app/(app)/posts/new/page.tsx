import { DeliveryWizard } from "@/components/wizard/delivery-wizard";
import { isDemoMode } from "@/lib/supabase/middleware";

export default function NewPostPage() {
  if (!isDemoMode()) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm">
        Connect Supabase and disable demo mode to use server-backed posts, or set{" "}
        <code className="text-amber-200">NEXT_PUBLIC_DEMO_MODE=true</code>.
      </div>
    );
  }

  return <DeliveryWizard />;
}
