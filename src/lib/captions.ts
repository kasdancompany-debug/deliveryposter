import OpenAI from "openai";

/** Tone used for generation / per-card regenerate. */
export type CaptionTone = "warm" | "fun" | "premium" | "short";

/** Input for delivery caption generation. */
export interface DeliveryCaptionInput {
  customerName: string;
  salespersonName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  trim?: string;
  colour?: string;
  story?: string;
  /** Preferred tone when regenerating a single option. */
  tone?: CaptionTone;
}

export type CaptionStyle = CaptionTone;

export interface GeneratedCaption {
  style: CaptionStyle;
  label: string;
  text: string;
}

export const CAPTION_STYLE_LABELS: Record<CaptionStyle, string> = {
  warm: "Warm and simple",
  fun: "Fun and upbeat",
  premium: "Premium / professional",
  short: "Very short and clean",
};

/** Fixed generation order — always four options. */
export const CAPTION_STYLES: CaptionStyle[] = [
  "warm",
  "fun",
  "premium",
  "short",
];

const REQUIRED_TAGS = ["#SaultNissan", "#NewCarDay"] as const;

const OPTIONAL_TAGS = [
  "#NissanCanada",
  "#SaultSteMarie",
  "#DeliveryDay",
  "#CustomerForLife",
] as const;

const DEALERSHIP =
  process.env.NEXT_PUBLIC_DEALERSHIP_NAME ?? "Sault Nissan";
const LOCATION = "Sault Ste. Marie";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function shouldUseOpenAI(): boolean {
  return (
    !!process.env.OPENAI_API_KEY &&
    process.env.CAPTION_PROVIDER === "openai"
  );
}

