import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { SendButton } from "../send-button";
import { EditReceiptDialog } from "./edit-dialog";

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function flatten<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: receipt } = await supabase
    .from("receipts")
    .select(
      `id, period_month, period_year, rent_amount, charges_amount, payment_date, status, sent_at,
       leases:lease_id (
         properties:property_id (label, address, city, postal_code),
         tenants:tenant_id (full_name, email)
       )`
    )
    .eq("id", id)
    .single();

  if (!receipt) notFound();

  const lease = flatten(receipt.leases);
  const property = flatten(lease?.properties);
  const tenant = flatten(lease?.tenants);

  const total = Number(receipt.rent_amount) + Number(receipt.charges_amount);
  const monthLabel = `${MONTH_LABELS[receipt.period_month - 1]} ${receipt.period_year}`;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/receipts"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 text-muted-foreground"
          )}
        >
          <ArrowLeft />
          Retour aux quittances
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quittance — {monthLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {property?.label} · {tenant?.full_name}
          </p>
          <div className="mt-3">
            <StatusBadge status={receipt.status as "draft" | "sent" | "paid"} sentAt={receipt.sent_at} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/receipts/${receipt.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Download />
            Télécharger
          </a>
          <EditReceiptDialog
            id={receipt.id}
            defaults={{
              rent_amount: Number(receipt.rent_amount),
              charges_amount: Number(receipt.charges_amount),
              payment_date: receipt.payment_date,
            }}
          >
            <Button variant="outline">
              <Pencil />
              Modifier
            </Button>
          </EditReceiptDialog>
          <SendButton id={receipt.id} disabled={receipt.status === "sent"} variant="primary" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* PDF preview — hidden on mobile, shown as iframe on larger screens */}
        <Card className="hidden overflow-hidden p-0 sm:block">
          <iframe
            src={`/api/receipts/${receipt.id}/pdf`}
            title="Aperçu quittance"
            className="h-[700px] w-full border-0 bg-muted lg:h-[900px]"
          />
        </Card>

        {/* Mobile: prominent download button instead of iframe */}
        <Card className="sm:hidden">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Download className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Aperçu PDF</p>
              <p className="text-sm text-muted-foreground">
                Ouvrez le document pour le consulter
              </p>
            </div>
            <a
              href={`/api/receipts/${receipt.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              <Download />
              Ouvrir le PDF
            </a>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détails</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Row label="Période" value={monthLabel} />
              <Row label="Loyer" value={formatCurrency(Number(receipt.rent_amount))} />
              <Row label="Charges" value={formatCurrency(Number(receipt.charges_amount))} />
              <Row label="Total" value={formatCurrency(total)} strong />
              <Row label="Date de paiement" value={formatDate(receipt.payment_date)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Destinataire</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <div className="font-medium">{tenant?.full_name}</div>
              <div className="text-muted-foreground">{tenant?.email}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bien</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <div className="font-medium">{property?.label}</div>
              <div className="text-muted-foreground">
                {property?.address}
                <br />
                {property?.postal_code} {property?.city}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function StatusBadge({
  status,
  sentAt,
}: {
  status: "draft" | "sent" | "paid";
  sentAt: string | null;
}) {
  if (status === "sent") {
    return (
      <Badge variant="success">
        Envoyée{sentAt ? ` · ${formatDate(sentAt)}` : ""}
      </Badge>
    );
  }
  if (status === "paid") return <Badge variant="success">Payée</Badge>;
  return <Badge variant="secondary">Brouillon</Badge>;
}
