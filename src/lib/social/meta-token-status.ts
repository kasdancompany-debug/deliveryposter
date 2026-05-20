import type { MetaTokenStatus } from "./meta-types";

const EXPIRING_SOON_MS = 7 * 24 * 60 * 60 * 1000;

export function resolveTokenStatus(
  accessTokenPresent: boolean,
  tokenExpiresAt: string | null | undefined
): MetaTokenStatus {
  if (!accessTokenPresent) return "missing";
  if (!tokenExpiresAt) return "valid";

  const expires = new Date(tokenExpiresAt).getTime();
  if (Number.isNaN(expires)) return "valid";

  const now = Date.now();
  if (expires <= now) return "expired";
  if (expires - now <= EXPIRING_SOON_MS) return "expiring_soon";
  return "valid";
}

export function tokenStatusLabel(status: MetaTokenStatus): string {
  switch (status) {
    case "valid":
      return "Valid";
    case "expiring_soon":
      return "Expiring soon";
    case "expired":
      return "Expired";
    case "missing":
      return "Not connected";
    default:
      return "Unknown";
  }
}
