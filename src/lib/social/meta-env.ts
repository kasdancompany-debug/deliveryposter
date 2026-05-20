export interface MetaEnvConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export function getMetaEnv(): MetaEnvConfig | null {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    return null;
  }

  return { appId, appSecret, redirectUri };
}

export function isMetaOAuthConfigured(): boolean {
  return getMetaEnv() !== null;
}

/** Scopes for Page + Instagram Business publishing (wire in real OAuth). */
export const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");
