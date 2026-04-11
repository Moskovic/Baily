"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { propertySchema, tenantSchema, leaseSchema } from "@/lib/schemas";

export type OnboardingStatus = {
  profile: boolean;
  property: boolean;
  tenant: boolean;
  lease: boolean;
  gmail: boolean;
  /** IDs for the lease step selects */
  properties: { id: string; label: string }[];
  tenants: { id: string; full_name: string }[];
  /** Pre-fill profile */
  profileDefaults: { full_name: string; address: string };
};

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const [
    { data: profile },
    { data: properties },
    { data: tenants },
    { count: leaseCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, address, gmail_email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("properties")
      .select("id, label")
      .order("created_at", { ascending: false }),
    supabase
      .from("tenants")
      .select("id, full_name")
      .order("created_at", { ascending: false }),
    supabase.from("leases").select("*", { count: "exact", head: true }),
  ]);

  return {
    profile: Boolean(profile?.full_name),
    property: (properties?.length ?? 0) > 0,
    tenant: (tenants?.length ?? 0) > 0,
    lease: (leaseCount ?? 0) > 0,
    gmail: Boolean(profile?.gmail_email),
    properties: (properties ?? []) as { id: string; label: string }[],
    tenants: (tenants ?? []) as { id: string; full_name: string }[],
    profileDefaults: {
      full_name: profile?.full_name ?? "",
      address: profile?.address ?? "",
    },
  };
}

export async function saveOnboardingProfile(formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const address = formData.get("address") as string;

  if (!full_name || full_name.trim().length === 0) {
    return { error: "Le nom est requis" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: full_name.trim(), address: address?.trim() || null })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/onboarding");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveOnboardingProperty(formData: FormData) {
  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert(parsed.data)
    .select("id, label")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/onboarding");
  revalidatePath("/properties");
  return { ok: true, property: data as { id: string; label: string } };
}

export async function saveOnboardingTenant(formData: FormData) {
  const parsed = tenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .insert({ ...parsed.data, phone: parsed.data.phone || null })
    .select("id, full_name")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/onboarding");
  revalidatePath("/tenants");
  return { ok: true, tenant: data as { id: string; full_name: string } };
}

export async function saveOnboardingLease(formData: FormData) {
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

  revalidatePath("/onboarding");
  revalidatePath("/leases");
  revalidatePath("/dashboard");
  return { ok: true };
}
