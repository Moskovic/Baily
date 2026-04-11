"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tenantSchema } from "@/lib/schemas";

export async function createTenant(formData: FormData) {
  const parsed = tenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tenants").insert({
    ...parsed.data,
    phone: parsed.data.phone || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/tenants");
  return { ok: true };
}

export async function updateTenant(id: string, formData: FormData) {
  const parsed = tenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ ...parsed.data, phone: parsed.data.phone || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tenants");
  return { ok: true };
}

export async function deleteTenant(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tenants").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tenants");
  return { ok: true };
}
