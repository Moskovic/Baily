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
import { ShowSoldToggle } from "./show-sold-toggle";

type PropertyRow = {
  id: string;
  label: string;
  type: PropertyType | null;
  address: string;
  city: string;
  postal_code: string;
  sold_at: string | null;
};

type SearchParams = Promise<{ sold?: string }>;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { sold } = await searchParams;
  const showSold = sold === "1";

  const supabase = await createClient();
  const { data: rawProperties } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  const allProperties = (rawProperties as PropertyRow[]) ?? [];
  const soldCount = allProperties.filter((p) => p.sold_at).length;
  const properties = showSold
    ? allProperties
    : allProperties.filter((p) => !p.sold_at);

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

      {soldCount > 0 && (
        <div className="-mt-2 mb-4 flex items-center justify-between gap-3 text-sm">
          <ShowSoldToggle initial={showSold} />
          {showSold && (
            <span className="text-xs text-muted-foreground">
              {soldCount} bien{soldCount > 1 ? "s" : ""} vendu{soldCount > 1 ? "s" : ""} affiché{soldCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {allProperties.length > 0 && properties.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="Tous vos biens sont marqués vendus"
          description="Activez le bouton « Afficher les biens vendus » pour les voir."
        />
      ) : properties && properties.length > 0 ? (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {properties.map((p) => (
              <div key={p.id} className={`rounded-lg border bg-card p-4 ${p.sold_at ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{p.label}</span>
                      {p.sold_at && (
                        <Badge variant="destructive" className="font-normal">Vendu</Badge>
                      )}
                    </div>
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
                  <TableRow key={p.id} className={p.sold_at ? "text-muted-foreground" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {p.label}
                        {p.sold_at && (
                          <Badge variant="destructive" className="font-normal">Vendu</Badge>
                        )}
                      </div>
                    </TableCell>
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
