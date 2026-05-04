"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BatchItem = {
  leaseId: string;
  propertyId: string;
  propertyLabel: string;
  tenantName: string;
  rentAmount: number;
  chargesAmount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentDay: number;
  fromPreviousReceipt: boolean;
};

/**
 * Returns active leases that don't yet have a receipt for the given month/year.
 * For each, suggests rent/charges/date based on the most recent receipt (or
 * lease defaults if none).
 */
export async function getBatchGenerationData(
  month: number,
  year: number
): Promise<{ items: BatchItem[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const { data: leases, error: leasesErr } = await supabase
    .from("leases")
    .select(
      "id, property_id, rent_amount, charges_amount, payment_day, start_date, end_date, properties:property_id (label), tenants:tenant_id (full_name)"
    )
    .order("created_at", { ascending: true });

  if (leasesErr) return { error: leasesErr.message };

  type Lease = {
    id: string;
    property_id: string;
    rent_amount: number;
    charges_amount: number;
    payment_day: number;
    start_date: string;
    end_date: string | null;
    properties: { label: string } | { label: string }[] | null;
    tenants: { full_name: string } | { full_name: string }[] | null;
  };

  const flat = <T,>(v: T | T[] | null | undefined): T | null => {
    if (!v) return null;
    return Array.isArray(v) ? v[0] ?? null : v;
  };

  const activeLeases = ((leases ?? []) as Lease[]).filter((l) => {
    const start = new Date(l.start_date);
    if (start > monthEnd) return false;
    if (l.end_date && new Date(l.end_date) < monthStart) return false;
    return true;
  });

  if (activeLeases.length === 0) return { items: [] };

  // Get all existing receipts for these leases up to this month — used both
  // to skip leases already invoiced and to fetch the latest values.
  const leaseIds = activeLeases.map((l) => l.id);
  const { data: receipts, error: receiptsErr } = await supabase
    .from("receipts")
    .select("lease_id, period_year, period_month, rent_amount, charges_amount")
    .in("lease_id", leaseIds)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  if (receiptsErr) return { error: receiptsErr.message };

  const alreadyInvoiced = new Set<string>();
  const latestByLease = new Map<string, { rent: number; charges: number }>();

  for (const r of receipts ?? []) {
    const lid = r.lease_id as string;
    if (r.period_year === year && r.period_month === month) {
      alreadyInvoiced.add(lid);
    }
    if (!latestByLease.has(lid)) {
      latestByLease.set(lid, {
        rent: Number(r.rent_amount),
        charges: Number(r.charges_amount),
      });
    }
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  const items: BatchItem[] = activeLeases
    .filter((l) => !alreadyInvoiced.has(l.id))
    .map((l) => {
      const property = flat(l.properties);
      const tenant = flat(l.tenants);
      const latest = latestByLease.get(l.id);
      const dueDay = Math.min(l.payment_day, daysInMonth);
      const paymentDate = new Date(year, month - 1, dueDay)
        .toISOString()
        .slice(0, 10);
      return {
        leaseId: l.id,
        propertyId: l.property_id,
        propertyLabel: property?.label ?? "—",
        tenantName: tenant?.full_name ?? "—",
        rentAmount: latest?.rent ?? Number(l.rent_amount),
        chargesAmount: latest?.charges ?? Number(l.charges_amount),
        paymentDate,
        paymentDay: l.payment_day,
        fromPreviousReceipt: Boolean(latest),
      };
    });

  return { items };
}

export type BatchPayloadItem =
  | {
      mode: "default";
      leaseId: string;
      rentAmount: number;
      chargesAmount: number;
      paymentDate: string;
    }
  | {
      mode: "rent";
      leaseId: string;
      rentAmount: number;
      chargesAmount: number;
      paymentDate: string;
    }
  | {
      mode: "tenant";
      oldLeaseId: string;
      propertyId: string;
      paymentDate: string;
      newTenant: { full_name: string; email: string; phone: string };
      newLease: {
        rent_amount: number;
        charges_amount: number;
        payment_day: number;
        start_date: string;
      };
    };

export async function generateBatchReceipts(
  month: number,
  year: number,
  items: BatchPayloadItem[]
): Promise<{ ok: true; created: number } | { error: string }> {
  if (items.length === 0) return { ok: true, created: 0 };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // End of previous month — used to close old leases when tenant changes.
  const prevMonthEnd = new Date(year, month - 1, 0).toISOString().slice(0, 10);

  let created = 0;

  for (const it of items) {
    if (it.mode === "default") {
      const { error } = await supabase.from("receipts").insert({
        lease_id: it.leaseId,
        period_month: month,
        period_year: year,
        rent_amount: it.rentAmount,
        charges_amount: it.chargesAmount,
        payment_date: it.paymentDate,
      });
      if (error) return { error: `Quittance: ${error.message}` };
      created++;
    } else if (it.mode === "rent") {
      const { error: updErr } = await supabase
        .from("leases")
        .update({
          rent_amount: it.rentAmount,
          charges_amount: it.chargesAmount,
        })
        .eq("id", it.leaseId);
      if (updErr) return { error: `Bail: ${updErr.message}` };

      const { error } = await supabase.from("receipts").insert({
        lease_id: it.leaseId,
        period_month: month,
        period_year: year,
        rent_amount: it.rentAmount,
        charges_amount: it.chargesAmount,
        payment_date: it.paymentDate,
      });
      if (error) return { error: `Quittance: ${error.message}` };
      created++;
    } else if (it.mode === "tenant") {
      // 1. Create the new tenant
      const { data: tenant, error: tenantErr } = await supabase
        .from("tenants")
        .insert({
          full_name: it.newTenant.full_name,
          email: it.newTenant.email,
          phone: it.newTenant.phone || null,
        })
        .select("id")
        .single();
      if (tenantErr || !tenant) {
        return { error: `Locataire: ${tenantErr?.message ?? "creation failed"}` };
      }

      // 2. Close the old lease (end_date = end of previous month)
      const { error: closeErr } = await supabase
        .from("leases")
        .update({ end_date: prevMonthEnd })
        .eq("id", it.oldLeaseId);
      if (closeErr) return { error: `Clôture bail: ${closeErr.message}` };

      // 3. Create the new lease for the new tenant on the same property
      const { data: newLease, error: leaseErr } = await supabase
        .from("leases")
        .insert({
          property_id: it.propertyId,
          tenant_id: tenant.id,
          rent_amount: it.newLease.rent_amount,
          charges_amount: it.newLease.charges_amount,
          payment_day: it.newLease.payment_day,
          start_date: it.newLease.start_date,
        })
        .select("id")
        .single();
      if (leaseErr || !newLease) {
        return { error: `Nouveau bail: ${leaseErr?.message ?? "creation failed"}` };
      }

      // 4. Create the receipt on the new lease
      const { error } = await supabase.from("receipts").insert({
        lease_id: newLease.id,
        period_month: month,
        period_year: year,
        rent_amount: it.newLease.rent_amount,
        charges_amount: it.newLease.charges_amount,
        payment_date: it.paymentDate,
      });
      if (error) return { error: `Quittance: ${error.message}` };
      created++;
    }
  }

  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  revalidatePath("/leases");
  revalidatePath("/tenants");
  return { ok: true, created };
}
