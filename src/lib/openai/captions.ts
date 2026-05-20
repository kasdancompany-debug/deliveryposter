import OpenAI from "openai";
import type { DeliveryFormValues } from "@/types/database";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export interface CaptionContext {
  customerName: string;
  salespersonName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  trim?: string;
  colour?: string;
  story?: string;
  dealershipName?: string;
  platforms: string;
}

export function buildCaptionContext(
  form: DeliveryFormValues,
  dealershipName?: string
): CaptionContext {
  return {
    customerName: form.customerName,
    salespersonName: form.salespersonName,
    vehicleYear: form.vehicleYear,
    vehicleMake: form.vehicleMake,
    vehicleModel: form.vehicleModel,
    trim: form.trim,
    colour: form.colour,
    story: form.story,
    dealershipName: dealershipName ?? process.env.NEXT_PUBLIC_DEALERSHIP_NAME,
    platforms: form.platforms,
  };
}

export async function generateCaptionOptions(
  context: CaptionContext
): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    return getFallbackCaptions(context);
  }

  const vehicle = [
    context.vehicleYear,
    context.vehicleMake,
    context.vehicleModel,
    context.trim,
    context.colour ? `in ${context.colour}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const prompt = `You write social media captions for a premium car dealership delivery celebration post.

Dealership: ${context.dealershipName ?? "the dealership"}
Customer: ${context.customerName}
Salesperson: ${context.salespersonName}
Vehicle: ${vehicle}
${context.story ? `Story from the team: ${context.story}` : ""}
Platforms: ${context.platforms}

Write exactly 3 distinct caption options. Each should:
- Feel warm, premium, and celebratory (not salesy)
- Be 2-4 short paragraphs or lines with appropriate emojis (sparingly)
- Include 3-5 relevant hashtags at the end
- Mention the customer and vehicle naturally
- Stay under 2200 characters

Return ONLY a JSON array of 3 strings, no markdown.`;

  const openai = getOpenAIClient();
  if (!openai) return getFallbackCaptions(context);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return getFallbackCaptions(context);

    const parsed = JSON.parse(content) as
      | { captions?: string[] }
      | string[];

    const captions = Array.isArray(parsed)
      ? parsed
      : parsed.captions ?? Object.values(parsed).filter((v) => typeof v === "string");

    if (captions.length >= 3) {
      return captions.slice(0, 3).map((c) => String(c).trim());
    }
    return getFallbackCaptions(context);
  } catch {
    return getFallbackCaptions(context);
  }
}

function getFallbackCaptions(context: CaptionContext): string[] {
  const vehicle = `${context.vehicleYear} ${context.vehicleMake} ${context.vehicleModel}`;
  const dealer = context.dealershipName ?? "our showroom";

  return [
    `✨ Keys handed over! Congratulations ${context.customerName} on your stunning new ${vehicle}!

Thank you for trusting ${dealer} — we loved being part of your journey. ${context.salespersonName} and the whole team wish you many happy miles ahead.

#NewCarDay #DeliveryDay #${context.vehicleMake} #Congratulations`,

    `Another dream drive begins 🚗

${context.customerName}, your ${vehicle} is ready for the road. From everyone at ${dealer}, thank you for choosing us.

#CustomerDelivery #${context.vehicleModel.replace(/\s/g, "")} #PremiumExperience`,

    `Celebrating delivery day with ${context.customerName}! 

Your new ${vehicle} looks incredible. Here's to new adventures — we'll see you on the road.

#DeliveryCelebration #${context.vehicleMake}Family #NewBeginnings`,
  ];
}
