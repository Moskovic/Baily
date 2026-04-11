import Link from "next/link";
import {
  Building2,
  Check,
  ChevronRight,
  FileText,
  Mail,
  Rocket,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = {
  profile: boolean;
  property: boolean;
  tenant: boolean;
  lease: boolean;
  gmail: boolean;
};

const STEPS = [
  { key: "profile" as const, label: "Renseigner votre profil", icon: User },
  { key: "property" as const, label: "Ajouter un bien", icon: Building2 },
  { key: "tenant" as const, label: "Ajouter un locataire", icon: Users },
  { key: "lease" as const, label: "Créer un bail", icon: FileText },
  { key: "gmail" as const, label: "Connecter Gmail", icon: Mail },
];

export function OnboardingChecklist({ status }: { status: Status }) {
  const doneCount = STEPS.filter((s) => status[s.key]).length;
  const total = STEPS.length;
  const allDone = doneCount === total;
  const pct = Math.round((doneCount / total) * 100);

  if (allDone) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Rocket className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Bienvenue sur Baily</CardTitle>
            <CardDescription className="text-xs">
              {doneCount}/{total} étapes complétées
            </CardDescription>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-0">
        {STEPS.map((s) => {
          const done = status[s.key];
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                done ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                  done
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : (
                  <Icon className="size-3" />
                )}
              </span>
              <span className={done ? "line-through" : "font-medium"}>
                {s.label}
              </span>
            </div>
          );
        })}

        <div className="mt-3">
          <Button asChild size="sm">
            <Link href="/onboarding">
              Continuer la configuration
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
