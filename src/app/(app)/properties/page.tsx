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
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Adresse</TableHead>
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
                  <TableCell>{p.address}</TableCell>
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
                        <Button variant="ghost" size="icon" title="Modifier">
                          <Pencil />
                        </Button>
                      </PropertyDialog>
                      <DeleteButton id={p.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
