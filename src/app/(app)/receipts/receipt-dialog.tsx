"use client";

import { useMemo, useState, useTransition } from "react";
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
import { createReceipt } from "./actions";

type LeaseLite = {
  id: string;
  rent_amount: number;
  charges_amount: number;
  properties: { label: string } | { label: string }[] | null;
  tenants: { full_name: string } | { full_name: string }[] | null;
};

function flatten<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function ReceiptDialog({
  children,
  leases,
}: {
  children: React.ReactNode;
  leases: LeaseLite[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const now = new Date();
  const [leaseId, setLeaseId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const selected = useMemo(
    () => leases.find((l) => l.id === leaseId),
    [leaseId, leases]
  );

  function onSubmit(formData: FormData) {
    formData.set("lease_id", leaseId);
    formData.set("period_month", month);
    formData.set("period_year", year);
    start(async () => {
      const r = await createReceipt(formData);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Quittance créée");
      setOpen(false);
      setLeaseId("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle quittance</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Bail</Label>
            <Select value={leaseId} onValueChange={setLeaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un bail" />
              </SelectTrigger>
              <SelectContent>
                {leases.map((l) => {
                  const property = flatten(l.properties);
                  const tenant = flatten(l.tenants);
                  return (
                    <SelectItem key={l.id} value={l.id}>
                      {property?.label ?? "?"} — {tenant?.full_name ?? "?"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Mois</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="period_year">Année</Label>
              <Input
                id="period_year"
                type="number"
                min={2020}
                max={2100}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Loyer (€)"
              name="rent_amount"
              type="number"
              step="0.01"
              defaultValue={selected?.rent_amount ?? ""}
              required
              key={`rent-${leaseId}`}
            />
            <Field
              label="Charges (€)"
              name="charges_amount"
              type="number"
              step="0.01"
              defaultValue={selected?.charges_amount ?? 0}
              key={`charges-${leaseId}`}
            />
          </div>

          <Field
            label="Date de paiement"
            name="payment_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !leaseId}>
              {pending && <Loader2 className="animate-spin" />}
              Créer
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
