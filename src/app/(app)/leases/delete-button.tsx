"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLease } from "./actions";

export function DeleteLeaseButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer ce bail ? Les quittances associées seront supprimées.")) return;
        start(async () => {
          const r = await deleteLease(id);
          if (r?.error) toast.error(r.error);
          else toast.success("Supprimé");
        });
      }}
    >
      <Trash2 />
    </Button>
  );
}
