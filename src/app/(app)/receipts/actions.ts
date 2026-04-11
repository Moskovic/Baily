"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { receiptEditSchema, receiptSchema } from "@/lib/schemas";

export async function createReceipt(formData: FormData) {
  const parsed = receiptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("receipts").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/receipts");
  return { ok: true };
}

export async function deleteReceipt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("receipts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/receipts");
  return { ok: true };
}

export async function updateReceipt(id: string, formData: FormData) {
  const parsed = receiptEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const supabase = await createClient();
  // Editing a sent receipt resets it to draft so it can be re-sent.
  const { error } = await supabase
    .from("receipts")
    .update({ ...parsed.data, status: "draft", sent_at: null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/receipts");
  revalidatePath(`/receipts/${id}`);
  return { ok: true };
}

export async function markReceiptSent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("receipts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/receipts");
  return { ok: true };
}
