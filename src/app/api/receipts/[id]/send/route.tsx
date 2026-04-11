import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ReceiptPdf, type ReceiptPdfData } from "@/lib/pdf/receipt-template";
import { sendEmailViaGmail } from "@/lib/gmail/send";

export const runtime = "nodejs";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function flatten<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, address, signature_data_url, gmail_email, gmail_refresh_token")
    .eq("id", user.id)
    .single();

  if (!profile?.gmail_refresh_token || !profile.gmail_email) {
    return NextResponse.json(
      { error: "Gmail non connecté. Allez dans Paramètres." },
      { status: 400 }
    );
  }

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select(
      `id, period_month, period_year, rent_amount, charges_amount, payment_date,
       leases:lease_id (
         properties:property_id (label, address, city, postal_code),
         tenants:tenant_id (full_name, email)
       )`
    )
    .eq("id", id)
    .single();

  if (error || !receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lease = flatten(receipt.leases);
  const property = flatten(lease?.properties);
  const tenant = flatten(lease?.tenants);
  if (!property || !tenant) {
    return NextResponse.json({ error: "Invalid receipt" }, { status: 400 });
  }

  const data: ReceiptPdfData = {
    owner: {
      full_name: profile.full_name ?? user.email ?? "Bailleur",
      address: profile.address ?? null,
      signature_data_url: profile.signature_data_url ?? null,
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

  try {
    const pdfBuffer = await renderToBuffer(<ReceiptPdf data={data} />);
    const monthLabel = `${MONTHS[data.period.month - 1]} ${data.period.year}`;
    const filename = `quittance-${data.period.year}-${String(data.period.month).padStart(2, "0")}.pdf`;

    await sendEmailViaGmail({
      refreshToken: profile.gmail_refresh_token,
      from: profile.gmail_email,
      fromName: data.owner.full_name,
      to: tenant.email,
      subject: `Quittance de loyer — ${monthLabel}`,
      bodyText: `Bonjour ${tenant.full_name},\n\nVeuillez trouver ci-joint votre quittance de loyer pour ${monthLabel}.\n\nCordialement,\n${data.owner.full_name}`,
      attachment: {
        filename,
        contentType: "application/pdf",
        content: pdfBuffer as unknown as Buffer,
      },
    });

    await supabase
      .from("receipts")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[receipts/send]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "send_failed" },
      { status: 500 }
    );
  }
}
