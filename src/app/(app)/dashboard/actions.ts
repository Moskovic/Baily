"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmailViaGmail } from "@/lib/gmail/send";
import { formatCurrency } from "@/lib/utils";

const MONTH_LABELS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function flatten<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

/**
 * Detect overdue rents for the current user and email them a summary
 * via their own Gmail. Called from the "Tester les rappels" button.
 */
export async function sendOverdueReminder() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, gmail_email, gmail_refresh_token")
    .eq("id", user.id)
    .single();

  if (!profile?.gmail_refresh_token || !profile.gmail_email) {
    return { error: "Gmail non connecté. Allez dans Paramètres." };
  }

  const now = new Date();
  const today = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const [{ data: leases }, { data: receiptsThisMonth }] = await Promise.all([
    supabase
      .from("leases")
      .select(
        "id, rent_amount, charges_amount, payment_day, start_date, end_date, properties:property_id (label), tenants:tenant_id (full_name)"
      ),
    supabase
      .from("receipts")
      .select("lease_id")
      .eq("period_month", currentMonth)
      .eq("period_year", currentYear),
  ]);

  const receiptsByLease = new Set(
    (receiptsThisMonth ?? []).map((r) => r.lease_id as string)
  );

  type LeaseRow = NonNullable<typeof leases>[number] & {
    properties: { label: string } | { label: string }[] | null;
    tenants: { full_name: string } | { full_name: string }[] | null;
  };

  const overdue = ((leases as LeaseRow[] | null) ?? [])
    .filter((l) => {
      const start = new Date(l.start_date);
      if (start > now) return false;
      if (l.end_date && new Date(l.end_date) < now) return false;
      const dueDay = Math.min(l.payment_day, daysInMonth);
      return dueDay < today && !receiptsByLease.has(l.id);
    })
    .map((l) => ({
      leaseId: l.id,
      property: flatten(l.properties)?.label ?? "—",
      tenant: flatten(l.tenants)?.full_name ?? "—",
      dueDay: Math.min(l.payment_day, daysInMonth),
      amount: Number(l.rent_amount) + Number(l.charges_amount),
    }));

  if (overdue.length === 0) {
    return { ok: true, count: 0 };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const textLines = overdue
    .map(
      (o) =>
        `- ${o.property} (${o.tenant}) — dû le ${String(o.dueDay).padStart(2, "0")} — ${formatCurrency(o.amount)}\n  ${appUrl}/receipts/prepare?lease=${o.leaseId}&month=${currentMonth}&year=${currentYear}`
    )
    .join("\n\n");

  const total = overdue.reduce((a, o) => a + o.amount, 0);
  const monthLabel = `${MONTH_LABELS[currentMonth - 1]} ${currentYear}`;

  const bodyText = `Bonjour ${profile.full_name ?? ""},

Les quittances suivantes n'ont pas encore été générées pour ${monthLabel} alors que la date d'échéance est passée :

${textLines}

Total : ${formatCurrency(total)}

— Quito`;

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const rows = overdue
    .map((o) => {
      const url = `${appUrl}/receipts/prepare?lease=${o.leaseId}&month=${currentMonth}&year=${currentYear}`;
      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #e5e5e5">
            <div style="font-weight:600;color:#111">${escapeHtml(o.property)}</div>
            <div style="color:#666;font-size:13px">${escapeHtml(o.tenant)} · dû le ${String(o.dueDay).padStart(2, "0")}</div>
          </td>
          <td style="padding:16px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;white-space:nowrap">
            ${formatCurrency(o.amount)}
          </td>
          <td style="padding:16px 0 16px 16px;border-bottom:1px solid #e5e5e5;text-align:right">
            <a href="${url}" style="display:inline-block;padding:8px 14px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;font-size:13px">Préparer &rarr;</a>
          </td>
        </tr>`;
    })
    .join("");

  const bodyHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;margin-bottom:4px">Quito</div>
    <div style="color:#666;font-size:13px;margin-bottom:24px">Rappel — ${escapeHtml(monthLabel)}</div>
    <h1 style="font-size:18px;font-weight:600;margin:0 0 8px">${overdue.length} quittance${overdue.length > 1 ? "s" : ""} en retard</h1>
    <p style="color:#555;margin:0 0 24px;line-height:1.6">
      Bonjour ${escapeHtml(profile.full_name ?? "")}, les quittances suivantes n'ont pas encore été générées alors que la date d'échéance est passée. Cliquez sur "Préparer" pour ouvrir la quittance directement dans Quito et l'envoyer.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
      ${rows}
    </table>
    <div style="display:flex;justify-content:space-between;padding-top:16px;font-size:14px">
      <span style="color:#666">Total</span>
      <span style="font-weight:700">${formatCurrency(total)}</span>
    </div>
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:12px">
      Email envoyé automatiquement par Quito.
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmailViaGmail({
      refreshToken: profile.gmail_refresh_token,
      from: profile.gmail_email,
      fromName: "Quito",
      to: user.email!,
      subject: `Quito — ${overdue.length} quittance(s) en retard`,
      bodyText,
      bodyHtml,
    });
    return { ok: true, count: overdue.length };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erreur d'envoi",
    };
  }
}
