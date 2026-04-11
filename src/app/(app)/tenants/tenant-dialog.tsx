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
import { createTenant, updateTenant } from "./actions";

type Defaults = { full_name: string; email: string; phone: string };
const empty: Defaults = { full_name: "", email: "", phone: "" };

export function TenantDialog({
  children,
  id,
  defaults,
}: {
  children: React.ReactNode;
  id?: string;
  defaults?: Defaults;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const init = defaults ?? empty;
  const isEdit = Boolean(id);

  function onSubmit(formData: FormData) {
    start(async () => {
      const r = isEdit
        ? await updateTenant(id!, formData)
        : await createTenant(formData);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success(isEdit ? "Locataire mis à jour" : "Locataire créé");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le locataire" : "Nouveau locataire"}
          </DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Nom complet"
            name="full_name"
            required
            defaultValue={init.full_name}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            required
            defaultValue={init.email}
          />
          <Field label="Téléphone" name="phone" type="tel" defaultValue={init.phone} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
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
