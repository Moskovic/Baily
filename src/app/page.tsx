import Link from "next/link";
import { ArrowRight, FileText, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 force-light bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight brand-text">
            Baily
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Commencer</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklch, var(--brand-from) 35%, transparent), transparent)",
            }}
          />
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Version alpha · pour propriétaires particuliers
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
            Quittances de loyer,{" "}
            <span className="text-muted-foreground">sans friction.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Éditez une quittance en quelques secondes, envoyez-la directement
            à votre locataire depuis votre propre Gmail. C&apos;est tout.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Démarrer gratuitement
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={<FileText />}
              title="PDF propres"
              description="Une quittance mensuelle générée à partir d'un template conforme."
            />
            <FeatureCard
              icon={<Mail />}
              title="Envoi Gmail"
              description="Connectez votre boîte Gmail et envoyez sans quitter Baily."
            />
            <FeatureCard
              icon={<ShieldCheck />}
              title="Données privées"
              description="Row Level Security Supabase : vos données restent vos données."
            />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Baily
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-foreground">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
