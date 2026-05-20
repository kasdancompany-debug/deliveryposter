"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deliveryFormSchema,
  type DeliveryFormInput,
} from "@/lib/validators/delivery-post";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DeliveryFormProps {
  defaultValues?: Partial<DeliveryFormInput>;
  onSubmit: (data: DeliveryFormInput) => void;
  disabled?: boolean;
  id?: string;
}

export function DeliveryForm({
  defaultValues,
  onSubmit,
  disabled,
  id = "delivery-form",
}: DeliveryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeliveryFormInput>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      customerName: "",
      salespersonName: "",
      vehicleYear: new Date().getFullYear(),
      vehicleMake: "",
      vehicleModel: "",
      trim: "",
      colour: "",
      story: "",
      consentConfirmed: false,
      platforms: "both",
      ...defaultValues,
    },
  });

  const platforms = watch("platforms");
  const consent = watch("consentConfirmed");

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle className="text-lg">Delivery details</CardTitle>
      </CardHeader>
      <CardContent>
        <form id={id} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name" error={errors.customerName?.message}>
              <Input
                {...register("customerName")}
                placeholder="e.g. Sarah Mitchell"
                disabled={disabled}
              />
            </Field>
            <Field label="Salesperson" error={errors.salespersonName?.message}>
              <Input
                {...register("salespersonName")}
                placeholder="e.g. James Chen"
                disabled={disabled}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Year" error={errors.vehicleYear?.message}>
              <Input
                type="number"
                {...register("vehicleYear", { valueAsNumber: true })}
                disabled={disabled}
              />
            </Field>
            <Field label="Make" error={errors.vehicleMake?.message}>
              <Input
                {...register("vehicleMake")}
                placeholder="e.g. Nissan"
                disabled={disabled}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Model" error={errors.vehicleModel?.message}>
              <Input
                {...register("vehicleModel")}
                placeholder="e.g. Qashqai"
                disabled={disabled}
              />
            </Field>
            <Field label="Trim" error={errors.trim?.message}>
              <Input
                {...register("trim")}
                placeholder="e.g. Tekna"
                disabled={disabled}
              />
            </Field>
          </div>

          <Field label="Colour" error={errors.colour?.message}>
            <Input
              {...register("colour")}
              placeholder="e.g. Pearl Black"
              disabled={disabled}
            />
          </Field>

          <Field label="Story (optional)" error={errors.story?.message}>
            <Textarea
              {...register("story")}
              rows={4}
              placeholder="A few words about the handover moment…"
              disabled={disabled}
              className="resize-none"
            />
          </Field>

          <Field label="Platforms" error={errors.platforms?.message}>
            <Select
              value={platforms}
              onValueChange={(v) =>
                setValue("platforms", v as DeliveryFormInput["platforms"])
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram only</SelectItem>
                <SelectItem value="facebook">Facebook only</SelectItem>
                <SelectItem value="both">Instagram & Facebook</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <Checkbox
              id="consent"
              checked={consent === true}
              onCheckedChange={(checked) =>
                setValue("consentConfirmed", checked === true)
              }
              disabled={disabled}
            />
            <div className="space-y-1">
              <Label htmlFor="consent" className="font-medium leading-snug">
                Customer consent confirmed
              </Label>
              <p className="text-xs text-muted-foreground">
                I confirm the customer has agreed to share their delivery photos
                and name on social media.
              </p>
              {errors.consentConfirmed && (
                <p className="text-xs text-destructive">
                  {errors.consentConfirmed.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
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
