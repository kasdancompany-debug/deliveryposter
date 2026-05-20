import { isDemoMode } from "@/lib/supabase/middleware";
import type { PublisherMode } from "./index";

/**
 * Demo → mock publisher. Production → Meta Graph API (requires connected account).
 */
export function resolvePublisherMode(): PublisherMode {
  if (isDemoMode()) return "mock";
  if (process.env.PUBLISHER_MODE === "mock") return "mock";
  return "meta";
}
