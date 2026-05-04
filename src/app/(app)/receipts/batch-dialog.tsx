"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Euro,
  Home,
  Info,
  Loader2,
  Sparkles,
  UserPlus,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import {
  type BatchItem,
  type BatchPayloadItem,
  getBatchGenerationData,
  generateBatchReceipts,
} from "./batch-actions";

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

type ChangeMode = "default" | "rent" | "payment-day" | "tenant" | "sold";

type ItemState = BatchItem & {
  selected: boolean;
  mode: ChangeMode;
  // For rent change:
  newRent: number;
  newCharges: number;
  // For payment-day change:
  newPaymentDay: number;
  // For tenant change:
  newTenant: { full_name: string; email: string; phone: string };
  newLease: {
    rent_amount: number;
    charges_amount: number;
    payment_day: number;
    start_date: string;
  };
  // For sold:
  soldAt: string;
};

type Step =
  | "list"
  | "choose-type"
  | "edit-rent"
  | "edit-payment-day"
  | "edit-tenant"
  | "edit-sold"
  | "review";

export function BatchGenerateDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const [items, setItems] = useState<ItemState[]>([]);
  const [step, setStep] = useState<Step>("list");
  const [editIdx, setEditIdx] = useState<number>(0);

  // Quittances du mois écoulé : si on est en Mai, on génère pour Avril.
  const { month, year } = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { month: prev.getMonth() + 1, year: prev.getFullYear() };
  }, []);
  const monthLabel = `${MONTH_LABELS[month - 1]} ${year}`;
  const monthStartIso = useMemo(
    () => new Date(year, month - 1, 1).toISOString().slice(0, 10),
    [month, year]
  );

  // Load on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setStep("list");
    setEditIdx(0);
    getBatchGenerationData(month, year)
      .then((res) => {
        if ("error" in res) {
          toast.error(res.error);
          setOpen(false);
          return;
        }
        const todayIso = new Date().toISOString().slice(0, 10);
        setItems(
          res.items.map((i) => ({
            ...i,
            selected: true,
            mode: "default" as ChangeMode,
            newRent: i.rentAmount,
            newCharges: i.chargesAmount,
            newPaymentDay: i.paymentDay,
            newTenant: { full_name: "", email: "", phone: "" },
            newLease: {
              rent_amount: i.rentAmount,
              charges_amount: i.chargesAmount,
              payment_day: i.paymentDay,
              start_date: monthStartIso,
            },
            soldAt: todayIso,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [open, month, year, monthStartIso]);

  function toggle(idx: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, selected: !it.selected } : it))
    );
  }

  function toggleAll(value: boolean) {
    setItems((prev) => prev.map((it) => ({ ...it, selected: value })));
  }

  function updateItem(idx: number, patch: Partial<ItemState>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  const unselectedIndices = useMemo(
    () => items.map((it, i) => (it.selected ? -1 : i)).filter((i) => i >= 0),
    [items]
  );

  function handleContinue() {
    if (unselectedIndices.length === 0) {
      // All selected → straight to review
      setStep("review");
      return;
    }
    setEditIdx(unselectedIndices[0]);
    setStep("choose-type");
  }

  function moveToNextEditOrReview() {
    const next = unselectedIndices.find((i) => i > editIdx);
    if (next === undefined) {
      setStep("review");
      return;
    }
    setEditIdx(next);
    setStep("choose-type");
  }

  function chooseMode(mode: ChangeMode) {
    updateItem(editIdx, { mode });
    if (mode === "rent") setStep("edit-rent");
    else if (mode === "payment-day") setStep("edit-payment-day");
    else if (mode === "tenant") setStep("edit-tenant");
    else if (mode === "sold") setStep("edit-sold");
  }

  function submit() {
    const payload: BatchPayloadItem[] = items.map((it) => {
      if (it.selected || it.mode === "default") {
        return {
          mode: "default",
          leaseId: it.leaseId,
          rentAmount: it.rentAmount,
          chargesAmount: it.chargesAmount,
          paymentDate: it.paymentDate,
        };
      }
      if (it.mode === "rent") {
        return {
          mode: "rent",
          leaseId: it.leaseId,
          rentAmount: it.newRent,
          chargesAmount: it.newCharges,
          paymentDate: it.paymentDate,
        };
      }
      if (it.mode === "payment-day") {
        // Recompute payment date with new day for the current period.
        const daysInMonth = new Date(year, month, 0).getDate();
        const dueDay = Math.min(it.newPaymentDay, daysInMonth);
        const newPaymentDate = new Date(year, month - 1, dueDay)
          .toISOString()
          .slice(0, 10);
        return {
          mode: "payment-day",
          leaseId: it.leaseId,
          newPaymentDay: it.newPaymentDay,
          rentAmount: it.rentAmount,
          chargesAmount: it.chargesAmount,
          paymentDate: newPaymentDate,
        };
      }
      if (it.mode === "sold") {
        return {
          mode: "sold",
          leaseId: it.leaseId,
          propertyId: it.propertyId,
          soldAt: it.soldAt,
        };
      }
      return {
        mode: "tenant",
        oldLeaseId: it.leaseId,
        propertyId: it.propertyId,
        paymentDate: it.paymentDate,
        newTenant: it.newTenant,
        newLease: it.newLease,
      };
    });

    start(async () => {
      const res = await generateBatchReceipts(month, year, payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.created} quittance${res.created > 1 ? "s" : ""} générée${res.created > 1 ? "s" : ""}`
      );
      setOpen(false);
    });
  }

  const selectedCount = items.filter((it) => it.selected).length;
  const editingItem = items[editIdx];
  const remainingAfterCurrent = unselectedIndices.filter((i) => i > editIdx).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        ) : items.length === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>Tout est à jour</DialogTitle>
              <DialogDescription>
                Toutes les quittances de {monthLabel} ont déjà été générées.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </>
        ) : step === "list" ? (
          <>
            <DialogHeader>
              <DialogTitle>Générer les quittances de {monthLabel}</DialogTitle>
              <DialogDescription>
                Cochez celles à générer avec les valeurs du mois précédent.
                Décochez celles que vous voulez modifier.
              </DialogDescription>
            </DialogHeader>

            <div className="-mx-6 max-h-[50vh] overflow-y-auto border-y">
              <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
                <span>
                  {selectedCount} / {items.length} sélectionnée
                  {items.length > 1 ? "s" : ""}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleAll(true)}
                    className="hover:text-foreground"
                  >
                    Tout cocher
                  </button>
                  <span className="text-border">|</span>
                  <button
                    type="button"
                    onClick={() => toggleAll(false)}
                    className="hover:text-foreground"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>
              <ul className="divide-y">
                {items.map((it, i) => {
                  const total = Number(it.rentAmount) + Number(it.chargesAmount);
                  return (
                    <li key={it.leaseId}>
                      <label className="flex cursor-pointer items-center gap-3 px-6 py-3 hover:bg-muted/40">
                        <Checkbox
                          checked={it.selected}
                          onChange={() => toggle(i)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {it.propertyLabel}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {it.tenantName}
                            {!it.fromPreviousReceipt && (
                              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Info className="size-3" />
                                première quittance
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right tabular-nums text-sm">
                          {formatCurrency(total)}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleContinue} disabled={items.length === 0}>
                <Sparkles />
                {unselectedIndices.length === 0
                  ? `Générer ${items.length} quittance${items.length > 1 ? "s" : ""}`
                  : "Continuer"}
              </Button>
            </DialogFooter>
          </>
        ) : step === "choose-type" && editingItem ? (
          <>
            <DialogHeader>
              <DialogTitle>{editingItem.propertyLabel}</DialogTitle>
              <DialogDescription>
                {editingItem.tenantName} · {monthLabel}
                {remainingAfterCurrent > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({remainingAfterCurrent + 1} à modifier)
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2">
              <p className="text-sm text-muted-foreground">
                Que voulez-vous modifier ?
              </p>

              <button
                type="button"
                onClick={() => chooseMode("rent")}
                className="group flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Euro className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Changement de loyer</div>
                  <div className="text-sm text-muted-foreground">
                    Modifie les montants du bail (loyer et charges).
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => chooseMode("payment-day")}
                className="group flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <CalendarDays className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Changement de date de paiement</div>
                  <div className="text-sm text-muted-foreground">
                    Modifie le jour du mois pour le paiement du loyer.
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => chooseMode("tenant")}
                className="group flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <UserPlus className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Changement de locataire</div>
                  <div className="text-sm text-muted-foreground">
                    Clôture le bail actuel et crée un nouveau locataire et
                    un nouveau bail.
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => chooseMode("sold")}
                className="group flex items-center gap-4 rounded-lg border border-destructive/30 bg-card p-4 text-left transition-colors hover:border-destructive/60 hover:bg-destructive/5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                  <Home className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Bien vendu</div>
                  <div className="text-sm text-muted-foreground">
                    Clôture le bail, marque le bien comme vendu. Aucune
                    quittance n&apos;est générée.
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("list")}>
                Retour
              </Button>
            </DialogFooter>
          </>
        ) : step === "edit-rent" && editingItem ? (
          <>
            <DialogHeader>
              <DialogTitle>Changement de loyer</DialogTitle>
              <DialogDescription>
                {editingItem.propertyLabel} · {editingItem.tenantName}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-rent">Nouveau loyer (€)</Label>
                <Input
                  id="new-rent"
                  type="number"
                  step="0.01"
                  value={editingItem.newRent}
                  onChange={(e) =>
                    updateItem(editIdx, { newRent: Number(e.target.value || 0) })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-charges">Nouvelles charges (€)</Label>
                <Input
                  id="new-charges"
                  type="number"
                  step="0.01"
                  value={editingItem.newCharges}
                  onChange={(e) =>
                    updateItem(editIdx, {
                      newCharges: Number(e.target.value || 0),
                    })
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Le bail sera mis à jour avec ces valeurs (les prochains mois
              utiliseront ces montants).
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("choose-type")}
              >
                Retour
              </Button>
              <Button onClick={moveToNextEditOrReview}>
                {remainingAfterCurrent > 0 ? "Suivant" : "Vérifier"}
                <ChevronRight />
              </Button>
            </DialogFooter>
          </>
        ) : step === "edit-payment-day" && editingItem ? (
          <>
            <DialogHeader>
              <DialogTitle>Changement de date de paiement</DialogTitle>
              <DialogDescription>
                {editingItem.propertyLabel} · {editingItem.tenantName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="new-day">Nouveau jour de paiement</Label>
              <Input
                id="new-day"
                type="number"
                min={1}
                max={31}
                value={editingItem.newPaymentDay}
                onChange={(e) =>
                  updateItem(editIdx, {
                    newPaymentDay: Number(e.target.value || 1),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Jour du mois (1–31). Le bail sera mis à jour avec cette nouvelle
                date pour les prochains mois.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("choose-type")}
              >
                Retour
              </Button>
              <Button onClick={moveToNextEditOrReview}>
                {remainingAfterCurrent > 0 ? "Suivant" : "Vérifier"}
                <ChevronRight />
              </Button>
            </DialogFooter>
          </>
        ) : step === "edit-sold" && editingItem ? (
          <>
            <DialogHeader>
              <DialogTitle>Bien vendu</DialogTitle>
              <DialogDescription>
                {editingItem.propertyLabel} · {editingItem.tenantName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sold-at">Date de vente</Label>
                <Input
                  id="sold-at"
                  type="date"
                  value={editingItem.soldAt}
                  onChange={(e) =>
                    updateItem(editIdx, { soldAt: e.target.value })
                  }
                />
              </div>
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">À noter :</strong> le
                  bien sera marqué comme vendu et le bail clôturé. Aucune
                  quittance ne sera générée pour {monthLabel.toLowerCase()}.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("choose-type")}
              >
                Retour
              </Button>
              <Button onClick={moveToNextEditOrReview} disabled={!editingItem.soldAt}>
                {remainingAfterCurrent > 0 ? "Suivant" : "Vérifier"}
                <ChevronRight />
              </Button>
            </DialogFooter>
          </>
        ) : step === "edit-tenant" && editingItem ? (
          <>
            <DialogHeader>
              <DialogTitle>Changement de locataire</DialogTitle>
              <DialogDescription>
                {editingItem.propertyLabel} · ancien : {editingItem.tenantName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5 py-1">
              <div>
                <h4 className="mb-3 text-sm font-semibold">Nouveau locataire</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="t-name">Nom complet</Label>
                    <Input
                      id="t-name"
                      value={editingItem.newTenant.full_name}
                      onChange={(e) =>
                        updateItem(editIdx, {
                          newTenant: {
                            ...editingItem.newTenant,
                            full_name: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="t-email">Email</Label>
                    <Input
                      id="t-email"
                      type="email"
                      value={editingItem.newTenant.email}
                      onChange={(e) =>
                        updateItem(editIdx, {
                          newTenant: {
                            ...editingItem.newTenant,
                            email: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="t-phone">Téléphone</Label>
                    <Input
                      id="t-phone"
                      type="tel"
                      value={editingItem.newTenant.phone}
                      onChange={(e) =>
                        updateItem(editIdx, {
                          newTenant: {
                            ...editingItem.newTenant,
                            phone: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">Nouveau bail</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="l-rent">Loyer (€)</Label>
                    <Input
                      id="l-rent"
                      type="number"
                      step="0.01"
                      value={editingItem.newLease.rent_amount}
                      onChange={(e) =>
                        updateItem(editIdx, {
                          newLease: {
                            ...editingItem.newLease,
                            rent_amount: Number(e.target.value || 0),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="l-charges">Charges (€)</Label>
                    <Input
                      id="l-charges"
                      type="number"
                      step="0.01"
                      value={editingItem.newLease.charges_amount}
                      onChange={(e) =>
                        updateItem(editIdx, {
                          newLease: {
                            ...editingItem.newLease,
                            charges_amount: Number(e.target.value || 0),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="l-day">Jour de paiement</Label>
                    <Input
                      id="l-day"
                      type="number"
                      min={1}
                      max={31}
                      value={editingItem.newLease.payment_day}
                      onChange={(e) =>
                        updateItem(editIdx, {
                          newLease: {
                            ...editingItem.newLease,
                            payment_day: Number(e.target.value || 1),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="l-start">Début du bail</Label>
                    <Input
                      id="l-start"
                      type="date"
                      value={editingItem.newLease.start_date}
                      onChange={(e) =>
                        updateItem(editIdx, {
                          newLease: {
                            ...editingItem.newLease,
                            start_date: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              L&apos;ancien bail sera clôturé (fin {monthLabel.toLowerCase()}{" "}
              précédent) et restera consultable dans la liste.
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("choose-type")}
              >
                Retour
              </Button>
              <Button
                onClick={moveToNextEditOrReview}
                disabled={
                  !editingItem.newTenant.full_name ||
                  !editingItem.newTenant.email ||
                  !editingItem.newLease.start_date
                }
              >
                {remainingAfterCurrent > 0 ? "Suivant" : "Vérifier"}
                <ChevronRight />
              </Button>
            </DialogFooter>
          </>
        ) : step === "review" ? (
          <>
            <DialogHeader>
              <DialogTitle>Récapitulatif</DialogTitle>
              <DialogDescription>
                {items.length} quittance{items.length > 1 ? "s" : ""} prête
                {items.length > 1 ? "s" : ""} pour {monthLabel}.
              </DialogDescription>
            </DialogHeader>

            <div className="-mx-6 max-h-[50vh] overflow-y-auto border-y">
              <ul className="divide-y">
                {items.map((it) => {
                  const isTenantChange = !it.selected && it.mode === "tenant";
                  const isRentChange = !it.selected && it.mode === "rent";
                  const isPaymentDayChange =
                    !it.selected && it.mode === "payment-day";
                  const isSold = !it.selected && it.mode === "sold";
                  const tenantDisplay = isTenantChange
                    ? it.newTenant.full_name || it.tenantName
                    : it.tenantName;
                  const total = isTenantChange
                    ? Number(it.newLease.rent_amount) +
                      Number(it.newLease.charges_amount)
                    : isRentChange
                    ? Number(it.newRent) + Number(it.newCharges)
                    : Number(it.rentAmount) + Number(it.chargesAmount);
                  return (
                    <li
                      key={it.leaseId}
                      className={`flex items-center gap-3 px-6 py-3 ${
                        isSold ? "opacity-60" : ""
                      }`}
                    >
                      {isSold ? (
                        <Home className="size-4 shrink-0 text-destructive" />
                      ) : (
                        <CalendarPlus className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {it.propertyLabel}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {tenantDisplay}
                          {isRentChange && (
                            <span className="ml-2 text-primary">
                              · loyer modifié
                            </span>
                          )}
                          {isPaymentDayChange && (
                            <span className="ml-2 text-primary">
                              · jour de paiement modifié
                            </span>
                          )}
                          {isTenantChange && (
                            <span className="ml-2 text-primary">
                              · nouveau locataire
                            </span>
                          )}
                          {isSold && (
                            <span className="ml-2 text-destructive">
                              · vendu — pas de quittance
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right tabular-nums text-sm">
                        {isSold ? "—" : formatCurrency(total)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("list")}
                disabled={pending}
              >
                Retour
              </Button>
              <Button onClick={submit} disabled={pending}>
                {pending && <Loader2 className="animate-spin" />}
                <Sparkles />
                {(() => {
                  const willGenerate = items.filter(
                    (it) => it.selected || it.mode !== "sold"
                  ).length;
                  return `Générer ${willGenerate} quittance${willGenerate > 1 ? "s" : ""}`;
                })()}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
