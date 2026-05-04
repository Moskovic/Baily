"use client";

import { cloneElement, isValidElement, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/schemas";
import { createProperty, updateProperty } from "./actions";

type Defaults = {
  label: string;
  type: PropertyType;
  address: string;
  city: string;
  postal_code: string;
};

const empty: Defaults = {
  label: "",
  type: "apartment",
  address: "",
  city: "",
  postal_code: "",
};

export function PropertyDialog({
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
  const [type, setType] = useState<PropertyType>(init.type);
  const isEdit = Boolean(id);

  function onSubmit(formData: FormData) {
    formData.set("type", type);
    start(async () => {
      const result = isEdit
        ? await updateProperty(id!, formData)
        : await createProperty(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Bien mis à jour" : "Bien créé");
      setOpen(false);
      if (!isEdit) setType("apartment");
    });
  }

  const trigger = isValidElement<{ onClick?: (e: React.MouseEvent) => void }>(children)
    ? cloneElement(children, {
        onClick: (e: React.MouseEvent) => {
          children.props.onClick?.(e);
          setOpen(true);
        },
      })
    : children;

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le bien" : "Nouveau bien"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations de ce bien."
              : "Ajoutez un bien à votre portefeuille."}
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <Field label="Libellé" name="label" required defaultValue={init.label} />
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as PropertyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Adresse" name="address" required defaultValue={init.address} />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Field
                label="CP"
                name="postal_code"
                required
                defaultValue={init.postal_code}
              />
            </div>
            <div className="col-span-2">
              <Field label="Ville" name="city" required defaultValue={init.city} />
            </div>
          </div>
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
    </>
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
