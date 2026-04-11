"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Opens the PDF in an external browser window.
 * In standalone PWA mode, window.open() opens Safari
 * instead of navigating within the PWA shell.
 */
export function OpenPdfButton({
  href,
  className,
  variant = "default",
  size = "default",
  children,
}: {
  href: string;
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "lg";
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
    >
      {children ?? (
        <>
          <Download />
          Ouvrir le PDF
        </>
      )}
    </button>
  );
}
