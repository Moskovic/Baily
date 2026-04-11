import Link from "next/link";
import { ChevronRight, Download, Eye, FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ReceiptDialog } from "./receipt-dialog";
import { DeleteReceiptButton } from "./delete-button";
import { SendButton } from "./send-button";
import { YearSelect } from "./year-select";

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function flatten<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

type SearchParams = Promise<{ year?: string }>;

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { year: yearParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: receipts }, { data: leases }] = await Promise.all([
    supabase
      .from("receipts")
      .select(
        "*, leases:lease_id (rent_amount, charges_amount, properties:property_id (label), tenants:tenant_id (full_name))"
      )
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false }),
    supabase
      .from("leases")
      .select(
        "id, rent_amount, charges_amount, properties:property_id (label), tenants:tenant_id (full_name)"
      ),
  ]);

  type ReceiptRow = NonNullable<typeof receipts>[number] & {
    leases:
      | {
          properties: { label: string } | { label: string }[] | null;
          tenants: { full_name: string } | { full_name: string }[] | null;
        }
      | null;
  };

  const allReceipts = (receipts as ReceiptRow[] | null) ?? [];

  // Years available — always include current year so the selector is non-empty
  // even with no data yet.
  const currentYear = new Date().getFullYear();
  const yearsSet = new Set<number>([currentYear]);
  for (const r of allReceipts) yearsSet.add(r.period_year);
  const years = Array.from(yearsSet).sort((a, b) => b - a);

  const selectedYear = yearParam ? Number(yearParam) : years[0];

  const filtered = allReceipts.filter((r) => r.period_year === selectedYear);

  // Group by month (descending).
  const byMonth = new Map<number, ReceiptRow[]>();
  for (const r of filtered) {
    const arr = byMonth.get(r.period_month) ?? [];
    arr.push(r);
    byMonth.set(r.period_month, arr);
  }
  const months = Array.from(byMonth.keys()).sort((a, b) => b - a);

  return (
    <>
      <PageHeader
        title="Quittances"
        description="Générez et envoyez vos quittances mensuelles."
        action={
          <div className="flex items-center gap-2">
            <YearSelect years={years} current={selectedYear} />
            {(leases?.length ?? 0) > 0 && (
              <ReceiptDialog leases={leases ?? []}>
                <Button>
                  <Plus />
                  Nouvelle quittance
                </Button>
              </ReceiptDialog>
            )}
          </div>
        }
      />

      {months.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title={`Aucune quittance pour ${selectedYear}`}
          description="Sélectionnez une autre année ou créez une nouvelle quittance pour démarrer."
          action={
            (leases?.length ?? 0) > 0 ? (
              <ReceiptDialog leases={leases ?? []}>
                <Button>
                  <Plus />
                  Nouvelle quittance
                </Button>
              </ReceiptDialog>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          {months.map((month, idx) => {
            const rows = byMonth.get(month)!;
            const monthTotal = rows.reduce(
              (acc, r) => acc + Number(r.rent_amount) + Number(r.charges_amount),
              0
            );
            const isCurrentMonth =
              selectedYear === currentYear && month === new Date().getMonth() + 1;

            return (
              <details
                key={month}
                open={isCurrentMonth}
                className={`group/month ${idx > 0 ? "border-t" : ""}`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-3">
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-open/month:rotate-90" />
                    <h2 className="font-semibold tracking-tight">
                      {MONTH_LABELS[month - 1]}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      · {rows.length} quittance{rows.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-sm tabular-nums text-muted-foreground">
                    Total :{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(monthTotal)}
                    </span>
                  </div>
                </summary>
                <div className="border-t bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bien</TableHead>
                        <TableHead className="hidden sm:table-cell">Locataire</TableHead>
                        <TableHead className="hidden sm:table-cell">Total</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-auto sm:w-40 text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => {
                        const property = flatten(r.leases?.properties);
                        const tenant = flatten(r.leases?.tenants);
                        const total = Number(r.rent_amount) + Number(r.charges_amount);
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              <Link href={`/receipts/${r.id}`} className="hover:underline">
                                {property?.label ?? "—"}
                              </Link>
                              <div className="text-xs text-muted-foreground sm:hidden">
                                {tenant?.full_name ?? "—"} · {formatCurrency(total)}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{tenant?.full_name ?? "—"}</TableCell>
                            <TableCell className="hidden sm:table-cell tabular-nums">
                              {formatCurrency(total)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={r.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button asChild size="icon" variant="ghost" title="Aperçu">
                                  <Link href={`/receipts/${r.id}`}>
                                    <Eye />
                                  </Link>
                                </Button>
                                <Button asChild size="icon" variant="ghost" title="Télécharger le PDF">
                                  <Link href={`/api/receipts/${r.id}/pdf`} target="_blank">
                                    <Download />
                                  </Link>
                                </Button>
                                <SendButton id={r.id} disabled={r.status === "sent"} />
                                <DeleteReceiptButton id={r.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: "draft" | "sent" | "paid" }) {
  if (status === "sent") return <Badge variant="success">Envoyée</Badge>;
  if (status === "paid") return <Badge variant="success">Payée</Badge>;
  return <Badge variant="secondary">Brouillon</Badge>;
}
