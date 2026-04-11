"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/properties", icon: Building2, label: "Biens" },
  { href: "/tenants", icon: Users, label: "Locataires" },
  { href: "/leases", icon: FileText, label: "Baux" },
  { href: "/receipts", icon: FileText, label: "Quittances" },
  { href: "/settings", icon: Settings, label: "Paramètres" },
];

export function MobileNav({ email, displayName }: { email: string; displayName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 backdrop-blur px-4 py-3 md:hidden">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight brand-text"
        >
          Baily
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-card border-l shadow-xl transform transition-transform duration-200 ease-out md:hidden flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <span className="text-lg font-semibold brand-text">Baily</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
          {links.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  "[&_svg]:size-4"
                )}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-2.5 px-1">
            <UserAvatar name={displayName} size={28} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">{email}</div>
            </div>
            <ThemeToggle />
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
      </div>
    </>
  );
}
