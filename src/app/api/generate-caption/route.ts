import { NextResponse } from "next/server";
import {
  generateDeliveryCaptions,
  regenerateDeliveryCaption,
  type DeliveryCaptionInput,
  type GeneratedCaption,
} from "@/lib/captions";
import { generateCaptionBodySchema } from "@/lib/validators/generate-caption";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = generateCaptionBodySchema.safeParse(body);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message =
      first?.message ??
      "Validation failed. Required: customerName, salespersonName, vehicle year, make, and model.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  const input: DeliveryCaptionInput = {
    customerName: parsed.data.customerName.trim(),
    salespersonName: parsed.data.salespersonName.trim(),
    vehicleYear: parsed.data.vehicleYear,
    vehicleMake: parsed.data.vehicleMake.trim(),
    vehicleModel: parsed.data.vehicleModel.trim(),
    trim: parsed.data.trim?.trim() || undefined,
    colour: parsed.data.colour?.trim() || undefined,
    story: parsed.data.story?.trim() || undefined,
    tone: parsed.data.tone,
  };

  try {
    let captions: GeneratedCaption[];

    if (input.tone) {
      // Single-tone regenerate (Caption Studio per-card refresh)
      const caption = await regenerateDeliveryCaption(input, input.tone);
      captions = [caption];
    } else {
      // -------------------------------------------------------------------------
      // TODO: OpenAI integration
      // When ready, replace the mock path below with a direct OpenAI call here
      // (or set CAPTION_PROVIDER=openai in .env and use generateDeliveryCaptions
      // which already switches when CAPTION_PROVIDER=openai + OPENAI_API_KEY are set).
      //
      // Example:
      //   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      //   const completion = await openai.chat.completions.create({ ... });
      //   captions = parseOpenAIResponse(completion);
      // -------------------------------------------------------------------------
      captions = await generateDeliveryCaptions(input);
    }

    return NextResponse.json({ captions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Caption generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
