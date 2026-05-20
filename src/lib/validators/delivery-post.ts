import { z } from "zod";

export const deliveryFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  salespersonName: z.string().min(1, "Salesperson name is required"),
  vehicleYear: z
    .number()
    .int()
    .min(1990, "Enter a valid year")
    .max(new Date().getFullYear() + 2),
  vehicleMake: z.string().min(1, "Make is required"),
  vehicleModel: z.string().min(1, "Model is required"),
  trim: z.string().optional(),
  colour: z.string().optional(),
  story: z.string().max(2000).optional(),
  consentConfirmed: z
    .boolean()
    .refine((v) => v === true, "Customer consent is required before posting"),
  platforms: z.enum(["instagram", "facebook", "both"]),
});

export type DeliveryFormInput = z.infer<typeof deliveryFormSchema>;

export const MAX_PHOTOS = 10;
export const MIN_PHOTOS = 1;