export function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "friend";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function buildVehicleLine(input: DeliveryCaptionInput): string {
  return [
    input.vehicleYear,
    input.vehicleMake,
    input.vehicleModel,
    input.trim,
    input.colour ? `in ${input.colour}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function storyLine(story?: string): string {
  if (!story?.trim()) return "";
  const s = story.trim();
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

/** 3–6 hashtags, always includes #SaultNissan and #NewCarDay. */
export function buildHashtags(seed = 0): string {
  const extra = OPTIONAL_TAGS.filter((_, i) => (seed + i) % 2 === 0).slice(
    0,
    2
  );
  const tags = [...REQUIRED_TAGS, ...extra].slice(0, 6);
  return tags.join(" ");
}

function appendHashtags(body: string, seed = 0): string {
  const trimmed = body.trimEnd();
  if (trimmed.includes("#SaultNissan") && trimmed.includes("#NewCarDay")) {
    return trimmed;
  }
  return `${trimmed}\n\n${buildHashtags(seed)}`;
}

function buildCaptionBody(
  style: CaptionStyle,
  input: DeliveryCaptionInput
): string {
  const customer = firstName(input.customerName);
  const rep = input.salespersonName.trim() || "our team";
  const vehicle = buildVehicleLine(input);
  const snippet = storyLine(input.story);
  const seed = CAPTION_STYLES.indexOf(style);

  switch (style) {
    case "warm":
      return appendHashtags(
        `Congratulations ${customer} on your new ${vehicle}.

${rep} and the team at ${DEALERSHIP} loved being part of your delivery today. Wishing you safe, happy drives around ${LOCATION}.

${snippet ? `${snippet}\n\n` : ""}Thank you for trusting us with your business.`,
        seed
      );

    case "fun":
      return appendHashtags(
        `${customer} just picked up their ${vehicle} — and the smiles said it all.

${rep} had a great time getting you ready for the road at ${DEALERSHIP}. Welcome to the Nissan family, ${customer}.

${snippet ? `${snippet}\n\n` : ""}See you out there.`,
        seed
      );

    case "premium":
      return appendHashtags(
        `Another exceptional delivery at ${DEALERSHIP}.

We were pleased to hand over the keys on a ${vehicle} to ${customer}, with ${rep} ensuring a seamless experience from start to finish. We appreciate your confidence in our team.

${snippet ? `${snippet}\n\n` : ""}— ${DEALERSHIP}, ${LOCATION}`,
        seed
      );

    case "short":
      return appendHashtags(
        `Keys handed over. ${customer} — enjoy your ${vehicle}. Thank you from ${rep} and ${DEALERSHIP}.`,
        seed
      );
  }
}

/** Mock AI-style delay. */
async function simulateGenerationDelay(): Promise<void> {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
}

/**
 * Generate one caption for a specific tone (used by Regenerate on a card).
 */
export async function regenerateDeliveryCaption(
  input: DeliveryCaptionInput,
  tone: CaptionTone
): Promise<GeneratedCaption> {
  if (shouldUseOpenAI()) {
    const all = await generateOpenAIDeliveryCaptions({ ...input, tone });
    const match = all.find((c) => c.style === tone);
    if (match) return match;
  }

  await simulateGenerationDelay();
  return {
    style: tone,
    label: CAPTION_STYLE_LABELS[tone],
    text: buildCaptionBody(tone, input),
  };
}

/** Mock generator — four dealership-ready captions. */
async function generateMockDeliveryCaptions(
  input: DeliveryCaptionInput
): Promise<GeneratedCaption[]> {
  await simulateGenerationDelay();

  return CAPTION_STYLES.map((style) => ({
    style,
    label: CAPTION_STYLE_LABELS[style],
    text: buildCaptionBody(style, input),
  }));
}

/**
 * OpenAI-backed generator — enable with CAPTION_PROVIDER=openai.
 */
async function generateOpenAIDeliveryCaptions(
  input: DeliveryCaptionInput
): Promise<GeneratedCaption[]> {
  const openai = getOpenAIClient();
  if (!openai) return generateMockDeliveryCaptions(input);

  const vehicle = buildVehicleLine(input);
  const customer = firstName(input.customerName);
  const rep = input.salespersonName.trim();

  const prompt = `Write 4 Instagram/Facebook delivery captions for ${DEALERSHIP} in ${LOCATION}.

Customer first name: ${customer}
Salesperson: ${rep}
Vehicle: ${vehicle}
${input.story?.trim() ? `Story: ${input.story.trim()}` : ""}
${input.tone ? `Focus tone for this request: ${input.tone}` : ""}

Return JSON: { "captions": [{ "style": "warm"|"fun"|"premium"|"short", "text": "..." }, ...] }

Styles:
- warm: warm and simple
- fun: fun and upbeat
- premium: premium/professional
- short: very short and clean

Rules:
- First name only for customer
- Mention salesperson and vehicle in each
- Sound like a real dealership post, not cheesy
- 3-6 hashtags per caption, MUST include #SaultNissan and #NewCarDay
- Light emoji only where natural`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content) as {
      captions?: Array<{ style?: string; text?: string }>;
    };

    const byStyle = new Map(
      (parsed.captions ?? []).map((c) => [c.style, c.text ?? ""])
    );

    return CAPTION_STYLES.map((style) => ({
      style,
      label: CAPTION_STYLE_LABELS[style],
      text: appendHashtags(
        byStyle.get(style) ?? buildCaptionBody(style, input),
        CAPTION_STYLES.indexOf(style)
      ),
    }));
  } catch {
    return generateMockDeliveryCaptions(input);
  }
}

/**
 * Generate four delivery caption options for Caption Studio.
 * Mock by default; OpenAI when CAPTION_PROVIDER=openai.
 */
export async function generateDeliveryCaptions(
  input: DeliveryCaptionInput
): Promise<GeneratedCaption[]> {
  if (shouldUseOpenAI()) {
    return generateOpenAIDeliveryCaptions(input);
  }
  return generateMockDeliveryCaptions(input);
}

/** Plain strings for storage / server actions. */
export async function generateDeliveryCaptionTexts(
  input: DeliveryCaptionInput
): Promise<string[]> {
  const captions = await generateDeliveryCaptions(input);
  return captions.map((c) => c.text);
}

export function getDealershipName(): string {
  return DEALERSHIP;
}
