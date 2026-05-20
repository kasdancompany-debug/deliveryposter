import type { PublisherMode } from "./index";

/**
 * `PUBLISHER_MODE=mock` uses mock publisher until Meta OAuth is complete.
 * Default: meta (requires connected social account).
 */
export function resolvePublisherMode(): PublisherMode {
  if (process.env.PUBLISHER_MODE === "mock") return "mock";
  return "meta";
}
