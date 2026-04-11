import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row bg-muted/30 md:p-3 md:gap-3">
      <MobileNav email={user.email ?? ""} />

      <aside className="hidden w-60 shrink-0 md:flex md:flex-col rounded-2xl border bg-card shadow-sm sticky top-3 h-[calc(100vh-1.5rem)]">
        <div className="flex h-16 items-center px-5">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight brand-text"
          >
            Baily
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          <NavLink href="/dashboard" icon={<LayoutDashboard />}>
            Tableau de bord
          </NavLink>
          <NavLink href="/properties" icon={<Building2 />}>
            Biens
          </NavLink>
          <NavLink href="/tenants" icon={<Users />}>
            Locataires
          </NavLink>
          <NavLink href="/leases" icon={<FileText />}>
            Baux
          </NavLink>
          <NavLink href="/receipts" icon={<FileText />}>
            Quittances
          </NavLink>
          <NavLink href="/settings" icon={<Settings />}>
            Paramètres
          </NavLink>
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 px-2 text-xs text-muted-foreground truncate">
            {user.email}
          </div>
          <form action="/auth/signout" method="post">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start"
            >
              <LogOut />
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 md:rounded-2xl md:border bg-background md:shadow-sm overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
