import Link from "next/link";
import { Building2, CalendarClock, CheckCircle2, Clock, FileText, Send, SendHorizontal, Users, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShinyCard } from "@/components/shiny-card";
import { formatCurrency } from "@/lib/utils";
import { OverdueTestButton } from "./overdue-test-button";

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function flatten<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: propertyCount },
    { count: tenantCount },
    { count: sentCount },
    { data: leases },
    { data: receiptsThisMonth },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("tenants").select("*", { count: "exact", head: true }),
    supabase.from("receipts").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase
      .from("leases")
      .select(
        "id, rent_amount, charges_amount, payment_day, start_date, end_date, properties:property_id (label), tenants:tenant_id (full_name)"
      )
      .order("payment_day", { ascending: true }),
    supabase
      .from("receipts")
      .select("id, lease_id, status")
      .eq("period_month", new Date().getMonth() + 1)
      .eq("period_year", new Date().getFullYear()),
  ]);

  type LeaseRow = NonNullable<typeof leases>[number] & {
    properties: { label: string } | { label: string }[] | null;
    tenants: { full_name: string } | { full_name: string }[] | null;
  };

  const now = new Date();
  const today = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Only include leases active this month (started by now, not ended).
  const activeLeases = ((leases as LeaseRow[] | null) ?? []).filter((l) => {
    const start = new Date(l.start_date);
    if (start > now) return false;
    if (l.end_date && new Date(l.end_date) < now) return false;
    return true;
  });

  const monthlyExpected = activeLeases.reduce(
    (acc, l) => acc + Number(l.rent_amount) + Number(l.charges_amount),
    0
  );

  const receiptsByLease = new Map<
    string,
    { id: string; status: "draft" | "sent" | "paid" }
  >(
    (receiptsThisMonth ?? []).map((r) => [
      r.lease_id as string,
      { id: r.id as string, status: r.status as "draft" | "sent" | "paid" },
    ])
  );

  // Build monthly due entries. Cap payment_day to last day of current month.
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const dueEntries = activeLeases
    .map((l) => {
      const dueDay = Math.min(l.payment_day, daysInMonth);
      const r = receiptsByLease.get(l.id);
      return {
        lease: l,
        dueDay,
        dueDate: new Date(currentYear, currentMonth - 1, dueDay),
        total: Number(l.rent_amount) + Number(l.charges_amount),
        receiptId: r?.id ?? null,
        receiptStatus: r?.status ?? null,
      };
    })
    .sort((a, b) => a.dueDay - b.dueDay);

  const stats = [
    {
      label: "Revenus mensuels attendus",
      value: formatCurrency(monthlyExpected),
      icon: <Wallet />,
      highlight: true,
    },
    { label: "Biens", value: propertyCount ?? 0, icon: <Building2 /> },
    { label: "Locataires", value: tenantCount ?? 0, icon: <Users /> },
    { label: "Quittances envoyées", value: sentCount ?? 0, icon: <Send /> },
  ];

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={`${MONTH_LABELS[currentMonth - 1]} ${currentYear} — vue d'ensemble.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const inner = (
            <div className="flex h-full flex-col gap-4 p-6">
              <div
                className={`flex items-center gap-2.5 text-sm font-medium ${
                  s.highlight ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-md [&_svg]:size-4 ${
                    s.highlight
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.icon}
                </span>
                {s.label}
              </div>
              <div
                className={`mt-auto text-4xl font-semibold tabular-nums tracking-tight ${
                  s.highlight ? "brand-text" : ""
                }`}
              >
                {s.value}
              </div>
            </div>
          );

          return s.highlight ? (
            <ShinyCard
              key={s.label}
              className="brand-glow border-primary/30 ring-1 ring-primary/10 shadow-[0_12px_36px_-14px_color-mix(in_oklch,var(--brand-from)_35%,transparent)]"
            >
              {inner}
            </ShinyCard>
          ) : (
            <div
              key={s.label}
              className="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-5" />
                Échéances de {MONTH_LABELS[currentMonth - 1]}
              </CardTitle>
              <CardDescription>
                Suivez les jours de paiement et l&apos;état des quittances.
              </CardDescription>
            </div>
            <OverdueTestButton />
          </CardHeader>
          <CardContent>
            {dueEntries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun bail actif ce mois-ci.
              </p>
            ) : (
              <ul className="divide-y">
                {dueEntries.map(({ lease, dueDay, total, receiptId, receiptStatus }) => {
                  const property = flatten(lease.properties);
                  const tenant = flatten(lease.tenants);
                  const isPast = dueDay < today;
                  const isToday = dueDay === today;
                  const isSent = receiptStatus === "sent" || receiptStatus === "paid";
                  const isDraft = receiptStatus === "draft";
                  const prepareUrl = `/receipts/prepare?lease=${lease.id}&month=${currentMonth}&year=${currentYear}`;
                  return (
                    <li key={lease.id} className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap sm:gap-4">
                      <div
                        className={`flex size-10 shrink-0 flex-col items-center justify-center rounded-md border sm:size-12 ${
                          isToday
                            ? "border-primary bg-primary/10"
                            : "bg-muted/40"
                        }`}
                      >
                        <div className="text-[10px] text-muted-foreground sm:text-xs">
                          {MONTH_LABELS[currentMonth - 1].slice(0, 3)}
                        </div>
                        <div className="text-xs font-semibold tabular-nums leading-none sm:text-sm">
                          {String(dueDay).padStart(2, "0")}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-sm sm:text-base">
                          {property?.label ?? "—"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground sm:text-sm">
                          {tenant?.full_name ?? "—"} · {formatCurrency(total)}
                        </div>
                      </div>
                      <div className="hidden text-right tabular-nums font-medium sm:block">
                        {formatCurrency(total)}
                      </div>
                      <div className="ml-auto sm:w-36 sm:text-right">
                        {isSent ? (
                          <Link
                            href={`/receipts/${receiptId}`}
                            className="inline-block transition-transform hover:-translate-y-px"
                          >
                            <Badge variant="success">
                              <CheckCircle2 />
                              Envoyée
                            </Badge>
                          </Link>
                        ) : isDraft ? (
                          <Link
                            href={`/receipts/${receiptId}`}
                            title="Quittance générée — prête à envoyer"
                            className="inline-block transition-transform hover:-translate-y-px"
                          >
                            <Badge variant="warning">
                              <SendHorizontal />
                              À envoyer
                            </Badge>
                          </Link>
                        ) : isPast ? (
                          <Link
                            href={prepareUrl}
                            title="Générer la quittance"
                            className="inline-block transition-transform hover:-translate-y-px"
                          >
                            <Badge variant="destructive">
                              <Clock />
                              En retard
                            </Badge>
                          </Link>
                        ) : (
                          <Link
                            href={prepareUrl}
                            title="Générer la quittance"
                            className="inline-block transition-transform hover:-translate-y-px"
                          >
                            <Badge variant="secondary">
                              <FileText />À générer
                            </Badge>
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
