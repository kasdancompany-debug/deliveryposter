import { z } from "zod";

export const generateCaptionBodySchema = z.object({
  customerName: z.string().min(1, "customerName is required"),
  salespersonName: z.string().min(1, "salespersonName is required"),
  vehicleYear: z.coerce.number().int().min(1990).max(2100),
  vehicleMake: z.string().min(1, "vehicle make is required"),
  vehicleModel: z.string().min(1, "vehicle model is required"),
  trim: z.string().optional(),
  colour: z.string().optional(),
  story: z.string().optional(),
  tone: z.enum(["warm", "fun", "premium", "short"]).optional(),
});

export type GenerateCaptionBody = z.infer<typeof generateCaptionBodySchema>;
