import { getMetaEnv, META_OAUTH_SCOPES } from "./meta-env";

/**
 * Build Meta OAuth authorization URL.
 * TODO: Confirm Graph API version and redirect whitelist in Meta Developer App.
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 */
export function buildMetaOAuthUrl(state: string): string | null {
  const env = getMetaEnv();
  if (!env) return null;

  const params = new URLSearchParams({
    client_id: env.appId,
    redirect_uri: env.redirectUri,
    state,
    scope: META_OAUTH_SCOPES,
    response_type: "code",
  });

  // TODO: Pin graph version (e.g. v21.0) when implementing production OAuth
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for a user access token.
 * TODO: POST https://graph.facebook.com/v21.0/oauth/access_token
 */
export async function exchangeCodeForToken(
  _code: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  // const env = getMetaEnv();
  // const res = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?...`);
  return null;
}

/**
 * Fetch Facebook Pages for the user token.
 * TODO: GET /me/accounts?fields=id,name,access_token,instagram_business_account{username,id}
 */
export async function fetchMetaPages(
  _userAccessToken: string
): Promise<
  Array<{
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: { id: string; username?: string };
  }>
> {
  return [];
}

/**
 * Encrypt token before DB insert.
 * TODO: Use KMS or libsodium with SOCIAL_TOKEN_ENCRYPTION_KEY
 */
export function encryptAccessToken(plain: string): string {
  return `enc:${Buffer.from(plain, "utf8").toString("base64url")}`;
}

export function decryptAccessToken(stored: string): string {
  if (stored.startsWith("enc:")) {
    return Buffer.from(stored.slice(4), "base64url").toString("utf8");
  }
  return stored;
}
