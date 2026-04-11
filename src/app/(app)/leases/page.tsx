import { FileText, Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
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

export default async function LeasesPage() {
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

      {!canCreate ? (
        <EmptyState
          icon={<FileText />}
          title="Prérequis manquants"
          description="Créez au moins un bien et un locataire avant d'ajouter un bail."
        />
      ) : leases && leases.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bien</TableHead>
                <TableHead>Locataire</TableHead>
                <TableHead>Loyer</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead>Début</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(leases as LeaseRow[]).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">
                    {l.properties?.label ?? "—"}
                  </TableCell>
                  <TableCell>{l.tenants?.full_name ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(l.rent_amount)}</TableCell>
                  <TableCell>{formatCurrency(l.charges_amount)}</TableCell>
                  <TableCell className="text-muted-foreground">
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
                        <Button variant="ghost" size="icon" title="Modifier">
                          <Pencil />
                        </Button>
                      </LeaseDialog>
                      <DeleteLeaseButton id={l.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
