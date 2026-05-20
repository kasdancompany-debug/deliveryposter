import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/supabase/middleware";

export default function Home() {
  if (isDemoMode()) {
    redirect("/dashboard");
  }
  redirect("/login");
}
