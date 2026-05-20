"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  deliveryDetailsSchema,
  type DeliveryDetailsInput,
} from "@/lib/validators/delivery-wizard";
import type { DeliveryDetailsValues } from "@/lib/demo/types";

interface DeliveryDetailsStepProps {
  defaultValues: DeliveryDetailsValues;
  onValid: (data: DeliveryDetailsValues) => void;
  formId: string;
}

export function DeliveryDetailsStep({
  defaultValues,
  onValid,
  formId,
}: DeliveryDetailsStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeliveryDetailsInput>({
    resolver: zodResolver(deliveryDetailsSchema),
    defaultValues: defaultValues as DeliveryDetailsInput,
  });

  const ig = watch("publishInstagram");
  const fb = watch("publishFacebook");
  const consent = watch("customerConsentConfirmed");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Delivery details
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer, vehicle, and publishing preferences.
        </p>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardContent className="pt-6">
          <form
            id={formId}
            onSubmit={handleSubmit((data) =>
              onValid({
                customerName: data.customerName,
                salespersonName: data.salespersonName,
                vehicleYear: data.vehicleYear,
                vehicleMake: data.vehicleMake,
                vehicleModel: data.vehicleModel,
                trim: data.trim ?? "",
                colour: data.colour ?? "",
                stockNumber: data.stockNumber ?? "",
                vinLast6: data.vinLast6 ?? "",
                story: data.story ?? "",
                customerConsentConfirmed: data.customerConsentConfirmed,
                publishInstagram: data.publishInstagram,
                publishFacebook: data.publishFacebook,
              })
            )}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer name" error={errors.customerName?.message}>
                <Input {...register("customerName")} placeholder="Sarah Mitchell" />
              </Field>
              <Field label="Salesperson" error={errors.salespersonName?.message}>
                <Input {...register("salespersonName")} placeholder="James Chen" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Year" error={errors.vehicleYear?.message}>
                <Input
                  type="number"
                  {...register("vehicleYear", { valueAsNumber: true })}
                />
              </Field>
              <Field label="Make" error={errors.vehicleMake?.message}>
                <Input {...register("vehicleMake")} placeholder="Nissan" />
              </Field>
              <Field label="Model" error={errors.vehicleModel?.message}>
                <Input {...register("vehicleModel")} placeholder="Rogue" />
              </Field>
              <Field label="Trim" error={errors.trim?.message}>
                <Input {...register("trim")} placeholder="SV" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Colour" error={errors.colour?.message}>
                <Input {...register("colour")} placeholder="Pearl White" />
              </Field>
              <Field label="Stock #" error={errors.stockNumber?.message}>
                <Input {...register("stockNumber")} placeholder="N240512" />
              </Field>
            </div>

            <Field label="VIN (last 6)" error={errors.vinLast6?.message}>
              <Input
                {...register("vinLast6")}
                placeholder="A1B2C3"
                maxLength={6}
                className="max-w-[10rem] uppercase"
              />
            </Field>

            <Field label="Story / background" error={errors.story?.message}>
              <Textarea
                {...register("story")}
                rows={4}
                placeholder="Handover moment, family surprise, trade-in story…"
                className="resize-none"
              />
            </Field>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Platforms</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-4 py-3 has-checked:border-amber-500/50 has-checked:bg-amber-500/5">
                  <Checkbox
                    checked={ig}
                    onCheckedChange={(c) =>
                      setValue("publishInstagram", c === true)
                    }
                  />
                  <span className="text-sm font-medium">Instagram</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-4 py-3 has-checked:border-amber-500/50 has-checked:bg-amber-500/5">
                  <Checkbox
                    checked={fb}
                    onCheckedChange={(c) =>
                      setValue("publishFacebook", c === true)
                    }
                  />
                  <span className="text-sm font-medium">Facebook</span>
                </label>
              </div>
              {errors.publishInstagram && (
                <p className="text-xs text-destructive">
                  {errors.publishInstagram.message}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <Checkbox
                id="consent"
                checked={consent === true}
                onCheckedChange={(c) =>
                  setValue("customerConsentConfirmed", c === true)
                }
              />
              <div>
                <Label htmlFor="consent" className="font-medium leading-snug">
                  Customer consent confirmed
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Customer agrees to share delivery photos and name on social
                  media.
                </p>
                {errors.customerConsentConfirmed && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.customerConsentConfirmed.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
