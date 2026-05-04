import { Building2, Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyDialog } from "./property-dialog";
import { DeleteButton } from "./delete-button";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Biens"
        description="Vos biens loués."
        action={
          <PropertyDialog>
            <Button>
              <Plus />
              Nouveau bien
            </Button>
          </PropertyDialog>
        }
      />

      {properties && properties.length > 0 ? (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {properties.map((p) => (
              <div key={p.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{p.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {p.address}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {p.postal_code} {p.city}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {PROPERTY_TYPE_LABELS[(p.type ?? "apartment") as PropertyType]}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                  <PropertyDialog
                    id={p.id}
                    defaults={{
                      label: p.label,
                      type: (p.type ?? "apartment") as PropertyType,
                      address: p.address,
                      city: p.city,
                      postal_code: p.postal_code,
                    }}
                  >
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </button>
                  </PropertyDialog>
                  <DeleteButton id={p.id} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden rounded-lg border bg-card sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Adresse</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead className="w-24 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {PROPERTY_TYPE_LABELS[(p.type ?? "apartment") as PropertyType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.address}</TableCell>
                    <TableCell>
                      {p.postal_code} {p.city}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <PropertyDialog
                          id={p.id}
                          defaults={{
                            label: p.label,
                            type: (p.type ?? "apartment") as PropertyType,
                            address: p.address,
                            city: p.city,
                            postal_code: p.postal_code,
                          }}
                        >
                          <button
                            type="button"
                            title="Modifier"
                            className="inline-flex size-9 items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                          >
                            <Pencil className="size-4" />
                          </button>
                        </PropertyDialog>
                        <DeleteButton id={p.id} />
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
          icon={<Building2 />}
          title="Aucun bien pour l'instant"
          description="Ajoutez votre premier bien pour commencer à gérer vos baux et quittances."
          action={
            <PropertyDialog>
              <Button>
                <Plus />
                Nouveau bien
              </Button>
            </PropertyDialog>
          }
        />
      )}
    </>
  );
}

// EmptyState now lives in @/components/empty-state — replaced inline below.
