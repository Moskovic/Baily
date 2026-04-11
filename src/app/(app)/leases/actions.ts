"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { leaseSchema } from "@/lib/schemas";

export async function createLease(formData: FormData) {
  const parsed = leaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leases").insert({
    ...parsed.data,
    end_date: parsed.data.end_date || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/leases");
  return { ok: true };
}

export async function updateLease(id: string, formData: FormData) {
  const parsed = leaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("leases")
    .update({ ...parsed.data, end_date: parsed.data.end_date || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/leases");
  return { ok: true };
}

export async function deleteLease(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leases").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/leases");
  return { ok: true };
}
