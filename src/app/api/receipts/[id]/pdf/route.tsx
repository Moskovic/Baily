import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ReceiptPdf, type ReceiptPdfData } from "@/lib/pdf/receipt-template";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select(
      `
      id, period_month, period_year, rent_amount, charges_amount, payment_date,
      leases:lease_id (
        properties:property_id (label, address, city, postal_code),
        tenants:tenant_id (full_name, email)
      )
      `
    )
    .eq("id", id)
    .single();

  if (error || !receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, address, signature_data_url")
    .eq("id", user.id)
    .single();

  // Supabase returns embedded relations as either object or array depending on types — normalize.
  const lease = Array.isArray(receipt.leases) ? receipt.leases[0] : receipt.leases;
  const property = Array.isArray(lease?.properties) ? lease?.properties[0] : lease?.properties;
  const tenant = Array.isArray(lease?.tenants) ? lease?.tenants[0] : lease?.tenants;

  if (!property || !tenant) {
    return NextResponse.json({ error: "Invalid receipt" }, { status: 400 });
  }

  const data: ReceiptPdfData = {
    owner: {
      full_name: profile?.full_name ?? user.email ?? "Bailleur",
      address: profile?.address ?? null,
      signature_data_url: profile?.signature_data_url ?? null,
    },
    tenant: { full_name: tenant.full_name, email: tenant.email },
    property: {
      label: property.label,
      address: property.address,
      city: property.city,
      postal_code: property.postal_code,
    },
    period: { month: receipt.period_month, year: receipt.period_year },
    rent_amount: Number(receipt.rent_amount),
    charges_amount: Number(receipt.charges_amount),
    payment_date: receipt.payment_date,
  };

  const buffer = await renderToBuffer(<ReceiptPdf data={data} />);
  const filename = `quittance-${data.period.year}-${String(data.period.month).padStart(2, "0")}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
