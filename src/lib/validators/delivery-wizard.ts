import { z } from "zod";

export const MAX_PHOTOS = 10;
export const MIN_PHOTOS = 1;

export const deliveryDetailsSchema = z
  .object({
    customerName: z.string().min(1, "Customer name is required"),
    salespersonName: z.string().min(1, "Salesperson name is required"),
    vehicleYear: z
      .number()
      .int()
      .min(1990)
      .max(new Date().getFullYear() + 2),
    vehicleMake: z.string().min(1, "Make is required"),
    vehicleModel: z.string().min(1, "Model is required"),
    trim: z.string().optional(),
    colour: z.string().optional(),
    stockNumber: z.string().optional(),
    vinLast6: z
      .string()
      .optional()
      .refine(
        (v) => !v || /^[A-Za-z0-9]{6}$/.test(v),
        "VIN last 6 must be 6 characters"
      ),
    story: z.string().max(2000).optional(),
    customerConsentConfirmed: z
      .boolean()
      .refine((v) => v === true, "Customer consent is required"),
    publishInstagram: z.boolean(),
    publishFacebook: z.boolean(),
  })
  .refine((d) => d.publishInstagram || d.publishFacebook, {
    message: "Select at least one platform",
    path: ["publishInstagram"],
  });

export type DeliveryDetailsInput = z.infer<typeof deliveryDetailsSchema>;
