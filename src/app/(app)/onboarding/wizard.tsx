"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Mail,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  type OnboardingStatus,
  saveOnboardingProfile,
  saveOnboardingProperty,
  saveOnboardingTenant,
  saveOnboardingLease,
} from "./actions";

const STEPS = [
  { key: "profile", label: "Profil", icon: User, description: "Votre nom et adresse de bailleur" },
  { key: "property", label: "Bien", icon: Building2, description: "Ajoutez votre premier bien" },
  { key: "tenant", label: "Locataire", icon: Users, description: "Ajoutez votre premier locataire" },
  { key: "lease", label: "Bail", icon: FileText, description: "Créez votre premier bail" },
  { key: "gmail", label: "Gmail", icon: Mail, description: "Connectez Gmail pour envoyer les quittances" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function OnboardingWizard({ initial }: { initial: OnboardingStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [properties, setProperties] = useState(initial.properties);
  const [tenants, setTenants] = useState(initial.tenants);

  // Find first incomplete step
  const firstIncomplete = STEPS.findIndex((s) => !status[s.key]);
  const allDone = firstIncomplete === -1;
  const [currentIdx, setCurrentIdx] = useState(allDone ? 0 : firstIncomplete);

  const step = STEPS[currentIdx];
  const completed = (key: StepKey) => status[key];

  function goNext() {
    // Find next incomplete step after current
    for (let i = currentIdx + 1; i < STEPS.length; i++) {
      if (!status[STEPS[i].key]) {
        setCurrentIdx(i);
        return;
      }
    }
    // All done!
    router.push("/dashboard");
    router.refresh();
  }

  function goToStep(idx: number) {
    setCurrentIdx(idx);
  }

  if (allDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="size-10 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Configuration terminée !</h2>
          <p className="mt-2 text-muted-foreground">
            Tout est prêt. Vous pouvez commencer à gérer vos quittances.
          </p>
        </div>
        <Button onClick={() => { router.push("/dashboard"); router.refresh(); }}>
          Aller au tableau de bord
          <ChevronRight />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Sidebar / stepper */}
      <nav className="flex gap-2 overflow-x-auto pb-2 lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {STEPS.map((s, i) => {
          const done = completed(s.key);
          const active = i === currentIdx;
          return (
            <button
              key={s.key}
              onClick={() => goToStep(i)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? "bg-primary/10 text-primary"
                  : done
                  ? "text-emerald-600 hover:bg-muted/60 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : active
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Step content */}
      <div className="flex-1 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{step.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
        </div>

        {completed(step.key) ? (
          <StepDone onNext={goNext} isLast={currentIdx === STEPS.length - 1} />
        ) : step.key === "profile" ? (
          <ProfileStep
            defaults={status.profileDefaults}
            onDone={() => {
              setStatus((s) => ({ ...s, profile: true }));
              goNext();
            }}
          />
        ) : step.key === "property" ? (
          <PropertyStep
            onDone={(p) => {
              setProperties((prev) => [p, ...prev]);
              setStatus((s) => ({ ...s, property: true }));
              goNext();
            }}
          />
        ) : step.key === "tenant" ? (
          <TenantStep
            onDone={(t) => {
              setTenants((prev) => [t, ...prev]);
              setStatus((s) => ({ ...s, tenant: true }));
              goNext();
            }}
          />
        ) : step.key === "lease" ? (
          <LeaseStep
            properties={properties}
            tenants={tenants}
            onDone={() => {
              setStatus((s) => ({ ...s, lease: true }));
              goNext();
            }}
          />
        ) : step.key === "gmail" ? (
          <GmailStep />
        ) : null}
      </div>
    </div>
  );
}

/* ── Already-done placeholder ─────────────────────────────────── */

function StepDone({ onNext, isLast }: { onNext: () => void; isLast: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
        <Check className="size-6 text-emerald-500" />
      </div>
      <p className="text-sm text-muted-foreground">Cette étape est déjà complétée.</p>
      {!isLast && (
        <Button variant="outline" onClick={onNext}>
          Étape suivante
          <ChevronRight />
        </Button>
      )}
    </div>
  );
}

/* ── Profile step ────────────────────────────────────────────── */

function ProfileStep({
  defaults,
  onDone,
}: {
  defaults: { full_name: string; address: string };
  onDone: () => void;
}) {
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      const r = await saveOnboardingProfile(formData);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Profil enregistré");
      onDone();
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <Field label="Nom complet" name="full_name" required defaultValue={defaults.full_name} placeholder="Marie Dupont" />
      <Field label="Adresse postale" name="address" defaultValue={defaults.address} placeholder="12 rue de la Paix, 75002 Paris" />
      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Continuer
          <ChevronRight />
        </Button>
      </div>
    </form>
  );
}

/* ── Property step ───────────────────────────────────────────── */

function PropertyStep({
  onDone,
}: {
  onDone: (p: { id: string; label: string }) => void;
}) {
  const [pending, start] = useTransition();
  const [type, setType] = useState<PropertyType>("apartment");

  function onSubmit(formData: FormData) {
    formData.set("type", type);
    start(async () => {
      const r = await saveOnboardingProperty(formData);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Bien créé");
      if (r.property) onDone(r.property);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <Field label="Libellé" name="label" required placeholder="Studio Montmartre" />
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
      <Field label="Adresse" name="address" required placeholder="15 rue des Abbesses" />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Field label="CP" name="postal_code" required placeholder="75018" />
        </div>
        <div className="col-span-2">
          <Field label="Ville" name="city" required placeholder="Paris" />
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Continuer
          <ChevronRight />
        </Button>
      </div>
    </form>
  );
}

/* ── Tenant step ─────────────────────────────────────────────── */

function TenantStep({
  onDone,
}: {
  onDone: (t: { id: string; full_name: string }) => void;
}) {
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      const r = await saveOnboardingTenant(formData);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Locataire créé");
      if (r.tenant) onDone(r.tenant);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <Field label="Nom complet" name="full_name" required placeholder="Jean Martin" />
      <Field label="Email" name="email" type="email" required placeholder="jean@email.com" />
      <Field label="Téléphone" name="phone" type="tel" placeholder="06 12 34 56 78" />
      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Continuer
          <ChevronRight />
        </Button>
      </div>
    </form>
  );
}

/* ── Lease step ──────────────────────────────────────────────── */

function LeaseStep({
  properties,
  tenants,
  onDone,
}: {
  properties: { id: string; label: string }[];
  tenants: { id: string; full_name: string }[];
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");

  function onSubmit(formData: FormData) {
    formData.set("property_id", propertyId);
    formData.set("tenant_id", tenantId);
    start(async () => {
      const r = await saveOnboardingLease(formData);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Bail créé");
      onDone();
    });
  }

  return (
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Loyer hors charges (€)" name="rent_amount" type="number" step="0.01" required placeholder="750" />
        <Field label="Charges (€)" name="charges_amount" type="number" step="0.01" defaultValue={0} placeholder="50" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Jour de paiement" name="payment_day" type="number" min={1} max={31} defaultValue={1} />
        <Field label="Début du bail" name="start_date" type="date" required />
      </div>
      <Field label="Fin du bail (optionnel)" name="end_date" type="date" />

      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={pending || !propertyId || !tenantId}>
          {pending && <Loader2 className="animate-spin" />}
          Continuer
          <ChevronRight />
        </Button>
      </div>
    </form>
  );
}

/* ── Gmail step ──────────────────────────────────────────────── */

function GmailStep() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Connectez votre compte Gmail pour pouvoir envoyer les quittances directement par email
        depuis Baily. Vous pouvez aussi faire cette étape plus tard dans les paramètres.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <a href="/api/gmail/connect">
            <Mail />
            Connecter Gmail
          </a>
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        >
          Plus tard
        </Button>
      </div>
    </div>
  );
}

/* ── Shared field helper ─────────────────────────────────────── */

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
