import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 force-light bg-background text-foreground min-h-screen [&_*]:border-border">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight brand-text"
          >
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

      {children}

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Baily</span>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              CGU
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
