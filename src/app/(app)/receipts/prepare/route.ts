import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Finds or creates a receipt for a given lease / period and redirects
 * to the receipt preview page. Used by the overdue reminder email.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const leaseId = searchParams.get("lease");
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!leaseId || !month || !year) {
    return NextResponse.redirect(`${origin}/receipts`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?next=${encodeURIComponent(
        `/receipts/prepare?lease=${leaseId}&month=${month}&year=${year}`
      )}`
    );
  }

  // Already exists?
  const { data: existing } = await supabase
    .from("receipts")
    .select("id")
    .eq("lease_id", leaseId)
    .eq("period_month", month)
    .eq("period_year", year)
    .maybeSingle();

  if (existing?.id) {
    return NextResponse.redirect(`${origin}/receipts/${existing.id}`);
  }

  // Load lease amounts to create the receipt with sensible defaults.
  const { data: lease, error: leaseErr } = await supabase
    .from("leases")
    .select("rent_amount, charges_amount")
    .eq("id", leaseId)
    .single();

  if (leaseErr || !lease) {
    return NextResponse.redirect(`${origin}/receipts`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: created, error: insErr } = await supabase
    .from("receipts")
    .insert({
      lease_id: leaseId,
      period_month: month,
      period_year: year,
      rent_amount: lease.rent_amount,
      charges_amount: lease.charges_amount,
      payment_date: today,
    })
    .select("id")
    .single();

  if (insErr || !created) {
    return NextResponse.redirect(
      `${origin}/receipts?error=${encodeURIComponent(insErr?.message ?? "create_failed")}`
    );
  }

  return NextResponse.redirect(`${origin}/receipts/${created.id}`);
}
