"use client";

import { useState, useTransition } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateReceipt } from "../actions";

export function EditReceiptDialog({
  id,
  defaults,
  children,
}: {
  id: string;
  defaults: {
    rent_amount: number;
    charges_amount: number;
    payment_date: string;
  };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      const r = await updateReceipt(id, formData);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Quittance mise à jour", {
        description: "Le PDF a été régénéré.",
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la quittance</DialogTitle>
          <DialogDescription>
            Les modifications régénèrent automatiquement le PDF. Si la
            quittance avait été envoyée, elle repasse en brouillon.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Loyer (€)"
              name="rent_amount"
              type="number"
              step="0.01"
              defaultValue={defaults.rent_amount}
              required
            />
            <Field
              label="Charges (€)"
              name="charges_amount"
              type="number"
              step="0.01"
              defaultValue={defaults.charges_amount}
            />
          </div>
          <Field
            label="Date de paiement"
            name="payment_date"
            type="date"
            defaultValue={defaults.payment_date}
            required
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Enregistrer
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
