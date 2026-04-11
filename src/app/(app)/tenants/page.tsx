import { Pencil, Plus, Users } from "lucide-react";
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
import { TenantDialog } from "./tenant-dialog";
import { DeleteTenantButton } from "./delete-button";

export default async function TenantsPage() {
  const supabase = await createClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Locataires"
        description="Vos locataires."
        action={
          <TenantDialog>
            <Button>
              <Plus />
              Nouveau locataire
            </Button>
          </TenantDialog>
        }
      />

      {tenants && tenants.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.full_name}</TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <TenantDialog
                        id={t.id}
                        defaults={{
                          full_name: t.full_name,
                          email: t.email,
                          phone: t.phone ?? "",
                        }}
                      >
                        <Button variant="ghost" size="icon" title="Modifier">
                          <Pencil />
                        </Button>
                      </TenantDialog>
                      <DeleteTenantButton id={t.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={<Users />}
          title="Aucun locataire"
          description="Ajoutez vos locataires pour pouvoir créer des baux et leur envoyer des quittances."
          action={
            <TenantDialog>
              <Button>
                <Plus />
                Nouveau locataire
              </Button>
            </TenantDialog>
          }
        />
      )}
    </>
  );
}
