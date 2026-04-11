"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SendButton({
  id,
  disabled,
  variant = "icon",
}: {
  id: string;
  disabled?: boolean;
  variant?: "icon" | "primary";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onClick() {
    if (!confirm("Envoyer cette quittance au locataire ?")) return;
    start(async () => {
      try {
        const res = await fetch(`/api/receipts/${id}/send`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur");
        toast.success("Quittance envoyée");
        router.refresh();
      } catch (e) {
        toast.error("Envoi échoué", {
          description: e instanceof Error ? e.message : "Erreur inconnue",
        });
      }
    });
  }

  if (variant === "primary") {
    return (
      <Button onClick={onClick} disabled={pending || disabled}>
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        Envoyer
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending || disabled}
      title={disabled ? "Déjà envoyée" : "Envoyer par email"}
      onClick={onClick}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Send />}
    </Button>
  );
}
