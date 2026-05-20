/**
 * Meta Graph API publishing — Facebook Page photos & Instagram Content Publishing.
 * @see https://developers.facebook.com/docs/graph-api/reference/page/photos
 * @see https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface PublishToFacebookPageParams {
  pageId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
}

export interface PublishToInstagramParams {
  instagramBusinessAccountId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}

export interface MetaPlatformPublishResult {
  success: boolean;
  externalPostId?: string;
  errorMessage?: string;
  rawResponse?: Record<string, unknown>;
}

interface GraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

function graphErrorMessage(body: GraphErrorBody, fallback: string): string {
  const err = body.error;
  if (!err?.message) return fallback;
  const parts = [err.message];
  if (err.code) parts.push(`(code ${err.code})`);
  return parts.join(" ");
}

async function parseGraphResponse(
  res: Response,
  fallbackError: string
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; errorMessage: string; raw: Record<string, unknown> }> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & GraphErrorBody;

  if (!res.ok || data.error) {
    return {
      ok: false,
      errorMessage: graphErrorMessage(data, fallbackError),
      raw: data as Record<string, unknown>,
    };
  }

  return { ok: true, data: data as Record<string, unknown> };
}

/**
 * POST /{page-id}/photos — publish a photo by public URL with caption.
 */
export async function publishToFacebookPage(
  params: PublishToFacebookPageParams
): Promise<MetaPlatformPublishResult> {
  const { pageId, pageAccessToken, imageUrl, caption } = params;

  const url = new URL(`${GRAPH_BASE}/${pageId}/photos`);
  url.searchParams.set("access_token", pageAccessToken);

  const body = new URLSearchParams({
    url: imageUrl,
    message: caption,
  });

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const parsed = await parseGraphResponse(
      res,
      "Facebook Page publish failed"
    );

    if (!parsed.ok) {
      return {
        success: false,
        errorMessage: parsed.errorMessage,
        rawResponse: parsed.raw,
      };
    }

    const postId =
      typeof parsed.data.post_id === "string"
        ? parsed.data.post_id
        : typeof parsed.data.id === "string"
          ? parsed.data.id
          : undefined;

    return {
      success: true,
      externalPostId: postId,
      rawResponse: parsed.data,
    };
  } catch (e) {
    return {
      success: false,
      errorMessage:
        e instanceof Error ? e.message : "Facebook publish request failed",
    };
  }
}

/**
 * Instagram Content Publishing — create container, then publish.
 * Step 1: POST /{ig-user-id}/media
 * Step 2: POST /{ig-user-id}/media_publish
 */
export async function publishToInstagram(
  params: PublishToInstagramParams
): Promise<MetaPlatformPublishResult> {
  const { instagramBusinessAccountId, accessToken, imageUrl, caption } =
    params;

  try {
    const createUrl = new URL(
      `${GRAPH_BASE}/${instagramBusinessAccountId}/media`
    );
    createUrl.searchParams.set("access_token", accessToken);

    const createBody = new URLSearchParams({
      image_url: imageUrl,
      caption,
    });

    const createRes = await fetch(createUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createBody.toString(),
    });

    const created = await parseGraphResponse(
      createRes,
      "Instagram media container creation failed"
    );

    if (!created.ok) {
      return {
        success: false,
        errorMessage: created.errorMessage,
        rawResponse: created.raw,
      };
    }

    const creationId = created.data.id;
    if (typeof creationId !== "string") {
      return {
        success: false,
        errorMessage: "Instagram did not return a media container id",
        rawResponse: created.data,
      };
    }

    const publishUrl = new URL(
      `${GRAPH_BASE}/${instagramBusinessAccountId}/media_publish`
    );
    publishUrl.searchParams.set("access_token", accessToken);

    const publishBody = new URLSearchParams({
      creation_id: creationId,
    });

    const publishRes = await fetch(publishUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishBody.toString(),
    });

    const published = await parseGraphResponse(
      publishRes,
      "Instagram media publish failed"
    );

    if (!published.ok) {
      return {
        success: false,
        errorMessage: published.errorMessage,
        rawResponse: published.raw,
      };
    }

    const externalPostId =
      typeof published.data.id === "string" ? published.data.id : creationId;

    return {
      success: true,
      externalPostId,
      rawResponse: {
        container: created.data,
        publish: published.data,
      },
    };
  } catch (e) {
    return {
      success: false,
      errorMessage:
        e instanceof Error ? e.message : "Instagram publish request failed",
    };
  }
}
