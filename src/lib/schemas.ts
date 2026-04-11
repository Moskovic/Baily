import { z } from "zod";

export const PROPERTY_TYPES = ["apartment", "garage"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Appartement",
  garage: "Garage",
};

export const propertySchema = z.object({
  label: z.string().min(1, "Libellé requis").max(80),
  type: z.enum(PROPERTY_TYPES),
  address: z.string().min(1, "Adresse requise").max(200),
  city: z.string().min(1, "Ville requise").max(80),
  postal_code: z.string().min(4, "Code postal requis").max(10),
});
export type PropertyInput = z.infer<typeof propertySchema>;

export const tenantSchema = z.object({
  full_name: z.string().min(1, "Nom requis").max(120),
  email: z.string().email("Email invalide"),
  phone: z.string().max(30).optional().or(z.literal("")),
});
export type TenantInput = z.infer<typeof tenantSchema>;

export const leaseSchema = z.object({
  property_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  rent_amount: z.coerce.number().min(0),
  charges_amount: z.coerce.number().min(0).default(0),
  payment_day: z.coerce.number().int().min(1).max(31).default(1),
  start_date: z.string().min(1),
  end_date: z.string().optional().or(z.literal("")),
});
export type LeaseInput = z.infer<typeof leaseSchema>;

export const receiptSchema = z.object({
  lease_id: z.string().uuid(),
  period_month: z.coerce.number().int().min(1).max(12),
  period_year: z.coerce.number().int().min(2000).max(2100),
  rent_amount: z.coerce.number().min(0),
  charges_amount: z.coerce.number().min(0).default(0),
  payment_date: z.string().min(1),
});
export type ReceiptInput = z.infer<typeof receiptSchema>;

export const receiptEditSchema = z.object({
  rent_amount: z.coerce.number().min(0),
  charges_amount: z.coerce.number().min(0).default(0),
  payment_date: z.string().min(1),
});
export type ReceiptEditInput = z.infer<typeof receiptEditSchema>;
