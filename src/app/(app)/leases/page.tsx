import { FileText, Pencil, Plus } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { LeaseDialog } from "./lease-dialog";
import { DeleteLeaseButton } from "./delete-button";
import { ShowEndedToggle } from "./show-ended-toggle";

function isLeaseEnded(endDate: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

type SearchParams = Promise<{ ended?: string }>;

export default async function LeasesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ended } = await searchParams;
  const showEnded = ended === "1";
  const supabase = await createClient();

  const [{ data: leases }, { data: properties }, { data: tenants }] =
    await Promise.all([
      supabase
        .from("leases")
        .select("*, properties(label), tenants(full_name)")
        .order("created_at", { ascending: false }),
      supabase.from("properties").select("id, label").order("label"),
      supabase.from("tenants").select("id, full_name").order("full_name"),
    ]);

  type LeaseRow = NonNullable<typeof leases>[number] & {
    properties: { label: string } | null;
    tenants: { full_name: string } | null;
  };

  const allLeases = (leases as LeaseRow[]) ?? [];
  const endedCount = allLeases.filter((l) => isLeaseEnded(l.end_date)).length;
  const visibleLeases = showEnded
    ? allLeases
    : allLeases.filter((l) => !isLeaseEnded(l.end_date));

  const canCreate = (properties?.length ?? 0) > 0 && (tenants?.length ?? 0) > 0;

  return (
    <>
      <PageHeader
        title="Baux"
        description="Associez un bien à un locataire avec un loyer."
        action={
          canCreate ? (
            <LeaseDialog properties={properties ?? []} tenants={tenants ?? []}>
              <Button>
                <Plus />
                Nouveau bail
              </Button>
            </LeaseDialog>
          ) : null
        }
      />

      {endedCount > 0 && (
        <div className="-mt-2 mb-4 flex items-center justify-between gap-3 text-sm">
          <ShowEndedToggle initial={showEnded} />
          {showEnded && (
            <span className="text-xs text-muted-foreground">
              {endedCount} bail{endedCount > 1 ? "s" : ""} terminé{endedCount > 1 ? "s" : ""} affiché{endedCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {!canCreate ? (
        <EmptyState
          icon={<FileText />}
          title="Prérequis manquants"
          description="Créez au moins un bien et un locataire avant d'ajouter un bail."
        />
      ) : allLeases.length > 0 ? (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {visibleLeases.map((l) => (
              <div key={l.id} className={`rounded-lg border bg-card p-4 ${isLeaseEnded(l.end_date) ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{l.properties?.label ?? "—"}</span>
                      {isLeaseEnded(l.end_date) && (
                        <Badge variant="secondary" className="font-normal">Terminé</Badge>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {l.tenants?.full_name ?? "—"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold tabular-nums">
                      {formatCurrency(Number(l.rent_amount) + Number(l.charges_amount))}
                    </div>
                    <div className="text-xs text-muted-foreground">/ mois</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Loyer {formatCurrency(l.rent_amount)}</span>
                  <span>Charges {formatCurrency(l.charges_amount)}</span>
                  <span>Depuis {formatDate(l.start_date)}</span>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                  <LeaseDialog
                    properties={properties ?? []}
                    tenants={tenants ?? []}
                    id={l.id}
                    defaults={{
                      property_id: l.property_id,
                      tenant_id: l.tenant_id,
                      rent_amount: Number(l.rent_amount),
                      charges_amount: Number(l.charges_amount),
                      payment_day: l.payment_day,
                      start_date: l.start_date,
                      end_date: l.end_date ?? "",
                    }}
                  >
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </button>
                  </LeaseDialog>
                  <DeleteLeaseButton id={l.id} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden rounded-lg border bg-card sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Loyer</TableHead>
                  <TableHead className="hidden md:table-cell">Charges</TableHead>
                  <TableHead className="hidden md:table-cell">Début</TableHead>
                  <TableHead className="w-24 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLeases.map((l) => (
                  <TableRow key={l.id} className={isLeaseEnded(l.end_date) ? "text-muted-foreground" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {l.properties?.label ?? "—"}
                        {isLeaseEnded(l.end_date) && (
                          <Badge variant="secondary" className="font-normal">Terminé</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{l.tenants?.full_name ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(l.rent_amount)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatCurrency(l.charges_amount)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(l.start_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <LeaseDialog
                          properties={properties ?? []}
                          tenants={tenants ?? []}
                          id={l.id}
                          defaults={{
                            property_id: l.property_id,
                            tenant_id: l.tenant_id,
                            rent_amount: Number(l.rent_amount),
                            charges_amount: Number(l.charges_amount),
                            payment_day: l.payment_day,
                            start_date: l.start_date,
                            end_date: l.end_date ?? "",
                          }}
                        >
                          <button
                            type="button"
                            title="Modifier"
                            className="inline-flex size-9 items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                          >
                            <Pencil className="size-4" />
                          </button>
                        </LeaseDialog>
                        <DeleteLeaseButton id={l.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<FileText />}
          title="Aucun bail"
          description="Créez votre premier bail pour générer et envoyer des quittances mensuelles."
          action={
            <LeaseDialog properties={properties ?? []} tenants={tenants ?? []}>
              <Button>
                <Plus />
                Nouveau bail
              </Button>
            </LeaseDialog>
          }
        />
      )}
    </>
  );
}
