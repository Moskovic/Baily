"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLease, updateLease } from "./actions";

type Defaults = {
  property_id: string;
  tenant_id: string;
  rent_amount: number;
  charges_amount: number;
  payment_day: number;
  start_date: string;
  end_date: string;
};

const empty: Defaults = {
  property_id: "",
  tenant_id: "",
  rent_amount: 0,
  charges_amount: 0,
  payment_day: 1,
  start_date: "",
  end_date: "",
};

export function LeaseDialog({
  children,
  properties,
  tenants,
  id,
  defaults,
}: {
  children: React.ReactNode;
  properties: { id: string; label: string }[];
  tenants: { id: string; full_name: string }[];
  id?: string;
  defaults?: Defaults;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const init = defaults ?? empty;
  const isEdit = Boolean(id);

  const [propertyId, setPropertyId] = useState(init.property_id);
  const [tenantId, setTenantId] = useState(init.tenant_id);

  function onSubmit(formData: FormData) {
    formData.set("property_id", propertyId);
    formData.set("tenant_id", tenantId);
    start(async () => {
      const r = isEdit
        ? await updateLease(id!, formData)
        : await createLease(formData);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success(isEdit ? "Bail mis à jour" : "Bail créé");
      setOpen(false);
      if (!isEdit) {
        setPropertyId("");
        setTenantId("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le bail" : "Nouveau bail"}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Bien</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un bien" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Locataire</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un locataire" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Loyer hors charges (€)"
              name="rent_amount"
              type="number"
              step="0.01"
              required
              defaultValue={init.rent_amount}
            />
            <Field
              label="Charges (€)"
              name="charges_amount"
              type="number"
              step="0.01"
              defaultValue={init.charges_amount}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Jour de paiement"
              name="payment_day"
              type="number"
              min={1}
              max={31}
              defaultValue={init.payment_day}
            />
            <Field
              label="Début du bail"
              name="start_date"
              type="date"
              required
              defaultValue={init.start_date}
            />
          </div>
          <Field
            label="Fin du bail (optionnel)"
            name="end_date"
            type="date"
            defaultValue={init.end_date}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !propertyId || !tenantId}>
              {pending && <Loader2 className="animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.ComponentProps<"input">) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
