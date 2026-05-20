import type { CaptionTone, GeneratedCaption } from "@/lib/captions";

export interface CaptionApiInput {
  customerName: string;
  salespersonName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  trim?: string;
  colour?: string;
  story?: string;
  tone?: CaptionTone;
}

interface CaptionApiResponse {
  captions: GeneratedCaption[];
}

interface CaptionApiError {
  error: string;
}

/**
 * Request captions from the server API (mock today, OpenAI-ready via route).
 */
export async function fetchCaptionsFromApi(
  input: CaptionApiInput
): Promise<GeneratedCaption[]> {
  const res = await fetch("/api/generate-caption", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as CaptionApiResponse & CaptionApiError;

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to generate captions");
  }

  if (!data.captions?.length) {
    throw new Error("No captions returned");
  }

  return data.captions;
}

/** Generate all four caption options. */
export async function fetchAllCaptions(
  input: Omit<CaptionApiInput, "tone">
): Promise<GeneratedCaption[]> {
  return fetchCaptionsFromApi(input);
}

/** Regenerate a single caption by tone. */
export async function fetchRegeneratedCaption(
  input: CaptionApiInput,
  tone: CaptionTone
): Promise<GeneratedCaption> {
  const captions = await fetchCaptionsFromApi({ ...input, tone });
  return captions[0];
}
